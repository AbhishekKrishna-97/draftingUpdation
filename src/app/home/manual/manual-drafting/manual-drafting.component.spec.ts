import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManualDraftingComponent } from './manual-drafting.component';

describe('ManualDraftingComponent', () => {
  let component: ManualDraftingComponent;
  let fixture: ComponentFixture<ManualDraftingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ManualDraftingComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManualDraftingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
