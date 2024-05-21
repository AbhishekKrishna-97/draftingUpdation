import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ManualRoutingModule } from './manual-routing.module';
import { LayoutComponent } from './layout/layout.component';
import { ManualDraftingComponent } from './manual-drafting/manual-drafting.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ShareModule } from 'src/app/share/share.module';
import { RoofMarkingComponent } from './roof-marking/roof-marking.component';
import { HomeComponent } from './home/home.component';
import { MatMenuModule } from '@angular/material/menu';
import { ModuleDetailComponent } from './module-detail/module-detail.component';
import { MatDialogModule } from '@angular/material/dialog';
import { ManualSiteComponent } from './manual-site/manual-site.component';
import { ManualRoofComponent } from './manual-roof/manual-roof.component';
import { ManualStringComponent } from './manual-string/manual-string.component';
import { CustomModuleComponent } from './custom-module/custom-module.component';
import { MatRadioModule } from '@angular/material/radio';


@NgModule({
  declarations: [
    LayoutComponent,
    ManualDraftingComponent,
    RoofMarkingComponent,
    HomeComponent,
    ModuleDetailComponent,
    ManualSiteComponent,
    ManualRoofComponent,
    ManualStringComponent,
    CustomModuleComponent
  ],
  imports: [
    CommonModule,
    ManualRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    MatSliderModule,
    MatSelectModule,
    MatCheckboxModule,
    MatInputModule,
    MatButtonModule,
    MatExpansionModule,
    ShareModule,
    MatMenuModule,
    MatTooltipModule,
    MatDialogModule,
    MatRadioModule
  ]
})
export class ManualModule { }
