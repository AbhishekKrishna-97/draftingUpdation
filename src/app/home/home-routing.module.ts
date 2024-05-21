import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: "",
  children: [
    {
      path: 'dxfdrawing', children: [
        { path: '', loadChildren: () => import("./dxf/dxf.module").then((m) => m.DxfModule) },
      ]
    },
    {
      path: 'ev', children: [
        { path: '', loadChildren: () => import("./roofmapping/roofmapping.module").then((m) => m.RoofmappingModule) },
      ]
    },
    {
      path: 'manual-drawing', children: [
        { path: '', loadChildren: () => import("./manual/manual.module").then((m) => m.ManualModule) },
      ]
    }
  ]},
  
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomeRoutingModule { }
