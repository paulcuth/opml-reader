export class OPMLStateProvider extends HTMLElement {
  // ----------------------------
  // LIFECYCLE

  constructor() {
    super();
    this._state = {};
    this._listenersByKey = {};

    this.onAddListenerEvent = this.onAddListenerEvent.bind(this);
    this.onRemoveListenerEvent = this.onRemoveListenerEvent.bind(this);
    this.onStateChange = this.onStateChange.bind(this);
  }

  connectedCallback() {
    this.addEventListener("opml-state-add-listeners", this.onAddListenerEvent);
    this.addEventListener(
      "opml-state-remove-listeners",
      this.onRemoveListenerEvent
    );
    this.addEventListener("opml-state-change", this.onStateChange);
  }

  disconnectedCallback() {
    this.removeEventListener(
      "opml-state-add-listeners",
      this.onAddListenerEvent
    );
    this.removeEventListener(
      "opml-state-remove-listeners",
      this.onRemoveListenerEvent
    );
    this.removeEventListener("opml-state-change", this.onStateChange);
  }

  // ----------------------------
  // METHODS

  addListener(key, listener) {
    const listeners = this._listenersByKey[key] ?? [];
    this._listenersByKey[key] = [...listeners, listener];

    if (key === "settings") {
      listener(this._state[key]);
    } else {
      window.requestAnimationFrame(() => listener(this._state[key]));
    }
  }

  removeListener(key, listener) {
    const listeners = this._listenersByKey[key] ?? [];
    this._listenersByKey[key] = listeners.filter((l) => l !== listener);
  }

  update(key, value) {
    this._state[key] = value;
    const listeners = this._listenersByKey[key] ?? [];
    listeners.map((listener) => listener(value));
  }

  // ----------------------------
  // EVENT HANDLERS

  onAddListenerEvent(e) {
    const listeners = e.detail?.listeners ?? {};
    Object.entries(listeners).forEach(([key, listener]) => {
      this.addListener(key, listener);
    });
  }

  onRemoveListenerEvent(e) {
    const listeners = e.detail?.listeners ?? {};
    Object.entries(listeners).forEach(([key, listener]) => {
      this.removeListener(key, listener);
    });
  }

  onStateChange(e) {
    const { key, value } = e.detail ?? {};
    this.update(key, value);
  }
}

customElements.define("opml-state-provider", OPMLStateProvider);
