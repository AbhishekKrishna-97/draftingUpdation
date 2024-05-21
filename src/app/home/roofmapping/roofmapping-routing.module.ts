import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RoofmappingComponent } from './roofmapping.component';
import { DraftingdetailComponent } from './draftingdetail/draftingdetail.component';

const routes: Routes = [
  {
    path: "",
    component: DraftingdetailComponent,
  }
  
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RoofmappingRoutingModule { }
