import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoofplanComponent } from './roofplan.component';

describe('RoofplanComponent', () => {
  let component: RoofplanComponent;
  let fixture: ComponentFixture<RoofplanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RoofplanComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoofplanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
