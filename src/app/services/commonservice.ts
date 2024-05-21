import { Injectable, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { AdditionalDrawingsService } from '../services/additional-drawings.service';
import { CustomTextService } from '../services/custom-text.service';
import { FenceService } from '../services/fence.service';
import { RoofSlopeService } from '../services/roof-slope.service';
import { EquipmentService } from '../services/equipment.service';
import { ToolsService } from '../services/tools.service';
import { ObjectService } from '../services/object.service';
import { MapCompassComponent } from '../share/map-compass/map-compass.component';
import { PlanSetService } from '../services/plansetservice';
import { ToasterService } from '../services/notify.service';

@Injectable({
  providedIn: 'root',
})
export class CommonService {
  private baseUrl: string = 'https://solar.googleapis.com/v1/buildingInsights:findClosest';
  private apiKey: string = 'AIzaSyBtAu0FYEZHPS0gdp6p2-_McBeu9zzHaPk';
  private dataSubject = new BehaviorSubject<any>(null);
  private dxfDataSubject = new BehaviorSubject<any>(null);
  public data$: Observable<any> = this.dataSubject.asObservable();
  public dxfData$: Observable<any> = this.dxfDataSubject.asObservable();
  roofMarkingData: any = {};
  roofLine = { strokeColor: 'black', size: 2, fillColor: '#FF9393', strokeWeight: 2 };
  @ViewChild(MapCompassComponent) mapCompassComponent: MapCompassComponent;

  constructor(
    private http: HttpClient,
    private toolService: ToolsService,
    private drawingService: AdditionalDrawingsService,
    private customTextService: CustomTextService,
    // private fenceService: FenceService,
    private roofSlopeService: RoofSlopeService,
    private equipmentService: EquipmentService,
    private objectService: ObjectService,
    private plansetService: PlanSetService,
    private toasterService: ToasterService
  ) { }
  currentTabIndex = new Subject<google.maps.Map>();
  location = {
    latitude: null,
    longitude: null
  };
  defaultTimeOut: number = 1000;
  // Module dimensions variable
  moduleHegiht: number = 0;
  modulewidth: number = 0;
  gap: number = 0;
  map: google.maps.Map;
  obstaclesArray: any[];

  getJSONData(): Observable<any> {
    return this.http.get('/assets/SolarDesign-56339297.json');
  }
  refresevtoken() {
    let authorizationData = 'Basic ' + btoa("0oaoqjyh8nl0NwRsA2p7" + ':' + "utPqHp1wwQ1-ny_ZnnkfPorM5MKRL9hSIm0nIFIWrpie_CldAhiv8IRoum-zQmtl");
    let options = {
      headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': authorizationData })
    };
    let body = new URLSearchParams();
    body.set('grant_type', "refresh_token");
    body.set('refresh_token', "8In78pBev6yGKxiaOZfyk9K8T_SbXGcrSPV5JdgDQgc");

    return this.http.post("https://apicenter.eagleview.com/oauth2/v1/token", body.toString(), options);
  }

  buildingInsightRequest(location: any) {
    const requestUrl = `?location.latitude=${location.latitude}&location.longitude=${location.longitude}&requiredQuality=HIGH&key=${this.apiKey}`;
    console.log('api url', `${this.baseUrl}${requestUrl}`);
    return this.http.get<any>(`${this.baseUrl}${requestUrl}`);
  }

  sendData(data: any) {
    this.dataSubject.next(data);
  }

  draft
  setCurrentTab(data) {
    this.currentTabIndex.next(data);
  }

  getCurrentTab() {
    return this.currentTabIndex.asObservable();

  }
  sendDxfData(data: any) {
    this.dxfDataSubject.next(data);
    //dxf_draft
  }

  initializeMap(mapDivId): any {
    let center = new google.maps.LatLng(27.704605195834535, -97.41101413311408);
    const localStorageData = localStorage.getItem('permitdata');
    if (localStorageData) {
      const parseData = JSON.parse(localStorageData);
      if (parseData.lat && parseData.lng) {
        center = new google.maps.LatLng(parseData.lat, parseData.lng);
      }
    }
    // Initializing Map
    return new google.maps.Map(document.getElementById(mapDivId)!, {
      center: center,
      zoom: 21,
      tilt: 0,
      heading: 0,
      disableDoubleClickZoom: true,
    });
  }

  reDrawRoofMarkingData(map: google.maps.Map) {
    // Draw Roof and inner roof
    this.roofMarkingData?.roofPolygon?.forEach((roof: google.maps.Polygon) => {
      roof?.setOptions({
        map: map,
        strokeWeight: this.roofLine.strokeWeight,
        editable: false,
        fillColor: this.roofLine.fillColor,
        strokeColor: this.roofLine.strokeColor
      });
      // Re draw Inner polygon
      roof['innerPolygon']?.setMap(map);
      // checking the area of inner polygon
      const area = google.maps.geometry.spherical.computeArea(roof['innerPolygon']?.getPath().getArray());
      if (area < 4) {
        roof['innerPolygon']?.setMap(null);
      }
    });
    // Re draw Obstacles
    this.roofMarkingData?.obstacles?.forEach((obstacle) => {
      obstacle.setMap(map);
    });
    // Re draw all roof Lines
    this.roofMarkingData?.roofLines?.forEach((line) => {
      line.polyline?.setMap(map);
    })
  }

  calculateBoundingBox(allEaveLines, gap, map) {
    const bounds = new google.maps.LatLngBounds();
    for (const point of allEaveLines) {
      bounds.extend(point.start);
      bounds.extend(point.end);
    }
    // get diagonal lines
    const diagonalLineLength = google.maps.geometry.spherical.computeLength([bounds.getSouthWest(), bounds.getNorthEast()]);
    const diagonalLineAngle = google.maps.geometry.spherical.computeHeading(bounds.getSouthWest(), bounds.getNorthEast());

    const line1Path = [bounds.getSouthWest(), new google.maps.LatLng(bounds.getSouthWest().lat(), bounds.getNorthEast().lng())];
    const line1Length = google.maps.geometry.spherical.computeLength(line1Path);
    const line1Angle = google.maps.geometry.spherical.computeHeading(line1Path[0], line1Path[1]);

    const line2Path = [bounds.getSouthWest(), new google.maps.LatLng(bounds.getNorthEast().lat(), bounds.getSouthWest().lng())];
    const line2Length = google.maps.geometry.spherical.computeLength(line1Path);
    const line2Angle = google.maps.geometry.spherical.computeHeading(line2Path[0], line2Path[1]);
    const hatchedLineGap = gap;
    // Loop on lines
    for (let i = 0; i < Math.ceil(line1Length / hatchedLineGap); i++) {
      const point1 = google.maps.geometry.spherical.computeOffset(line1Path[0], i * hatchedLineGap, line1Angle);
      const point2 = google.maps.geometry.spherical.computeOffset(point1, diagonalLineLength, diagonalLineAngle);
      // get intersection
      // const intersectionPoints = this.lineIntersection(point1, point2, allEaveLines, map);
    }

    for (let i = 0; i < Math.ceil(line2Length / hatchedLineGap); i++) {
      const point1 = google.maps.geometry.spherical.computeOffset(line2Path[0], i * hatchedLineGap, line2Angle);
      const point2 = google.maps.geometry.spherical.computeOffset(point1, diagonalLineLength, diagonalLineAngle);
      // Get Intersection
      // const intersectionPoints = this.lineIntersection(point1, point2, allEaveLines, map);
    }
  }

  lineIntersection(startPoint, endPoint, eaveLine) {
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
    return null;
  }

  findAllIntersectionPoints(startPoint: google.maps.LatLng, endPoint: google.maps.LatLng, roofLines: any[]) {
    const intersectionPoints = [];
    const lat1 = startPoint.lat(), lng1 = startPoint.lng();
    const lat2 = endPoint.lat(), lng2 = endPoint.lng();
    roofLines.forEach((point) => {
      const lat3 = point.start.lat(), lng3 = point.start.lng();
      const lat4 = point.end.lat(), lng4 = point.end.lng();
      // Find determinant
      const determinant = (lat1 - lat2) * (lng3 - lng4) - (lng1 - lng2) * (lat3 - lat4);

      if (determinant !== 0) {
        const intersectionX = ((lat1 * lng2 - lng1 * lat2) * (lat3 - lat4) - (lat1 - lat2) * (lat3 * lng4 - lng3 * lat4)) / determinant;
        const intersectionY = ((lat1 * lng2 - lng1 * lat2) * (lng3 - lng4) - (lng1 - lng2) * (lat3 * lng4 - lng3 * lat4)) / determinant;
        const isOnPolyline = google.maps.geometry.poly.isLocationOnEdge(
          new google.maps.LatLng({ lat: intersectionX, lng: intersectionY }),
          new google.maps.Polyline({ path: [point.start, point.end] }),
          1e-6
        );
        if (isOnPolyline) {
          const marker = new google.maps.Marker({
            position: { lat: intersectionX, lng: intersectionY },
            // map: this.map
          });
          intersectionPoints.push(new google.maps.LatLng(intersectionX, intersectionY));
        }
      }
    });
    return intersectionPoints;
  }

  drawHatchedLine(intersectionPoints: google.maps.LatLng[], map) {
    const hatchedLine = new google.maps.Polyline({
      path: intersectionPoints,
      map: map,
      strokeColor: "brown",
      clickable: false,
      zIndex: -48,
    });
    hatchedLine.setOptions({
      strokeOpacity: 0,
      icons: [{
        icon: {
          path: 'M 0,-1 0,1',
          strokeOpacity: 0.7,
          scale: 2,
        },
        offset: '0',
        repeat: '10px',
      }],
    });
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

  metersToFeetAndInches(meters: any) {
    // 1 meter = 3.28084 feet
    const feet = meters * 3.28084;
    // 1 foot = 12 inches
    const inches = (feet % 1) * 12;
    return {
      feet: Math.floor(feet),
      inches: Math.round(inches)
    }
  }

  inchestometer(inches: any) {
    inches = Number(inches);
    return inches / 39.370;
  }

  getInnerPolygonPoints(arr, roof) {
    let newPolygon: any = [];
    const newRoofPoints = [];
    // Draw Parallel line
    arr.forEach((el, index) => {
      const lineAngle = google.maps.geometry.spherical.computeHeading(el.start, el.end);
      let isPointInsideRoof = false;
      // Calculate new points
      let startPoint = google.maps.geometry.spherical.computeOffset(el.start, el.fireSetBack, isPointInsideRoof ? lineAngle - 90 : lineAngle + 90);
      let endPoint = google.maps.geometry.spherical.computeOffset(el.end, el.fireSetBack, isPointInsideRoof ? lineAngle - 90 : lineAngle + 90);
      const midPoint = this.calculateMidPoint([startPoint, endPoint]);
      if (!google.maps.geometry.poly.containsLocation(midPoint, roof)) {
        startPoint = google.maps.geometry.spherical.computeOffset(el.start, el.fireSetBack, lineAngle - 90);
        endPoint = google.maps.geometry.spherical.computeOffset(el.end, el.fireSetBack, lineAngle - 90);
      }
      startPoint = google.maps.geometry.spherical.computeOffset(startPoint, -5, lineAngle);
      endPoint = google.maps.geometry.spherical.computeOffset(endPoint, 5, lineAngle);
      newRoofPoints.push([startPoint, endPoint]);
    });
    // Now find new intersection points
    arr.forEach((el, index) => {
      if (index === 0 || index != (arr.length - 1)) {
        const intersectionPoint = this.lineIntersection(newRoofPoints[index][0], newRoofPoints[index][1], newRoofPoints[index + 1]);
        newPolygon.push(intersectionPoint);
      } else {
        const intersectionPoint = this.lineIntersection(newRoofPoints[index][0], newRoofPoints[index][1], newRoofPoints[0]);
        newPolygon.push(intersectionPoint);
      }
    });
    newPolygon = [newPolygon.splice(-1)[0], ...newPolygon];
    // return polygon points
    return newPolygon;
  }

  getOuterPolygonPoints(arr, roof) {
    let newPolygon: any = [];
    const newRoofPoints = [];
    // Draw Parallel line
    arr.forEach((el, index) => {
      const lineAngle = google.maps.geometry.spherical.computeHeading(el.start, el.end);
      let isPointInsideRoof = false;
      // Calculate new points
      let startPoint = google.maps.geometry.spherical.computeOffset(el.start, el.fireSetBack, isPointInsideRoof ? lineAngle - 90 : lineAngle - 90);
      let endPoint = google.maps.geometry.spherical.computeOffset(el.end, el.fireSetBack, isPointInsideRoof ? lineAngle - 90 : lineAngle - 90);
      const midPoint = this.calculateMidPoint([startPoint, endPoint]);
      if (google.maps.geometry.poly.containsLocation(midPoint, roof)) {
        startPoint = google.maps.geometry.spherical.computeOffset(el.start, el.fireSetBack, lineAngle + 90);
        endPoint = google.maps.geometry.spherical.computeOffset(el.end, el.fireSetBack, lineAngle + 90);
      }
      startPoint = google.maps.geometry.spherical.computeOffset(startPoint, -5, lineAngle);
      endPoint = google.maps.geometry.spherical.computeOffset(endPoint, 5, lineAngle);
      newRoofPoints.push([startPoint, endPoint]);
    });
    // Now find new intersection points
    arr.forEach((el, index) => {
      if (index === 0 || index != (arr.length - 1)) {
        const intersectionPoint = this.lineIntersection(newRoofPoints[index][0], newRoofPoints[index][1], newRoofPoints[index + 1]);
        newPolygon.push(intersectionPoint);
      } else {
        const intersectionPoint = this.lineIntersection(newRoofPoints[index][0], newRoofPoints[index][1], newRoofPoints[0]);
        newPolygon.push(intersectionPoint);
      }
    });
    newPolygon = [newPolygon.splice(-1)[0], ...newPolygon];
    // return polygon points
    return newPolygon;
  }

  getMapCenter() {
    let mapCenter;
    const propertylinePath = this.toolService.propertylineData.map((line) => new google.maps.LatLng(line.start.lat, line.start.lng));
    const bounds = new google.maps.LatLngBounds();
    propertylinePath.forEach((latLng: google.maps.LatLng | google.maps.LatLngLiteral) => {
      bounds.extend(latLng);
    });
    mapCenter = bounds.getCenter();
    return mapCenter;
  }

  feetToMeters(feet) {
    // 1 foot is equal to 0.3048 meters
    var meters = feet * 0.3048;
    return meters;
  }

  calculatePolylineTotalLength(polyline: any) {
    const path = polyline.getPath();
    let totalLength = 0;
    for (let i = 1; i < path.getLength(); i++) {
      const prevPoint = path.getAt(i - 1);
      const currentPoint = path.getAt(i);
      // Calculate the length of the current segment
      const length = google.maps.geometry.spherical.computeLength(new google.maps.MVCArray([prevPoint, currentPoint]));
      // Add the length of the current segment to the total length
      totalLength += length;
    }
    this.metersToFeetAndInches(totalLength.toFixed(2));
  }


  // Code For Future References -->

  // metersToFeetAndInches(meters: any) {
  //   // 1 meter = 3.28084 feet
  //   const feet = meters * 3.28084;
  //   // 1 foot = 12 inches
  //   const inches = (feet % 1) * 12;
  //   this.polylineLength = {
  //     feet: Math.floor(feet),
  //     inches: Math.round(inches)
  //   }
  // }

  // handleZoomChange(): void {
  //   let currentZoom = this.map.getZoom();
  //   // Check the current zoom level
  //   if (currentZoom <= 21) {
  //     // Hide all markers
  //     this.hideMarkers();
  //   } else if (currentZoom > 21) {
  //     // Show all markers
  //     this.showMarkers();
  //   }
  // }

  // hideMarkers(): void {
  //   if (this.markers) {
  //     this.markers.forEach((data: any) => {
  //       let customTextClassName = document.getElementsByClassName(data?.label?.className) as any;
  //       if (customTextClassName) {
  //         customTextClassName[0].style.display = 'none';
  //       }
  //     });
  //   }
  // }

  // showMarkers(): void {
  //   if (this.markers) {
  //     this.markers.forEach((data: any) => {
  //       let customTextClassName = document.getElementsByClassName(data.label.className) as any;
  //       if (customTextClassName) {
  //         customTextClassName[0].style.display = 'block';
  //       }
  //     });
  //   }
  // }

  // Code For Future References -->
  changeModuleDimension(moduleDimensionData) {
    this.moduleHegiht = this.inchestometer(moduleDimensionData.moduleHeight);
    this.modulewidth = this.inchestometer(moduleDimensionData.moduleWidth);
    this.gap = this.inchestometer(moduleDimensionData.distanceBwModule);
  }

  addAutomatedModuleToRoof(roof: google.maps.Polygon, moduleDetails, map, obstaclesArray) {
    if (roof['isModuleAdded']) {
      this.toasterService.showError('Modulealready added.');
      return;
    }
    const innerRoof = roof['newRoof'];
    const innerRoofPoints = innerRoof.getPath().getArray();
    // Assigning module dimension data
    this.changeModuleDimension(moduleDetails);
    this.map = map;
    this.obstaclesArray = obstaclesArray;
    // Store first and second point
    const firstPoint = innerRoofPoints[0];
    const secondPoint = innerRoofPoints[1];
    // Calculate Base Line ANgle
    const baseLineAngle = google.maps.geometry.spherical.computeHeading(firstPoint, secondPoint);
    // Calculate offset point after adding some distance
    let firstOffsetPoint = google.maps.geometry.spherical.computeOffset(firstPoint, 1, baseLineAngle - 90);
    let secondOffsetPoint = google.maps.geometry.spherical.computeOffset(secondPoint, 1, baseLineAngle - 90);
    moduleDetails.orientationType = Number(moduleDetails.orientationType);
    if (moduleDetails.orientationType === 1) {
      this.addPORTRAITModule(firstPoint, secondPoint, baseLineAngle, roof);
    } else if (moduleDetails.orientationType === 2) {
      this.addLANDSCAPEModule(firstPoint, secondPoint, baseLineAngle, roof);
    } else if (moduleDetails.orientationType === 3) {
      this.addMIXEDModule(firstPoint, secondPoint, baseLineAngle, roof);
    } else {
      this.toasterService.showError('Orientation type not found!');
    }
    roof.set('isModuleAdded', true);
  }

  addPORTRAITModule(firstPoint: google.maps.LatLng, secondPoint: google.maps.LatLng, baseLineAngle: number, roof: google.maps.Polygon) {
    let positiveIntersection = true;
    let negativeIntersection = true;
    // Run whileLoop to place module
    let i = 0;
    while (positiveIntersection) {
      const offsetToAdd = this.gap * i + ((i === 0) ? this.moduleHegiht : this.moduleHegiht * (i + 1));
      // Calculating offset points
      const firstOffsetPoint = google.maps.geometry.spherical.computeOffset(firstPoint, offsetToAdd, baseLineAngle + 90);
      const secondOffsetPoint = google.maps.geometry.spherical.computeOffset(secondPoint, offsetToAdd, baseLineAngle + 90);

      const intersectionPoints = this.findAllIntersectionPoints(firstOffsetPoint, secondOffsetPoint, roof['newRoofArr']);
      if (intersectionPoints.length >= 2) {
        // Calculate intersection line length
        const intersectionLineLength = google.maps.geometry.spherical.computeLength(intersectionPoints);
        // Calculate columns and plsce modules
        const nCols = Math.floor(intersectionLineLength / this.modulewidth);
        // Place module
        const response = this.placeModuleToRoof(intersectionPoints, nCols, this.moduleHegiht, this.modulewidth, true, roof);
        // Add Module on map
        response?.moduleArr?.forEach((panel) => {
          panel.setMap(this.map);
        });
        i++;
      } else {
        positiveIntersection = false;
      }

    }

    // Running while loop for negative side intersection
    i = 0;
    while (negativeIntersection) {
      const offsetToAdd = this.gap * i + ((i === 0) ? this.moduleHegiht : this.moduleHegiht * (i + 1));
      // Calculating offset points
      const firstOffsetPoint = google.maps.geometry.spherical.computeOffset(firstPoint, offsetToAdd, baseLineAngle - 90);
      const secondOffsetPoint = google.maps.geometry.spherical.computeOffset(secondPoint, offsetToAdd, baseLineAngle - 90);

      const intersectionPoints = this.findAllIntersectionPoints(firstOffsetPoint, secondOffsetPoint, roof['newRoofArr']);
      if (intersectionPoints.length >= 2) {
        // Calculate intersection line length
        const intersectionLineLength = google.maps.geometry.spherical.computeLength(intersectionPoints);
        // Calculate columns and plsce modules
        const nCols = Math.floor(intersectionLineLength / this.modulewidth);
        // Place module
        const response = this.placeModuleToRoof(intersectionPoints, nCols, this.moduleHegiht, this.modulewidth, false, roof);
        // Add Module on map
        response?.moduleArr?.forEach((panel) => {
          panel.setMap(this.map);
        });
        i++;
      } else {
        negativeIntersection = false;
      }

    }
  }

  addLANDSCAPEModule(firstPoint: google.maps.LatLng, secondPoint: google.maps.LatLng, baseLineAngle: number, roof: google.maps.Polygon) {
    let positiveIntersection = true;
    let negativeIntersection = true;
    // Run whileLoop to place module
    let i = 0;
    while (positiveIntersection) {
      const offsetToAdd = this.gap * i + ((i === 0) ? this.modulewidth : this.modulewidth * (i + 1));
      // Calculating offset points
      const firstOffsetPoint = google.maps.geometry.spherical.computeOffset(firstPoint, offsetToAdd, baseLineAngle + 90);
      const secondOffsetPoint = google.maps.geometry.spherical.computeOffset(secondPoint, offsetToAdd, baseLineAngle + 90);

      const intersectionPoints = this.findAllIntersectionPoints(firstOffsetPoint, secondOffsetPoint, roof['newRoofArr']);
      if (intersectionPoints.length >= 2) {
        // new google.maps.Polyline({
        //   path: intersectionPoints,
        //   map: this.map,
        //   zIndex: 15
        // })
        // Calculate intersection line length
        const intersectionLineLength = google.maps.geometry.spherical.computeLength(intersectionPoints);
        // Calculate columns and plsce modules
        const nCols = Math.floor(intersectionLineLength / this.moduleHegiht);
        // Place module
        const response = this.placeModuleToRoof(intersectionPoints, nCols, this.modulewidth, this.moduleHegiht, true, roof);
        // Add Module on map
        response?.moduleArr?.forEach((panel) => {
          panel.setMap(this.map);
        });
        i++;
      } else {
        positiveIntersection = false;
      }

    }

    // Running while loop for negative side intersection
    i = 0;
    while (negativeIntersection) {
      const offsetToAdd = this.gap * i + ((i === 0) ? this.modulewidth : this.modulewidth * (i + 1));
      // Calculating offset points
      const firstOffsetPoint = google.maps.geometry.spherical.computeOffset(firstPoint, offsetToAdd, baseLineAngle - 90);
      const secondOffsetPoint = google.maps.geometry.spherical.computeOffset(secondPoint, offsetToAdd, baseLineAngle - 90);

      const intersectionPoints = this.findAllIntersectionPoints(firstOffsetPoint, secondOffsetPoint, roof['newRoofArr']);
      if (intersectionPoints.length >= 2) {
        // Calculate intersection line length
        const intersectionLineLength = google.maps.geometry.spherical.computeLength(intersectionPoints);
        // Calculate columns and plsce modules
        const nCols = Math.floor(intersectionLineLength / this.moduleHegiht);
        // Place module
        const response = this.placeModuleToRoof(intersectionPoints, nCols, this.modulewidth, this.moduleHegiht, false, roof);
        // Add Module on map
        response?.moduleArr?.forEach((panel) => {
          panel.setMap(this.map);
        });
        i++;
      } else {
        negativeIntersection = false;
      }

    }
  }

  addMIXEDModule(firstPoint: google.maps.LatLng, secondPoint: google.maps.LatLng, baseLineAngle: number, roof: google.maps.Polygon) {
    let positiveIntersection = true;
    let negativeIntersection = true;
    // Run whileLoop to place module
    let i = 0;
    let offsetToAdd = 0;
    while (positiveIntersection) {
      offsetToAdd = offsetToAdd + ((i === 0) ? 0 : this.gap);
      // Calculating offset points
      const firstOffsetPoint = google.maps.geometry.spherical.computeOffset(firstPoint, offsetToAdd + this.moduleHegiht, baseLineAngle + 90);
      const secondOffsetPoint = google.maps.geometry.spherical.computeOffset(secondPoint, offsetToAdd + this.moduleHegiht, baseLineAngle + 90);
      // Calculate offset points for landscape module
      const firstOffsetPointLNDSCP = google.maps.geometry.spherical.computeOffset(firstPoint, offsetToAdd + this.modulewidth, baseLineAngle + 90);
      const secondOffsetPointLNDSCP = google.maps.geometry.spherical.computeOffset(secondPoint, offsetToAdd + this.modulewidth, baseLineAngle + 90);

      const intersectionPoints = this.findAllIntersectionPoints(firstOffsetPoint, secondOffsetPoint, roof['newRoofArr']);
      const intersectionPointsLNDSCP = this.findAllIntersectionPoints(firstOffsetPointLNDSCP, secondOffsetPointLNDSCP, roof['newRoofArr']);
      let pMRes, lMRes;
      if (intersectionPoints.length >= 2 || intersectionPointsLNDSCP.length >= 2) {
        if (intersectionPoints.length >= 2) {
          // Calculate intersection line length
          const intersectionLineLength = google.maps.geometry.spherical.computeLength(intersectionPoints);
          // Calculate columns and plsce modules
          const nCols = Math.floor(intersectionLineLength / this.modulewidth);
          // Place module
          pMRes = this.placeModuleToRoof(intersectionPoints, nCols, this.moduleHegiht, this.modulewidth, true, roof);
        }
        // Now calculate modules for landscape mode
        if (intersectionPointsLNDSCP.length >= 2) {
          // Calculate intersection line length
          const intersectionLineLengthLNDSCP = google.maps.geometry.spherical.computeLength(intersectionPointsLNDSCP);
          // Calculate columns and plsce modules
          const nColsLNDSCP = Math.floor(intersectionLineLengthLNDSCP / this.moduleHegiht);
          // Place module
          lMRes = this.placeModuleToRoof(intersectionPointsLNDSCP, nColsLNDSCP, this.modulewidth, this.moduleHegiht, true, roof);
        }

        // Now compare the module count in portrait and landscape mode
        if (pMRes && lMRes) {
          if (pMRes.moduleArr.length >= lMRes.moduleArr.length) {
            offsetToAdd = offsetToAdd + this.moduleHegiht;
            pMRes.moduleArr.forEach((panel) => {
              panel.setMap(this.map);
            });
          } else {
            offsetToAdd = offsetToAdd + this.modulewidth;
            lMRes.moduleArr.forEach((panel) => {
              panel.setMap(this.map);
            });
          }
        } else if (pMRes) {
          offsetToAdd = offsetToAdd + this.moduleHegiht;
          pMRes.moduleArr.forEach((panel) => {
            panel.setMap(this.map);
          });
        } else if (lMRes) {
          offsetToAdd = offsetToAdd + this.modulewidth;
          lMRes.moduleArr.forEach((panel) => {
            panel.setMap(this.map);
          });
        }
        i++;
      } else {
        positiveIntersection = false;
      }
    }

    i = 0;
    offsetToAdd = 0;
    while (negativeIntersection) {
      offsetToAdd = offsetToAdd + ((i === 0) ? 0 : this.gap);
      // Calculating offset points
      const firstOffsetPoint = google.maps.geometry.spherical.computeOffset(firstPoint, offsetToAdd + this.moduleHegiht, baseLineAngle - 90);
      const secondOffsetPoint = google.maps.geometry.spherical.computeOffset(secondPoint, offsetToAdd + this.moduleHegiht, baseLineAngle - 90);
      // Calculate offset points for landscape module
      const firstOffsetPointLNDSCP = google.maps.geometry.spherical.computeOffset(firstPoint, offsetToAdd + this.modulewidth, baseLineAngle - 90);
      const secondOffsetPointLNDSCP = google.maps.geometry.spherical.computeOffset(secondPoint, offsetToAdd + this.modulewidth, baseLineAngle - 90);

      const intersectionPoints = this.findAllIntersectionPoints(firstOffsetPoint, secondOffsetPoint, roof['newRoofArr']);
      const intersectionPointsLNDSCP = this.findAllIntersectionPoints(firstOffsetPointLNDSCP, secondOffsetPointLNDSCP, roof['newRoofArr']);
      let pMRes, lMRes;
      if (intersectionPoints.length >= 2 || intersectionPointsLNDSCP.length >= 2) {
        if (intersectionPoints.length >= 2) {
          // Calculate intersection line length
          const intersectionLineLength = google.maps.geometry.spherical.computeLength(intersectionPoints);
          // Calculate columns and plsce modules
          const nCols = Math.floor(intersectionLineLength / this.modulewidth);
          // Place module
          pMRes = this.placeModuleToRoof(intersectionPoints, nCols, this.moduleHegiht, this.modulewidth, false, roof);
        }
        // Now calculate modules for landscape mode
        if (intersectionPointsLNDSCP.length >= 2) {
          // Calculate intersection line length
          const intersectionLineLengthLNDSCP = google.maps.geometry.spherical.computeLength(intersectionPointsLNDSCP);
          // Calculate columns and plsce modules
          const nColsLNDSCP = Math.floor(intersectionLineLengthLNDSCP / this.moduleHegiht);
          // Place module
          lMRes = this.placeModuleToRoof(intersectionPointsLNDSCP, nColsLNDSCP, this.modulewidth, this.moduleHegiht, false, roof);
        }

        // Now compare the module count in portrait and landscape mode
        if (pMRes && lMRes) {
          if (pMRes.moduleArr.length >= lMRes.moduleArr.length) {
            offsetToAdd = offsetToAdd + this.moduleHegiht;
            pMRes.moduleArr.forEach((panel) => {
              panel.setMap(this.map);
            });
          } else {
            offsetToAdd = offsetToAdd + this.modulewidth;
            lMRes.moduleArr.forEach((panel) => {
              panel.setMap(this.map);
            });
          }
        } else if (pMRes) {
          offsetToAdd = offsetToAdd + this.moduleHegiht;
          pMRes.moduleArr.forEach((panel) => {
            panel.setMap(this.map);
          });
        } else if (lMRes) {
          offsetToAdd = offsetToAdd + this.modulewidth;
          lMRes.moduleArr.forEach((panel) => {
            panel.setMap(this.map);
          });
        }
        i++;
      } else {
        negativeIntersection = false;
      }
    }
  }

  convertPointsToLine(polygonPoints: google.maps.LatLng[]) {
    const points = [...polygonPoints, polygonPoints[0]];
    const lineArr = [];
    // Loop on points and push lines to new array
    for (let i = 0; i < points.length - 1; i++) {
      lineArr.push({ start: points[i], end: points[i + 1] });
    }
    // Return lines array
    return lineArr;
  }

  placeModuleToRoof(intersectionPoints, nCols, mHeight, mWidth, perpendicularDegree, roof) {
    let moduleCount = 0;
    const moduleArr = [];
    // Loop on no of columns
    const intersectionLineAngle = google.maps.geometry.spherical.computeHeading(intersectionPoints[0], intersectionPoints[intersectionPoints.length - 1]);
    for (let i = 0; i < nCols; i++) {
      const offsetToAdd = this.gap * i + ((i === 0) ? 0 : mWidth * i);
      const mFirstPoint = google.maps.geometry.spherical.computeOffset(intersectionPoints[0], offsetToAdd, intersectionLineAngle);
      const mSecondPoint = google.maps.geometry.spherical.computeOffset(mFirstPoint, mWidth, intersectionLineAngle);
      const mThirdPoint = google.maps.geometry.spherical.computeOffset(mSecondPoint, mHeight, (perpendicularDegree) ? intersectionLineAngle + 90 : intersectionLineAngle - 90);
      const mFourthPoint = google.maps.geometry.spherical.computeOffset(mThirdPoint, -mWidth, intersectionLineAngle);
      // Add Module on map
      const module = new google.maps.Polygon({
        paths: [mFirstPoint, mSecondPoint, mThirdPoint, mFourthPoint],
        strokeColor: '#FFA500',
        strokeWeight: 2,
        fillOpacity: 0.8,
        fillColor: '#FFFA41',
        strokeOpacity: 1.0,
        zIndex: 12
      });
      // check all the module points are inside or not of inner polygon
      let inside = true;
      module.getPath().getArray().forEach((point) => {
        if (!google.maps.geometry.poly.containsLocation(point, roof['innerPolygon'])) {
          inside = false;
        }
      });
      // Add module on map if all points of map are inside
      if (inside && !this.checkObstacleInisdeModule(module)) {
        // module.setMap(this.map);
        moduleCount++;
        moduleArr.push(module);
      }
    }
    // return module count
    return { mCount: moduleCount, moduleArr: moduleArr };
  }

  checkObstacleInisdeModule(module: google.maps.Polygon) {
    let inside = false;
    const modulePoints = module.getPath().getArray();
    for (let i = 0; i < this.obstaclesArray.length; i++) {
      const obstacle = this.obstaclesArray[i];
      const outerObstacle = obstacle['outerObstacle'];
      // Firstly check module points inside obstacle
      modulePoints.forEach((point: google.maps.LatLng) => {
        if (google.maps.geometry.poly.containsLocation(point, outerObstacle)) {
          inside = true;
        }
      });
      if (inside) {
        break;
      }
      // Now check obstacle points inside module
      outerObstacle.getPath().getArray().forEach((point: google.maps.LatLng) => {
        if (google.maps.geometry.poly.containsLocation(point, module)) {
          inside = true;
        }
      });
      if (inside) {
        break;
      }
    }
    return inside;
  }

  convertRectangleBoundsToPolygonPoints(bounds: google.maps.LatLngBounds) {
    const rectangleCoords = [
      new google.maps.LatLng(bounds.getNorthEast().lat(), bounds.getNorthEast().lng()),
      new google.maps.LatLng(bounds.getNorthEast().lat(), bounds.getSouthWest().lng()),
      new google.maps.LatLng(bounds.getSouthWest().lat(), bounds.getSouthWest().lng()),
      new google.maps.LatLng(bounds.getSouthWest().lat(), bounds.getNorthEast().lng())
    ];
    return rectangleCoords;
  }

  getOuterObsPoints(points, obstacleSetback, obstacleInstance) {
    // converting points to line array
    const lineArr = this.convertPointsToLine(points);
    lineArr.forEach((el) => {
      el.fireSetBack = obstacleSetback;
    });
    // creating obstacle with polygon
    const obstacle = new google.maps.Polygon({
      paths: points
    });
    // getting new obstacle points
    const outerPoints = this.getOuterPolygonPoints(lineArr, obstacle);
    const outerObstacle = new google.maps.Polygon({
      paths: outerPoints
    });
    // setting it to main obstacle instance
    obstacleInstance.set('outerObstacle', outerObstacle);
  }

  preserveDraftingData(preDraftingDataManual?) {
    let permitData = JSON.parse(localStorage.getItem("permitdata"));
    // let permitData = JSON.parse(localStorage.getItem("permitdata"));
    let draftingJson = permitData.type === "dxf" ? "dxfrawjson" : permitData.type === "ev" ? "evrawjson" : "manualrawjson"
    let payload = {
      data: {
        designid: permitData.id,
        [draftingJson]: {
          drawings: {
            rectangle: this.toolService.getToolData('rectangle'),
            circle: this.toolService.getToolData('circle'),
            polyline: this.toolService.getToolData('polyline')
          },
          chimney: this.drawingService.getChimneyData(),
          // fence: this.fenceService.getfenceData(),
          roofSlope: this.roofSlopeService.getRoofSlopeData(),
          customText: this.customTextService.getCustomTextData(),
          equipments: this.equipmentService.getEquipmentsData(),
          pool: this.toolService.getToolData('pool'),
          driveways: this.toolService.getToolData('driveway'),
          trees: this.objectService.getTreeData(),
          connectionWire: this.toolService.getToolData('connectionWire'),
          propertyline: this.toolService.getToolData('propertyline'),
          // rotation: this.mapCompassComponent.accumulatedAmount
          ...((preDraftingDataManual) && { "preDraftingDataManual": preDraftingDataManual }),
        }
      }
    }
    console.log(JSON.stringify(payload))
    this.plansetService.preserveDraftingData(payload).subscribe({
      next: (res: any) => {
        this.toasterService.showSuccess('Progress Successfully Captured');
        console.log(res)
      },
      error: (err) => {
        this.toasterService.showError('Something went wrong');
      }
    })
  }

  fetchDraftingData() {
    let permitData = JSON.parse(localStorage.getItem("permitdata"));
    console.log('fetching api')
    return new Promise((resolve, reject) => {
      this.plansetService.fetchDraftingData(permitData.id).subscribe({
        next: (res: any) => {
          console.log('testted')
          // let dxfData = res.data[0].attributes.dxfrawjson;
          // // this.customTextService.customTextArray = dxfData.customText;
          // this.drawingService.chimneyArray = dxfData.chimney;
          // this.objectService.treeArray = dxfData.trees;
          // this.equipmentService.equipmentsArray = dxfData.equipments;
          // this.toolService.toolDataArray.push(
          //   ...dxfData.pool,
          //   ...dxfData.driveways,
          //   ...dxfData.drawings.circle,
          //   ...dxfData.drawings.polyline,
          //   ...dxfData.drawings.rectangle,
          //   ...dxfData.connectionWire.roofPlan,
          //   ...dxfData.connectionWire.stringLayout);
          // this.roofSlopeService.roofSlopeArray = dxfData.roofSlope;
          resolve(res);
        },
        error: (err) => {
          this.toasterService.showError('Something Went Wrong');
          reject(true);
        }
      })
    })
  }

}
