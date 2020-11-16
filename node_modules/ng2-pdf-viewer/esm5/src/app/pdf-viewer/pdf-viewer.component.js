import { __decorate } from "tslib";
/**
 * Created by vadimdez on 21/06/16.
 */
import { Component, Input, Output, ElementRef, EventEmitter, OnChanges, SimpleChanges, OnInit, HostListener, OnDestroy, ViewChild, AfterViewChecked } from '@angular/core';
import { createEventBus } from '../utils/event-bus-utils';
var PDFJS;
var PDFJSViewer;
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
var PdfViewerComponent = /** @class */ (function () {
    function PdfViewerComponent(element) {
        this.element = element;
        this.isVisible = false;
        this._cMapsUrl = typeof PDFJS !== 'undefined'
            ? "https://unpkg.com/pdfjs-dist@" + PDFJS.version + "/cmaps/"
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
        var pdfWorkerSrc;
        if (window.hasOwnProperty('pdfWorkerSrc') &&
            typeof window.pdfWorkerSrc === 'string' &&
            window.pdfWorkerSrc) {
            pdfWorkerSrc = window.pdfWorkerSrc;
        }
        else {
            pdfWorkerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/" + PDFJS.version + "/pdf.worker.min.js";
        }
        PDFJS.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;
    }
    PdfViewerComponent_1 = PdfViewerComponent;
    Object.defineProperty(PdfViewerComponent.prototype, "cMapsUrl", {
        set: function (cMapsUrl) {
            this._cMapsUrl = cMapsUrl;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PdfViewerComponent.prototype, "page", {
        set: function (_page) {
            _page = parseInt(_page, 10) || 1;
            var orginalPage = _page;
            if (this._pdf) {
                _page = this.getValidPageNumber(_page);
            }
            this._page = _page;
            if (orginalPage !== _page) {
                this.pageChange.emit(_page);
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PdfViewerComponent.prototype, "renderText", {
        set: function (renderText) {
            this._renderText = renderText;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PdfViewerComponent.prototype, "renderTextMode", {
        set: function (renderTextMode) {
            this._renderTextMode = renderTextMode;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PdfViewerComponent.prototype, "originalSize", {
        set: function (originalSize) {
            this._originalSize = originalSize;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PdfViewerComponent.prototype, "showAll", {
        set: function (value) {
            this._showAll = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PdfViewerComponent.prototype, "stickToPage", {
        set: function (value) {
            this._stickToPage = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PdfViewerComponent.prototype, "zoom", {
        get: function () {
            return this._zoom;
        },
        set: function (value) {
            if (value <= 0) {
                return;
            }
            this._zoom = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PdfViewerComponent.prototype, "zoomScale", {
        get: function () {
            return this._zoomScale;
        },
        set: function (value) {
            this._zoomScale = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PdfViewerComponent.prototype, "rotation", {
        set: function (value) {
            if (!(typeof value === 'number' && value % 90 === 0)) {
                console.warn('Invalid pages rotation angle.');
                return;
            }
            this._rotation = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PdfViewerComponent.prototype, "externalLinkTarget", {
        set: function (value) {
            this._externalLinkTarget = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PdfViewerComponent.prototype, "autoresize", {
        set: function (value) {
            this._canAutoResize = Boolean(value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PdfViewerComponent.prototype, "fitToPage", {
        set: function (value) {
            this._fitToPage = Boolean(value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PdfViewerComponent.prototype, "showBorders", {
        set: function (value) {
            this._showBorders = Boolean(value);
        },
        enumerable: true,
        configurable: true
    });
    PdfViewerComponent.getLinkTarget = function (type) {
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
    };
    PdfViewerComponent.setExternalLinkTarget = function (type) {
        var linkTarget = PdfViewerComponent_1.getLinkTarget(type);
        if (linkTarget !== null) {
            PDFJS.externalLinkTarget = linkTarget;
        }
    };
    PdfViewerComponent.prototype.ngAfterViewChecked = function () {
        var _this = this;
        if (this.isInitialized) {
            return;
        }
        var offset = this.pdfViewerContainer.nativeElement.offsetParent;
        if (this.isVisible === true && offset == null) {
            this.isVisible = false;
            return;
        }
        if (this.isVisible === false && offset != null) {
            this.isVisible = true;
            setTimeout(function () {
                _this.ngOnInit();
                _this.ngOnChanges({ src: _this.src });
            });
        }
    };
    PdfViewerComponent.prototype.ngOnInit = function () {
        if (!isSSR() && this.isVisible) {
            this.isInitialized = true;
            this.setupMultiPageViewer();
            this.setupSinglePageViewer();
        }
    };
    PdfViewerComponent.prototype.ngOnDestroy = function () {
        this.clear();
    };
    PdfViewerComponent.prototype.onPageResize = function () {
        var _this = this;
        if (!this._canAutoResize || !this._pdf) {
            return;
        }
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        this.resizeTimeout = setTimeout(function () {
            _this.updateSize();
        }, 100);
    };
    Object.defineProperty(PdfViewerComponent.prototype, "pdfLinkService", {
        get: function () {
            return this._showAll
                ? this.pdfMultiPageLinkService
                : this.pdfSinglePageLinkService;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PdfViewerComponent.prototype, "pdfViewer", {
        get: function () {
            return this.getCurrentViewer();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PdfViewerComponent.prototype, "pdfFindController", {
        get: function () {
            return this._showAll
                ? this.pdfMultiPageFindController
                : this.pdfSinglePageFindController;
        },
        enumerable: true,
        configurable: true
    });
    PdfViewerComponent.prototype.ngOnChanges = function (changes) {
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
    };
    PdfViewerComponent.prototype.updateSize = function () {
        var _this = this;
        var currentViewer = this.getCurrentViewer();
        this._pdf
            .getPage(currentViewer.currentPageNumber)
            .then(function (page) {
            var rotation = _this._rotation || page.rotate;
            var viewportWidth = page.getViewport({
                scale: _this._zoom,
                rotation: rotation
            }).width * PdfViewerComponent_1.CSS_UNITS;
            var scale = _this._zoom;
            var stickToPage = true;
            // Scale the document when it shouldn't be in original size or doesn't fit into the viewport
            if (!_this._originalSize ||
                (_this._fitToPage &&
                    viewportWidth > _this.pdfViewerContainer.nativeElement.clientWidth)) {
                var viewPort = page.getViewport({ scale: 1, rotation: rotation });
                scale = _this.getScale(viewPort.width, viewPort.height);
                stickToPage = !_this._stickToPage;
            }
            currentViewer._setScale(scale, stickToPage);
        });
    };
    PdfViewerComponent.prototype.clear = function () {
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
    };
    PdfViewerComponent.prototype.setupMultiPageViewer = function () {
        var _this = this;
        PDFJS.disableTextLayer = !this._renderText;
        PdfViewerComponent_1.setExternalLinkTarget(this._externalLinkTarget);
        var eventBus = createEventBus(PDFJSViewer);
        eventBus.on('pagerendered', function (e) {
            _this.pageRendered.emit(e);
        });
        eventBus.on('pagechanging', function (e) {
            if (_this.pageScrollTimeout) {
                clearTimeout(_this.pageScrollTimeout);
            }
            _this.pageScrollTimeout = setTimeout(function () {
                _this._latestScrolledPage = e.pageNumber;
                _this.pageChange.emit(e.pageNumber);
            }, 100);
        });
        eventBus.on('textlayerrendered', function (e) {
            _this.textLayerRendered.emit(e);
        });
        this.pdfMultiPageLinkService = new PDFJSViewer.PDFLinkService({ eventBus: eventBus });
        this.pdfMultiPageFindController = new PDFJSViewer.PDFFindController({
            linkService: this.pdfMultiPageLinkService,
            eventBus: eventBus
        });
        var pdfOptions = {
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
    };
    PdfViewerComponent.prototype.setupSinglePageViewer = function () {
        var _this = this;
        PDFJS.disableTextLayer = !this._renderText;
        PdfViewerComponent_1.setExternalLinkTarget(this._externalLinkTarget);
        var eventBus = createEventBus(PDFJSViewer);
        eventBus.on('pagechanging', function (e) {
            if (e.pageNumber != _this._page) {
                _this.page = e.pageNumber;
            }
        });
        eventBus.on('pagerendered', function (e) {
            _this.pageRendered.emit(e);
        });
        eventBus.on('textlayerrendered', function (e) {
            _this.textLayerRendered.emit(e);
        });
        this.pdfSinglePageLinkService = new PDFJSViewer.PDFLinkService({
            eventBus: eventBus
        });
        this.pdfSinglePageFindController = new PDFJSViewer.PDFFindController({
            linkService: this.pdfSinglePageLinkService,
            eventBus: eventBus
        });
        var pdfOptions = {
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
    };
    PdfViewerComponent.prototype.getValidPageNumber = function (page) {
        if (page < 1) {
            return 1;
        }
        if (page > this._pdf.numPages) {
            return this._pdf.numPages;
        }
        return page;
    };
    PdfViewerComponent.prototype.getDocumentParams = function () {
        var srcType = typeof this.src;
        if (!this._cMapsUrl) {
            return this.src;
        }
        var params = {
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
    };
    PdfViewerComponent.prototype.loadPDF = function () {
        var _this = this;
        if (!this.src) {
            return;
        }
        if (this.lastLoaded === this.src) {
            this.update();
            return;
        }
        this.clear();
        this.loadingTask = PDFJS.getDocument(this.getDocumentParams());
        this.loadingTask.onProgress = function (progressData) {
            _this.onProgress.emit(progressData);
        };
        var src = this.src;
        this.loadingTask.promise.then(function (pdf) {
            _this._pdf = pdf;
            _this.lastLoaded = src;
            _this.afterLoadComplete.emit(pdf);
            if (!_this.pdfMultiPageViewer) {
                _this.setupMultiPageViewer();
                _this.setupSinglePageViewer();
            }
            _this.resetPdfDocument();
            _this.update();
        }, function (error) {
            _this.onError.emit(error);
        });
    };
    PdfViewerComponent.prototype.update = function () {
        this.page = this._page;
        this.render();
    };
    PdfViewerComponent.prototype.render = function () {
        var _this = this;
        this._page = this.getValidPageNumber(this._page);
        var currentViewer = this.getCurrentViewer();
        if (this._rotation !== 0 ||
            currentViewer.pagesRotation !== this._rotation) {
            setTimeout(function () {
                currentViewer.pagesRotation = _this._rotation;
            });
        }
        if (this._stickToPage) {
            setTimeout(function () {
                currentViewer.currentPageNumber = _this._page;
            });
        }
        this.updateSize();
    };
    PdfViewerComponent.prototype.getScale = function (viewportWidth, viewportHeight) {
        var borderSize = (this._showBorders ? 2 * PdfViewerComponent_1.BORDER_WIDTH : 0);
        var pdfContainerWidth = this.pdfViewerContainer.nativeElement.clientWidth - borderSize;
        var pdfContainerHeight = this.pdfViewerContainer.nativeElement.clientHeight - borderSize;
        if (pdfContainerHeight === 0 || viewportHeight === 0 || pdfContainerWidth === 0 || viewportWidth === 0) {
            return 1;
        }
        var ratio = 1;
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
    };
    PdfViewerComponent.prototype.getCurrentViewer = function () {
        return this._showAll ? this.pdfMultiPageViewer : this.pdfSinglePageViewer;
    };
    PdfViewerComponent.prototype.resetPdfDocument = function () {
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
    };
    var PdfViewerComponent_1;
    PdfViewerComponent.CSS_UNITS = 96.0 / 72.0;
    PdfViewerComponent.BORDER_WIDTH = 9;
    PdfViewerComponent.ctorParameters = function () { return [
        { type: ElementRef }
    ]; };
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
            template: "\n    <div #pdfViewerContainer class=\"ng2-pdf-viewer-container\">\n      <div class=\"pdfViewer\"></div>\n    </div>\n  ",
            styles: [".ng2-pdf-viewer-container{overflow-x:auto;position:relative;height:100%;-webkit-overflow-scrolling:touch}:host ::ng-deep .textLayer{position:absolute;left:0;top:0;right:0;bottom:0;overflow:hidden;opacity:.2;line-height:1}:host ::ng-deep .textLayer>span{color:transparent;position:absolute;white-space:pre;cursor:text;-webkit-transform-origin:0 0;transform-origin:0 0}:host ::ng-deep .textLayer .highlight{margin:-1px;padding:1px;background-color:#b400aa;border-radius:4px}:host ::ng-deep .textLayer .highlight.begin{border-radius:4px 0 0 4px}:host ::ng-deep .textLayer .highlight.end{border-radius:0 4px 4px 0}:host ::ng-deep .textLayer .highlight.middle{border-radius:0}:host ::ng-deep .textLayer .highlight.selected{background-color:#006400}:host ::ng-deep .textLayer ::-moz-selection{background:#00f}:host ::ng-deep .textLayer ::selection{background:#00f}:host ::ng-deep .textLayer .endOfContent{display:block;position:absolute;left:0;top:100%;right:0;bottom:0;z-index:-1;cursor:default;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}:host ::ng-deep .textLayer .endOfContent.active{top:0}:host ::ng-deep .annotationLayer section{position:absolute}:host ::ng-deep .annotationLayer .buttonWidgetAnnotation.pushButton>a,:host ::ng-deep .annotationLayer .linkAnnotation>a{position:absolute;font-size:1em;top:0;left:0;width:100%;height:100%}:host ::ng-deep .annotationLayer .buttonWidgetAnnotation.pushButton>a:hover,:host ::ng-deep .annotationLayer .linkAnnotation>a:hover{opacity:.2;background:#ff0;box-shadow:0 2px 10px #ff0}:host ::ng-deep .annotationLayer .textAnnotation img{position:absolute;cursor:pointer}:host ::ng-deep .annotationLayer .textWidgetAnnotation input,:host ::ng-deep .annotationLayer .textWidgetAnnotation textarea{background-color:rgba(0,54,255,.13);border:1px solid transparent;box-sizing:border-box;font-size:9px;height:100%;margin:0;padding:0 3px;vertical-align:top;width:100%}:host ::ng-deep .annotationLayer .choiceWidgetAnnotation select{background-color:rgba(0,54,255,.13);border:1px solid transparent;box-sizing:border-box;font-size:9px;height:100%;margin:0;padding:0 3px;vertical-align:top;width:100%}:host ::ng-deep .annotationLayer .buttonWidgetAnnotation.checkBox input,:host ::ng-deep .annotationLayer .buttonWidgetAnnotation.radioButton input{background-color:rgba(0,54,255,.13);border:1px solid transparent;box-sizing:border-box;font-size:9px;height:100%;margin:0;vertical-align:top;width:100%}:host ::ng-deep .annotationLayer .choiceWidgetAnnotation select option{padding:0}:host ::ng-deep .annotationLayer .buttonWidgetAnnotation.radioButton input{border-radius:50%}:host ::ng-deep .annotationLayer .textWidgetAnnotation textarea{font:message-box;font-size:9px;resize:none}:host ::ng-deep .annotationLayer .textWidgetAnnotation input[disabled],:host ::ng-deep .annotationLayer .textWidgetAnnotation textarea[disabled]{background:0 0;border:1px solid transparent;cursor:not-allowed}:host ::ng-deep .annotationLayer .choiceWidgetAnnotation select[disabled]{background:0 0;border:1px solid transparent;cursor:not-allowed}:host ::ng-deep .annotationLayer .buttonWidgetAnnotation.checkBox input[disabled],:host ::ng-deep .annotationLayer .buttonWidgetAnnotation.radioButton input[disabled]{background:0 0;border:1px solid transparent;cursor:not-allowed}:host ::ng-deep .annotationLayer .textWidgetAnnotation input:hover,:host ::ng-deep .annotationLayer .textWidgetAnnotation textarea:hover{border:1px solid #000}:host ::ng-deep .annotationLayer .choiceWidgetAnnotation select:hover{border:1px solid #000}:host ::ng-deep .annotationLayer .buttonWidgetAnnotation.checkBox input:hover,:host ::ng-deep .annotationLayer .buttonWidgetAnnotation.radioButton input:hover{border:1px solid #000}:host ::ng-deep .annotationLayer .textWidgetAnnotation input:focus,:host ::ng-deep .annotationLayer .textWidgetAnnotation textarea:focus{background:0 0;border:1px solid transparent}:host ::ng-deep .annotationLayer .choiceWidgetAnnotation select:focus{background:0 0;border:1px solid transparent}:host ::ng-deep .annotationLayer .buttonWidgetAnnotation.checkBox input:checked:after,:host ::ng-deep .annotationLayer .buttonWidgetAnnotation.checkBox input:checked:before{background-color:#000;content:\"\";display:block;position:absolute;height:80%;left:45%;width:1px}:host ::ng-deep .annotationLayer .buttonWidgetAnnotation.radioButton input:checked:before{background-color:#000;content:\"\";display:block;position:absolute;border-radius:50%;height:50%;left:30%;top:20%;width:50%}:host ::ng-deep .annotationLayer .buttonWidgetAnnotation.checkBox input:checked:before{-webkit-transform:rotate(45deg);transform:rotate(45deg)}:host ::ng-deep .annotationLayer .buttonWidgetAnnotation.checkBox input:checked:after{-webkit-transform:rotate(-45deg);transform:rotate(-45deg)}:host ::ng-deep .annotationLayer .textWidgetAnnotation input.comb{font-family:monospace;padding-left:2px;padding-right:0}:host ::ng-deep .annotationLayer .textWidgetAnnotation input.comb:focus{width:115%}:host ::ng-deep .annotationLayer .buttonWidgetAnnotation.checkBox input,:host ::ng-deep .annotationLayer .buttonWidgetAnnotation.radioButton input{-webkit-appearance:none;-moz-appearance:none;appearance:none;padding:0}:host ::ng-deep .annotationLayer .popupWrapper{position:absolute;width:20em}:host ::ng-deep .annotationLayer .popup{position:absolute;z-index:200;max-width:20em;background-color:#ff9;box-shadow:0 2px 5px #888;border-radius:2px;padding:6px;margin-left:5px;cursor:pointer;font:message-box;font-size:9px;word-wrap:break-word}:host ::ng-deep .annotationLayer .popup>*{font-size:9px}:host ::ng-deep .annotationLayer .popup h1{display:inline-block}:host ::ng-deep .annotationLayer .popup span{display:inline-block;margin-left:5px}:host ::ng-deep .annotationLayer .popup p{border-top:1px solid #333;margin-top:2px;padding-top:2px}:host ::ng-deep .annotationLayer .caretAnnotation,:host ::ng-deep .annotationLayer .circleAnnotation svg ellipse,:host ::ng-deep .annotationLayer .fileAttachmentAnnotation,:host ::ng-deep .annotationLayer .freeTextAnnotation,:host ::ng-deep .annotationLayer .highlightAnnotation,:host ::ng-deep .annotationLayer .inkAnnotation svg polyline,:host ::ng-deep .annotationLayer .lineAnnotation svg line,:host ::ng-deep .annotationLayer .polygonAnnotation svg polygon,:host ::ng-deep .annotationLayer .polylineAnnotation svg polyline,:host ::ng-deep .annotationLayer .squareAnnotation svg rect,:host ::ng-deep .annotationLayer .squigglyAnnotation,:host ::ng-deep .annotationLayer .stampAnnotation,:host ::ng-deep .annotationLayer .strikeoutAnnotation,:host ::ng-deep .annotationLayer .underlineAnnotation{cursor:pointer}:host ::ng-deep .pdfViewer{padding-bottom:10px}:host ::ng-deep .pdfViewer .canvasWrapper{overflow:hidden}:host ::ng-deep .pdfViewer .page{direction:ltr;width:816px;height:1056px;margin:1px auto -8px;position:relative;overflow:visible;border:9px solid rgba(0,0,0,.01);box-sizing:initial;background-clip:content-box;-webkit-border-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAATCAQAAADYWf5HAAAA6UlEQVR4Xl2Pi2rEMAwE16fm1f7/r14v7w4rI0IzLAF7hLxNevBSEMEF5+OilNCsRd8ZMyn+a4NmsOT8WJw1lFbSYgGFzF2bLFoLjTClWjKKGRWpDYAGXUnZ4uhbBUzF3Oe/GG/ue2fn4GgsyXhNgysV2JnrhKEMg4fEZcALmiKbNhBBRFpSyDOj1G4QOVly6O1FV54ZZq8OVygrciDt6JazRgi1ljTPH0gbrPmHPXAbCiDd4GawIjip1TPh9tt2sz24qaCjr/jAb/GBFTbq9KZ7Ke/Cqt8nayUikZKsWZK7Fe6bg5dOUt8fZHWG2BHc+6EAAAAASUVORK5CYII=) 9 9 repeat;-o-border-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAATCAQAAADYWf5HAAAA6UlEQVR4Xl2Pi2rEMAwE16fm1f7/r14v7w4rI0IzLAF7hLxNevBSEMEF5+OilNCsRd8ZMyn+a4NmsOT8WJw1lFbSYgGFzF2bLFoLjTClWjKKGRWpDYAGXUnZ4uhbBUzF3Oe/GG/ue2fn4GgsyXhNgysV2JnrhKEMg4fEZcALmiKbNhBBRFpSyDOj1G4QOVly6O1FV54ZZq8OVygrciDt6JazRgi1ljTPH0gbrPmHPXAbCiDd4GawIjip1TPh9tt2sz24qaCjr/jAb/GBFTbq9KZ7Ke/Cqt8nayUikZKsWZK7Fe6bg5dOUt8fZHWG2BHc+6EAAAAASUVORK5CYII=) 9 9 repeat;border-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAATCAQAAADYWf5HAAAA6UlEQVR4Xl2Pi2rEMAwE16fm1f7/r14v7w4rI0IzLAF7hLxNevBSEMEF5+OilNCsRd8ZMyn+a4NmsOT8WJw1lFbSYgGFzF2bLFoLjTClWjKKGRWpDYAGXUnZ4uhbBUzF3Oe/GG/ue2fn4GgsyXhNgysV2JnrhKEMg4fEZcALmiKbNhBBRFpSyDOj1G4QOVly6O1FV54ZZq8OVygrciDt6JazRgi1ljTPH0gbrPmHPXAbCiDd4GawIjip1TPh9tt2sz24qaCjr/jAb/GBFTbq9KZ7Ke/Cqt8nayUikZKsWZK7Fe6bg5dOUt8fZHWG2BHc+6EAAAAASUVORK5CYII=) 9 9 repeat;background-color:#fff}:host ::ng-deep .pdfViewer.removePageBorders .page{margin:0 auto 10px;border:none}:host ::ng-deep .pdfViewer.removePageBorders{padding-bottom:0}:host ::ng-deep .pdfViewer.singlePageView{display:inline-block}:host ::ng-deep .pdfViewer.singlePageView .page{margin:0;border:none}:host ::ng-deep .pdfViewer.scrollHorizontal,:host ::ng-deep .pdfViewer.scrollWrapped{margin-left:3.5px;margin-right:3.5px;text-align:center}:host ::ng-deep .spread{margin-left:3.5px;margin-right:3.5px;text-align:center}:host ::ng-deep .pdfViewer.scrollHorizontal,:host ::ng-deep .spread{white-space:nowrap}:host ::ng-deep .pdfViewer.removePageBorders,:host ::ng-deep .pdfViewer.scrollHorizontal .spread,:host ::ng-deep .pdfViewer.scrollWrapped .spread{margin-left:0;margin-right:0}:host ::ng-deep .spread .page{display:inline-block;vertical-align:middle;margin-left:-3.5px;margin-right:-3.5px}:host ::ng-deep .pdfViewer.scrollHorizontal .page,:host ::ng-deep .pdfViewer.scrollHorizontal .spread,:host ::ng-deep .pdfViewer.scrollWrapped .page,:host ::ng-deep .pdfViewer.scrollWrapped .spread{display:inline-block;vertical-align:middle}:host ::ng-deep .pdfViewer.scrollHorizontal .page,:host ::ng-deep .pdfViewer.scrollWrapped .page{margin-left:-3.5px;margin-right:-3.5px}:host ::ng-deep .pdfViewer.removePageBorders .spread .page,:host ::ng-deep .pdfViewer.removePageBorders.scrollHorizontal .page,:host ::ng-deep .pdfViewer.removePageBorders.scrollWrapped .page{margin-left:5px;margin-right:5px}:host ::ng-deep .pdfViewer .page canvas{margin:0;display:block}:host ::ng-deep .pdfViewer .page canvas[hidden]{display:none}:host ::ng-deep .pdfViewer .page .loadingIcon{position:absolute;display:block;left:0;top:0;right:0;bottom:0;background:url(data:image/gif;base64,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) center no-repeat}:host ::ng-deep .pdfPresentationMode .pdfViewer{margin-left:0;margin-right:0}:host ::ng-deep .pdfPresentationMode .pdfViewer .page,:host ::ng-deep .pdfPresentationMode .pdfViewer .spread{display:block}:host ::ng-deep .pdfPresentationMode .pdfViewer .page,:host ::ng-deep .pdfPresentationMode .pdfViewer.removePageBorders .page{margin-left:auto;margin-right:auto}:host ::ng-deep .pdfPresentationMode:-ms-fullscreen .pdfViewer .page{margin-bottom:100%!important}:host ::ng-deep .pdfPresentationMode:-webkit-full-screen .pdfViewer .page{margin-bottom:100%;border:0}:host ::ng-deep .pdfPresentationMode:-moz-full-screen .pdfViewer .page,:host ::ng-deep .pdfPresentationMode:-webkit-full-screen .pdfViewer .page,:host ::ng-deep .pdfPresentationMode:fullscreen .pdfViewer .page{margin-bottom:100%;border:0}"]
        })
    ], PdfViewerComponent);
    return PdfViewerComponent;
}());
export { PdfViewerComponent };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGRmLXZpZXdlci5jb21wb25lbnQuanMiLCJzb3VyY2VSb290Ijoibmc6Ly9uZzItcGRmLXZpZXdlci8iLCJzb3VyY2VzIjpbInNyYy9hcHAvcGRmLXZpZXdlci9wZGYtdmlld2VyLmNvbXBvbmVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7QUFDSCxPQUFPLEVBQ0wsU0FBUyxFQUNULEtBQUssRUFDTCxNQUFNLEVBQ04sVUFBVSxFQUNWLFlBQVksRUFDWixTQUFTLEVBQ1QsYUFBYSxFQUNiLE1BQU0sRUFDTixZQUFZLEVBQ1osU0FBUyxFQUNULFNBQVMsRUFDVCxnQkFBZ0IsRUFDakIsTUFBTSxlQUFlLENBQUM7QUFVdkIsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLDBCQUEwQixDQUFDO0FBRTFELElBQUksS0FBVSxDQUFDO0FBQ2YsSUFBSSxXQUFnQixDQUFDO0FBRXJCLFNBQVMsS0FBSztJQUNaLE9BQU8sT0FBTyxNQUFNLEtBQUssV0FBVyxDQUFDO0FBQ3ZDLENBQUM7QUFFRCxJQUFJLENBQUMsS0FBSyxFQUFFLEVBQUU7SUFDWixLQUFLLEdBQUcsT0FBTyxDQUFDLHNCQUFzQixDQUFDLENBQUM7SUFDeEMsV0FBVyxHQUFHLE9BQU8sQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO0lBRW5ELEtBQUssQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUM7Q0FDL0M7QUFFRCxNQUFNLENBQU4sSUFBWSxjQUlYO0FBSkQsV0FBWSxjQUFjO0lBQ3hCLDJEQUFRLENBQUE7SUFDUix5REFBTyxDQUFBO0lBQ1AsMkRBQVEsQ0FBQTtBQUNWLENBQUMsRUFKVyxjQUFjLEtBQWQsY0FBYyxRQUl6QjtBQVdEO0lBaUxFLDRCQUFvQixPQUFtQjtRQUFuQixZQUFPLEdBQVAsT0FBTyxDQUFZO1FBOUsvQixjQUFTLEdBQVksS0FBSyxDQUFDO1FBYTNCLGNBQVMsR0FDZixPQUFPLEtBQUssS0FBSyxXQUFXO1lBQzFCLENBQUMs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LENBQUM7c0RBUWpCO0lBR0Q7UUFEQyxLQUFLLENBQUMsc0JBQXNCLENBQUM7Z0VBRzdCO0lBR0Q7UUFEQyxLQUFLLENBQUMsWUFBWSxDQUFDO3dEQUduQjtJQUdEO1FBREMsS0FBSyxDQUFDLGFBQWEsQ0FBQzt1REFHcEI7SUFHRDtRQURDLEtBQUssQ0FBQyxjQUFjLENBQUM7eURBR3JCO0lBb0ZEO1FBREMsWUFBWSxDQUFDLGVBQWUsRUFBRSxFQUFFLENBQUM7MERBYWpDO0lBdFBVLGtCQUFrQjtRQVQ5QixTQUFTLENBQUM7WUFDVCxRQUFRLEVBQUUsWUFBWTtZQUN0QixRQUFRLEVBQUUsMkhBSVQ7O1NBRUYsQ0FBQztPQUNXLGtCQUFrQixDQThrQjlCO0lBQUQseUJBQUM7Q0FBQSxBQTlrQkQsSUE4a0JDO1NBOWtCWSxrQkFBa0IiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENyZWF0ZWQgYnkgdmFkaW1kZXogb24gMjEvMDYvMTYuXG4gKi9cbmltcG9ydCB7XG4gIENvbXBvbmVudCxcbiAgSW5wdXQsXG4gIE91dHB1dCxcbiAgRWxlbWVudFJlZixcbiAgRXZlbnRFbWl0dGVyLFxuICBPbkNoYW5nZXMsXG4gIFNpbXBsZUNoYW5nZXMsXG4gIE9uSW5pdCxcbiAgSG9zdExpc3RlbmVyLFxuICBPbkRlc3Ryb3ksXG4gIFZpZXdDaGlsZCxcbiAgQWZ0ZXJWaWV3Q2hlY2tlZFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7XG4gIFBERkRvY3VtZW50UHJveHksXG4gIFBERlZpZXdlclBhcmFtcyxcbiAgUERGUGFnZVByb3h5LFxuICBQREZTb3VyY2UsXG4gIFBERlByb2dyZXNzRGF0YSxcbiAgUERGUHJvbWlzZVxufSBmcm9tICdwZGZqcy1kaXN0JztcblxuaW1wb3J0IHsgY3JlYXRlRXZlbnRCdXMgfSBmcm9tICcuLi91dGlscy9ldmVudC1idXMtdXRpbHMnO1xuXG5sZXQgUERGSlM6IGFueTtcbmxldCBQREZKU1ZpZXdlcjogYW55O1xuXG5mdW5jdGlvbiBpc1NTUigpIHtcbiAgcmV0dXJuIHR5cGVvZiB3aW5kb3cgPT09ICd1bmRlZmluZWQnO1xufVxuXG5pZiAoIWlzU1NSKCkpIHtcbiAgUERGSlMgPSByZXF1aXJlKCdwZGZqcy1kaXN0L2J1aWxkL3BkZicpO1xuICBQREZKU1ZpZXdlciA9IHJlcXVpcmUoJ3BkZmpzLWRpc3Qvd2ViL3BkZl92aWV3ZXInKTtcblxuICBQREZKUy52ZXJib3NpdHkgPSBQREZKUy5WZXJib3NpdHlMZXZlbC5FUlJPUlM7XG59XG5cbmV4cG9ydCBlbnVtIFJlbmRlclRleHRNb2RlIHtcbiAgRElTQUJMRUQsXG4gIEVOQUJMRUQsXG4gIEVOSEFOQ0VEXG59XG5cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogJ3BkZi12aWV3ZXInLFxuICB0ZW1wbGF0ZTogYFxuICAgIDxkaXYgI3BkZlZpZXdlckNvbnRhaW5lciBjbGFzcz1cIm5nMi1wZGYtdmlld2VyLWNvbnRhaW5lclwiPlxuICAgICAgPGRpdiBjbGFzcz1cInBkZlZpZXdlclwiPjwvZGl2PlxuICAgIDwvZGl2PlxuICBgLFxuICBzdHlsZVVybHM6IFsnLi9wZGYtdmlld2VyLmNvbXBvbmVudC5zY3NzJ11cbn0pXG5leHBvcnQgY2xhc3MgUGRmVmlld2VyQ29tcG9uZW50XG4gIGltcGxlbWVudHMgT25DaGFuZ2VzLCBPbkluaXQsIE9uRGVzdHJveSwgQWZ0ZXJWaWV3Q2hlY2tlZCB7XG4gIEBWaWV3Q2hpbGQoJ3BkZlZpZXdlckNvbnRhaW5lcicpIHBkZlZpZXdlckNvbnRhaW5lcjtcbiAgcHJpdmF0ZSBpc1Zpc2libGU6IGJvb2xlYW4gPSBmYWxzZTtcblxuICBzdGF0aWMgQ1NTX1VOSVRTOiBudW1iZXIgPSA5Ni4wIC8gNzIuMDtcbiAgc3RhdGljIEJPUkRFUl9XSURUSDogbnVtYmVyID0gOTtcblxuICBwcml2YXRlIHBkZk11bHRpUGFnZVZpZXdlcjogYW55O1xuICBwcml2YXRlIHBkZk11bHRpUGFnZUxpbmtTZXJ2aWNlOiBhbnk7XG4gIHByaXZhdGUgcGRmTXVsdGlQYWdlRmluZENvbnRyb2xsZXI6IGFueTtcblxuICBwcml2YXRlIHBkZlNpbmdsZVBhZ2VWaWV3ZXI6IGFueTtcbiAgcHJpdmF0ZSBwZGZTaW5nbGVQYWdlTGlua1NlcnZpY2U6IGFueTtcbiAgcHJpdmF0ZSBwZGZTaW5nbGVQYWdlRmluZENvbnRyb2xsZXI6IGFueTtcblxuICBwcml2YXRlIF9jTWFwc1VybCA9XG4gICAgdHlwZW9mIFBERkpTICE9PSAndW5kZWZpbmVkJ1xuICAgICAgPyBgaHR0cHM6Ly91bnBrZy5jb20vcGRmanMtZGlzdEAkeyhQREZKUyBhcyBhbnkpLnZlcnNpb259L2NtYXBzL2BcbiAgICAgIDogbnVsbDtcbiAgcHJpdmF0ZSBfcmVuZGVyVGV4dCA9IHRydWU7XG4gIHByaXZhdGUgX3JlbmRlclRleHRNb2RlOiBSZW5kZXJUZXh0TW9kZSA9IFJlbmRlclRleHRNb2RlLkVOQUJMRUQ7XG4gIHByaXZhdGUgX3N0aWNrVG9QYWdlID0gZmFsc2U7XG4gIHByaXZhdGUgX29yaWdpbmFsU2l6ZSA9IHRydWU7XG4gIHByaXZhdGUgX3BkZjogUERGRG9jdW1lbnRQcm94eTtcbiAgcHJpdmF0ZSBfcGFnZSA9IDE7XG4gIHByaXZhdGUgX3pvb20gPSAxO1xuICBwcml2YXRlIF96b29tU2NhbGU6ICdwYWdlLWhlaWdodCd8J3BhZ2UtZml0J3wncGFnZS13aWR0aCcgPSAncGFnZS13aWR0aCc7XG4gIHByaXZhdGUgX3JvdGF0aW9uID0gMDtcbiAgcHJpdmF0ZSBfc2hvd0FsbCA9IHRydWU7XG4gIHByaXZhdGUgX2NhbkF1dG9SZXNpemUgPSB0cnVlO1xuICBwcml2YXRlIF9maXRUb1BhZ2UgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfZXh0ZXJuYWxMaW5rVGFyZ2V0ID0gJ2JsYW5rJztcbiAgcHJpdmF0ZSBfc2hvd0JvcmRlcnMgPSBmYWxzZTtcbiAgcHJpdmF0ZSBsYXN0TG9hZGVkOiBzdHJpbmcgfCBVaW50OEFycmF5IHwgUERGU291cmNlO1xuICBwcml2YXRlIF9sYXRlc3RTY3JvbGxlZFBhZ2U6IG51bWJlcjtcblxuICBwcml2YXRlIHJlc2l6ZVRpbWVvdXQ6IE5vZGVKUy5UaW1lcjtcbiAgcHJpdmF0ZSBwYWdlU2Nyb2xsVGltZW91dDogTm9kZUpTLlRpbWVyO1xuICBwcml2YXRlIGlzSW5pdGlhbGl6ZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBsb2FkaW5nVGFzazogYW55O1xuXG4gIEBPdXRwdXQoJ2FmdGVyLWxvYWQtY29tcGxldGUnKSBhZnRlckxvYWRDb21wbGV0ZSA9IG5ldyBFdmVudEVtaXR0ZXI8XG4gICAgUERGRG9jdW1lbnRQcm94eVxuICA+KCk7XG4gIEBPdXRwdXQoJ3BhZ2UtcmVuZGVyZWQnKSBwYWdlUmVuZGVyZWQgPSBuZXcgRXZlbnRFbWl0dGVyPEN1c3RvbUV2ZW50PigpO1xuICBAT3V0cHV0KCd0ZXh0LWxheWVyLXJlbmRlcmVkJykgdGV4dExheWVyUmVuZGVyZWQgPSBuZXcgRXZlbnRFbWl0dGVyPFxuICAgIEN1c3RvbUV2ZW50XG4gID4oKTtcbiAgQE91dHB1dCgnZXJyb3InKSBvbkVycm9yID0gbmV3IEV2ZW50RW1pdHRlcjxhbnk+KCk7XG4gIEBPdXRwdXQoJ29uLXByb2dyZXNzJykgb25Qcm9ncmVzcyA9IG5ldyBFdmVudEVtaXR0ZXI8UERGUHJvZ3Jlc3NEYXRhPigpO1xuICBAT3V0cHV0KCkgcGFnZUNoYW5nZTogRXZlbnRFbWl0dGVyPG51bWJlcj4gPSBuZXcgRXZlbnRFbWl0dGVyPG51bWJlcj4odHJ1ZSk7XG4gIEBJbnB1dCgpXG4gIHNyYzogc3RyaW5nIHwgVWludDhBcnJheSB8IFBERlNvdXJjZTtcblxuICBASW5wdXQoJ2MtbWFwcy11cmwnKVxuICBzZXQgY01hcHNVcmwoY01hcHNVcmw6IHN0cmluZykge1xuICAgIHRoaXMuX2NNYXBzVXJsID0gY01hcHNVcmw7XG4gIH1cblxuIEBJbnB1dCgncGFnZScpXG4gIHNldCBwYWdlKF9wYWdlKSB7XG4gICAgX3BhZ2UgPSBwYXJzZUludChfcGFnZSwgMTApIHx8IDE7XG4gICAgY29uc3Qgb3JnaW5hbFBhZ2UgPSBfcGFnZTtcblxuICAgIGlmICh0aGlzLl9wZGYpIHtcbiAgICAgIF9wYWdlID0gdGhpcy5nZXRWYWxpZFBhZ2VOdW1iZXIoX3BhZ2UpO1xuICAgIH1cblxuICAgIHRoaXMuX3BhZ2UgPSBfcGFnZTtcbiAgICBpZiAob3JnaW5hbFBhZ2UgIT09IF9wYWdlKSB7XG4gICAgICB0aGlzLnBhZ2VDaGFuZ2UuZW1pdChfcGFnZSk7XG4gICAgfVxuICB9XG5cbiAgQElucHV0KCdyZW5kZXItdGV4dCcpXG4gIHNldCByZW5kZXJUZXh0KHJlbmRlclRleHQ6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl9yZW5kZXJUZXh0ID0gcmVuZGVyVGV4dDtcbiAgfVxuXG4gIEBJbnB1dCgncmVuZGVyLXRleHQtbW9kZScpXG4gIHNldCByZW5kZXJUZXh0TW9kZShyZW5kZXJUZXh0TW9kZTogUmVuZGVyVGV4dE1vZGUpIHtcbiAgICB0aGlzLl9yZW5kZXJUZXh0TW9kZSA9IHJlbmRlclRleHRNb2RlO1xuICB9XG5cbiAgQElucHV0KCdvcmlnaW5hbC1zaXplJylcbiAgc2V0IG9yaWdpbmFsU2l6ZShvcmlnaW5hbFNpemU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl9vcmlnaW5hbFNpemUgPSBvcmlnaW5hbFNpemU7XG4gIH1cblxuICBASW5wdXQoJ3Nob3ctYWxsJylcbiAgc2V0IHNob3dBbGwodmFsdWU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl9zaG93QWxsID0gdmFsdWU7XG4gIH1cblxuICBASW5wdXQoJ3N0aWNrLXRvLXBhZ2UnKVxuICBzZXQgc3RpY2tUb1BhZ2UodmFsdWU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl9zdGlja1RvUGFnZSA9IHZhbHVlO1xuICB9XG5cbiAgQElucHV0KCd6b29tJylcbiAgc2V0IHpvb20odmFsdWU6IG51bWJlcikge1xuICAgIGlmICh2YWx1ZSA8PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fem9vbSA9IHZhbHVlO1xuICB9XG5cbiAgZ2V0IHpvb20oKSB7XG4gICAgcmV0dXJuIHRoaXMuX3pvb207XG4gIH1cblxuICBASW5wdXQoJ3pvb20tc2NhbGUnKVxuICBzZXQgem9vbVNjYWxlKHZhbHVlOiAncGFnZS1oZWlnaHQnfCdwYWdlLWZpdCcgfCAncGFnZS13aWR0aCcpIHtcbiAgICB0aGlzLl96b29tU2NhbGUgPSB2YWx1ZTtcbiAgfVxuXG4gIGdldCB6b29tU2NhbGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3pvb21TY2FsZTtcbiAgfVxuXG4gIEBJbnB1dCgncm90YXRpb24nKVxuICBzZXQgcm90YXRpb24odmFsdWU6IG51bWJlcikge1xuICAgIGlmICghKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicgJiYgdmFsdWUgJSA5MCA9PT0gMCkpIHtcbiAgICAgIGNvbnNvbGUud2FybignSW52YWxpZCBwYWdlcyByb3RhdGlvbiBhbmdsZS4nKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9yb3RhdGlvbiA9IHZhbHVlO1xuICB9XG5cbiAgQElucHV0KCdleHRlcm5hbC1saW5rLXRhcmdldCcpXG4gIHNldCBleHRlcm5hbExpbmtUYXJnZXQodmFsdWU6IHN0cmluZykge1xuICAgIHRoaXMuX2V4dGVybmFsTGlua1RhcmdldCA9IHZhbHVlO1xuICB9XG5cbiAgQElucHV0KCdhdXRvcmVzaXplJylcbiAgc2V0IGF1dG9yZXNpemUodmFsdWU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl9jYW5BdXRvUmVzaXplID0gQm9vbGVhbih2YWx1ZSk7XG4gIH1cblxuICBASW5wdXQoJ2ZpdC10by1wYWdlJylcbiAgc2V0IGZpdFRvUGFnZSh2YWx1ZTogYm9vbGVhbikge1xuICAgIHRoaXMuX2ZpdFRvUGFnZSA9IEJvb2xlYW4odmFsdWUpO1xuICB9XG5cbiAgQElucHV0KCdzaG93LWJvcmRlcnMnKVxuICBzZXQgc2hvd0JvcmRlcnModmFsdWU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl9zaG93Qm9yZGVycyA9IEJvb2xlYW4odmFsdWUpO1xuICB9XG5cbiAgc3RhdGljIGdldExpbmtUYXJnZXQodHlwZTogc3RyaW5nKSB7XG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICBjYXNlICdibGFuayc6XG4gICAgICAgIHJldHVybiAoPGFueT5QREZKUykuTGlua1RhcmdldC5CTEFOSztcbiAgICAgIGNhc2UgJ25vbmUnOlxuICAgICAgICByZXR1cm4gKDxhbnk+UERGSlMpLkxpbmtUYXJnZXQuTk9ORTtcbiAgICAgIGNhc2UgJ3NlbGYnOlxuICAgICAgICByZXR1cm4gKDxhbnk+UERGSlMpLkxpbmtUYXJnZXQuU0VMRjtcbiAgICAgIGNhc2UgJ3BhcmVudCc6XG4gICAgICAgIHJldHVybiAoPGFueT5QREZKUykuTGlua1RhcmdldC5QQVJFTlQ7XG4gICAgICBjYXNlICd0b3AnOlxuICAgICAgICByZXR1cm4gKDxhbnk+UERGSlMpLkxpbmtUYXJnZXQuVE9QO1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgc3RhdGljIHNldEV4dGVybmFsTGlua1RhcmdldCh0eXBlOiBzdHJpbmcpIHtcbiAgICBjb25zdCBsaW5rVGFyZ2V0ID0gUGRmVmlld2VyQ29tcG9uZW50LmdldExpbmtUYXJnZXQodHlwZSk7XG5cbiAgICBpZiAobGlua1RhcmdldCAhPT0gbnVsbCkge1xuICAgICAgKDxhbnk+UERGSlMpLmV4dGVybmFsTGlua1RhcmdldCA9IGxpbmtUYXJnZXQ7XG4gICAgfVxuICB9XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBlbGVtZW50OiBFbGVtZW50UmVmKSB7XG4gICAgaWYgKGlzU1NSKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsZXQgcGRmV29ya2VyU3JjOiBzdHJpbmc7XG5cbiAgICBpZiAoXG4gICAgICB3aW5kb3cuaGFzT3duUHJvcGVydHkoJ3BkZldvcmtlclNyYycpICYmXG4gICAgICB0eXBlb2YgKHdpbmRvdyBhcyBhbnkpLnBkZldvcmtlclNyYyA9PT0gJ3N0cmluZycgJiZcbiAgICAgICh3aW5kb3cgYXMgYW55KS5wZGZXb3JrZXJTcmNcbiAgICApIHtcbiAgICAgIHBkZldvcmtlclNyYyA9ICh3aW5kb3cgYXMgYW55KS5wZGZXb3JrZXJTcmM7XG4gICAgfSBlbHNlIHtcbiAgICAgIHBkZldvcmtlclNyYyA9IGBodHRwczovL2NkbmpzLmNsb3VkZmxhcmUuY29tL2FqYXgvbGlicy9wZGYuanMvJHtcbiAgICAgICAgKFBERkpTIGFzIGFueSkudmVyc2lvblxuICAgICAgfS9wZGYud29ya2VyLm1pbi5qc2A7XG4gICAgfVxuXG4gICAgKFBERkpTIGFzIGFueSkuR2xvYmFsV29ya2VyT3B0aW9ucy53b3JrZXJTcmMgPSBwZGZXb3JrZXJTcmM7XG4gIH1cblxuICBuZ0FmdGVyVmlld0NoZWNrZWQoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuaXNJbml0aWFsaXplZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IG9mZnNldCA9IHRoaXMucGRmVmlld2VyQ29udGFpbmVyLm5hdGl2ZUVsZW1lbnQub2Zmc2V0UGFyZW50O1xuXG4gICAgaWYgKHRoaXMuaXNWaXNpYmxlID09PSB0cnVlICYmIG9mZnNldCA9PSBudWxsKSB7XG4gICAgICB0aGlzLmlzVmlzaWJsZSA9IGZhbHNlO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmlzVmlzaWJsZSA9PT0gZmFsc2UgJiYgb2Zmc2V0ICE9IG51bGwpIHtcbiAgICAgIHRoaXMuaXNWaXNpYmxlID0gdHJ1ZTtcblxuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMubmdPbkluaXQoKTtcbiAgICAgICAgdGhpcy5uZ09uQ2hhbmdlcyh7IHNyYzogdGhpcy5zcmMgfSBhcyBhbnkpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgbmdPbkluaXQoKSB7XG4gICAgaWYgKCFpc1NTUigpICYmIHRoaXMuaXNWaXNpYmxlKSB7XG4gICAgICB0aGlzLmlzSW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgICAgdGhpcy5zZXR1cE11bHRpUGFnZVZpZXdlcigpO1xuICAgICAgdGhpcy5zZXR1cFNpbmdsZVBhZ2VWaWV3ZXIoKTtcbiAgICB9XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLmNsZWFyKCk7XG4gIH1cblxuICBASG9zdExpc3RlbmVyKCd3aW5kb3c6cmVzaXplJywgW10pXG4gIHB1YmxpYyBvblBhZ2VSZXNpemUoKSB7XG4gICAgaWYgKCF0aGlzLl9jYW5BdXRvUmVzaXplIHx8ICF0aGlzLl9wZGYpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5yZXNpemVUaW1lb3V0KSB7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5yZXNpemVUaW1lb3V0KTtcbiAgICB9XG5cbiAgICB0aGlzLnJlc2l6ZVRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHRoaXMudXBkYXRlU2l6ZSgpO1xuICAgIH0sIDEwMCk7XG4gIH1cblxuICBnZXQgcGRmTGlua1NlcnZpY2UoKTogYW55IHtcbiAgICByZXR1cm4gdGhpcy5fc2hvd0FsbFxuICAgICAgPyB0aGlzLnBkZk11bHRpUGFnZUxpbmtTZXJ2aWNlXG4gICAgICA6IHRoaXMucGRmU2luZ2xlUGFnZUxpbmtTZXJ2aWNlO1xuICB9XG5cbiAgZ2V0IHBkZlZpZXdlcigpOiBhbnkge1xuICAgIHJldHVybiB0aGlzLmdldEN1cnJlbnRWaWV3ZXIoKTtcbiAgfVxuXG4gIGdldCBwZGZGaW5kQ29udHJvbGxlcigpOiBhbnkge1xuICAgIHJldHVybiB0aGlzLl9zaG93QWxsXG4gICAgICA/IHRoaXMucGRmTXVsdGlQYWdlRmluZENvbnRyb2xsZXJcbiAgICAgIDogdGhpcy5wZGZTaW5nbGVQYWdlRmluZENvbnRyb2xsZXI7XG4gIH1cblxuICBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKSB7XG4gICAgaWYgKGlzU1NSKCkgfHwgIXRoaXMuaXNWaXNpYmxlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCdzcmMnIGluIGNoYW5nZXMpIHtcbiAgICAgIHRoaXMubG9hZFBERigpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5fcGRmKSB7XG4gICAgICBpZiAoJ3JlbmRlclRleHQnIGluIGNoYW5nZXMpIHtcbiAgICAgICAgdGhpcy5nZXRDdXJyZW50Vmlld2VyKCkudGV4dExheWVyTW9kZSA9IHRoaXMuX3JlbmRlclRleHRcbiAgICAgICAgICA/IHRoaXMuX3JlbmRlclRleHRNb2RlXG4gICAgICAgICAgOiBSZW5kZXJUZXh0TW9kZS5ESVNBQkxFRDtcbiAgICAgICAgdGhpcy5yZXNldFBkZkRvY3VtZW50KCk7XG4gICAgICB9IGVsc2UgaWYgKCdzaG93QWxsJyBpbiBjaGFuZ2VzKSB7XG4gICAgICAgIHRoaXMucmVzZXRQZGZEb2N1bWVudCgpO1xuICAgICAgfVxuICAgICAgaWYgKCdwYWdlJyBpbiBjaGFuZ2VzKSB7XG4gICAgICAgIGlmIChjaGFuZ2VzWydwYWdlJ10uY3VycmVudFZhbHVlID09PSB0aGlzLl9sYXRlc3RTY3JvbGxlZFBhZ2UpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBOZXcgZm9ybSBvZiBwYWdlIGNoYW5naW5nOiBUaGUgdmlld2VyIHdpbGwgbm93IGp1bXAgdG8gdGhlIHNwZWNpZmllZCBwYWdlIHdoZW4gaXQgaXMgY2hhbmdlZC5cbiAgICAgICAgLy8gVGhpcyBiZWhhdmlvciBpcyBpbnRyb2R1Y2VkYnkgdXNpbmcgdGhlIFBERlNpbmdsZVBhZ2VWaWV3ZXJcbiAgICAgICAgdGhpcy5nZXRDdXJyZW50Vmlld2VyKCkuc2Nyb2xsUGFnZUludG9WaWV3KHsgcGFnZU51bWJlcjogdGhpcy5fcGFnZSB9KTtcbiAgICAgIH1cblxuICAgICAgdGhpcy51cGRhdGUoKTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgdXBkYXRlU2l6ZSgpIHtcbiAgICBjb25zdCBjdXJyZW50Vmlld2VyID0gdGhpcy5nZXRDdXJyZW50Vmlld2VyKCk7XG4gICAgdGhpcy5fcGRmXG4gICAgICAuZ2V0UGFnZShjdXJyZW50Vmlld2VyLmN1cnJlbnRQYWdlTnVtYmVyKVxuICAgICAgLnRoZW4oKHBhZ2U6IFBERlBhZ2VQcm94eSkgPT4ge1xuICAgICAgICBjb25zdCByb3RhdGlvbiA9IHRoaXMuX3JvdGF0aW9uIHx8IHBhZ2Uucm90YXRlO1xuICAgICAgICBjb25zdCB2aWV3cG9ydFdpZHRoID1cbiAgICAgICAgICAocGFnZSBhcyBhbnkpLmdldFZpZXdwb3J0KHtcbiAgICAgICAgICAgIHNjYWxlOiB0aGlzLl96b29tLFxuICAgICAgICAgICAgcm90YXRpb25cbiAgICAgICAgICB9KS53aWR0aCAqIFBkZlZpZXdlckNvbXBvbmVudC5DU1NfVU5JVFM7XG4gICAgICAgIGxldCBzY2FsZSA9IHRoaXMuX3pvb207XG4gICAgICAgIGxldCBzdGlja1RvUGFnZSA9IHRydWU7XG5cbiAgICAgICAgLy8gU2NhbGUgdGhlIGRvY3VtZW50IHdoZW4gaXQgc2hvdWxkbid0IGJlIGluIG9yaWdpbmFsIHNpemUgb3IgZG9lc24ndCBmaXQgaW50byB0aGUgdmlld3BvcnRcbiAgICAgICAgaWYgKFxuICAgICAgICAgICF0aGlzLl9vcmlnaW5hbFNpemUgfHxcbiAgICAgICAgICAodGhpcy5fZml0VG9QYWdlICYmXG4gICAgICAgICAgICB2aWV3cG9ydFdpZHRoID4gdGhpcy5wZGZWaWV3ZXJDb250YWluZXIubmF0aXZlRWxlbWVudC5jbGllbnRXaWR0aClcbiAgICAgICAgKSB7XG4gICAgICAgICAgY29uc3Qgdmlld1BvcnQgPSAocGFnZSBhcyBhbnkpLmdldFZpZXdwb3J0KHsgc2NhbGU6IDEsIHJvdGF0aW9uIH0pO1xuICAgICAgICAgIHNjYWxlID0gdGhpcy5nZXRTY2FsZSh2aWV3UG9ydC53aWR0aCwgdmlld1BvcnQuaGVpZ2h0KTtcbiAgICAgICAgICBzdGlja1RvUGFnZSA9ICF0aGlzLl9zdGlja1RvUGFnZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGN1cnJlbnRWaWV3ZXIuX3NldFNjYWxlKHNjYWxlLCBzdGlja1RvUGFnZSk7XG4gICAgICB9KTtcbiAgfVxuXG4gIHB1YmxpYyBjbGVhcigpIHtcbiAgICBpZiAodGhpcy5sb2FkaW5nVGFzayAmJiAhdGhpcy5sb2FkaW5nVGFzay5kZXN0cm95ZWQpIHtcbiAgICAgIHRoaXMubG9hZGluZ1Rhc2suZGVzdHJveSgpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9wZGYpIHtcbiAgICAgIHRoaXMuX3BkZi5kZXN0cm95KCk7XG4gICAgICB0aGlzLl9wZGYgPSBudWxsO1xuICAgICAgdGhpcy5wZGZNdWx0aVBhZ2VWaWV3ZXIuc2V0RG9jdW1lbnQobnVsbCk7XG4gICAgICB0aGlzLnBkZlNpbmdsZVBhZ2VWaWV3ZXIuc2V0RG9jdW1lbnQobnVsbCk7XG5cbiAgICAgIHRoaXMucGRmTXVsdGlQYWdlTGlua1NlcnZpY2Uuc2V0RG9jdW1lbnQobnVsbCwgbnVsbCk7XG4gICAgICB0aGlzLnBkZlNpbmdsZVBhZ2VMaW5rU2VydmljZS5zZXREb2N1bWVudChudWxsLCBudWxsKTtcblxuICAgICAgdGhpcy5wZGZNdWx0aVBhZ2VGaW5kQ29udHJvbGxlci5zZXREb2N1bWVudChudWxsKTtcbiAgICAgIHRoaXMucGRmU2luZ2xlUGFnZUZpbmRDb250cm9sbGVyLnNldERvY3VtZW50KG51bGwpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc2V0dXBNdWx0aVBhZ2VWaWV3ZXIoKSB7XG4gICAgKFBERkpTIGFzIGFueSkuZGlzYWJsZVRleHRMYXllciA9ICF0aGlzLl9yZW5kZXJUZXh0O1xuXG4gICAgUGRmVmlld2VyQ29tcG9uZW50LnNldEV4dGVybmFsTGlua1RhcmdldCh0aGlzLl9leHRlcm5hbExpbmtUYXJnZXQpO1xuXG4gICAgY29uc3QgZXZlbnRCdXMgPSBjcmVhdGVFdmVudEJ1cyhQREZKU1ZpZXdlcik7XG5cbiAgICBldmVudEJ1cy5vbigncGFnZXJlbmRlcmVkJywgZSA9PiB7XG4gICAgICB0aGlzLnBhZ2VSZW5kZXJlZC5lbWl0KGUpO1xuICAgIH0pO1xuXG4gICAgZXZlbnRCdXMub24oJ3BhZ2VjaGFuZ2luZycsIGUgPT4ge1xuICAgICAgaWYgKHRoaXMucGFnZVNjcm9sbFRpbWVvdXQpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMucGFnZVNjcm9sbFRpbWVvdXQpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnBhZ2VTY3JvbGxUaW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMuX2xhdGVzdFNjcm9sbGVkUGFnZSA9IGUucGFnZU51bWJlcjtcbiAgICAgICAgdGhpcy5wYWdlQ2hhbmdlLmVtaXQoZS5wYWdlTnVtYmVyKTtcbiAgICAgIH0sIDEwMCk7XG4gICAgfSk7XG5cbiAgICBldmVudEJ1cy5vbigndGV4dGxheWVycmVuZGVyZWQnLCBlID0+IHtcbiAgICAgIHRoaXMudGV4dExheWVyUmVuZGVyZWQuZW1pdChlKTtcbiAgICB9KTtcblxuICAgIHRoaXMucGRmTXVsdGlQYWdlTGlua1NlcnZpY2UgPSBuZXcgUERGSlNWaWV3ZXIuUERGTGlua1NlcnZpY2UoeyBldmVudEJ1cyB9KTtcbiAgICB0aGlzLnBkZk11bHRpUGFnZUZpbmRDb250cm9sbGVyID0gbmV3IFBERkpTVmlld2VyLlBERkZpbmRDb250cm9sbGVyKHtcbiAgICAgIGxpbmtTZXJ2aWNlOiB0aGlzLnBkZk11bHRpUGFnZUxpbmtTZXJ2aWNlLFxuICAgICAgZXZlbnRCdXNcbiAgICB9KTtcblxuICAgIGNvbnN0IHBkZk9wdGlvbnM6IFBERlZpZXdlclBhcmFtcyB8IGFueSA9IHtcbiAgICAgIGV2ZW50QnVzOiBldmVudEJ1cyxcbiAgICAgIGNvbnRhaW5lcjogdGhpcy5lbGVtZW50Lm5hdGl2ZUVsZW1lbnQucXVlcnlTZWxlY3RvcignZGl2JyksXG4gICAgICByZW1vdmVQYWdlQm9yZGVyczogIXRoaXMuX3Nob3dCb3JkZXJzLFxuICAgICAgbGlua1NlcnZpY2U6IHRoaXMucGRmTXVsdGlQYWdlTGlua1NlcnZpY2UsXG4gICAgICB0ZXh0TGF5ZXJNb2RlOiB0aGlzLl9yZW5kZXJUZXh0XG4gICAgICAgID8gdGhpcy5fcmVuZGVyVGV4dE1vZGVcbiAgICAgICAgOiBSZW5kZXJUZXh0TW9kZS5ESVNBQkxFRCxcbiAgICAgIGZpbmRDb250cm9sbGVyOiB0aGlzLnBkZk11bHRpUGFnZUZpbmRDb250cm9sbGVyXG4gICAgfTtcblxuICAgIHRoaXMucGRmTXVsdGlQYWdlVmlld2VyID0gbmV3IFBERkpTVmlld2VyLlBERlZpZXdlcihwZGZPcHRpb25zKTtcbiAgICB0aGlzLnBkZk11bHRpUGFnZUxpbmtTZXJ2aWNlLnNldFZpZXdlcih0aGlzLnBkZk11bHRpUGFnZVZpZXdlcik7XG4gICAgdGhpcy5wZGZNdWx0aVBhZ2VGaW5kQ29udHJvbGxlci5zZXREb2N1bWVudCh0aGlzLl9wZGYpO1xuICB9XG5cbiAgcHJpdmF0ZSBzZXR1cFNpbmdsZVBhZ2VWaWV3ZXIoKSB7XG4gICAgKFBERkpTIGFzIGFueSkuZGlzYWJsZVRleHRMYXllciA9ICF0aGlzLl9yZW5kZXJUZXh0O1xuXG4gICAgUGRmVmlld2VyQ29tcG9uZW50LnNldEV4dGVybmFsTGlua1RhcmdldCh0aGlzLl9leHRlcm5hbExpbmtUYXJnZXQpO1xuXG4gICAgY29uc3QgZXZlbnRCdXMgPSBjcmVhdGVFdmVudEJ1cyhQREZKU1ZpZXdlcik7XG5cbiAgICBldmVudEJ1cy5vbigncGFnZWNoYW5naW5nJywgZSA9PiB7XG4gICAgICBpZiAoZS5wYWdlTnVtYmVyICE9IHRoaXMuX3BhZ2UpIHtcbiAgICAgICAgdGhpcy5wYWdlID0gZS5wYWdlTnVtYmVyO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgZXZlbnRCdXMub24oJ3BhZ2VyZW5kZXJlZCcsIGUgPT4ge1xuICAgICAgdGhpcy5wYWdlUmVuZGVyZWQuZW1pdChlKTtcbiAgICB9KTtcblxuICAgIGV2ZW50QnVzLm9uKCd0ZXh0bGF5ZXJyZW5kZXJlZCcsIGUgPT4ge1xuICAgICAgdGhpcy50ZXh0TGF5ZXJSZW5kZXJlZC5lbWl0KGUpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5wZGZTaW5nbGVQYWdlTGlua1NlcnZpY2UgPSBuZXcgUERGSlNWaWV3ZXIuUERGTGlua1NlcnZpY2Uoe1xuICAgICAgZXZlbnRCdXNcbiAgICB9KTtcbiAgICB0aGlzLnBkZlNpbmdsZVBhZ2VGaW5kQ29udHJvbGxlciA9IG5ldyBQREZKU1ZpZXdlci5QREZGaW5kQ29udHJvbGxlcih7XG4gICAgICBsaW5rU2VydmljZTogdGhpcy5wZGZTaW5nbGVQYWdlTGlua1NlcnZpY2UsXG4gICAgICBldmVudEJ1c1xuICAgIH0pO1xuXG4gICAgY29uc3QgcGRmT3B0aW9uczogUERGVmlld2VyUGFyYW1zIHwgYW55ID0ge1xuICAgICAgZXZlbnRCdXM6IGV2ZW50QnVzLFxuICAgICAgY29udGFpbmVyOiB0aGlzLmVsZW1lbnQubmF0aXZlRWxlbWVudC5xdWVyeVNlbGVjdG9yKCdkaXYnKSxcbiAgICAgIHJlbW92ZVBhZ2VCb3JkZXJzOiAhdGhpcy5fc2hvd0JvcmRlcnMsXG4gICAgICBsaW5rU2VydmljZTogdGhpcy5wZGZTaW5nbGVQYWdlTGlua1NlcnZpY2UsXG4gICAgICB0ZXh0TGF5ZXJNb2RlOiB0aGlzLl9yZW5kZXJUZXh0XG4gICAgICAgID8gdGhpcy5fcmVuZGVyVGV4dE1vZGVcbiAgICAgICAgOiBSZW5kZXJUZXh0TW9kZS5ESVNBQkxFRCxcbiAgICAgIGZpbmRDb250cm9sbGVyOiB0aGlzLnBkZlNpbmdsZVBhZ2VGaW5kQ29udHJvbGxlclxuICAgIH07XG5cbiAgICB0aGlzLnBkZlNpbmdsZVBhZ2VWaWV3ZXIgPSBuZXcgUERGSlNWaWV3ZXIuUERGU2luZ2xlUGFnZVZpZXdlcihwZGZPcHRpb25zKTtcbiAgICB0aGlzLnBkZlNpbmdsZVBhZ2VMaW5rU2VydmljZS5zZXRWaWV3ZXIodGhpcy5wZGZTaW5nbGVQYWdlVmlld2VyKTtcbiAgICB0aGlzLnBkZlNpbmdsZVBhZ2VGaW5kQ29udHJvbGxlci5zZXREb2N1bWVudCh0aGlzLl9wZGYpO1xuXG4gICAgdGhpcy5wZGZTaW5nbGVQYWdlVmlld2VyLl9jdXJyZW50UGFnZU51bWJlciA9IHRoaXMuX3BhZ2U7XG4gIH1cblxuICBwcml2YXRlIGdldFZhbGlkUGFnZU51bWJlcihwYWdlOiBudW1iZXIpOiBudW1iZXIge1xuICAgIGlmIChwYWdlIDwgMSkge1xuICAgICAgcmV0dXJuIDE7XG4gICAgfVxuXG4gICAgaWYgKHBhZ2UgPiB0aGlzLl9wZGYubnVtUGFnZXMpIHtcbiAgICAgIHJldHVybiB0aGlzLl9wZGYubnVtUGFnZXM7XG4gICAgfVxuXG4gICAgcmV0dXJuIHBhZ2U7XG4gIH1cblxuICBwcml2YXRlIGdldERvY3VtZW50UGFyYW1zKCkge1xuICAgIGNvbnN0IHNyY1R5cGUgPSB0eXBlb2YgdGhpcy5zcmM7XG5cbiAgICBpZiAoIXRoaXMuX2NNYXBzVXJsKSB7XG4gICAgICByZXR1cm4gdGhpcy5zcmM7XG4gICAgfVxuXG4gICAgY29uc3QgcGFyYW1zOiBhbnkgPSB7XG4gICAgICBjTWFwVXJsOiB0aGlzLl9jTWFwc1VybCxcbiAgICAgIGNNYXBQYWNrZWQ6IHRydWVcbiAgICB9O1xuXG4gICAgaWYgKHNyY1R5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICBwYXJhbXMudXJsID0gdGhpcy5zcmM7XG4gICAgfSBlbHNlIGlmIChzcmNUeXBlID09PSAnb2JqZWN0Jykge1xuICAgICAgaWYgKCh0aGlzLnNyYyBhcyBhbnkpLmJ5dGVMZW5ndGggIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBwYXJhbXMuZGF0YSA9IHRoaXMuc3JjO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgT2JqZWN0LmFzc2lnbihwYXJhbXMsIHRoaXMuc3JjKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcGFyYW1zO1xuICB9XG5cbiAgcHJpdmF0ZSBsb2FkUERGKCkge1xuICAgIGlmICghdGhpcy5zcmMpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5sYXN0TG9hZGVkID09PSB0aGlzLnNyYykge1xuICAgICAgdGhpcy51cGRhdGUoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmNsZWFyKCk7XG5cbiAgICB0aGlzLmxvYWRpbmdUYXNrID0gKFBERkpTIGFzIGFueSkuZ2V0RG9jdW1lbnQodGhpcy5nZXREb2N1bWVudFBhcmFtcygpKTtcblxuICAgIHRoaXMubG9hZGluZ1Rhc2sub25Qcm9ncmVzcyA9IChwcm9ncmVzc0RhdGE6IFBERlByb2dyZXNzRGF0YSkgPT4ge1xuICAgICAgdGhpcy5vblByb2dyZXNzLmVtaXQocHJvZ3Jlc3NEYXRhKTtcbiAgICB9O1xuXG4gICAgY29uc3Qgc3JjID0gdGhpcy5zcmM7XG4gICAgKDxQREZQcm9taXNlPFBERkRvY3VtZW50UHJveHk+PnRoaXMubG9hZGluZ1Rhc2sucHJvbWlzZSkudGhlbihcbiAgICAgIChwZGY6IFBERkRvY3VtZW50UHJveHkpID0+IHtcbiAgICAgICAgdGhpcy5fcGRmID0gcGRmO1xuICAgICAgICB0aGlzLmxhc3RMb2FkZWQgPSBzcmM7XG5cbiAgICAgICAgdGhpcy5hZnRlckxvYWRDb21wbGV0ZS5lbWl0KHBkZik7XG5cbiAgICAgICAgaWYgKCF0aGlzLnBkZk11bHRpUGFnZVZpZXdlcikge1xuICAgICAgICAgIHRoaXMuc2V0dXBNdWx0aVBhZ2VWaWV3ZXIoKTtcbiAgICAgICAgICB0aGlzLnNldHVwU2luZ2xlUGFnZVZpZXdlcigpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5yZXNldFBkZkRvY3VtZW50KCk7XG5cbiAgICAgICAgdGhpcy51cGRhdGUoKTtcbiAgICAgIH0sXG4gICAgICAoZXJyb3I6IGFueSkgPT4ge1xuICAgICAgICB0aGlzLm9uRXJyb3IuZW1pdChlcnJvcik7XG4gICAgICB9XG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgdXBkYXRlKCkge1xuICAgIHRoaXMucGFnZSA9IHRoaXMuX3BhZ2U7XG5cbiAgICB0aGlzLnJlbmRlcigpO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXIoKSB7XG4gICAgdGhpcy5fcGFnZSA9IHRoaXMuZ2V0VmFsaWRQYWdlTnVtYmVyKHRoaXMuX3BhZ2UpO1xuICAgIGNvbnN0IGN1cnJlbnRWaWV3ZXIgPSB0aGlzLmdldEN1cnJlbnRWaWV3ZXIoKTtcblxuICAgIGlmIChcbiAgICAgIHRoaXMuX3JvdGF0aW9uICE9PSAwIHx8XG4gICAgICBjdXJyZW50Vmlld2VyLnBhZ2VzUm90YXRpb24gIT09IHRoaXMuX3JvdGF0aW9uXG4gICAgKSB7XG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgY3VycmVudFZpZXdlci5wYWdlc1JvdGF0aW9uID0gdGhpcy5fcm90YXRpb247XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fc3RpY2tUb1BhZ2UpIHtcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBjdXJyZW50Vmlld2VyLmN1cnJlbnRQYWdlTnVtYmVyID0gdGhpcy5fcGFnZTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHRoaXMudXBkYXRlU2l6ZSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRTY2FsZSh2aWV3cG9ydFdpZHRoOiBudW1iZXIsIHZpZXdwb3J0SGVpZ2h0OiBudW1iZXIpIHtcbiAgICBjb25zdCBib3JkZXJTaXplID0gKHRoaXMuX3Nob3dCb3JkZXJzID8gMiAqIFBkZlZpZXdlckNvbXBvbmVudC5CT1JERVJfV0lEVEggOiAwKTtcbiAgICBjb25zdCBwZGZDb250YWluZXJXaWR0aCA9IHRoaXMucGRmVmlld2VyQ29udGFpbmVyLm5hdGl2ZUVsZW1lbnQuY2xpZW50V2lkdGggLSBib3JkZXJTaXplO1xuICAgIGNvbnN0IHBkZkNvbnRhaW5lckhlaWdodCA9IHRoaXMucGRmVmlld2VyQ29udGFpbmVyLm5hdGl2ZUVsZW1lbnQuY2xpZW50SGVpZ2h0IC0gYm9yZGVyU2l6ZTtcblxuICAgIGlmIChwZGZDb250YWluZXJIZWlnaHQgPT09IDAgfHwgdmlld3BvcnRIZWlnaHQgPT09IDAgfHwgcGRmQ29udGFpbmVyV2lkdGggPT09IDAgfHwgdmlld3BvcnRXaWR0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIDE7XG4gICAgfVxuXG4gICAgbGV0IHJhdGlvID0gMTtcbiAgICBzd2l0Y2ggKHRoaXMuX3pvb21TY2FsZSkge1xuICAgICAgY2FzZSAncGFnZS1maXQnOlxuICAgICAgICByYXRpbyA9IE1hdGgubWluKChwZGZDb250YWluZXJIZWlnaHQgLyB2aWV3cG9ydEhlaWdodCksIChwZGZDb250YWluZXJXaWR0aCAvIHZpZXdwb3J0V2lkdGgpKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdwYWdlLWhlaWdodCc6XG4gICAgICAgIHJhdGlvID0gKHBkZkNvbnRhaW5lckhlaWdodCAvIHZpZXdwb3J0SGVpZ2h0KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdwYWdlLXdpZHRoJzpcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJhdGlvID0gKHBkZkNvbnRhaW5lcldpZHRoIC8gdmlld3BvcnRXaWR0aCk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIHJldHVybiAodGhpcy5fem9vbSAqIHJhdGlvKSAvIFBkZlZpZXdlckNvbXBvbmVudC5DU1NfVU5JVFM7XG4gIH1cblxuICBwcml2YXRlIGdldEN1cnJlbnRWaWV3ZXIoKTogYW55IHtcbiAgICByZXR1cm4gdGhpcy5fc2hvd0FsbCA/IHRoaXMucGRmTXVsdGlQYWdlVmlld2VyIDogdGhpcy5wZGZTaW5nbGVQYWdlVmlld2VyO1xuICB9XG5cbiAgcHJpdmF0ZSByZXNldFBkZkRvY3VtZW50KCkge1xuICAgIHRoaXMucGRmRmluZENvbnRyb2xsZXIuc2V0RG9jdW1lbnQodGhpcy5fcGRmKTtcblxuICAgIGlmICh0aGlzLl9zaG93QWxsKSB7XG4gICAgICB0aGlzLnBkZlNpbmdsZVBhZ2VWaWV3ZXIuc2V0RG9jdW1lbnQobnVsbCk7XG4gICAgICB0aGlzLnBkZlNpbmdsZVBhZ2VMaW5rU2VydmljZS5zZXREb2N1bWVudChudWxsKTtcblxuICAgICAgdGhpcy5wZGZNdWx0aVBhZ2VWaWV3ZXIuc2V0RG9jdW1lbnQodGhpcy5fcGRmKTtcbiAgICAgIHRoaXMucGRmTXVsdGlQYWdlTGlua1NlcnZpY2Uuc2V0RG9jdW1lbnQodGhpcy5fcGRmLCBudWxsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5wZGZNdWx0aVBhZ2VWaWV3ZXIuc2V0RG9jdW1lbnQobnVsbCk7XG4gICAgICB0aGlzLnBkZk11bHRpUGFnZUxpbmtTZXJ2aWNlLnNldERvY3VtZW50KG51bGwpO1xuXG4gICAgICB0aGlzLnBkZlNpbmdsZVBhZ2VWaWV3ZXIuc2V0RG9jdW1lbnQodGhpcy5fcGRmKTtcbiAgICAgIHRoaXMucGRmU2luZ2xlUGFnZUxpbmtTZXJ2aWNlLnNldERvY3VtZW50KHRoaXMuX3BkZiwgbnVsbCk7XG4gICAgfVxuICB9XG59XG4iXX0=