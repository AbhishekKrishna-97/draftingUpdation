import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ToasterService } from './notify.service';
import { CustomTextService } from './custom-text.service';

@Injectable({
  providedIn: 'root'
})
export class ToolsService {

  drawingManager: any;
  toolDataArray: any = [];
  public toolDataSubject = new BehaviorSubject<any>(null);
  toolData$ = this.toolDataSubject.asObservable();
  propertylineData: any;
  accumulatedAmount: number = 0;

  constructor(
    private toasterService: ToasterService,
    private customTextService: CustomTextService
  ) {
    this.initializeDrawingTool();
    this.onDrawingComplete();
  }

  initializeDrawingTool() {
    this.drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: null,
      drawingControl: false,
    });

    this.drawingManager.setOptions({
      polylineOptions: {
        editable: true,
        strokeColor: '#069AF3',
        strokeWeight: 3,
        fillOpacity: 0.5
      },
      rectangleOptions: {
        editable: true,
        strokeColor: '#00FF00',
        draggable: true,
        strokeWeight: 2,
        fillOpacity: 0.5
      },
      circleOptions: {
        editable: true,
        strokeColor: '#0000FF',
        draggable: true,
        strokeWeight: 2,
        fillOpacity: 0.5
      }
    });
  }

  addPool(map: any) {
    this.drawingManager.setDrawingMode(null);
    let drawingManagerForPool = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
      drawingControl: false,
    });
    drawingManagerForPool.setMap(map);
    drawingManagerForPool.setOptions({
      polygonOptions: {
        editable: true,
        strokeColor: "#e8418f",
        strokeWeight: 3,
        fillColor: "#FFFFFF",
        fillOpacity: 0,
        draggable: true
      }
    });
    google.maps.event.addListener(drawingManagerForPool, 'polygoncomplete', (polygon: any) => {
      const timestamp = new Date().getTime();
      polygon.set('id', 'pool_' + timestamp);
      polygon.set('toolType', 'pool');
      this.toolDataArray.push(polygon);
      this.toolDataSubject.next({ type: "pool", tool: polygon });
      this.addListnerOnTool(polygon, map);
      drawingManagerForPool.setDrawingMode(null);
    });
  }

  drawDriveway(map: any) {
    this.drawingManager.setDrawingMode(null);

    let drawingManagerDriveway = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.POLYLINE,
      drawingControl: false,
    });

    drawingManagerDriveway.setMap(map);

    drawingManagerDriveway.setOptions({
      polylineOptions: {
        editable: true,
        strokeColor: '#FFA500',
        strokeWeight: 3
      }
    });

    google.maps.event.addListener(drawingManagerDriveway, 'polylinecomplete', (polyline: any) => {
      const timestamp = new Date().getTime();
      polyline.set('id', 'driveway_' + timestamp);
      polyline.set('toolType', 'driveway');
      this.toolDataArray.push(polyline);
      this.addListnerOnTool(polyline, map);
      drawingManagerDriveway.setDrawingMode(null);
    });
  }

  drawConnectionWire(map: any, currentTabName: string) {
    this.drawingManager.setDrawingMode(null);

    let drawingManagerConnectionWire = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.POLYLINE,
      drawingControl: false,
    });

    drawingManagerConnectionWire.setMap(map);
    drawingManagerConnectionWire.setOptions({
      polylineOptions: {
        editable: true,
        strokeColor: '#4CBB17',
        strokeWeight: 3
      }
    });

    google.maps.event.addListener(drawingManagerConnectionWire, 'polylinecomplete', (polyline: any) => {
      const timestamp = new Date().getTime();
      polyline.set('id', 'connectionWire_' + timestamp);
      polyline.set('toolType', 'connectionWire');
      polyline.set('tabName', currentTabName);
      polyline.set('lineType', 'solid');
      this.toolDataArray.push(polyline);
      this.addListnerOnTool(polyline, map);
      drawingManagerConnectionWire.setDrawingMode(null);
    });
  }

  drawRectangle(map: any) {
    this.drawingManager.setDrawingMode(google.maps.drawing.OverlayType.RECTANGLE);
    this.drawingManager.setMap(map);
  }

  drawCircle(map) {
    this.drawingManager.setDrawingMode(google.maps.drawing.OverlayType.CIRCLE);
    this.drawingManager.setMap(map);
  }

  drawPolyline(map) {
    this.drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYLINE);
    this.drawingManager.setMap(map);
  }

  drawPropertyLine(map) {
    let propertylineExist = this.toolDataArray.filter((element) => element.toolType === 'propertyline');
    if(propertylineExist[0]){
      this.toasterService.showError("Propertyline Already Exists !");
    }
    else{
      this.drawingManager.setDrawingMode(null);
      let drawingManagerPropertyline = new google.maps.drawing.DrawingManager({
        drawingMode: google.maps.drawing.OverlayType.POLYGON,
        drawingControl: false,
      });
  
      drawingManagerPropertyline.setMap(map);
  
      drawingManagerPropertyline.setOptions({
        polygonOptions: {
          editable: true,
          strokeColor: '#EE4B2B',
          strokeWeight: 3,
          fillColor: "#FFFFFF",
          fillOpacity: 0,
          zIndex: -100
        }
      });
  
      google.maps.event.addListener(drawingManagerPropertyline, 'polygoncomplete', (polygon: any) => {
        const timestamp = new Date().getTime();
        polygon.set('id', 'propertyline_' + timestamp);
        polygon.set('toolType', 'propertyline');
        polygon.set("dashed", false);
        this.toolDataArray.push(polygon);
        this.addListnerOnTool(polygon, map);
        drawingManagerPropertyline.setDrawingMode(null);
        this.toolDataSubject.next({ type: "propertyline", tool: polygon, resetTool: "hand", map });
        this.createPDFDimensions(polygon);
      });
    }
  }


  resetDrawingMode() {
    google.maps.event.addListener(this.drawingManager, 'overlaycomplete', (event: any) => {
      this.drawingManager.setDrawingMode(null);
    });
  }

  addListnerOnTool(tool: any, map: any) {
    google.maps.event.addListener(tool, 'click', () => {
      tool.addListener('click', () => {
        this.toolDataSubject.next({ type: tool['toolType'], tool: tool, map: map });
      })
    });
  }

  reDrawTool(map: any, currentTabName?: string) {
    this.toolDataArray.forEach((element, index) => {
      if (element.toolType === "pool" && currentTabName === "Site Plan") {
        this.redrawPool(map, element, index);
      }

      else if (element.toolType === "driveway" && currentTabName === "Site Plan") {
        this.redrawDriveway(map, element, index);
      }

      else if (element.toolType === "connectionWire" && currentTabName !== "Site Plan") {
        this.redrawConnectionWire(map, element, index, currentTabName);
      }

      else if (element.toolType === "rectangle" && currentTabName === "Site Plan") {
        this.redrawRectangle(map, element, index);
      }

      else if (element.toolType === "circle" && currentTabName === "Site Plan") {
        this.redrawCircle(map, element, index);
      }

      else if (element.toolType === "polyline" && currentTabName === "Site Plan") {
        this.redrawPolyline(map, element, index);
      }

      else if (element.toolType === "propertyline" && currentTabName === "Site Plan") {
        this.redrawPropertyline(map, element, index);
      }
    });
  }

  redrawPool(map: any, item: any, index: number) {
    let pool = new google.maps.Polygon({
      paths: item?.path || item.getPath().getArray(),
      editable: true,
      strokeColor: item.strokeColor,
      strokeWeight: item.strokeWeight,
      map: map,
      fillColor: item.fillColor,
      fillOpacity: item.fillOpacity,
      draggable: true
    });

    pool.set('id', item.id);
    pool.set('toolType', 'pool');
    this.toolDataArray[index] = pool;
    this.addListnerOnTool(pool, map);
  }

  redrawDriveway(map: any, item: any, index: number) {
    let driveway = new google.maps.Polyline({
      path: item?.path || item.getPath().getArray(),
      editable: true,
      strokeColor: item.strokeColor,
      strokeWeight: item.strokeWeight,
      map: map,
    });

    driveway.set('id', item.id);
    driveway.set('toolType', 'driveway');
    this.toolDataArray[index] = driveway;
    this.addListnerOnTool(driveway, map);
  }

  redrawConnectionWire(map: any, item: any, index: number, currentTabName?: string) {
    let connectionWire;
    if (item.tabName === "Roof Plan") { // To Draw Roof Plan Connection Wires On Both Roof Plan & String Layout
      connectionWire = new google.maps.Polyline({
        path: item.path || item.getPath().getArray(),
        editable: true,
        strokeColor: item.strokeColor,
        strokeWeight: item.strokeWeight,
        map: map,
      });
    }
    else {
      if (currentTabName === item.tabName) { // To Draw Connection Wire That Belongs To String Layout On String Layout Tab Only 
        connectionWire = new google.maps.Polyline({
          path: item.path || item.getPath().getArray(),
          editable: true,
          strokeColor: item.strokeColor,
          strokeWeight: item.strokeWeight,
          map: map,
        });
      }
    }
    if (connectionWire) {
      connectionWire.set('id', item.id);
      connectionWire.set('toolType', 'connectionWire');
      connectionWire.set('tabName', item.tabName);
      connectionWire.set('lineType', item.lineType);
      this.toolDataArray[index] = connectionWire;

      if (item.lineType) {
        if (item.lineType === 'dashed') {
          connectionWire.setOptions({
            strokeOpacity: 0,
            icons: [{
              icon: {
                path: 'M 0,-1 0,1',
                strokeOpacity: 1,
                scale: 2,
              },
              offset: '0',
              repeat: '10px',
            }]
          });
          connectionWire.set('lineType', "dashed");
        }
        else {
          connectionWire.set('lineType', "solid");
        }
      }

      this.addListnerOnTool(connectionWire, map);
    }
  }

  redrawRectangle(map: any, item: any, index: number) {
    let rectangle = new google.maps.Rectangle({
      bounds: item.bounds,
      editable: true,
      draggable: true,
      strokeColor: item.strokeColor,
      strokeWeight: item.strokeWeight,
      fillColor: item.fillColor,
      fillOpacity: item.fillOpacity,
      map: map,
    });

    rectangle.set('id', item.id);
    rectangle.set('toolType', 'rectangle');
    this.toolDataArray[index] = rectangle;
    this.addListnerOnTool(rectangle, map);
  }

  redrawCircle(map: any, item: any, index: number) {
    let circle = new google.maps.Circle({
      radius: item.radius,
      center: item.center,
      editable: true,
      draggable: true,
      strokeColor: item.strokeColor,
      strokeWeight: item.strokeWeight,
      fillColor: item.fillColor,
      fillOpacity: item.fillOpacity,
      map: map,
    });

    circle.set('id', item.id);
    circle.set('toolType', 'circle');
    this.toolDataArray[index] = circle;
    this.addListnerOnTool(circle, map);
  }

  redrawPolyline(map: any, item: any, index: number) {
    let polyline = new google.maps.Polyline({
      path: item.path || item.getPath().getArray(),
      editable: true,
      strokeColor: item.strokeColor,
      strokeWeight: item.strokeWeight,
      map: map,
    });

    polyline.set('id', item.id);
    polyline.set('toolType', 'polyline');
    this.toolDataArray[index] = polyline;

    if (item.lineType) {
      if (item.lineType === 'dashed') {
        polyline.setOptions({
          strokeOpacity: 0,
          icons: [{
            icon: {
              path: 'M 0,-1 0,1',
              strokeOpacity: 1,
              scale: 2,
            },
            offset: '0',
            repeat: '10px',
          }]
        });
        polyline.set('lineType', "dashed");
      }
      else {
        polyline.set('lineType', "solid");
      }
    }

    this.addListnerOnTool(polyline, map);
  }

  redrawPropertyline(map: any, item: any, index: number) {
    let propertyline = new google.maps.Polygon({
      paths: item.getPath().getArray(),
      editable: true,
      strokeColor: item.strokeColor,
      strokeWeight: item.strokeWeight,
      fillColor: '#FFFFFF',
      fillOpacity: 0,
      map: map
    });

    propertyline.set('id', item.id);
    propertyline.set('toolType', 'propertyline');
    propertyline.set('dashed', item.dashed);

    if (propertyline["dashed"]) {
      let path = propertyline.getPath().getArray();
      path.push(path[0]);
      let dashedPolyline = new google.maps.Polyline({
        path: path,
        strokeColor: item['strokeColor'],
        strokeWeight: 2,
        strokeOpacity: 0,
        icons: [{
          icon: {
            path: 'M 0,-1 0,1',
            strokeOpacity: 1,
            scale: 2,
          },
          offset: '0',
          repeat: '10px',
        }],
        map: map
      });
      propertyline["dashed"] = true;
      propertyline.set("dashedPolyline", dashedPolyline);
      propertyline.setVisible(false);
      dashedPolyline.addListener('click', () => {
        dashedPolyline.setVisible(false);
        propertyline.setVisible(true);
        propertyline.set("dashed", false);
      })
    }

    this.toolDataArray[index] = propertyline;
    this.addListnerOnTool(propertyline, map);
  }

  onDrawingComplete() {
    google.maps.event.addListener(this.drawingManager, 'overlaycomplete', (event) => {
      const timestamp = new Date().getTime();
      event.overlay.set('id', `${event.type}_${timestamp}`);
      event.overlay.set('toolType', event.type);
      this.toolDataArray.push(event.overlay);
      this.addListnerOnTool(event.overlay, null);
      this.toolDataSubject.next({ type: event.type, tool: event.overlay, resetTool: "hand" });
      this.drawingManager.setDrawingMode(null);
    });
  }

  createPDFDimensions(propertyLine) {
    let path = propertyLine.getPath().getArray();
    const propertyLineJSON: any = [];
    path.push(path[0])
    for (let i = 0; i < path.length - 1; i++) {
      const singleline: any = {};
      singleline.id = `PL${i + 1}`;
      singleline.lineType = propertyLine['dashed'] ? "dashed" : "solid";
      singleline.unit = "feet"
      const startPoint = path[i];
      const endPoint = path[i + 1];
      singleline.length = (google.maps.geometry.spherical.computeLength([startPoint, endPoint]) * 3.28084).toFixed(2);
      singleline.angle = google.maps.geometry.spherical.computeHeading(startPoint, endPoint);
      singleline.start = { lat: startPoint.lat(), lng: startPoint.lng() };
      singleline.end = { lat: endPoint.lat(), lng: endPoint.lng() };
      propertyLineJSON.push(singleline);
    }
    const bounds = new google.maps.LatLngBounds();
    path.forEach((latLng: google.maps.LatLng | google.maps.LatLngLiteral) => {
      bounds.extend(latLng);
    });
    const mapCenter = bounds.getCenter();
    let padding = 0.000008983 * 3 // 3 meter padding;
    // vertical dimensions
    let verticalBound = new google.maps.LatLngBounds(
      new google.maps.LatLng(bounds.getSouthWest().lat() - padding, bounds.getSouthWest().lng() - padding),
      new google.maps.LatLng(bounds.getNorthEast().lat() + padding, bounds.getNorthEast().lng() + padding)
    );
    const verticalCenterLat = (verticalBound.getNorthEast().lat() + verticalBound.getSouthWest().lat()) / 2;
    const verticalCenterLng = (verticalBound.getNorthEast().lng() + verticalBound.getSouthWest().lng()) / 2;
    // Calculate the ratio of width to height
    const verticalWidth = verticalBound.getNorthEast().lng() - verticalBound.getSouthWest().lng();
    const verticalHeight = verticalBound.getNorthEast().lat() - verticalBound.getSouthWest().lat();
    const targetverticalHeight = Math.max(verticalHeight, verticalWidth * (2 / 3));
    const targetverticalWidth = Math.max(verticalWidth, verticalHeight * (3 / 2));
    verticalBound.extend({ lat: verticalCenterLat + targetverticalWidth / 2, lng: verticalCenterLng + targetverticalHeight / 2 });
    verticalBound.extend({ lat: verticalCenterLat - targetverticalWidth / 2, lng: verticalCenterLng - targetverticalHeight / 2 });
    const boundingRectangle = new google.maps.Rectangle({
      bounds: verticalBound,
      strokeColor: "#00FF00", // Green border color
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: "#00FF00", // Green fill color
      fillOpacity: 0.35
    });
    // horizontal dimensions
    let horizontalBound = new google.maps.LatLngBounds(
      new google.maps.LatLng(bounds.getSouthWest().lat() - padding, bounds.getSouthWest().lng() - padding),
      new google.maps.LatLng(bounds.getNorthEast().lat() + padding, bounds.getNorthEast().lng() + padding)
    );
    const centerLat = (horizontalBound.getNorthEast().lat() + horizontalBound.getSouthWest().lat()) / 2;
    const centerLng = (horizontalBound.getNorthEast().lng() + horizontalBound.getSouthWest().lng()) / 2;
    // Calculate the ratio of width to height
    const width = horizontalBound.getNorthEast().lng() - horizontalBound.getSouthWest().lng();
    const height = horizontalBound.getNorthEast().lat() - horizontalBound.getSouthWest().lat();
    const targetHeight = Math.max(height, width * (2 / 3));
    const targetWidth = Math.max(width, height * (3 / 2));
    horizontalBound.extend({ lat: centerLat + targetHeight / 2, lng: centerLng + targetWidth / 2 });
    horizontalBound.extend({ lat: centerLat - targetHeight / 2, lng: centerLng - targetWidth / 2 });
    const boundingRectangle1 = new google.maps.Rectangle({
      bounds: horizontalBound,
      strokeColor: "blue", // pink border color
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: "red", // pink fill color
      fillOpacity: 0.35
    });
    this.propertylineData = propertyLineJSON;
    let propertylineData = {
      propertyline: propertyLineJSON,
      pdfDimension: {
        "landscape": horizontalBound,
        "portrait": verticalBound
      }
    }
    return propertylineData;
  }

  getToolData(toolType: string) {
    const toolData = [];
    let toolDataConnectionWire: any
    const filteredToolArray = this.toolDataArray.filter((element) => element.toolType === toolType);
    filteredToolArray.forEach(data => {
      const obj = {
        ...((data.toolType === "pool" || data.toolType === "rectangle" || data.toolType === "circle") && { "fillColor": data.fillColor, "fillOpacity": data.fillOpacity }),
        ...((data.toolType === "driveway" || data.toolType === "pool" || data.toolType === "polyline") && { "path": data.getPath().getArray() }),
        ...((data.toolType === "connectionWire") && { "lineType": data['lineType'], "tabName": data['tabName']}),
        ...((data.toolType === "rectangle") && { "bounds": data['bounds'] }),
        ...((data.toolType === "circle") && { "radius": data['radius'], "center": data['center'] }),
        ...((data.toolType === "polyline") && { "lineType": data['lineType'] }),
        strokeColor: data.strokeColor,
        strokeWeight: data.strokeWeight,
        id: data.id,
        toolType: data.toolType
      }
      toolData.push(obj);
    });

    if (toolType === "connectionWire") {
      toolDataConnectionWire = {
        roofPlan: toolData.filter((element) => element.tabName === "Roof Plan"),
        stringLayout: toolData.filter((element) => element.tabName === "String Layout"),
      }
    }

    return toolType === "connectionWire" ? toolDataConnectionWire : toolData;
  }

  adjustMap = (map: any, mode: string, amount: number) => {
    this.accumulatedAmount += amount;
    switch (mode) {
      case "tilt":
        map.setTilt(map.getTilt()! + amount);
        break;
      case "rotate":
        map.setHeading(map.getHeading()! + amount);
        this.customTextService.setRotation(this.accumulatedAmount);
        if (this.accumulatedAmount > 360) {
          this.accumulatedAmount = 0;
        }
        break;
      default:
        break;
    }
  }

  enableSelect(): void {
    this.drawingManager.setDrawingMode(null);
  }

}
