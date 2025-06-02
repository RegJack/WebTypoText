var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
let TypoText = class TypoText extends LitElement {
    constructor() {
        super(...arguments);
        this.fontSize = '12px';
        this.textAlign = 'left';
        this.lineHeight = '';
        this.columnWidth = '400px';
        this.columnCount = '1';
        this.columnGap = '';
        this.charsPerLine = '';
        this.fontMetrics = {};
        this.baseTopOffset = 0;
        this.baseBottomOffset = 0;
        this.resizeObserver = null;
        this.breakpoints = [];
    }
    updated(changedProps) {
        if (changedProps.has('fontSize')) {
            this.style.setProperty('--base-font-size', this._checkIsUnitSet(this.fontSize));
            if (!this.lineHeight)
                this.lineHeight = `${parseFloat(this.fontSize) * 1.6}px`;
        }
        if (changedProps.has('textAlign')) {
            this.style.setProperty('--text-align', this.textAlign);
        }
        if (changedProps.has('lineHeight')) {
            this.style.setProperty('--base-line-height', this._checkIsUnitSet(this.lineHeight));
        }
        if (changedProps.has('columnWidth')) {
            this.style.setProperty('--column-width', this._checkIsUnitSet(this.columnWidth));
        }
        if (changedProps.has('columnCount')) {
            this.style.setProperty('--column-count', this.columnCount);
        }
        if (changedProps.has('columnGap')) {
            this.style.setProperty('--column-gap', this._checkIsUnitSet(this.columnGap));
            if (!this.columnGap)
                this.columnGap = `${parseFloat(this.columnWidth) * 0.0825}px`;
        }
    }
    render() {
        return html `
      <article>
        <slot></slot>
      </article>
    `;
    }
    _checkIsUnitSet(value, unit = 'px') {
        return /^\d+$/.test(value) ? `${value}${unit}` : value;
    }
    async firstUpdated() {
        const paragraphs = this.querySelectorAll('p');
        paragraphs.forEach((p) => {
            p.textContent = this._noBreakPrepositions(this._rusHyphenate(p.textContent ?? ''));
            p.style.marginBottom = this.lineHeight;
        });
        requestAnimationFrame(async () => {
            this.fontMetrics = this._getFontMetrics(getComputedStyle(this).fontFamily, getComputedStyle(this).fontWeight, 200, 'baseline');
            console.log(this.fontMetrics);
            this.baseTopOffset =
                parseFloat(this.lineHeight) -
                    (parseFloat(this.lineHeight) - parseFloat(this.fontSize) * 1.2) / 2 -
                    (this.fontMetrics.descent - this.fontMetrics.xHeight) * parseFloat(this.fontSize);
            this.baseBottomOffset =
                this.fontMetrics.descent * parseFloat(this.fontSize) +
                    (parseFloat(this.lineHeight) - parseFloat(this.fontSize) * 1.2) / 2;
            paragraphs.forEach((p) => {
                p.style.marginBottom = this.lineHeight;
            });
            const heading = this.querySelector('h1');
            if (heading) {
                this._prepareHeading(heading);
            }
            this._wrapImages();
            if (this.charsPerLine && paragraphs.length > 0) {
                const optimalWidth = await this._getOptimalLineWidth(paragraphs[0], parseInt(this.charsPerLine));
                this.columnWidth = `${optimalWidth}`;
                this.style.setProperty('--column-width', `${optimalWidth}px`);
            }
            this._initResizeObserver();
        });
    }
    // https://github.com/soulwire/FontMetrics
    _getFontMetrics(fontFamily = 'Verdana', fontWeight = 'normal', fontSize = 12, origin = 'baseline') {
        const basicChars = {
            capHeight: 'С',
            baseline: 'н',
            xHeight: 'х',
            descent: 'р',
            ascent: 'б',
            tittle: 'й'
        };
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d', { willReadFrequently: true });
        const padding = fontSize * 0.5;
        canvas.width = fontSize * 2;
        canvas.height = fontSize * 2 + padding;
        context.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
        context.textBaseline = 'top';
        context.textAlign = 'center';
        const setAlignment = (baseline = 'top') => {
            const ty = baseline === 'bottom' ? canvas.height : 0;
            context.setTransform(1, 0, 0, 1, 0, ty);
            context.textBaseline = baseline;
        };
        const updateText = (text) => {
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.fillText(text, canvas.width / 2, padding, canvas.width);
        };
        const computeLineHeight = () => {
            const letter = 'A';
            setAlignment('bottom');
            const gutter = canvas.height - measureBottom(letter);
            setAlignment('top');
            return measureBottom(letter) + gutter;
        };
        const getPixels = (text) => {
            updateText(text);
            return context.getImageData(0, 0, canvas.width, canvas.height).data;
        };
        const getFirstIndex = (pixels) => {
            for (let i = 3, n = pixels.length; i < n; i += 4) {
                if (pixels[i] > 0)
                    return (i - 3) / 4;
            }
            return pixels.length;
        };
        const getLastIndex = (pixels) => {
            for (let i = pixels.length - 1; i >= 3; i -= 4) {
                if (pixels[i] > 0)
                    return i / 4;
            }
            return 0;
        };
        const normalize = (metrics, fontSize, origin) => {
            const result = {};
            const offset = metrics[origin];
            for (const key in metrics) {
                result[key] = (metrics[key] - offset) / fontSize;
            }
            return result;
        };
        const measureTop = (text) => Math.round(getFirstIndex(getPixels(text)) / canvas.width) - padding;
        const measureBottom = (text) => Math.round(getLastIndex(getPixels(text)) / canvas.width) - padding;
        const getMetrics = (chars = basicChars) => ({
            capHeight: measureTop(chars.capHeight),
            baseline: measureBottom(chars.baseline),
            xHeight: measureTop(chars.xHeight),
            descent: measureBottom(chars.descent),
            bottom: computeLineHeight(),
            ascent: measureTop(chars.ascent),
            tittle: measureTop(chars.tittle),
            top: 0
        });
        return normalize(getMetrics(), fontSize, origin);
    }
    async _initResizeObserver() {
        await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
        const columnCount = parseInt(this.columnCount);
        const columnWidth = parseFloat(getComputedStyle(this).getPropertyValue('--column-width'));
        const columnGap = parseFloat(getComputedStyle(this).getPropertyValue('--column-gap'));
        this.breakpoints = [];
        for (let i = 1; i <= columnCount; i++) {
            this.breakpoints.push(columnWidth * i + columnGap * (i - 1));
        }
        this.breakpoints.reverse();
        this.resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const width = entry.contentRect.width;
                const currentIndex = this.breakpoints.findIndex((bp) => bp <= width);
                const maxWidth = this.breakpoints.at(currentIndex) ?? this.breakpoints.at(-1);
                if (this.articleEl.style.maxWidth !== `${maxWidth}px`) {
                    this.articleEl.style.maxWidth = `${maxWidth}px`;
                }
            }
        });
        this.resizeObserver.observe(this);
    }
    _rusHyphenate(text) {
        const all = '[абвгдеёжзийклмнопрстуфхцчшщъыьэюя]';
        const vowel = '[аеёиоуыэюя]';
        const consonant = '[бвгджзклмнпрстфхцчшщ]';
        const zn = '[йъь]';
        const shy = '\u00AD';
        const hyp = [
            new RegExp(`(${zn})(${all}${all})`, 'ig'),
            new RegExp(`(${vowel})(${vowel}${all})`, 'ig'),
            new RegExp(`(${vowel}${consonant})(${consonant}${vowel})`, 'ig'),
            new RegExp(`(${consonant}${vowel})(${consonant}${vowel})`, 'ig'),
            new RegExp(`(${vowel}${consonant})(${consonant}${consonant}${vowel})`, 'ig'),
            new RegExp(`(${vowel}${consonant}${consonant})(${consonant}${consonant}${vowel})`, 'ig')
        ];
        let result = text;
        for (const rule of hyp) {
            while (rule.test(result)) {
                result = result.replaceAll(rule, `$1${shy}$2`);
            }
        }
        return result;
    }
    _noBreakPrepositions(text) {
        const nbsp = '\u00A0';
        return text.replace(/(\s)(о|в|во|с|к|но|он|из|на|со|и|для|у|как|а|или|без)(\s)([("«А-яЁёЙй])/gimu, `$1$2${nbsp}$4`);
    }
    async _getOptimalLineWidth(paragraph, charsPerLine) {
        await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
        const p = paragraph.cloneNode();
        p.textContent = '';
        p.style.whiteSpace = 'nowrap';
        p.style.width = 'fit-content';
        p.style.position = 'absolute';
        p.style.visibility = 'hidden';
        this.appendChild(p);
        const text = paragraph.textContent?.replace(/\u00AD/g, '') ?? '';
        p.textContent = text.slice(0, charsPerLine).padEnd(charsPerLine, 'а');
        const width = p.offsetWidth;
        this.removeChild(p);
        return width;
    }
    _wrapImages() {
        const images = this.querySelectorAll('img');
        const lineHeight = parseFloat(this.lineHeight);
        images.forEach((img) => {
            if (img.closest('figure'))
                return;
            const float = img.getAttribute('image-float');
            const caption = img.getAttribute('image-caption');
            // const span = img.getAttribute('image-span')
            const figure = document.createElement('figure');
            img.replaceWith(figure);
            figure.appendChild(img);
            // Set object-fit and object-position
            img.style.width = '100%';
            img.style.display = 'block';
            img.style.objectFit = img.getAttribute('object-fit') || 'cover';
            img.style.objectPosition = img.getAttribute('object-position') || 'center';
            if (!float) {
                img.style.display = 'block';
                img.style.marginLeft = 'auto';
                img.style.marginRight = 'auto';
            }
            // Adjust height to align with line-height multiple
            if (img.complete) {
                this._adjustImageHeight(img, lineHeight);
            }
            else {
                img.addEventListener('load', () => this._adjustImageHeight(img, lineHeight));
            }
            if (caption) {
                const figcaption = document.createElement('figcaption');
                figcaption.textContent = caption;
                figcaption.style.textAlign = 'center';
                figcaption.style.fontFamily = getComputedStyle(this).fontFamily;
                figcaption.style.fontSize = `${Math.round(parseFloat(this.fontSize) * 0.85)}px`;
                figcaption.style.lineHeight = this.lineHeight;
                figcaption.style.marginTop = `${this.baseBottomOffset}px`;
                figure.appendChild(figcaption);
            }
            // if (span === 'all') {
            //   figure.style.breakInside = 'avoid'
            //   figure.style.columnSpan = 'all'
            // }
            figure.style.paddingTop = `${this.baseTopOffset}px`;
            figure.style.marginBottom = this.lineHeight;
            if (!float) {
                if (this.getBoundingClientRect().top == figure.getBoundingClientRect().top ||
                    figure.previousElementSibling?.tagName == 'H1') {
                    figure.style.marginTop = `0px`;
                }
                else {
                    figure.style.marginTop = this.lineHeight;
                }
                this._removeSpaceBetweenImageAndParagraph(figure, figure.previousElementSibling);
            }
            else if (float === 'left') {
                figure.style.marginRight = this.lineHeight;
            }
            else if (float === 'right') {
                figure.style.marginLeft = this.lineHeight;
            }
            if (float === 'left' || float === 'right') {
                figure.style.cssFloat = float;
                figure.style.maxWidth = '30%';
            }
            else {
                figure.style.maxWidth = '100%';
            }
        });
    }
    _adjustImageHeight(img, lineHeight) {
        requestAnimationFrame(() => {
            let adjustedHeight = 0;
            if (img.getAttribute('image-float') || !img.getAttribute('height')) {
                const width = img.offsetWidth;
                if (width === 0 || !img.isConnected)
                    return;
                const ratio = img.naturalHeight / img.naturalWidth;
                const rawHeight = ratio * width;
                const lines = Math.round((img.getAttribute('object-fit') === 'contain'
                    ? rawHeight
                    : img.height < rawHeight
                        ? img.height
                        : rawHeight) / lineHeight);
                adjustedHeight = lines * lineHeight;
            }
            else {
                const lines = Math.round(img.height / lineHeight);
                adjustedHeight = lines * lineHeight;
            }
            img.style.height = `${adjustedHeight - this.baseTopOffset - this.baseBottomOffset}px`;
        });
    }
    _removeSpaceBetweenImageAndParagraph(figure, previousParagraph) {
        if (previousParagraph && this.getBoundingClientRect().y != figure.getBoundingClientRect().y) {
            previousParagraph.style.marginBottom = '0px';
        }
    }
    _prepareHeading(heading) {
        heading.textContent = this._noBreakPrepositions(this._rusHyphenate(heading.textContent ?? ''));
        heading.style.hyphens = 'none';
        const align = heading.getAttribute('heading-align');
        const size = heading.getAttribute('heading-size');
        const span = heading.getAttribute('heading-span');
        const fontSize = parseFloat(this.fontSize);
        const lineHeight = parseFloat(this.lineHeight);
        let verticalShift = this.fontMetrics.descent * lineHeight;
        if (align === 'center') {
            heading.style.textAlign = 'center';
        }
        else {
            heading.style.textAlign = 'left';
        }
        switch (size) {
            case 'sm':
                heading.style.fontSize = `${fontSize}px`;
                heading.style.lineHeight = `${lineHeight}px`;
                verticalShift = verticalShift > 5 ? verticalShift - 5 : 0;
                break;
            case 'md':
                heading.style.fontSize = `${fontSize * 2}px`;
                heading.style.lineHeight = `${lineHeight * 2}px`;
                verticalShift += 2;
                break;
            case 'lg':
                heading.style.fontSize = `${fontSize * 3}px`;
                heading.style.lineHeight = `${lineHeight * 3}px`;
                heading.style.marginTop = `-${lineHeight}px`;
                verticalShift += 9;
                break;
        }
        if (span === 'all') {
            heading.style.columnSpan = 'all';
        }
        heading.style.paddingTop = `${verticalShift}px`;
        heading.style.paddingBottom = `${parseFloat(this.lineHeight) - verticalShift}px`;
    }
};
TypoText.styles = css `
    :host {
      display: block;
      font-family: Verdana;
      text-align: var(--text-align, left);
      font-size: var(--base-font-size, 12px);
      text-rendering: geometricPrecision;

      --column-count: 1;
      --column-width: 400px;
      --column-gap: calc(var(--base-font-size) * 2.75);
      --base-line-height: calc(var(--base-font-size) * 1.2);
    }

    article {
      width: 100%;
      margin: 0 auto;
      column-count: var(--column-count);
      column-width: var(--column-width);
      column-gap: var(--column-gap);
      line-height: var(--base-line-height);
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
  `;
__decorate([
    property({ type: String, attribute: 'font-size' })
], TypoText.prototype, "fontSize", void 0);
__decorate([
    property({ type: String, attribute: 'text-align' })
], TypoText.prototype, "textAlign", void 0);
__decorate([
    property({ type: String, attribute: 'line-height' })
], TypoText.prototype, "lineHeight", void 0);
__decorate([
    property({ type: String, attribute: 'column-width' })
], TypoText.prototype, "columnWidth", void 0);
__decorate([
    property({ type: String, attribute: 'column-count' })
], TypoText.prototype, "columnCount", void 0);
__decorate([
    property({ type: String, attribute: 'column-gap' })
], TypoText.prototype, "columnGap", void 0);
__decorate([
    property({ type: String, attribute: 'chars-per-line' })
], TypoText.prototype, "charsPerLine", void 0);
__decorate([
    query('article')
], TypoText.prototype, "articleEl", void 0);
TypoText = __decorate([
    customElement('typo-text')
], TypoText);
export { TypoText };
//# sourceMappingURL=typo-text.js.map