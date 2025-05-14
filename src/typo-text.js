const basicFontSizeValues = ['12', '13', '14', '15', '16']

const textAlignValues = ['left', 'justify']

const columnCountValues = ['1', '2', '3', '4']

const templateHTML = `
  <style>   
    :host {
      display: block;
      /* max-width: var(--column-width); */
      text-align: left;
      font-size: var(--base-font-size);
      font-family: Verdana;
      margin: 0 auto;
      text-rendering: geometricPrecision;
      position: relative;

      --margin-top-img-sibling: -2.4px;
      --column-count: 1;
      --column-width: 400px;
      --column-gap: calc(var(--base-font-size) * 2.75);
      --base-font-size: 12px;
      --base-line-height: calc(var(--base-font-size) * 1.2);
      --max-width-1-column: calc(var(--column-width) * 1 + 2.75em * 0);
      --max-width-2-column: calc(var(--column-width) * 2 + 2.75em * 1);
      --max-width-3-column: calc(var(--column-width) * 3 + 2.75em * 2);
      --max-width-4-column: calc(var(--column-width) * 4 + 2.75em * 3);
    }

    :host article {
      width: 100%;
      margin: 0 auto;
      column-count: var(--column-count);
      column-width: var(--column-width);
      column-gap: var(--column-gap);
      line-height: var(--base-line-height);
      /* background-image:repeating-linear-gradient(to bottom, transparent 0 calc(calc(var(--base-font-size) * 1.2) - 1px), #ccc calc(calc(var(--base-font-size) * 1.2) - 1px) calc(var(--base-font-size) * 1.2)) */
    }

    :host([text-align="left"]) {
      text-align: left;
    }

    :host([text-align="justify"]) {
      text-align: justify;
    }

    :host([column-count="1"]) article {
      --column-count: 1;
    }

    :host([column-count="2"]) article {
      --column-count: 2;
    }

    :host([column-count="3"]) article {
      --column-count: 3;
    }

    :host([column-count="4"]) article {
      --column-count: 4;
    }

    ::slotted(*) {
      margin: 0;
      padding: 0;
    }

    ::slotted(p) {
      font-size: 1em;
      hyphens: auto;
      text-wrap: pretty;
    }
  </style>
  <article><slot /></article>
`

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
      mode: 'open'
    }).innerHTML = templateHTML

    this.typographySettings = {}
    this.fontMetrics = {}
  }

  // component attributes
  static get observedAttributes() {
    return [
      'font-size',
      'line-height',
      'column-width',
      'column-count',
      'column-gap',
      'chars-per-line'
    ]
  }

  // attribute change
  async attributeChangedCallback(property, oldValue, newValue) {
    if (oldValue === newValue) return
    switch (property) {
      case 'font-size':
        this[property] = this._checkIsUnitSet(newValue)
        this.style.setProperty('--base-font-size', this[property])

        break

      case 'line-height':
        this[property] = this._checkIsUnitSet(newValue)
        this.style.setProperty('--base-line-height', this[property])

        break

      case 'column-width':
        if (!this.getAttribute('chars-per-line')) {
          this[property] = this._checkIsUnitSet(newValue)
          this.style.setProperty('--column-width', this[property])
        }
        break

      case 'column-count':
        this[property] = newValue
        this.style.setProperty('--column-count', this[property])
        break

      case 'column-gap':
        this[property] = this._checkIsUnitSet(newValue)
        this.style.setProperty('--column-gap', this[property])
        break

      case 'chars-per-line':
        this[property] = newValue
        this.style.setProperty('--chars-per-line', this[property])
        if (newValue) {
          const optimalWidth = await this._customOnLoad(
            this._getOptimalLineWidth,
            this.getElementsByTagName('p')[0],
            this.getAttribute('chars-per-line')
          )
          this['column-width'] = `${optimalWidth}px`
          this.style.setProperty('--column-width', this['column-width'])
        }
        break

      default:
        break
    }
  }

  _rusHyphenate(text) {
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

  _noBreakPrepositions(text) {
    const noBreakSpace = '\u00A0'

    return text.replace(
      /(\s)(о|в|во|с|к|но|он|из|на|со|и|для|у|как|а|или|без)(\s)([\("«А-яЁёЙй])/gimu,
      '$1' + '$2' + noBreakSpace + '$4'
    )
  }

  _checkIsUnitSet(value, unit = 'px') {
    return /^(\d+)$/g.test(value) ? `${value}${unit}` : value
  }

  _removeUnits(value) {
    return parseFloat(value.replace(/(px|rem|em|%)$/g, ''))
  }

  _customOnLoad(callback, ...args) {
    if (getComputedStyle(this).getPropertyValue('--margin-top-img-sibling') != '') {
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
    // const p = document.createElement('p')
    // document.body.appendChild(p)
    // p.style.width = getComputedStyle(this).getPropertyValue('--column-width')
    let totalCharsAmount = 0
    let totalLinesAmount = 0
    let averageCharsAmountInLine = 0

    for (const item of paragraphs) {
      const p = item.cloneNode()
      p.textContent = ''
      this.appendChild(p)
      p.style.width = getComputedStyle(this).getPropertyValue('--column-width')
      // p.style.whiteSpace = this.typographySettings.whiteSpace
      // p.style.textWrap = this.typographySettings.textWrap
      // p.style.hyphens = this.typographySettings.hyphens
      // p.style.textAlign = this.typographySettings.textAlign
      // p.style.fontFamily = this.typographySettings.fontFamily
      // p.style.fontSize = this.typographySettings.fontSizePx
      // p.style.lineHeight = this.typographySettings.lineHeightPx

      const paragraphText = item.textContent.replace(/\u00AD/g, '')
      let charsAmountInLine = paragraphText.length
      for (let i = 0; i < charsAmountInLine; i++) {
        p.textContent += paragraphText[i]
        if (p.offsetHeight > Math.round(this.typographySettings.lineHeight)) {
          charsAmountInLine = i - 1
          break
        }
      }

      const linesAmount = Math.round(
        parseFloat(item.offsetHeight) / parseFloat(this.typographySettings.lineHeight)
      )
      console.log(
        `Абзац\n Количество строк: ${linesAmount}\n Количество символов в тексте: ${
          paragraphText.length
        }\n Среднее количество символов в строке (math): ${this._rounded(
          paragraphText.length / linesAmount,
          2
        )}\n Среднее количество символов в строке (custom): ${this._rounded(charsAmountInLine, 2)}`
      )

      totalCharsAmount += paragraphText.length
      totalLinesAmount += linesAmount
      averageCharsAmountInLine += charsAmountInLine

      this.removeChild(p)
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
  }

  _getCharsAmountInLine(paragraph) {
    const p = paragraph.cloneNode()
    p.textContent = ''
    this.appendChild(p)
    p.style.width = this._checkIsUnitSet(this['column-width'])

    const paragraphText = paragraph.textContent.replace(/\u00AD/g, '')
    let charsAmountInLine = paragraphText.length
    for (let i = 0; i < charsAmountInLine; i++) {
      p.textContent += paragraphText[i]
      if (p.offsetHeight > Math.round(this.typographySettings.lineHeight)) {
        charsAmountInLine = i - 1
        break
      }
    }
    this.removeChild(p)

    return this._rounded(charsAmountInLine, 2)
  }

  _getOptimalLineWidth(paragraph, charsPerLine) {
    const p = paragraph.cloneNode()
    p.textContent = ''
    this.appendChild(p)
    p.style.width = 'fit-content'
    p.style.whiteSpace = 'nowrap'

    const paragraphText = paragraph.textContent.replace(/\u00AD/g, '')
    for (let i = 0; i < charsPerLine; i++) {
      p.textContent += paragraphText[i] || 'а'
    }
    const optimalWidth = p.offsetWidth
    this.removeChild(p)

    return optimalWidth
  }

  _getTypographySettings(paragraph) {
    return {
      fontFamily: getComputedStyle(paragraph).fontFamily,
      fontWeight: getComputedStyle(paragraph).fontWeight,
      fontSize: this._removeUnits(getComputedStyle(paragraph).fontSize),
      fontSizePx: getComputedStyle(paragraph).fontSize,
      lineHeight: this._removeUnits(getComputedStyle(paragraph).lineHeight),
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

  _setColumnWidthStyles() {
    const article = this.shadowRoot.querySelector('article')
    const articleComputedStyle = getComputedStyle(article)

    this['column-count'] = this._removeUnits(articleComputedStyle.columnCount)
    this['column-width'] = this._removeUnits(articleComputedStyle.columnWidth)
    this['column-gap'] = this._removeUnits(articleComputedStyle.columnGap)
    this.breakpoints = []

    for (let i = 1; i <= this['column-count']; i++) {
      this.breakpoints.push(parseFloat(this['column-width']) * i + this['column-gap'] * (i - 1))
    }

    this.breakpoints.reverse()

    const resizeObserver = new ResizeObserver((entries, observer) => {
      entries.forEach((entry) => {
        const currentBreakpointIndex = this.breakpoints.findIndex(
          (value) => value <= parseInt(entry.contentBoxSize[0].inlineSize)
        )
        if (article.style.maxWidth != `${this.breakpoints.at(currentBreakpointIndex)}px`) {
          article.style.maxWidth = `${this.breakpoints.at(currentBreakpointIndex)}px`
          this.currentColumn = this['column-count'] - currentBreakpointIndex

          this._rerender()
        }

        const heading = this.getElementsByTagName('h1')[0]
        if (heading.scrollWidth > heading.offsetWidth) {
          heading.style.overflowWrap = 'break-word'
          heading.style.hyphens = 'manual'
          this.headingNoBreakWidth = heading.scrollWidth
        } else if (
          heading.style.hyphens != 'none' &&
          heading.offsetWidth > this.headingNoBreakWidth
        ) {
          heading.style.overflowWrap = 'normal'
          heading.style.hyphens = 'none'
        }
      })
    })

    resizeObserver.observe(this)
  }

  _removeSpaceBetweenImageAndParagraph(figure, previousParagraph, nextSibling) {
    if (nextSibling && figure.getBoundingClientRect().x == nextSibling.getBoundingClientRect().x) {
      // nextSibling.style.marginTop = getComputedStyle(this).getPropertyValue(
      //   '--margin-top-img-sibling'
      // )
    }
    if (previousParagraph && this.getBoundingClientRect().y != figure.getBoundingClientRect().y) {
      previousParagraph.style.marginBottom = '0px'
    }
  }

  _getImageHeight(figure, image) {
    const oRatio = image.naturalWidth / image.naturalHeight

    if (
      getComputedStyle(figure).maxWidth &&
      getComputedStyle(figure).maxWidth.endsWith('%') &&
      (image.style.objectFit == 'contain' || !figure.style.float)
    ) {
      const figureWidth =
        (getComputedStyle(figure).maxWidth.split('%')[0] * parseFloat(this['column-width'])) / 100
      // console.log(figureWidth / oRatio, image.offsetHeight)
      if (
        figureWidth / oRatio < image.offsetHeight ||
        getComputedStyle(figure).maxWidth == '100%'
      ) {
        return this._rounded(
          Math.floor(figureWidth / oRatio / this.typographySettings.lineHeight) *
            this.typographySettings.lineHeight -
            this.baseTopOffset -
            this.baseBottomOffset,
          2
        )
      } else {
        image.style.width = 'auto'
        image.style.marginLeft = 'auto'
        image.style.marginRight = 'auto'
        figure.style.width = 'min-content'
      }
    }

    return this._rounded(
      Math.round(image.offsetHeight / this.typographySettings.lineHeight) *
        this.typographySettings.lineHeight -
        this.baseTopOffset -
        this.baseBottomOffset,
      2
    )
  }

  _setImageStyle(image) {
    const figure = this._createFigureFromImage(image)

    image.style.width = '100%'
    image.style.objectFit = image.getAttribute('object-fit') || 'cover'
    image.style.objectPosition = image.getAttribute('object-position') || 'center center'

    const img = figure.querySelector('img')
    const isContain = image.style.objectFit == 'contain'
    const isFloat = figure.style.float == 'left' || figure.style.float == 'right'

    if (isContain) {
      const oRatio = img.naturalWidth / img.naturalHeight
      const cRatio = img.width / img.height

      if (oRatio > cRatio) {
        img.height = img.width / oRatio
      } else {
        img.height = img.height
      }
    }

    if (isFloat) {
      figure.style.maxWidth =
        this._checkIsUnitSet(img.getAttribute('image-float-percent'), '%') || '30%'
      figure.style.width = 'max-content'
    } else {
      figure.style.maxWidth = '100%'
    }

    this._setImageSize(figure, image)

    this._setFigureOffsets(figure)
  }

  _setImageSize(figure, image) {
    const correctImageHeight = this._getImageHeight(figure, image)

    image.style.height = `${correctImageHeight}px`
  }

  _setFigureOffsets(figure) {
    figure.style.paddingTop = `${this.baseTopOffset}px`
    figure.style.marginBottom = `${this.typographySettings.lineHeight}px`

    if (!figure.style.float) {
      if (
        this.getBoundingClientRect().top == figure.getBoundingClientRect().top ||
        figure.previousElementSibling.tagName == 'H1'
      ) {
        figure.style.marginTop = `0px`
      } else {
        figure.style.marginTop = `${this.typographySettings.lineHeight}px`
      }

      this._removeSpaceBetweenImageAndParagraph(
        figure,
        figure.previousElementSibling,
        figure.nextElementSibling
      )
    } else if (figure.style.float == 'left') {
      figure.style.marginRight = `${this.typographySettings.lineHeight}px`
    } else if (figure.style.float == 'right') {
      figure.style.marginLeft = `${this.typographySettings.lineHeight}px`
    }
  }

  _createFigureFromImage(image) {
    const figure = document.createElement('figure')

    if (image.nextElementSibling) {
      this.insertBefore(figure, image.nextElementSibling)
    } else {
      this.appendChild(figure)
    }
    figure.appendChild(image)

    if (image.getAttribute('image-caption')) {
      const caption = document.createElement('figcaption')
      caption.style.textAlign = 'center'
      caption.style.fontFamily = this.typographySettings.fontFamily
      caption.style.fontSize = `${this.typographySettings.fontSize - 2}px`
      caption.style.lineHeight = this.typographySettings.lineHeightPx
      caption.textContent = image.getAttribute('image-caption')
      figure.appendChild(caption)

      figure.style.breakInside = 'avoid-column'
      image.style.display = 'block'
      image.style.marginBottom = `${this.baseBottomOffset}px`
    }

    if (
      (!figure.nextElementSibling ||
        !figure.previousElementSibling ||
        figure.previousElementSibling.tagName == 'H1') &&
      image.getAttribute('image-span')
    ) {
      const imageSpan = image.getAttribute('image-span')
      if (imageSpan == 'all') {
        figure.style.columnSpan = 'all'
      }
    }

    if (
      figure.nextElementSibling &&
      figure.nextElementSibling.tagName == 'P' &&
      image.getAttribute('image-float')
    ) {
      const imageFloat = image.getAttribute('image-float')
      if (imageFloat == 'left' || imageFloat == 'right') {
        figure.style.float = imageFloat
      }
    }

    return figure
  }

  _getElementsByColumns() {
    const elementsByColumns = []

    let i = -1
    let x
    for (const element of this.children) {
      if (element.getBoundingClientRect().x == x) {
        elementsByColumns[i].push(element)
      } else {
        elementsByColumns.push([element])
        x = element.getBoundingClientRect().x
        i++
      }
    }

    return elementsByColumns
  }

  _setHeadingStyle(heading) {
    const headingSize = heading.getAttribute('heading-size') || 'md'
    if (headingSize) {
      switch (headingSize) {
        case 'sm':
          heading.style.fontSize = `${this.typographySettings.fontSize}px`
          heading.style.lineHeight = `${this.typographySettings.lineHeight}px`
          break

        case 'md':
          heading.style.fontSize = `${this.typographySettings.fontSize * 2}px`
          heading.style.lineHeight = `${this.typographySettings.lineHeight * 2}px`
          break

        case 'lg':
          heading.style.fontSize = `${this.typographySettings.fontSize * 3}px`
          heading.style.lineHeight = `${this.typographySettings.lineHeight * 2.5}px`
          heading.style.marginTop = `-${this.typographySettings.lineHeight}px`
          break
      }
    }

    const verticalShift =
      this.fontMetrics.descent * this._removeUnits(getComputedStyle(heading).fontSize) - 2

    heading.style.paddingTop = `${verticalShift}px`
    heading.style.paddingBottom = `${this.typographySettings.lineHeight - verticalShift}px`
    heading.style.overflow = 'visible'

    const headingAlign = heading.getAttribute('heading-align')
    if (headingAlign) {
      switch (headingAlign) {
        case 'center':
          heading.style.textAlign = 'center'
          break

        default:
          heading.style.textAlign = 'left'
          break
      }
    }

    const headingSpan = heading.getAttribute('heading-span')
    if (headingSpan) {
      heading.style.columnSpan = 'none'
      heading.style.width = 'auto'
      Array.from(this.children).forEach((element) => {
        if (element.headingPaddingTop) element.style.paddingTop = 0
        if (element.partOfPrevious) {
          element.previousElementSibling.textContent += ` ${element.textContent}`
          element.previousElementSibling.style.textAlignLast = 'left'
          this.removeChild(element)
        }
      })

      if (
        headingSpan == 'all' ||
        parseInt(headingSpan) == this.currentColumn ||
        (parseInt(headingSpan) > this.currentColumn &&
          parseInt(headingSpan) <= this['column-count'])
      ) {
        heading.style.columnSpan = 'all'
      }
      // else if (parseInt(headingSpan) < this.currentColumn) {
      //   heading.style.width = `${this.breakpoints[this['column-count'] - parseInt(headingSpan)]}px`

      //   const elementsByColumns = this._getElementsByColumns()
      //   for (let i = 1; i < parseInt(headingSpan); i++) {
      //     if (
      //       elementsByColumns[i][0].getBoundingClientRect().top == this.getBoundingClientRect().top
      //     ) {
      //       if (!elementsByColumns[i][0].headingPaddingTop) {
      //         elementsByColumns[i][0].style.paddingTop = `${heading.getBoundingClientRect().height}px`
      //       elementsByColumns[i][0].headingPaddingTop = true
      //       }
      //     } else {
      //       if (elementsByColumns[i - 1].at(-1).nodeName == 'P') {
      //         const element = elementsByColumns[i - 1].at(-1)
      //         const totalHeight = element.offsetHeight
      //         const firstPartHeight = this.offsetHeight - elementsByColumns[i - 1].at(-1).offsetTop + this.typographySettings.lineHeight
      //         const secondPartHeight = totalHeight - firstPartHeight

      //         const firstPartProportion = firstPartHeight / totalHeight

      //         const paragraphClone = this.appendChild(element.cloneNode())
      //         paragraphClone.textContent = element.textContent.slice(
      //           Math.round(firstPartProportion * element.textContent.length)
      //         )
      //         let charNotFound = true
      //         let k = 0
      //         while (charNotFound) {
      //           const currentChar =
      //             element.textContent[
      //               Math.round(firstPartProportion * element.textContent.length) - k
      //             ]
      //           console.log(currentChar)
      //           if (currentChar == ' ' && currentChar != String.fromCharCode(160)) {
      //             charNotFound = false
      //           } else {
      //             k++
      //           }
      //         }
      //         this.removeChild(paragraphClone)
      //         this.insertBefore(paragraphClone, element.nextElementSibling)
      //         paragraphClone.textContent = element.textContent.slice(
      //           Math.round(firstPartProportion * element.textContent.length) - k + 1
      //         )
      //         element.textContent = element.textContent.slice(
      //           0,
      //           Math.round(firstPartProportion * element.textContent.length) - k
      //         )
      //         element.style.textAlignLast = 'justify'
      //         paragraphClone.style.paddingTop = `${heading.getBoundingClientRect().height}px`
      //         paragraphClone.headingPaddingTop = true
      //         paragraphClone.partOfPrevious = true
      //       }
      //     }
      //   }
      // }
    }
  }

  async _rerender() {
    for (const figure of Array.from(this.getElementsByTagName('figure'))) {
      this._setFigureOffsets(figure)
    }

    const heading = this.getElementsByTagName('h1')[0]

    setTimeout(() => {
      this._customOnLoad(this._setHeadingStyle, heading)
    }, 1)
  }

  // connect component
  async connectedCallback() {
    setTimeout(async () => {
      await this._customOnLoad(this._setColumnWidthStyles)
    }, 1)

    if (this.getAttribute('font-size')) {
      this.style.setProperty(
        '--base-font-size',
        this._checkIsUnitSet(this.getAttribute('font-size'))
      )
    }

    if (this.getAttribute('line-height')) {
      this.style.setProperty(
        '--base-line-height',
        this._checkIsUnitSet(this.getAttribute('line-height'))
      )
    }

    for (const paragraph of Array.from(this.getElementsByTagName('p'))) {
      paragraph.textContent = this._rusHyphenate(paragraph.textContent)
      paragraph.textContent = this._noBreakPrepositions(paragraph.textContent)
    }

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
    this.charsAmountInLine = await this._customOnLoad(
      this._getCharsAmountInLine,
      this.getElementsByTagName('p')[0]
    )

    // setTimeout(() => {
    //   this._customOnLoad(this._getInfo, Array.from(this.getElementsByTagName('p')))
    // }, 1)

    console.log('typographySettings', this.typographySettings)
    console.log('fontMetrics', this.fontMetrics)
    console.log(
      getComputedStyle(this.getElementsByTagName('p')[0]).fontSize,
      getComputedStyle(this.getElementsByTagName('p')[0]).lineHeight
    )
    console.log('charsAmountInLine', this.charsAmountInLine)

    this.baseTopOffset =
      this.typographySettings.lineHeight -
      (this.typographySettings.lineHeight - this.typographySettings.fontSize * 1.2) / 2 -
      (this.fontMetrics.descent - this.fontMetrics.xHeight) * this.typographySettings.fontSize
    this.baseBottomOffset =
      this.fontMetrics.descent * this.typographySettings.fontSize +
      (this.typographySettings.lineHeight - this.typographySettings.fontSize * 1.2) / 2

    for (const paragraph of Array.from(this.getElementsByTagName('p'))) {
      paragraph.style.marginBottom = this.typographySettings.lineHeightPx
    }

    for (const image of Array.from(this.getElementsByTagName('img'))) {
      await this._customOnLoad(this._setImageStyle, image)
    }

    const heading = this.getElementsByTagName('h1')[0]
    heading.textContent = this._rusHyphenate(heading.textContent)
    heading.textContent = this._noBreakPrepositions(heading.textContent)
    heading.style.hyphens = 'none'

    setTimeout(() => {
      this._customOnLoad(this._setHeadingStyle, heading)
    }, 1)
    // this.textContent = `Hello ${this.name}!`;
  }
}

customElements.define('typo-text', TypoText)
