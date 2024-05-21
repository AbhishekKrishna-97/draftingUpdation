import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManualSiteComponent } from './manual-site.component';

describe('ManualSiteComponent', () => {
  let component: ManualSiteComponent;
  let fixture: ComponentFixture<ManualSiteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ManualSiteComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManualSiteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
