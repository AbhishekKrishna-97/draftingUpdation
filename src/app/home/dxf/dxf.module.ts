import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DxfComponent } from './dxf/dxf.component';
import { DxfStringLayoutComponent } from './dxf/dxf-string-layout/dxf-string-layout.component';
import { DxfRoutingModule } from './dxf-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RoofmappingRoutingModule } from '../roofmapping/roofmapping-routing.module';
import { MatSliderModule } from '@angular/material/slider';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { ShareModule } from 'src/app/share/share.module';
import { DxfRoofPlanComponent } from './dxf/dxf-roof-plan/dxf-roof-plan.component';
import { DxfSitePlanComponent } from './dxf/dxf-site-plan/dxf-site-plan.component';
import { MatTooltipModule } from '@angular/material/tooltip';

@NgModule({
  declarations: [
    DxfComponent,
    DxfRoofPlanComponent,
    DxfSitePlanComponent,
    DxfStringLayoutComponent
  ],
  imports: [
    CommonModule,
    DxfRoutingModule,
    ShareModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RoofmappingRoutingModule,
    MatSliderModule,
    MatSelectModule,
    MatCheckboxModule,
    MatInputModule,
    MatButtonModule,
    MatExpansionModule,
    ShareModule,
    MatTooltipModule
  ]
})
export class DxfModule { }
