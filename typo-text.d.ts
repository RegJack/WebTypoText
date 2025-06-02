import { LitElement } from 'lit';
export declare class TypoText extends LitElement {
    static styles: import("lit").CSSResult;
    fontSize: string;
    textAlign: string;
    lineHeight: string;
    columnWidth: string;
    columnCount: string;
    columnGap: string;
    charsPerLine: string;
    private articleEl;
    private fontMetrics;
    private baseTopOffset;
    private baseBottomOffset;
    private resizeObserver;
    private breakpoints;
    updated(changedProps: Map<string, unknown>): void;
    render(): import("lit-html").TemplateResult<1>;
    private _checkIsUnitSet;
    firstUpdated(): Promise<void>;
    private _getFontMetrics;
    private _initResizeObserver;
    private _rusHyphenate;
    private _noBreakPrepositions;
    private _getOptimalLineWidth;
    private _wrapImages;
    private _adjustImageHeight;
    _removeSpaceBetweenImageAndParagraph(figure: HTMLElement, previousParagraph: HTMLElement | null): void;
    private _prepareHeading;
}
declare global {
    interface HTMLElementTagNameMap {
        'typo-text': TypoText;
    }
}
//# sourceMappingURL=typo-text.d.ts.map