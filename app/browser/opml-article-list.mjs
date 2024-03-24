import StyleMixin from "./StyleMixin";
import BindEventHandlersMixin from "./BindEventHandlersMixin";
import StateMixin from "./StateMixin";

export class OPMLArticleList extends StyleMixin(
  StateMixin(BindEventHandlersMixin(HTMLElement))
) {
  static style = `
    opml-article-list ul {
      margin: 0;
      padding: 0;
      list-style: none;
    }

    opml-article-list li {
      border-radius: 0.25em;
    }

    opml-article-list li:has(:focus) {
      box-shadow: inset 0 0 0 2px var(--opml-focus-color);
    }

    opml-article-list .opml-article-list-item {
      position: relative;
    }

    opml-article-list .opml-article-list-item > input[type=radio] {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      cursor: pointer;
    }

    opml-article-list .opml-article-list-item:has(input[type=radio]:checked) {
      background-color: var(--opml-highlight-color);
    }
  `;

  static observedStateKeys = [
    "settings",
    "selectedFeedUrl",
    "selectedArticleId",
  ];

  // ----------------------------
  // LIFECYCLE

  constructor() {
    super();
    this._selectedFeedUrl = null;
    this._selectedFeed = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener("input", this.onArticleSelect);
    this.render();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("input", this.onArticleSelect);
  }

  // ----------------------------
  // EVENT HANDLERS

  onSettingsChange(settings) {
    this._settings = settings;
  }

  onSelectedFeedUrlChange(url) {
    if (this._selectedFeedUrl != null) {
      this._removeStateListeners({
        [`feedsByUrl/${this._selectedFeedUrl}`]: this.onSelectedFeedChange,
      });
    }

    this._selectedFeedUrl = url;
    this._addStateListeners({
      [`feedsByUrl/${this._selectedFeedUrl}`]: this.onSelectedFeedChange,
    });
  }

  onSelectedFeedChange(feed) {
    this._selectedFeed = feed;
    this._renderItems();
  }

  onArticleSelect() {
    const articleId = this._form["selected-article-id"].value;
    this._updateState("selectedArticleId", articleId);
  }

  onSelectedArticleIdChange(id) {
    if (id == null) {
      this._form.reset();
    }
  }

  // ----------------------------
  // RENDER

  render() {
    this.innerHTML = `
      <form><ul></ul></form>
    `;
    this._form = this.querySelector("form");
    this._list = this.querySelector("ul");
  }

  _renderItems() {
    const articles = this._selectedFeed?.articles ?? [];
    const items = articles.map((a) => this._renderArticleItem(a));
    this._list.innerHTML = items.join("");
  }

  _renderArticleItem(article) {
    const selectedArticleUrl = this._form["selected-article-id"]?.value;
    const isSelected = article.id === selectedArticleUrl;
    const checked = isSelected ? "checked" : "";

    const { articleItemElement } = this._settings;
    const id = `opml-article-list-item-${article.id}`;

    return `
      <li class="opml-article-list-item">
        <input 
          type="radio" 
          name="selected-article-id" 
          value="${article.id}" 
          aria-labelledby="${id}"
          ${checked}
        >
        <${articleItemElement} id="${id}"
          feed-url="${this._selectedFeedUrl}"
          article-id="${article.id}"
        ></${articleItemElement}>
      </li>
    `;
  }
}

customElements.define("opml-article-list", OPMLArticleList);
