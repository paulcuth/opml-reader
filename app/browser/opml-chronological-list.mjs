import StyleMixin from "./StyleMixin";
import BindEventHandlersMixin from "./BindEventHandlersMixin";
import StateMixin from "./StateMixin";
import formatDate from "./formatDate.mjs";

const DAY = 1000 * 60 * 60 * 24; // ms

export class OPMLChronologicalList extends StyleMixin(
  StateMixin(BindEventHandlersMixin(HTMLElement))
) {
  static style = `
    opml-chronological-list header {
      margin: 0 1em;
    }

    opml-chronological-list ul {
      margin: 0;
      padding: 0;
      list-style: none;
    }

    opml-chronological-list li {
      border-radius: 0.25em;
    }

    opml-chronological-list li:has(:focus) {
      box-shadow: inset 0 0 0 2px var(--opml-focus-color);
    }

    opml-chronological-list .opml-chronological-list-item {
      position: relative;
    }

    opml-chronological-list .opml-chronological-list-item > input[type=radio] {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      cursor: pointer;
    }

    opml-chronological-list .opml-chronological-list-item:has(input[type=radio]:checked) {
      background-color: var(--opml-highlight-color);
    }
  `;

  static observedStateKeys = ["settings", "feedUrls", "sourceMetadata"];

  // ----------------------------
  // LIFECYCLE

  constructor() {
    super();
    this._feedUrls = [];
    this._articlesById = {};
    this._orderedArticleIds = [];
    this._feedUrlsByArticleId = {};
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener("input", this.onArticleSelect);
    this.render();
  }

  disconnectedCallback() {
    this.removeEventListener("input", this.onArticleSelect);
    this._removeStateListeners(this._getFeedChangeListeners());
  }

  // ----------------------------
  // METHODS

  _getFeedChangeListeners() {
    return this._feedUrls.reduce(
      (result, url) => ({
        ...result,
        [`feedsByUrl/${url}`]: this.onFeedChange,
      }),
      {}
    );
  }

  _scheduleRender() {
    if (this._renderScheduled) {
      return;
    }
    this._renderScheduled = true;
    window.requestAnimationFrame(() => {
      this._orderedArticleIds = Object.keys(this._articlesById).sort(
        (id1, id2) =>
          new Date(this._articlesById[id2].updated) -
          new Date(this._articlesById[id1].updated)
      );

      this._renderItems();
      this._renderScheduled = false;
    });
  }

  // ----------------------------
  // EVENT HANDLERS

  onSettingsChange(settings) {
    this._settings = settings;
  }

  onSourceMetadataChange(metadata) {
    this._sourceMetadata = metadata;
    this._renderHeader();
  }

  onFeedUrlsChange(feedUrls) {
    this._removeStateListeners(this._getFeedChangeListeners());
    this._feedUrls = feedUrls ?? [];
    this._addStateListeners(this._getFeedChangeListeners());
  }

  onFeedChange(feed) {
    const now = new Date();
    const articles =
      feed.articles?.filter(
        (a) =>
          now - new Date(a.updated) < 90 * DAY &&
          new Date(a.updated) - now < DAY
      ) ?? [];

    articles.forEach((article) => {
      this._articlesById[article.id] = article;
      this._feedUrlsByArticleId[article.id] = feed.url;
    });

    this._scheduleRender();
  }

  onArticleSelect() {
    const articleId = this._form["selected-article-id"].value;
    const feedUrl = this._feedUrlsByArticleId[articleId];
    this._updateState("selectedFeedUrl", feedUrl);
    this._updateState("selectedArticleId", articleId);
  }

  onViewByFeedClick() {
    this._updateState("selectedArticleId", null);
    this._updateState("viewBy", "feed");
  }

  // ----------------------------
  // RENDER

  render() {
    const { title, dateCreated, url } = this._sourceMetadata ?? {};
    this.innerHTML = `
      <header></header>
      <form><ul></ul></form>
    `;
    this._header = this.querySelector("header");
    this._form = this.querySelector("form");
    this._list = this.querySelector("ul");
  }

  _renderHeader() {
    const { title, dateCreated, url } = this._sourceMetadata ?? {};

    const timestamp =
      dateCreated == null
        ? ""
        : `<time datetime="${dateCreated}">${formatDate(dateCreated)}</time>`;

    this._header.innerHTML = `
      <h2>${title ?? ""}</h2>
      <p>
        ${timestamp}
        <a href="${url}">Open OPML file</a> <button class="link">View by feed</button>
      </p>
    `;

    this._viewByFeed = this.querySelector("button");
    this._viewByFeed.addEventListener("click", this.onViewByFeedClick);
  }

  _renderItems() {
    this._orderedArticleIds.slice(0, 100).forEach((articleId, index) => {
      const existingItem = this._list.children[index];
      const existingId = existingItem?.firstElementChild.value;

      if (articleId === existingId) {
        return;
      }

      const selectedArticleUrl = this._form["selected-article-id"]?.value;
      const isSelected = articleId === selectedArticleUrl;
      const checked = isSelected ? "checked" : "";

      const { articleItemElement } = this._settings;
      const id = `opml-chronological-list-item-${articleId}`;
      const feedUrl = this._feedUrlsByArticleId[articleId];

      const html = `
        <li class="opml-chronological-list-item">
          <input 
            type="radio" 
            name="selected-article-id" 
            value="${articleId}" 
            aria-labelledby="${id}"
            ${checked}
          >
          <${articleItemElement} id="${id}"
            feed-url="${feedUrl}"
            article-id="${articleId}"
            show-feed-title
          ></${articleItemElement}>
        </li>
      `;

      if (existingItem == null) {
        this._list.insertAdjacentHTML("beforeEnd", html);
      } else {
        existingItem.insertAdjacentHTML("beforeBegin", html);
      }
    });
  }
}

customElements.define("opml-chronological-list", OPMLChronologicalList);
