/* =========================================================
   CLOTH X CLUB — BLOG.JS
   Blog listing + article rendering
   ========================================================= */

(() => {
  "use strict";

  /* =========================================================
     CONFIG
  ========================================================= */

  const BLOG_CONFIG = {
    postsPaths: [
      "Layout/data/posts.json",
      "data/posts.json",
      "./Layout/data/posts.json",
      "./data/posts.json"
    ],

    postsPerPage: 6,

    selectors: {
      blogGrid: "[data-blog-grid], #blog-grid, .blog-grid",
      featured: "[data-featured-post], #featured-post, .featured-post",
      search: "[data-blog-search], #blog-search",
      category: "[data-blog-category], #blog-category",
      loadMore: "[data-load-more], #load-more",
      article: "[data-article-content], #article-content",
      articleTitle: "[data-article-title], #article-title",
      articleImage: "[data-article-image], #article-image",
      articleMeta: "[data-article-meta], #article-meta",
      related: "[data-related-posts], #related-posts"
    }
  };


  /* =========================================================
     HELPERS
  ========================================================= */

  const $ = (selector, parent = document) =>
    parent.querySelector(selector);

  const $$ = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];

  const escapeHTML = (value = "") =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const slugify = (value = "") =>
    String(value)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const formatDate = (date) => {
    if (!date) return "";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) return String(date);

    return parsed.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const readingTime = (content = "") => {
    const words = String(content)
      .replace(/<[^>]*>/g, "")
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;

    return Math.max(1, Math.ceil(words / 200));
  };


  /* =========================================================
     DATA LOADER
  ========================================================= */

  async function loadPosts() {
    for (const path of BLOG_CONFIG.postsPaths) {
      try {
        const response = await fetch(path);

        if (!response.ok) continue;

        const data = await response.json();

        const posts = Array.isArray(data)
          ? data
          : data.posts || data.articles || [];

        if (Array.isArray(posts)) {
          return posts.map(normalizePost);
        }

      } catch (error) {
        console.warn("Blog data path failed:", path);
      }
    }

    console.error("CLOTH X CLUB: Unable to load blog posts.");

    return [];
  }


  /* =========================================================
     NORMALIZE POSTS
     Supports multiple JSON field naming conventions
  ========================================================= */

  function normalizePost(post = {}) {
    const title =
      post.title ||
      post.name ||
      post.heading ||
      "Untitled Article";

    const slug =
      post.slug ||
      post.urlSlug ||
      post.id ||
      slugify(title);

    const content =
      post.content ||
      post.body ||
      post.article ||
      post.description ||
      "";

    return {
      ...post,

      id: post.id || slug,

      title,

      slug,

      category:
        post.category ||
        post.tag ||
        post.type ||
        "Fashion",

      excerpt:
        post.excerpt ||
        post.summary ||
        post.shortDescription ||
        post.description ||
        "",

      content,

      image:
        post.image ||
        post.cover ||
        post.thumbnail ||
        post.featuredImage ||
        "",

      author:
        post.author ||
        post.writer ||
        "CLOTH X CLUB",

      date:
        post.date ||
        post.publishedAt ||
        post.createdAt ||
        "",

      featured:
        post.featured === true ||
        post.isFeatured === true,

      published:
        post.published !== false &&
        post.status !== "draft"
    };
  }


  /* =========================================================
     POST URL
  ========================================================= */

  function getPostURL(post) {
    return `article.html?slug=${encodeURIComponent(post.slug)}`;
  }


  /* =========================================================
     IMAGE FALLBACK
  ========================================================= */

  function getImageHTML(image, alt, className = "") {
    if (!image) {
      return `
        <div class="blog-image-placeholder ${className}">
          <span>CLOTH X CLUB</span>
        </div>
      `;
    }

    return `
      <img
        class="${className}"
        src="${escapeHTML(image)}"
        alt="${escapeHTML(alt)}"
        loading="lazy"
        onerror="this.style.display='none'"
      >
    `;
  }


  /* =========================================================
     BLOG CARD
  ========================================================= */

  function createBlogCard(post) {
    const title = escapeHTML(post.title);
    const category = escapeHTML(post.category);
    const excerpt = escapeHTML(post.excerpt);
    const image = getImageHTML(post.image, post.title);

    return `
      <article class="blog-card" data-post-slug="${escapeHTML(post.slug)}">

        <a
          class="blog-card-image"
          href="${getPostURL(post)}"
          aria-label="Read ${title}"
        >
          ${image}

          <span class="blog-category">
            ${category}
          </span>
        </a>

        <div class="blog-card-content">

          <div class="blog-meta">
            ${post.date ? `<span>${formatDate(post.date)}</span>` : ""}
            <span>${readingTime(post.content)} min read</span>
          </div>

          <h3 class="blog-card-title">
            <a href="${getPostURL(post)}">
              ${title}
            </a>
          </h3>

          ${excerpt ? `
            <p class="blog-card-excerpt">
              ${excerpt}
            </p>
          ` : ""}

          <a
            class="blog-read-more"
            href="${getPostURL(post)}"
          >
            Read Article →
          </a>

        </div>

      </article>
    `;
  }


  /* =========================================================
     FEATURED POST
  ========================================================= */

  function renderFeaturedPost(post, container) {
    if (!post || !container) return;

    container.innerHTML = `
      <article class="featured-blog">

        <a
          href="${getPostURL(post)}"
          class="featured-blog-image"
        >
          ${getImageHTML(post.image, post.title)}
        </a>

        <div class="featured-blog-content">

          <span class="featured-label">
            FEATURED ARTICLE
          </span>

          <span class="blog-category">
            ${escapeHTML(post.category)}
          </span>

          <h2>
            <a href="${getPostURL(post)}">
              ${escapeHTML(post.title)}
            </a>
          </h2>

          <p>
            ${escapeHTML(post.excerpt)}
          </p>

          <div class="blog-meta">
            ${post.date ? `<span>${formatDate(post.date)}</span>` : ""}
            <span>${readingTime(post.content)} min read</span>
          </div>

          <a
            class="btn btn-primary"
            href="${getPostURL(post)}"
          >
            Read Story
          </a>

        </div>

      </article>
    `;
  }


  /* =========================================================
     BLOG LISTING
  ========================================================= */

  class BlogListing {
    constructor(posts) {
      this.posts = posts.filter(post => post.published);

      this.filteredPosts = [...this.posts];

      this.currentPage = 1;

      this.grid = $(BLOG_CONFIG.selectors.blogGrid);

      this.searchInput = $(BLOG_CONFIG.selectors.search);

      this.categorySelect = $(BLOG_CONFIG.selectors.category);

      this.loadMoreButton = $(BLOG_CONFIG.selectors.loadMore);

      this.featuredContainer = $(
        BLOG_CONFIG.selectors.featured
      );

      this.init();
    }


    init() {
      if (!this.grid) return;

      this.renderFeatured();

      this.renderCategories();

      this.bindSearch();

      this.bindCategory();

      this.bindLoadMore();

      this.render();
    }


    renderFeatured() {
      if (!this.featuredContainer) return;

      const featuredPost =
        this.posts.find(post => post.featured) ||
        this.posts[0];

      renderFeaturedPost(
        featuredPost,
        this.featuredContainer
      );
    }


    renderCategories() {
      if (!this.categorySelect) return;

      const categories = [
        ...new Set(
          this.posts
            .map(post => post.category)
            .filter(Boolean)
        )
      ];

      const existingDefault =
        this.categorySelect.querySelector("option");

      const defaultLabel = existingDefault
        ? existingDefault.textContent
        : "All Categories";

      this.categorySelect.innerHTML = `
        <option value="">${escapeHTML(defaultLabel)}</option>

        ${categories.map(category => `
          <option value="${escapeHTML(category)}">
            ${escapeHTML(category)}
          </option>
        `).join("")}
      `;
    }


    bindSearch() {
      if (!this.searchInput) return;

      this.searchInput.addEventListener("input", () => {
        this.applyFilters();
      });
    }


    bindCategory() {
      if (!this.categorySelect) return;

      this.categorySelect.addEventListener("change", () => {
        this.applyFilters();
      });
    }


    bindLoadMore() {
      if (!this.loadMoreButton) return;

      this.loadMoreButton.addEventListener("click", () => {
        this.currentPage++;
        this.render();
      });
    }


    applyFilters() {
      const searchTerm = this.searchInput
        ? this.searchInput.value.toLowerCase().trim()
        : "";

      const category = this.categorySelect
        ? this.categorySelect.value
        : "";

      this.filteredPosts = this.posts.filter(post => {

        const searchable = [
          post.title,
          post.excerpt,
          post.content,
          post.category
        ]
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          !searchTerm ||
          searchable.includes(searchTerm);

        const matchesCategory =
          !category ||
          post.category === category;

        return matchesSearch && matchesCategory;
      });

      this.currentPage = 1;

      this.render();
    }


    render() {
      const limit =
        this.currentPage * BLOG_CONFIG.postsPerPage;

      const visiblePosts =
        this.filteredPosts.slice(0, limit);

      if (visiblePosts.length === 0) {
        this.grid.innerHTML = `
          <div class="blog-empty">
            <h3>No articles found</h3>
            <p>Try another search or category.</p>
          </div>
        `;
      } else {
        this.grid.innerHTML = visiblePosts
          .map(createBlogCard)
          .join("");
      }

      this.updateLoadMore();
    }


    updateLoadMore() {
      if (!this.loadMoreButton) return;

      const hasMore =
        this.currentPage * BLOG_CONFIG.postsPerPage <
        this.filteredPosts.length;

      this.loadMoreButton.style.display =
        hasMore ? "" : "none";
    }
  }


  /* =========================================================
     ARTICLE PAGE
  ========================================================= */

  class BlogArticle {
    constructor(posts) {
      this.posts = posts.filter(post => post.published);

      this.container = $(BLOG_CONFIG.selectors.article);

      this.titleElement = $(
        BLOG_CONFIG.selectors.articleTitle
      );

      this.imageElement = $(
        BLOG_CONFIG.selectors.articleImage
      );

      this.metaElement = $(
        BLOG_CONFIG.selectors.articleMeta
      );

      this.relatedContainer = $(
        BLOG_CONFIG.selectors.related
      );

      this.init();
    }


    init() {
      const slug = this.getCurrentSlug();

      const post = this.posts.find(item =>
        item.slug === slug ||
        String(item.id) === slug
      );

      if (!post) {
        this.renderNotFound();
        return;
      }

      this.renderArticle(post);

      this.renderRelated(post);

      this.updateSEO(post);
    }


    getCurrentSlug() {
      const params = new URLSearchParams(window.location.search);

      return (
        params.get("slug") ||
        params.get("id") ||
        ""
      );
    }


    renderArticle(post) {
      if (this.container) {
        this.container.innerHTML = this.formatContent(post.content);
      }

      if (this.titleElement) {
        this.titleElement.textContent = post.title;
      }

      if (this.imageElement) {
        this.imageElement.src = post.image || "";
        this.imageElement.alt = post.title;

        if (!post.image) {
          this.imageElement.style.display = "none";
        }
      }

      if (this.metaElement) {
        this.metaElement.innerHTML = `
          <span>${escapeHTML(post.category)}</span>
          ${post.date ? `<span>${formatDate(post.date)}</span>` : ""}
          <span>${readingTime(post.content)} min read</span>
          <span>By ${escapeHTML(post.author)}</span>
        `;
      }

      /* Update page title */
      document.title = `${post.title} | CLOTH X CLUB`;
    }


    formatContent(content) {
      if (!content) return "";

      /*
        If content contains HTML, render it as HTML.
        If content is plain text, convert line breaks to paragraphs.
      */

      const text = String(content);

      const containsHTML = /<\/?[a-z][\s\S]*?>/i.test(text);

      if (containsHTML) {
        return text;
      }

      return text
        .split(/\n\s*\n/)
        .map(paragraph => paragraph.trim())
        .filter(Boolean)
        .map(paragraph => `
          <p>${escapeHTML(paragraph).replace(/\n/g, "<br>")}</p>
        `)
        .join("");
    }


    renderRelated(currentPost) {
      if (!this.relatedContainer) return;

      const relatedPosts = this.posts
        .filter(post => post.slug !== currentPost.slug)
        .filter(post =>
          post.category === currentPost.category
        )
        .slice(0, 3);

      if (relatedPosts.length === 0) {
        return;
      }

      this.relatedContainer.innerHTML = `
        <div class="related-blog-grid">
          ${relatedPosts.map(createBlogCard).join("")}
        </div>
      `;
    }


    updateSEO(post) {
      const description = post.excerpt || post.title;

      let descriptionTag = $('meta[name="description"]');

      if (!descriptionTag) {
        descriptionTag = document.createElement("meta");
        descriptionTag.name = "description";
        document.head.appendChild(descriptionTag);
      }

      descriptionTag.content = description;

      let canonical = $('link[rel="canonical"]');

      if (!canonical) {
        canonical = document.createElement("link");
        canonical.rel = "canonical";
        document.head.appendChild(canonical);
      }

      canonical.href = window.location.href;
    }


    renderNotFound() {
      if (this.container) {
        this.container.innerHTML = `
          <div class="article-not-found">
            <h2>Article not found</h2>
            <p>The article you're looking for may have been moved.</p>
            <a href="blog.html" class="btn btn-primary">
              Back to Blog
            </a>
          </div>
        `;
      }

      document.title = "Article Not Found | CLOTH X CLUB";
    }
  }


  /* =========================================================
     AUTO INITIALIZATION
  ========================================================= */

  async function initBlog() {
    const posts = await loadPosts();

    if (!posts.length) {
      console.warn("No blog posts available.");
      return;
    }

    /* Blog listing */
    if ($(BLOG_CONFIG.selectors.blogGrid)) {
      window.CXBlogListing = new BlogListing(posts);
    }

    /* Article page */
    if (
      $(BLOG_CONFIG.selectors.article) ||
      $(BLOG_CONFIG.selectors.articleTitle)
    ) {
      window.CXBlogArticle = new BlogArticle(posts);
    }

    console.log("CLOTH X CLUB blog initialized.");
  }


  /* =========================================================
     GLOBAL BLOG API
  ========================================================= */

  window.CXBlog = {
    config: BLOG_CONFIG,

    loadPosts,

    createBlogCard,

    getPostURL,

    formatDate,

    readingTime,

    slugify
  };


  /* =========================================================
     START
  ========================================================= */

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initBlog);
  } else {
    initBlog();
  }

})();
