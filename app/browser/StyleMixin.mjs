export default function StyleMixin(superclass) {
  return class StyleMixin extends superclass {
    // ----------------------------
    // LIFECYCLE

    constructor() {
      super();

      const { name, style } = this.constructor;
      const { head } = document;

      const tag = head.querySelector(`style[data-component=${name}]`);
      if (tag == null) {
        head.insertAdjacentHTML(
          "beforeend",
          `<style data-component="${name}">${style}</style>`
        );
      }
    }
  };
}
