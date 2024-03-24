import BindEventHandlersMixin from "./BindEventHandlersMixin";
import StateMixin from "./StateMixin";

export class OPMLLocalStorage extends StateMixin(
  BindEventHandlersMixin(HTMLElement)
) {
  static observedStateKeys = ["sourceMetadata", "feedUrls"];

  // ----------------------------
  // EVENT HANDLERS

  onSourceMetadataChange(metadata) {
    this._sourceUrl = metadata?.url;
  }

  onFeedUrlsChange(urls) {
    urls?.forEach((url) => {
      const stateKey = `feedsByUrl/${url}`;
      const storageKey = `opml/${this._sourceUrl.replaceAll(
        "/",
        "-"
      )}/${stateKey.replaceAll("/", "-")}}`;

      const value = window.localStorage.getItem(storageKey);
      if (value != null) {
        this._updateState(stateKey, JSON.parse(value));
      }

      this._addStateListeners({
        [stateKey]: (feed) => {
          try {
            const truncated = { ...feed, articles: feed.articles.slice(0, 2) };
            window.localStorage.setItem(storageKey, JSON.stringify(truncated));
          } catch (e) {}
        },
      });
    });
  }
}

customElements.define("opml-local-storage", OPMLLocalStorage);
