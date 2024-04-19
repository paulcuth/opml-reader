import "./opml-state-provider.mjs";
import "./opml-layout.mjs";
import "./opml-feed-list.mjs";
import "./opml-feed-item.mjs";
import "./opml-feed-detail.mjs";
import "./opml-article-list.mjs";
import "./opml-article-item.mjs";
import "./opml-article-detail.mjs";
import "./opml-chronological-list.mjs";

import parseFeed from "./parseFeed.mjs";
import StyleMixin from "./StyleMixin";

export class OPMLReader extends StyleMixin(HTMLElement) {
  static style = `
    opml-reader {
      --opml-background-color: white;
      --opml-highlight-color: #f7f7f777;
      --opml-avatar-background-color: gainsboro;
      --opml-focus-color: black;
      --opml-link-color: blue;
      --opml-progress-color: var(--opml-focus-color);
      
      width: 100%;
      height: 100%;
      max-height: 100vh;
      overflow: hidden;
      position: relative;
      background-color: var(--opml-background-color);
    }

    opml-reader * {
      box-sizing: border-box;
    }

    opml-reader :focus {
      outline: solid 2px var(--opml-focus-color);
      border-radius: 0.05em;    
    }

    opml-reader a + a {
      margin-left: 6px;
    }

    opml-reader button.link {
      border: none;
      background-color: transparent;
      font-size: inherit;
      font-family: inherit;
      color: var(--opml-link-color);
      text-decoration: underline;
      cursor: pointer;
    }

    .opml-list-item {
      display: flex;
      gap: 0.5em;
      padding: 0.5em;
      align-items: flex-start;
    }

    .opml-list-item img {
      width: 2em;
      height: 2em;
      flex-shrink: 0;
      border-radius: 50%;
      overflow: hidden;
      object-fit: cover;
      position: relative;
    }

    .opml-list-item img:not([src]) {
      background-color: var(--opml-avatar-background-color);
    }

    .opml-list-item .info {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25em;
      align-self: center;
    }

    .opml-list-item .title {
      margin: 0;
      font-weight: bold;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .opml-list-item .description {
      margin: 0;
      color: grey;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `;

  // ----------------------------
  // LIFECYCLE

  async connectedCallback() {
    this._parseSourceUrl();
    this._initSettings();
    this._initUI();
    await this._fetchSource();
    await this._fetchFeeds();
  }

  // ----------------------------
  // METHODS

  _parseSourceUrl() {
    const link = this.querySelector('a[type="text/x-opml"]');
    const url = link?.href;

    if (url == null) {
      throw new ReferenceError(
        'OPML source URL not found. Make sure <opml-reader> contains a link to an OPML file with attribute type="text/x-opml".'
      );
    }

    this.opmlSourceUrl = url;
  }

  _initSettings() {
    const fetch = async (url, options) => {
      let requestUrl = url;
      let content;

      const proxyUrl = this.getAttribute("proxy-url");
      if (proxyUrl != null) {
        requestUrl = proxyUrl.replace("${url}", encodeURIComponent(url));
      }
      const response = await window.fetch(requestUrl, options);
      const isJSON = /^application\/json\b/.test(
        response.headers.get("content-type")
      );
      if (isJSON) {
        const json = await response.json();
        if (json.error != null) {
          throw new Error(json.error);
        }
        content = json?.content;
      } else {
        content = await response.text();
      }

      const text = () => Promise.resolve(content);
      return { text };
    };

    this._settings = {
      fetch,
      layoutElement: this.getAttribute("layout-element") ?? "opml-layout",
      feedListElement:
        this.getAttribute("feed-list-element") ?? "opml-feed-list",
      feedItemElement:
        this.getAttribute("feed-item-element") ?? "opml-feed-item",
      chronologicalListElement:
        this.getAttribute("chronological-list-element") ??
        "opml-chronological-list",
      articleListElement:
        this.getAttribute("article-list-element") ?? "opml-article-list",
      articleItemElement:
        this.getAttribute("article-item-element") ?? "opml-article-item",
      feedDetailElement:
        this.getAttribute("feed-detail-element") ?? "opml-feed-detail",
      articleDetailElement:
        this.getAttribute("article-detail-element") ?? "opml-article-detail",
    };
  }

  _initUI() {
    const view = this.getAttribute("view-by") ?? "feed";

    this.innerHTML = "";
    this.insertAdjacentHTML("beforeend", "<opml-state-provider />");

    this._stateProvider = this.querySelector("opml-state-provider");
    this._stateProvider.update("settings", this._settings);
    this._stateProvider.update("viewBy", view);
    this._stateProvider.insertAdjacentHTML(
      "beforeend",
      `<opml-local-storage /><${this._settings.layoutElement} />`
    );
  }

  async _fetchSource() {
    const url = new URL(this.opmlSourceUrl);
    const isSameOrigin = url.origin === document.location.origin;
    const fetch = isSameOrigin ? window.fetch : this._settings.fetch;

    const response = await fetch(this.opmlSourceUrl);
    const xml = await response.text();

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, "application/xml");

    const sourceMetadata = {
      title: xmlDoc.querySelector("head title")?.textContent,
      dateCreated: xmlDoc.querySelector("head dateCreated")?.textContent,
      url: this.opmlSourceUrl,
    };
    this._stateProvider.update("sourceMetadata", sourceMetadata);

    const outlines = xmlDoc.querySelectorAll("body outline[type=rss]");
    this._feeds = [...outlines].map((outline) => ({
      title: outline.getAttribute("text") ?? "Untitled feed",
      description: outline.getAttribute("description") ?? "",
      url: outline.getAttribute("xmlUrl"),
      linkUrl: outline.getAttribute("htmlUrl"),
      language: outline.getAttribute("language"),
    }));

    this._feeds.forEach((feed) => {
      this._stateProvider.update(`feedsByUrl/${feed.url}`, feed);
    });

    const feedUrls = this._feeds.map((f) => f.url);
    this._stateProvider.update("feedUrls", feedUrls);
  }

  async _fetchFeeds() {
    const total = this._feeds.length;
    let loaded = 0;

    this._feeds.forEach(async (feed) => {
      await this._fetchFeed(feed);
      loaded = loaded + 1;
      this._stateProvider.update("loadedPercent", (loaded * 100) / total);
    });
  }

  async _fetchFeed(feed) {
    const { fetch } = this._settings;
    try {
      const response = await fetch(feed.url);
      const xml = await response.text();
      const enrichedFeed = parseFeed(xml, feed.url);

      Object.assign(feed, enrichedFeed);
      this._stateProvider.update(`feedsByUrl/${feed.url}`, feed);
    } catch (e) {
      feed.fetchError = e;
    }
  }
}

customElements.define("opml-reader", OPMLReader);
