import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, OnDestroy } from '@angular/core';
import * as $ from 'jquery';
import 'round-slider';
import { CommonService } from 'src/app/services/commonservice';
import { PlanSetService } from 'src/app/services/plansetservice';
import { EquipmentService } from 'src/app/services/equipment.service';
import { ToolsService } from 'src/app/services/tools.service';
import { CustomTextService } from 'src/app/services/custom-text.service';
import { ObjectService } from 'src/app/services/object.service';
import { AdditionalDrawingsService } from 'src/app/services/additional-drawings.service';
import { FenceService } from 'src/app/services/fence.service';
interface Panel {
  x: number;
  y: number;
}


interface Point {
  id: number;
  coords: string;
}

interface Line {
  id: number;
  path: string;
  type: string;
}

interface Face {
  polygon: {
    path: string;
  };
}

@Component({
  selector: 'app-roofmapping',
  templateUrl: './roofmapping.component.html',
  styleUrls: ['./roofmapping.component.scss']
})
export class RoofmappingComponent implements OnInit, OnDestroy {
  jsonData: any;
  map: any;
  firstPoint: any;
  geojson: any = {
    type: 'FeatureCollection',
    features: [],
  };
  pdfJSON: any = {
    roofs: [],
    obstacles: []
  };
  rawModules = []
  undo: any = [];
  redo: any = [];
  lengthLabels: RotatedLabel[] = [];
  finaljson: any = { roof: [] }
  houseEave: any = []
  roofLabelTextProperties: any;
  roofLabelValue: any;
  roofLabelFontSize: any;
  roofLabelTextColor: any = '#000000';
  boundaryLineColor: any;
  roofBoundaryPolylineThickness: any;
  roofBoundaryThicknessValue: any = 2;
  roofFacetLength: any;
  roofLabelArray: any = [];
  roofLinesArray: any = [];
  report_Id: string
  isloading: boolean = false;
  showev = true;
  isHighReduce: boolean = false;
  location = {
    latitude: null,
    longitude: null
  };
  activeInfoWindow: any = null;
  markers: google.maps.Marker[] = [];
  @Output() istabshow = new EventEmitter(false);
  @Input() tabclicksecondTime: boolean = false;
  @Output() mapInstance = new EventEmitter();
  @Output() showHomeBtn = new EventEmitter();

  constructor(private jsonService: CommonService,
    private changeDetector: ChangeDetectorRef,
    private plansetservice: PlanSetService,
    private equipmentService: EquipmentService,
    private toolService: ToolsService,
    private customTextService: CustomTextService,
    private objectService: ObjectService,
    private drawingService: AdditionalDrawingsService,
    private commonService: CommonService,
    private fenceService: FenceService) { }

  ngOnInit(): void {
    if (!this.tabclicksecondTime) {
      this.isloading = true
      this.plansetservice.getroofDrawingdata().subscribe((res: any) => {
        if (res.data) {
          this.report_Id = res.data[0]?.attributes?.reportid;
          this.refreshev();
        }
      })
    }
    else {
      this.hideev();
    }
  }

  refreshev() {
    this.jsonService.refresevtoken().subscribe(res => {
      localStorage.setItem("truedesigntoken", JSON.stringify(res))
      if (!this.tabclicksecondTime) {
        this.isloading = false;
        this.loadev();
      }
      else {
        this.hideev();
      }
    })
  }

  async hideev() {
    this.isloading = true;
    this.showev = false;
    this.isHighReduce = true;
    if (!this.tabclicksecondTime) {
      this.plansetservice.getJsonFromEV(this.report_Id).subscribe((res: any) => {
        if (res) {
          localStorage.removeItem("stringLayoutData");
          localStorage.removeItem("mapData");
          localStorage.removeItem("finalPdfJSON");
          // localStorage.removeItem("evJSON");
          localStorage.removeItem('JSONdata');
          this.jsonData = res.sourcefile;
          this.isloading = false;
          this.showHomeBtn.emit(true);
          this.istabshow.emit(true);
          this.location.latitude = res.sourcefile.location.latitude;
          this.location.longitude = res.sourcefile.location.longitude;
          this.changeDetector.detectChanges();
          // localStorage.setItem("evJSON", JSON.stringify(res.sourcefile))
          this.initializeMap(res.sourcefile);
          this.drawStructures(res.sourcefile.structures.roof.points, res.sourcefile.structures.roof.faces, res.sourcefile.structures.roof.lines, res.sourcefile);
          this.drawChart();
        }
      })
    }
    else {
      let data: any = await JSON.parse(localStorage.getItem("JSONdata"))
      if (data) {
        this.jsonData = data
        this.isloading = false;
        this.changeDetector.detectChanges();
        this.initializeMap(data);
        this.drawStructures(data.structures.roof.points, data.structures.roof.faces, data.structures.roof.lines, data);
        this.drawChart();
      }
    }
  }

  async initializeMap(data: any): Promise<void> {
    const center = new google.maps.LatLng(data.location.latitude, data.location.longitude);
    this.location.latitude = data.location.latitude;
    this.location.longitude = data.location.longitude;
    this.commonService.location.latitude = data.location.latitude;
    this.commonService.location.longitude = data.location.longitude;


    this.map = new google.maps.Map(document.getElementById("map")!, {
      center: center,
      zoom: 21,
      tilt: 0,
      heading: 0,
      fullscreenControl: false,
    });

    this.map.set("mapId", "90f87356969d889c");

    this.reDrawActions();
    this.mapInstance.emit(this.map);

    let localStorageData = await this.getLocalStorageData();
  }

