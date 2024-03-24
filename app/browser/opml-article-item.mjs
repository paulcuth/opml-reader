import StyleMixin from "./StyleMixin";
import BindEventHandlersMixin from "./BindEventHandlersMixin";
import StateMixin from "./StateMixin";
import formatDate from "./formatDate.mjs";

export class OPMLArticleItem extends StyleMixin(
  StateMixin(BindEventHandlersMixin(HTMLElement))
) {
  static style = `
    opml-article-item.opml-list-item img {
      border-radius: 0.25em;
    }
  `;

  // ----------------------------
  // LIFECYCLE

  constructor() {
    super();
    this.classList.add("opml-list-item");

    this._feedUrl = this.getAttribute("feed-url");
    this._feed = null;
    this._articleId = this.getAttribute("article-id");
    this._article = null;

    // this.render();
  }

  connectedCallback() {
    this._addStateListeners({
      [`feedsByUrl/${this._feedUrl}`]: this.onFeedChange,
    });
  }

  disconnectedCallback() {
    this._removeStateListeners({
      [`feedsByUrl/${this._feedUrl}`]: this.onFeedChange,
    });
  }

  // ----------------------------
  // EVENT LISTENERS

  onFeedChange(feed) {
    this._feed = feed;
    this._article = feed?.articles?.find((a) => a.id === this._articleId);
    this.render();
  }

  // ----------------------------
  // RENDER

  render() {
    const { title, updated, linkUrl, html } = this._article ?? {};

    const div = document.createElement("div");
    div.innerHTML = html;

    const imageUrl = div.querySelector("img")?.getAttribute("src");
    const qualifiedImageUrl = imageUrl && new URL(imageUrl, linkUrl).toString();
    const imageSrc = imageUrl ? `src="${qualifiedImageUrl}"` : "";

    const showFeedTitle = this.getAttribute("show-feed-title") != null;
    const feedTitle = showFeedTitle ? `, ${this._feed?.title}` : "";

    this.innerHTML = `
      <img ${imageSrc} />
      <div class="info">
        <p class="title">${title}</p>
        <p class="description">
          <time datetime="${updated}">${formatDate(updated)}</time>
          ${feedTitle}
        </p>
      </div>
    `;
  }
}

customElements.define("opml-article-item", OPMLArticleItem);
