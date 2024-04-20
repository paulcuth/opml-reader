import StyleMixin from "./StyleMixin";
import BindEventHandlersMixin from "./BindEventHandlersMixin";
import StateMixin from "./StateMixin";

export class OPMLLayout extends StyleMixin(
  StateMixin(BindEventHandlersMixin(HTMLElement))
) {
  static style = `
    opml-layout {
      display: flex;
      width: 100%;
      height: 100%;
    }
    
    opml-layout > .feed-list,
    opml-layout > .chronological-list,
    opml-layout > .feed-detail {
      width: 25%;
      overflow-x: hidden;
      overflow-y: scroll;
    }
    
    opml-layout > .article-detail {
      width: 50%;
      overflow-x: hidden;
      overflow-y: scroll;
    }

    opml-layout[data-view-by=article] > .chronological-list {
      min-width: 320px;
    }

    opml-layout[data-view-by=article] > .article-detail {
      width: 75%;
      max-width: 768px
    }

    opml-layout nav.back {
      position: sticky;
      top: 0;
      background-color: var(--opml-background-color);
      z-index: 1;
    }

    opml-layout nav.back button {
      display: none;
      text-decoration: none;
      padding: 0.5em;
      margin-bottom: -0.25em;
    }

    opml-layout nav.back button:before {
      content: "<";
      margin-right: 0.25em;
      position: relative;
      top: -0.1em;
    }

    opml-layout > progress {
      appearance: none;
      border: none;
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 2px;
      transition: height .2s linear;
      background-color: transparent;
      z-index: 2;
    }
    opml-layout > progress::-webkit-progress-bar {
      background-color: transparent;
    }
    opml-layout > progress::-moz-progress-bar {
      background-color: var(--opml-progress-color);
    }
    opml-layout > progress::-webkit-progress-value {
      background-color: var(--opml-progress-color);
    }
    opml-layout > progress[value="100"] {
      height: 0;
    }

    @media (max-width: 1024px) {
      opml-layout[data-view-by=feed] opml-article-detail nav.back button {
        display: block;
      }

      opml-layout > .feed-list, 
      opml-layout > .feed-detail,
      opml-layout[data-view-by=feed] > .article-detail {
        position: absolute;
        left: 0;
        width: 100%;
        opacity: 1;
        background-color: var(--opml-background-color);
        transition: 0.175s ease-out;
        transition-properties: left, opacity;
        max-height: 100%;
      }

      opml-layout > .feed-list, 
      opml-layout > .feed-detail {
        width: 50%;
      }

      opml-layout > .feed-detail {
        left: 50%;
      }

      opml-layout.has-selected-article > .feed-list,
      opml-layout.has-selected-article > .feed-detail {
        left: -50%;
        opacity: 0;
      }

      opml-layout:not(.has-selected-feed) > .feed-detail, 
      opml-layout:not(.has-selected-article)[data-view-by=feed] > .article-detail {
        left: 50%;
        opacity: 0;
      }
    }

    @media  (max-width: 512px) {
      opml-feed-detail nav.back button {
        display: block;
      }

      opml-layout > .feed-list, 
      opml-layout > .feed-detail {
        width: 100%;
        left: 0;
      }

      opml-layout.has-selected-feed > .feed-list {
        left: -50%;
        opacity: 0;
      }
    }

    @media (max-width: 768px) {
      opml-article-detail nav.back button {
        display: block;
      }

      opml-layout > .chronological-list,
      opml-layout[data-view-by=article] > .article-detail {
        position: absolute;
        left: 0;
        width: 100%;
        opacity: 1;
        background-color: var(--opml-background-color);
        transition: 0.175s ease-out;
        transition-properties: left, opacity;
        max-height: 100%;
      }

      opml-layout.has-selected-article > .chronological-list {
        left: -50%;
        opacity: 0;
      }

      opml-layout:not(.has-selected-article) > .article-detail {
        left: 50%;
        opacity: 0;
      }
    }

    `;

  static observedStateKeys = [
    "settings",
    "viewBy",
    "selectedFeedUrl",
    "selectedArticleId",
    "loadedPercent",
  ];

  // ----------------------------
  // LIFECYCLE

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
    if (url == null) {
      this.classList.remove("has-selected-feed");
    } else {
      this.classList.add("has-selected-feed");
    }
  }

  onSelectedArticleIdChange(id) {
    if (id == null) {
      this.classList.remove("has-selected-article");
      if (this._viewBy === "article") {
        this._updateState("selectedFeedUrl", null);
      }
    } else {
      this.classList.add("has-selected-article");
    }
  }

  onViewByChange(mode) {
    this._viewBy = mode;
    this.dataset.viewBy = mode;
    this.render();
  }

  onLoadedPercentChange(pc) {
    this.querySelector("progress").value = pc ?? 0;
  }

  // ----------------------------
  // RENDER

  render() {
    const {
      feedListElement,
      feedDetailElement,
      chronologicalListElement,
      articleDetailElement,
    } = this._settings;

    switch (this._viewBy) {
      case "feed":
        this.innerHTML = `
          <progress min="0" max="100" value="0"></progress>
          <${feedListElement} class="feed-list"></${feedListElement}>
          <${feedDetailElement} class="feed-detail"></${feedDetailElement}>
          <${articleDetailElement} class="article-detail"></${articleDetailElement}>
        `;
        break;

      case "article":
        this.innerHTML = `
          <progress min="0" max="100" value="0"></progress>
          <${chronologicalListElement} class="chronological-list"></${chronologicalListElement}>
          <${articleDetailElement} class="article-detail"></${articleDetailElement}>
      `;
    }
  }
}

customElements.define("opml-layout", OPMLLayout);