  drawStructures(points: Point[], faces: Face[], lines: Line[], data: any): void {
    let eaveLinesArray = [];
    this.pdfJSON.location = data.location;
    const pointCoordinates: any = {};
    points.forEach((point: any) => {
      const coords = point.coords.split(",");
      pointCoordinates[point.id] = new google.maps.LatLng(parseFloat(coords[1]), parseFloat(coords[0]));
    });

    faces.forEach((face: any, index) => {
      const type = face.type;
      if (type != "WALL") {
        const lineJSON: any = []
        const path = face.polygon.path.split(",");

        path.map((lineId: any) => {
          const singleline: any = {};
          const matchingLine = lines.find((line) => line.id === lineId);
          if (matchingLine) {

            singleline.id = matchingLine.id;
            singleline.type = matchingLine.type;
            singleline.unit = "feet";
            singleline.isVisible = true;

            const startPoint = pointCoordinates[matchingLine.path.split(",")[0]];
            const endPoint = pointCoordinates[matchingLine.path.split(",")[1]];
            singleline.length = (google.maps.geometry.spherical.computeLength([startPoint, endPoint]) * 3.28084).toFixed(2);
            singleline.angle = google.maps.geometry.spherical.computeHeading(startPoint, endPoint);
            singleline.start = { lat: startPoint.lat(), lng: startPoint.lng() };
            singleline.end = { lat: endPoint.lat(), lng: endPoint.lng() };
            matchingLine.type === "EAVE" ? eaveLinesArray.push(singleline) : null;
            lineJSON.push(singleline);
          }
        })

        const reArrangeLineJSON = [lineJSON[0]];
        let lastElement = lineJSON[0];

        while (!(lineJSON.length == reArrangeLineJSON.length)) {
          for (let i = 1; i < lineJSON.length; i++) {
            const element = lineJSON[i];
            if (lastElement.end.lat === element.start.lat && lastElement.end.lng === element.start.lng) {
              reArrangeLineJSON.push(element);
              lastElement = element;
            }
            else if (lastElement.end.lat === element.end.lat && lastElement.end.lng === element.end.lng) {
              lastElement = { ...element, start: element.end, end: element.start };
              reArrangeLineJSON.push(lastElement);
            }
          }
        }


        if (type == "ROOF") {
          const roofPath = reArrangeLineJSON.map((line: { start: { lat: any; lng: any; }; }) => new google.maps.LatLng(line.start.lat, line.start.lng));

          const roofPolygon = new google.maps.Polygon({
            paths: roofPath,
            geodesic: true,
            strokeColor: "black",
            strokeOpacity: 0,
            strokeWeight: 0,
            fillColor: "orange",
            fillOpacity: 1,
            map: this.map,
            zIndex: -10,
          });
          roofPolygon.set("tsrf", face.TSRF)
          roofPolygon.set("id", `R${index + 1}`)

          const setbackPolygon = this.drawInnerPolygon(reArrangeLineJSON, roofPolygon)

          const setbackLineJSON: any = []
          for (let i = 0; i < setbackPolygon.length; i++) {
            const setbackObject: any = {};
            setbackObject.unit = "feet";
            const startPoint = setbackPolygon[i];
            const endPoint = setbackPolygon[i + 1] || setbackPolygon[0];
            setbackObject.length = (google.maps.geometry.spherical.computeLength([startPoint, endPoint]) * 3.28084).toFixed(2);
            setbackObject.angle = google.maps.geometry.spherical.computeHeading(startPoint, endPoint);;
            setbackObject.start = { lat: startPoint.lat(), lng: startPoint.lng() };
            setbackObject.end = { lat: endPoint.lat(), lng: endPoint.lng() };
            setbackObject.id = i + 1;

            setbackLineJSON.push(setbackObject);
          }

          this.pdfJSON.roofs.push({
            id: `R${index + 1}`,
            isVisible: true,
            designator: face.designator,
            orientation: face.polygon.orientation,
            pitchDeg: face.polygon.pitchDeg,
            pitch: face.polygon.pitch,
            size: face.polygon.size,
            unroundedsize: face.polygon.unroundedsize,
            lines: reArrangeLineJSON,
            modules: [],
            setbacks: setbackLineJSON
          })

        }
        if (type == "ROOFOBSTRUCTION") {
          this.pdfJSON.obstacles.push({
            id: `O${index + 1}`,
            isVisible: true,
            orientation: face.polygon.orientation,
            pitchDeg: face.polygon.pitchDeg,
            pitch: face.polygon.pitch,
            size: face.polygon.size,
            unroundedsize: face.polygon.unroundedsize,
            lines: reArrangeLineJSON,
          })

          const obstructionPath = reArrangeLineJSON.map((line: { start: { lat: any; lng: any; }; }) => new google.maps.LatLng(line.start.lat, line.start.lng));

          const obstructionPolygon = new google.maps.Polygon({
            paths: obstructionPath,
            geodesic: true,
            strokeColor: "white",
            strokeOpacity: 1,
            strokeWeight: 1,
            fillColor: "red",
            fillOpacity: 1,
            map: this.map,
            zIndex: -10,
          });
        }
      }
    });

    this.pdfJSON.setbacks = data.setbacks
    let allcoordinates = []
    lines.forEach((line: any, index) => {
      if (line.type != "OTHER") {
        const path = line.path.split(",");
        const decodedPath = path.map((pointId: any) => pointCoordinates[pointId]);
        allcoordinates.push(decodedPath)
        // Calculate the distance for this line
        const lineDistance = google.maps.geometry.spherical.computeLength(decodedPath);
        // Convert meters to feet if needed
        let lineDistanceFeet = (lineDistance * 3.28084).toFixed(2);
        let lineDistanceMeter = lineDistance.toFixed(2)

        let strokeColor = "grey";
        if (line.type === "RAKE") {
          strokeColor = "green";
        } else if (line.type === "RIDGE") {
          strokeColor = "red";
        } else if (line.type === "EAVE") {
          this.houseEave.push([{ lat: decodedPath[0].lat(), lng: decodedPath[0].lng() }, { lat: decodedPath[1].lat(), lng: decodedPath[1].lng() }])
          strokeColor = "blue";
        }

        // const polyline = new google.maps.Polyline({
        //   path: decodedPath,
        //   geodesic: true,
        //   strokeColor: strokeColor,
        //   strokeOpacity: 1.0,
        //   strokeWeight: 2,
        // });

        let polyline;
        let roofLineId = "roofLines_" + String(index);
        let localStorageData = JSON.parse(localStorage.getItem('mapData'));
        let existingRoofLines = localStorageData?.roofLines.find(d => d.id == roofLineId);

        if (existingRoofLines) {
          polyline = new google.maps.Polyline({
            path: existingRoofLines?.path,
            geodesic: true,
            strokeColor: existingRoofLines?.strokeColor,
            strokeOpacity: existingRoofLines?.strokeOpacity,
            strokeWeight: existingRoofLines?.strokeWeight,
          });
          polyline.set('id', existingRoofLines.id);
          if (!existingRoofLines.solid) {
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
            })
          }
          this.addEventListnerToRoofLines(polyline, 'existing');
          polyline.setMap(this.map);
        }
        else {
          polyline = new google.maps.Polyline({
            path: decodedPath,
            geodesic: true,
            strokeColor: strokeColor,
            strokeOpacity: 1.0,
            strokeWeight: 2,
          });
          polyline.set('id', roofLineId);
          this.addEventListnerToRoofLines(polyline, 'new');
          // this.saveDataToLocalStorage(polyline, 'roofLines');
          polyline.setMap(this.map);
        }
        var angle = google.maps.geometry.spherical.computeHeading(decodedPath[0], decodedPath[1]);
        (angle >= 0) ? angle = angle - 90 : angle = 90 + angle;

        const labelPosition = this.calculateMidpoint(decodedPath[0], decodedPath[1]);

        if (Number(lineDistanceFeet) >= 10) {
          const labelPosition = this.calculateMidpoint(decodedPath[0], decodedPath[1]);
          var label = new RotatedLabel(labelPosition, `${lineDistanceFeet} "`, angle, strokeColor);
          this.lengthLabels.push(label);
          let className = "roofLabel_" + String(index);
          if (line.type === "EAVE") {
            let lineDistanceFeetValue: number = Number(lineDistanceFeet);
            let lineDistanceFeetValueFormatted = `${Math.floor(lineDistanceFeetValue)}'-${Number(String(Math.floor((lineDistanceFeetValue - Math.floor(lineDistanceFeetValue)) * 100)).slice(0, 1))}"`;
            let marker;
            let localStorageData = JSON.parse(localStorage.getItem('mapData'));
            let existingRoofLabel = localStorageData?.roofLabel.find(d => d.label.className == className);
            if (existingRoofLabel) {
              marker = new google.maps.Marker({
                position: { lat: existingRoofLabel?.position.lat, lng: existingRoofLabel?.position.lng },
                draggable: true,
                label: {
                  text: existingRoofLabel?.label?.text,
                  className: existingRoofLabel?.label?.className,
                  fontSize: existingRoofLabel?.label?.fontSize,
                  color: existingRoofLabel?.label?.color
                },
                icon: {
                  url: "../../assets/transparent_img.png",
                  scaledSize: new google.maps.Size(50, 50),
                },
                crossOnDrag: false,
                map: this.map,
              });
              this.addListnerToRoofLabels(marker, 'existing', existingRoofLabel?.rotation);
            }
            else {
              marker = new google.maps.Marker({
                position: labelPosition,
                map: this.map,
                draggable: true,
                label: {
                  text: lineDistanceFeetValueFormatted,
                  className: className,
                  fontSize: '14px',
                  color: 'black'
                },
                icon: {
                  url: "../../assets/transparent_img.png",
                  scaledSize: new google.maps.Size(50, 50),
                },
                crossOnDrag: false,
              });
              this.addListnerToRoofLabels(marker, 'new', label?.angle);
              this.markers.push(marker);
            }
          }
        }
        let extractedData = decodedPath.map((item: any) => {
          return {
            "lat": item.lat(),
            "lng": item.lng(),
            "lineDistanceMeter": lineDistanceMeter,
            "angle": angle,
            "type": line.type

          };
        });

        let jsonData = (extractedData);
        this.finaljson["roof"].push(jsonData)
      }
    });
    this.centerizedMap(allcoordinates)
    this.equipmentService.eaveLinesArray = eaveLinesArray;
  }

  centerizedMap(allcoordinates: any[]): void {
    var minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;

    for (let i = 0; i < allcoordinates.length; i++) {
      for (let j = 0; j < allcoordinates[i].length; j++) {
        let lat = allcoordinates[i][j].lat();
        let lng = allcoordinates[i][j].lng();

        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
      }
    }

    // Calculate center
    let centerLat = (minLat + maxLat) / 2;
    let centerLng = (minLng + maxLng) / 2;

    this.map.setCenter({ lat: centerLat, lng: centerLng });

    const center = new google.maps.LatLng(centerLat, centerLng);

    const radiusInMeters = 50;
    const north = google.maps.geometry.spherical.computeOffset(center, radiusInMeters, 0).lat();
    const south = google.maps.geometry.spherical.computeOffset(center, radiusInMeters, 180).lat();
    const east = google.maps.geometry.spherical.computeOffset(center, radiusInMeters, 90).lng();
    const west = google.maps.geometry.spherical.computeOffset(center, radiusInMeters, -90).lng();

    const bounds = {
      north,
      south,
      east,
      west,
    };

    this.map.setOptions({
      restriction: {
        latLngBounds: bounds,
        strictBounds: true
      }
    })
  }

  drawInnerPolygon(arr, roof) {
    console.log(roof);
    try {
      let newPolygon: any = [];
      const newRoofPoints = [];
      // Draw Parallel line
      arr.forEach((el, index) => {
        let fireSetBack = Number((this.jsonData.setbacks[`${el.type}`] * 0.0254).toFixed(2))
        const lineAngle = google.maps.geometry.spherical.computeHeading(el.start, el.end);
        let isPointInsideRoof = false;
        // Calculate new points
        let startPoint = google.maps.geometry.spherical.computeOffset(el.start, fireSetBack || 0, isPointInsideRoof ? lineAngle - 90 : lineAngle + 90);
        let endPoint = google.maps.geometry.spherical.computeOffset(el.end, fireSetBack || 0, isPointInsideRoof ? lineAngle - 90 : lineAngle + 90);
        const midPoint = this.calculateMidPoint([startPoint, endPoint]);
        if (!google.maps.geometry.poly.containsLocation(midPoint, roof)) {
          startPoint = google.maps.geometry.spherical.computeOffset(el.start, fireSetBack || 0, lineAngle - 90);
          endPoint = google.maps.geometry.spherical.computeOffset(el.end, fireSetBack || 0, lineAngle - 90);
        }
        startPoint = google.maps.geometry.spherical.computeOffset(startPoint, -5, lineAngle);
        endPoint = google.maps.geometry.spherical.computeOffset(endPoint, 5, lineAngle);
        newRoofPoints.push([startPoint, endPoint]);
      });
      // Now find new intersection points
      arr.forEach((el, index) => {
        if (index === 0 || (index != (arr.length - 1))) {
          const intersectionPoint = this.findIntersectionPoint(newRoofPoints[index][0], newRoofPoints[index][1], newRoofPoints[index + 1]);
          newPolygon.push(intersectionPoint);
        } else {
          const intersectionPoint = this.findIntersectionPoint(newRoofPoints[index][0], newRoofPoints[index][1], newRoofPoints[0]);
          newPolygon.push(intersectionPoint);
        }
      });
      const tsrf = Number(roof.get("tsrf").toFixed(2))
      newPolygon = [newPolygon.splice(-1)[0], ...newPolygon];
      console.log(newPolygon);

      // Add New Polygon on map
      const updatedPolygon = new google.maps.Polygon({
        paths: newPolygon,
        map: this.map,
        fillColor: '#E1F5FE',
        fillOpacity: tsrf,
        strokeWeight: 1,
        zIndex: -8
      });

      return newPolygon
    }
    catch (e) {
      console.log(e)
    }
  }


  findIntersectionPoint(startPoint: any, endPoint: any, eaveLine: any) {
    const lat1 = startPoint.lat(), lng1 = startPoint.lng();
    const lat2 = endPoint.lat(), lng2 = endPoint.lng();
    const lat3 = eaveLine[0].lat(), lng3 = eaveLine[0].lng();
    const lat4 = eaveLine[1].lat(), lng4 = eaveLine[1].lng();
    const determinant = (lat1 - lat2) * (lng3 - lng4) - (lng1 - lng2) * (lat3 - lat4);
    if (determinant === 0) {
      // Lines are parallel, no intersection
      return null;
    }
    const intersectionX = ((lat1 * lng2 - lng1 * lat2) * (lat3 - lat4) - (lat1 - lat2) * (lat3 * lng4 - lng3 * lat4)) / determinant;
    const intersectionY = ((lat1 * lng2 - lng1 * lat2) * (lng3 - lng4) - (lng1 - lng2) * (lat3 * lng4 - lng3 * lat4)) / determinant;
    const isOnPolyline = google.maps.geometry.poly.isLocationOnEdge(
      new google.maps.LatLng({ lat: intersectionX, lng: intersectionY }),
      new google.maps.Polyline({ path: eaveLine }),
      1e-6
    );
    if (isOnPolyline) {
      return new google.maps.LatLng(intersectionX, intersectionY);
    }
    return null
  }

  calculateMidPoint(path: any = []) {
    let centerLat = 0;
    let centerLng = 0;
    // Loop on given path
    path.forEach((latLng: any) => {
      centerLat += latLng.lat();
      centerLng += latLng.lng();
    });
    centerLat /= path.length;
    centerLng /= path.length;
    const midPoint = new google.maps.LatLng(centerLat, centerLng);
    return midPoint;
  }


  convertCartesiantoLAtLng(originX: number, originY: number, deltaX: any, deltaY: any) {
    // console.log("pdfJSON2==============", this.pdfJSON.roofs[0])
    const EarthCircumference = 40074155.89;
    const x = deltaX;
    const y = deltaY;
    const fromLon = originX * Math.PI / 180;
    const fromLat = originY * Math.PI / 180;

    let div = EarthCircumference * Math.cos(fromLat);
    if (div == 0.0) {
      div = EarthCircumference;
    }

    const newLon = fromLon + (Math.PI * 2 * x) / div;
    const newLat = fromLat + (Math.PI * 2 * y) / EarthCircumference;

    const thereX = newLon * 180.0 / Math.PI;
    const thereY = newLat * 180.0 / Math.PI;
    return { x: thereX, y: thereY };
  }

  drawChart() {
    // Process the roof facet polygons
    const linesList: any = {};
    this.jsonData.structures.roof.lines.forEach((line: { id: string | number; uuid: any; path: string; type: any; }) => {
      linesList[line.id] = {
        uuid: line.uuid,
        path: line.path.split(','),
        type: line.type,
      };
    });

    const ptList: any = {};
    this.jsonData.structures.roof.points.forEach((point: { id: string | number; uuid: any; data: any; coords: string; }) => {
      ptList[point.id] = {
        uuid: point.uuid,
        data: point.data,
        coords: point.coords.split(',').map(parseFloat),
      };
      if (this.firstPoint === undefined) {
        this.firstPoint = ptList[point.id].coords;
      }
    });

    this.jsonData.panels.forEach((panel) => {
      const coordinates = [];
      panel.data.map(pt => {
        const ptCoord = this.convertCartesiantoLAtLng(this.firstPoint[0], this.firstPoint[1], pt.x.toFixed(16) * 0.3048, pt.y.toFixed(16) * 0.3048);
        coordinates.push([ptCoord.x, ptCoord.y]);
      });
      coordinates.push(coordinates[0]); // close polygon

      this.pdfJSON.roofs.map((roof: { designator: any; modules: any[]; }) => {
        let panelObject: any = {};
        // console.log("roof====", roof, panel.owningRoof)
        if (roof.designator === panel.owningRoof) {
          panelObject.orientation = panel.orientation
          panelObject.isVisible = true;
          let lineJSON: any = []
          for (let i = 0; i < coordinates.length - 1; i++) {
            lineJSON[i] = {
              id: i + 1,
              isVisible: true,
              length: (
                google.maps.geometry.spherical.computeLength(
                  new google.maps.MVCArray([
                    new google.maps.LatLng(coordinates[i][1], coordinates[i][0]),
                    new google.maps.LatLng(coordinates[i + 1][1], coordinates[i + 1][0])
                  ])
                ) * 3.28084
              ).toFixed(2),
              unit: 'feet',
              angle: google.maps.geometry.spherical.computeHeading(
                new google.maps.LatLng(coordinates[i][1], coordinates[i][0]),
                new google.maps.LatLng(coordinates[i + 1][1], coordinates[i + 1][0])
              ),
              start: { lat: coordinates[i][1], lng: coordinates[i][0] },
              end: { lat: coordinates[i + 1][1], lng: coordinates[i + 1][0] }
            };

          }
          panelObject.lines = lineJSON
          this.rawModules.push(panelObject)
          roof.modules.push(panelObject)

          const panelPath = lineJSON.map((line: { start: { lat: any; lng: any; }; }) => new google.maps.LatLng(line.start.lat, line.start.lng));
          const panelPolygon = new google.maps.Polygon({
            paths: panelPath,
            map: this.map,
            geodesic: true,
            strokeColor: "#FFA500",
            strokeOpacity: 1.0,
            strokeWeight: 2,
            fillColor: "#FFFA41",
            fillOpacity: 0.8,
            draggable: true,
            zIndex: 8
          });

        }
      }
      )
      // this.geojson.features.push(polygon);
    });

    if (this.map) {
      localStorage.setItem('JSONdata', JSON.stringify({ ...this.jsonData, modules: this.rawModules }));
      this.map.data.addGeoJson(this.geojson);
    }

    // this.map.data.setStyle((feature: { getProperty: (arg0: string) => string; }) => {
    //   let color = 'blue';
    //   if (feature.getProperty('type') == 'ROOF') {
    //     color = 'white';
    //   }
    //   if (feature.getProperty('type') == 'ROOFOBSTRUCTION') {
    //     color = 'red';
    //   }
    //   if (feature.getProperty('type') == 'ROOFPENETRATION') {
    //     color = 'green';
    //   }

    //   return {
    //     fillColor: color,
    //     fillOpacity: 0.5,
    //     strokeWeight: 1,
    //     strokeColor: 'white',
    //     zIndex: 10
    //   }
    // });

    this.map.data.addListener('click', function (event: any) {
      var feat = event.feature;
      var html = "<b>" + feat.getProperty('name') + "</b><br>" + feat.getProperty('type');
      html += "<br><p class='normal_link' >" + feat.getProperty('coordinates') + "</p>";
    });
  }

  rotatePoint(point: { lat: any; lng: any; }, origin: { lat: any; lng: any; }, angleRad: number) {
    var newX = Math.cos(angleRad) * (point.lng - origin.lng) - Math.sin(angleRad) * (point.lat - origin.lat) + origin.lng;
    var newY = Math.sin(angleRad) * (point.lng - origin.lng) + Math.cos(angleRad) * (point.lat - origin.lat) + origin.lat;
    return { lat: newY, lng: newX };
  }

  scalePolygon(polygonCoords: any[], scaleFactor: number, centerCoordinate: { lng: number; lat: number; }) {
    const scaledCoords = polygonCoords.map((coord: { lng: number; lat: number; }) => {
      const deltaX = coord.lng - centerCoordinate.lng;
      const deltaY = coord.lat - centerCoordinate.lat;
      const scaledX = centerCoordinate.lng + deltaX * scaleFactor;
      const scaledY = centerCoordinate.lat + deltaY * scaleFactor;
      return { lat: scaledY, lng: scaledX };
    });
    return scaledCoords;
  }

  calculateMidpoint(point1: any, point2: any): google.maps.LatLng {
    const lat = (point1.lat() + point2.lat()) / 2;
    const lng = (point1.lng() + point2.lng()) / 2;
    return new google.maps.LatLng(lat, lng);
  }

  private convertToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private addToUndo(drawing: google.maps.MVCObject[]): void {
    this.undo.push(new google.maps.MVCArray(drawing));
    this.redo = [];
  }

  handleUndo(): void {
    if (this.undo.length > 0) {
      this.redo.push(this.undo.pop());
      // Remove the drawing from the map
      this.redo[this.redo.length - 1].forEach((overlayArray: { setMap: (arg0: null) => void; forEach: (arg0: (item: any) => any) => void; }) => {
        overlayArray.setMap(null);
        if (Array.isArray(overlayArray)) {
          overlayArray.forEach((item) => item.setMap(null));
        } else {
          overlayArray.setMap(null);
        }
      });
    }
  }

  handleRedo(): void {
    if (this.redo.length > 0) {
      this.undo.push(this.redo.pop());
      // Add the drawing back to the map
      this.undo[this.undo.length - 1].forEach((overlayArray: { forEach: (arg0: (item: any) => any) => void; setMap: (arg0: any) => void; }) => {
        if (Array.isArray(overlayArray)) {
          overlayArray.forEach((item) => item.setMap(this.map));
        } else {
          overlayArray.setMap(this.map);
        }
      });
    }
  }

  private loadev() {
    const fileLink = "https://solar-ui.eagleview.com/";
    let that = this;
    fetch(fileLink + '/asset-manifest.json').then(async (data) => {
      const assets = await data.json();
      if (assets) {
        let create = (info: string) => {
          return new Promise(function (resolve, reject) {
            if (info.includes('.js')) {
              var script = document.createElement('script');
              script.type = 'text/javascript';
              script.async = false;
              script.src = fileLink + '/' + info;
              script.onload = () => {
                resolve(info);
              };
              script.onerror = () => {
                reject(info);
              };
              document.body.appendChild(script);
            }
          });
        }

        let promiseData: Promise<string>[] = [];
        assets.entrypoints.forEach(function (info: string) {
          if (info.includes('.js')) {
            promiseData.push(create(info) as Promise<string>);
          } else {
            let head = document.getElementsByTagName('head')[0];
            let link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.media = 'all';
            link.href = fileLink + '/' + info;
            head.appendChild(link);
          }
        });

        Promise.all(promiseData).then(function () {
          const truedesign = document.createElement("truedesign-editor") as any;
          truedesign.id = 'testTdDiv'
          truedesign.reportId = that.report_Id
          truedesign.isOverlay = "true"
          const element = document.getElementById("td-app");
          if (element) {
            element.appendChild(truedesign);
          } else {
            console.error("Element with ID 'web-app' not found.");
          }
        }).catch(function (data) {
        });
      }
    });
    this.isloading = false;
  }

  closeOpenedInfoWindow() {
    this.activeInfoWindow = null;
  }

  saveDataToLocalStorage(data: any, type: string, inititalAngle?: any) {
    let mapData = {
      roofLabel: this.roofLabelArray,
      roofLines: this.roofLinesArray,
    };
    if (type == 'roofLabel') {
      this.roofLabelArray.push({
        icons: data.icon,
        label: data.label,
        position: data.position,
        rotation: inititalAngle
      });
      mapData.roofLabel = this.roofLabelArray;
    }
    if (type == 'roofLines') {
      const path = data.getPath().getArray();
      this.roofLinesArray.push({
        path: path,
        strokeColor: data.strokeColor,
        strokeWeight: data.strokeWeight,
        id: data.id,
        solid: true,
        editable: true
      });
      mapData.roofLines = this.roofLinesArray;
    }
    localStorage.setItem('mapData', JSON.stringify(mapData));
  }

  getRoofFacetLength(polyline: any) {
    const path = polyline.getPath();
    // Calculate the length of the polyline
    const lengthInMeters = google.maps.geometry.spherical.computeLength(path);
    // Convert length to feet
    const lengthInFeet = lengthInMeters * 3.28084;
    const inches = (lengthInFeet % 1) * 10;
    this.roofFacetLength = {
      feet: Math.floor(lengthInFeet),
      inches: Math.round(inches)
    }
  }

  getLocalStorageData(): any {
    return new Promise((resolve, reject) => {
      let localStorageData = JSON.parse(localStorage.getItem('mapData'));
      if (localStorageData) {
        resolve(localStorageData);
      }
      else {
        // reject('Error !!!');
      }
    })
  }

  addListnerToRoofLabels(marker: any, type: string, initialAngle?: any) {
    // if (type == 'existing') {
    //   setTimeout(() => {
    //     let currentLabelClass = document.getElementsByClassName(marker?.label?.className) as any;
    //     currentLabelClass[0].style.transform = `rotate(${initialAngle}deg)`;
    //   }, 2000);
    // }
    marker.addListener('dragend', () => {
      // this.saveRoofLablesData(marker, 'position');
    })

    marker.addListener('click', (event: any) => {
      this.openInfoWindow("roofLabel");
      this.roofLabelTextProperties = marker.getLabel();
      this.roofLabelValue = this.roofLabelTextProperties.text;
      if (this.roofLabelTextProperties.fontSize) {
        this.roofLabelFontSize = this.roofLabelTextProperties.fontSize;
      }
      if (this.roofLabelTextProperties.color) {
        this.roofLabelTextColor = this.roofLabelTextProperties.color;
      }
      else {
        this.roofLabelTextColor = "#000000"
      }

      setTimeout(() => {
        const handleSliderChange = (args: any) => {
          const currentSliderValue = args.value;
          let currentLabelClass = document.getElementsByClassName(marker?.label?.className) as any;
          currentLabelClass[0].style.transform = `rotate(${currentSliderValue}deg)`;
          let localStorageData = localStorage.getItem('mapData');
          let parsedData = JSON.parse(localStorageData);
          this.roofLabelArray = this.roofLabelArray.map(item => {
            if (item?.label?.className == marker?.label?.className) {
              item.rotation = args.value;
            }
            return item;
          })
          if (parsedData.roofLabel) {
            parsedData.roofLabel = this.roofLabelArray;
            localStorage.setItem('mapData', JSON.stringify(parsedData));
          }
        };
        const sliderElement: any = $("#slider1");
        sliderElement.roundSlider({
          value: initialAngle,
          min: -180,
          max: 180,
          radius: 70,
          drag: handleSliderChange,
          change: handleSliderChange,
        });

        const inputLabelText = document.getElementById('inputLabelText') as HTMLInputElement;
        const removeRoofLabel = document.getElementById('removeRoofLabel') as HTMLInputElement;
        const inputRoofLabelFontSize = document.getElementById('inputRoofLabelFontSize') as HTMLInputElement;
        const roofLabelFontSliderValue = document.getElementById('roofLabelFontSliderValue');
        const roofLabelColorPicker = document.getElementById('roofLabelColorPicker') as HTMLInputElement;

        // To change the font-size
        if (inputRoofLabelFontSize && roofLabelFontSliderValue) {
          inputRoofLabelFontSize.addEventListener('input', () => {
            const newSize = Number(inputRoofLabelFontSize.value);
            if (marker) {
              const label = marker.getLabel() as google.maps.MarkerLabel;

              if (label) {
                label.fontSize = `${newSize + 'px'}`; // Set your desired font size
                marker.setLabel(label);
              }
            }
            // Update the value in the span
            roofLabelFontSliderValue.innerText = newSize.toString();
            // this.saveRoofLablesData(marker, 'fontSize');
          });
        }

        if (roofLabelColorPicker) {
          roofLabelColorPicker.addEventListener('input', () => {
            const newColor = roofLabelColorPicker.value;
            const label = marker.getLabel() as google.maps.MarkerLabel;
            if (label) {
              label.color = newColor; // Set the label text color
              marker.setLabel(label);
            }
            // this.saveRoofLablesData(marker, 'color');
          });
        }

        // To change the text value
        if (inputLabelText) {
          inputLabelText.addEventListener('input', () => {
            // Get the input value
            let newText = inputLabelText.value;
            if (marker) {
              const label = marker.getLabel() as google.maps.MarkerLabel;
              if (label) {
                label.text = newText; // Set the label text
                if (newText === '') {
                  // If the input text is empty, hide the label
                  newText = 'Label Value Cannot Be Empty'
                  label.text = newText; // Set the label text
                  marker.setLabel(label);
                } else {
                  // If there is text, show the label with the new text
                  marker.setLabel(label);
                }
              }
            }
            // this.saveRoofLablesData(marker, 'text');
          });
        }

        // removeRoofLabel.addEventListener('click', () => {
        //   let localStorageData = localStorage.getItem('mapData');
        //   if (localStorageData) {
        //     let parsedData = JSON.parse(localStorageData);
        //     parsedData.roofLabel = parsedData.roofLabel.filter((item: any) => item?.label?.className !== marker?.label?.className);
        //     localStorage.setItem('mapData', JSON.stringify(parsedData));
        //     this.roofLabelArray = this.roofLabelArray.filter((item: any) => item?.label?.className !== marker?.label?.className);
        //     marker.setMap(null); // Remove the tree from the map
        //     this.showRoofLabelInfoWindow = false;
        //   }
        // })
      }, 500);
    });
  }

  saveRoofLablesData(marker: any, type: string, rotationDegree?: any) {
    let localStorageData = localStorage.getItem('mapData');
    let parsedData = JSON.parse(localStorageData);
    // Update the array based on the condition
    this.roofLabelArray = this.roofLabelArray.map(item => {
      // Check if the condition is met
      if (item?.label?.className == marker?.label?.className) {
        if (type == 'text') {
          item.label.text = marker?.label?.text
        }
        else if (type == 'color') {
          item.label.color = marker?.label?.color
        }
        else if (type == 'fontSize') {
          item.label.fontSize = marker?.label?.fontSize
        }
        else if (type == 'position') {
          item.position = marker?.position;
        }
        else if (type == 'rotation') {
          item.rotation = rotationDegree;
        }
      }
      return item;
    });
    if (parsedData.roofLabel) {
      parsedData.roofLabel = this.roofLabelArray;
      localStorage.setItem('mapData', JSON.stringify(parsedData));
    }
  }

  addEventListnerToRoofLines(polyline: any, type: string) {
    polyline.addListener("click", (event: any) => {
      this.openInfoWindow("roofBoundaryLine");
      if (polyline) {
        this.boundaryLineColor = (polyline as any).strokeColor;
        this.roofBoundaryThicknessValue = (polyline as any).strokeWeight;
        this.roofBoundaryPolylineThickness = (polyline as any).strokeWeight;
        this.getRoofFacetLength(polyline);
      }
      setTimeout(() => {
        let boundaryLineColorPicker = document.getElementById('boundaryLineColorPicker') as any;
        let polylineDashed = document.getElementById('boundaryPolylineDashed') as any;
        let polylineSolid = document.getElementById('boundaryPolylineSolid') as any;
        let roofBoundaryPolylineThickness = document.getElementById('roofBoundaryPolylineThickness') as any;
        let roofBoundaryThicknessValue = document.getElementById('roofBoundaryThicknessValue') as any;
        let removeRoofFacetLine = document.getElementById('removeRoofFacetLine') as HTMLElement;
        boundaryLineColorPicker.addEventListener('input', () => {
          this.boundaryLineColor = boundaryLineColorPicker.value;
        })
        if (boundaryLineColorPicker) {
          boundaryLineColorPicker.addEventListener('input', () => {
            const newColor = boundaryLineColorPicker.value;
            polyline.setOptions({
              strokeColor: newColor
            });
            // this.saveRoofLinesData(polyline, 'strokeColor');
          });
        }
        polylineDashed.addEventListener('click', () => {
          if (polylineDashed) {
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
            })
            // this.saveRoofLinesData(polyline, 'dashed');
          }
        })
        polylineSolid.addEventListener('click', () => {
          if (polylineSolid) {
            polyline.setOptions({
              strokeOpacity: 1,
              icons: [] // Remove the icons property to make it a solid line
            });
            // this.saveRoofLinesData(polyline, 'solid');
          }
        })
        if (roofBoundaryPolylineThickness && roofBoundaryThicknessValue) {
          roofBoundaryPolylineThickness.addEventListener('input', () => {
            const newSize = Number(roofBoundaryPolylineThickness.value);
            polyline.setOptions({
              strokeWeight: newSize, // Change the value to the desired thickness
            });
            if (roofBoundaryThicknessValue) {
              roofBoundaryThicknessValue.innerText = newSize.toString();
            }
            // this.saveRoofLinesData(polyline, 'strokeWeight');
          });
        }
        // if (removeRoofFacetLine) {
        //   removeRoofFacetLine.addEventListener('click', () => {
        //     polyline.setMap(null); // Remove the marker
        //     this.showPolylineInfoWindow = false;
        //   })
        // }
      }, 1000);
    });
  }

  saveRoofLinesData(polyline: any, type: string) {
    let localStorageData = localStorage.getItem('mapData');
    let parsedData = JSON.parse(localStorageData);
    // Update the array based on the condition
    this.roofLinesArray = this.roofLinesArray.map(item => {
      // Check if the condition is met
      if (item?.id == polyline?.id) {
        if (type == 'strokeColor') {
          item.strokeColor = polyline?.strokeColor;
        }
        else if (type == 'strokeWeight') {
          item.strokeWeight = polyline?.strokeWeight;
        }
        else if (type == 'fillColor') {
          item.fillColor = polyline?.fillColor;
        }
        else if (type == 'fillOpacity') {
          item.fillOpacity = polyline?.fillOpacity;
        }
        else if (type == 'dashed') {
          item.solid = false;
        }
        else if (type == 'solid') {
          item.solid = true;
        }
        else if (type == 'position') {
          const path = polyline.getPath().getArray();
          item.path = path;
        }
      }
      return item;
    });
    if (parsedData.roofLines) {
      parsedData.roofLines = this.roofLinesArray;
      localStorage.setItem('mapData', JSON.stringify(parsedData));
    }
  }
  submitSitePlanData() {
    let mapData = JSON.parse(localStorage.getItem('mapData'));
    let propertylineExist = this.toolService.toolDataArray.filter((element) => element.toolType === 'propertyline');
    if (propertylineExist[0]) {
      let propertylineData = this.toolService.createPDFDimensions(propertylineExist[0]);
      this.pdfJSON.propertyline = propertylineData.propertyline;
      this.pdfJSON.pdfDimension = propertylineData.pdfDimension;
      if (mapData) {
        delete mapData.roofLabel;
        delete mapData.roofLines;
      }

      let finalPdfJSON = {
        sitePlan: { ...this.pdfJSON, ...mapData }
      }
      localStorage.setItem("finalPdfJSON", JSON.stringify(finalPdfJSON));
    }
  }

  openInfoWindow(currentWindow: string) {
    if (this.activeInfoWindow !== null || this.activeInfoWindow === null) {
      this.activeInfoWindow = null;
      setTimeout(() => {
        this.activeInfoWindow = currentWindow;
      }, 300);
    }
  }

  reDrawActions() {
    if (this.customTextService.customTextArray.length > 0) {
      this.customTextService.reDrawCustomText(this.map, this.map.getCenter(), "Site Plan");
    }
    if (this.equipmentService.equipmentsArray.length > 0) {
      this.equipmentService.reDrawEquipments(this.map, this.map.getCenter(), "Site Plan");
    }
    if (this.toolService.toolDataArray.length > 0) {
      this.toolService.reDrawTool(this.map, "Site Plan");
    }
    if (this.objectService.treeArray.length > 0) {
      this.objectService.reDrawTree(this.map,this.map.getCenter());
    }
    if (this.drawingService.chimneyArray.length > 0) {
      this.drawingService.reDrawChimney(this.map, this.map.getCenter(), "Site Plan");
    }
    if (this.fenceService.fencingArray.length > 0) {
      this.fenceService.reDrawFence(this.map);
    }
    this.map.setHeading(this.toolService.accumulatedAmount);
  }

  ngOnDestroy() {
    this.submitSitePlanData();
  }
}
class RotatedLabel extends google.maps.OverlayView {
  private map: google.maps.Map | null = null;
  private position: google.maps.LatLng | null = null;
  public text: string = '';
  public angle: number = 0;
  private color: string = '';
  private div: HTMLDivElement | null = null;
  private isEditing: boolean = false;
  private input: HTMLInputElement | null = null;
  private zIndex: number = 100;

