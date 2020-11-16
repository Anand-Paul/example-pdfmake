import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-output-pdf',
  templateUrl: './output-pdf.component.html',
  styleUrls: ['./output-pdf.component.scss'],
})
export class OutputPdfComponent implements OnInit {
  pdfSrc = 'https://vadimdez.github.io/ng2-pdf-viewer/assets/pdf-test.pdf'; // this sample, dynamic one we will generate with the pdfmake
  pageVariable = 1;
  constructor() {}

  ngOnInit(): void {}
}
