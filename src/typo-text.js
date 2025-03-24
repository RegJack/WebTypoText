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

    this.columnWidth = {}
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
      })
    }
  }

  _rounded(number, fractionDigits) {
    if (typeof number != 'number') {
      return parseFloat(parseFloat(number).toFixed(fractionDigits))
    }
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

  _getColumnWidth() {
    const columnWidthPx = getComputedStyle(this).getPropertyValue('--column-width')
    const columnWidth = this._rounded(columnWidthPx.split('px')[0], 2)
    return { number: columnWidth, px: columnWidthPx }
  }

  _getTypographySettings(paragraph) {
    return {
      fontFamily: getComputedStyle(paragraph).fontFamily,
      fontWeight: getComputedStyle(paragraph).fontWeight,
      fontSize: parseFloat(getComputedStyle(paragraph).fontSize.split('px')[0]),
      fontSizePx: getComputedStyle(paragraph).fontSize,
      lineHeight: parseFloat(getComputedStyle(paragraph).lineHeight.split('px')[0]),
      lineHeightPx: getComputedStyle(paragraph).lineHeight,
      textAlign: getComputedStyle(paragraph).textAlign,
      textWrap: getComputedStyle(paragraph).textWrap,
      hyphens: getComputedStyle(paragraph).hyphens,
      whiteSpace: getComputedStyle(paragraph).whiteSpace
    }
  }

  // https://github.com/soulwire/FontMetrics
  _getFontMetrics(
    fontFamily = 'Verdana',
    fontWeight = 'normal',
    fontSize = 12,
    origin = 'baseline'
  ) {
    const basicChars = {
      capHeight: 'С',
      baseline: 'н',
      xHeight: 'х',
      descent: 'р',
      ascent: 'б',
      tittle: 'ё'
    }

    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    const padding = fontSize * 0.5

    canvas.width = fontSize * 2
    canvas.height = fontSize * 2 + padding
    context.font = `${fontWeight} ${fontSize}px ${fontFamily}`
    context.textBaseline = 'top'
    context.textAlign = 'center'

    const setAlignment = (baseline = 'top') => {
      const ty = baseline === 'bottom' ? canvas.height : 0
      context.setTransform(1, 0, 0, 1, 0, ty)
      context.textBaseline = baseline
    }

    const updateText = (text) => {
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.fillText(text, canvas.width / 2, padding, canvas.width)
    }

    const computeLineHeight = () => {
      const letter = 'A'
      setAlignment('bottom')
      const gutter = canvas.height - measureBottom(letter)
      setAlignment('top')
      return measureBottom(letter) + gutter
    }

    const getPixels = (text) => {
      updateText(text)
      return context.getImageData(0, 0, canvas.width, canvas.height).data
    }

    const getFirstIndex = (pixels) => {
      for (let i = 3, n = pixels.length; i < n; i += 4) {
        if (pixels[i] > 0) return (i - 3) / 4
      }
      return pixels.length
    }

    const getLastIndex = (pixels) => {
      for (let i = pixels.length - 1; i >= 3; i -= 4) {
        if (pixels[i] > 0) return i / 4
      }
      return 0
    }

    const normalize = (metrics, fontSize, origin) => {
      const result = {}
      const offset = metrics[origin]
      for (let key in metrics) {
        result[key] = (metrics[key] - offset) / fontSize
      }
      return result
    }

    const measureTop = (text) => Math.round(getFirstIndex(getPixels(text)) / canvas.width) - padding

    const measureBottom = (text) =>
      Math.round(getLastIndex(getPixels(text)) / canvas.width) - padding

    const getMetrics = (chars = basicChars) => ({
      capHeight: measureTop(chars.capHeight),
      baseline: measureBottom(chars.baseline),
      xHeight: measureTop(chars.xHeight),
      descent: measureBottom(chars.descent),
      bottom: computeLineHeight(),
      ascent: measureTop(chars.ascent),
      tittle: measureTop(chars.tittle),
      top: 0
    })

    return normalize(getMetrics(), fontSize, origin)
  }

  _removeSpaceBetweenImageAndParagraph(figure, previousParagraph, nextSibling) {
    if (nextSibling && figure.getBoundingClientRect().x == nextSibling.getBoundingClientRect().x) {
      nextSibling.style.marginTop = getComputedStyle(this).getPropertyValue(
        '--margin-top-img-sibling'
      )
    }
    if (previousParagraph && this.getBoundingClientRect().y != figure.getBoundingClientRect().y) {
      previousParagraph.style.marginBottom = '0px'
    }
  }

  _getImageHeight(figure, image, topOffset, bottomOffset) {
    if (figure.nextElementSibling) {
    return this._rounded(
        Math.round(image.offsetHeight / this.typographySettings.lineHeight) *
          this.typographySettings.lineHeight -
          topOffset -
          bottomOffset,
        2
      )
     } else { return this._rounded(
     Math.round(
          (this.getBoundingClientRect().bottom - figure.getBoundingClientRect().top) /
            this.typographySettings.lineHeight
        ) *
          this.typographySettings.lineHeight -
          topOffset -
          bottomOffset,
        2
      )
    }
  }

  _setCorrectImageSize(image) {
    const figure = this._createFigureFromImage(image)

    const topOffset =
      this.typographySettings.lineHeight -
      (this.fontMetrics.descent - this.fontMetrics.xHeight) * this.typographySettings.fontSize
    const bottomOffset = this.fontMetrics.descent * this.typographySettings.fontSize

    const correctImageHeight = this._getImageHeight(figure, image, topOffset, bottomOffset)

    image.style.height = `${correctImageHeight}px`
    image.style.width = '100%'
    image.style.objectFit = image.getAttribute('object-fit') || 'cover'
    image.style.objectPosition = image.getAttribute('object-position') || 'center center'
    figure.style.marginTop = `${this.typographySettings.lineHeight + topOffset}px`
    figure.style.marginBottom = figure.nextElementSibling ? `${this.typographySettings.lineHeight + bottomOffset}px` : `${bottomOffset}px`

    this._removeSpaceBetweenImageAndParagraph(
      figure,
      figure.previousElementSibling,
      figure.nextElementSibling
    )
  }

  _createFigureFromImage(image) {
    const figure = document.createElement('figure')

    if (image.nextElementSibling) {
      this.insertBefore(figure, image.nextElementSibling)
    } else {
      this.appendChild(figure)
    }
    figure.appendChild(image)

    if (image.getAttribute('caption')) {
      const caption = document.createElement('figcaption')
      caption.style.textAlign = 'center'
      caption.style.fontFamily = this.typographySettings.fontFamily
      caption.style.fontSize = `${this.typographySettings.fontSize - 2}px`
      caption.style.lineHeight = this.typographySettings.lineHeightPx
      caption.textContent = image.getAttribute('caption')
      figure.appendChild(caption)

      figure.style.breakInside = 'avoid-column'
      // figure.style.display = 'table'
    }

    return figure
  }

  // connect component
  async connectedCallback() {
    for (const paragraph of Array.from(this.getElementsByTagName('p'))) {
      paragraph.textContent = rusHyphenate(paragraph.textContent)
      paragraph.textContent = noBreakPrepositions(paragraph.textContent)
    }

    this.columnWidth = await this._customOnLoad(this._getColumnWidth)
    this.typographySettings = await this._customOnLoad(
      this._getTypographySettings,
      this.getElementsByTagName('p')[0]
    )
    this.fontMetrics = await this._customOnLoad(
      this._getFontMetrics,
      this.typographySettings.fontFamily,
      this.typographySettings.fontWeight,
      200,
      'baseline'
    )
    // await this._customOnLoad(this._getInfo, Array.from(this.getElementsByTagName('p')))
    console.log('typographySettings', this.typographySettings)
    console.log('fontMetrics', this.fontMetrics)

    for (const image of Array.from(this.getElementsByTagName('img'))) {
      await this._customOnLoad(this._setCorrectImageSize, image)
    }
    console.log(getComputedStyle(this.getElementsByTagName('h1')[0]).fontSize, getComputedStyle(this.getElementsByTagName('h1')[0]).lineHeight)
    // this.textContent = `Hello ${this.name}!`;
    for (const paragraph of Array.from(this.getElementsByTagName('p'))) {
      console.log(paragraph.getBoundingClientRect().bottom)
    }
    console.log(this.getBoundingClientRect())
  }
}

customElements.define('typo-text', TypoText)
