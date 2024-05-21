import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DxfStringLayoutComponent } from './dxf-string-layout.component';

describe('DxfStringLayoutComponent', () => {
  let component: DxfStringLayoutComponent;
  let fixture: ComponentFixture<DxfStringLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DxfStringLayoutComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DxfStringLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
