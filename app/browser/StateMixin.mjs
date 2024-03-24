export default function StateMixin(superclass) {
  return class StateMixin extends superclass {
    // ----------------------------
    // LIFECYCLE

    connectedCallback() {
      super.connectedCallback?.();

      const { observedStateKeys } = this.constructor;
      const listeners = this._parseObservedStateKeys(observedStateKeys);
      this._addStateListeners(listeners);
    }

    disconnectedCallback() {
      super.disconnectedCallback?.();

      const { observedStateKeys } = this.constructor;
      const listeners = this._parseObservedStateKeys(observedStateKeys);
      this._removeStateListeners(listeners);
    }

    // ----------------------------
    // METHODS

    _parseObservedStateKeys(keys) {
      if (typeof keys === "function") {
        return this._parseObservedStateKeys(keys(this));
      }
      if (Array.isArray(keys)) {
        return keys.reduce((result, key) => {
          const handlerName = this._computeStateHandlerName(key);
          const handler = this[handlerName];

          if (handler != null) {
            result[key] = handler;
          } else {
            console.warn(
              `observed state key with no change event handler: ${key}. Add ${handlerName} method or remove key in ${this.constructor.name}`
            );
          }
          return result;
        }, {});
      }
      throw new Error(
        `Unexpected value for \`observedStateKeys\` in ${this.constructor.name}; expected array or function that returns array`
      );
    }

    _computeStateHandlerName(key) {
      return `on${key.substr(0, 1).toUpperCase()}${key.substr(1)}Change`;
    }

    _addStateListeners(listeners) {
      if (listeners != null) {
        const event = new CustomEvent("opml-state-add-listeners", {
          detail: { listeners },
          bubbles: true,
        });
        this.dispatchEvent(event);
      }
    }

    _removeStateListeners(listeners) {
      if (listeners != null) {
        const event = new CustomEvent("opml-state-remove-listeners", {
          detail: { listeners },
          bubbles: true,
        });
        this.dispatchEvent(event);
      }
    }

    _updateState(key, value) {
      const event = new CustomEvent("opml-state-change", {
        detail: { key, value },
        bubbles: true,
      });
      this.dispatchEvent(event);
    }
  };
}
