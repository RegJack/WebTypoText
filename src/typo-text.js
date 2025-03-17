const basicFontSizeValues = [
  "12",
  "13",
  "14",
  "15",
  "16"
];

const columnCountValues = [
  "1",
  "2",
  "3",
  "4"
];

const templateHTML = `
  <style>   
    :host {
      display: block;
      max-width: 400px;
      font-size: 12px;
      font-family: Verdana;
    }

    :host article {
      width: 100%;
      column-width: 400px;
      column-gap: 2.75em;
      line-height: 1.2em;
    }

    :host([font-size="12"]) {
      font-size: 12px;
    }

    :host([font-size="13"]) {
      font-size: 13px;
    }

    :host([font-size="14"]) {
      font-size: 14px;
    }

    :host([font-size="15"]) {
      font-size: 15px;
    }

    :host([font-size="16"]) {
      font-size: 16px;
    }

    :host([column-count="1"]) {
      max-width: calc(400px * 1 + 2.75em * 0);
    }

    :host([column-count="2"]) {
      max-width: calc(400px * 2 + 2.75em * 1);
    }

    :host([column-count="3"]) {
      max-width: calc(400px * 3 + 2.75em * 2);
    }

    :host([column-count="4"]) {
      max-width: calc(400px * 4 + 2.75em * 3);
    }

    :host([column-count="1"]) article {
      column-count: 1;
    }

    :host([column-count="2"]) article {
      column-count: 2;
    }

    :host([column-count="3"]) article {
      column-count: 3;
    }

    :host([column-count="4"]) article {
      column-count: 4;
    }

    ::slotted(*) {
      margin: 0;    
      padding: 0;    
    }

    ::slotted(p) {
      margin-bottom: 1.2em;    
      text-wrap: pretty;
    }
  </style>
  <article><slot /></article>
`;

class TypoText extends HTMLElement {

  //  /**
  //  * Gets the columnCount of the object.
  //  */
  //  get columnCount() {
  //   if (this.hasAttribute('column-count')) {
  //     return this.getAttribute('column-count') || undefined;
  //   }

  //   return undefined;
  // }

  // /**
  //  * Sets the columnCount of the object.
  //  */
  // set columnCount(value) {
  //   if (value == null) {
  //     this.removeAttribute('column-count');
  //   } else if (flexDirectionValues.includes(value)) {
  //     this.setAttribute('column-count', value);
  //   }
  // }

  constructor() {
    super();

    this.attachShadow({
      mode: 'closed'
    }).innerHTML = templateHTML;
  }

  // component attributes
  // static get observedAttributes() {
  //   return ['name'];
  // }

  // attribute change
  // attributeChangedCallback(property, oldValue, newValue) {
  //   if (oldValue === newValue) return;
  //   this[property] = newValue;
  // }

  // connect component
  connectedCallback() {
    // this.textContent = `Hello ${this.name}!`;
  }
}

customElements.define('typo-text', TypoText);