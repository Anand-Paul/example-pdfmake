var PdfViewerComponent_1;
import { __decorate } from "tslib";
/**
 * Created by vadimdez on 21/06/16.
 */
import { Component, Input, Output, ElementRef, EventEmitter, OnChanges, SimpleChanges, OnInit, HostListener, OnDestroy, ViewChild, AfterViewChecked } from '@angular/core';
import { createEventBus } from '../utils/event-bus-utils';
let PDFJS;
let PDFJSViewer;
function isSSR() {
    return typeof window === 'undefined';
}
if (!isSSR()) {
    PDFJS = require('pdfjs-dist/build/pdf');
    PDFJSViewer = require('pdfjs-dist/web/pdf_viewer');
    PDFJS.verbosity = PDFJS.VerbosityLevel.ERRORS;
}
export var RenderTextMode;
(function (RenderTextMode) {
    RenderTextMode[RenderTextMode["DISABLED"] = 0] = "DISABLED";
    RenderTextMode[RenderTextMode["ENABLED"] = 1] = "ENABLED";
    RenderTextMode[RenderTextMode["ENHANCED"] = 2] = "ENHANCED";
})(RenderTextMode || (RenderTextMode = {}));
let PdfViewerComponent = PdfViewerComponent_1 = class PdfViewerComponent {
    constructor(element) {
        this.element = element;
        this.isVisible = false;
        this._cMapsUrl = typeof PDFJS !== 'undefined'
            ? `https://unpkg.com/pdfjs-dist@${PDFJS.version}/cmaps/`
            : null;
        this._renderText = true;
        this._renderTextMode = RenderTextMode.ENABLED;
        this._stickToPage = false;
        this._originalSize = true;
        this._page = 1;
        this._zoom = 1;
        this._zoomScale = 'page-width';
        this._rotation = 0;
        this._showAll = true;
        this._canAutoResize = true;
        this._fitToPage = false;
        this._externalLinkTarget = 'blank';
        this._showBorders = false;
        this.isInitialized = false;
        this.afterLoadComplete = new EventEmitter();
        this.pageRendered = new EventEmitter();
        this.textLayerRendered = new EventEmitter();
        this.onError = new EventEmitter();
        this.onProgress = new EventEmitter();
        this.pageChange = new EventEmitter(true);
        if (isSSR()) {
            return;
        }
        let pdfWorkerSrc;
        if (window.hasOwnProperty('pdfWorkerSrc') &&
            typeof window.pdfWorkerSrc === 'string' &&
            window.pdfWorkerSrc) {
            pdfWorkerSrc = window.pdfWorkerSrc;
        }
        else {
            pdfWorkerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS.version}/pdf.worker.min.js`;
        }
        PDFJS.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;
    }
    set cMapsUrl(cMapsUrl) {
        this._cMapsUrl = cMapsUrl;
    }
    set page(_page) {
        _page = parseInt(_page, 10) || 1;
        const orginalPage = _page;
        if (this._pdf) {
            _page = this.getValidPageNumber(_page);
        }
        this._page = _page;
        if (orginalPage !== _page) {
            this.pageChange.emit(_page);
        }
    }
    set renderText(renderText) {
        this._renderText = renderText;
    }
    set renderTextMode(renderTextMode) {
        this._renderTextMode = renderTextMode;
    }
    set originalSize(originalSize) {
        this._originalSize = originalSize;
    }
    set showAll(value) {
        this._showAll = value;
    }
    set stickToPage(value) {
        this._stickToPage = value;
    }
    set zoom(value) {
        if (value <= 0) {
            return;
        }
        this._zoom = value;
    }
    get zoom() {
        return this._zoom;
    }
    set zoomScale(value) {
        this._zoomScale = value;
    }
    get zoomScale() {
        return this._zoomScale;
    }
    set rotation(value) {
        if (!(typeof value === 'number' && value % 90 === 0)) {
            console.warn('Invalid pages rotation angle.');
            return;
        }
        this._rotation = value;
    }
    set externalLinkTarget(value) {
        this._externalLinkTarget = value;
    }
    set autoresize(value) {
        this._canAutoResize = Boolean(value);
    }
    set fitToPage(value) {
        this._fitToPage = Boolean(value);
    }
    set showBorders(value) {
        this._showBorders = Boolean(value);
    }
    static getLinkTarget(type) {
        switch (type) {
            case 'blank':
                return PDFJS.LinkTarget.BLANK;
            case 'none':
                return PDFJS.LinkTarget.NONE;
            case 'self':
                return PDFJS.LinkTarget.SELF;
            case 'parent':
                return PDFJS.LinkTarget.PARENT;
            case 'top':
                return PDFJS.LinkTarget.TOP;
        }
        return null;
    }
    static setExternalLinkTarget(type) {
        const linkTarget = PdfViewerComponent_1.getLinkTarget(type);
        if (linkTarget !== null) {
            PDFJS.externalLinkTarget = linkTarget;
        }
    }
    ngAfterViewChecked() {
        if (this.isInitialized) {
            return;
        }
        const offset = this.pdfViewerContainer.nativeElement.offsetParent;
        if (this.isVisible === true && offset == null) {
            this.isVisible = false;
            return;
        }
        if (this.isVisible === false && offset != null) {
            this.isVisible = true;
            setTimeout(() => {
                this.ngOnInit();
                this.ngOnChanges({ src: this.src });
            });
        }
    }
    ngOnInit() {
        if (!isSSR() && this.isVisible) {
            this.isInitialized = true;
            this.setupMultiPageViewer();
            this.setupSinglePageViewer();
        }
    }
    ngOnDestroy() {
        this.clear();
    }
    onPageResize() {
        if (!this._canAutoResize || !this._pdf) {
            return;
        }
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        this.resizeTimeout = setTimeout(() => {
            this.updateSize();
        }, 100);
    }
    get pdfLinkService() {
        return this._showAll
            ? this.pdfMultiPageLinkService
            : this.pdfSinglePageLinkService;
    }
    get pdfViewer() {
        return this.getCurrentViewer();
    }
    get pdfFindController() {
        return this._showAll
            ? this.pdfMultiPageFindController
            : this.pdfSinglePageFindController;
    }
    ngOnChanges(changes) {
        if (isSSR() || !this.isVisible) {
            return;
        }
        if ('src' in changes) {
            this.loadPDF();
        }
        else if (this._pdf) {
            if ('renderText' in changes) {
                this.getCurrentViewer().textLayerMode = this._renderText
                    ? this._renderTextMode
                    : RenderTextMode.DISABLED;
                this.resetPdfDocument();
            }
            else if ('showAll' in changes) {
                this.resetPdfDocument();
            }
            if ('page' in changes) {
                if (changes['page'].currentValue === this._latestScrolledPage) {
                    return;
                }
                // New form of page changing: The viewer will now jump to the specified page when it is changed.
                // This behavior is introducedby using the PDFSinglePageViewer
                this.getCurrentViewer().scrollPageIntoView({ pageNumber: this._page });
            }
            this.update();
        }
    }
    updateSize() {
        const currentViewer = this.getCurrentViewer();
        this._pdf
            .getPage(currentViewer.currentPageNumber)
            .then((page) => {
            const rotation = this._rotation || page.rotate;
            const viewportWidth = page.getViewport({
                scale: this._zoom,
                rotation
            }).width * PdfViewerComponent_1.CSS_UNITS;
            let scale = this._zoom;
            let stickToPage = true;
            // Scale the document when it shouldn't be in original size or doesn't fit into the viewport
            if (!this._originalSize ||
                (this._fitToPage &&
                    viewportWidth > this.pdfViewerContainer.nativeElement.clientWidth)) {
                const viewPort = page.getViewport({ scale: 1, rotation });
                scale = this.getScale(viewPort.width, viewPort.height);
                stickToPage = !this._stickToPage;
            }
            currentViewer._setScale(scale, stickToPage);
        });
    }
    clear() {
        if (this.loadingTask && !this.loadingTask.destroyed) {
            this.loadingTask.destroy();
        }
        if (this._pdf) {
            this._pdf.destroy();
            this._pdf = null;
            this.pdfMultiPageViewer.setDocument(null);
            this.pdfSinglePageViewer.setDocument(null);
            this.pdfMultiPageLinkService.setDocument(null, null);
            this.pdfSinglePageLinkService.setDocument(null, null);
            this.pdfMultiPageFindController.setDocument(null);
            this.pdfSinglePageFindController.setDocument(null);
        }
    }
    setupMultiPageViewer() {
        PDFJS.disableTextLayer = !this._renderText;
        PdfViewerComponent_1.setExternalLinkTarget(this._externalLinkTarget);
        const eventBus = createEventBus(PDFJSViewer);
        eventBus.on('pagerendered', e => {
            this.pageRendered.emit(e);
        });
        eventBus.on('pagechanging', e => {
            if (this.pageScrollTimeout) {
                clearTimeout(this.pageScrollTimeout);
            }
            this.pageScrollTimeout = setTimeout(() => {
                this._latestScrolledPage = e.pageNumber;
                this.pageChange.emit(e.pageNumber);
            }, 100);
        });
        eventBus.on('textlayerrendered', e => {
            this.textLayerRendered.emit(e);
        });
        this.pdfMultiPageLinkService = new PDFJSViewer.PDFLinkService({ eventBus });
        this.pdfMultiPageFindController = new PDFJSViewer.PDFFindController({
            linkService: this.pdfMultiPageLinkService,
            eventBus
        });
        const pdfOptions = {
            eventBus: eventBus,
            container: this.element.nativeElement.querySelector('div'),
            removePageBorders: !this._showBorders,
            linkService: this.pdfMultiPageLinkService,
            textLayerMode: this._renderText
                ? this._renderTextMode
                : RenderTextMode.DISABLED,
            findController: this.pdfMultiPageFindController
        };
        this.pdfMultiPageViewer = new PDFJSViewer.PDFViewer(pdfOptions);
        this.pdfMultiPageLinkService.setViewer(this.pdfMultiPageViewer);
        this.pdfMultiPageFindController.setDocument(this._pdf);
    }
    setupSinglePageViewer() {
        PDFJS.disableTextLayer = !this._renderText;
        PdfViewerComponent_1.setExternalLinkTarget(this._externalLinkTarget);
        const eventBus = createEventBus(PDFJSViewer);
        eventBus.on('pagechanging', e => {
            if (e.pageNumber != this._page) {
                this.page = e.pageNumber;
            }
        });
        eventBus.on('pagerendered', e => {
            this.pageRendered.emit(e);
        });
        eventBus.on('textlayerrendered', e => {
            this.textLayerRendered.emit(e);
        });
        this.pdfSinglePageLinkService = new PDFJSViewer.PDFLinkService({
            eventBus
        });
        this.pdfSinglePageFindController = new PDFJSViewer.PDFFindController({
            linkService: this.pdfSinglePageLinkService,
            eventBus
        });
        const pdfOptions = {
            eventBus: eventBus,
            container: this.element.nativeElement.querySelector('div'),
            removePageBorders: !this._showBorders,
            linkService: this.pdfSinglePageLinkService,
            textLayerMode: this._renderText
                ? this._renderTextMode
                : RenderTextMode.DISABLED,
            findController: this.pdfSinglePageFindController
        };
        this.pdfSinglePageViewer = new PDFJSViewer.PDFSinglePageViewer(pdfOptions);
        this.pdfSinglePageLinkService.setViewer(this.pdfSinglePageViewer);
        this.pdfSinglePageFindController.setDocument(this._pdf);
        this.pdfSinglePageViewer._currentPageNumber = this._page;
    }
    getValidPageNumber(page) {
        if (page < 1) {
            return 1;
        }
        if (page > this._pdf.numPages) {
            return this._pdf.numPages;
        }
        return page;
    }
    getDocumentParams() {
        const srcType = typeof this.src;
        if (!this._cMapsUrl) {
            return this.src;
        }
        const params = {
            cMapUrl: this._cMapsUrl,
            cMapPacked: true
        };
        if (srcType === 'string') {
            params.url = this.src;
        }
        else if (srcType === 'object') {
            if (this.src.byteLength !== undefined) {
                params.data = this.src;
            }
            else {
                Object.assign(params, this.src);
            }
        }
        return params;
    }
    loadPDF() {
        if (!this.src) {
            return;
        }
        if (this.lastLoaded === this.src) {
            this.update();
            return;
        }
        this.clear();
        this.loadingTask = PDFJS.getDocument(this.getDocumentParams());
        this.loadingTask.onProgress = (progressData) => {
            this.onProgress.emit(progressData);
        };
        const src = this.src;
        this.loadingTask.promise.then((pdf) => {
            this._pdf = pdf;
            this.lastLoaded = src;
            this.afterLoadComplete.emit(pdf);
            if (!this.pdfMultiPageViewer) {
                this.setupMultiPageViewer();
                this.setupSinglePageViewer();
            }
            this.resetPdfDocument();
            this.update();
        }, (error) => {
            this.onError.emit(error);
        });
    }
    update() {
        this.page = this._page;
        this.render();
    }
    render() {
        this._page = this.getValidPageNumber(this._page);
        const currentViewer = this.getCurrentViewer();
        if (this._rotation !== 0 ||
            currentViewer.pagesRotation !== this._rotation) {
            setTimeout(() => {
                currentViewer.pagesRotation = this._rotation;
            });
        }
        if (this._stickToPage) {
            setTimeout(() => {
                currentViewer.currentPageNumber = this._page;
            });
        }
        this.updateSize();
    }
    getScale(viewportWidth, viewportHeight) {
        const borderSize = (this._showBorders ? 2 * PdfViewerComponent_1.BORDER_WIDTH : 0);
        const pdfContainerWidth = this.pdfViewerContainer.nativeElement.clientWidth - borderSize;
        const pdfContainerHeight = this.pdfViewerContainer.nativeElement.clientHeight - borderSize;
        if (pdfContainerHeight === 0 || viewportHeight === 0 || pdfContainerWidth === 0 || viewportWidth === 0) {
            return 1;
        }
        let ratio = 1;
        switch (this._zoomScale) {
            case 'page-fit':
                ratio = Math.min((pdfContainerHeight / viewportHeight), (pdfContainerWidth / viewportWidth));
                break;
            case 'page-height':
                ratio = (pdfContainerHeight / viewportHeight);
                break;
            case 'page-width':
            default:
                ratio = (pdfContainerWidth / viewportWidth);
                break;
        }
        return (this._zoom * ratio) / PdfViewerComponent_1.CSS_UNITS;
    }
    getCurrentViewer() {
        return this._showAll ? this.pdfMultiPageViewer : this.pdfSinglePageViewer;
    }
    resetPdfDocument() {
        this.pdfFindController.setDocument(this._pdf);
        if (this._showAll) {
            this.pdfSinglePageViewer.setDocument(null);
            this.pdfSinglePageLinkService.setDocument(null);
            this.pdfMultiPageViewer.setDocument(this._pdf);
            this.pdfMultiPageLinkService.setDocument(this._pdf, null);
        }
        else {
            this.pdfMultiPageViewer.setDocument(null);
            this.pdfMultiPageLinkService.setDocument(null);
            this.pdfSinglePageViewer.setDocument(this._pdf);
            this.pdfSinglePageLinkService.setDocument(this._pdf, null);
        }
    }
};
PdfViewerComponent.CSS_UNITS = 96.0 / 72.0;
PdfViewerComponent.BORDER_WIDTH = 9;
PdfViewerComponent.ctorParameters = () => [
    { type: ElementRef }
];
__decorate([
    ViewChild('pdfViewerContainer')
], PdfViewerComponent.prototype, "pdfViewerContainer", void 0);
__decorate([
    Output('after-load-complete')
], PdfViewerComponent.prototype, "afterLoadComplete", void 0);
__decorate([
    Output('page-rendered')
], PdfViewerComponent.prototype, "pageRendered", void 0);
__decorate([
    Output('text-layer-rendered')
], PdfViewerComponent.prototype, "textLayerRendered", void 0);
__decorate([
    Output('error')
], PdfViewerComponent.prototype, "onError", void 0);
__decorate([
    Output('on-progress')
], PdfViewerComponent.prototype, "onProgress", void 0);
__decorate([
    Output()
], PdfViewerComponent.prototype, "pageChange", void 0);
__decorate([
    Input()
], PdfViewerComponent.prototype, "src", void 0);
__decorate([
    Input('c-maps-url')
], PdfViewerComponent.prototype, "cMapsUrl", null);
__decorate([
    Input('page')
], PdfViewerComponent.prototype, "page", null);
__decorate([
    Input('render-text')
], PdfViewerComponent.prototype, "renderText", null);
__decorate([
    Input('render-text-mode')
], PdfViewerComponent.prototype, "renderTextMode", null);
__decorate([
    Input('original-size')
], PdfViewerComponent.prototype, "originalSize", null);
__decorate([
    Input('show-all')
], PdfViewerComponent.prototype, "showAll", null);
__decorate([
    Input('stick-to-page')
], PdfViewerComponent.prototype, "stickToPage", null);
__decorate([
    Input('zoom')
], PdfViewerComponent.prototype, "zoom", null);
__decorate([
    Input('zoom-scale')
], PdfViewerComponent.prototype, "zoomScale", null);
__decorate([
    Input('rotation')
], PdfViewerComponent.prototype, "rotation", null);
__decorate([
    Input('external-link-target')
], PdfViewerComponent.prototype, "externalLinkTarget", null);
__decorate([
    Input('autoresize')
], PdfViewerComponent.prototype, "autoresize", null);
__decorate([
    Input('fit-to-page')
], PdfViewerComponent.prototype, "fitToPage", null);
__decorate([
    Input('show-borders')
], PdfViewerComponent.prototype, "showBorders", null);
__decorate([
    HostListener('window:resize', [])
], PdfViewerComponent.prototype, "onPageResize", null);
PdfViewerComponent = PdfViewerComponent_1 = __decorate([
    Component({
        selector: 'pdf-viewer',
        template: `
    <div #pdfViewerContainer class="ng2-pdf-viewer-container">
      <div class="pdfViewer"></div>
    </div>
  `,
        styles: [".ng2-pdf-viewer-container{overflow-x:auto;position:relative;height:100%;-webkit-overflow-scrolling:touch}:host ::ng-deep .textLayer{position:absolute;left:0;top:0;right:0;bottom:0;overflow:hidden;opacity:.2;line-height:1}:host ::ng-deep .textLayer>span{color:transparent;position:absolute;white-space:pre;cursor:text;-webkit-transform-origin:0 0;transform-origin:0 0}:host ::ng-deep .textLayer .highlight{margin:-1px;padding:1px;background-color:#b400aa;border-radius:4px}:host ::ng-deep .textLayer .highlight.begin{border-radius:4px 0 0 4px}:host ::ng-deep .textLayer .highlight.end{border-radius:0 4px 4px 0}:host ::ng-deep .textLayer .highlight.middle{border-radius:0}:host ::ng-deep .textLayer .highlight.selected{background-color:#006400}:host ::ng-deep .textLayer ::-moz-selection{background:#00f}:host ::ng-deep .textLayer ::selection{background:#00f}:host ::ng-deep .textLayer .endOfContent{display:block;position:absolute;left:0;top:100%;right:0;bottom:0;z-index:-1;cursor:default;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}:host ::ng-deep .textLayer .endOfContent.active{top:0}:host ::ng-deep .annotationLayer section{position:absolute}:host ::ng-deep .annotationLayer .buttonWidgetAnnotation.pushButton>a,:host ::ng-deep .annotationLayer .linkAnnotation>a{position:absolute;font-size:1em;top:0;left:0;width:100%;height:100%}:host ::ng-deep .annotationLayer .buttonWidgetAnnotation.pushButton>a:hover,:host ::ng-deep .annotationLayer .linkAnnotation>a:hover{opacity:.2;background:#ff0;box-shadow:0 2px 10px #ff0}:host ::ng-deep .annotationLayer .textAnnotation img{position:absolute;cursor:pointer}:host ::ng-deep .annotationLayer .textWidgetAnnotation input,:host ::ng-deep .annotationLayer .textWidgetAnnotation textarea{background-color:rgba(0,54,255,.13);border:1px solid transparent;box-sizing:border-box;font-size:9px;height:100%;margin:0;padding:0 3px;vertical-align:top;width:100%}:host ::ng-deep .annotationLayer .choiceWidgetAnnotation select{background-color:rgba(0,54,255,.13);border:1px solid transparent;box-sizing:border-box;font-size:9px;height:100%;margin:0;padding:0 3px;vertical-align:top;width:100%}:host ::ng-deep .annotationLayer .buttonWidgetAnnotation.checkBox input,:host ::ng-deep .annotationLayer .buttonWidgetAnnotation.radioButton input{background-color:rgba(0,54,255,.13);border:1px solid transparent;box-sizing:border-box;font-size:9px;height:100%;margin:0;vertical-align:top;width:100%}:host ::ng-deep .annotationLayer .choiceWidgetAnnotation select option{padding:0}:host ::ng-deep .annotationLayer .buttonWidgetAnnotation.radioButton input{border-radius:50%}:host ::ng-deep .annotationLayer .textWidgetAnnotation textarea{font:message-box;font-size:9px;resize:none}:host ::ng-deep .annotationLayer .textWidgetAnnotation input[disabled],:host ::ng-deep .annotationLayer .textWidgetAnnotation textarea[disabled]{background:0 0;border:1px solid transparent;cursor:not-allowed}:host ::ng-deep .annotationLayer .choiceWidgetAnnotation select[disabled]{background:0 0;border:1px solid transparent;cursor:not-allowed}:host ::ng-deep .annotationLayer .buttonWidgetAnnotation.checkBox input[disabled],:host ::ng-deep .annotationLayer .buttonWidgetAnnotation.radioButton input[disabled]{background:0 0;border:1px solid transparent;cursor:not-allowed}:host ::ng-deep .annotationLayer .textWidgetAnnotation input:hover,:host ::ng-deep .annotationLayer .textWidgetAnnotation textarea:hover{border:1px solid #000}:host ::ng-deep .annotationLayer .choiceWidgetAnnotation select:hover{border:1px solid #000}:host ::ng-deep .annotationLayer .buttonWidgetAnnotation.checkBox input:hover,:host ::ng-deep .annotationLayer .buttonWidgetAnnotation.radioButton input:hover{border:1px solid #000}:host ::ng-deep .annotationLayer .textWidgetAnnotation input:focus,:host ::ng-deep .annotationLayer .textWidgetAnnotation textarea:focus{background:0 0;border:1px solid transparent}:host ::ng-deep .annotationLayer .choiceWidgetAnnotation select:focus{background:0 0;border:1px solid transparent}:host ::ng-deep .annotationLayer .buttonWidgetAnnotation.checkBox input:checked:after,:host ::ng-deep .annotationLayer .buttonWidgetAnnotation.checkBox input:checked:before{background-color:#000;content:\"\";display:block;position:absolute;height:80%;left:45%;width:1px}:host ::ng-deep .annotationLayer .buttonWidgetAnnotation.radioButton input:checked:before{background-color:#000;content:\"\";display:block;position:absolute;border-radius:50%;height:50%;left:30%;top:20%;width:50%}:host ::ng-deep .annotationLayer .buttonWidgetAnnotation.checkBox input:checked:before{-webkit-transform:rotate(45deg);transform:rotate(45deg)}:host ::ng-deep .annotationLayer .buttonWidgetAnnotation.checkBox input:checked:after{-webkit-transform:rotate(-45deg);transform:rotate(-45deg)}:host ::ng-deep .annotationLayer .textWidgetAnnotation input.comb{font-family:monospace;padding-left:2px;padding-right:0}:host ::ng-deep .annotationLayer .textWidgetAnnotation input.comb:focus{width:115%}:host ::ng-deep .annotationLayer .buttonWidgetAnnotation.checkBox input,:host ::ng-deep .annotationLayer .buttonWidgetAnnotation.radioButton input{-webkit-appearance:none;-moz-appearance:none;appearance:none;padding:0}:host ::ng-deep .annotationLayer .popupWrapper{position:absolute;width:20em}:host ::ng-deep .annotationLayer .popup{position:absolute;z-index:200;max-width:20em;background-color:#ff9;box-shadow:0 2px 5px #888;border-radius:2px;padding:6px;margin-left:5px;cursor:pointer;font:message-box;font-size:9px;word-wrap:break-word}:host ::ng-deep .annotationLayer .popup>*{font-size:9px}:host ::ng-deep .annotationLayer .popup h1{display:inline-block}:host ::ng-deep .annotationLayer .popup span{display:inline-block;margin-left:5px}:host ::ng-deep .annotationLayer .popup p{border-top:1px solid #333;margin-top:2px;padding-top:2px}:host ::ng-deep .annotationLayer .caretAnnotation,:host ::ng-deep .annotationLayer .circleAnnotation svg ellipse,:host ::ng-deep .annotationLayer .fileAttachmentAnnotation,:host ::ng-deep .annotationLayer .freeTextAnnotation,:host ::ng-deep .annotationLayer .highlightAnnotation,:host ::ng-deep .annotationLayer .inkAnnotation svg polyline,:host ::ng-deep .annotationLayer .lineAnnotation svg line,:host ::ng-deep .annotationLayer .polygonAnnotation svg polygon,:host ::ng-deep .annotationLayer .polylineAnnotation svg polyline,:host ::ng-deep .annotationLayer .squareAnnotation svg rect,:host ::ng-deep .annotationLayer .squigglyAnnotation,:host ::ng-deep .annotationLayer .stampAnnotation,:host ::ng-deep .annotationLayer .strikeoutAnnotation,:host ::ng-deep .annotationLayer .underlineAnnotation{cursor:pointer}:host ::ng-deep .pdfViewer{padding-bottom:10px}:host ::ng-deep .pdfViewer .canvasWrapper{overflow:hidden}:host ::ng-deep .pdfViewer .page{direction:ltr;width:816px;height:1056px;margin:1px auto -8px;position:relative;overflow:visible;border:9px solid rgba(0,0,0,.01);box-sizing:initial;background-clip:content-box;-webkit-border-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAATCAQAAADYWf5HAAAA6UlEQVR4Xl2Pi2rEMAwE16fm1f7/r14v7w4rI0IzLAF7hLxNevBSEMEF5+OilNCsRd8ZMyn+a4NmsOT8WJw1lFbSYgGFzF2bLFoLjTClWjKKGRWpDYAGXUnZ4uhbBUzF3Oe/GG/ue2fn4GgsyXhNgysV2JnrhKEMg4fEZcALmiKbNhBBRFpSyDOj1G4QOVly6O1FV54ZZq8OVygrciDt6JazRgi1ljTPH0gbrPmHPXAbCiDd4GawIjip1TPh9tt2sz24qaCjr/jAb/GBFTbq9KZ7Ke/Cqt8nayUikZKsWZK7Fe6bg5dOUt8fZHWG2BHc+6EAAAAASUVORK5CYII=) 9 9 repeat;-o-border-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAATCAQAAADYWf5HAAAA6UlEQVR4Xl2Pi2rEMAwE16fm1f7/r14v7w4rI0IzLAF7hLxNevBSEMEF5+OilNCsRd8ZMyn+a4NmsOT8WJw1lFbSYgGFzF2bLFoLjTClWjKKGRWpDYAGXUnZ4uhbBUzF3Oe/GG/ue2fn4GgsyXhNgysV2JnrhKEMg4fEZcALmiKbNhBBRFpSyDOj1G4QOVly6O1FV54ZZq8OVygrciDt6JazRgi1ljTPH0gbrPmHPXAbCiDd4GawIjip1TPh9tt2sz24qaCjr/jAb/GBFTbq9KZ7Ke/Cqt8nayUikZKsWZK7Fe6bg5dOUt8fZHWG2BHc+6EAAAAASUVORK5CYII=) 9 9 repeat;border-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAATCAQAAADYWf5HAAAA6UlEQVR4Xl2Pi2rEMAwE16fm1f7/r14v7w4rI0IzLAF7hLxNevBSEMEF5+OilNCsRd8ZMyn+a4NmsOT8WJw1lFbSYgGFzF2bLFoLjTClWjKKGRWpDYAGXUnZ4uhbBUzF3Oe/GG/ue2fn4GgsyXhNgysV2JnrhKEMg4fEZcALmiKbNhBBRFpSyDOj1G4QOVly6O1FV54ZZq8OVygrciDt6JazRgi1ljTPH0gbrPmHPXAbCiDd4GawIjip1TPh9tt2sz24qaCjr/jAb/GBFTbq9KZ7Ke/Cqt8nayUikZKsWZK7Fe6bg5dOUt8fZHWG2BHc+6EAAAAASUVORK5CYII=) 9 9 repeat;background-color:#fff}:host ::ng-deep .pdfViewer.removePageBorders .page{margin:0 auto 10px;border:none}:host ::ng-deep .pdfViewer.removePageBorders{padding-bottom:0}:host ::ng-deep .pdfViewer.singlePageView{display:inline-block}:host ::ng-deep .pdfViewer.singlePageView .page{margin:0;border:none}:host ::ng-deep .pdfViewer.scrollHorizontal,:host ::ng-deep .pdfViewer.scrollWrapped{margin-left:3.5px;margin-right:3.5px;text-align:center}:host ::ng-deep .spread{margin-left:3.5px;margin-right:3.5px;text-align:center}:host ::ng-deep .pdfViewer.scrollHorizontal,:host ::ng-deep .spread{white-space:nowrap}:host ::ng-deep .pdfViewer.removePageBorders,:host ::ng-deep .pdfViewer.scrollHorizontal .spread,:host ::ng-deep .pdfViewer.scrollWrapped .spread{margin-left:0;margin-right:0}:host ::ng-deep .spread .page{display:inline-block;vertical-align:middle;margin-left:-3.5px;margin-right:-3.5px}:host ::ng-deep .pdfViewer.scrollHorizontal .page,:host ::ng-deep .pdfViewer.scrollHorizontal .spread,:host ::ng-deep .pdfViewer.scrollWrapped .page,:host ::ng-deep .pdfViewer.scrollWrapped .spread{display:inline-block;vertical-align:middle}:host ::ng-deep .pdfViewer.scrollHorizontal .page,:host ::ng-deep .pdfViewer.scrollWrapped .page{margin-left:-3.5px;margin-right:-3.5px}:host ::ng-deep .pdfViewer.removePageBorders .spread .page,:host ::ng-deep .pdfViewer.removePageBorders.scrollHorizontal .page,:host ::ng-deep .pdfViewer.removePageBorders.scrollWrapped .page{margin-left:5px;margin-right:5px}:host ::ng-deep .pdfViewer .page canvas{margin:0;display:block}:host ::ng-deep .pdfViewer .page canvas[hidden]{display:none}:host ::ng-deep .pdfViewer .page .loadingIcon{position:absolute;display:block;left:0;top:0;right:0;bottom:0;background:url(data:image/gif;base64,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) center no-repeat}:host ::ng-deep .pdfPresentationMode .pdfViewer{margin-left:0;margin-right:0}:host ::ng-deep .pdfPresentationMode .pdfViewer .page,:host ::ng-deep .pdfPresentationMode .pdfViewer .spread{display:block}:host ::ng-deep .pdfPresentationMode .pdfViewer .page,:host ::ng-deep .pdfPresentationMode .pdfViewer.removePageBorders .page{margin-left:auto;margin-right:auto}:host ::ng-deep .pdfPresentationMode:-ms-fullscreen .pdfViewer .page{margin-bottom:100%!important}:host ::ng-deep .pdfPresentationMode:-webkit-full-screen .pdfViewer .page{margin-bottom:100%;border:0}:host ::ng-deep .pdfPresentationMode:-moz-full-screen .pdfViewer .page,:host ::ng-deep .pdfPresentationMode:-webkit-full-screen .pdfViewer .page,:host ::ng-deep .pdfPresentationMode:fullscreen .pdfViewer .page{margin-bottom:100%;border:0}"]
    })
], PdfViewerComponent);
export { PdfViewerComponent };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGRmLXZpZXdlci5jb21wb25lbnQuanMiLCJzb3VyY2VSb290Ijoibmc6Ly9uZzItcGRmLXZpZXdlci8iLCJzb3VyY2VzIjpbInNyYy9hcHAvcGRmLXZpZXdlci9wZGYtdmlld2VyLmNvbXBvbmVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOztHQUVHO0FBQ0gsT0FBTyxFQUNMLFNBQVMsRUFDVCxLQUFLLEVBQ0wsTUFBTSxFQUNOLFVBQVUsRUFDVixZQUFZLEVBQ1osU0FBUyxFQUNULGFBQWEsRUFDYixNQUFNLEVBQ04sWUFBWSxFQUNaLFNBQVMsRUFDVCxTQUFTLEVBQ1QsZ0JBQWdCLEVBQ2pCLE1BQU0sZUFBZSxDQUFDO0FBVXZCLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSwwQkFBMEIsQ0FBQztBQUUxRCxJQUFJLEtBQVUsQ0FBQztBQUNmLElBQUksV0FBZ0IsQ0FBQztBQUVyQixTQUFTLEtBQUs7SUFDWixPQUFPLE9BQU8sTUFBTSxLQUFLLFdBQVcsQ0FBQztBQUN2QyxDQUFDO0FBRUQsSUFBSSxDQUFDLEtBQUssRUFBRSxFQUFFO0lBQ1osS0FBSyxHQUFHLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO0lBQ3hDLFdBQVcsR0FBRyxPQUFPLENBQUMsMkJBQTJCLENBQUMsQ0FBQztJQUVuRCxLQUFLLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDO0NBQy9DO0FBRUQsTUFBTSxDQUFOLElBQVksY0FJWDtBQUpELFdBQVksY0FBYztJQUN4QiwyREFBUSxDQUFBO0lBQ1IseURBQU8sQ0FBQTtJQUNQLDJEQUFRLENBQUE7QUFDVixDQUFDLEVBSlcsY0FBYyxLQUFkLGNBQWMsUUFJekI7QUFXRCxJQUFhLGtCQUFrQiwwQkFBL0IsTUFBYSxrQkFBa0I7SUFpTDdCLFlBQW9CLE9BQW1CO1FBQW5CLFlBQU8sR0FBUCxPQUFPLENBQVk7UUE5Sy9CLGNBQVMsR0FBWSxLQUFLLENBQUM7UUFhM0IsY0FBUyxHQUNm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a0JBQWtCLENBOGtCOUI7U0E5a0JZLGtCQUFrQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ3JlYXRlZCBieSB2YWRpbWRleiBvbiAyMS8wNi8xNi5cbiAqL1xuaW1wb3J0IHtcbiAgQ29tcG9uZW50LFxuICBJbnB1dCxcbiAgT3V0cHV0LFxuICBFbGVtZW50UmVmLFxuICBFdmVudEVtaXR0ZXIsXG4gIE9uQ2hhbmdlcyxcbiAgU2ltcGxlQ2hhbmdlcyxcbiAgT25Jbml0LFxuICBIb3N0TGlzdGVuZXIsXG4gIE9uRGVzdHJveSxcbiAgVmlld0NoaWxkLFxuICBBZnRlclZpZXdDaGVja2VkXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtcbiAgUERGRG9jdW1lbnRQcm94eSxcbiAgUERGVmlld2VyUGFyYW1zLFxuICBQREZQYWdlUHJveHksXG4gIFBERlNvdXJjZSxcbiAgUERGUHJvZ3Jlc3NEYXRhLFxuICBQREZQcm9taXNlXG59IGZyb20gJ3BkZmpzLWRpc3QnO1xuXG5pbXBvcnQgeyBjcmVhdGVFdmVudEJ1cyB9IGZyb20gJy4uL3V0aWxzL2V2ZW50LWJ1cy11dGlscyc7XG5cbmxldCBQREZKUzogYW55O1xubGV0IFBERkpTVmlld2VyOiBhbnk7XG5cbmZ1bmN0aW9uIGlzU1NSKCkge1xuICByZXR1cm4gdHlwZW9mIHdpbmRvdyA9PT0gJ3VuZGVmaW5lZCc7XG59XG5cbmlmICghaXNTU1IoKSkge1xuICBQREZKUyA9IHJlcXVpcmUoJ3BkZmpzLWRpc3QvYnVpbGQvcGRmJyk7XG4gIFBERkpTVmlld2VyID0gcmVxdWlyZSgncGRmanMtZGlzdC93ZWIvcGRmX3ZpZXdlcicpO1xuXG4gIFBERkpTLnZlcmJvc2l0eSA9IFBERkpTLlZlcmJvc2l0eUxldmVsLkVSUk9SUztcbn1cblxuZXhwb3J0IGVudW0gUmVuZGVyVGV4dE1vZGUge1xuICBESVNBQkxFRCxcbiAgRU5BQkxFRCxcbiAgRU5IQU5DRURcbn1cblxuQENvbXBvbmVudCh7XG4gIHNlbGVjdG9yOiAncGRmLXZpZXdlcicsXG4gIHRlbXBsYXRlOiBgXG4gICAgPGRpdiAjcGRmVmlld2VyQ29udGFpbmVyIGNsYXNzPVwibmcyLXBkZi12aWV3ZXItY29udGFpbmVyXCI+XG4gICAgICA8ZGl2IGNsYXNzPVwicGRmVmlld2VyXCI+PC9kaXY+XG4gICAgPC9kaXY+XG4gIGAsXG4gIHN0eWxlVXJsczogWycuL3BkZi12aWV3ZXIuY29tcG9uZW50LnNjc3MnXVxufSlcbmV4cG9ydCBjbGFzcyBQZGZWaWV3ZXJDb21wb25lbnRcbiAgaW1wbGVtZW50cyBPbkNoYW5nZXMsIE9uSW5pdCwgT25EZXN0cm95LCBBZnRlclZpZXdDaGVja2VkIHtcbiAgQFZpZXdDaGlsZCgncGRmVmlld2VyQ29udGFpbmVyJykgcGRmVmlld2VyQ29udGFpbmVyO1xuICBwcml2YXRlIGlzVmlzaWJsZTogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIHN0YXRpYyBDU1NfVU5JVFM6IG51bWJlciA9IDk2LjAgLyA3Mi4wO1xuICBzdGF0aWMgQk9SREVSX1dJRFRIOiBudW1iZXIgPSA5O1xuXG4gIHByaXZhdGUgcGRmTXVsdGlQYWdlVmlld2VyOiBhbnk7XG4gIHByaXZhdGUgcGRmTXVsdGlQYWdlTGlua1NlcnZpY2U6IGFueTtcbiAgcHJpdmF0ZSBwZGZNdWx0aVBhZ2VGaW5kQ29udHJvbGxlcjogYW55O1xuXG4gIHByaXZhdGUgcGRmU2luZ2xlUGFnZVZpZXdlcjogYW55O1xuICBwcml2YXRlIHBkZlNpbmdsZVBhZ2VMaW5rU2VydmljZTogYW55O1xuICBwcml2YXRlIHBkZlNpbmdsZVBhZ2VGaW5kQ29udHJvbGxlcjogYW55O1xuXG4gIHByaXZhdGUgX2NNYXBzVXJsID1cbiAgICB0eXBlb2YgUERGSlMgIT09ICd1bmRlZmluZWQnXG4gICAgICA/IGBodHRwczovL3VucGtnLmNvbS9wZGZqcy1kaXN0QCR7KFBERkpTIGFzIGFueSkudmVyc2lvbn0vY21hcHMvYFxuICAgICAgOiBudWxsO1xuICBwcml2YXRlIF9yZW5kZXJUZXh0ID0gdHJ1ZTtcbiAgcHJpdmF0ZSBfcmVuZGVyVGV4dE1vZGU6IFJlbmRlclRleHRNb2RlID0gUmVuZGVyVGV4dE1vZGUuRU5BQkxFRDtcbiAgcHJpdmF0ZSBfc3RpY2tUb1BhZ2UgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfb3JpZ2luYWxTaXplID0gdHJ1ZTtcbiAgcHJpdmF0ZSBfcGRmOiBQREZEb2N1bWVudFByb3h5O1xuICBwcml2YXRlIF9wYWdlID0gMTtcbiAgcHJpdmF0ZSBfem9vbSA9IDE7XG4gIHByaXZhdGUgX3pvb21TY2FsZTogJ3BhZ2UtaGVpZ2h0J3wncGFnZS1maXQnfCdwYWdlLXdpZHRoJyA9ICdwYWdlLXdpZHRoJztcbiAgcHJpdmF0ZSBfcm90YXRpb24gPSAwO1xuICBwcml2YXRlIF9zaG93QWxsID0gdHJ1ZTtcbiAgcHJpdmF0ZSBfY2FuQXV0b1Jlc2l6ZSA9IHRydWU7XG4gIHByaXZhdGUgX2ZpdFRvUGFnZSA9IGZhbHNlO1xuICBwcml2YXRlIF9leHRlcm5hbExpbmtUYXJnZXQgPSAnYmxhbmsnO1xuICBwcml2YXRlIF9zaG93Qm9yZGVycyA9IGZhbHNlO1xuICBwcml2YXRlIGxhc3RMb2FkZWQ6IHN0cmluZyB8IFVpbnQ4QXJyYXkgfCBQREZTb3VyY2U7XG4gIHByaXZhdGUgX2xhdGVzdFNjcm9sbGVkUGFnZTogbnVtYmVyO1xuXG4gIHByaXZhdGUgcmVzaXplVGltZW91dDogTm9kZUpTLlRpbWVyO1xuICBwcml2YXRlIHBhZ2VTY3JvbGxUaW1lb3V0OiBOb2RlSlMuVGltZXI7XG4gIHByaXZhdGUgaXNJbml0aWFsaXplZCA9IGZhbHNlO1xuICBwcml2YXRlIGxvYWRpbmdUYXNrOiBhbnk7XG5cbiAgQE91dHB1dCgnYWZ0ZXItbG9hZC1jb21wbGV0ZScpIGFmdGVyTG9hZENvbXBsZXRlID0gbmV3IEV2ZW50RW1pdHRlcjxcbiAgICBQREZEb2N1bWVudFByb3h5XG4gID4oKTtcbiAgQE91dHB1dCgncGFnZS1yZW5kZXJlZCcpIHBhZ2VSZW5kZXJlZCA9IG5ldyBFdmVudEVtaXR0ZXI8Q3VzdG9tRXZlbnQ+KCk7XG4gIEBPdXRwdXQoJ3RleHQtbGF5ZXItcmVuZGVyZWQnKSB0ZXh0TGF5ZXJSZW5kZXJlZCA9IG5ldyBFdmVudEVtaXR0ZXI8XG4gICAgQ3VzdG9tRXZlbnRcbiAgPigpO1xuICBAT3V0cHV0KCdlcnJvcicpIG9uRXJyb3IgPSBuZXcgRXZlbnRFbWl0dGVyPGFueT4oKTtcbiAgQE91dHB1dCgnb24tcHJvZ3Jlc3MnKSBvblByb2dyZXNzID0gbmV3IEV2ZW50RW1pdHRlcjxQREZQcm9ncmVzc0RhdGE+KCk7XG4gIEBPdXRwdXQoKSBwYWdlQ2hhbmdlOiBFdmVudEVtaXR0ZXI8bnVtYmVyPiA9IG5ldyBFdmVudEVtaXR0ZXI8bnVtYmVyPih0cnVlKTtcbiAgQElucHV0KClcbiAgc3JjOiBzdHJpbmcgfCBVaW50OEFycmF5IHwgUERGU291cmNlO1xuXG4gIEBJbnB1dCgnYy1tYXBzLXVybCcpXG4gIHNldCBjTWFwc1VybChjTWFwc1VybDogc3RyaW5nKSB7XG4gICAgdGhpcy5fY01hcHNVcmwgPSBjTWFwc1VybDtcbiAgfVxuXG4gQElucHV0KCdwYWdlJylcbiAgc2V0IHBhZ2UoX3BhZ2UpIHtcbiAgICBfcGFnZSA9IHBhcnNlSW50KF9wYWdlLCAxMCkgfHwgMTtcbiAgICBjb25zdCBvcmdpbmFsUGFnZSA9IF9wYWdlO1xuXG4gICAgaWYgKHRoaXMuX3BkZikge1xuICAgICAgX3BhZ2UgPSB0aGlzLmdldFZhbGlkUGFnZU51bWJlcihfcGFnZSk7XG4gICAgfVxuXG4gICAgdGhpcy5fcGFnZSA9IF9wYWdlO1xuICAgIGlmIChvcmdpbmFsUGFnZSAhPT0gX3BhZ2UpIHtcbiAgICAgIHRoaXMucGFnZUNoYW5nZS5lbWl0KF9wYWdlKTtcbiAgICB9XG4gIH1cblxuICBASW5wdXQoJ3JlbmRlci10ZXh0JylcbiAgc2V0IHJlbmRlclRleHQocmVuZGVyVGV4dDogYm9vbGVhbikge1xuICAgIHRoaXMuX3JlbmRlclRleHQgPSByZW5kZXJUZXh0O1xuICB9XG5cbiAgQElucHV0KCdyZW5kZXItdGV4dC1tb2RlJylcbiAgc2V0IHJlbmRlclRleHRNb2RlKHJlbmRlclRleHRNb2RlOiBSZW5kZXJUZXh0TW9kZSkge1xuICAgIHRoaXMuX3JlbmRlclRleHRNb2RlID0gcmVuZGVyVGV4dE1vZGU7XG4gIH1cblxuICBASW5wdXQoJ29yaWdpbmFsLXNpemUnKVxuICBzZXQgb3JpZ2luYWxTaXplKG9yaWdpbmFsU2l6ZTogYm9vbGVhbikge1xuICAgIHRoaXMuX29yaWdpbmFsU2l6ZSA9IG9yaWdpbmFsU2l6ZTtcbiAgfVxuXG4gIEBJbnB1dCgnc2hvdy1hbGwnKVxuICBzZXQgc2hvd0FsbCh2YWx1ZTogYm9vbGVhbikge1xuICAgIHRoaXMuX3Nob3dBbGwgPSB2YWx1ZTtcbiAgfVxuXG4gIEBJbnB1dCgnc3RpY2stdG8tcGFnZScpXG4gIHNldCBzdGlja1RvUGFnZSh2YWx1ZTogYm9vbGVhbikge1xuICAgIHRoaXMuX3N0aWNrVG9QYWdlID0gdmFsdWU7XG4gIH1cblxuICBASW5wdXQoJ3pvb20nKVxuICBzZXQgem9vbSh2YWx1ZTogbnVtYmVyKSB7XG4gICAgaWYgKHZhbHVlIDw9IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl96b29tID0gdmFsdWU7XG4gIH1cblxuICBnZXQgem9vbSgpIHtcbiAgICByZXR1cm4gdGhpcy5fem9vbTtcbiAgfVxuXG4gIEBJbnB1dCgnem9vbS1zY2FsZScpXG4gIHNldCB6b29tU2NhbGUodmFsdWU6ICdwYWdlLWhlaWdodCd8J3BhZ2UtZml0JyB8ICdwYWdlLXdpZHRoJykge1xuICAgIHRoaXMuX3pvb21TY2FsZSA9IHZhbHVlO1xuICB9XG5cbiAgZ2V0IHpvb21TY2FsZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fem9vbVNjYWxlO1xuICB9XG5cbiAgQElucHV0KCdyb3RhdGlvbicpXG4gIHNldCByb3RhdGlvbih2YWx1ZTogbnVtYmVyKSB7XG4gICAgaWYgKCEodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJyAmJiB2YWx1ZSAlIDkwID09PSAwKSkge1xuICAgICAgY29uc29sZS53YXJuKCdJbnZhbGlkIHBhZ2VzIHJvdGF0aW9uIGFuZ2xlLicpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX3JvdGF0aW9uID0gdmFsdWU7XG4gIH1cblxuICBASW5wdXQoJ2V4dGVybmFsLWxpbmstdGFyZ2V0JylcbiAgc2V0IGV4dGVybmFsTGlua1RhcmdldCh2YWx1ZTogc3RyaW5nKSB7XG4gICAgdGhpcy5fZXh0ZXJuYWxMaW5rVGFyZ2V0ID0gdmFsdWU7XG4gIH1cblxuICBASW5wdXQoJ2F1dG9yZXNpemUnKVxuICBzZXQgYXV0b3Jlc2l6ZSh2YWx1ZTogYm9vbGVhbikge1xuICAgIHRoaXMuX2NhbkF1dG9SZXNpemUgPSBCb29sZWFuKHZhbHVlKTtcbiAgfVxuXG4gIEBJbnB1dCgnZml0LXRvLXBhZ2UnKVxuICBzZXQgZml0VG9QYWdlKHZhbHVlOiBib29sZWFuKSB7XG4gICAgdGhpcy5fZml0VG9QYWdlID0gQm9vbGVhbih2YWx1ZSk7XG4gIH1cblxuICBASW5wdXQoJ3Nob3ctYm9yZGVycycpXG4gIHNldCBzaG93Qm9yZGVycyh2YWx1ZTogYm9vbGVhbikge1xuICAgIHRoaXMuX3Nob3dCb3JkZXJzID0gQm9vbGVhbih2YWx1ZSk7XG4gIH1cblxuICBzdGF0aWMgZ2V0TGlua1RhcmdldCh0eXBlOiBzdHJpbmcpIHtcbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgIGNhc2UgJ2JsYW5rJzpcbiAgICAgICAgcmV0dXJuICg8YW55PlBERkpTKS5MaW5rVGFyZ2V0LkJMQU5LO1xuICAgICAgY2FzZSAnbm9uZSc6XG4gICAgICAgIHJldHVybiAoPGFueT5QREZKUykuTGlua1RhcmdldC5OT05FO1xuICAgICAgY2FzZSAnc2VsZic6XG4gICAgICAgIHJldHVybiAoPGFueT5QREZKUykuTGlua1RhcmdldC5TRUxGO1xuICAgICAgY2FzZSAncGFyZW50JzpcbiAgICAgICAgcmV0dXJuICg8YW55PlBERkpTKS5MaW5rVGFyZ2V0LlBBUkVOVDtcbiAgICAgIGNhc2UgJ3RvcCc6XG4gICAgICAgIHJldHVybiAoPGFueT5QREZKUykuTGlua1RhcmdldC5UT1A7XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBzdGF0aWMgc2V0RXh0ZXJuYWxMaW5rVGFyZ2V0KHR5cGU6IHN0cmluZykge1xuICAgIGNvbnN0IGxpbmtUYXJnZXQgPSBQZGZWaWV3ZXJDb21wb25lbnQuZ2V0TGlua1RhcmdldCh0eXBlKTtcblxuICAgIGlmIChsaW5rVGFyZ2V0ICE9PSBudWxsKSB7XG4gICAgICAoPGFueT5QREZKUykuZXh0ZXJuYWxMaW5rVGFyZ2V0ID0gbGlua1RhcmdldDtcbiAgICB9XG4gIH1cblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGVsZW1lbnQ6IEVsZW1lbnRSZWYpIHtcbiAgICBpZiAoaXNTU1IoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCBwZGZXb3JrZXJTcmM6IHN0cmluZztcblxuICAgIGlmIChcbiAgICAgIHdpbmRvdy5oYXNPd25Qcm9wZXJ0eSgncGRmV29ya2VyU3JjJykgJiZcbiAgICAgIHR5cGVvZiAod2luZG93IGFzIGFueSkucGRmV29ya2VyU3JjID09PSAnc3RyaW5nJyAmJlxuICAgICAgKHdpbmRvdyBhcyBhbnkpLnBkZldvcmtlclNyY1xuICAgICkge1xuICAgICAgcGRmV29ya2VyU3JjID0gKHdpbmRvdyBhcyBhbnkpLnBkZldvcmtlclNyYztcbiAgICB9IGVsc2Uge1xuICAgICAgcGRmV29ya2VyU3JjID0gYGh0dHBzOi8vY2RuanMuY2xvdWRmbGFyZS5jb20vYWpheC9saWJzL3BkZi5qcy8ke1xuICAgICAgICAoUERGSlMgYXMgYW55KS52ZXJzaW9uXG4gICAgICB9L3BkZi53b3JrZXIubWluLmpzYDtcbiAgICB9XG5cbiAgICAoUERGSlMgYXMgYW55KS5HbG9iYWxXb3JrZXJPcHRpb25zLndvcmtlclNyYyA9IHBkZldvcmtlclNyYztcbiAgfVxuXG4gIG5nQWZ0ZXJWaWV3Q2hlY2tlZCgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5pc0luaXRpYWxpemVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgb2Zmc2V0ID0gdGhpcy5wZGZWaWV3ZXJDb250YWluZXIubmF0aXZlRWxlbWVudC5vZmZzZXRQYXJlbnQ7XG5cbiAgICBpZiAodGhpcy5pc1Zpc2libGUgPT09IHRydWUgJiYgb2Zmc2V0ID09IG51bGwpIHtcbiAgICAgIHRoaXMuaXNWaXNpYmxlID0gZmFsc2U7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaXNWaXNpYmxlID09PSBmYWxzZSAmJiBvZmZzZXQgIT0gbnVsbCkge1xuICAgICAgdGhpcy5pc1Zpc2libGUgPSB0cnVlO1xuXG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGhpcy5uZ09uSW5pdCgpO1xuICAgICAgICB0aGlzLm5nT25DaGFuZ2VzKHsgc3JjOiB0aGlzLnNyYyB9IGFzIGFueSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBuZ09uSW5pdCgpIHtcbiAgICBpZiAoIWlzU1NSKCkgJiYgdGhpcy5pc1Zpc2libGUpIHtcbiAgICAgIHRoaXMuaXNJbml0aWFsaXplZCA9IHRydWU7XG4gICAgICB0aGlzLnNldHVwTXVsdGlQYWdlVmlld2VyKCk7XG4gICAgICB0aGlzLnNldHVwU2luZ2xlUGFnZVZpZXdlcigpO1xuICAgIH1cbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuY2xlYXIoKTtcbiAgfVxuXG4gIEBIb3N0TGlzdGVuZXIoJ3dpbmRvdzpyZXNpemUnLCBbXSlcbiAgcHVibGljIG9uUGFnZVJlc2l6ZSgpIHtcbiAgICBpZiAoIXRoaXMuX2NhbkF1dG9SZXNpemUgfHwgIXRoaXMuX3BkZikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnJlc2l6ZVRpbWVvdXQpIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLnJlc2l6ZVRpbWVvdXQpO1xuICAgIH1cblxuICAgIHRoaXMucmVzaXplVGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgdGhpcy51cGRhdGVTaXplKCk7XG4gICAgfSwgMTAwKTtcbiAgfVxuXG4gIGdldCBwZGZMaW5rU2VydmljZSgpOiBhbnkge1xuICAgIHJldHVybiB0aGlzLl9zaG93QWxsXG4gICAgICA/IHRoaXMucGRmTXVsdGlQYWdlTGlua1NlcnZpY2VcbiAgICAgIDogdGhpcy5wZGZTaW5nbGVQYWdlTGlua1NlcnZpY2U7XG4gIH1cblxuICBnZXQgcGRmVmlld2VyKCk6IGFueSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0Q3VycmVudFZpZXdlcigpO1xuICB9XG5cbiAgZ2V0IHBkZkZpbmRDb250cm9sbGVyKCk6IGFueSB7XG4gICAgcmV0dXJuIHRoaXMuX3Nob3dBbGxcbiAgICAgID8gdGhpcy5wZGZNdWx0aVBhZ2VGaW5kQ29udHJvbGxlclxuICAgICAgOiB0aGlzLnBkZlNpbmdsZVBhZ2VGaW5kQ29udHJvbGxlcjtcbiAgfVxuXG4gIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpIHtcbiAgICBpZiAoaXNTU1IoKSB8fCAhdGhpcy5pc1Zpc2libGUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoJ3NyYycgaW4gY2hhbmdlcykge1xuICAgICAgdGhpcy5sb2FkUERGKCk7XG4gICAgfSBlbHNlIGlmICh0aGlzLl9wZGYpIHtcbiAgICAgIGlmICgncmVuZGVyVGV4dCcgaW4gY2hhbmdlcykge1xuICAgICAgICB0aGlzLmdldEN1cnJlbnRWaWV3ZXIoKS50ZXh0TGF5ZXJNb2RlID0gdGhpcy5fcmVuZGVyVGV4dFxuICAgICAgICAgID8gdGhpcy5fcmVuZGVyVGV4dE1vZGVcbiAgICAgICAgICA6IFJlbmRlclRleHRNb2RlLkRJU0FCTEVEO1xuICAgICAgICB0aGlzLnJlc2V0UGRmRG9jdW1lbnQoKTtcbiAgICAgIH0gZWxzZSBpZiAoJ3Nob3dBbGwnIGluIGNoYW5nZXMpIHtcbiAgICAgICAgdGhpcy5yZXNldFBkZkRvY3VtZW50KCk7XG4gICAgICB9XG4gICAgICBpZiAoJ3BhZ2UnIGluIGNoYW5nZXMpIHtcbiAgICAgICAgaWYgKGNoYW5nZXNbJ3BhZ2UnXS5jdXJyZW50VmFsdWUgPT09IHRoaXMuX2xhdGVzdFNjcm9sbGVkUGFnZSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE5ldyBmb3JtIG9mIHBhZ2UgY2hhbmdpbmc6IFRoZSB2aWV3ZXIgd2lsbCBub3cganVtcCB0byB0aGUgc3BlY2lmaWVkIHBhZ2Ugd2hlbiBpdCBpcyBjaGFuZ2VkLlxuICAgICAgICAvLyBUaGlzIGJlaGF2aW9yIGlzIGludHJvZHVjZWRieSB1c2luZyB0aGUgUERGU2luZ2xlUGFnZVZpZXdlclxuICAgICAgICB0aGlzLmdldEN1cnJlbnRWaWV3ZXIoKS5zY3JvbGxQYWdlSW50b1ZpZXcoeyBwYWdlTnVtYmVyOiB0aGlzLl9wYWdlIH0pO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnVwZGF0ZSgpO1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyB1cGRhdGVTaXplKCkge1xuICAgIGNvbnN0IGN1cnJlbnRWaWV3ZXIgPSB0aGlzLmdldEN1cnJlbnRWaWV3ZXIoKTtcbiAgICB0aGlzLl9wZGZcbiAgICAgIC5nZXRQYWdlKGN1cnJlbnRWaWV3ZXIuY3VycmVudFBhZ2VOdW1iZXIpXG4gICAgICAudGhlbigocGFnZTogUERGUGFnZVByb3h5KSA9PiB7XG4gICAgICAgIGNvbnN0IHJvdGF0aW9uID0gdGhpcy5fcm90YXRpb24gfHwgcGFnZS5yb3RhdGU7XG4gICAgICAgIGNvbnN0IHZpZXdwb3J0V2lkdGggPVxuICAgICAgICAgIChwYWdlIGFzIGFueSkuZ2V0Vmlld3BvcnQoe1xuICAgICAgICAgICAgc2NhbGU6IHRoaXMuX3pvb20sXG4gICAgICAgICAgICByb3RhdGlvblxuICAgICAgICAgIH0pLndpZHRoICogUGRmVmlld2VyQ29tcG9uZW50LkNTU19VTklUUztcbiAgICAgICAgbGV0IHNjYWxlID0gdGhpcy5fem9vbTtcbiAgICAgICAgbGV0IHN0aWNrVG9QYWdlID0gdHJ1ZTtcblxuICAgICAgICAvLyBTY2FsZSB0aGUgZG9jdW1lbnQgd2hlbiBpdCBzaG91bGRuJ3QgYmUgaW4gb3JpZ2luYWwgc2l6ZSBvciBkb2Vzbid0IGZpdCBpbnRvIHRoZSB2aWV3cG9ydFxuICAgICAgICBpZiAoXG4gICAgICAgICAgIXRoaXMuX29yaWdpbmFsU2l6ZSB8fFxuICAgICAgICAgICh0aGlzLl9maXRUb1BhZ2UgJiZcbiAgICAgICAgICAgIHZpZXdwb3J0V2lkdGggPiB0aGlzLnBkZlZpZXdlckNvbnRhaW5lci5uYXRpdmVFbGVtZW50LmNsaWVudFdpZHRoKVxuICAgICAgICApIHtcbiAgICAgICAgICBjb25zdCB2aWV3UG9ydCA9IChwYWdlIGFzIGFueSkuZ2V0Vmlld3BvcnQoeyBzY2FsZTogMSwgcm90YXRpb24gfSk7XG4gICAgICAgICAgc2NhbGUgPSB0aGlzLmdldFNjYWxlKHZpZXdQb3J0LndpZHRoLCB2aWV3UG9ydC5oZWlnaHQpO1xuICAgICAgICAgIHN0aWNrVG9QYWdlID0gIXRoaXMuX3N0aWNrVG9QYWdlO1xuICAgICAgICB9XG5cbiAgICAgICAgY3VycmVudFZpZXdlci5fc2V0U2NhbGUoc2NhbGUsIHN0aWNrVG9QYWdlKTtcbiAgICAgIH0pO1xuICB9XG5cbiAgcHVibGljIGNsZWFyKCkge1xuICAgIGlmICh0aGlzLmxvYWRpbmdUYXNrICYmICF0aGlzLmxvYWRpbmdUYXNrLmRlc3Ryb3llZCkge1xuICAgICAgdGhpcy5sb2FkaW5nVGFzay5kZXN0cm95KCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX3BkZikge1xuICAgICAgdGhpcy5fcGRmLmRlc3Ryb3koKTtcbiAgICAgIHRoaXMuX3BkZiA9IG51bGw7XG4gICAgICB0aGlzLnBkZk11bHRpUGFnZVZpZXdlci5zZXREb2N1bWVudChudWxsKTtcbiAgICAgIHRoaXMucGRmU2luZ2xlUGFnZVZpZXdlci5zZXREb2N1bWVudChudWxsKTtcblxuICAgICAgdGhpcy5wZGZNdWx0aVBhZ2VMaW5rU2VydmljZS5zZXREb2N1bWVudChudWxsLCBudWxsKTtcbiAgICAgIHRoaXMucGRmU2luZ2xlUGFnZUxpbmtTZXJ2aWNlLnNldERvY3VtZW50KG51bGwsIG51bGwpO1xuXG4gICAgICB0aGlzLnBkZk11bHRpUGFnZUZpbmRDb250cm9sbGVyLnNldERvY3VtZW50KG51bGwpO1xuICAgICAgdGhpcy5wZGZTaW5nbGVQYWdlRmluZENvbnRyb2xsZXIuc2V0RG9jdW1lbnQobnVsbCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzZXR1cE11bHRpUGFnZVZpZXdlcigpIHtcbiAgICAoUERGSlMgYXMgYW55KS5kaXNhYmxlVGV4dExheWVyID0gIXRoaXMuX3JlbmRlclRleHQ7XG5cbiAgICBQZGZWaWV3ZXJDb21wb25lbnQuc2V0RXh0ZXJuYWxMaW5rVGFyZ2V0KHRoaXMuX2V4dGVybmFsTGlua1RhcmdldCk7XG5cbiAgICBjb25zdCBldmVudEJ1cyA9IGNyZWF0ZUV2ZW50QnVzKFBERkpTVmlld2VyKTtcblxuICAgIGV2ZW50QnVzLm9uKCdwYWdlcmVuZGVyZWQnLCBlID0+IHtcbiAgICAgIHRoaXMucGFnZVJlbmRlcmVkLmVtaXQoZSk7XG4gICAgfSk7XG5cbiAgICBldmVudEJ1cy5vbigncGFnZWNoYW5naW5nJywgZSA9PiB7XG4gICAgICBpZiAodGhpcy5wYWdlU2Nyb2xsVGltZW91dCkge1xuICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5wYWdlU2Nyb2xsVGltZW91dCk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMucGFnZVNjcm9sbFRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGhpcy5fbGF0ZXN0U2Nyb2xsZWRQYWdlID0gZS5wYWdlTnVtYmVyO1xuICAgICAgICB0aGlzLnBhZ2VDaGFuZ2UuZW1pdChlLnBhZ2VOdW1iZXIpO1xuICAgICAgfSwgMTAwKTtcbiAgICB9KTtcblxuICAgIGV2ZW50QnVzLm9uKCd0ZXh0bGF5ZXJyZW5kZXJlZCcsIGUgPT4ge1xuICAgICAgdGhpcy50ZXh0TGF5ZXJSZW5kZXJlZC5lbWl0KGUpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5wZGZNdWx0aVBhZ2VMaW5rU2VydmljZSA9IG5ldyBQREZKU1ZpZXdlci5QREZMaW5rU2VydmljZSh7IGV2ZW50QnVzIH0pO1xuICAgIHRoaXMucGRmTXVsdGlQYWdlRmluZENvbnRyb2xsZXIgPSBuZXcgUERGSlNWaWV3ZXIuUERGRmluZENvbnRyb2xsZXIoe1xuICAgICAgbGlua1NlcnZpY2U6IHRoaXMucGRmTXVsdGlQYWdlTGlua1NlcnZpY2UsXG4gICAgICBldmVudEJ1c1xuICAgIH0pO1xuXG4gICAgY29uc3QgcGRmT3B0aW9uczogUERGVmlld2VyUGFyYW1zIHwgYW55ID0ge1xuICAgICAgZXZlbnRCdXM6IGV2ZW50QnVzLFxuICAgICAgY29udGFpbmVyOiB0aGlzLmVsZW1lbnQubmF0aXZlRWxlbWVudC5xdWVyeVNlbGVjdG9yKCdkaXYnKSxcbiAgICAgIHJlbW92ZVBhZ2VCb3JkZXJzOiAhdGhpcy5fc2hvd0JvcmRlcnMsXG4gICAgICBsaW5rU2VydmljZTogdGhpcy5wZGZNdWx0aVBhZ2VMaW5rU2VydmljZSxcbiAgICAgIHRleHRMYXllck1vZGU6IHRoaXMuX3JlbmRlclRleHRcbiAgICAgICAgPyB0aGlzLl9yZW5kZXJUZXh0TW9kZVxuICAgICAgICA6IFJlbmRlclRleHRNb2RlLkRJU0FCTEVELFxuICAgICAgZmluZENvbnRyb2xsZXI6IHRoaXMucGRmTXVsdGlQYWdlRmluZENvbnRyb2xsZXJcbiAgICB9O1xuXG4gICAgdGhpcy5wZGZNdWx0aVBhZ2VWaWV3ZXIgPSBuZXcgUERGSlNWaWV3ZXIuUERGVmlld2VyKHBkZk9wdGlvbnMpO1xuICAgIHRoaXMucGRmTXVsdGlQYWdlTGlua1NlcnZpY2Uuc2V0Vmlld2VyKHRoaXMucGRmTXVsdGlQYWdlVmlld2VyKTtcbiAgICB0aGlzLnBkZk11bHRpUGFnZUZpbmRDb250cm9sbGVyLnNldERvY3VtZW50KHRoaXMuX3BkZik7XG4gIH1cblxuICBwcml2YXRlIHNldHVwU2luZ2xlUGFnZVZpZXdlcigpIHtcbiAgICAoUERGSlMgYXMgYW55KS5kaXNhYmxlVGV4dExheWVyID0gIXRoaXMuX3JlbmRlclRleHQ7XG5cbiAgICBQZGZWaWV3ZXJDb21wb25lbnQuc2V0RXh0ZXJuYWxMaW5rVGFyZ2V0KHRoaXMuX2V4dGVybmFsTGlua1RhcmdldCk7XG5cbiAgICBjb25zdCBldmVudEJ1cyA9IGNyZWF0ZUV2ZW50QnVzKFBERkpTVmlld2VyKTtcblxuICAgIGV2ZW50QnVzLm9uKCdwYWdlY2hhbmdpbmcnLCBlID0+IHtcbiAgICAgIGlmIChlLnBhZ2VOdW1iZXIgIT0gdGhpcy5fcGFnZSkge1xuICAgICAgICB0aGlzLnBhZ2UgPSBlLnBhZ2VOdW1iZXI7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBldmVudEJ1cy5vbigncGFnZXJlbmRlcmVkJywgZSA9PiB7XG4gICAgICB0aGlzLnBhZ2VSZW5kZXJlZC5lbWl0KGUpO1xuICAgIH0pO1xuXG4gICAgZXZlbnRCdXMub24oJ3RleHRsYXllcnJlbmRlcmVkJywgZSA9PiB7XG4gICAgICB0aGlzLnRleHRMYXllclJlbmRlcmVkLmVtaXQoZSk7XG4gICAgfSk7XG5cbiAgICB0aGlzLnBkZlNpbmdsZVBhZ2VMaW5rU2VydmljZSA9IG5ldyBQREZKU1ZpZXdlci5QREZMaW5rU2VydmljZSh7XG4gICAgICBldmVudEJ1c1xuICAgIH0pO1xuICAgIHRoaXMucGRmU2luZ2xlUGFnZUZpbmRDb250cm9sbGVyID0gbmV3IFBERkpTVmlld2VyLlBERkZpbmRDb250cm9sbGVyKHtcbiAgICAgIGxpbmtTZXJ2aWNlOiB0aGlzLnBkZlNpbmdsZVBhZ2VMaW5rU2VydmljZSxcbiAgICAgIGV2ZW50QnVzXG4gICAgfSk7XG5cbiAgICBjb25zdCBwZGZPcHRpb25zOiBQREZWaWV3ZXJQYXJhbXMgfCBhbnkgPSB7XG4gICAgICBldmVudEJ1czogZXZlbnRCdXMsXG4gICAgICBjb250YWluZXI6IHRoaXMuZWxlbWVudC5uYXRpdmVFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJ2RpdicpLFxuICAgICAgcmVtb3ZlUGFnZUJvcmRlcnM6ICF0aGlzLl9zaG93Qm9yZGVycyxcbiAgICAgIGxpbmtTZXJ2aWNlOiB0aGlzLnBkZlNpbmdsZVBhZ2VMaW5rU2VydmljZSxcbiAgICAgIHRleHRMYXllck1vZGU6IHRoaXMuX3JlbmRlclRleHRcbiAgICAgICAgPyB0aGlzLl9yZW5kZXJUZXh0TW9kZVxuICAgICAgICA6IFJlbmRlclRleHRNb2RlLkRJU0FCTEVELFxuICAgICAgZmluZENvbnRyb2xsZXI6IHRoaXMucGRmU2luZ2xlUGFnZUZpbmRDb250cm9sbGVyXG4gICAgfTtcblxuICAgIHRoaXMucGRmU2luZ2xlUGFnZVZpZXdlciA9IG5ldyBQREZKU1ZpZXdlci5QREZTaW5nbGVQYWdlVmlld2VyKHBkZk9wdGlvbnMpO1xuICAgIHRoaXMucGRmU2luZ2xlUGFnZUxpbmtTZXJ2aWNlLnNldFZpZXdlcih0aGlzLnBkZlNpbmdsZVBhZ2VWaWV3ZXIpO1xuICAgIHRoaXMucGRmU2luZ2xlUGFnZUZpbmRDb250cm9sbGVyLnNldERvY3VtZW50KHRoaXMuX3BkZik7XG5cbiAgICB0aGlzLnBkZlNpbmdsZVBhZ2VWaWV3ZXIuX2N1cnJlbnRQYWdlTnVtYmVyID0gdGhpcy5fcGFnZTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0VmFsaWRQYWdlTnVtYmVyKHBhZ2U6IG51bWJlcik6IG51bWJlciB7XG4gICAgaWYgKHBhZ2UgPCAxKSB7XG4gICAgICByZXR1cm4gMTtcbiAgICB9XG5cbiAgICBpZiAocGFnZSA+IHRoaXMuX3BkZi5udW1QYWdlcykge1xuICAgICAgcmV0dXJuIHRoaXMuX3BkZi5udW1QYWdlcztcbiAgICB9XG5cbiAgICByZXR1cm4gcGFnZTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0RG9jdW1lbnRQYXJhbXMoKSB7XG4gICAgY29uc3Qgc3JjVHlwZSA9IHR5cGVvZiB0aGlzLnNyYztcblxuICAgIGlmICghdGhpcy5fY01hcHNVcmwpIHtcbiAgICAgIHJldHVybiB0aGlzLnNyYztcbiAgICB9XG5cbiAgICBjb25zdCBwYXJhbXM6IGFueSA9IHtcbiAgICAgIGNNYXBVcmw6IHRoaXMuX2NNYXBzVXJsLFxuICAgICAgY01hcFBhY2tlZDogdHJ1ZVxuICAgIH07XG5cbiAgICBpZiAoc3JjVHlwZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHBhcmFtcy51cmwgPSB0aGlzLnNyYztcbiAgICB9IGVsc2UgaWYgKHNyY1R5cGUgPT09ICdvYmplY3QnKSB7XG4gICAgICBpZiAoKHRoaXMuc3JjIGFzIGFueSkuYnl0ZUxlbmd0aCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHBhcmFtcy5kYXRhID0gdGhpcy5zcmM7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBPYmplY3QuYXNzaWduKHBhcmFtcywgdGhpcy5zcmMpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBwYXJhbXM7XG4gIH1cblxuICBwcml2YXRlIGxvYWRQREYoKSB7XG4gICAgaWYgKCF0aGlzLnNyYykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmxhc3RMb2FkZWQgPT09IHRoaXMuc3JjKSB7XG4gICAgICB0aGlzLnVwZGF0ZSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuY2xlYXIoKTtcblxuICAgIHRoaXMubG9hZGluZ1Rhc2sgPSAoUERGSlMgYXMgYW55KS5nZXREb2N1bWVudCh0aGlzLmdldERvY3VtZW50UGFyYW1zKCkpO1xuXG4gICAgdGhpcy5sb2FkaW5nVGFzay5vblByb2dyZXNzID0gKHByb2dyZXNzRGF0YTogUERGUHJvZ3Jlc3NEYXRhKSA9PiB7XG4gICAgICB0aGlzLm9uUHJvZ3Jlc3MuZW1pdChwcm9ncmVzc0RhdGEpO1xuICAgIH07XG5cbiAgICBjb25zdCBzcmMgPSB0aGlzLnNyYztcbiAgICAoPFBERlByb21pc2U8UERGRG9jdW1lbnRQcm94eT4+dGhpcy5sb2FkaW5nVGFzay5wcm9taXNlKS50aGVuKFxuICAgICAgKHBkZjogUERGRG9jdW1lbnRQcm94eSkgPT4ge1xuICAgICAgICB0aGlzLl9wZGYgPSBwZGY7XG4gICAgICAgIHRoaXMubGFzdExvYWRlZCA9IHNyYztcblxuICAgICAgICB0aGlzLmFmdGVyTG9hZENvbXBsZXRlLmVtaXQocGRmKTtcblxuICAgICAgICBpZiAoIXRoaXMucGRmTXVsdGlQYWdlVmlld2VyKSB7XG4gICAgICAgICAgdGhpcy5zZXR1cE11bHRpUGFnZVZpZXdlcigpO1xuICAgICAgICAgIHRoaXMuc2V0dXBTaW5nbGVQYWdlVmlld2VyKCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnJlc2V0UGRmRG9jdW1lbnQoKTtcblxuICAgICAgICB0aGlzLnVwZGF0ZSgpO1xuICAgICAgfSxcbiAgICAgIChlcnJvcjogYW55KSA9PiB7XG4gICAgICAgIHRoaXMub25FcnJvci5lbWl0KGVycm9yKTtcbiAgICAgIH1cbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSB1cGRhdGUoKSB7XG4gICAgdGhpcy5wYWdlID0gdGhpcy5fcGFnZTtcblxuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlcigpIHtcbiAgICB0aGlzLl9wYWdlID0gdGhpcy5nZXRWYWxpZFBhZ2VOdW1iZXIodGhpcy5fcGFnZSk7XG4gICAgY29uc3QgY3VycmVudFZpZXdlciA9IHRoaXMuZ2V0Q3VycmVudFZpZXdlcigpO1xuXG4gICAgaWYgKFxuICAgICAgdGhpcy5fcm90YXRpb24gIT09IDAgfHxcbiAgICAgIGN1cnJlbnRWaWV3ZXIucGFnZXNSb3RhdGlvbiAhPT0gdGhpcy5fcm90YXRpb25cbiAgICApIHtcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBjdXJyZW50Vmlld2VyLnBhZ2VzUm90YXRpb24gPSB0aGlzLl9yb3RhdGlvbjtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9zdGlja1RvUGFnZSkge1xuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGN1cnJlbnRWaWV3ZXIuY3VycmVudFBhZ2VOdW1iZXIgPSB0aGlzLl9wYWdlO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgdGhpcy51cGRhdGVTaXplKCk7XG4gIH1cblxuICBwcml2YXRlIGdldFNjYWxlKHZpZXdwb3J0V2lkdGg6IG51bWJlciwgdmlld3BvcnRIZWlnaHQ6IG51bWJlcikge1xuICAgIGNvbnN0IGJvcmRlclNpemUgPSAodGhpcy5fc2hvd0JvcmRlcnMgPyAyICogUGRmVmlld2VyQ29tcG9uZW50LkJPUkRFUl9XSURUSCA6IDApO1xuICAgIGNvbnN0IHBkZkNvbnRhaW5lcldpZHRoID0gdGhpcy5wZGZWaWV3ZXJDb250YWluZXIubmF0aXZlRWxlbWVudC5jbGllbnRXaWR0aCAtIGJvcmRlclNpemU7XG4gICAgY29uc3QgcGRmQ29udGFpbmVySGVpZ2h0ID0gdGhpcy5wZGZWaWV3ZXJDb250YWluZXIubmF0aXZlRWxlbWVudC5jbGllbnRIZWlnaHQgLSBib3JkZXJTaXplO1xuXG4gICAgaWYgKHBkZkNvbnRhaW5lckhlaWdodCA9PT0gMCB8fCB2aWV3cG9ydEhlaWdodCA9PT0gMCB8fCBwZGZDb250YWluZXJXaWR0aCA9PT0gMCB8fCB2aWV3cG9ydFdpZHRoID09PSAwKSB7XG4gICAgICByZXR1cm4gMTtcbiAgICB9XG5cbiAgICBsZXQgcmF0aW8gPSAxO1xuICAgIHN3aXRjaCAodGhpcy5fem9vbVNjYWxlKSB7XG4gICAgICBjYXNlICdwYWdlLWZpdCc6XG4gICAgICAgIHJhdGlvID0gTWF0aC5taW4oKHBkZkNvbnRhaW5lckhlaWdodCAvIHZpZXdwb3J0SGVpZ2h0KSwgKHBkZkNvbnRhaW5lcldpZHRoIC8gdmlld3BvcnRXaWR0aCkpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3BhZ2UtaGVpZ2h0JzpcbiAgICAgICAgcmF0aW8gPSAocGRmQ29udGFpbmVySGVpZ2h0IC8gdmlld3BvcnRIZWlnaHQpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3BhZ2Utd2lkdGgnOlxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmF0aW8gPSAocGRmQ29udGFpbmVyV2lkdGggLyB2aWV3cG9ydFdpZHRoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgcmV0dXJuICh0aGlzLl96b29tICogcmF0aW8pIC8gUGRmVmlld2VyQ29tcG9uZW50LkNTU19VTklUUztcbiAgfVxuXG4gIHByaXZhdGUgZ2V0Q3VycmVudFZpZXdlcigpOiBhbnkge1xuICAgIHJldHVybiB0aGlzLl9zaG93QWxsID8gdGhpcy5wZGZNdWx0aVBhZ2VWaWV3ZXIgOiB0aGlzLnBkZlNpbmdsZVBhZ2VWaWV3ZXI7XG4gIH1cblxuICBwcml2YXRlIHJlc2V0UGRmRG9jdW1lbnQoKSB7XG4gICAgdGhpcy5wZGZGaW5kQ29udHJvbGxlci5zZXREb2N1bWVudCh0aGlzLl9wZGYpO1xuXG4gICAgaWYgKHRoaXMuX3Nob3dBbGwpIHtcbiAgICAgIHRoaXMucGRmU2luZ2xlUGFnZVZpZXdlci5zZXREb2N1bWVudChudWxsKTtcbiAgICAgIHRoaXMucGRmU2luZ2xlUGFnZUxpbmtTZXJ2aWNlLnNldERvY3VtZW50KG51bGwpO1xuXG4gICAgICB0aGlzLnBkZk11bHRpUGFnZVZpZXdlci5zZXREb2N1bWVudCh0aGlzLl9wZGYpO1xuICAgICAgdGhpcy5wZGZNdWx0aVBhZ2VMaW5rU2VydmljZS5zZXREb2N1bWVudCh0aGlzLl9wZGYsIG51bGwpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnBkZk11bHRpUGFnZVZpZXdlci5zZXREb2N1bWVudChudWxsKTtcbiAgICAgIHRoaXMucGRmTXVsdGlQYWdlTGlua1NlcnZpY2Uuc2V0RG9jdW1lbnQobnVsbCk7XG5cbiAgICAgIHRoaXMucGRmU2luZ2xlUGFnZVZpZXdlci5zZXREb2N1bWVudCh0aGlzLl9wZGYpO1xuICAgICAgdGhpcy5wZGZTaW5nbGVQYWdlTGlua1NlcnZpY2Uuc2V0RG9jdW1lbnQodGhpcy5fcGRmLCBudWxsKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==