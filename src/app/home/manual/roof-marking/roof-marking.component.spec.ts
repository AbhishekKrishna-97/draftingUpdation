import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoofMarkingComponent } from './roof-marking.component';

describe('RoofMarkingComponent', () => {
  let component: RoofMarkingComponent;
  let fixture: ComponentFixture<RoofMarkingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RoofMarkingComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoofMarkingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
