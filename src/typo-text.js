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
    
    this.typographySettings = {}
    this.fontMetrics = {}
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
      return callback.call(this, ...args)
    } else {
      console.log('Trying to get values...')
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve(this._customOnLoad(callback, ...args))
        }, 10)
      });
      
    }
  }

  _rounded(number, fractionDigits) {
    return parseFloat(number.toFixed(fractionDigits))
  }

  _getInfo(paragraphs) {
    const p = document.createElement('p')
    document.body.appendChild(p)
    p.style.width = getComputedStyle(this).getPropertyValue('--column-width')
    let totalCharsAmount = 0
    let totalLinesAmount = 0
    let averageCharsAmountInLine = 0

    for (const item of paragraphs) {
      p.style.whiteSpace = this.typographySettings.whiteSpace
      p.style.textWrap = this.typographySettings.textWrap
      p.style.hyphens = this.typographySettings.hyphens
      p.style.textAlign = this.typographySettings.textAlign
      p.style.fontFamily = this.typographySettings.fontFamily
      p.style.fontSize = this.typographySettings.fontSizePx
      p.style.lineHeight = this.typographySettings.lineHeightPx

      let charsAmountInLine = item.textContent.length
      for (let i = 0; i < charsAmountInLine; i++) {
        p.textContent += item.textContent[i]
        if (p.offsetHeight > this.typographySettings.lineHeight) {
          charsAmountInLine = i - 1
          break
        }
      }
      p.textContent = ''

      const linesAmount = Math.round(
        parseFloat(item.offsetHeight) / parseFloat(this.typographySettings.lineHeight)
      )
      console.log(
        `Абзац\n Количество строк: ${linesAmount}\n Количество символов в тексте: ${
          item.textContent.length
        }\n Среднее количество символов в строке (math): ${this._rounded(
          item.textContent.length / linesAmount,
          2
        )}\n Среднее количество символов в строке (custom): ${this._rounded(charsAmountInLine, 2)}`
      )

      totalCharsAmount += item.textContent.length
      totalLinesAmount += linesAmount
      averageCharsAmountInLine += charsAmountInLine
    }

    averageCharsAmountInLine = averageCharsAmountInLine / paragraphs.length

    console.log(
      `Итого\n Количество строк: ${totalLinesAmount}\n Количество символов в тексте: ${totalCharsAmount}\n Среднее количество символов в строке (math): ${this._rounded(
        totalCharsAmount / totalLinesAmount,
        2
      )}\n Среднее количество символов в строке (custom): ${this._rounded(
        averageCharsAmountInLine,
        2
      )}`
    )

    document.body.removeChild(p)
  }

  _getTypographySettings(paragraph) {
    return {
      fontFamily: getComputedStyle(paragraph).fontFamily,
      fontSize: parseFloat(getComputedStyle(paragraph).fontSize.split("px")[0]),
      fontSizePx: getComputedStyle(paragraph).fontSize,
      lineHeight: parseFloat(getComputedStyle(paragraph).lineHeight.split("px")[0]),
      lineHeightPx: getComputedStyle(paragraph).lineHeight,
      textAlign: getComputedStyle(paragraph).textAlign,
      textWrap: getComputedStyle(paragraph).textWrap,
      hyphens: getComputedStyle(paragraph).hyphens,
      whiteSpace: getComputedStyle(paragraph).whiteSpace,
    }
  }
  

  // connect component
  async connectedCallback() {
    Array.from(this.getElementsByTagName('p')).forEach((item) => {
      item.textContent = rusHyphenate(item.textContent)
      item.textContent = noBreakPrepositions(item.textContent)
    })

    this.typographySettings = await this._customOnLoad(this._getTypographySettings, this.getElementsByTagName('p')[0])
    // await this._customOnLoad(this._getInfo, Array.from(this.getElementsByTagName('p')))
    console.log("typograohySettings", this.typographySettings)
    this._customOnLoad(this._getInfo, Array.from(this.children))

    // this.textContent = `Hello ${this.name}!`;
  }
}

customElements.define('typo-text', TypoText)
