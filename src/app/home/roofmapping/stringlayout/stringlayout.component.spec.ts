import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StringlayoutComponent } from './stringlayout.component';

describe('StringlayoutComponent', () => {
  let component: StringlayoutComponent;
  let fixture: ComponentFixture<StringlayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StringlayoutComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StringlayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
