import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdditionalDrawingsService {

  drawingManager: any;
  public dataSubject = new BehaviorSubject<any>(null);
  data$ = this.dataSubject.asObservable();
  chimneyArray: any = [];

  constructor() {
    {
      this.initializeDrawingManager();
    }
  }

  initializeDrawingManager() {
    this.drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: null,
      drawingControl: false,
    });
  }

  reDrawChimney(map, location , tab?:string) {
    this.chimneyArray.forEach(element => {
      this.drawChimney(map, location, tab, element);
    });
  }

  drawChimney(map, location, tab? , chimneyArrayElement?) {
    let pathDigonalOne;
    let pathDigonalTwo;
    const timestamp = new Date().getTime();
    let polygon: google.maps.Polygon;
    let polygonCoords = [
      { lat: location.lat() + 0.000003, lng: location.lng() + 0.000005 },  // Increase longitude offset to form a wider rectangle
      { lat: location.lat() + 0.000003, lng: location.lng() - 0.000005 },  // Decrease longitude offset
      { lat: location.lat() - 0.000003, lng: location.lng() - 0.000005 },  // Decrease latitude offset
      { lat: location.lat() - 0.000003, lng: location.lng() + 0.000005 }   // Increase latitude offset
    ];
    polygon = new google.maps.Polygon({
      paths: chimneyArrayElement?.polygon?.path || chimneyArrayElement?.getPath().getArray() || polygonCoords,
      editable: false,
      draggable: !["String Layout" , "Roof Plan"].includes(tab),
      map: map,
      fillColor: "#FFFFFF",
      strokeColor: "#000000",
      strokeWeight: 1,
      fillOpacity: 1,
      zIndex:20
    });
    polygon.set('id', chimneyArrayElement?.polygon?.id ? chimneyArrayElement.polygon.id  : (chimneyArrayElement?.polygon ? chimneyArrayElement.id : 'chimney' + timestamp));
    polygon.set('title', "chimney");
    chimneyArrayElement ? polygon.set('scaleSize', chimneyArrayElement.scaleSize) : polygon.set('scaleSize', 1);
    chimneyArrayElement ? polygon.set('rotation', chimneyArrayElement.rotation) : polygon.set('rotation', 0);

    let polygonCenter = this.calculatePolygonCenter(polygon.getPath().getArray());

    if (chimneyArrayElement?.polygon?.path?.[0] && chimneyArrayElement?.polygon?.path?.[2]) {
      pathDigonalOne = [chimneyArrayElement.polygon.path[0], chimneyArrayElement.polygon.path[2]];
    } else if (chimneyArrayElement?.getPath()?.getArray()?.[0] && chimneyArrayElement.getPath()?.getArray()?.[2]) {
      pathDigonalOne = [chimneyArrayElement.getPath().getArray()[0], chimneyArrayElement.getPath().getArray()[2]];
    } else if (polygonCoords?.[0] && polygonCoords?.[2]) {
      pathDigonalOne = [polygonCoords[0], polygonCoords[2]];
    }

    if (chimneyArrayElement?.polygon?.path?.[1] && chimneyArrayElement?.polygon?.path?.[3]) {
      pathDigonalTwo = [chimneyArrayElement.polygon.path[1], chimneyArrayElement.polygon.path[3]];
    } else if (chimneyArrayElement?.getPath()?.getArray()?.[1] && chimneyArrayElement.getPath()?.getArray()?.[3]) {
      pathDigonalTwo = [chimneyArrayElement.getPath().getArray()[1], chimneyArrayElement.getPath().getArray()[3]];
    } else if (polygonCoords?.[1] && polygonCoords?.[3]) {
      pathDigonalTwo = [polygonCoords[1], polygonCoords[3]];
    }

    let circle = new google.maps.Circle({
      fillColor: "#FFFFFF",
      strokeColor: "#000000",
      strokeWeight: 1,
      fillOpacity: 1,
      map: map,
      draggable: false,
      editable: false,
      center: polygonCenter,
      radius: chimneyArrayElement ? chimneyArrayElement['circle'].radius : 0.25,
      zIndex: 22
    });
    polygon.set('circle', circle);

    let diagonalOne = new google.maps.Polyline({
      path: pathDigonalOne,
      editable: false,
      strokeColor: "#000000",
      strokeWeight: 1,
      map: map,
      zIndex:21
    });

    let diagonalTwo = new google.maps.Polyline({
      path: pathDigonalTwo,
      editable: false,
      strokeColor: "#000000",
      strokeWeight: 1,
      map: map,
      zIndex:21
    });
    polygon.set('diagonalOne', diagonalOne);
    polygon.set('diagonalTwo', diagonalTwo);
    !chimneyArrayElement ? this.chimneyArray.push(polygon) : null;
    if(tab !== ("Roof Plan" || "String Layout")){
      this.addListnerToChimney(polygon, circle, diagonalOne, diagonalTwo);
    }
  }

  sendData(data: any) {
    this.dataSubject.next(data);
  }

  addListnerToChimney(polygon,circle,diagonalOne,diagonalTwo) {
    polygon.addListener('click', () => {
      this.sendData({polygon});
    })
    polygon.addListener('drag', () => {
      this.handleChimneyDrag(polygon, circle, diagonalOne, diagonalTwo);
    })
  }

  // Function to calculate the center of a polygon based on its coordinates
  calculatePolygonCenter(coords: google.maps.LatLng[]): google.maps.LatLng {
    let latSum = 0;
    let lngSum = 0;
    for (const coord of coords) {
      latSum += coord.lat();
      lngSum += coord.lng();
    }
    const latAvg = latSum / coords.length;
    const lngAvg = lngSum / coords.length;
    return new google.maps.LatLng(latAvg, lngAvg);
  }

  getCoordinatesOfPolygon(polygon) {
    const polygonPath = polygon.getPath();
    // Define an array to store the coordinates
    const polygonCoordinates = [];
    // Loop through each vertex of the polygon and store its coordinates
    polygonPath.forEach(function (vertex, index) {
      polygonCoordinates.push({
        lat: vertex.lat(),
        lng: vertex.lng()
      });
    });
    return polygonCoordinates;
  }

  updateChimney(polygon, currentSliderValue?, inputEquipmentImgSize?) {
    let equipmentPolygonCenter = this.calculatePolygonCenter(polygon.getPath().getArray());
    let polygonCoords = [
      { lat: equipmentPolygonCenter.lat() + 0.000003, lng: equipmentPolygonCenter.lng() + 0.000005 },
      { lat: equipmentPolygonCenter.lat() + 0.000003, lng: equipmentPolygonCenter.lng() - 0.000005 },
      { lat: equipmentPolygonCenter.lat() - 0.000003, lng: equipmentPolygonCenter.lng() - 0.000005 },
      { lat: equipmentPolygonCenter.lat() - 0.000003, lng: equipmentPolygonCenter.lng() + 0.000005 }
    ];

    const scaleValue = parseFloat(inputEquipmentImgSize);
    const rotationValue = currentSliderValue;
    const angle = rotationValue * Math.PI / 180;

    if (!inputEquipmentImgSize || isNaN(scaleValue) || isNaN(rotationValue)) return;
    const newCoords = polygonCoords.map(coord => {
      const scaledLat = equipmentPolygonCenter.lat() + (coord.lat - equipmentPolygonCenter.lat()) * scaleValue;
      const scaledLng = equipmentPolygonCenter.lng() + (coord.lng - equipmentPolygonCenter.lng()) * scaleValue;
      const rotatedX = (scaledLng - equipmentPolygonCenter.lng()) * Math.cos(angle) + (scaledLat - equipmentPolygonCenter.lat()) * Math.sin(angle) + equipmentPolygonCenter.lng();
      const rotatedY = -(scaledLng - equipmentPolygonCenter.lng()) * Math.sin(angle) + (scaledLat - equipmentPolygonCenter.lat()) * Math.cos(angle) + equipmentPolygonCenter.lat();
      return { lat: rotatedY, lng: rotatedX };
    });

    polygon.setPaths(newCoords);
    polygon.set('rotation', rotationValue);
    polygon.set('scaleSize', scaleValue);
    polygon['circle'].setRadius(scaleValue * 0.25);
    this.handleChimneyDrag(polygon, polygon["circle"], polygon["diagonalOne"], polygon["diagonalTwo"]);
    const index = this.chimneyArray.findIndex(element => element.id === polygon.id);
    if (index !== -1) {
      this.chimneyArray[index] = polygon;
    }
  }

  handleChimneyDrag(polygon, circle, diagonalOne, diagonalTwo) {
    let polygonCenter = this.calculatePolygonCenter(polygon.getPath().getArray());
    circle.setCenter(polygonCenter);
    let newPolygonCords = polygon.getPath().getArray();
    diagonalOne.setPath([newPolygonCords[0], newPolygonCords[2]]);
    diagonalTwo.setPath([newPolygonCords[1], newPolygonCords[3]]);
  }

  getChimneyData() {
    let chimneyData = [];
    this.chimneyArray.forEach((data) => {
      const PolygonPath =  data?.polygon?.path || data.getPath().getArray();
      const diagonalOnePath = data?.diagonalOne?.path || data['diagonalOne'].getPath().getArray();
      const diagonalTwoPath = data?.diagonalTwo?.path || data['diagonalTwo'].getPath().getArray();
      chimneyData.push({
        polygon: {
          path: PolygonPath,
          id: data?.polygon || data.id
        },
        circle: {
          radius: data['circle'].radius,
          center: data['circle'].center
        },
        diagonalOne: {
          path: diagonalOnePath,
          id: data['diagonalOne'].id
        },
        diagonalTwo: {
          path: diagonalTwoPath,
          id: data['diagonalTwo'].id
        }
      })
    });
    return chimneyData;
  }

}
