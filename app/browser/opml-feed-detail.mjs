import StyleMixin from "./StyleMixin";
import BindEventHandlersMixin from "./BindEventHandlersMixin";
import StateMixin from "./StateMixin";

export class OPMLFeedDetail extends StyleMixin(
  StateMixin(BindEventHandlersMixin(HTMLElement))
) {
  static style = `
    opml-feed-detail header {
      margin: 0 1em;
    }
  `;

  static observedStateKeys = ["settings", "selectedFeedUrl"];

  // ----------------------------
  // LIFECYCLE

  constructor() {
    super();

    this._settings = null;
    this._selectedFeedUrl = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this.render();
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
    this.render();
  }

  onBackButtonClick() {
    this._updateState("selectedFeedUrl", null);
    this._updateState("selectedArticleId", null);
  }

  // ----------------------------
  // RENDER

  render() {
    this._backButton?.removeEventListener("click", this.onBackButtonClick);

    if (this._selectedFeed == null) {
      this.innerHTML = "";
      return;
    }

    const { title, url, linkUrl, fetchError } = this._selectedFeed;
    const error =
      fetchError == null ? "" : `<p>Error: ${fetchError.message}</p>`;

    const { articleListElement } = this._settings;
    this.innerHTML = `
      <nav class="back">
        <button class="link">Back</button>
      </nav>
      <header>
        <h2>${title}</h2>
        <p>
          <a href="${linkUrl}">Open website</a> <a href="${url}">Open feed</a>
        </p>
        ${error}
      </header>
      <${articleListElement}></${articleListElement}>
    `;

    this._backButton = this.querySelector("button");
    this._backButton.addEventListener("click", this.onBackButtonClick);
  }
}

customElements.define("opml-feed-detail", OPMLFeedDetail);
