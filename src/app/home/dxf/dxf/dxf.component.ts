import { Component, OnInit, ViewChild } from '@angular/core';
import DxfParser from 'dxf-parser';
import { CommonService } from 'src/app/services/commonservice';
import { ToasterService } from 'src/app/services/notify.service';
import { DxfStringLayoutComponent } from './dxf-string-layout/dxf-string-layout.component';
import { ToolsService } from 'src/app/services/tools.service';
import { ObjectService } from 'src/app/services/object.service';
import { PlanSetService } from 'src/app/services/plansetservice';
import { AdditionalDrawingsService } from 'src/app/services/additional-drawings.service';
import { CustomTextService } from 'src/app/services/custom-text.service';
import { FenceService } from 'src/app/services/fence.service';
import { EquipmentService } from 'src/app/services/equipment.service';
import { RoofSlopeService } from 'src/app/services/roof-slope.service';

@Component({
  selector: 'app-dxf',
  templateUrl: './dxf.component.html',
  styleUrls: ['./dxf.component.scss']
})
export class DxfComponent implements OnInit {
  map: any
  isMapLoaded: boolean = false;
  parser = new DxfParser();
  jsonData: {
    location: any;
    data: {
      roofLine: any[];
      modules: any[];
      setbacks: any[];
      buildings: any[];
      obstructionsCircle: any[],
      obstructionsLine: any[],
      trees: any[],
      others: any[];
    };
  };
  location = {
    latitude: 29.57065,
    longitude: -81.230576
  };
  showFileUpload: boolean = false;
  isloading: boolean = true;
  tablist = [
    { name: ' Site Plan', value: 'siteplan' },
    { name: ' Roof Plan', value: 'roofplan' },
    { name: ' String Layout', value: 'stringlayout' },
  ];
  selectedtabindex: number = 0;
  isSitePlan: boolean = false;
  isRoofPlan: boolean = false;
  isStringLayout: boolean = false;
  istabshow: boolean = false;
  count: number = 0;
  tabclicksecondTime: boolean = false;
  tabvalue: string = 'siteplan';
  showTabs: boolean = false;
  hideMap: boolean = false;
  shapes: any = [];
  adjustedDxfData: any = {
    location: {},
    roofLine: [],
    roofs: [],
    setbacks: [],
    panels: [],
    obstructionsCircle: [],
    obstructionsLine: [],
    trees: [],
    others: [],
  };
  eaveArray: any = [];
  polygonScaleFactor: number = 1.0;
  nextBtnDxf: boolean = false;
  isdxfBoundaries: boolean = false;
  ismapready: boolean;
  currentMap:any;
  stringLayoutAccordian:boolean = false;
  @ViewChild(DxfStringLayoutComponent) stringlayout: DxfStringLayoutComponent;

  constructor(
    private commonService: CommonService,
    private toasterService: ToasterService,
    private toolService: ToolsService,
    private objectService: ObjectService,
    private plansetService: PlanSetService,
    private drawingService: AdditionalDrawingsService,
    private customTextService: CustomTextService,
    private fenceService: FenceService,
    private equipmentService: EquipmentService,
    private roofSlopeService: RoofSlopeService
  ) { }
  ngOnInit(): void {
    this.isMapLoaded = false;
    let permitdata = JSON.parse(localStorage.getItem("permitdata"))
    this.location.latitude = Number(permitdata.lat),
      this.location.longitude = Number(permitdata.lng)
    this.initializeMap();
  }

  initializeMap(): void {
    const center = { lat: this.location.latitude, lng: this.location.longitude };
    this.map = new google.maps.Map(document.getElementById("mapDxf")!, {
      center: center,
      zoom: 21,
      tilt: 0,
      heading: 0,
      zoomControl: false,
      streetViewControl: false,
    });
    this.isMapLoaded = true;
    this.fetchDraftingData();
  }

  handleFileSelect(evt: any) {
    evt.stopPropagation();
    evt.preventDefault();
    const files = evt.dataTransfer.files;
    this.removedatafromlocalStorage();

    this.dxftojson(files[0])
  }

  handleFileInput(fileData: any) {
    if (fileData.dragDrop) {
      this.dxftojson(fileData.event[0]);
    }
    else {
      const file = fileData?.event?.target?.files[0];
      if (file) {
        this.dxftojson(file);
      }
    }
  }

