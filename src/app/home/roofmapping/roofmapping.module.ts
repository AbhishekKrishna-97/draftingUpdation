import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoofmappingRoutingModule } from './roofmapping-routing.module';
import { RoofmappingComponent } from './roofmapping.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';
import {MatSelectModule} from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { DraftingdetailComponent } from './draftingdetail/draftingdetail.component';
import { RoofplanComponent } from './roofplan/roofplan.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ShareModule } from 'src/app/share/share.module';
import { StringlayoutComponent } from './stringlayout/stringlayout.component';

@NgModule({
  declarations: [
    RoofmappingComponent,
    DraftingdetailComponent,
    RoofplanComponent,
    StringlayoutComponent
  ],
  imports: [
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
export class RoofmappingModule { }
