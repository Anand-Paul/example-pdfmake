import { PdfViewerModule } from "ng2-pdf-viewer";
import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { HttpClientModule } from "@angular/common/http";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";

import { OutputPdfComponent } from "./container/output-pdf/output-pdf.component";
import { HeaderComponent } from "./component/header/header.component";

@NgModule({
  declarations: [AppComponent, HeaderComponent, OutputPdfComponent],
  imports: [BrowserModule, AppRoutingModule, PdfViewerModule, HttpClientModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