  handleDragOver(evt: any) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy';
  }

  dxftojson(fileData: any) {
    this.removedatafromlocalStorage();
    const reader = new FileReader();

    reader.onload = (event: any) => {
      const fileContent = event.target.result;

      const dxf = this.parser.parse(fileContent);
      let setbacks = [];
      let modules = [];
      let buildings = [];
      let obstructionsCircle = [];
      let obstructionsLine = [];
      let trees = [];
      let others = [];

      function roofLineSegregation(entities: string | any[]) {
        const uniqueLines = [];

        for (let i = 0; i < entities.length; i++) {
          const currentEntity = entities[i];

          if (currentEntity.type === "LINE" && currentEntity.layer === "Buildings") {
            if (uniqueLines.length === 0) {
              uniqueLines.push(currentEntity);
            }
            else {
              const isDuplicate = uniqueLines.some((line) =>
                (currentEntity.vertices[0].x === line.vertices[0].x && currentEntity.vertices[0].y === line.vertices[0].y &&
                  currentEntity.vertices[1].x === line.vertices[1].x && currentEntity.vertices[1].y === line.vertices[1].y) ||
                (currentEntity.vertices[0].x === line.vertices[1].x && currentEntity.vertices[0].y === line.vertices[1].y &&
                  currentEntity.vertices[1].x === line.vertices[0].x && currentEntity.vertices[1].y === line.vertices[0].y)
              );
              if (!isDuplicate) {
                uniqueLines.push(currentEntity);
              }
            }
          }
        }
        return uniqueLines;
      }

      function storeClosedPolygons(entities) {
        let allPolygons = [];
        let singlePolygon = [];

        entities.forEach((entity, index) => {
          if (entity.type === "LINE") {
            if (singlePolygon.length === 0) {
              singlePolygon.push(entity);
            } else if (
              singlePolygon[0].vertices[0].x === entity.vertices[1].x &&
              singlePolygon[0].vertices[0].y === entity.vertices[1].y
            ) {
              singlePolygon.push(entity);
              allPolygons.push(singlePolygon)
              singlePolygon = []

            } else if (
              singlePolygon[singlePolygon.length - 1].vertices[1].x === entity.vertices[0].x &&
              singlePolygon[singlePolygon.length - 1].vertices[1].y === entity.vertices[0].y
            ) {
              singlePolygon.push(entity);
            } else {
              if (singlePolygon.length > 0) {
                // Check if the polygon is closed
                const firstPoint = singlePolygon[0].vertices[0];
                const lastPoint = singlePolygon[singlePolygon.length - 1].vertices[1];
                if (firstPoint.x === lastPoint.x && firstPoint.y === lastPoint.y) {
                  allPolygons.push(singlePolygon);
                }
              }
              singlePolygon = [entity];
            }

            // If it's the last line, check if the last polygon is closed and add it to allPolygons
            if (index === entities.length - 1 && singlePolygon.length > 0) {
              const firstPoint = singlePolygon[0][0];
              const lastPoint = singlePolygon[singlePolygon.length - 1][1];
              if (firstPoint.lat === lastPoint.lat && firstPoint.lng === lastPoint.lng) {
                allPolygons.push(singlePolygon);
              }
            }
          }
          else {
            if (singlePolygon.length > 0) {
              allPolygons.push([...singlePolygon]);
              singlePolygon = [];
            }
            allPolygons.push([entity]);
          }
        });

        return allPolygons;
      }


      const roofLine = roofLineSegregation(dxf.entities)

      const resultSubarrays = storeClosedPolygons(dxf.entities);

      resultSubarrays.forEach((ele) => {
        if (ele[0].type === 'LINE' && ele[0].layer === 'Modules') {
          const single = []
          ele.forEach((d: { vertices: any[]; }) => {
            single.push(d.vertices[0])
          })
          modules.push(single)
        }
        if (ele[0].layer === 'Setbacks') {
          const single = []
          ele.forEach((d: { vertices: any[]; }) => {
            single.push(d.vertices[0])
          })
          setbacks.push(single)
        }
        if (ele[0].layer === 'Buildings') {
          const single = []
          ele.forEach((d: { vertices: any[]; }) => {
            single.push(d.vertices[0])
          })
          buildings.push(single)
        }
        if (ele[0].type === 'LINE' && ele[0].layer === '1') {
          const single = []
          ele.forEach((d: { vertices: any[]; }) => {
            single.push(d.vertices[0])
          })
          others.push(single)
        }
        if (ele[0].type === 'LINE' && ele[0].layer === "Obstructions") {
          const single = []
          ele.forEach((d: { vertices: any[]; }) => {
            single.push(d.vertices[0])
          })
          obstructionsLine.push(single)
        }
        if (ele[0].type === 'CIRCLE' && ele[0].layer === "Obstructions") {
          obstructionsCircle.push({
            center: ele[0].center,
            radius: ele[0].radius
          })
        }
        if (ele[0].type === 'CIRCLE' && ele[0].layer === 'Trees') {
          trees.push({
            center: ele[0].center,
            radius: ele[0].radius
          })
        }
      })

      this.jsonData = {
        location: this.location,
        data: {
          roofLine,
          modules,
          setbacks,
          buildings,
          obstructionsCircle,
          obstructionsLine,
          trees,
          others
        }
      }
      this.drawOnMap()
    }

    reader.readAsText(fileData);
  }

  drawOnMap() {
    this.ismapready = true;
    const reader = new FileReader();
    let Range: { minX: any; maxX: any; minY: any; maxY: any; };
    let data = this.jsonData.data

    Range = this.RangeofXY(data);
    let { minX, maxX, minY, maxY } = Range;
    var metersToDegrees = 0.000009;

    var lengthInMeters = Math.abs(maxX - minX) * 0.3048;
    var widthInMeters = Math.abs(maxY - minY) * 0.3048;

    var lengthInDegrees = lengthInMeters * metersToDegrees;
    var widthInDegrees = widthInMeters * metersToDegrees;
    const location = this.jsonData.location;
    var center = { lat: location.latitude, lng: location.longitude };
    // Create a rectangle and set its path
    var rectangle = new google.maps.Rectangle({
      bounds: {
        north: center.lat + widthInDegrees / 2,
        south: center.lat - widthInDegrees / 2,
        east: center.lng + lengthInDegrees / 2,
        west: center.lng - lengthInDegrees / 2,
      },
      // map: map,
      strokeColor: "#FF0000",
      strokeOpacity: 0.8,
      strokeWeight: 1,
      fillOpacity: 0,
      draggable: true,
    });

    const boundary = rectangle.getBounds();
    this.convertDraw(rectangle, Range, data)
    rectangle.addListener('dragend', () => this.convertDraw(rectangle, Range, data));
  }

  //   rotateRectangle(rotation: number,rectangle) {
  //     if (!this.rectangle) return;

  //     const bounds = this.rectangle.getBounds();
  //     const center = bounds.getCenter();
  //     const northEast = bounds.getNorthEast();

  //     const angle = rotation * Math.PI / 180;

  //     const newNorthEast = {
  //         lat: center.lat() + (northEast.lat() - center.lat()) * Math.cos(angle) - (northEast.lng() - center.lng()) * Math.sin(angle),
  //         lng: center.lng() + (northEast.lng() - center.lng()) * Math.cos(angle) + (northEast.lat() - center.lat()) * Math.sin(angle)
  //     };

  //     const newBounds = new google.maps.LatLngBounds(center, newNorthEast);
  //     this.rectangle.setBounds(newBounds);
  // }

  RangeofXY(data: { modules: any; setbacks: any; buildings: any; }) {
    const xCoordinates = [];
    const yCoordinates = [];

    // Extract coordinates from modules, setbacks, and buildings
    const extractCoordinates = (array: any[]) => {
      array.forEach((item: any[]) => {
        item.forEach((point: { x: any; y: any; }) => {
          xCoordinates.push(point.x);
          yCoordinates.push(point.y);
        });
      });
    };

    extractCoordinates(data.modules);
    extractCoordinates(data.setbacks);
    extractCoordinates(data.buildings);

    // Find minimum and maximum values for X and Y coordinates
    const minX = Math.min(...xCoordinates);
    const maxX = Math.max(...xCoordinates);
    const minY = Math.min(...yCoordinates);
    const maxY = Math.max(...yCoordinates);

    return {
      minX,
      maxX,
      minY,
      maxY,
    };
  }

  convertDraw(rectangle: google.maps.Rectangle, Range: { minX: any; maxX: any; minY: any; maxY: any; }, data: any) {
    const boundary = rectangle.getBounds();

    const southWest = boundary.getSouthWest();
    const northEast = boundary.getNorthEast();

    const south = southWest.lat();
    const west = southWest.lng();
    const north = northEast.lat();
    const east = northEast.lng();

    const { minX, maxX, minY, maxY } = Range;

    function convertToLatLng(x: number, y: number) {
      let latitude = south + (y * Math.abs(north - south)) / Math.abs(maxY - minY);
      let longitude = west + (x * Math.abs(east - west)) / Math.abs(maxX - minX);
      return { latitude, longitude };
    }

    const { roofLine, setbacks, modules, buildings, obstructionsLine, obstructionsCircle, trees } = data

    roofLine.forEach((data: any, index: number) => {

      let paths = [];
      data.vertices.forEach((idx: { x: number; y: number; }) => {
        const latlng = convertToLatLng(Math.abs(minX) + idx.x, Math.abs(minY) + idx.y);
        paths.push(
          { lat: latlng.latitude, lng: latlng.longitude }
        )
      })

      const roofPolyline = new google.maps.Polyline({
        path: paths,
        geodesic: true,
        strokeColor: "black",
        strokeOpacity: 1.0,
        strokeWeight: 5,
        map: this.map,
        zIndex: 10,
      });

      google.maps.event.addListener(roofPolyline, 'click', () => {
        this.addLineToEaveArray({
          id: `L${index + 1}`,
          start: paths[0],
          end: paths[1],
        }, roofPolyline)
      })
      this.shapes.push({ type: "line", id: `L${index + 1}`, polygon: roofPolyline, previousCoords: roofPolyline.getPath().getArray(), scaleDiff: [], scaledCoords: roofPolyline.getPath().getArray() });

    })

    buildings.forEach((data: any[], index: number) => {
      let paths = [];
      data.forEach((idx: { x: number; y: number; }) => {
        const latlng = convertToLatLng(Math.abs(minX) + idx.x, Math.abs(minY) + idx.y);
        paths.push(
          { lat: latlng.latitude, lng: latlng.longitude }
        )
      })
      const roofPolygon = new google.maps.Polygon({
        paths: paths,
        geodesic: true,
        strokeColor: "black",
        strokeOpacity: 0,
        strokeWeight: 0,
        fillColor: "white",
        fillOpacity: 0,
        map: this.map,
        draggable: true
      });

      this.shapes.push({ type: "roof", id: `R${index + 1}`, polygon: roofPolygon, previousCoords: roofPolygon.getPath().getArray(), scaleDiff: [], scaledCoords: roofPolygon.getPath().getArray() });
    })

    setbacks.forEach((data: any[], index: number) => {
      let paths = [];
      data.forEach((idx: { x: number; y: number; }) => {
        const latlng = convertToLatLng(Math.abs(minX) + idx.x, Math.abs(minY) + idx.y);
        paths.push(
          { lat: latlng.latitude, lng: latlng.longitude }
        )
      })
      const setbacksPolygon = new google.maps.Polygon({
        paths: paths,
        geodesic: true,
        strokeColor: "green",
        strokeOpacity: 0.7,
        strokeWeight: 2,
        fillColor: "white",
        fillOpacity: 0.0,
        map: this.map,
        draggable: true
      });
      this.shapes.push({ type: "setback", id: `S${index + 1}`, polygon: setbacksPolygon, previousCoords: setbacksPolygon.getPath().getArray(), scaleDiff: [], scaledCoords: setbacksPolygon.getPath().getArray() });
    })

    obstructionsLine.forEach((data: any[], index: number) => {
      let paths = [];
      data.forEach((idx: { x: number; y: number; }) => {
        const latlng = convertToLatLng(Math.abs(minX) + idx.x, Math.abs(minY) + idx.y);
        paths.push(
          { lat: latlng.latitude, lng: latlng.longitude }
        )
      })
      const obstructionsPolygon = new google.maps.Polygon({
        paths: paths,
        geodesic: true,
        strokeColor: "red",
        strokeOpacity: 1.0,
        strokeWeight: 2,
        fillColor: "red",
        fillOpacity: 0.5,
        map: this.map,
        draggable: true
      });

      this.shapes.push({ type: "obstructionsLine", id: `O${index + 1}`, polygon: obstructionsPolygon, previousCoords: obstructionsPolygon.getPath().getArray(), scaleDiff: [], scaledCoords: obstructionsPolygon.getPath().getArray() });
    })

    obstructionsCircle.forEach((data: any, index: number) => {
      const latlng = convertToLatLng(Math.abs(minX) + data.center.x, Math.abs(minY) + data.center.y);


      const obstructionsCircle = new google.maps.Circle({
        center: { lat: latlng.latitude, lng: latlng.longitude },
        radius: (data.radius * 0.3048),
        fillOpacity: 1,
        strokeColor: "red",
        strokeOpacity: 1.0,
        strokeWeight: 2,
        fillColor: "white",
        // map: this.map,
        draggable: true
      });

      // this.shapes.push({ type: "obstructionsCircle", polygon: obstructionsCircle, previousCoords: obstructionsCircle.getCenter(), scaleDiff: [], scaledCoords: obstructionsCircle.getCenter() });
    })

    modules.forEach((data: any[], index: number) => {
      let paths = [];
      data.forEach((idx: { x: number; y: number; }) => {
        const latlng = convertToLatLng(Math.abs(minX) + idx.x, Math.abs(minY) + idx.y);
        paths.push(
          { lat: latlng.latitude, lng: latlng.longitude }
        );
      });
      const modulesPolygon = new google.maps.Polygon({
        paths: paths,
        geodesic: true,
        strokeColor: "#FFA500",
        strokeOpacity: 1.0,
        strokeWeight: 2,
        fillColor: "#FFFA41",
        fillOpacity: 0.8,
        map: this.map,
        draggable: true
      });
      this.shapes.push({ type: "panel", id: `P${index + 1}`, polygon: modulesPolygon, previousCoords: modulesPolygon.getPath().getArray(), scaleDiff: [], scaledCoords: modulesPolygon.getPath().getArray() });
    });

    trees.forEach((data: any, index) => {
      const latlng = convertToLatLng(Math.abs(minX) + data.center.x, Math.abs(minY) + data.center.y);
      const obj = { center: new google.maps.LatLng(latlng.latitude,latlng.longitude) , radius: (data.radius * 0.3048) ,index }
      this.objectService.addTree(this.map,null,null,null,obj);
    })

    this.convertDxfData()

    this.shapes.forEach((shape) => {
      google.maps.event.addListener(shape.polygon, 'drag', () => {
        this.updatePolygons(shape);
      });
    });
  }

  scalePolygons() {
    const center = this.calculatePolygonCenter();

    this.shapes.forEach(({ polygon, scaledCoords, type }, index) => {
      const scaleDiff = [];
      const updatedscaledCoords = scaledCoords.map((coord) => {
        const latDiff = (coord.lat() - center.lat()) * this.polygonScaleFactor;
        const lngDiff = (coord.lng() - center.lng()) * this.polygonScaleFactor;

        const scaledLat = center.lat() + latDiff;
        const scaledLng = center.lng() + lngDiff;

        scaleDiff.push({ latDiff, lngDiff })
        return {
          lat: scaledLat,
          lng: scaledLng,
        };
      });
      const scaledLatLngs = updatedscaledCoords.map((coord) => new google.maps.LatLng(coord.lat, coord.lng));
      this.shapes[index]["scaledCoords"] = scaledLatLngs;
      if (type === "line") {
        polygon.setPath(updatedscaledCoords.map((coord) => ({
          lat: coord.lat,
          lng: coord.lng,
        })));

        this.shapes[index].scaleDiff = scaleDiff
      }
      else {
        polygon.setPaths(updatedscaledCoords.map((coord) => ({
          lat: coord.lat,
          lng: coord.lng,
        })));

        this.shapes[index].scaleDiff = scaleDiff
      }
    });
  }

  rotatePolygons(rotation) {

    const rotationAngle = parseFloat("1") * (Math.PI / 180);
    const center = this.calculatePolygonCenter();
    const rotationDirection = rotation;
    this.shapes.forEach(({ polygon, scaledCoords, type }, index) => {

      const rotatedCoords = scaledCoords.map((coord, i) => {
        const latDiff = (coord.lat() - center.lat());
        const lngDiff = (coord.lng() - center.lng());

        // Apply rotation
        const rotatedLatDiff = latDiff * Math.cos(rotationDirection * rotationAngle) - lngDiff * Math.sin(rotationDirection * rotationAngle);
        const rotatedLngDiff = latDiff * Math.sin(rotationDirection * rotationAngle) + lngDiff * Math.cos(rotationDirection * rotationAngle);

        const rotatedLat = center.lat() + rotatedLatDiff;
        const rotatedLng = center.lng() + rotatedLngDiff;


        return {
          lat: rotatedLat,
          lng: rotatedLng,
        };

      });
      const scaledLatLngs = rotatedCoords.map((coord) => new google.maps.LatLng(coord.lat, coord.lng));
      this.shapes[index]["scaledCoords"] = scaledLatLngs;
      if (type === "line") {
        polygon.setPath(rotatedCoords.map((coord) => ({
          lat: coord.lat,
          lng: coord.lng,
        })));

        this.shapes[index].rotationAngle = rotationAngle;
      }
      else {
        polygon.setPaths(rotatedCoords.map((coord) => ({
          lat: coord.lat,
          lng: coord.lng,
        })));

        this.shapes[index].rotationAngle = rotationAngle;
      }
    });

  }
  calculatePolygonCenter(): google.maps.LatLng {

    let allCoords = []
    this.shapes.forEach(({ scaledCoords }) => {
      scaledCoords.forEach(element => {

        allCoords.push(element)
      });

    })
    const latSum = allCoords.reduce((sum, coord) => sum + coord.lat(), 0);
    const lngSum = allCoords.reduce((sum, coord) => sum + coord.lng(), 0);

    const center = new google.maps.LatLng(latSum / allCoords.length, lngSum / allCoords.length);
    return center;
  }
  updatePolygons(draggedPolygon: { polygon: google.maps.Polygon; scaledCoords: google.maps.LatLng[] }) {
    const deltaLat = draggedPolygon.polygon.getPath().getAt(0).lat() - draggedPolygon.scaledCoords[0].lat();
    const deltaLng = draggedPolygon.polygon.getPath().getAt(0).lng() - draggedPolygon.scaledCoords[0].lng();
    this.shapes.forEach(({ polygon, scaledCoords, type }, index) => {
      if (type === "line") {
        polygon.setPath(
          scaledCoords.map(coord => ({
            lat: coord.lat() + deltaLat,
            lng: coord.lng() + deltaLng,
          }))
        );
      }
      else {
        polygon.setPaths(
          scaledCoords.map(coord => ({
            lat: coord.lat() + deltaLat,
            lng: coord.lng() + deltaLng,
          }))
        );
      }

      let toupdatescaledCoords = scaledCoords.map(coord => ({
        lat: coord.lat() + deltaLat,
        lng: coord.lng() + deltaLng,
      }));

      scaledCoords = toupdatescaledCoords.map((coord) => new google.maps.LatLng(coord.lat, coord.lng));
      this.shapes[index].scaledCoords = scaledCoords

      //this.updatePolygonCoords(polygon, scaledCoords, scaleDiff, deltaLat, deltaLng);
    });

  }

  // updatePolygonCoords(polygon: google.maps.Polygon, scaledCoords: google.maps.LatLng[], scaleDiff, deltaLat: number, deltaLng: number) {
  //   polygon.setPaths(scaledCoords.map((coord, index) => ({
  //     lat: coord.lat() + deltaLat,
  //     lng: coord.lng() + deltaLng,
  //   })));
  // }

  convertDxfData() {
    this.shapes.forEach(element => {
      if (element.type === "panel") {
        let panel: any = {
          id: `P${this.adjustedDxfData.panels.length + 1}`,
          isVisible: true
        }
        let paths = element.polygon.getPath().getArray();
        const roofId = this.checkPolygonRoof(paths);
        if (roofId) {
          panel.roofId = roofId;
        }
        paths.push(paths[0]);
        const lineJSON: any = []

        for (let i = 0; i < paths.length - 1; i++) {
          const startPoint = { lat: paths[i].lat(), lng: paths[i].lng() };
          const endPoint = { lat: paths[i + 1].lat(), lng: paths[i + 1].lng() };
          const length = (google.maps.geometry.spherical.computeLength([paths[i], paths[i + 1]]) * 3.28084).toFixed(2);
          const angle = google.maps.geometry.spherical.computeHeading(paths[i], paths[i + 1]);

          const singleline: { id: number; unit: string; start: { lat: number; lng: number }; end: { lat: number; lng: number }; length: string; angle: number; roofId?: string } = {
            id: i + 1,
            unit: "feet",
            start: startPoint,
            end: endPoint,
            length: length,
            angle: angle,
          };

          lineJSON.push(singleline);
        }
        panel.lines = lineJSON
        this.adjustedDxfData.panels.push(panel)

      }
      if (element.type === "roof") {
        let roof: any = {
          id: element.id,
          isVisible: true
        }
        let paths = element.polygon.getPath().getArray();
        paths.push(paths[0]);

        const lineJSON: any = []

        for (let i = 0; i < paths.length - 1; i++) {
          const startPoint = { lat: paths[i].lat(), lng: paths[i].lng() };
          const endPoint = { lat: paths[i + 1].lat(), lng: paths[i + 1].lng() };
          const length = (google.maps.geometry.spherical.computeLength([paths[i], paths[i + 1]]) * 3.28084).toFixed(2);
          const angle = google.maps.geometry.spherical.computeHeading(paths[i], paths[i + 1]);

          const singleline: { id: number; unit: string; start: { lat: number; lng: number }; end: { lat: number; lng: number }; length: string; angle: number } = {
            id: i + 1,
            unit: "feet",
            start: startPoint,
            end: endPoint,
            length: length,
            angle: angle
          };
          lineJSON.push(singleline);
        }
        roof.lines = lineJSON
        this.adjustedDxfData.roofs.push(roof)
      }
      if (element.type === "setback") {
        let setback: any = {
          id: `S${this.adjustedDxfData.setbacks.length + 1}`
        }
        let paths = element.polygon.getPath().getArray();
        paths.push(paths[0]);
        const roofId = this.checkPolygonRoof(paths);
        if (roofId) {
          setback.roofId = roofId;
        }
        const lineJSON: any = []

        for (let i = 0; i < paths.length - 1; i++) {
          const startPoint = { lat: paths[i].lat(), lng: paths[i].lng() };
          const endPoint = { lat: paths[i + 1].lat(), lng: paths[i + 1].lng() };

          const singleline: { id: number; start: { lat: number; lng: number }; end: { lat: number; lng: number } } = {
            id: i + 1,
            start: startPoint,
            end: endPoint,
          };
          lineJSON.push(singleline);
        }
        setback.lines = lineJSON
        this.adjustedDxfData.setbacks.push(setback)

      }
      if (element.type === "obstructionsLine") {
        let obstructionsLine: any = {
          id: `O${this.adjustedDxfData.obstructionsLine.length + 1}`
        }
        let paths = element.polygon.getPath().getArray();
        const roofId = this.checkPolygonRoof(paths);
        if (roofId) {
          obstructionsLine.roofId = roofId;
        }
        paths.push(paths[0]);
        const lineJSON: any = []


        for (let i = 0; i < paths.length - 1; i++) {
          const startPoint = { lat: paths[i].lat(), lng: paths[i].lng() };
          const endPoint = { lat: paths[i + 1].lat(), lng: paths[i + 1].lng() };

          const singleline: { id: number; start: { lat: number; lng: number }; end: { lat: number; lng: number } } = {
            id: i + 1,
            start: startPoint,
            end: endPoint
          };
          lineJSON.push(singleline);
        }
        obstructionsLine.lines = lineJSON
        this.adjustedDxfData.obstructionsLine.push(obstructionsLine)

      }
    });
  }

  updateDxfData() {
    this.shapes.forEach(element => {
      if (element.type === "line") {

        let paths = element.polygon.getPath().getArray();
        const startPoint = { lat: paths[0].lat(), lng: paths[0].lng() };
        const endPoint = { lat: paths[1].lat(), lng: paths[1].lng() };
        const color = element.polygon.get("strokeColor")
        const singleline: { id: string, start: { lat: number; lng: number }; end: { lat: number; lng: number }; color: string } = {
          id: element.id,
          start: startPoint,
          end: endPoint,
          color
        };

        this.adjustedDxfData.roofLine.push(singleline)
      }

      if (element.type === "panel") {
        const initialPanelData = this.adjustedDxfData.panels.find((panel) => panel.id === element.id)

        let paths = element.polygon.getPath().getArray();

        for (let i = 0; i < paths.length - 1; i++) {
          const startPoint = { lat: paths[i].lat(), lng: paths[i].lng() };
          const endPoint = { lat: paths[i + 1].lat(), lng: paths[i + 1].lng() };
          const angle = google.maps.geometry.spherical.computeHeading(paths[i], paths[i + 1]);

          initialPanelData.lines[i].start = startPoint
          initialPanelData.lines[i].end = endPoint
          initialPanelData.lines[i].angle = angle
        }
      }

      if (element.type === "roof") {
        const initialRoofData = this.adjustedDxfData.roofs.find((roof) => roof.id === element.id)

        let paths = element.polygon.getPath().getArray();

        for (let i = 0; i < paths.length - 1; i++) {
          const startPoint = { lat: paths[i].lat(), lng: paths[i].lng() };
          const endPoint = { lat: paths[i + 1].lat(), lng: paths[i + 1].lng() };
          const angle = google.maps.geometry.spherical.computeHeading(paths[i], paths[i + 1]);

          initialRoofData.lines[i].start = startPoint
          initialRoofData.lines[i].end = endPoint
          initialRoofData.lines[i].angle = angle
        }
      }

      if (element.type === "setback") {
        const initialSetbackData = this.adjustedDxfData.setbacks.find((setback) => setback.id === element.id)

        let paths = element.polygon.getPath().getArray();

        for (let i = 0; i < paths.length - 1; i++) {
          const startPoint = { lat: paths[i].lat(), lng: paths[i].lng() };
          const endPoint = { lat: paths[i + 1].lat(), lng: paths[i + 1].lng() };

          initialSetbackData.lines[i].start = startPoint
          initialSetbackData.lines[i].end = endPoint
        }
      }

      if (element.type === "obstructionsLine") {
        const initialObstructionsLineData = this.adjustedDxfData.obstructionsLine.find((obstructions) => obstructions.id === element.id)

        let paths = element.polygon.getPath().getArray();

        for (let i = 0; i < paths.length - 1; i++) {
          const startPoint = { lat: paths[i].lat(), lng: paths[i].lng() };
          const endPoint = { lat: paths[i + 1].lat(), lng: paths[i + 1].lng() };

          initialObstructionsLineData.lines[i].start = startPoint
          initialObstructionsLineData.lines[i].end = endPoint
        }

      }
    });

    this.adjustedDxfData.trees.forEach(element => {
      const initialTreeData = this.adjustedDxfData.trees.find((tree) => tree.id === element.id)

      initialTreeData.center = element.treeCircle.getCenter();
      initialTreeData.radius = element.treeCircle.getRadius();

      delete initialTreeData.treeCircle
    })

    this.commonService.sendDxfData(this.adjustedDxfData);
  }

  checkPolygonRoof(paths: any): string | undefined {
    for (const ele of this.shapes) {
      if (ele.type === "roof" && ele.id) {
        let isInsideAllPoints = true;

        for (let i = 0; i < paths.length; i++) {
          const isInside = google.maps.geometry.poly.containsLocation(paths[i], ele.polygon);
          if (!isInside) {
            isInsideAllPoints = false;
            break;
          }
        }
        if (isInsideAllPoints) {
          return ele.id;
        }
      }
    }
    return undefined;
  }

  addLineToEaveArray(line, polyline: any) {
    const lineIndex = this.eaveArray.findIndex((eaveLine) => (eaveLine.id === line.id));

    if (lineIndex !== -1) {
      delete line.type;
      polyline.setOptions({
        strokeColor: "black",
      })
      this.eaveArray.splice(lineIndex, 1);
    }
    else {
      line.type = "EAVE"
      polyline.setOptions({
        strokeColor: "blue",
      })
      this.eaveArray.push(line)
    }
  }

  findParallelEavePairs() {
    const parallelEavePairs = [];

    for (let i = 0; i < this.eaveArray.length - 1; i++) {
      for (let j = i + 1; j < this.eaveArray.length; j++) {
        const eaveLine1 = this.eaveArray[i];
        const eaveLine2 = this.eaveArray[j];

        if (this.areLinesParallel(eaveLine1, eaveLine2)) {

          const pairAlreadyExists = parallelEavePairs.some(pair =>
          (pair.eaveLine1.id === eaveLine1.id || pair.eaveLine1.id === eaveLine2.id ||
            pair.eaveLine2.id === eaveLine1.id || pair.eaveLine2.id === eaveLine2.id));

          if (!pairAlreadyExists) {
            parallelEavePairs.push({ eaveLine1, eaveLine2 });
            continue;
          }
        }
      }
    }

    this.findRidge(parallelEavePairs)
    return parallelEavePairs;
  }

  areLinesParallel(line1, line2) {
    const slope1 = (line1.end.lat - line1.start.lat) / (line1.end.lng - line1.start.lng);
    const slope2 = (line2.end.lat - line2.start.lat) / (line2.end.lng - line2.start.lng);
    const tolerance = 0.01;
    return Math.abs(slope1 - slope2) < tolerance;
  }

  findRidge(eavePairs) {

    this.adjustedDxfData.roofs.forEach((roof) => {
      roof.lines.map((line) => {
        this.eaveArray.forEach(element => {
          if (element.start.lat === line.start.lat && element.end.lng === line.end.lng) {
            line.type = element.type
          }
          if (element.end.lat === line.start.lat && element.start.lng === line.end.lng) {
            line.type = element.type
          }
        });

        for (let i = 0; i < eavePairs.length - 1; i++) {
          if (!line.type && line.length > 5) {
            if (this.areLinesParallel(line, eavePairs[i].eaveLine1)) {
              line.type = "RIDGE"
            }
          }
        }
      })
    })
    this.shapes.forEach(element => {
      if (element.type === "line") {

        let paths = element.polygon.getPath().getArray();
        const startPoint = { lat: paths[0].lat(), lng: paths[0].lng() };
        const endPoint = { lat: paths[1].lat(), lng: paths[1].lng() };
        const color = element.polygon.get("strokeColor")
        const length = (google.maps.geometry.spherical.computeLength([new google.maps.LatLng(startPoint), new google.maps.LatLng(endPoint)]) * 3.28084);
        for (let i = 0; i < eavePairs.length - 1; i++) {
          if ((color == 'black') && length > 5) {
            if (this.areLinesParallel({ start: startPoint, end: endPoint }, eavePairs[i].eaveLine1)) {
              element.polygon.set("strokeColor", 'red')
            }
          }
        }
      }
    })
  }

  onLocationSelected(location: any): void {
    this.location = location;
    const mapOptions = {
      center: { lat: location.latitude, lng: location.longitude },
      zoom: 21,
    };
    this.map.setOptions(mapOptions);
  }

  handleSubmit(file: any) {
    this.showFileUpload = false;
    this.isloading = true;
    setTimeout(() => {
      this.handleFileInput(file);
      this.isloading = false;
      this.showFileUpload = false;
      this.nextBtnDxf = true;
    }, 1000);
  }

  manageTab(value: boolean) {
    this.istabshow = value;
  }
  onTabChange(action?) {
    let mapData = JSON.parse(localStorage.getItem('mapData'));

    if (action == 'next') {
      let  propertylineExist = this.toolService.toolDataArray.filter((element)=> element.toolType === 'propertyline');
      if (propertylineExist[0]) {
        if (this.selectedtabindex < 2) {
          this.selectedtabindex = this.selectedtabindex + 1;
        }
      }
      else {
        this.toasterService.showError("Draw Propertyline First !");
      }

    }
    if (action == 'prev') {
      if (this.selectedtabindex > 0) {
        this.selectedtabindex = this.selectedtabindex - 1;
      }
    }
    this.isRoofPlan = false;
    this.isSitePlan = false;
    this.isStringLayout = false;
    if (this.selectedtabindex == 0) {
      this.tabvalue = 'siteplan'
    }
    if (this.selectedtabindex == 1) {
      this.tabvalue = 'roofplan'
    }
    if (this.selectedtabindex == 2) {
      this.tabvalue = 'stringlayout'
    }
    switch (this.tabvalue) {
      case 'siteplan': {
        this.count += 1;
        if (this.count == 2) {
          this.tabclicksecondTime = true;
        }
        this.isSitePlan = true;
        break;
      }
      case 'roofplan': {
        this.isRoofPlan = true;
        break;
      }
      case 'stringlayout': {
        this.isStringLayout = true;
        break;
      }
    }

  }

  submitDxfData() {
    this.isloading = true;
    this.findParallelEavePairs()
    this.updateDxfData();
    this.hideMap = true;
    this.showTabs = true;
    this.nextBtnDxf = false;
    setTimeout(() => {
      this.isSitePlan = true;
      this.isloading = false;
    }, 1000);
  }
  getDrfating(finalsubmit?) {
    this.stringlayout.getFinalDrafting(finalsubmit);
  }

  removedatafromlocalStorage() {
    localStorage.removeItem("stringLayoutData");
    localStorage.removeItem("mapData");
    localStorage.removeItem("finalPdfJSON");
    localStorage.removeItem('JSONdata');
    localStorage.removeItem('dxfJsonData');
  }

  activatedPlans(event: any) {
    this.isloading = true;
    // this.convertDxfData();
    this.hideMap = true;
    this.showTabs = true;
    this.nextBtnDxf = false;
    setTimeout(() => {
      this.isSitePlan = true;
      this.isdxfBoundaries = event.value;
      this.isloading = false;
    }, 1000);
  }

  scaleUp() {
    this.polygonScaleFactor = 1.0
    this.polygonScaleFactor = this.polygonScaleFactor + 0.1
    this.scalePolygons()
  }
  scaledown() {
    this.polygonScaleFactor = 1.0
    this.polygonScaleFactor = this.polygonScaleFactor - 0.1;
    this.scalePolygons()
  }

  setMapCenter(){
    this.currentMap.setCenter({lat: this.location.latitude, lng: this.location.longitude});
    this.currentMap.setZoom(22);
  }

  fetchCurrentMap(event:any){
    this.currentMap = event;
  }

  accordianStatus(event:any){
    this.stringLayoutAccordian = event;  }

  preserveDraftingData(){
    this.commonService.preserveDraftingData();
  }

  async fetchDraftingData() {
    await this.commonService.fetchDraftingData().then(() => {
      this.isloading = false;
      this.showFileUpload = true;
      this.adjustedDxfData.location = this.location;
    });
  }
}
