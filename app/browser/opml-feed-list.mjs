import StyleMixin from "./StyleMixin";
import BindEventHandlersMixin from "./BindEventHandlersMixin";
import StateMixin from "./StateMixin";
import formatDate from "./formatDate.mjs";

export class OPMLFeedList extends StyleMixin(
  StateMixin(BindEventHandlersMixin(HTMLElement))
) {
  static style = `
    opml-feed-list ul {
      margin: 0;
      padding: 0;
      list-style: none;
    }

    opml-feed-list li {
      border-radius: 0.25em;
    }

    opml-feed-list li:has(:focus) {
      box-shadow: inset 0 0 0 2px var(--opml-focus-color);
    }

    opml-feed-list .opml-feed-list-item {
      position: relative;
    }

    opml-feed-list .opml-feed-list-item > input[type=radio] {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      cursor: pointer;
      border: 1px solid red;
    }

    opml-feed-list .opml-feed-list-item:has(input[type=radio]:checked) {
      background-color: var(--opml-highlight-color);
    }

    opml-feed-list header {
      margin: 0 1em;
    }

    opml-feed-list > header time::after {
      content: ',';
    }
  `;

  static observedStateKeys = [
    "settings",
    "sourceMetadata",
    "feedUrls",
    "selectedFeedUrl",
  ];

  // ----------------------------
  // LIFECYCLE

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener("input", this.onFeedSelect);
    this.render();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("input", this.onFeedSelect);
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
    this._feedUrls = feedUrls ?? [];
    this._renderItems();
  }

  onFeedSelect() {
    const feedUrl = this._form["selected-feed-url"].value;
    this._updateState("selectedFeedUrl", feedUrl);
  }

  onSelectedFeedUrlChange(feedUrl) {
    if (feedUrl == null) {
      this._form.reset();
    }
  }

  onViewByArticleClick() {
    this._updateState("selectedFeedUrl", null);
    this._updateState("viewBy", "article");
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
    this._viewByArticle?.removeEventListener(
      "click",
      this.onViewByArticleClick
    );

    const { title, dateCreated, url } = this._sourceMetadata ?? {};
    const timestamp =
      dateCreated == null
        ? ""
        : `<time datetime="${dateCreated}">${formatDate(dateCreated)}</time>`;

    this._header.innerHTML = `
      <h2>${title ?? ""}</h2>
      <p>
        ${timestamp}
        <a href="${url}">Open OPML file</a> <button class="link">View by article</button>
      </p>
    `;
    this._viewByArticle = this.querySelector("button");
    this._viewByArticle.addEventListener("click", this.onViewByArticleClick);
  }

  _renderItems() {
    const items = this._feedUrls.map((url) => this._renderFeedItem(url));
    this._list.innerHTML = items.join("");
  }

  _renderFeedItem(feedUrl) {
    const selectedFeedUrl = this._form["selected-feed-url"]?.value;
    const isSelected = feedUrl === selectedFeedUrl;
    const checked = isSelected ? "checked" : "";

    const { feedItemElement } = this._settings;
    const id = `opml-feed-list-item-${feedUrl}`;

    return `
      <li class="opml-feed-list-item">
        <input 
          type="radio" 
          name="selected-feed-url" 
          value="${feedUrl}" 
          aria-labelledby="${id}"
          ${checked}
        >
        <${feedItemElement} id="${id}"
          feed-url="${feedUrl}"
        ></${feedItemElement}>
      </li>
    `;
  }
}

customElements.define("opml-feed-list", OPMLFeedList);
