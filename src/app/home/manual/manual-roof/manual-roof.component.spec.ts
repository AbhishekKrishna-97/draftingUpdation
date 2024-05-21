import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManualRoofComponent } from './manual-roof.component';

describe('ManualRoofComponent', () => {
  let component: ManualRoofComponent;
  let fixture: ComponentFixture<ManualRoofComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ManualRoofComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManualRoofComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
