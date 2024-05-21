import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DxfSitePlanComponent } from './dxf-site-plan.component';

describe('DxfSitePlanComponent', () => {
  let component: DxfSitePlanComponent;
  let fixture: ComponentFixture<DxfSitePlanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DxfSitePlanComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DxfSitePlanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
