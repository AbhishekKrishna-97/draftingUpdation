import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {MatChipsModule} from '@angular/material/chips';
import { LoderComponent } from './loder/loder.component';
import { FileUploadPanelComponent } from './file-upload-panel/file-upload-panel.component';
import { DraggableDirective } from './Directive/draggable.directive';
import { ActionbarComponent } from './actionbar/actionbar.component';
import {MatMenuModule} from '@angular/material/menu';
import {MatButtonModule} from '@angular/material/button';
import {MatTooltipModule } from '@angular/material/tooltip';
import { LegendComponent } from './legend/legend.component';
import { AddFenceComponent } from './add-fence/add-fence.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InfoWindowComponent } from './info-window/info-window.component';
import { MapCompassComponent } from './map-compass/map-compass.component';

@NgModule({
  declarations: [
    LoderComponent,
    FileUploadPanelComponent,
    DraggableDirective,
    ActionbarComponent,
    LegendComponent,
    AddFenceComponent,
    InfoWindowComponent,
    MapCompassComponent
  ],
  imports: [
    CommonModule,
    MatChipsModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    ReactiveFormsModule,
    FormsModule
  ],
  exports:[
    LoderComponent,
    FileUploadPanelComponent,
    DraggableDirective,
    ActionbarComponent,
    LegendComponent,
    AddFenceComponent,
    InfoWindowComponent,
    MapCompassComponent
  ]
})
export class 

ShareModule { }
