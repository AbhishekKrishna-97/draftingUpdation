import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManualStringComponent } from './manual-string.component';

describe('ManualStringComponent', () => {
  let component: ManualStringComponent;
  let fixture: ComponentFixture<ManualStringComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ManualStringComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManualStringComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
