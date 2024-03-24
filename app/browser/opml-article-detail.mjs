import StyleMixin from "./StyleMixin";
import BindEventHandlersMixin from "./BindEventHandlersMixin";
import StateMixin from "./StateMixin";
import formatDate from "./formatDate.mjs";
import sanitiseHtml from "./sanitiseHtml.mjs";

export class OPMLArticleDetail extends StyleMixin(
  StateMixin(BindEventHandlersMixin(HTMLElement))
) {
  static style = `
    opml-article-detail article {
      padding: 0 1em 1em;
    }

    opml-article-detail > article img,
    opml-article-detail > article video {
        max-width: 100%;
      height: auto;
    }
  `;

  static observedStateKeys = ["selectedFeedUrl", "selectedArticleId"];

  // ----------------------------
  // LIFECYCLE

  constructor() {
    super();

    this._selectedFeedUrl = null;
    this._selectedArticleId = null;
    this._selectedFeed = null;
    this._article = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this.render();
  }

  // ----------------------------
  // EVENT HANDLERS

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

  onSelectedArticleIdChange(id) {
    this._selectedArticleId = id;
    this.render();
  }

  onBackButtonClick() {
    this._updateState("selectedArticleId", null);
  }

  onFeedButtonClick() {
    const feedUrl = this._selectedFeed.url;
    this._updateState("selectedArticleId", null);
    this._updateState("selectedFeedUrl", feedUrl);
    this._updateState("viewBy", "feed");
  }

  // ----------------------------
  // RENDER

  render() {
    this._backButton?.removeEventListener("click", this.onBackButtonClick);
    this._feedButton?.removeEventListener("click", this.onFeedButtonClick);

    const article = this._selectedFeed?.articles?.find(
      (a) => a.id === this._selectedArticleId
    );

    if (article == null) {
      this.innerHTML = "";
      return;
    }

    const { title, updated, html, linkUrl } = article;
    const sanitisedHtml = sanitiseHtml(html, linkUrl);

    this.innerHTML = `
      <nav class="back">
        <button class="back link">Back</button>
      </nav>
      <article>
        <header>
          <h2>${title}</h2>
          <p>
            <time datetime="${updated}">${formatDate(updated)}</time>, ${
      this._selectedFeed.title
    }
            </p>
            <p>
            <a href="${linkUrl}">Open article</a>
            <button class="feed link">View feed</button>
          </p>
        </header>
        <div>${sanitisedHtml}</div>
      </article>
    `;

    this._backButton = this.querySelector("button.back");
    this._backButton.addEventListener("click", this.onBackButtonClick);
    this._feedButton = this.querySelector("button.feed");
    this._feedButton.addEventListener("click", this.onFeedButtonClick);

    this.scrollTop = 0;
  }
}

customElements.define("opml-article-detail", OPMLArticleDetail);
