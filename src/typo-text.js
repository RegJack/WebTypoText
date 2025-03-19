const basicFontSizeValues = ['12', '13', '14', '15', '16']

const textAlignValues = ['left', 'justify']

const columnCountValues = ['1', '2', '3', '4']

const templateHTML = `
  <style>   
    @import "/src/typo-text.css";
  </style>
  <article><slot /></article>
`

function rusHyphenate(text) {
  let hyphenatedText = text
  const all = '[абвгдеёжзийклмнопрстуфхцчшщъыьэюя]',
    vowel = '[аеёиоуыэюя]',
    consonant = '[бвгджзклмнпрстфхцчшщ]',
    zn = '[йъь]',
    shy = '\xAD',
    hyp = []

  hyp[0] = new RegExp('(' + zn + ')(' + all + all + ')', 'ig')
  hyp[1] = new RegExp('(' + vowel + ')(' + vowel + all + ')', 'ig')
  hyp[2] = new RegExp('(' + vowel + consonant + ')(' + consonant + vowel + ')', 'ig')
  hyp[3] = new RegExp('(' + consonant + vowel + ')(' + consonant + vowel + ')', 'ig')
  hyp[4] = new RegExp('(' + vowel + consonant + ')(' + consonant + consonant + vowel + ')', 'ig')
  hyp[5] = new RegExp(
    '(' + vowel + consonant + consonant + ')(' + consonant + consonant + vowel + ')',
    'ig'
  )

  for (let i = 0; i <= 5; ++i) {
    while (hyp[i].test(hyphenatedText)) {
      hyphenatedText = hyphenatedText.replaceAll(hyp[i], '$1' + shy + '$2')
    }
  }

  return hyphenatedText
}

function noBreakPrepositions(text) {
  const noBreakSpace = '\u00A0'
  
  return text.replace(
    /(\s[о|в|с|к|но|он|из|на|со|и|для|у|как])( )([("«А-яЁёЙй])/gmu,
    '$1' + noBreakSpace + '$3'
  )
}

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
    super()

    this.attachShadow({
      mode: 'closed'
    }).innerHTML = templateHTML
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

  _customOnLoad(callback, ...args) {
    if (getComputedStyle(this).getPropertyValue('--column-width') != '') {
      callback.call(this, ...args)
    } else {
      console.log('Trying to get values...')
      return setTimeout(() => {
        this._customOnLoad(callback, ...args)
      }, 10)
    }
  }


  // connect component
  connectedCallback() {
    Array.from(this.children).forEach((item) => {
      item.textContent = rusHyphenate(item.textContent)
      item.textContent = noBreakPrepositions(item.textContent)
      
    })
    // this.textContent = `Hello ${this.name}!`;
  }
}

customElements.define('typo-text', TypoText)
