import { Component, OnInit } from "@angular/core";
import { PDFDocumentProxy } from "ng2-pdf-viewer";
import { HttpClient } from "@angular/common/http";

// importing the fonts and icons needed
import pdfFonts from "./../../../assets/vfs_fonts.js";
import { fonts } from "./../../config/pdfFonts";
import { styles, defaultStyle } from "./../../config/customStyles";

// import the pdfmake library
import pdfMake from "pdfmake/build/pdfmake";

// PDFMAKE fonts
pdfMake.vfs = pdfFonts.pdfMake.vfs;
pdfMake.fonts = fonts;
@Component({
  selector: "app-output-pdf",
  templateUrl: "./output-pdf.component.html",
  styleUrls: ["./output-pdf.component.scss"],
})
export class OutputPdfComponent implements OnInit {
  pdfSrc; // this sample, dynamic one we will generate with the pdfmake
  pageVariable = 1;

  // Initialize variables required for the header and this component
  fileName = "test-document.pdf";
  // set zoom variables
  zoom = 0.98; // default initial zoom value
  zoomMax = 2; // max zoom value
  zoomMin = 0.5; // min zoom value
  zoomAmt = 0.2; // stepping zoom values on button click
  zoomScale = "page-width"; // zoom scale based on the page-width
  totalPages = 0; // indicates the total number of pages in the pdf document
  pdf: PDFDocumentProxy; // to access pdf information from the pdf viewer
  documentDefinition: object;
  generatedPDF: any;
  pdfData;

  constructor(private httpClient: HttpClient) {}

  ngOnInit(): void {
    this.getData();
  }

  // zoom functionality for the pdf viewer
  setZoom(type: string): void {
    console.log(type);
    if (type === "increment") {
      this.zoom += this.zoomAmt;
    } else if (type === "decrement") {
      this.zoom -= this.zoomAmt;
    }
  }

  // pdfSrc value we are taking from the pdfmake generate function in buffer type so currently this willnot work
  // after the pdf is generated it will work
  // Download functionality of the pdf
  download(): void {
    const blob = new Blob([this.pdfSrc], { type: "application/pdf" });

    // IE doesn't allow using a blob object directly as link href
    // instead it is necessary to use msSaveOrOpenBlob
    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveOrOpenBlob(blob);
      return;
    }

    const data = window.URL.createObjectURL(blob);
    const link = document.createElement("a"); // creating an anchor tag
    link.href = data; // setting href value to anchor
    link.download = this.fileName; // giving the download attr to the anchor with the filename that we are giving
    link.click(); // fake click using the js to download it.

    // For firefox it is necessary to delay revoking the ObjectURl
    setTimeout(() => {
      window.URL.revokeObjectURL(data);
    }, 100);
  }

  // pdfSrc value we are taking from the pdfmake generate function in buffer type so currently this willnot work
  // after the pdf is generated it will work
  // Print functionlaity of the pdf
  print(): void {
    // Remove previously added iframes
    const prevFrames = document.querySelectorAll('iframe[name="pdf-frame"]');
    if (prevFrames.length) {
      prevFrames.forEach((item) => item.remove());
    }
    // just like download , we are using the blob
    const blob = new Blob([this.pdfSrc], { type: "application/pdf" });
    const objectURl = URL.createObjectURL(blob);

    // create iframe element in dom
    const frame = document.createElement("iframe");
    frame.style.display = "none"; // hiding the iframe
    frame.src = objectURl; // setting the source for that iframe
    // appending this iframe to body
    document.body.appendChild(frame);
    frame.name = "pdf-frame";
    frame.focus();

    // in edge or IE we are using different methods to print
    if (this.isIE() || this.isEdge()) {
      frame.contentWindow.document.execCommand("print", false, null);
    } else {
      // all other browsers will use this method
      frame.contentWindow.print();
    }
  }

  // to know the browser is IE or not
  isIE(): boolean {
    return navigator.userAgent.lastIndexOf("MSIE") !== -1;
  }

  // to know the browser is Edge or not
  isEdge(): boolean {
    return !this.isIE() && !!window.StyleMedia;
  }

  // after load complete of the pdf function
  afterLoadComplete(pdf: PDFDocumentProxy): void {
    this.pdf = pdf;
    this.totalPages = pdf.numPages;
  }

  generatePDF(): void {
    // All the contents required goes here
    this.documentDefinition = {
      info: {
        title: this.pdfData.title,
        author: this.pdfData.author,
        subject: this.pdfData.subject,
        keywords: this.pdfData.keywords,
        creator: this.pdfData.creator,
        creationDate: new Date(),
      },
      pageSize: "A4",
      pageOrientation: "landscape",
      pageMargins: [40, 60, 40, 60], // left, top, right, bottom margin values
      content: [
        {
          text: "Sample test to check the font",
          style: "head", // normal text with custom font
        },
        {
          text: ">",
          font: "Icomoon", // icon intgerated to the pdfmake document
          fontSize: 18,
        },
      ], // it will be discussed later
      styles,
      defaultStyle,
    };

    // Generating the pdf
    this.generatedPDF = pdfMake.createPdf(this.documentDefinition);
    // This generated pdf buffer is used for the download, print and for viewing
    this.generatedPDF.getBuffer((buffer) => {
      this.pdfSrc = buffer;
    });
  }

  getData(): void {
    this.httpClient.get("assets/data.json").subscribe((data) => {
      if (data) {
        this.pdfData = data;
        this.generatePDF();
      }
    });
  }
}
