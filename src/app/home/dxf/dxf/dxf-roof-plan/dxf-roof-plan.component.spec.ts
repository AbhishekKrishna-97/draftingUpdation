import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DxfRoofPlanComponent } from './dxf-roof-plan.component';

describe('DxfRoofPlanComponent', () => {
  let component: DxfRoofPlanComponent;
  let fixture: ComponentFixture<DxfRoofPlanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DxfRoofPlanComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DxfRoofPlanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
