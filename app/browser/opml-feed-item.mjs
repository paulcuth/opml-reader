import StyleMixin from "./StyleMixin";
import BindEventHandlersMixin from "./BindEventHandlersMixin";
import StateMixin from "./StateMixin";

export class OPMLFeedItem extends StyleMixin(
  StateMixin(BindEventHandlersMixin(HTMLElement))
) {
  // ----------------------------
  // LIFECYCLE

  constructor() {
    super();
    this.classList.add("opml-list-item");

    this._feedUrl = this.getAttribute("feed-url");
    this.render();
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
    this.render();
  }

  // ----------------------------
  // RENDER

  render() {
    const { title, description, avatarUrl } = this._feed ?? {};
    const imageSrc = avatarUrl ? `src="${avatarUrl}"` : "";

    this.innerHTML = `
      <img ${imageSrc} />
      <div class="info">
        <p class="title">${title}</p>
        <p class="description">${description}</p>
      </div>
    `;
  }
}

customElements.define("opml-feed-item", OPMLFeedItem);
