import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DxfComponent } from './dxf/dxf.component';

const routes: Routes = [
  {
    path: "",
    children: [
      {
        path: "",
        component: DxfComponent,
      }
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DxfRoutingModule { }
