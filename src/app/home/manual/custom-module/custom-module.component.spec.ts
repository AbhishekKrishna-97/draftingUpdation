import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomModuleComponent } from './custom-module.component';

describe('CustomModuleComponent', () => {
  let component: CustomModuleComponent;
  let fixture: ComponentFixture<CustomModuleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomModuleComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomModuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
