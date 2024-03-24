export default function BindEventHandlersMixin(superclass) {
  return class BindEventHandlersMixin extends superclass {
    // ----------------------------
    // LIFECYCLE

    constructor() {
      super();

      const propNames = Object.getOwnPropertyNames(this.constructor.prototype);
      const handlerNames = propNames.filter((name) => /^on[A-Z]/.test(name));
      handlerNames.forEach((name) => (this[name] = this[name].bind(this)));
    }
  };
}