  constructor(position: google.maps.LatLng, text: string, angle: number, color: string) {
    super();
    this.position = position;
    this.text = text;
    this.angle = angle;
    this.color = color;
  }

  // Add a method to get the current label text
  getLabelText(): string {
    return this.text;
  }

  // Add a method to set a new label text
  setLabelText(newText: string): void {
    this.text = newText;
    if (this.div) {
      this.div.innerHTML = newText;
    }
  }

  updateLabel(newText: string): void {
    this.setLabelText(newText);
    this.draw();
  }

  override onAdd(): void {
    const div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.transform = `rotate(${this.angle}deg)`;
    div.innerHTML = this.text;
    div.style.zIndex = this.zIndex.toString();
    div.style.color = this.color;
    this.div = div;

    div.addEventListener('click', () => {
      this.startEditing();
    });

    const panes = this.getPanes();
    if (panes) {
      panes.overlayLayer.appendChild(div);
    }
  }

  override draw(): void {
    if (!this.map || !this.position || !this.div) return;

    const overlayProjection = this.getProjection();
    if (!overlayProjection) return;

    const position = overlayProjection.fromLatLngToDivPixel(this.position);
    const div = this.div;

    const zoomLevel = this.map.getZoom?.();

    if (zoomLevel !== undefined) {
      if (zoomLevel >= 20) {
        div.style.display = 'block';
      } else {
        div.style.display = 'none';
      }
    }

    div.style.left = position.x + 'px';
    div.style.top = (position.y + 1) + 'px';

  }

  override onRemove(): void {
    if (this.div && this.div.parentNode) {
      this.div.parentNode.removeChild(this.div);
    }
  }

  startEditing(): void {
    if (!this.isEditing) {
      this.isEditing = true;

      const input = document.createElement('input');
      input.type = 'text';
      input.value = this.text;
      input.addEventListener('blur', this.endEditing.bind(this));
      this.input = input;
      this.div?.appendChild(input);

      this.div?.classList.add('hidden');
    }
  }

  endEditing(): void {
    if (this.isEditing && this.input) {
      this.isEditing = false;

      const newText = this.input.value;
      this.updateLabel(newText);
      this.div?.classList.remove('hidden');

      this.div?.removeChild(this.input);
      this.input = null;
    }
  }

}
