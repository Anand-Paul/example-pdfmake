import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OutputPdfComponent } from './output-pdf.component';

describe('OutputPdfComponent', () => {
  let component: OutputPdfComponent;
  let fixture: ComponentFixture<OutputPdfComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OutputPdfComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OutputPdfComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
