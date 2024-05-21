import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ObjectService {

  treeArray: any = [];

  constructor() { }

  addTree(map: any, location , existingTree?: google.maps.Circle, index?:number, treeObject?:any): void {
    const timestamp = new Date().getTime();
    let id = "tree_" + timestamp;

    const treeCircle = new google.maps.Circle({
      center: existingTree ? existingTree["center"] : treeObject ? treeObject.center : location,
      radius: existingTree ? existingTree['radius'] : treeObject ? treeObject.radius : 2,
      strokeColor: "green",
      strokeOpacity: 0,
      strokeWeight: 0,
      fillColor: "#3cb043",
      fillOpacity: 0,
      map: map,
      editable: false,
      draggable: true,
      zIndex:100
    });

    const circleBounds = treeCircle.getBounds();

    const trees = new google.maps.GroundOverlay(
      "../../assets/Icon/tree.svg",
      circleBounds
    );

    trees.setMap(map);
    treeCircle.set("id", existingTree ? existingTree["id"] : treeObject ? id + treeObject.index : id);
    treeCircle.set("treeGroundOverlay", trees);
    !existingTree ? this.treeArray.push(treeCircle) : null;
    existingTree ? this.treeArray[index] = treeCircle : null;
    this.addListnerOnTree(treeCircle,trees,map);
  }

  addListnerOnTree(treeCircle:google.maps.Circle, trees:google.maps.GroundOverlay, map:any){
    treeCircle.addListener("click", () => {
      treeCircle.setOptions({ editable: !treeCircle.getEditable() })
    })

    treeCircle.addListener("dblclick", () => {
      treeCircle.setMap(null);
      trees.setMap(null);
      this.treeArray = this.treeArray.filter((element) => element.id !== treeCircle["id"]);
    })

    treeCircle.addListener("center_changed", () => {
      const circleBounds = treeCircle.getBounds();
      trees.set("bounds", circleBounds)
      trees.setMap(map);
    })

    treeCircle.addListener("radius_changed", () => {
      const circleBounds = treeCircle.getBounds();
      trees.set("bounds", circleBounds)
      trees.setMap(map);
    })

    treeCircle.addListener("drag", () => {
      const circleBounds = treeCircle.getBounds();
      trees.set("bounds", circleBounds)
      trees.setMap(map);
    })
  }

  reDrawTree(map: any, location: any) {
    this.treeArray.forEach((element:any,index:number) => {
        this.addTree(map,location,element,index);
    })
  }

  getTreeData(){
    let treeData = [];
    this.treeArray.forEach((element) => {
      treeData.push({
        id: element.id,
        center: element.center,
        radius: element.radius
      })
  })
  return treeData;
  }
}
