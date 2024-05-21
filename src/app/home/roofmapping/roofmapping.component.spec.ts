import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoofmappingComponent } from './roofmapping.component';

describe('RoofmappingComponent', () => {
  let component: RoofmappingComponent;
  let fixture: ComponentFixture<RoofmappingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RoofmappingComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoofmappingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
