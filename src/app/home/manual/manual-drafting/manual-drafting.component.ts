import { ChangeDetectorRef, Component, ElementRef, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ThemePalette } from '@angular/material/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import * as $ from 'jquery';
import { CommonService } from 'src/app/services/commonservice';

@Component({
  selector: 'app-manual-drafting',
  templateUrl: './manual-drafting.component.html',
  styleUrls: ['./manual-drafting.component.scss']
})
export class ManualDraftingComponent implements OnInit {

  ADDRESSFORMAT: any = /[^ ]*^[#.0-9a-zA-Z\s,-]*[^ ]$/;

  map: google.maps.Map;
  markers: google.maps.Marker[] = [];
  lines: any[] = [];
  coordinates: any[] = [];
  @ViewChild('streetView', { static: true }) streetView: ElementRef;
  @ViewChild('myTemplate', { static: true }) myTemplate: ElementRef;
  @ViewChild('addLabelDialog', { static: true }) addLabelDialog: TemplateRef<any>;
  roofsJSON = { roofs: [], driveways: [] };
  roofsArray: any[] = [];
  buildingroofdata: any = [];
  selectedPolyline: any;
  polylines: any[] = [];
  selectedBounds: any;
  selectedAddress: string;
  isMapLoaded: boolean = false;
  showAddressInput: boolean = true;

  centerLat: number;
  rectangle: google.maps.Polyline[] = [];
  deleterectangle: google.maps.Polyline[] = [];
  centerLng: number;
  edges: any[] = [];
  modulesPolygon: google.maps.Polygon[] = [];
  selectedPolygon = [];

  moduleHegiht: any = 61.68;
  modulewidth: any = 40.08;
  distanceBwModules: any = 0.25;
  orgModuleHegiht: any = 78;
  orgModulewidth: any = 48;
  defaultOrientation: string = 'PORTRAIT';
  sidebarMenuOptions: any;
  drawingManager: any = new google.maps.drawing.DrawingManager;
  freeLine: any;
  shapes: any[] = [];
  redoShapes: any[] = [];

  showev: boolean = false;
  toggle: boolean = false;

  polylinesdata: any;
  mouseMoveListener: any;
  distanceLabel: HTMLElement;
  obstacles: any = [];
  roofLineForm: FormGroup;
  lineTypeForm: FormGroup;
  lineTypes = [
    { key: 'ridge', value: 'Ridge' },
    { key: 'eave', value: 'Eave' },
    { key: 'heap', value: 'Heap' },
    { key: 'valley', value: 'Valley' },
    { key: 'rake', value: 'Rake' },
    { key: 'others', value: 'Others' },
  ];
  showRoofLinesForm: boolean = false;
  activeLine: google.maps.Polyline;

  iconsObj = [
    { httpurl: "assets/icons/UM.png", isSelected: false, name: "UM" },
    { httpurl: "assets/icons/MSP.png", isSelected: false, name: "MSP" },
    { httpurl: "assets/icons/AC.png", isSelected: false, name: "AC" },
    { httpurl: "assets/icons/DG.png", isSelected: false, name: "DG" },
    { httpurl: "assets/icons/IQ.png", isSelected: false, name: "IQ" },
  ];


  dropdownOptions = [
    { name: 'Outer Boundary', value: 'outer_boundaries' },
    { name: 'Edges', value: 'roofs' },
    { name: 'Ridge', value: 'ridge' },
    { name: 'Modules', value: 'modules' }
  ];
  dropdownSelectedValue: string;

  drawMngPoly: any = {};
  isDrawing: boolean = false;

  drawingOptions: any = [
    { value: 'roof', viewValue: 'Roof' },
    { value: 'ridge', viewValue: 'Ridge' }
  ];
  drawingForm: any;
  dblClickEvent: any;
  label: HTMLElement;
  overlay: google.maps.OverlayView;
  infoWindow: google.maps.InfoWindow = new google.maps.InfoWindow();
  labelForm: any;
  color: ThemePalette = 'primary';
  polyLineForm: any;
  moduleForm: any;
  allShapesSets: any = [];
  shapesLabels: any = [];
  jsonData: any;
  roofModuleArr = [];
  activeTool = 'hand';
  modulesObject = [];
  accumulatedAmount: number = 0;
  modulesRailsInverter = [];
  allRoofsObjects = {};
  currentSelectedLocation: any;
  defaultLoadTime: number = 2000;
  treeAndOtherStructure: any = [];


  customTextMarkersArray: any = [];
  treeMarkersArray: any = [];
  rectangleDrawingArray: any = [];
  circleDrawingArray: any = [];
  polylineDrawingArray: any = [];
  equipmentsArray: any = [];
  mapRotationDegree: number;
  propertylineArray: any = [];
  polygonDrawingArray: any = [];
  roofLabelArray: any = [];
  roofLinesArray: any = [];

  showObjectInfoWindow: string;
  showInfowindow: boolean = false;
  treeImgValue: any = 80;
  treeObjectProperties: any;
  showSidebar: boolean = false;
  currentTabIndex: number = 0;
  allOtherHouseObjects = [];
  propertyLineEditObject = { propertyLineColor: '', propertyLineThicknessNgModel: '' };
  driveWayObject = { polygonColor: '', polygonFillColor: '', polygonOpacityNgModel: '', polygonThicknessNgModel: '' };
  customTextObject = { customTextValue: '', customTextFont: '', customTextColor: '' };
  polyLineObject: any = { polylineThicknessValue: '', polylineLength: { inches: '', feet: '' }, polylineColor: '' }
  equipmentImgNgModel: any;
  equipmentImageProperties: any;
  equipmentsArrayFinal: any = [];
  polylineFirst: any;
  polylineSecond: any;
  polylineThird: any;
  polylineFourth: any;
  rectangleAcDisconnect: any;
  equipmentsDataArray: any = [];
  allRoofLines: any = [];
  allEaveLines: any = [];
  checkPairLineClicked: boolean = false;
  acDisconnectLinesArray = [];
  updatedRoofs = [];
  rafterGap: number = 24;
  dee= "➤@";

  // Declaring variables for string layout
  rawModules = [];
  currentIndex: number = 0;
  isPanel: boolean = true;
  stringColors = [
    { name: "A", color: '#e81416', cursor: "url(https://img.icons8.com/color-glass/24/pencil.png) 0 24, auto" },
    { name: "B", color: '#ffa500', cursor: "url(https://img.icons8.com/color-glass/24/pencil.png) 0 24, auto" },
    { name: "C", color: '#faeb36', cursor: "url(https://img.icons8.com/color-glass/24/pencil.png) 0 24, auto" },
    { name: "D", color: '#79c314', cursor: "url(https://img.icons8.com/color-glass/24/pencil.png) 0 24, auto" },
    { name: "E", color: '#487de7', cursor: "url(https://img.icons8.com/color-glass/24/pencil.png) 0 24, auto" },
    { name: "F", color: '#4b369d', cursor: "url(https://img.icons8.com/color-glass/24/pencil.png) 0 24, auto" },
    { name: "G", color: '#70369d', cursor: "url(https://img.icons8.com/color-glass/24/pencil.png) 0 24, auto" }
  ]
  stringPannelData: any = [];
  mapCenter: any;
  allAttachmentsRaftersRails = [];
  polylineFirstAcNonFused: any;
  polylineSecondNonFused: any;
  polylineThirdNonFused: any;
  polylineFourthNonFused: any;
  NonFusedAcDisconnectLinesArray: any = [];

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private jsonService: CommonService,
    private changeDetector: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.isMapLoaded = false;
    this.jsonService.getJSONData().subscribe(data => {
      this.jsonData = data;
      this.initializeMap(data);
      this.isMapLoaded = true;
      const location = { latitude: data.location.latitude, longitude: data.location.longitude };
      this.handleSidebarMenuClick(0);
      this.addLocalStorageData();
      this.addRoofLines();
      // this.handleSidebarMenuClick('roof');

      // this.jsonService.buildingInsightRequest(location).subscribe({
      //   next: (res: any) => {
      //     console.log('responsew', res);
      //   },
      //   error: (e: HttpErrorResponse) => {
      //     this.toastr.info('No data found for this address from google solar api..');
      //     console.log('err', e);
      //   }
      // });
    });
    this.initializeRoofLineForm();
    this.initializeLabelForm();
    this.getCurrentTab();
    this.initializeLineTypeForm();
  }

  actionchange(value) {
    this.handleSidebarMenuClick(value);
  }

  getCurrentTab() {
    this.jsonService.getCurrentTab().subscribe((res: any) => {
      this.updateMap(res);
      this.currentTabIndex = res;
    });

    setTimeout(() => {
      this.jsonService.setCurrentTab(0);
    }, 1000);

  }

  updateMap(tabIndex: number) {
    this.isMapLoaded = false;
    this.showInfowindow = false;
    if (this.currentTabIndex === tabIndex) {
      setTimeout(() => {
        this.isMapLoaded = true;
      }, 1000);
      return;
    }
    switch (tabIndex) {
      case 0: {
        this.currentTabIndex = 0;
        setTimeout(() => {
          this.isMapLoaded = true;
        }, this.defaultLoadTime);
        this.modulesObject.forEach((module) => {
          if (module.isVisible) {
            // Remove string layout color
            module.module.setOptions({
              fillColor: '#FFFA41',
              strokeColor: '#FFA500',
              strokeWeight: 2,
              strokeOpacity: 1.0,
              fillOpacity: 0.8,
            });
            // Removing Rails
            // module.rail1.setMap(null);
            // module.rail2.setMap(null);
            // Remove Micro Inverter
            module.inverterPolygon.setMap(null);
            // Set Label as blank
            module.labelMarker.setLabel('');
          } else {
            module.module.setMap(this.map);
          }
        });
        // Add all other drawing on site plan
        this.allOtherHouseObjects.forEach((drawing) => {
          drawing.setMap(null);
        });
        this.allOtherHouseObjects.forEach((drawing) => {
          drawing.setMap(this.map);
        });
        this.treeAndOtherStructure.forEach((structure) => {
          structure.setMap(null);
        });
        this.addLocalStorageData();
        // Remove attachments rafters rails
        this.allAttachmentsRaftersRails.forEach((element) => {
          element.setMap(null);
        });
        this.allAttachmentsRaftersRails = [];
        break;
      }
      case 1: {
        this.currentTabIndex = 1;
        // Close Equipment popup if open
        this.showSidebar = false;
        setTimeout(() => {
          this.isMapLoaded = true;
        }, this.defaultLoadTime);
        this.modulesObject.forEach((module) => {
          if (module.isVisible) {
            module.module.setOptions({
              strokeColor: '#2b2d47',
              strokeOpacity: 1,
              strokeWeight: 1,
              fillColor: 'white',
              fillOpacity: 0,
            });
            // Adding Rails
            // module.rail1.setMap(this.map);
            // module.rail2.setMap(this.map);
            // Add Micro Inverter
            module.inverterPolygon.setMap(this.map);
            // Set Label as blank
            module.labelMarker.setLabel('');
          } else {
            module.module.setMap(null);
          }
        });
        // Remove all other drawing on site plan
        this.allOtherHouseObjects.forEach((drawing) => {
          drawing.setMap(null);
        });
        this.treeAndOtherStructure.forEach((structure) => {
          structure.setMap(null);
        });
        this.addLocalStorageData();
        // Add attachments rafters rails
        this.updatedRoofs.forEach((roof) => {
          this.drawRafter(roof.roofIndex);
        });
        break;
      }
      case 2: {
        this.currentTabIndex = 2;
        // Close Equipment popup if open
        this.showSidebar = false;
        setTimeout(() => {
          this.isMapLoaded = true;
        }, this.defaultLoadTime);
        this.modulesObject.forEach((module) => {
          if (module.isVisible) {
            // Update module color
            module.module.setOptions({
              strokeColor: '#2b2d47',
              strokeOpacity: 1,
              strokeWeight: 1,
              fillColor: 'white',
              fillOpacity: 0,
            });
            // Removing Rails
            // module.rail1.setMap(null);
            // module.rail2.setMap(null);
            // Remove Micro Inverter
            module.inverterPolygon.setMap(null);
          } else {
            module.module.setMap(null);
          }
        });
        // Remove all other drawing on site plan
        this.allOtherHouseObjects.forEach((drawing) => {
          drawing.setMap(null);
        });
        // Add String layout
        this.stringPannelData.forEach((string, index) => {
          const filteredPanels = this.rawModules.filter((stringPanel) => stringPanel.stringLayoutIndex === index);
          filteredPanels.forEach((moduleObj, moduleIndex) => {
            moduleObj.module.setOptions({
              strokeOpacity: 1,
              strokeWeight: 1,
              fillColor: this.stringPannelData[moduleObj.stringLayoutIndex].color,
              fillOpacity: 0.8,
            });
            // Now Add label for module
            const panelLabel = `${this.stringPannelData[index].stringValue}${moduleIndex + 1}`;
            moduleObj.labelMarker.setLabel(panelLabel);
          });
        });
        this.treeAndOtherStructure.forEach((structure) => {
          structure.setMap(null);
        });
        this.addLocalStorageData();
        this.getMapCenter();
        this.addStringLayoutRotation();
        // Remove attachments rafters rails
        this.allAttachmentsRaftersRails.forEach((element) => {
          element.setMap(null);
        });
        this.allAttachmentsRaftersRails = [];
        break;
      }
    }
    this.updateMapForStringLayout();
  }

  addLocalStorageData() {
    const localStorageData = JSON.parse(localStorage.getItem('mapData'));
    if (localStorageData) {
      if (this.currentTabIndex === 0) {
        if (localStorageData.trees && localStorageData.trees.length > 0) {
          this.treeMarkersArray = localStorageData.trees;
          this.addObjects(this.treeMarkersArray);
        }
        // Adding Custom Text from local Storage
        if (localStorageData.customText && localStorageData.customText.length > 0) {
          this.customTextMarkersArray = localStorageData.customText;
          this.addCustomText(this.customTextMarkersArray);
        }
        // Add Property Line from local storage
        if (localStorageData.plotOutline) {
          this.propertylineArray = localStorageData.plotOutline;
          this.redrawPropertyline(this.propertylineArray);
        }
        // Drawing drive ways
        if (localStorageData.driveways && localStorageData.driveways.length > 0) {
          this.polygonDrawingArray = localStorageData.driveways;
          this.drawDriveway(this.polygonDrawingArray);
        }
        // Adding Polyline from localstorage
        if (localStorageData.Drawings.polyline.length > 0) {
          this.polylineDrawingArray = localStorageData.Drawings.polyline;
          this.createShapesFromLocalStorage(this.polylineDrawingArray, 'polyline');
        }
      }
      // Drawing Equipment
      if (localStorageData.equipments && localStorageData.equipments.length > 0) {
        this.equipmentsArray = localStorageData.equipments;
        this.addEquipment('', this.equipmentsArray);
      }

    }
    if (this.currentTabIndex === 2) {
      const obstaclesJSON = [];
      this.obstacles.forEach((obstacleObject) => {
        if (obstacleObject.type === 'rectangle') {
          const rectangle = obstacleObject.obstacle;
          const bounds = rectangle.getBounds();
          // Convert rectangle bounds to polygon vertices
          const northEast = bounds.getNorthEast();
          const northWest = new google.maps.LatLng(northEast.lat(), bounds.getSouthWest().lng());
          const southWest = bounds.getSouthWest();
          const southEast = new google.maps.LatLng(southWest.lat(), bounds.getNorthEast().lng());
          // Now add polygon to map
          const polygon = new google.maps.Polygon({
            paths: [
              { lat: northEast.lat(), lng: northEast.lng() },
              { lat: northWest.lat(), lng: northWest.lng() },
              { lat: southWest.lat(), lng: southWest.lng() },
              { lat: southEast.lat(), lng: southEast.lng() }
            ]
          });
          // Now Add obstacle line object
          const obtsacleObject = {
            id: `OBS${obstaclesJSON.length + 1}`,
            type: 'rectangle',
            lines: this.getLinesObject(polygon.getPath().getArray())
          };
          obstaclesJSON.push(obtsacleObject);
        }
        if (obstacleObject.type === 'circle') {
          const circle = obstacleObject.obstacle;
          // Now Add obstacle line object
          const obtsacleObject = {
            id: `OBS${obstaclesJSON.length + 1}`,
            type: 'circle',
            radius: (circle.radius * 3.28084).toFixed(2),
            unit: 'feet',
            center: circle.center,
          };
          obstaclesJSON.push(obtsacleObject);
        }
      });
      this.roofsJSON['obstacles'] = obstaclesJSON;
    }
  }

  addRoofLines() {
    const localStorageData = JSON.parse(localStorage.getItem('mapData'));
    // Adding Roofs from local Storage
    if (localStorageData?.roofLines && localStorageData.roofLines.length > 0) {
      localStorageData.roofLines.forEach((roof) => {
        const roofPolygon = new google.maps.Polygon({
          paths: roof.paths,
          map: this.map
        });
        roofPolygon.set('id', roof.id);
        this.roofLinesArray.push(roof);
        this.allRoofsObjects[roof.id] = { paths: roofPolygon.getPath().getArray(), dataAdded: false };
        this.removePolygonAndAddLines(roofPolygon.getPath().getArray(), roofPolygon, roof.id);
      });
    }
  }

  getLinesObject(paths: any) {
    const linePaths = [...paths, paths[0]];
    const liens = [];
    for (let i = 0; i < linePaths.length - 1; i++) {
      const pointCoordsDistance = (google.maps.geometry.spherical.computeLength([linePaths[i], linePaths[i + 1]]) * 3.28084).toFixed(2);
      const angle = this.calculateAngle(linePaths[i].lat(), linePaths[i].lng(), linePaths[i + 1].lat(), linePaths[i + 1].lng());
      const linesObj = {
        key: `key_line${((linePaths.length) + 1)}`,
        angle: angle.toFixed(2),
        id: i + 1,
        length: pointCoordsDistance,
        unit: 'feet',
        start: { lat: linePaths[i].lat(), lng: linePaths[i].lng(), value: 0 },
        end: { lat: linePaths[i + 1].lat(), lng: linePaths[i + 1].lng(), value: pointCoordsDistance },
      };
      liens.push(linesObj);
    }
    return liens;
  }

  updateMapForStringLayout() {
    const center = { lat: this.currentSelectedLocation.lat(), lng: this.currentSelectedLocation.lng() };
    const centerLatLng = new google.maps.LatLng(center.lat, center.lng);
    if (this.currentTabIndex === 2) {

      const radiusInMeters = 50;
      const north = google.maps.geometry.spherical.computeOffset(centerLatLng, radiusInMeters, 0).lat();
      const south = google.maps.geometry.spherical.computeOffset(centerLatLng, radiusInMeters, 180).lat();
      const east = google.maps.geometry.spherical.computeOffset(centerLatLng, radiusInMeters, 90).lng();
      const west = google.maps.geometry.spherical.computeOffset(centerLatLng, radiusInMeters, -90).lng();

      const bounds = {
        north,
        south,
        east,
        west,
      };
      // Update Map Options
      this.map.setOptions({
        center: center,
        zoom: 22,
        tilt: 0,
        mapTypeControl: false,
        heading: 0,
        // disableDefaultUI: true,
        mapTypeId: 'roadmap',
        restriction: {
          latLngBounds: bounds,
          // strictBounds: true
        },
        styles: [
          {
            featureType: 'all',
            elementType: 'all',
            stylers: [
              { visibility: 'off' }
            ]
          },
          {
            featureType: 'landscape',
            elementType: 'geometry',
            stylers: [
              { visibility: 'on' },
              { color: '#fcfcfc' }
            ]
          }
        ]
      });
    } else {
      const radiusInMeters = 1000;
      const north = google.maps.geometry.spherical.computeOffset(centerLatLng, radiusInMeters, 0).lat();
      const south = google.maps.geometry.spherical.computeOffset(centerLatLng, radiusInMeters, 180).lat();
      const east = google.maps.geometry.spherical.computeOffset(centerLatLng, radiusInMeters, 90).lng();
      const west = google.maps.geometry.spherical.computeOffset(centerLatLng, radiusInMeters, -90).lng();

      const bounds = {
        north,
        south,
        east,
        west,
      };
      this.map.setOptions({
        zoom: 22,
        disableDefaultUI: false,
        mapTypeControl: true,
        restriction: {
          latLngBounds: bounds,
          strictBounds: false
        },
        styles: []
      });
    }
  }

  initializeMap(data: any): void {
    let center = new google.maps.LatLng(27.705420246609105, -97.41081295141804);
    const localStorageData = localStorage.getItem('permitdata');
    if (localStorageData) {
      const parseData = JSON.parse(localStorageData);
      if (parseData.lat && parseData.lng) {
        center = new google.maps.LatLng(parseData.lat, parseData.lng);
      }
    }
    // center = new google.maps.LatLng(data.location.latitude, data.location.longitude);
    // center = new google.maps.LatLng(29.570687756324798, -81.23130583353537);
    this.currentSelectedLocation = center;
    // Load Map
    this.map = new google.maps.Map(document.getElementById("map")!, {
      center: center,
      zoom: 22,
      tilt: 0,
      heading: 0,
      // disableDefaultUI: true,
      // restriction: {
      //   latLngBounds: bounds,
      //   strictBounds: true
      // }
    });
    this.map.set("mapId", "90f87356969d889c");
  }


  drawStructures(points: any, faces: any, lines: any, data: any): void {
    const pointCoordinates: any = {};
    points.forEach((point: any) => {
      const coords = point.coords.split(",");
      pointCoordinates[point.id] = new google.maps.LatLng(parseFloat(coords[1]), parseFloat(coords[0]));
    });

    lines.forEach((line: any, index) => {
      if (line.type != "OTHER") {
        const path = line.path.split(",");
        const decodedPath = path.map((pointId: any) => pointCoordinates[pointId]);
        // Calculate the distance for this line
        const lineDistance = google.maps.geometry.spherical.computeLength(decodedPath);
        // Convert meters to feet if needed
        let lineDistanceFeet = (lineDistance * 3.28084).toFixed(2);
        let lineDistanceMeter = lineDistance.toFixed(2)

        let strokeColor = "grey";


        const polyline = new google.maps.Polyline({
          path: decodedPath,
        });
      }
    });
    return;

    const arr = [
      { lat: 30.285692, lng: -97.74941 },
      { lat: 30.285695, lng: -97.749451 },
      { lat: 30.285937, lng: -97.749427 },
      { lat: 30.285934, lng: -97.749385 },
    ];
    const roof = new google.maps.Polygon({
      map: this.map,
      paths: arr
    });

    const arr2 = [
      { lat: 30.285698, lng: -97.7495 },
      { lat: 30.285695, lng: -97.749451 },
      { lat: 30.285937, lng: -97.749427 },
      { lat: 30.28594, lng: -97.749476 },
      { lat: 30.285885, lng: -97.749481 },
      { lat: 30.285886, lng: -97.749496 },
      { lat: 30.285865, lng: -97.749498 },
      { lat: 30.285864, lng: -97.749483 },
      { lat: 30.285771, lng: -97.749493 },
      { lat: 30.285772, lng: -97.749509 },
      { lat: 30.285752, lng: -97.749511 },
      { lat: 30.28575, lng: -97.749495 },
    ];

    const roof2 = new google.maps.Polygon({
      map: this.map,
      paths: arr2
    });

    const arr3 = [
      { lat: 30.286003, lng: -97.749407 },
      { lat: 30.285948, lng: -97.749413 },
      { lat: 30.285975, lng: -97.749439 },
    ];

    const roof3 = new google.maps.Polygon({
      map: this.map,
      paths: arr3
    });

    const arr4 = [
      { lat: 30.286007, lng: -97.749464 },
      { lat: 30.285952, lng: -97.74947 },
      { lat: 30.285975, lng: -97.749439 },
      { lat: 30.28598, lng: -97.749438 }
    ];

    const roof4 = new google.maps.Polygon({
      map: this.map,
      paths: arr4
    });
    this.addModuleCal(arr, roof);
    this.addModuleCal(arr2, roof2);
    this.addModuleCal(arr3, roof3);
    this.addModuleCal(arr4, roof4);
  }

  addModuleCal(arr: any, roof: any, formValues?: any) {
    let moduleHegiht: any = Number(this.inchesToMeters(this.moduleHegiht));
    let modulewidth: any = Number(this.inchesToMeters(this.modulewidth));
    const fireSetBack = 0.2;
    const gap = Number(this.inchesToMeters(this.distanceBwModules));
    let start, end = [];
    let line1FireSetBack, line2FireSetBack;
    let previousDistance = 0;
    const newPolygon: any = [];
    arr.forEach((ele, index) => {
      start = [];
      end = [];

      if (index === 0) {

        start.push(ele);
        start.push(arr[index + 1]);

        end.push(ele);
        end.push(arr[arr.length - 1]);

        line1FireSetBack = ele.fireSetBack;
        line2FireSetBack = arr[arr.length - 1].fireSetBack;
      } else if (index != (arr.length - 1)) {
        start.push(ele);
        start.push(arr[index + 1]);

        end.push(ele);
        end.push(arr[index - 1]);

        line1FireSetBack = ele.fireSetBack;
        line2FireSetBack = arr[index - 1].fireSetBack;

      } else {
        start.push(ele);
        start.push(arr[0]);

        end.push(ele);
        end.push(arr[index - 1]);

        line1FireSetBack = ele.fireSetBack;
        line2FireSetBack = arr[index - 1].fireSetBack;
      }
      const angle1 = this.calculateAngle(start[0].lat, start[0].lng, start[1].lat, start[1].lng);
      const angle2 = this.calculateAngle(end[0].lat, end[0].lng, end[1].lat, end[1].lng);

      const pccor = new google.maps.LatLng(ele.lat, ele.lng);
      let markerCoordinates;
      line2FireSetBack = (line2FireSetBack) ? this.inchestometer(line2FireSetBack) : this.inchesToMeters(6);
      line1FireSetBack = (line1FireSetBack) ? this.inchestometer(line1FireSetBack) : this.inchesToMeters(6);
      markerCoordinates = google.maps.geometry.spherical.computeOffset(pccor, line2FireSetBack, angle1);
      markerCoordinates = google.maps.geometry.spherical.computeOffset(markerCoordinates, line1FireSetBack, angle2);
      const checkPoimt = google.maps.geometry.poly.containsLocation(markerCoordinates, roof);
      if (!checkPoimt) {
        markerCoordinates = google.maps.geometry.spherical.computeOffset(pccor, -line2FireSetBack, angle1);
        markerCoordinates = google.maps.geometry.spherical.computeOffset(markerCoordinates, -line1FireSetBack, angle2);
      }
      newPolygon.push(markerCoordinates);
    });
    // Add New Polygon on map
    const updatedPolygon = new google.maps.Polygon({
      paths: newPolygon,
      map: this.map,
      fillColor: 'white',
      fillOpacity: 1,
      strokeWeight: 1,
      zIndex: 10
    });
    // Creating polygon in polyline to check moduleon edge
    const updatedPolyLine = new google.maps.Polyline({
      path: [...newPolygon, newPolygon[0]],
      // map: this.map
    });

    let roofPoints = [...arr];
    roofPoints = roofPoints.map((point) => {
      return new google.maps.LatLng(point.lat, point.lng)
    });
    roofPoints = [...roofPoints, roofPoints[0]];
    const roofIndex = Object.keys(this.updatedRoofs).length;
    this.updatedRoofs.push({ roofIndex, paths: roofPoints });

    const d1 = [{ lat: newPolygon[0].lat(), lng: newPolygon[0].lng() }, { lat: newPolygon[newPolygon.length - 1].lat(), lng: newPolygon[newPolygon.length - 1].lng() }];
    const d2 = [{ lat: newPolygon[1].lat(), lng: newPolygon[1].lng() }, { lat: newPolygon[2].lat(), lng: newPolygon[2].lng() }];



    let angle = this.calculateAngle(d1[0].lat, d1[0].lng, d2[0].lat, d2[0].lng);
    let checkIntersetionAngle = true;
    // Check Intersetion is inside the polygon or not
    let checkFirstPoint = google.maps.geometry.spherical.computeOffset(new google.maps.LatLng(d1[0].lat, d1[0].lng), 1, angle - 90);
    let checkSecondPoint = google.maps.geometry.spherical.computeOffset(new google.maps.LatLng(d2[0].lat, d2[0].lng), 1, angle - 90);
    const checkingNewPoints = new google.maps.Polygon({
      // map: this.map,
      paths: [checkFirstPoint, checkSecondPoint]
    });
    // Get Mid Point of data
    const checkMidpoint = this.calculateMidPoint(checkingNewPoints.getPath().getArray());

    const checkIntersection = this.findIntersection({ lat: checkFirstPoint.lat(), lng: checkFirstPoint.lng() }, { lat: checkSecondPoint.lat(), lng: checkSecondPoint.lng() }, d1);
    const checkIntersection2 = this.findIntersection({ lat: checkFirstPoint.lat(), lng: checkFirstPoint.lng() }, { lat: checkSecondPoint.lat(), lng: checkSecondPoint.lng() }, d2);
    if (!checkIntersection && !checkIntersection2) {
      checkIntersetionAngle = false;
    }
    // Now check it on points
    let isBothPointOutside = true;
    checkingNewPoints.getPath().forEach((path, index) => {
      const check = google.maps.geometry.poly.containsLocation(path, updatedPolygon);
      if (check && !checkIntersetionAngle) {
        checkIntersetionAngle = true;
        isBothPointOutside = false;
      }
    });
    if (!google.maps.geometry.poly.containsLocation(checkMidpoint, updatedPolygon) && checkIntersetionAngle) {
      checkIntersetionAngle = false;
    }


    const mainLinrDistance: any = google.maps.geometry.spherical.computeLength([new google.maps.LatLng(d1[0].lat, d1[0].lng), new google.maps.LatLng(d1[1].lat, d1[1].lng)]).toFixed(2);
    const nRows = Math.floor(mainLinrDistance / moduleHegiht);
    let iniitalDistance = 0;
    let firtPoint, secondPoint, int1, int2;

    for (let r = 0; r < 50; r++) {
      // Initialize Module Height and Width variable
      moduleHegiht = Number(this.inchesToMeters(this.moduleHegiht));
      modulewidth = Number(this.inchesToMeters(this.modulewidth));

      iniitalDistance = iniitalDistance + gap * r;
      // Check with Module Height
      firtPoint = google.maps.geometry.spherical.computeOffset(new google.maps.LatLng(d1[0].lat, d1[0].lng), iniitalDistance + moduleHegiht, checkIntersetionAngle ? angle - 90 : angle + 90);
      secondPoint = google.maps.geometry.spherical.computeOffset(new google.maps.LatLng(d2[0].lat, d2[0].lng), iniitalDistance + moduleHegiht, checkIntersetionAngle ? angle - 90 : angle + 90);

      // Get intersection points
      int1 = this.findIntersection({ lat: firtPoint.lat(), lng: firtPoint.lng() }, { lat: secondPoint.lat(), lng: secondPoint.lng() }, d1);
      int2 = this.findIntersection({ lat: firtPoint.lat(), lng: firtPoint.lng() }, { lat: secondPoint.lat(), lng: secondPoint.lng() }, d2);

      let moduleOrientation = 'PORTRAIT';
      if (int1 && int2) {
        const lineDistance1: any = google.maps.geometry.spherical.computeLength([new google.maps.LatLng(int1.lat, int1.lng), new google.maps.LatLng(int2.lat, int2.lng)]).toFixed(2);
        const mCount1 = Math.floor(lineDistance1 / modulewidth);

        let firtPoint1 = google.maps.geometry.spherical.computeOffset(new google.maps.LatLng(d1[0].lat, d1[0].lng), iniitalDistance + modulewidth, checkIntersetionAngle ? angle - 90 : angle + 90);
        let secondPoint2 = google.maps.geometry.spherical.computeOffset(new google.maps.LatLng(d2[0].lat, d2[0].lng), iniitalDistance + modulewidth, checkIntersetionAngle ? angle - 90 : angle + 90);
        // Get intersection points
        let ints1 = this.findIntersection({ lat: firtPoint1.lat(), lng: firtPoint1.lng() }, { lat: secondPoint2.lat(), lng: secondPoint2.lng() }, d1);
        let ints2 = this.findIntersection({ lat: firtPoint1.lat(), lng: firtPoint1.lng() }, { lat: secondPoint2.lat(), lng: secondPoint2.lng() }, d2);
        const lineDistance2: any = google.maps.geometry.spherical.computeLength([new google.maps.LatLng(ints1.lat, ints1.lng), new google.maps.LatLng(ints2.lat, ints2.lng)]).toFixed(2);
        const mCount2 = Math.floor(lineDistance2 / moduleHegiht);
        if (mCount2 > mCount1) {
          moduleOrientation = 'LANDSCAPE';
          int1 = ints1;
          int2 = ints2;
        }
      }
      if (int1 && int2) {
        new google.maps.Polygon({
          paths: [int1, int2],
          // map: this.map
        })
        this.addModuleToRoof(moduleOrientation, [int2, int1], updatedPolygon, updatedPolyLine, angle, checkIntersetionAngle);
        iniitalDistance = iniitalDistance + moduleHegiht;
      } else {
        // Check if first point doesnot intersect any line
        if (!int1) {
          const roofLinesArr = [...arr];
          roofLinesArr.push(arr[0]);
          const firstPointIntersectionArr = [];
          for (let r = 0; r < roofLinesArr.length - 1; r++) {
            int1 = this.findIntersection({ lat: firtPoint.lat(), lng: firtPoint.lng() }, { lat: secondPoint.lat(), lng: secondPoint.lng() }, [roofLinesArr[r], roofLinesArr[r + 1]]);
            if (int1) {
              const distanceFromFirstPoint = google.maps.geometry.spherical.computeLength([new google.maps.LatLng(int1.lat, int1.lng), firtPoint]).toFixed(2);
              firstPointIntersectionArr.push({ length: distanceFromFirstPoint, intersectionPoint: int1 });
            }
          }
          // firstPointIntersectionArr.push({length: 1, intersectionPoint: int1});
          if (firstPointIntersectionArr.length > 0) {
            const lowest = firstPointIntersectionArr.reduce((previous, current) => {
              return parseFloat(current.length) < parseFloat(previous.length) ? current : previous;
            });
            int1 = firstPointIntersectionArr.length > 0 ? lowest.intersectionPoint : null;
          }
        }
        // Check if second point doesnot intersect any line
        if (!int2) {
          const roofLinesArr = [...arr];
          roofLinesArr.push(arr[0]);
          const secondPointIntersectionArr = [];
          for (let r = 0; r < roofLinesArr.length - 1; r++) {
            int2 = this.findIntersection({ lat: firtPoint.lat(), lng: firtPoint.lng() }, { lat: secondPoint.lat(), lng: secondPoint.lng() }, [roofLinesArr[r], roofLinesArr[r + 1]]);
            if (int2) {
              const distanceFromFirstPoint = google.maps.geometry.spherical.computeLength([new google.maps.LatLng(int2.lat, int2.lng), secondPoint]).toFixed(2);
              secondPointIntersectionArr.push({ length: distanceFromFirstPoint, intersectionPoint: int2 });
            }
          }
          if (secondPointIntersectionArr.length > 0) {
            const lowest = secondPointIntersectionArr.reduce((previous, current) => {
              return parseFloat(current.length) < parseFloat(previous.length) ? current : previous;
            });
            int2 = secondPointIntersectionArr.length > 0 ? lowest.intersectionPoint : null;
          }
        }
        if (int1 && int2) {
          // Now place module
          this.addModuleToRoof(moduleOrientation, [int2, int1], updatedPolygon, updatedPolyLine, angle, checkIntersetionAngle);
          iniitalDistance = iniitalDistance + moduleHegiht;
        } else {
          // Now check with module width by placing it in landscape mod
          firtPoint = google.maps.geometry.spherical.computeOffset(new google.maps.LatLng(d1[0].lat, d1[0].lng), iniitalDistance + modulewidth, checkIntersetionAngle ? angle - 90 : angle + 90);
          secondPoint = google.maps.geometry.spherical.computeOffset(new google.maps.LatLng(d2[0].lat, d2[0].lng), iniitalDistance + modulewidth, checkIntersetionAngle ? angle - 90 : angle + 90);
          // Get intersection points
          int1 = this.findIntersection({ lat: firtPoint.lat(), lng: firtPoint.lng() }, { lat: secondPoint.lat(), lng: secondPoint.lng() }, d1);
          int2 = this.findIntersection({ lat: firtPoint.lat(), lng: firtPoint.lng() }, { lat: secondPoint.lat(), lng: secondPoint.lng() }, d2);
          if (int1 && int2) {
            new google.maps.Polygon({
              paths: [int1, int2],
              // map: this.map
            })
            this.addModuleToRoof('LANDSCAPE', [int2, int1], updatedPolygon, updatedPolyLine, angle, checkIntersetionAngle);
            iniitalDistance = iniitalDistance + modulewidth;
          }
        }
      }
    }

    // for (let r = 0; r < 50; r++) {
    //   iniitalDistance = iniitalDistance + gap * r + gap;

    //   firtPoint = google.maps.geometry.spherical.computeOffset(new google.maps.LatLng(d1[0].lat, d1[0].lng), iniitalDistance + moduleHegiht, checkIntersetionAngle ? angle - 90 : angle + 90);
    //   secondPoint = google.maps.geometry.spherical.computeOffset(new google.maps.LatLng(d2[0].lat, d2[0].lng), iniitalDistance + moduleHegiht, checkIntersetionAngle ? angle - 90 : angle + 90);

    //   new google.maps.Polygon({
    //     paths: [firtPoint, secondPoint],
    //     // map: this.map
    //   })

    //   const updatedPolygonLines = updatedPolyLine.getPath().getArray();
    //   let arr = [];
    //   for (let i = 0; i < updatedPolygonLines.length - 1; i++) {
    //     const line = [{ lat: updatedPolygonLines[i].lat(), lng: updatedPolygonLines[i].lng() }, { lat: updatedPolygonLines[i + 1].lat(), lng: updatedPolygonLines[i + 1].lng() }];
    //     int1 = this.findIntersection({ lat: firtPoint.lat(), lng: firtPoint.lng() }, { lat: secondPoint.lat(), lng: secondPoint.lng() }, line);
    //     if (int1) {
    //       arr.push(int1);
    //     }
    //   }
    //   if (arr.length === 2) {
    //     new google.maps.Polygon({
    //       // map: this.map,
    //       paths: [arr]
    //     })
    //     this.addModuleToRoof('PORTRAIT', arr, updatedPolygon, updatedPolyLine, angle, checkIntersetionAngle);
    //     iniitalDistance = iniitalDistance + moduleHegiht;
    //   } else {
    //     firtPoint = google.maps.geometry.spherical.computeOffset(new google.maps.LatLng(d1[0].lat, d1[0].lng), iniitalDistance + modulewidth, checkIntersetionAngle ? angle - 90 : angle + 90);
    //     secondPoint = google.maps.geometry.spherical.computeOffset(new google.maps.LatLng(d2[0].lat, d2[0].lng), iniitalDistance + modulewidth, checkIntersetionAngle ? angle - 90 : angle + 90);

    //     arr = [];
    //     for (let i = 0; i < updatedPolygonLines.length - 1; i++) {
    //       const line = [{ lat: updatedPolygonLines[i].lat(), lng: updatedPolygonLines[i].lng() }, { lat: updatedPolygonLines[i + 1].lat(), lng: updatedPolygonLines[i + 1].lng() }];
    //       int1 = this.findIntersection({ lat: firtPoint.lat(), lng: firtPoint.lng() }, { lat: secondPoint.lat(), lng: secondPoint.lng() }, line);
    //       if (int1) {
    //         arr.push(int1);
    //       }
    //     }
    //     if (arr.length === 2) {
    //       new google.maps.Polygon({
    //         // map: this.map,
    //         paths: [arr],
    //         strokeColor: 'yellow'
    //       })
    //       this.addModuleToRoof('LANDSCAPE', arr, updatedPolygon, updatedPolyLine, angle, checkIntersetionAngle);
    //       iniitalDistance = iniitalDistance + modulewidth;
    //     }
    //   }



    // }
  }

  addModuleToRoof(orientation, intersectionArr, updatedPolygon, updatedPolyLine, angle, checkIntersetionAngle) {
    if (intersectionArr.length === 2) {
      let int2 = intersectionArr[0];
      let int1 = intersectionArr[1];
      new google.maps.Polygon({
        paths: [int1, int2],
        // map: this.map
      })
      // Convert inches to meters
      let moduleHegiht: any = Number(this.inchesToMeters(this.moduleHegiht));
      let modulewidth: any = Number(this.inchesToMeters(this.modulewidth));
      const fireSetBack = 0.2;
      const gap = Number(this.inchesToMeters(this.distanceBwModules));
      // Get line Distance
      const lineDistance: any = google.maps.geometry.spherical.computeLength([new google.maps.LatLng(int1.lat, int1.lng), new google.maps.LatLng(int2.lat, int2.lng)]).toFixed(2);
      const distanceToAdd = orientation === 'LANDSCAPE' ? moduleHegiht : modulewidth;
      const ncols = Math.floor(lineDistance / distanceToAdd);
      for (let c = 0; c < ncols; c++) {
        const inyersectionPointAngle = this.calculateAngle(int1.lat, int1.lng, int2.lat, int2.lng);

        let startpoint1 = new google.maps.LatLng(int1.lat, int1.lng);
        if (c != 0) {
          startpoint1 = google.maps.geometry.spherical.computeOffset(startpoint1, distanceToAdd * c + gap * c, angle);
        }
        const aw = google.maps.geometry.spherical.computeOffset(startpoint1, orientation === 'LANDSCAPE' ? moduleHegiht : modulewidth, angle);
        const awa = google.maps.geometry.spherical.computeOffset(startpoint1, orientation === 'LANDSCAPE' ? modulewidth : moduleHegiht, checkIntersetionAngle ? angle + 90 : angle - 90);
        const awaa = google.maps.geometry.spherical.computeOffset(aw, orientation === 'LANDSCAPE' ? modulewidth : moduleHegiht, checkIntersetionAngle ? angle + 90 : angle - 90);
        // Add custom data
        let customObject = {
          roofIndex: Object.keys(this.updatedRoofs).length - 1,
          moduleIndex: this.roofModuleArr.length,
          id: `module_${new Date().getTime()}${this.roofModuleArr.length}`,
          isVisible: true,
        };
        // Add Module on roof
        const module = new google.maps.Polygon({
          paths: [startpoint1, aw, awaa, awa],
          strokeColor: '#FFA500',
          strokeWeight: 2,
          fillOpacity: 0.8,
          fillColor: '#FFFA41',
          strokeOpacity: 1.0,
          zIndex: 12
        });
        module.set('id', customObject.id);

        // Add Rails
        const railPoint1 = google.maps.geometry.spherical.computeOffset(startpoint1, (orientation === 'LANDSCAPE') ? -this.inchesToMeters(8) : -this.inchesToMeters(12), checkIntersetionAngle ? angle - 90 : angle + 90);
        const railPoint2 = google.maps.geometry.spherical.computeOffset(aw, (orientation === 'LANDSCAPE') ? -this.inchesToMeters(8) : -this.inchesToMeters(12), checkIntersetionAngle ? angle - 90 : angle + 90);
        const railPoint3 = google.maps.geometry.spherical.computeOffset(awa, (orientation === 'LANDSCAPE') ? this.inchesToMeters(8) : this.inchesToMeters(12), checkIntersetionAngle ? angle - 90 : angle + 90);
        const railPoint4 = google.maps.geometry.spherical.computeOffset(awaa, (orientation === 'LANDSCAPE') ? this.inchesToMeters(8) : this.inchesToMeters(12), checkIntersetionAngle ? angle - 90 : angle + 90);
        // Check module points lies inside rood
        let inside = true;
        module.getPath().forEach((path, index) => {
          const check = google.maps.geometry.poly.containsLocation(path, updatedPolygon);
          if (!check && inside) {
            inside = false;
            const updatedPolygonLines = updatedPolyLine.getPath().getArray();
            for (let i = 0; i < updatedPolygonLines.length - 1; i++) {
              const line = [{ lat: updatedPolygonLines[i].lat(), lng: updatedPolygonLines[i].lng() }, { lat: updatedPolygonLines[i + 1].lat(), lng: updatedPolygonLines[i + 1].lng() }];
              const polyline = new google.maps.Polyline({ path: line });
              if (google.maps.geometry.poly.isLocationOnEdge(path, polyline, 1e-6)) {
                inside = true;
              }
            }
          }
        });
        // Now check modules on obstacles
        if (inside && this.obstacles) {
          this.obstacles.forEach((obstacleObject) => {
            module.getPath().forEach((point) => {
              if (obstacleObject.obstacle.getBounds().contains(point)) {
                inside = false;
              }
            });
          });
        }
        if (inside) {
          const rail1 = new google.maps.Polyline({
            path: [railPoint1, railPoint2],
            // map: this.map,
            strokeWeight: 1,
            strokeOpacity: 1,
            strokeColor: "#2b2d47",
            zIndex: 11
          });
          const railDistance: any = google.maps.geometry.spherical.computeLength([railPoint1, railPoint2]).toFixed(2);

          const centerPoint = google.maps.geometry.spherical.computeOffset(railPoint1, railDistance / 2, angle);
          const inverterPoint1 = google.maps.geometry.spherical.computeOffset(centerPoint, -0.15, angle);
          const inverterPoint2 = google.maps.geometry.spherical.computeOffset(centerPoint, 0.15, angle);

          const inverterPoint3 = google.maps.geometry.spherical.computeOffset(inverterPoint1, -0.3, checkIntersetionAngle ? angle - 90 : angle + 90);
          const inverterPoint4 = google.maps.geometry.spherical.computeOffset(inverterPoint2, -0.3, checkIntersetionAngle ? angle - 90 : angle + 90);
          const inverterPolygon = new google.maps.Polygon({
            paths: [inverterPoint3, inverterPoint4, inverterPoint2, inverterPoint1],
            // map: this.map,
            zIndex: 11,
            strokeWeight: 0.5,
            strokeColor: 'black',
            strokeOpacity: 1,
            fillColor: '#FF0097',
            fillOpacity: 1,
          })

          const rail2 = new google.maps.Polyline({
            path: [railPoint3, railPoint4],
            // map: this.map
            zIndex: 11,
            strokeWeight: 1,
            strokeOpacity: 1,
            strokeColor: "#2b2d47"
          });
          module.setMap(this.map);
          // Push Inverters, rails, micro inverters
          this.modulesRailsInverter.push(module);


          // customObject = { ...customObject, rail1: rail1, rail2: rail2,
          //   microInverter: inverterPolygon };

          // this.modulesRailsInverter.push(module, inverterPolygon, rail1, rail2);
          // Add Module to JSON
          const modulePoints = module.getPath().getArray();
          modulePoints.push(modulePoints[0]);
          let moduleLines = [];
          for (let i = 0; i < modulePoints.length - 1; i++) {
            const pointCoordsDistance = (google.maps.geometry.spherical.computeLength([modulePoints[i], modulePoints[i + 1]]) * 3.28084).toFixed(2);
            const angle = this.calculateAngle(modulePoints[i].lat(), modulePoints[i].lng(), modulePoints[i + 1].lat(), modulePoints[i + 1].lng());
            const linesObj = {
              key: `key_line${((moduleLines.length) + 1)}`,
              angle: angle.toFixed(2),
              id: i + 1,
              length: pointCoordsDistance,
              unit: 'feet',
              start: { lat: modulePoints[i].lat(), lng: modulePoints[i].lng(), value: 0 },
              end: { lat: modulePoints[i + 1].lat(), lng: modulePoints[i + 1].lng(), value: pointCoordsDistance },
            };
            moduleLines.push(linesObj);
          }
          const labelMarker = this.addBlankLabelToModule(module);
          const moduleObj = {
            orientation,
            visible: true,
            lines: moduleLines,
            rails: [
              { id: `RAIL1`, lines: rail1.getPath().getArray() },
              { id: `RAIL2`, lines: rail2.getPath().getArray() }
            ],
            microInverter: inverterPolygon.getPath().getArray(),
            id: customObject.id,
            // module: module,
            // Add blank label to panel
            // labelMarker: labelMarker

          };
          this.roofModuleArr.push(moduleObj);
          // Pushing this.modulesObject, rails, etc
          customObject['rail1'] = rail1;
          customObject['rail2'] = rail2;
          customObject['inverterPolygon'] = inverterPolygon;
          customObject['module'] = module;
          customObject['labelMarker'] = labelMarker;
          customObject['lines'] = moduleLines;
          customObject['orientation'] = orientation;
          customObject['checkIntersetionAngle'] = checkIntersetionAngle;
          customObject['angle'] = angle;

          this.modulesObject.push(customObject);
          // Add Event listener
          google.maps.event.addListener(module, 'click', (event) => {
            if (this.currentTabIndex === 0) {
              const findModule = this.modulesObject.find((el) => el.id == module['id']);
              findModule.isVisible = !findModule.isVisible;
              if (findModule.isVisible) {
                // rail1.setMap(this.map);
                // rail2.setMap(this.map);
                // inverterPolygon.setMap(this.map);
                // Change Polygon Options
                module.setOptions({
                  fillColor: '#FFFA41'
                });
              } else {
                // rail1.setMap(null);
                // rail2.setMap(null);
                // inverterPolygon.setMap(null);
                // Change Polygon Options
                module.setOptions({
                  fillColor: 'white',
                });
                // Add Shapes to array
                // this.shapes.push([module, inverterPolygon, rail1, rail2]);
              }
              // Change visible in JSON
              const getRoof = this.roofsJSON['roofs'][findModule.roofIndex];
              if (getRoof) {
                const module = getRoof.modules.find((el) => el.id == findModule.id);
                module.visible = findModule.isVisible;
                localStorage.setItem('roofsJSON', JSON.stringify(this.roofsJSON));
              }
            }
            // String Layout Changes
            if (this.currentTabIndex === 2) {
              const findModule = this.modulesObject.find((el) => el.id == module['id']);
              if (findModule.isVisible) {
                this.addStringLayoutIndex(customObject);
              }
            }
          });
        }
      }
      // Now change obstacle editable functionality
      this.obstacles.forEach((obstacleObject: any) => {
        obstacleObject.obstacle.setOptions({
          editable: false,
          draggable: false
        });
      });
    }
  }

  drawFirstHouseRoofs() {
    const arr = [
      { lat: 27.705251, lng: -97.411697 },
      { lat: 27.705212, lng: -97.411617 },
      { lat: 27.705267, lng: -97.411635 }
    ];
    const roof = new google.maps.Polygon({
      map: this.map,
      paths: arr
    });

    const secondRoofArr = [
      { lat: 27.705212, lng: -97.411617 },
      { lat: 27.705389, lng: -97.411509 },
      { lat: 27.705377, lng: -97.411553 },
      { lat: 27.705363, lng: -97.411562 },
      { lat: 27.705354, lng: -97.411597 },
      { lat: 27.705338, lng: -97.411592 },
      { lat: 27.705267, lng: -97.411635 },
    ];

    const thirdRoofArr = [
      { lat: 27.705267, lng: -97.411635 },
      { lat: 27.705338, lng: -97.411592 },
      { lat: 27.705322, lng: -97.411653 },
      { lat: 27.705251, lng: -97.411697 },
    ];
    const thirdRoof = new google.maps.Polygon({
      map: this.map,
      paths: thirdRoofArr
    })



    const secondRoof = new google.maps.Polygon({
      map: this.map,
      paths: secondRoofArr
    });

    const fourthRoofArr = [
      { lat: 27.70537, lng: -97.411631 },
      { lat: 27.705354, lng: -97.411597 },
      { lat: 27.705338, lng: -97.411592 },
      { lat: 27.705322, lng: -97.411653 },
      { lat: 27.705349, lng: -97.411711 },
    ];
    const fourthRoof = new google.maps.Polygon({
      map: this.map,
      paths: fourthRoofArr
    });

    const fifthRoofArr = [
      { lat: 27.70544, lng: -97.411655 },
      { lat: 27.705349, lng: -97.411711 },
      { lat: 27.70537, lng: -97.411631 },
    ];

    const fifthRoof = new google.maps.Polygon({
      map: this.map,
      paths: fifthRoofArr
    });

    const sixthRoofArr = [
      { lat: 27.705389, lng: -97.411509 },
      { lat: 27.705416, lng: -97.411566 },
      { lat: 27.705377, lng: -97.411553 }
    ];

    const sixthRoof = new google.maps.Polygon({
      map: this.map,
      paths: sixthRoofArr
    });

    const seventhRoofArr = [

      { lat: 27.705402, lng: -97.411575 },
      { lat: 27.70544, lng: -97.411655 },
      { lat: 27.70537, lng: -97.411631 },
      { lat: 27.705354, lng: -97.411597 },
      { lat: 27.705363, lng: -97.411562 },
    ];

    const seventhRoof = new google.maps.Polygon({
      map: this.map,
      paths: seventhRoofArr
    });

    this.addModuleCal(arr, roof);
    // this.addModuleCal(secondRoofArr, secondRoof);
    // this.addModuleCal(thirdRoofArr, thirdRoof);
    // this.addModuleCal(fourthRoofArr, fourthRoof);
    // this.addModuleCal(fifthRoofArr, fifthRoof);
    // this.addModuleCal(sixthRoofArr, sixthRoof);
    // this.addModuleCal(seventhRoofArr, seventhRoof);

    // this.removePolygonAndAddLines(arr, roof, 'roofId_1');
    // this.removePolygonAndAddLines(secondRoofArr, secondRoof, 'roofId_2');
    // this.removePolygonAndAddLines(thirdRoofArr, thirdRoof, 'roofId_3');
    // this.removePolygonAndAddLines(fourthRoofArr, fourthRoof, 'roofId_4');
    // this.removePolygonAndAddLines(fifthRoofArr, fifthRoof, 'roofId_5');
    // this.removePolygonAndAddLines(sixthRoofArr, sixthRoof, 'roofId_6');
    // this.removePolygonAndAddLines(seventhRoofArr, seventhRoof, 'roofId_7');

  }

  drawSecondHouseRoofs() {
    const firstRoofArr = [
      { lat: 28.007799, lng: -80.625547 },
      { lat: 28.007799, lng: -80.625698 },
      { lat: 28.007756, lng: -80.625649 },
      { lat: 28.007767, lng: -80.625637 },
      { lat: 28.007767, lng: -80.625583 }
    ];
    const firstRoof = new google.maps.Polygon({
      map: this.map,
      paths: firstRoofArr
    });

    const secondRoofArr = [
      { "lat": 28.007667177696167, "lng": -80.62565000588543 },
      { "lat": 28.00775479667479, "lng": -80.62564933533318 },
      { lat: 28.007799, lng: -80.625698 },
      { "lat": 28.00774354829638, "lng": -80.6256982856477 },
      { "lat": 28.007742956276427, "lng": -80.6257257782901 },
      { "lat": 28.007638168694292, "lng": -80.62572644884236 },
      { "lat": 28.00763994475587, "lng": -80.62569761509545 },
      { "lat": 28.00762455222132, "lng": -80.6256982856477 },

    ];

    const secondRoof = new google.maps.Polygon({
      map: this.map,
      paths: secondRoofArr
    });

    const thirdRoofArr = [{ "lat": 28.007624532301026, "lng": -80.62569816763808 }, { "lat": 28.007624236290745, "lng": -80.62557076270987 }, { "lat": 28.007661533582244, "lng": -80.62561367805411 }, { "lat": 28.007662421612835, "lng": -80.62564385290553 }, { "lat": 28.007667749796248, "lng": -80.62564988787581 }];

    const thirdRoof = new google.maps.Polygon({
      map: this.map,
      paths: thirdRoofArr
    });

    const fourthRoofArr = [{ "lat": 28.007624547873426, "lng": -80.62557160738521 }, { "lat": 28.007699142443304, "lng": -80.62557227793747 }, { "lat": 28.00766184516483, "lng": -80.6256138521772 }];

    const fourthRoof = new google.maps.Polygon({
      map: this.map,
      paths: fourthRoofArr
    });

    const fifthRoofArr = [{ "lat": 28.00775567605676, "lng": -80.62564893303961 }, { "lat": 28.007666873038133, "lng": -80.62564960359187 }, { "lat": 28.0076621368751, "lng": -80.6256425627932 }, { "lat": 28.007700914203934, "lng": -80.62559864162058 }, { "lat": 28.00773525136897, "lng": -80.62559696523995 }, { "lat": 28.007766628424005, "lng": -80.62563652782292 }];

    const fifthRoof = new google.maps.Polygon({
      map: this.map,
      paths: fifthRoofArr
    });

    const sixthRoofArr = [{ "lat": 28.0077662909098, "lng": -80.62558249737431 }, { "lat": 28.007767474949446, "lng": -80.62563614155461 }, { "lat": 28.007735209864666, "lng": -80.62559624369551 }, { "lat": 28.00773461784469, "lng": -80.62554762865712 }];

    const sixthRoof = new google.maps.Polygon({
      map: this.map,
      paths: sixthRoofArr
    });

    const seventhRoofArr = [
      { "lat": 28.007735505874667, "lng": -80.62554662282874 },
      { "lat": 28.00779885199509, "lng": -80.62554729338099 },
      { "lat": 28.007766586919722, "lng": -80.62558182682206 }
    ];

    const seventhRoof = new google.maps.Polygon({
      map: this.map,
      paths: seventhRoofArr
    });


    this.addModuleCal(firstRoofArr, firstRoof);
    this.addModuleCal(secondRoofArr, secondRoof);
    this.addModuleCal(thirdRoofArr, thirdRoof);
    this.addModuleCal(fourthRoofArr, fourthRoof);
    this.addModuleCal(fifthRoofArr, fifthRoof);
    this.addModuleCal(sixthRoofArr, sixthRoof);
    this.addModuleCal(seventhRoofArr, seventhRoof);
  }

  calculateAngle(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const radianLat1 = this.degreesToRadians(lat1);
    const radianLat2 = this.degreesToRadians(lat2);
    const radianDiffLng = this.degreesToRadians(lon2 - lon1);

    const y = Math.sin(radianDiffLng) * Math.cos(radianLat2);
    const x = Math.cos(radianLat1) * Math.sin(radianLat2) -
      Math.sin(radianLat1) * Math.cos(radianLat2) * Math.cos(radianDiffLng);

    const angleRad = Math.atan2(y, x);
    const angleDeg = this.radiansToDegrees(angleRad);

    return (angleDeg + 360) % 360; // Convert to positive angle in degrees
  }

  degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  radiansToDegrees(radians: number): number {
    return radians * (180 / Math.PI);
  }

  inchesToMeters(inches): any {
    return (inches * 0.0254).toFixed(2);
  }

  findIntersection(startPoint: any, endPoint: any, eaveLine: any) {
    const lat1 = startPoint.lat, lng1 = startPoint.lng;
    const lat2 = endPoint.lat, lng2 = endPoint.lng;
    const lat3 = eaveLine[0].lat, lng3 = eaveLine[0].lng;
    const lat4 = eaveLine[1].lat, lng4 = eaveLine[1].lng;
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
      const marker = new google.maps.Marker({
        position: { lat: intersectionX, lng: intersectionY },
        // map: this.map
      });
      return { lat: intersectionX, lng: intersectionY }
    }
    return null
  }

  initializeRoofLineForm(roofArr?: any, roofId?: string): void {
    this.roofLineForm = this.fb.group({
      roof: ['', []],
      roofLines: this.fb.array([
      ]),
      addModule: [true, []],
      roofLinesArr: [roofArr, []],
      roofId: [roofId, []],
    });
  }

  initializeLineTypeForm(roofArr?: any): void {
    this.lineTypeForm = this.fb.group({
      roofId: ['', []],
      lineId: ['', []],
      lineType: ['', [Validators.required]],
    });
  }

  initializeLabelForm(): void {
    this.labelForm = this.fb.group({
      labelText: ['', [Validators.required]],
      labelColor: ['', [Validators.required]],
      labelRotation: ['', [Validators.required]],
    });
  }

  get getRoofLines(): FormArray {
    return this.roofLineForm.get("roofLines") as FormArray;
  }

  addRoofLine(data?: any): FormGroup {
    return this.fb.group({
      lineIndex: [(data) ? data.lineIndex : '', [Validators.required]],
      lines: [(data) ? data.lines : '', [Validators.required]],
      fireSetBack: [(data) ? data.fireSetBack : '', [Validators.required, Validators.pattern('^-?[0-9]\\d*(\\.\\d{1,3})?$')]],
      lineType: [(data) ? data.lineType : '', [Validators.required]]
    });
  }

  addLine(data?: any) {
    this.getRoofLines.push(this.addRoofLine(data));
  }

  addLineToFormonOverlayComplete(arr: any, roofId?: string) {
    this.initializeRoofLineForm(arr);
    for (let i = 0; i < arr.length - 1; i++) {
      const data = {
        lineIndex: i,
        lines: [arr[i], arr[i + 1]]
      };
      this.addLine(data);
    }
    this.roofLineForm.patchValue({
      roofId: roofId
    });
    this.showRoofLinesForm = true;
  }

  highLightRoofLine(lineIndex: number) {
    this.removeHighLightedLine();
    const clickedLine = this.getRoofLines.at(lineIndex).value;
    if (clickedLine) {
      this.activeLine = new google.maps.Polyline({
        path: clickedLine.lines,
        map: this.map,
        strokeColor: 'yellow',
        zIndex: 99
      })
    }
  }

  removeHighLightedLine() {
    if (this.activeLine) {
      this.activeLine.setMap(null);
    }
  }

  submitRoofLineForm() {
    if (this.roofLineForm.invalid) {
      this.toastr.error('Please fill all inputs');
      return;
    }
    this.removeHighLightedLine();
    const formValues = this.roofLineForm.value;
    this.allRoofsObjects[formValues.roofId]['dataAdded'] = true;
    this.allRoofsObjects[formValues.roofId]['formValues'] = formValues;
    const allLines = this.allRoofLines.filter((roof) => roof.roofId === formValues.roofId);
    allLines.forEach((line) => {
      line.polyline.setMap(null);
    });
    let roofPoints = [];
    let eaveLine = [];
    // formValues.roofLines.forEach((el) => {
    //   const lineDistance = this.calculateLineDistance(el.lines);
    //   if (el.lineType != 'eave') {
    //     if (eaveLine.length === 0) {
    //       roofPoints.push({ lat: el.lines[0].lat(), lng: el.lines[0].lng(), fireSetBack: el.fireSetBack, lineIndex: el.lineIndex });
    //     } else {
    //       eaveLine.push({ lat: el.lines[0].lat(), lng: el.lines[0].lng(), fireSetBack: el.fireSetBack, lineIndex: el.lineIndex });
    //     }
    //   } else {
    //     eaveLine.push({ lat: el.lines[0].lat(), lng: el.lines[0].lng(), fireSetBack: el.fireSetBack, lineIndex: el.lineIndex });
    //   }
    // });
    // // if there is no eave line then search for ridge line
    // if (eaveLine.length === 0) {
    //   eaveLine = [];
    //   roofPoints = [];
    //   // Now loop on lines
    //   formValues.roofLines.forEach((el) => {
    //     if (el.lineType != 'ridge') {
    //       if (eaveLine.length === 0) {
    //         roofPoints.push({ lat: el.lines[0].lat(), lng: el.lines[0].lng(), fireSetBack: el.fireSetBack, lineIndex: el.lineIndex });
    //       } else {
    //         eaveLine.push({ lat: el.lines[0].lat(), lng: el.lines[0].lng(), fireSetBack: el.fireSetBack, lineIndex: el.lineIndex });
    //       }
    //     } else {
    //       eaveLine.push({ lat: el.lines[0].lat(), lng: el.lines[0].lng(), fireSetBack: el.fireSetBack, lineIndex: el.lineIndex });
    //     }
    //   });
    // }
    const lineWithLengths = [];
    formValues.roofLines.forEach((el) => {
      if (el.lineType === 'eave' || el.lineType === 'ridge') {
        const lineDistance = this.calculateLineDistance(el.lines);
        lineWithLengths.push({ length: lineDistance, lineIndex: el.lineIndex, lineType: el.lineType });
      }
    });
    lineWithLengths.sort(function (a, b) {
      return parseFloat(b.length) - parseFloat(a.length);
    });
    if (lineWithLengths.length > 0) {
      roofPoints = [];
      eaveLine = [];
      formValues.roofLines.forEach((el) => {
        if (el.lineIndex === lineWithLengths[0].lineIndex) {
          eaveLine.push({ lat: el.lines[0].lat(), lng: el.lines[0].lng(), fireSetBack: el.fireSetBack, lineIndex: el.lineIndex });
        } else {
          if (eaveLine.length === 0) {
            roofPoints.push({ lat: el.lines[0].lat(), lng: el.lines[0].lng(), fireSetBack: el.fireSetBack, lineIndex: el.lineIndex });
          } else {
            eaveLine.push({ lat: el.lines[0].lat(), lng: el.lines[0].lng(), fireSetBack: el.fireSetBack, lineIndex: el.lineIndex });
          }
        }
      });
    } else {
      roofPoints = [];
      eaveLine = [];
      formValues.roofLines.forEach((el) => {
        eaveLine.push({ lat: el.lines[0].lat(), lng: el.lines[0].lng(), fireSetBack: el.fireSetBack, lineIndex: el.lineIndex });
      });
    }
    roofPoints = [...eaveLine, ...roofPoints];
    const seventhRoof = new google.maps.Polygon({
      map: this.map,
      paths: roofPoints,
      strokeColor: 'transparent',
      strokeWeight: 2,
      fillColor: "#FF9393",
      fillOpacity: 0.7,
      zIndex: -50
    });
    this.createRoofJSON(formValues);
    this.roofModuleArr = [];
    this.modulesRailsInverter = [];
    if (formValues.addModule) {
      this.addModuleCal(roofPoints, seventhRoof, formValues);
      this.roofsJSON['roofs'][Object.keys(this.roofsJSON['roofs']).length - 1]['modules'] = this.roofModuleArr;
      // this.shapes.push([...this.modulesRailsInverter]);
      localStorage.setItem('roofsJSON', JSON.stringify(this.roofsJSON));
    }
    this.showRoofLinesForm = false;
  }

  calculateLineDistance(linesArr: any) {
    return google.maps.geometry.spherical.computeLength(linesArr).toFixed(2);
  }

  handleSidebarMenuClick(index: any) {
    localStorage.setItem('roofsJSON', JSON.stringify(this.roofsJSON));
    this.drawingManager.setMap(null);
    // Close Equipment popup if open
    this.showSidebar = false;
    switch (index) {
      case 'hand': {
        this.enableSelect();
        break;
      }
      case 'polygon': {
        this.drawDriveway();
        break;
      }
      case 'property-line': {
        this.drawPropertyLine();
        break;
      }
      case 'tree': {
        this.addObjects();
        break;
      }
      case 'roof': {
        this.drawRoof();
        break;
      }
      case 'handundo': {
        this.removeLastShape();
        break;
      }
      case 'handleredo': {
        this.redoLastShape();
        break;
      }
      case 'togglesidebar': {
        this.toggleSidebar();
        break;
      }
      case 'text': {
        this.addCustomText();
        break;
      }
      case 'polyline': {
        this.enablePolyline();
        break;
      }
      case 'circle': {
        this.drawCircleObstacle();
        break;
      }
      case 'rectangle': {
        this.drawRectangleObstacle();
        break;
      }
      case 'adjustmap': {
        this.activeTool = 'adjustmap';
        this.adjustMap('rotate', 20);
        break;
      }
      case 1: {
        this.activeTool = 'hand';
        break;
      }
      case 'reset': {
        this.enableSelect();
        break;
      }
    }
  }

  resetDrawingMode() {
    google.maps.event.addListener(this.drawingManager, 'overlaycomplete', (event: any) => {
      this.drawingManager.setDrawingMode(null);
    });
  }

  enablePolyline(): void {
    // Setting drawing mode with all control options
    this.drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.POLYLINE,
      drawingControl: false,
      polylineOptions: {
        editable: true,
        strokeColor: '#069AF3',
        strokeWeight: 3,
        zIndex: 1
      },
      map: this.map
    });
    // Get polyline complete event
    google.maps.event.addListener(this.drawingManager, 'polylinecomplete', (polyline: any) => {
      const timestamp = new Date().getTime();
      polyline.set('id', 'polyline_' + timestamp);
      this.allOtherHouseObjects.push(polyline);
      google.maps.event.addListener(polyline, 'click', () => {
        this.openPolylineInfoWindow(polyline);
      });
      this.saveDataToLocalStorage(polyline, 'polyline');
      google.maps.event.addListener(polyline.getPath(), 'set_at', () => {
        this.savePolylineData(polyline, '');
      });
    });
    this.resetDrawingMode();
  }

  openPolylineInfoWindow(polyline: any) {
    this.showInfowindow = true;
    this.showObjectInfoWindow = 'polyline';
    if (polyline) {
      this.polyLineObject.polylineThicknessValue = 3;
      if (polyline.strokeColor) {
        this.polyLineObject.polylineColor = polyline.strokeColor;
      }
      if (polyline.strokeWeight) {
        this.polyLineObject.polylineThicknessValue = polyline.strokeWeight;
      }
      // this.calculatePolylineTotalLength(polyline);
      setTimeout(() => {
        let polylineColorPicker = document.getElementById('polylineColorPicker') as any;
        let polylineDashed = document.getElementById('polylineDashed') as any;
        let polylineSolid = document.getElementById('polylineSolid') as any;
        let polylineThickness = document.getElementById('polylineThickness') as HTMLInputElement;
        let polylineThicknessSliderValue = document.getElementById('polylineThicknessSliderValue');
        let removePolyline = document.getElementById('removePolyline') as HTMLElement;
        polylineColorPicker.addEventListener('input', () => {
          this.polyLineObject.polylineColor = polylineColorPicker.value;
        })
        if (polylineColorPicker) {
          polylineColorPicker.addEventListener('input', () => {
            const newColor = polylineColorPicker.value;
            polyline.setOptions({
              strokeColor: newColor
            })
            this.savePolylineData(polyline, '');
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
            });
            polyline.solid = false;
            this.savePolylineData(polyline, '');
          }
        })
        polylineSolid.addEventListener('click', () => {
          if (polylineSolid) {
            polyline.setOptions({
              strokeOpacity: 1,
              icons: [] // Remove the icons property to make it a solid line
            });
            polyline.solid = true;
            this.savePolylineData(polyline, '');
          }
        })
        if (polylineThickness && polylineThicknessSliderValue) {
          polylineThickness.addEventListener('input', () => {
            const newSize = Number(polylineThickness.value);
            polyline.setOptions({
              strokeWeight: newSize, // Change the value to the desired thickness
            });
            if (polylineThicknessSliderValue) {
              polylineThicknessSliderValue.innerText = newSize.toString();
            }
            this.savePolylineData(polyline, '');
          });
        }
        if (removePolyline) {
          removePolyline.addEventListener('click', () => {
            let localStorageData = localStorage.getItem('mapData');
            if (localStorageData) {
              let parsedData = JSON.parse(localStorageData);
              parsedData.Drawings.polyline = parsedData.Drawings.polyline.filter((item: any) => item?.id !== polyline?.id);
              localStorage.setItem('mapData', JSON.stringify(parsedData));
              this.polylineDrawingArray = this.polylineDrawingArray.filter((item: any) => item?.id !== polyline?.id);
              polyline.setMap(null); // Remove the polyline from the map
              this.showInfowindow = false;
            }
          });
        }
      }, 1000);
    }

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

  drawCircleObstacle() {
    const self = this;
    this.currentTabIndex = this.currentTabIndex;
    this.drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.CIRCLE,
      drawingControl: false,
      drawingControlOptions: {
        position: google.maps.ControlPosition.LEFT_BOTTOM,
      },
      circleOptions: {
        editable: true,
        draggable: true,
        strokeWeight: 1
      }
    });

    google.maps.event.addListener(this.drawingManager, 'overlaycomplete', function (event: any) {
      self.shapes.push(event.overlay);
      const circle = event.overlay;
      self.handleSidebarMenuClick(1);
      self.obstacles.push({ type: 'circle', obstacle: circle });

      // Add Click Event on roof
      google.maps.event.addListener(event.overlay, 'click', (event) => {
      });
    });

    this.drawingManager.setMap(this.map);
  }

  drawRectangleObstacle() {
    const self = this;
    this.currentTabIndex = this.currentTabIndex;
    this.drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.RECTANGLE,
      drawingControl: false,
      drawingControlOptions: {
        position: google.maps.ControlPosition.LEFT_BOTTOM,
      },
      rectangleOptions: {
        editable: true,
        draggable: true,
        strokeWeight: 1
      }
    });

    google.maps.event.addListener(this.drawingManager, 'overlaycomplete', function (event: any) {
      self.shapes.push(event.overlay);
      const rectangle = event.overlay;
      self.handleSidebarMenuClick(1);
      self.obstacles.push({ type: 'rectangle', obstacle: rectangle });
      // Add Click Event on roof
      google.maps.event.addListener(event.overlay, 'click', (event) => {
      });
    });

    this.drawingManager.setMap(this.map);
  }

  toggleSidebar() {
    this.showSidebar = !this.showSidebar;
  }

  sideBarToggle(event: any): void {
    this.toggle = event;
    this.fetchAction(event);
  }

  fetchAction(event: any) {
    if (!event.equipment) {
      return;
    }
    switch (event.equipment) {
      case 'UM':
        this.addEquipment('UM')
        break;
      case 'MSP':
        this.addEquipment("MSP")
        break;
      case 'AC (Fused)':
        this.addEquipment("AC (Fused)");
        break;
      case 'AC (Non-Fused)':
        this.addEquipment("AC (Non-Fused)");
        break;
      case 'DG':
        this.addEquipment("DG")
        break;
      case 'IQ':
        this.addEquipment("IQ")
        break;
    }
    this.showSidebar = false;
  }

  addEquipment(title: string, equipmentsArray?: any) {
    let equipmentTitle = title;
    if (equipmentTitle == "AC (Fused)" || equipmentTitle == "AC (Non-Fused)") {
      equipmentTitle = "AC";
    }
    // Define polygon coordinates (example coordinates)
    let polygon: google.maps.Polygon
    let polygonCoords = [
      { lat: this.currentSelectedLocation.lat() + 0.000005, lng: this.currentSelectedLocation.lng() + 0.000005 },
      { lat: this.currentSelectedLocation.lat() + 0.000005, lng: this.currentSelectedLocation.lng() - 0.000005 },
      { lat: this.currentSelectedLocation.lat() - 0.000005, lng: this.currentSelectedLocation.lng() - 0.000005 },
      { lat: this.currentSelectedLocation.lat() - 0.000005, lng: this.currentSelectedLocation.lng() + 0.000005 }
    ];
    const timestamp = new Date().getTime();
    if (!equipmentsArray) {
      const checkMarkerExist = this.equipmentsArrayFinal.find(data => data.title === title);
      if (!checkMarkerExist) {
        if (title == "UM" || title == "DG") {
          this.drawEquipmentWithCircle(equipmentTitle);
        } else {
          // Create the polygon
          polygon = new google.maps.Polygon({
            paths: polygonCoords,
            editable: false,
            draggable: true,
            map: this.map,
            fillColor: "#FFFFFF",
            strokeColor: "#70D454",
            strokeWeight: 1,
            fillOpacity: 1
          });
          polygon.set('id', 'equipment_' + timestamp);
          let labelMarker: google.maps.Marker | undefined; // Define label marker outside to make it accessible
          // Add label marker to the center of the polygon
          if (polygon instanceof google.maps.Polygon) {
            const center = this.calculatePolygonCenter(polygon.getPath().getArray());
            labelMarker = new google.maps.Marker({
              position: center,
              draggable: false,
              icon: {
                url: "../../assets/transparent_img.png",
                scaledSize: new google.maps.Size(1, 1),
                anchor: new google.maps.Point(0.5, 0.5),
              },
              crossOnDrag: false,
              map: this.map,
              label: {
                text: `${equipmentTitle}`,
                color: "#70D454",
                fontSize: "8px",
                className: "equipmentLabel_" + timestamp,
              }
            });
            polygon.set('equipmentText', labelMarker);
            polygon.set('title', title);
            polygon.set('scaleSize', 1);
            polygon.set('rotation', 0);
          }
          this.addListnerToEquipment(polygon, labelMarker, polygonCoords, 'new');
          this.equipmentsArrayFinal.push(polygon);
          // Now pushing data to array
          this.treeAndOtherStructure.push(labelMarker, polygon);
          // Save data to local storage
          this.saveDataToLocalStorage(polygon, "equipment");
          if (title == "AC (Fused)") {
            this.drawAcDisconnect(polygon);
          }
          if (equipmentTitle == "AC (Non-Fused)") {
            this.drawAcDisconnectNoneFused(polygon);
          }
        }
      } else {
        this.toastr.error("Equipment Already Exists");
      }

    } else {
      equipmentsArray.forEach((data: any) => {
        if (data.title == "UM" || data.title == "DG") {
          this.drawEquipmentWithCircle(data.title, data);
        } else {
          polygon = new google.maps.Polygon({
            paths: data.paths,
            editable: false,
            draggable: this.currentTabIndex === 0 ? true : false,
            map: this.map,
            fillColor: "#FFFFFF",
            strokeColor: "#70D454",
            strokeWeight: 1,
            fillOpacity: 1,
            zIndex: 50
          });
          polygon.set('id', data.id);
          let labelMarker: google.maps.Marker | undefined;
          // Add label marker to the center of the polygon
          if (polygon instanceof google.maps.Polygon) {
            const center = this.calculatePolygonCenter(polygon.getPath().getArray());
            labelMarker = new google.maps.Marker({
              position: center,
              draggable: false,
              icon: {
                url: "../../assets/transparent_img.png",
                scaledSize: new google.maps.Size(1, 1),
                anchor: new google.maps.Point(0.5, 0.5),
              },
              crossOnDrag: false,
              map: this.map,
              label: {
                text: data.equipmentText.text,
                color: "#70D454",
                fontSize: "10px",
                className: data.equipmentText.className,
              }
            });
            polygon.set('equipmentText', labelMarker);
            polygon.set('title', data.title);
            polygon.set('rotation', data.rotation);
            polygon.set('scaleSize', data.scaleSize);
          }
          this.addListnerToEquipment(polygon, labelMarker, polygonCoords, 'existing');
          this.equipmentsArrayFinal.push(polygon);
          // For Ac Disconnect
          if (data.title == "AC (Fused)") {
            this.drawAcDisconnect(polygon);
          }
          if (data.title == "AC (Non-Fused)") {
            this.drawAcDisconnectNoneFused(polygon);
          }
          // Now pushing data to array
          this.treeAndOtherStructure.push(labelMarker, polygon);
        }
      });
    }
  }

  drawEquipmentWithCircle(title,data?) {
    let labelMarker;
      const timestamp = new Date().getTime();
    if(!data){
      const circle = new google.maps.Circle({
        fillColor: "#FFFFFF",
        strokeColor: "#70D454",
        strokeWeight: 1,
        fillOpacity: 1,
        map: this.map,
        draggable:true,
        editable:false,
        center: { lat: this.currentSelectedLocation.lat(), lng:  this.currentSelectedLocation.lng() },
        radius: 0.5,
        zIndex: 1
      });
      const boundsCoords = this.getPolygonBoundsForEquipmentWithCircle(circle);
      const polygon = new google.maps.Polygon({
        paths:boundsCoords,
        fillColor: "#FFFFFF",
        strokeColor: "#70D454",
        strokeWeight: 1,
        fillOpacity: 1,
        zIndex: 1,
        map: this.map,
      });
  
      if (circle instanceof google.maps.Circle) {
        const center = circle.getCenter();
        labelMarker = new google.maps.Marker({
          position: center,
          draggable: false,
          icon: {
            url: "../../assets/transparent_img.png",
            scaledSize: new google.maps.Size(1, 1),
            anchor: new google.maps.Point(0.5, 0.5),
          },
          crossOnDrag: false,
          map: this.map,
          title: title,
          label: {
            text: title,
            color: "#70D454",
            fontSize: "8px",
            className: "equipmentLabel_" + timestamp,
          }
        });
        polygon.set('equipmentText', labelMarker);
        polygon.set('id', 'equipment_' + timestamp);
        polygon.set('title',title);
        polygon.set('scaleSize', 1);
        polygon.set('rotation', 0);
        polygon.set('circle',circle)
      }
      this.addListenerToEquipmentWithCircle(circle,polygon,labelMarker);
      this.equipmentsArrayFinal.push(polygon);
      this.saveDataToLocalStorage(polygon, "equipment");
      this.saveEquipmentsData(polygon);
      // Now pushing data to array
      this.treeAndOtherStructure.push(labelMarker, polygon, circle);
    } else {
      const circle = new google.maps.Circle({
        fillColor: "#FFFFFF",
        strokeColor: "#70D454",
        strokeWeight: 1,
        fillOpacity: 1,
        map: this.map,
        draggable: this.currentTabIndex === 0 ? true : false,
        editable:false,
        center: data.circle.center,
        radius: data.circle.radius,
        zIndex:1
      });
      const boundsCoords = this.getPolygonBoundsForEquipmentWithCircle(circle);
      const polygon = new google.maps.Polygon({
        paths:data.paths,
        fillColor: "#FFFFFF",
        strokeColor: "#70D454",
        strokeWeight: 1,
        fillOpacity: 1,
        map: this.map,
      });
  
      if (circle instanceof google.maps.Circle) {
        const center = circle.getCenter();
        labelMarker = new google.maps.Marker({
          position: center,
          draggable: false,
          icon: {
            url: "../../assets/transparent_img.png",
            scaledSize: new google.maps.Size(1, 1),
            anchor: new google.maps.Point(0.5, 0.5),
          },
          crossOnDrag: false,
          map: this.map,
          title:data.equipmentText.title,
          label: {
            text: data.equipmentText.text,
            color: "#70D454",
            fontSize: data.equipmentText.fontSize,
            className: data.equipmentText.className,
          }
        });
        polygon.set('equipmentText',labelMarker);
        polygon.set('id',data.id);
        polygon.set('title',data.title);
        polygon.set('scaleSize', data.scaleSize);
        polygon.set('rotation', data.rotation);
        polygon.set('circle',circle);
      }
      this.addListenerToEquipmentWithCircle(circle,polygon,labelMarker,"existing");
      this.equipmentsArrayFinal.push(polygon);
      // Now pushing data to array
      this.treeAndOtherStructure.push(labelMarker, polygon, circle);
    }
  }

  getPolygonBoundsForEquipmentWithCircle(circle){
    let circleBounds = circle.getBounds();
    let boundsCoords = [
      { lat: circleBounds.getNorthEast().lat(), lng: circleBounds.getNorthEast().lng() },
      { lat: circleBounds.getNorthEast().lat(), lng: circleBounds.getSouthWest().lng() },
      { lat: circleBounds.getSouthWest().lat(), lng: circleBounds.getSouthWest().lng() },
      { lat: circleBounds.getSouthWest().lat(), lng: circleBounds.getNorthEast().lng() }
  ];
  return boundsCoords
  }

  addListenerToEquipmentWithCircle(circle, polygon, labelMarker, type?){
    if (type == 'existing') {
      setTimeout(() => {
        let currentLabelClass = document.getElementsByClassName(polygon['equipmentText'].label.className) as any;
        if(currentLabelClass){
          currentLabelClass[0].style.transform = `rotate(${polygon["rotation"]}deg)`;
        }
      }, 1000);
    }
    circle.addListener('click',() => {
      if (circle && this.currentTabIndex === 0) {
        this.showInfowindow = true;
        this.showObjectInfoWindow = 'equipment';

        setTimeout(() => {
          let currentSliderValue = 0;
          const inputEquipmentImgSize = document.getElementById('inputEquipmentImgSize') as HTMLInputElement;
          const removeEquipment = document.getElementById('removeEquipment') as HTMLElement;
          const sliderValue = document.getElementById('sliderValue') as any;
          if (polygon['scaleSize']) {
            this.equipmentImgNgModel = polygon["scaleSize"];
            sliderValue.value = polygon["scaleSize"];
          }
          inputEquipmentImgSize?.addEventListener("input", () => {
            const scaleValue = parseFloat(inputEquipmentImgSize.value);
            const equipmentLabel = labelMarker.getLabel() as google.maps.MarkerLabel;
            if (equipmentLabel) {
              equipmentLabel.fontSize = `${scaleValue * 8 + 'px'}`; // Set your desired font size
              labelMarker.setLabel(equipmentLabel);
            this.saveEquipmentsData(polygon);
            }
            circle.setRadius(scaleValue*0.5);
            polygon.set('scaleSize', scaleValue);
            this.updateEquipmentWithCircle(labelMarker,polygon['rotation'],polygon['scaleSize'],polygon);
            this.saveEquipmentsData(polygon);
          });
          const handleSliderChange = (args: any) => {
            currentSliderValue = args.value
            this.updateEquipmentWithCircle(labelMarker, currentSliderValue, polygon['scaleSize'] , polygon);
          };
          const sliderElement: any = $("#slider1");
          sliderElement.roundSlider({
            value: 0,
            min: 0,
            max: 360,
            radius: 70,
            // drag: handleSliderChange,
            change: handleSliderChange,
          });
          // sliderElement.roundSlider("option", "drag", false);
          sliderElement.find('.rs-handle').off('mousedown touchstart');
          removeEquipment.addEventListener(("click"), () => {
            if (polygon) {
              this.equipmentsArrayFinal = this.equipmentsArrayFinal.filter((item: any) => item?.id !== polygon['id']);
            }
            polygon.setMap(null);
            labelMarker.setMap(null);
            circle.setMap(null);
            this.showInfowindow = false;
            // Now Update local storage data
            let localStorageData = localStorage.getItem('mapData');
            let parsedData = JSON.parse(localStorageData);
            parsedData.equipments = parsedData.equipments.filter((item: any) => item?.id !== polygon['id']);
            localStorage.setItem('mapData', JSON.stringify(parsedData));
          });
        }, 500);
      }
    })
    circle.addListener('drag',() => {
      let boundsCoords = this.getPolygonBoundsForEquipmentWithCircle(circle);
      polygon.setPaths(boundsCoords);
      labelMarker.setPosition(circle.getCenter());
      this.updateEquipmentWithCircle(labelMarker,polygon['rotation'],polygon['scaleSize'],polygon);
      this.saveEquipmentsData(polygon);
    });
    circle.addListener('radius_changed',() => {
      let boundsCoords = this.getPolygonBoundsForEquipmentWithCircle(circle);
      polygon.setPaths(boundsCoords);
      labelMarker.setPosition(circle.getCenter());
      this.saveEquipmentsData(polygon);
    })
    this.hideShowEquipments();
  }

  hideShowEquipments(){
    google.maps.event.addListener(this.map, 'zoom_changed', () => {
      const currentZoom = this.map.getZoom();
      if (currentZoom >= 21.5) {
        this.equipmentsArrayFinal.forEach((data) => {
          data.setOptions({
            fillOpacity: 1,
            strokeOpacity: 1
          })
          setTimeout(() => {
            let equipmentClassName = document.getElementsByClassName(data.equipmentText.label.className) as any;
            if (equipmentClassName[0]) {
              equipmentClassName[0].style.display = "block";
            }
          }, 200);
          if(data.title == "UM" || data.title == "DG"){
            data.circle.setOptions({
              fillOpacity: 1,
              strokeOpacity: 1
            })
          }
        })
        this.showHideAcDisconnectLines(1);
        if(this.rectangleAcDisconnect){
          this.rectangleAcDisconnect.setOptions({
            strokeColor: "#70D454",
            strokeWeight: 1,
            fillOpacity: 0,
            strokeOpacity: 1
          })
        }
      } else {
        this.equipmentsArrayFinal.forEach((data) => {
          data.setOptions({
            fillOpacity: 0,
            strokeOpacity: 0
          })
          setTimeout(() => {
            let equipmentClassName = document.getElementsByClassName(data.equipmentText.label.className) as any;
            if (equipmentClassName[0]) {
              equipmentClassName[0].style.display = "none";
            }
          }, 200);
          if(data.title == "UM" || data.title == "DG"){
            data.circle.setOptions({
              fillOpacity: 0,
              strokeOpacity: 0
            })
          }
        })
        this.showHideAcDisconnectLines(0);
        if(this.rectangleAcDisconnect){
          this.rectangleAcDisconnect.setOptions({
            fillOpacity: 0,
            strokeOpacity: 0,
            strokeWeight: 0
          })
        }
      }
    });
    }

  updateEquipmentWithCircle(labelMarker, currentSliderValue, inputEquipmentImgSize?,polygon?) {
    let equipmentPolygonCenter = this.calculatePolygonCenter(polygon.getPath().getArray());
    let polygonCoords = [
      { lat: equipmentPolygonCenter.lat() + 0.000005, lng: equipmentPolygonCenter.lng() + 0.000005 },
      { lat: equipmentPolygonCenter.lat() + 0.000005, lng: equipmentPolygonCenter.lng() - 0.000005 },
      { lat: equipmentPolygonCenter.lat() - 0.000005, lng: equipmentPolygonCenter.lng() - 0.000005 },
      { lat: equipmentPolygonCenter.lat() - 0.000005, lng: equipmentPolygonCenter.lng() + 0.000005 }
    ];
    if (!inputEquipmentImgSize || !labelMarker) return;
    const scaleValue = parseFloat(inputEquipmentImgSize);
    const rotationValue = currentSliderValue;
    if (isNaN(scaleValue) || isNaN(rotationValue) || !labelMarker) return;
    const angle = rotationValue * Math.PI / 180;
    const labelPos = labelMarker.getPosition();
    const newCoords = polygonCoords.map(coord => {
      const scaledLat = labelPos.lat() + (coord.lat - labelPos.lat()) * scaleValue;
      const scaledLng = labelPos.lng() + (coord.lng - labelPos.lng()) * scaleValue;
      const rotatedX = (scaledLng - labelPos.lng()) * Math.cos(angle) + (scaledLat - labelPos.lat()) * Math.sin(angle) + labelPos.lng();
      const rotatedY = -(scaledLng - labelPos.lng()) * Math.sin(angle) + (scaledLat - labelPos.lat()) * Math.cos(angle) + labelPos.lat();
      if (labelMarker) {
        let currentLabelClass = document.getElementsByClassName(labelMarker?.label?.className) as any;
        currentLabelClass[0].style.transform = `rotate(${rotationValue}deg)`;
        polygon.set('rotation', rotationValue);
        polygon.set('scaleSize', scaleValue);
      }
      return { lat: rotatedY, lng: rotatedX };
    });
    polygon.setPaths(newCoords);
  }

  

  drawAcDisconnectNoneFused(polygon) {
    const firstPolylinePoints = this.getPointsForFirstPolylineSet(polygon, "firstPoint");
    this.polylineFirstAcNonFused = new google.maps.Polyline({
      path: firstPolylinePoints,
      geodesic: true,
      strokeColor: '#70D454',
      strokeOpacity: 1.0,
      strokeWeight: 1,
      editable: false,
      draggable: false,
      zIndex: 50,
      map: this.map
    });

    const secondPolylinePoints = this.getPointsForFirstPolylineSet(polygon, "secondPoint");
    this.polylineSecondNonFused = new google.maps.Polyline({
      path: [firstPolylinePoints[1], secondPolylinePoints[1]],
      geodesic: true,
      strokeColor: '#70D454',
      strokeOpacity: 1.0,
      strokeWeight: 1,
      editable: false,
      draggable: false,
      zIndex: 50,
      map: this.map
    });

    const thirdPolylinePoints = this.getPointsForSecondPolylineSet(polygon, "firstPoint");
    const fourthPolylinePoints = this.getPointsForSecondPolylineSet(polygon, "secondPoint");

    this.polylineThirdNonFused = new google.maps.Polyline({
      path: [thirdPolylinePoints[0], fourthPolylinePoints[1]],
      geodesic: true,
      strokeColor: '#70D454',
      strokeOpacity: 1.0,
      strokeWeight: 1,
      editable: false,
      draggable: false,
      zIndex: 50,
      map: this.map
    });

    this.NonFusedAcDisconnectLinesArray.push(this.polylineFirstAcNonFused);
    this.NonFusedAcDisconnectLinesArray.push(this.polylineSecondNonFused);
    this.NonFusedAcDisconnectLinesArray.push(this.polylineThirdNonFused);
    // Pushing lines to tree objects
    this.treeAndOtherStructure.push(this.polylineFirstAcNonFused, this.polylineSecondNonFused, this.polylineThirdNonFused);
  }

  updateAcDisconnectNonFused(polygon, scaleValue?) {
    //updating the path of polylineFirst
    const firstPolylinePoints = this.getPointsForFirstPolylineSet(polygon, "firstPoint");
    this.polylineFirstAcNonFused.setPath(firstPolylinePoints);

    //updating the path of polylineSecond
    const secondPolylinePoints = this.getPointsForFirstPolylineSet(polygon, "secondPoint");
    this.polylineSecondNonFused.setPath([firstPolylinePoints[1], secondPolylinePoints[1]]);

    //updating the path of polylineThird
    const thirdPolylinePoints = this.getPointsForSecondPolylineSet(polygon, "firstPoint");
    const fourthPolylinePoints = this.getPointsForSecondPolylineSet(polygon, "secondPoint");
    this.polylineThirdNonFused.setPath([thirdPolylinePoints[0], fourthPolylinePoints[1]]);
  }

  drawAcDisconnect(polygon) {
    const firstPolylinePoints = this.getPointsForFirstPolylineSet(polygon, "firstPoint");
    this.polylineFirst = new google.maps.Polyline({
      path: firstPolylinePoints,
      geodesic: true,
      strokeColor: '#70D454',
      strokeOpacity: 1.0,
      strokeWeight: 1,
      editable: false,
      draggable: false,
      zIndex: 50
    });
    this.polylineFirst.setMap(this.map);

    const secondPolylinePoints = this.getPointsForFirstPolylineSet(polygon, "secondPoint");
    this.polylineSecond = new google.maps.Polyline({
      path: [firstPolylinePoints[1], secondPolylinePoints[1]],
      geodesic: true,
      strokeColor: '#70D454',
      strokeOpacity: 1.0,
      strokeWeight: 1,
      editable: false,
      draggable: false,
      zIndex: 50
    });
    this.polylineSecond.setMap(this.map);

    const thirdPolylinePoints = this.getPointsForSecondPolylineSet(polygon, "firstPoint");
    this.polylineThird = new google.maps.Polyline({
      path: thirdPolylinePoints,
      geodesic: true,
      strokeColor: '#70D454',
      strokeOpacity: 1.0,
      strokeWeight: 1,
      editable: false,
      draggable: false,
      zIndex: 50
    });
    this.polylineThird.setMap(this.map);

    const fourthPolylinePoints = this.getPointsForSecondPolylineSet(polygon, "secondPoint");
    this.polylineFourth = new google.maps.Polyline({
      path: fourthPolylinePoints,
      geodesic: true,
      strokeColor: '#70D454',
      strokeOpacity: 1.0,
      strokeWeight: 1,
      editable: false,
      draggable: false,
      zIndex: 50
    });
    this.polylineFourth.setMap(this.map);

    let rectanglePoints = this.getPointForRectangle(polygon);
    const delta = { width: 0.0000020, height: 0.0000006 }; // Example delta values
    this.drawRectangle(rectanglePoints, delta);
    this.acDisconnectLinesArray.push(this.polylineFirst, this.polylineSecond, this.polylineThird, this.polylineFourth);
    // Pushing lines to tree objects
    this.treeAndOtherStructure.push(this.polylineFirst, this.polylineSecond, this.polylineThird, this.polylineFourth);
  }

  getPointsForFirstPolylineSet(polygon, type) {
    const path = polygon.getPath().getArray();
    // Calculate vertical and horizontal distance
    const verticalAngle = this.calculateAngle(path[2].lat(), path[2].lng(), path[1].lat(), path[1].lng());
    const horizontalAngle = this.calculateAngle(path[2].lat(), path[2].lng(), path[3].lat(), path[3].lng());
    // calculate Distance
    const hzLength = google.maps.geometry.spherical.computeLength([path[2], path[3]]);
    const vlLength = google.maps.geometry.spherical.computeLength([path[2], path[1]]);
    // calculate distance to move
    let moveVl = vlLength / 5;
    let moveHz = hzLength / 5;
    if (type === 'secondPoint') {
      moveVl = moveVl * 2;
      moveHz = moveHz * 2;
    }
    // Calculet new coordinates
    const firstPoint = google.maps.geometry.spherical.computeOffset(path[2], moveVl, verticalAngle);
    const secondPoint = google.maps.geometry.spherical.computeOffset(firstPoint, moveHz, horizontalAngle);
    // Return updated coordinates
    return [firstPoint, secondPoint];
  }

  getPointsForSecondPolylineSet(polygon, type: string) {
    const path = polygon.getPath().getArray();
    // Calculate vertical and horizontal distance
    const verticalAngle = this.calculateAngle(path[3].lat(), path[3].lng(), path[0].lat(), path[0].lng());
    const horizontalAngle = this.calculateAngle(path[3].lat(), path[3].lng(), path[2].lat(), path[2].lng());
    // calculate Distance
    const hzLength = google.maps.geometry.spherical.computeLength([path[2], path[3]]);
    const vlLength = google.maps.geometry.spherical.computeLength([path[2], path[1]]);
    // calculate distance to move
    let moveVl = vlLength / 5;
    let moveHz = hzLength / 5;
    if (type === 'secondPoint') {
      moveHz = moveHz * 2;
    }
    // Calculet new coordinates
    let firstPoint = google.maps.geometry.spherical.computeOffset(path[3], moveVl, verticalAngle);
    const secondPoint = google.maps.geometry.spherical.computeOffset(firstPoint, moveHz, horizontalAngle);
    if (type === 'secondPoint') {
      firstPoint = google.maps.geometry.spherical.computeOffset(secondPoint, hzLength / 5, horizontalAngle);
    }
    // Return updated coordinates
    return [firstPoint, secondPoint];
  }

  getPointForRectangle(polygon) {
    const path = polygon.getPath().getArray();
    // Calculate vertical and horizontal distance
    const verticalAngle = this.calculateAngle(path[2].lat(), path[2].lng(), path[1].lat(), path[1].lng());
    const horizontalAngle = this.calculateAngle(path[2].lat(), path[2].lng(), path[3].lat(), path[3].lng());
    // calculate Distance
    const hzLength = google.maps.geometry.spherical.computeLength([path[2], path[3]]);
    const vlLength = google.maps.geometry.spherical.computeLength([path[2], path[1]]);
    // calculate distance to move
    let moveVl = vlLength / 5;
    let moveHz = hzLength / 5;
    // Calculet new coordinates
    const firstPoint = google.maps.geometry.spherical.computeOffset(path[2], moveVl, verticalAngle);
    const secondPoint = google.maps.geometry.spherical.computeOffset(firstPoint, moveHz * 2.5, horizontalAngle);
    // Return updated coordinates
    return { newCoordinates: secondPoint, verticalAngle, horizontalAngle, hzLength: hzLength / 5, vlLength: vlLength / 5 };
  }

  drawRectangle(data, delta) {
    const firstPoint = google.maps.geometry.spherical.computeOffset(data.newCoordinates, data.vlLength / 2, data.verticalAngle);
    const secondPoint = google.maps.geometry.spherical.computeOffset(data.newCoordinates, data.vlLength / 2, data.verticalAngle - 180);
    const thirdPoint = google.maps.geometry.spherical.computeOffset(secondPoint, data.hzLength * 2, data.horizontalAngle);
    const fourthPoint = google.maps.geometry.spherical.computeOffset(firstPoint, data.hzLength * 2, data.horizontalAngle);


    this.rectangleAcDisconnect = new google.maps.Polygon({
      paths: [firstPoint, secondPoint, thirdPoint, fourthPoint],
      editable: false,
      draggable: false,
      map: this.map,
      strokeColor: "#70D454",
      strokeWeight: 1,
      fillOpacity: 0,
      zIndex: 50
    });
    // Pushing rectangle to tree objects
    this.treeAndOtherStructure.push(this.rectangleAcDisconnect);

    return this.rectangleAcDisconnect;
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

  updateAcDisconnect(polygon, scaleValue?) {
    //updating the path of polylineFirst
    const firstPolylinePoints = this.getPointsForFirstPolylineSet(polygon, "firstPoint");
    this.polylineFirst.setPath(firstPolylinePoints);

    //updating the path of polylineSecond
    const secondPolylinePoints = this.getPointsForFirstPolylineSet(polygon, "secondPoint");
    this.polylineSecond.setPath([firstPolylinePoints[1], secondPolylinePoints[1]]);

    //updating the path of polylineThird
    const thirdPolylinePoints = this.getPointsForSecondPolylineSet(polygon, "firstPoint");
    this.polylineThird.setPath(thirdPolylinePoints);

    //updating the path of polylineFourth
    const fourthPolylinePoints = this.getPointsForSecondPolylineSet(polygon, "secondPoint");
    this.polylineFourth.setPath(fourthPolylinePoints);

    //updating the position of the rectangle
    const data = this.getPointForRectangle(polygon);
    const firstPoint = google.maps.geometry.spherical.computeOffset(data.newCoordinates, data.vlLength / 2, data.verticalAngle);
    const secondPoint = google.maps.geometry.spherical.computeOffset(data.newCoordinates, data.vlLength / 2, data.verticalAngle - 180);
    const thirdPoint = google.maps.geometry.spherical.computeOffset(secondPoint, data.hzLength * 2, data.horizontalAngle);
    const fourthPoint = google.maps.geometry.spherical.computeOffset(firstPoint, data.hzLength * 2, data.horizontalAngle);

    this.rectangleAcDisconnect.setPaths([firstPoint, secondPoint, thirdPoint, fourthPoint]);
  }

  addListnerToEquipment(polygon: google.maps.Polygon, labelMarker: any, polygonCoords, type) {
    let labelMarkerProperties = labelMarker.getLabel();
    if (type == 'existing') {
      setTimeout(() => {
        let currentLabelClass = document.getElementsByClassName(polygon['equipmentText'].label.className) as any;
        if (currentLabelClass) {
          currentLabelClass[0].style.transform = `rotate(${polygon["rotation"]}deg)`;
        }

        const equipmentLabel = labelMarker.getLabel() as google.maps.MarkerLabel;
        if (equipmentLabel) {
          equipmentLabel.fontSize = `${polygon["scaleSize"] * 8 + 'px'}`; // Set your desired font size
          labelMarker.setLabel(equipmentLabel);
        }
      }, 3000);
    }
    polygon.addListener('click', () => {
      if (polygon && this.currentTabIndex === 0) {
        this.showInfowindow = true;
        this.showObjectInfoWindow = 'equipment';

        setTimeout(() => {
          let currentSliderValue = 0;
          const inputEquipmentImgSize = document.getElementById('inputEquipmentImgSize') as HTMLInputElement;
          const removeEquipment = document.getElementById('removeEquipment') as HTMLElement;
          const sliderValue = document.getElementById('sliderValue') as any;
          if (polygon['scaleSize']) {
            this.equipmentImgNgModel = polygon["scaleSize"];
            sliderValue.value = polygon["scaleSize"];
          }
          inputEquipmentImgSize?.addEventListener("input", () => {
            this.updatePolygon(polygon, labelMarker, currentSliderValue, inputEquipmentImgSize);
          });
          const handleSliderChange = (args: any) => {
            currentSliderValue = args.value
            this.updatePolygon(polygon, labelMarker, currentSliderValue, inputEquipmentImgSize);
          };
          const sliderElement: any = $("#slider1");
          sliderElement.roundSlider({
            value: 0,
            min: 0,
            max: 360,
            radius: 70,
            // drag: handleSliderChange,
            change: handleSliderChange,
          });
          // sliderElement.roundSlider("option", "drag", false);
          sliderElement.find('.rs-handle').off('mousedown touchstart');
          removeEquipment.addEventListener(("click"), () => {
            if (polygon) {
              this.equipmentsArrayFinal = this.equipmentsArrayFinal.filter((item: any) => item?.id !== polygon['id']);
            }
            polygon.setMap(null);
            labelMarker.setMap(null);
            this.showInfowindow = false;
            if (polygon['title'] == "AC (Fused)") {
              this.acDisconnectLinesArray.forEach((polyline) => {
                polyline.setMap(null);
              })
              this.rectangleAcDisconnect.setMap(null);
            }
            if (polygon['title'] == "AC (Non-Fused)") {
              this.NonFusedAcDisconnectLinesArray.forEach((polyline) => {
                polyline.setMap(null);
              })
            }
            // Now Update local storage data
            let localStorageData = localStorage.getItem('mapData');
            let parsedData = JSON.parse(localStorageData);
            parsedData.equipments = parsedData.equipments.filter((item: any) => item?.id !== polygon['id']);
            localStorage.setItem('mapData', JSON.stringify(parsedData));
          });
        }, 500);
      }
    })
    // Show/hide label marker based on zoom level
    this.hideShowEquipments();
    // Update label marker position when polygon is dragged
    google.maps.event.addListener(polygon, "drag", (event) => {
      if (labelMarker) {
        const newCenter = this.calculatePolygonCenter(polygon.getPath().getArray());
        labelMarker.setPosition(newCenter);
      }
      if (polygon['title'] == "AC (Fused)") {
        this.updateAcDisconnect(polygon, polygon["scaleSize"]);
      }
      if (polygon['title'] == "AC (Non-Fused)") {
        this.updateAcDisconnectNonFused(polygon, polygon["scaleSize"]);
      }
    });
    // Update polygon position and label marker after dragend
    google.maps.event.addListener(polygon, "dragend", (event) => {
      polygonCoords.length = 0; // Clear the array
      polygon.getPath().getArray().forEach(coord => {
        polygonCoords.push({ lat: coord.lat(), lng: coord.lng() });
      });
      if (polygon['title'] == "AC (Fused)") {
        this.updateAcDisconnect(polygon, polygon["scaleSize"]);
      }
      if (polygon['title'] == "AC (Non-Fused)") {
        this.updateAcDisconnectNonFused(polygon, polygon["scaleSize"]);
      }
      this.saveEquipmentsData(polygon);
    });
  }

  showHideAcDisconnectLines(value) {
    if (this.acDisconnectLinesArray.length > 0) {
      this.acDisconnectLinesArray.forEach((polyline) => {
        polyline.setOptions({
          strokeWeight: value,
          strokeOpacity: value
        })
      })
    }
    if (this.NonFusedAcDisconnectLinesArray.length > 0) {
      this.NonFusedAcDisconnectLinesArray.forEach((polyline) => {
        polyline.setOptions({
          strokeWeight: value,
          strokeOpacity: value
        })
      })
    }
  }

  updatePolygon(polygon, labelMarker, currentSliderValue, inputEquipmentImgSize?) {
    let markerLabelProperties = labelMarker.getLabel();
    let equipmentPolygonCenter = this.calculatePolygonCenter(polygon.getPath().getArray());
    let polygonCoords = [
      { lat: equipmentPolygonCenter.lat() + 0.000005, lng: equipmentPolygonCenter.lng() + 0.000005 },
      { lat: equipmentPolygonCenter.lat() + 0.000005, lng: equipmentPolygonCenter.lng() - 0.000005 },
      { lat: equipmentPolygonCenter.lat() - 0.000005, lng: equipmentPolygonCenter.lng() - 0.000005 },
      { lat: equipmentPolygonCenter.lat() - 0.000005, lng: equipmentPolygonCenter.lng() + 0.000005 }
    ];
    if (!inputEquipmentImgSize || !labelMarker) return;
    const scaleValue = parseFloat(inputEquipmentImgSize.value);
    const rotationValue = currentSliderValue;
    if (isNaN(scaleValue) || isNaN(rotationValue) || !labelMarker) return;
    const angle = rotationValue * Math.PI / 180;
    const labelPos = labelMarker.getPosition();
    const newCoords = polygonCoords.map(coord => {
      const scaledLat = labelPos.lat() + (coord.lat - labelPos.lat()) * scaleValue;
      const scaledLng = labelPos.lng() + (coord.lng - labelPos.lng()) * scaleValue;
      const rotatedX = (scaledLng - labelPos.lng()) * Math.cos(angle) + (scaledLat - labelPos.lat()) * Math.sin(angle) + labelPos.lng();
      const rotatedY = -(scaledLng - labelPos.lng()) * Math.sin(angle) + (scaledLat - labelPos.lat()) * Math.cos(angle) + labelPos.lat();
      if (labelMarker) {
        let currentLabelClass = document.getElementsByClassName(labelMarker?.label?.className) as any;
        currentLabelClass[0].style.transform = `rotate(${rotationValue}deg)`;
        polygon.set('rotation', rotationValue);
        polygon.set('scaleSize', scaleValue);
        const equipmentLabel = labelMarker.getLabel() as google.maps.MarkerLabel;
        if (equipmentLabel) {
          equipmentLabel.fontSize = `${scaleValue * 8 + 'px'}`; // Set your desired font size
          labelMarker.setLabel(equipmentLabel);
        }
      }

      return { lat: rotatedY, lng: rotatedX };
    });
    polygon.setPaths(newCoords);
    if (polygon['title'] == "AC (Fused)") {
      this.updateAcDisconnect(polygon, scaleValue);
    }
    if (polygon['title'] == "AC (Non-Fused)") {
      this.updateAcDisconnectNonFused(polygon, scaleValue);
    }
    this.saveEquipmentsData(polygon, '');

  }

  saveEquipmentsData(polygon?: any, type?: string) {
    let localStorageData = localStorage.getItem('mapData');
    let parsedData = JSON.parse(localStorageData);
    // Update the array based on the condition
    const equipment = parsedData.equipments.find((equip) => equip.id === polygon['id']);
    if (equipment) {
      const path = polygon.getPath().getArray();
      equipment.paths = path;
      equipment.rotation = polygon.rotation;
      equipment.scaleSize = polygon.scaleSize;
      equipment.equipmentText = polygon.equipmentText.label;
      // Save Line Data for fuse data
      if (equipment.title === "AC (Fused)") {
        equipment.linesData = {
          firstpolylinePath: this.polylineFirst.getPath().getArray(),
          secondpolylinePath: this.polylineSecond.getPath().getArray(),
          thirdpolylinePath: this.polylineThird.getPath().getArray(),
          fourthpolylinePath: this.polylineFourth.getPath().getArray(),
          polygonPath: this.rectangleAcDisconnect.getPath().getArray()
        };
      }
      // Save line data for non fuse
      if (equipment.title === "AC (Non-Fused)") {
        equipment.linesData = {
          firstpolylinePath: this.polylineFirstAcNonFused.getPath().getArray(),
          secondpolylinePath: this.polylineSecondNonFused.getPath().getArray(),
          thirdpolylinePath: this.polylineThirdNonFused.getPath().getArray()
        };
      }
      // Now save circle data for UM and DG
      if (equipment.title === "UM" || equipment.title === "DG") {
        equipment.circle = {
          radius: polygon.circle.radius,
          center: polygon.circle.center
        }
      }
      // Now update local storage data
      parsedData.equipments = parsedData.equipments;
      localStorage.setItem('mapData', JSON.stringify(parsedData));
    }
  }

  handleEquipmentDragEvent(marker: any) {
    setTimeout(() => {
      $('img[src="' + marker?.icon?.url + '"]').parent().css({
        'transform': 'rotate(' + Number(marker?.label?.text) + 'deg)',
        'transform-origin': '50% 50%',
      });
    }, 500);
  }

  drawRoof() {
    const self = this;
    this.currentTabIndex = this.currentTabIndex;
    this.drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
      drawingControl: false,
      polygonOptions: {
        // strokeWeight: 1,
        fillColor: 'white'
      },
      drawingControlOptions: {
        position: google.maps.ControlPosition.LEFT_BOTTOM,
        drawingModes: [google.maps.drawing.OverlayType.POLYLINE],
      },
    });

    google.maps.event.addListener(this.drawingManager, 'overlaycomplete', function (event: any) {
      self.shapes.push(event.overlay);
      self.allShapesSets.push(event.overlay);
      const polyLine = event.overlay;
      const index = self.allShapesSets.indexOf(polyLine);
      // self.addLabel(event.overlay.getPath(), index);
      const arr = event.overlay.getPath().getArray();
      // arr.push(arr[0]);
      const roofId = `roof_${new Date().getTime()}`;
      self.allRoofsObjects[roofId] = { paths: arr, dataAdded: false };

      event.overlay.set('id', roofId);

      // self.createRoofJSON(arr);
      // self.saveToFile(arr);
      self.handleSidebarMenuClick(1);
      self.saveDataToLocalStorage(event.overlay, 'roof');
      // Add Click Event on roof
      // google.maps.event.addListener(event.overlay, 'click', (event) => {
      //   const clickedPolygon = self.allRoofsObjects[roofId];
      //   if (!clickedPolygon.dataAdded && self.currentTabIndex === 0) {
      //     self.addLineToFormonOverlayComplete(arr, roofId);
      //   }
      // });
      self.removePolygonAndAddLines(arr, polyLine, roofId);
    });

    this.drawingManager.setMap(this.map);
  }

  removePolygonAndAddLines(arr, polygon, roofId) {
    polygon.setMap(null);
    arr = [...arr, arr[0]];
    // Adding Polylines on polygon
    for (let i = 0; i < arr.length - 1; i++) {
      const polyline = new google.maps.Polyline({
        path: [arr[i], arr[i + 1]],
        strokeWeight: 5,
        zIndex: 10,
        map: this.map
      });
      polyline.set('roofId', roofId);
      polyline.set('lineId', `L${i + 1}`);
      const line = `line_${new Date().getTime()}${i + 5}${Math.floor(100000 + Math.random() * 900000)}`;
      polyline.set('line', line);
      // Adding click event listener
      google.maps.event.addListener(polyline, 'click', () => {
        if (!this.checkPairLineClicked) {
          const findLine = this.allRoofLines.find((el) => el.line === polyline['line']);
          const findEave = this.allEaveLines.find((el) => el.line === polyline['line']);
          if (!findEave) {
            this.allEaveLines.push(findLine);
            findLine.lineType = 'eave';
            findLine.polyline.setOptions({
              strokeColor: 'grey'
            });
          } else {
            this.allEaveLines = this.allEaveLines.filter((el) => el.line != polyline['line']);
            delete findEave.lineType;
            findEave.polyline.setOptions({
              strokeColor: 'black'
            });
          }
        } else {
          const findLine = this.allRoofLines.find((el) => el.line === polyline['line']);
          this.openLineTypeForm(findLine);
        }
      });
      // Pushing line data to object
      const roofLineObject = {
        roofId,
        lineId: `L${i + 1}`,
        line,
        polyline,
        path: polyline.getPath().getArray()
      };
      this.allRoofLines.push(roofLineObject);
    }
  }

  findParallelEavePairs() {
    if (this.allEaveLines.length === 0) {
      this.toastr.error('Please select all eave lines.');
      return;
    }
    const parallelEavePairs = [];
    // Check all eave lines
    this.allEaveLines.forEach((eaveLine) => {
      let eaveLineAngle = google.maps.geometry.spherical.computeHeading(eaveLine.path[0], eaveLine.path[1]);
      eaveLineAngle = eaveLineAngle < 0 ? 180 + eaveLineAngle : eaveLineAngle;

      const roofLines = this.allRoofLines.filter((line) => line.roofId === eaveLine.roofId && !line.lineType);
      roofLines.forEach((roofLine) => {
        let lineAngle = google.maps.geometry.spherical.computeHeading(roofLine.path[0], roofLine.path[1]);
        lineAngle = lineAngle < 0 ? 180 + lineAngle : lineAngle;
        // Get line angle and eave angle difference
        let angleDifference = eaveLineAngle > lineAngle ? eaveLineAngle - lineAngle : lineAngle - eaveLineAngle;
        angleDifference = parseFloat(angleDifference.toFixed(2));
        if (angleDifference < 5) {
          roofLine.lineType = 'ridge';
          roofLine.polyline.setOptions({
            strokeColor: 'orange'
          });
        } else {
          roofLine.lineType = 'others';
        }
      });
    });
    this.checkPairLineClicked = true;
    return;
    if (parallelEavePairs.length > 0) {
      this.findRidge(parallelEavePairs);
    }
    this.allEaveLines.forEach((line) => {
      const roofLines = this.allRoofLines.filter((roofline) => roofline.roofId === line.roofId);
      console.log('roofLines', roofLines)
      if (roofLines) {
        roofLines.forEach((rl, index) => {
          if (rl.lineType === 'eave') {
            if (index === 0) {
              if (!roofLines[index + 1].lineType) {
                roofLines[index + 1].lineType = 'others';
              }
              if (!roofLines[roofLines.length - 1].lineType) {
                roofLines[roofLines.length - 1].lineType = 'others';
              }
            } else if (index !== (roofLines.length - 1)) {
              if (!roofLines[index - 1].lineType) {
                roofLines[index - 1].lineType = 'others';
              }
              if (!roofLines[index + 1].lineType) {
                roofLines[index + 1].lineType = 'others';
              }
            } else if (index === (roofLines.length - 1)) {
              if (!roofLines[0].lineType) {
                roofLines[0].lineType = 'others';
              }
              if (!roofLines[index - 1].lineType) {
                roofLines[index - 1].lineType = 'others';
              }
            }
          }
        });
      }
    });
    this.checkPairLineClicked = true;
    this.checkAllLines();
    this.allEaveLines = [];
  }

  findRidge(eavePairs) {
    this.allRoofLines.map((line) => {
      for (let i = 0; i < eavePairs.length - 1; i++) {
        if (!line.lineType) {
          if (this.areLinesParallel(line.path[0], line.path[1], eavePairs[i].eaveLine1.path[0], eavePairs[i].eaveLine1.path[1])) {
            new google.maps.Polyline({
              path: [line.path[0], line.path[1]],
              geodesic: true,
              strokeColor: "orange",
              strokeOpacity: 1.0,
              strokeWeight: 5,
              map: this.map,
            });

            line.type = "RIDGE";

          }
        }
      }
    });
  }

  checkAllLines() {
    this.showInfowindow = false;
    const roofLines = this.allRoofLines.filter((roof) => !roof.lineType);
    if (roofLines.length === 0) {
      this.toastr.success('All line type data sets successfully.')
    }
    if (roofLines.length > 0) {
      roofLines.forEach((line) => {
        line.polyline.setOptions({
          strokeColor: 'red',
          zIndex: 99,
        });
      });
      this.toastr.info(`We dont have line type for line marked as red so please add the the type from dropdown.`, '', { timeOut: 9500 });
      // Now Open popup for line that does not have their type
      for (let i = 0; i < roofLines.length; i++) {
        this.openLineTypeForm(roofLines[i]);
        break;
      }
    }
  }

  openLineTypeForm(data) {
    this.initializeLineTypeForm();
    this.lineTypeForm.patchValue({
      roofId: data.roofId,
      lineId: data.line,
      lineType: data.lineType ? data.lineType : ''
    });
    // Now Update line color for highlighting purpose
    data.polyline.setOptions({
      strokeColor: 'green',
      zIndex: 99,
    });
    this.showObjectInfoWindow = 'lineType';
    this.showInfowindow = true;
  }

  submitLineTypeForm() {
    if (this.lineTypeForm.invalid) {
      this.toastr.error('Please fill all inputs');
      return;
    }
    const lineTypeData = this.lineTypeForm.value;
    // Get line from all roof lines array
    const line = this.allRoofLines.find((roof) => roof.line === lineTypeData.lineId);
    if (line) {
      line.lineType = lineTypeData.lineType;
      line.polyline.setOptions({
        strokeColor: 'black',
        zIndex: -99,
      });
    }
    this.showInfowindow = false;
    this.checkAllLines();
    this.changeLineColor();
  }

  areLinesParallel(start1, end1, start2, end2) {
    const slope1 = (end1.lat() - start1.lat()) / (end1.lng() - start1.lng());
    const slope2 = (end2.lat() - start2.lat()) / (end2.lng() - start2.lng());
    const tolerance = 0.75; // Adjust the tolerance based on your requirements
    return Math.abs(slope1 - slope2) < tolerance;
  }

  addMaxModules() {
    this.findParallelEavePairs();
    const roofLines = this.allRoofLines.filter((roof) => !roof.lineType);
    if (roofLines.length > 0) {
      this.checkAllLines();
      return;
    }
    // Now Add Max Modules
    const keys = Object.keys(this.allRoofsObjects);
    keys.forEach((roofId) => {
      if (!this.allRoofsObjects[roofId].dataAdded) {
        this.initializeRoofLineForm();
        const allLines = this.allRoofLines.filter((roof) => roof.roofId === roofId);
        allLines.forEach((line, index) => {
          const data = {
            lineIndex: index,
            lines: line.path,
            lineType: line.lineType.toLowerCase(),
            fireSetBack: this.getFireSetBack(line.lineType.toLowerCase())
          };
          this.addLine(data);
        });
        // Now initialize roof line form and patch data into it
        this.roofLineForm.patchValue({
          roofId: roofId,
          roofLinesArr: this.allRoofsObjects[roofId].paths,
        });
        this.submitRoofLineForm();
        this.allRoofsObjects[roofId].dataAdded = true;
      }
    });
    // Remove all Poly line
    this.allRoofLines.forEach((line) => {
      line.polyline.setMap(null);
    });
    this.changeLineColor();
  }

  changeLineColor() {
    this.allRoofLines.forEach((line) => {
      const lineColor = line.lineType.toLowerCase() === 'eave' ? 'grey' : line.lineType.toLowerCase() === 'ridge' ? 'orange' : 'black';
      line.polyline.setOptions({
        strokeColor: lineColor,
        zIndex: 10,
        map: this.map
      });
    });
  }

  getFireSetBack(lineType: string) {
    let fireSetBack = 0;
    switch (lineType) {
      case 'eave': {
        fireSetBack = 15;
        break;
      }
      case 'ridge': {
        fireSetBack = 18;
        break;
      }
      default: {
        fireSetBack = 36;
        break;
      }
    }
    return fireSetBack;
  }

  enableSelect(): void {
    this.drawingManager.setDrawingMode(null);
  }


  adjustMap = (mode: string, amount: number) => {
    switch (mode) {
      case "tilt":
        this.map.setTilt(this.map.getTilt()! + amount);
        break;
      case "rotate":
        this.map.setHeading(this.map.getHeading()! + amount);
        break;
      default:
        break;
    }
  };


  createRoofJSON(roofLinesData: any) {
    const formData = roofLinesData.roofLines;
    let roofdata = {
      id: `R${Object.keys(this.roofsJSON['roofs']).length + 1}`
    };
    let roofLines = [];
    roofLinesData = roofLinesData.roofLinesArr;
    for (let i = 0; i < roofLinesData.length - 1; i++) {
      const pointCoordsDistance = (google.maps.geometry.spherical.computeLength([roofLinesData[i], roofLinesData[i + 1]]) * 3.28084).toFixed(2);
      const angle = this.calculateAngle(roofLinesData[i].lat(), roofLinesData[i].lng(), roofLinesData[i + 1].lat(), roofLinesData[i + 1].lng());
      const linesObj = {
        key: `L${((roofLines.length) + 1)}`,
        angle: angle.toFixed(2),
        index: i,
        type: formData[i].lineType.toUpperCase(),
        length: pointCoordsDistance,
        unit: 'feet',
        start: { lat: roofLinesData[i].lat(), lng: roofLinesData[i].lng(), value: 0 },
        end: { lat: roofLinesData[i + 1].lat(), lng: roofLinesData[i + 1].lng(), value: pointCoordsDistance },
      };
      roofLines.push(linesObj);
    }
    roofdata['lines'] = roofLines;
    this.roofsJSON['roofs'].push(roofdata);
  }

  redrawPropertyline(data: any) {
    data.forEach((item: any) => {
      let polygon = new google.maps.Polygon({
        paths: item.path,
        editable: true,
        strokeColor: item.strokeColor,
        strokeWeight: item.strokeWeight,
        map: this.map,
        fillColor: 'white',
        fillOpacity: 0,
        zIndex: -1
      });
      polygon.set('id', item.id);
      google.maps.event.addListener(polygon, 'click', () => {
        this.openPropertyLineInfoWindow(polygon);
      });
      const path = polygon.getPath();
      // Adding Change Event on Property Line
      google.maps.event.addListener(path, 'set_at', () => {
        this.createPDFDimension(path.getArray());
      });
      this.allOtherHouseObjects.push(polygon);
      // Adding JSON Data
      this.createPDFDimension(path.getArray());
      // Save Data to json
      this.handleSidebarMenuClick(1);
    });
  }

  drawPropertyLine() {
    this.drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
      drawingControl: false,
      map: this.map
    });
    this.drawingManager.setOptions({
      polygonOptions: {
        editable: true,
        strokeColor: "#EE4B2B",
        strokeWeight: 2,
        strokeOpacity: 1,
        fillColor: "#EE4B2B",
        fillOpacity: 0,
        zIndex: -50,
      }
    });

    google.maps.event.addListener(this.drawingManager, 'overlaycomplete', (event: any) => {
      if (event.type === google.maps.drawing.OverlayType.POLYGON) {
        const polygon = event.overlay;
        const timestamp = new Date().getTime();
        polygon.set('id', 'propertyline_' + timestamp);
        // Adding click Event
        google.maps.event.addListener(polygon, 'click', () => {
          this.openPropertyLineInfoWindow(polygon);
        });
        // Saving data to local storage
        this.saveDataToLocalStorage(polygon, 'plotOutline');
        const path = polygon.getPath();
        // Adding Change Event on Property Line
        google.maps.event.addListener(path, 'set_at', () => {
          this.createPDFDimension(path.getArray());
        });

        // Adding JSON Data 
        this.createPDFDimension(path.getArray());
        // Add Shapes to array
        this.shapes.push(polygon);
        this.allOtherHouseObjects.push(polygon);
      }
      this.handleSidebarMenuClick(1);
    });
  }

  createPDFDimension(paths: any) {
    paths = [...paths, paths[0]];
    const propertyLineJSON: any = [];
    for (let i = 0; i < paths.length - 1; i++) {
      const propertyLines: any = {};
      propertyLines.id = `PL${i + 1}`;
      propertyLines.unit = "feet";
      const startPoint = paths[i];
      const endPoint = paths[i + 1];
      propertyLines.length = (google.maps.geometry.spherical.computeLength([startPoint, endPoint]) * 3.28084).toFixed(2);
      propertyLines.angle = google.maps.geometry.spherical.computeHeading(startPoint, endPoint);
      propertyLines.start = { lat: startPoint.lat(), lng: startPoint.lng() };
      propertyLines.end = { lat: endPoint.lat(), lng: endPoint.lng() };
      // Pusing Object to array
      propertyLineJSON.push(propertyLines);
    }
    this.roofsJSON['propertyLine'] = propertyLineJSON;
    // Now find Porperty line bounds
    const bounds = new google.maps.LatLngBounds();
    paths.forEach((latLng: google.maps.LatLng | google.maps.LatLngLiteral) => {
      bounds.extend(latLng);
    });

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
      fillOpacity: 0.35,
      // map: this.map
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
      fillOpacity: 0.35,
      // map: this.map
    });

    this.roofsJSON["pdfDimension"] = {
      "landscape": horizontalBound,
      "portrait": verticalBound
    };
  }

  openPropertyLineInfoWindow(polygon: any) {
    if (polygon && this.currentTabIndex === 0) {
      this.propertyLineEditObject.propertyLineThicknessNgModel = (polygon as any).strokeWeight;
      this.propertyLineEditObject.propertyLineColor = (polygon as any).strokeColor;
      this.showInfowindow = true;
      this.showObjectInfoWindow = 'propertyLine';

      setTimeout(() => {
        let propertyLineColorPicker = document.getElementById('propertyLineColorPicker') as any;
        let propertyLineThicknessInputId = document.getElementById('propertyLineThicknessInputId') as HTMLInputElement;
        let propertyLineThicknessSliderValue = document.getElementById('propertyLineThicknessSliderValue');
        let removePropertyline = document.getElementById('removePropertyline') as HTMLElement;
        if (propertyLineColorPicker) {
          propertyLineColorPicker.addEventListener('input', () => {
            const newColor = propertyLineColorPicker.value;
            polygon.setOptions({
              strokeColor: newColor
            });
            this.propertyLineEditObject.propertyLineColor = propertyLineColorPicker.value;
            this.savePropertylineDrawingData(polygon, 'strokeColor');
          });
        }
        if (propertyLineThicknessInputId && propertyLineThicknessSliderValue) {
          propertyLineThicknessInputId.addEventListener('input', () => {
            const newSize = Number(propertyLineThicknessInputId.value);
            polygon.setOptions({
              strokeWeight: newSize, // Change the value to the desired thickness
            });
            if (propertyLineThicknessSliderValue) {
              propertyLineThicknessSliderValue.innerText = newSize.toString();
            }
            this.savePropertylineDrawingData(polygon, 'strokeWeight');
          });
        }
        if (removePropertyline) {
          removePropertyline.addEventListener('click', () => {
            let localStorageData = localStorage.getItem('mapData');
            if (localStorageData) {
              let parsedData = JSON.parse(localStorageData);
              parsedData.plotOutline = parsedData.plotOutline.filter((item: any) => item?.id !== polygon?.id);
              localStorage.setItem('mapData', JSON.stringify(parsedData));
              this.propertylineArray = this.propertylineArray.filter((item: any) => item?.id !== polygon?.id);
              polygon.setMap(null);
              this.closeInfoWindow();
            }
          });
        }
      }, 1000);
    }

  }

  savePropertylineDrawingData(polygon: any, type: string) {
    let localStorageData = localStorage.getItem('mapData');
    let parsedData = JSON.parse(localStorageData);
    // Update the array based on the condition
    const propertyLine = this.propertylineArray.find((line) => line.id === polygon.id);
    if (propertyLine) {
      const path = polygon.getPath().getArray();
      propertyLine.path = path;
      propertyLine.strokeColor = polygon?.strokeColor;
      propertyLine.strokeWeight = polygon?.strokeWeight;
      // Now update local storage data
      parsedData.plotOutline = this.propertylineArray;
      localStorage.setItem('mapData', JSON.stringify(parsedData));
    }
  }

  drawDriveway(drivewaysArray = []) {
    if (drivewaysArray.length > 0) {
      drivewaysArray.forEach((driveWay) => {
        const polygon = new google.maps.Polygon({
          paths: driveWay.paths,
          editable: driveWay.editable,
          strokeColor: driveWay.strokeColor,
          strokeWeight: driveWay.strokeWeight,
          strokeOpacity: driveWay.strokeOpacity,
          fillColor: driveWay.strokeColor,
          fillOpacity: driveWay.fillOpacity,
          draggable: driveWay.draggable,
          zIndex: -50,
          map: this.map
        });
        // Adding click event
        google.maps.event.addListener(polygon, 'click', () => {
          this.openDriveWayInfoWindow(polygon);
        });
        this.shapes.push(polygon);
        this.treeAndOtherStructure.push(polygon);
      });
    } else {
      this.drawingManager = new google.maps.drawing.DrawingManager({
        drawingMode: google.maps.drawing.OverlayType.POLYGON,
        drawingControl: false,
        map: this.map
      });
      this.drawingManager.setOptions({
        polygonOptions: {
          editable: true,
          strokeColor: "blue",
          strokeWeight: 1,
          strokeOpacity: 1,
          fillColor: "blue",
          fillOpacity: 0.1,
          zIndex: -50,
        }
      });

      google.maps.event.addListener(this.drawingManager, 'overlaycomplete', (event: any) => {
        if (event.type === google.maps.drawing.OverlayType.POLYGON) {
          const polygon = event.overlay;
          let paths = polygon.getPath().getArray();
          paths.push(paths[0])

          const drivewayJSON: any = [];
          // Loop on lines
          for (let i = 0; i < paths.length - 1; i++) {
            const lineObject: any = {};
            lineObject.unit = "feet";
            const startPoint = paths[i];
            const endPoint = paths[i + 1];
            lineObject.length = (google.maps.geometry.spherical.computeLength([startPoint, endPoint]) * 3.28084).toFixed(2);
            lineObject.angle = this.calculateAngle(startPoint.lat(), startPoint.lng(), endPoint.lat(), endPoint.lng()).toFixed(2);
            lineObject.start = { lat: startPoint.lat(), lng: startPoint.lng() };
            lineObject.end = { lat: endPoint.lat(), lng: endPoint.lng() };
            // Pushing array
            drivewayJSON.push(lineObject);
          }
          const driveWayObject = {
            id: `DW${Object.keys(this.roofsJSON['driveways']).length + 1}`,
            lines: drivewayJSON
          };
          // Add Click Event on driveway
          google.maps.event.addListener(polygon, 'click', () => {
            this.openDriveWayInfoWindow(polygon);
          });
          this.roofsJSON['driveways'].push(driveWayObject);
          this.shapes.push(polygon);
          this.treeAndOtherStructure.push(polygon);
          // Save Data to local storage
          this.saveDataToLocalStorage(polygon, 'driveway');

        }
        this.handleSidebarMenuClick(1);
      });
    }
  }

  openDriveWayInfoWindow(polygon) {
    if (polygon && this.currentTabIndex === 0) {
      this.showInfowindow = true;
      this.showObjectInfoWindow = 'driveWay';
      // Adding Object data for editing
      this.driveWayObject['polygonThicknessNgModel'] = (polygon as any).strokeWeight;
      this.driveWayObject['polygonFillColor'] = (polygon as any).strokeColor;
      this.driveWayObject['polygonOpacityNgModel'] = (polygon as any).fillOpacity;
      this.driveWayObject['polygonColor'] = (polygon as any).strokeColor;
      this.driveWayObject['polygonFillColor'] = (polygon as any).fillColor;

      // Update Existing Polygon
      setTimeout(() => {
        let polygonColorPicker = document.getElementById('polygonColorPicker') as any;
        let polygonThicknessInputId = document.getElementById('polygonThicknessInputId') as HTMLInputElement;
        let polygonThicknessSliderValue = document.getElementById('polygonThicknessSliderValue');
        let removePolygon = document.getElementById('removePolygon') as HTMLElement;
        let polygonFillColorPicker = document.getElementById('polygonFillColorPicker') as any;
        let polygonOpacitySliderValue = document.getElementById('polygonOpacitySliderValue') as any;
        let polygonOpacityInputId = document.getElementById('polygonOpacityInputId') as HTMLInputElement;
        if (polygonColorPicker) {
          polygonColorPicker.addEventListener('input', () => {
            const newColor = polygonColorPicker.value;
            polygon.setOptions({
              strokeColor: newColor
            });
            this.driveWayObject['polygonColor'] = polygonColorPicker.value;
            this.saveDriveWayData(polygon);
          });
        }
        if (polygonFillColorPicker) {
          polygonFillColorPicker.addEventListener('input', () => {
            const newFillColor = polygonFillColorPicker.value;
            polygon.setOptions({
              fillColor: newFillColor,
              fillOpacity: 0.5
            });
            this.driveWayObject['polygonFillColor'] = polygonFillColorPicker.value;
            this.saveDriveWayData(polygon);
          });
        }
        if (polygonThicknessInputId && polygonThicknessSliderValue) {
          polygonThicknessInputId.addEventListener('input', () => {
            const newSize = Number(polygonThicknessInputId.value);
            polygon.setOptions({
              strokeWeight: newSize, // Change the value to the desired thickness
            });
            if (polygonThicknessSliderValue) {
              polygonThicknessSliderValue.innerText = newSize.toString();
            }
            this.saveDriveWayData(polygon);
          });
        }
        if (polygonOpacityInputId && polygonOpacitySliderValue) {
          polygonOpacityInputId.addEventListener('input', () => {
            let newOpacity = Number(polygonOpacityInputId.value);
            polygon.setOptions({
              fillOpacity: newOpacity
            });
            if (polygonOpacitySliderValue) {
              polygonOpacitySliderValue.innerText = newOpacity.toString();
            }
            this.saveDriveWayData(polygon);
          });
        }
        if (removePolygon) {
          removePolygon.addEventListener('click', () => {

            let localStorageData = localStorage.getItem('mapData');
            if (localStorageData) {
              let parsedData = JSON.parse(localStorageData);
              parsedData.driveways = parsedData.driveways.filter((item: any) => item?.id !== polygon?.id);
              localStorage.setItem('mapData', JSON.stringify(parsedData));
              this.polygonDrawingArray = this.polygonDrawingArray.filter((item: any) => item?.id !== polygon?.id);
              console.log('this.polygonDrawingArray', this.polygonDrawingArray)
              polygon.setMap(null); // Remove the polygon from the map
              this.showInfowindow = false;
            }
          });
        }
      }, 1000);
    }
  }

  // Updating Local Storage drive way data
  saveDriveWayData(polygon: any) {
    let localStorageData = localStorage.getItem('mapData');
    let parsedData = JSON.parse(localStorageData);
    // Update the array based on the condition
    const polygonData = this.polygonDrawingArray.find((allPolygon) => allPolygon.is === polygon['id']);
    if (polygonData) {
      polygonData.strokeColor = polygon.strokeColor;
      polygonData.strokeWeight = polygon.strokeWeight;
      polygonData.fillColor = polygon.fillColor;
      polygonData.fillOpacity = polygon.strokeOpacity;
    }
    if (parsedData.driveways) {
      parsedData.driveways = this.polygonDrawingArray;
      localStorage.setItem('mapData', JSON.stringify(parsedData));
    }
  }

  onAutocompleteSelected(event: any) {

  }

  onLocationSelected(location: any): void {
    const mapOptions = {
      center: { lat: location.latitude, lng: location.longitude },
      zoom: 21, // Adjust the zoom level as neededtype == 
      // mapTypeId: 'satellite' // Set map type to satellite
    };
    this.map.setOptions(mapOptions);
    this.currentSelectedLocation = new google.maps.LatLng(location.latitude, location.longitude);
    const addLocationMarker = new google.maps.Marker({
      position: this.currentSelectedLocation,
      map: this.map
    });
    setTimeout(() => {
      addLocationMarker.setMap(null);
    }, 15000);
  }

  removeLastShape() {
    const lastShape = this.shapes.pop();
    if (Array.isArray(lastShape)) {
      this.redoShapes.push(lastShape);
      lastShape.forEach((el) => {
        el.setMap(null);
      });
    }
    if (lastShape && !Array.isArray(lastShape)) {
      this.redoShapes.push(lastShape);
      lastShape.setMap(null);
    }
  }

  redoLastShape() {
    const lastShape = this.redoShapes.pop();
    if (lastShape && !Array.isArray(lastShape)) {
      this.shapes.push(lastShape);
      lastShape.setMap(this.map);
    }
    if (lastShape && Array.isArray(lastShape)) {
      this.shapes.push(lastShape);
      lastShape.forEach((el) => {
        el.setMap(this.map);
      });
    }
  }

  addObjects(treeMarkersArray?: any): void {
    if(treeMarkersArray){
      treeMarkersArray.forEach((tree: any, index) => {
        const treeCircle = new google.maps.Circle({
          center: tree.center,
          radius: tree.radius,
          strokeColor: "green",
          strokeOpacity: 0,
          strokeWeight: 0,
          fillColor: "#3cb043",
          fillOpacity: 0,
          map: this.map,
          editable: false,
          draggable: true
        });
        this.treeAndOtherStructure.push(treeCircle);
  
        const circleBounds = treeCircle.getBounds();
  
        const trees = new google.maps.GroundOverlay(
          "../../assets/Icon/tree.svg",
          circleBounds,
        );
        this.treeAndOtherStructure.push(trees);
        trees.setMap(this.map)
  
        treeCircle.addListener("click", () => {
          treeCircle.setOptions({ editable: !treeCircle.getEditable() })
        })
  
        treeCircle.addListener("dblclick", () => {
          treeCircle.setMap(null);
          trees.setMap(null);
          this.deleteTreeFromLS(tree.id);
        })
  
        treeCircle.addListener("center_changed", () => {
          const circleBounds = treeCircle.getBounds();
          trees.set("bounds", circleBounds)
          trees.setMap(this.map)
        })
  
        treeCircle.addListener("radius_changed", () => {
          const circleBounds = treeCircle.getBounds();
          trees.set("bounds", circleBounds)
          trees.setMap(this.map);
          this.updateTreeFromLS(tree.id, treeCircle);
        });
  
        treeCircle.addListener("drag", () => {
          const circleBounds = treeCircle.getBounds();
          trees.set("bounds", circleBounds)
          trees.setMap(this.map);
          this.updateTreeFromLS(tree.id, treeCircle);
        })
        this.updateTreeFromLS(tree.id, treeCircle);
      });
    } else {
      const timestamp = new Date().getTime();
    let id =  "tree_" + timestamp;
    const treeCircle = new google.maps.Circle({
      center: { lat: this.currentSelectedLocation.lat() ,lng: this.currentSelectedLocation.lng() },
      radius: 2,
      strokeColor: "green",
      strokeOpacity: 0,
      strokeWeight: 0,
      fillColor: "#3cb043",
      fillOpacity: 0,
      map: this.map,
      editable: false,
      draggable: true
    });

    const circleBounds = treeCircle.getBounds();

    const trees = new google.maps.GroundOverlay(
      "../../assets/Icon/tree.svg",
      circleBounds
    );
    trees.setMap(this.map);

    treeCircle.addListener("click", () => {
      if(this.currentTabIndex === 0){
        treeCircle.setOptions({ editable: !treeCircle.getEditable() })
      }
    });

    treeCircle.addListener("dblclick", () => {
      if(this.currentTabIndex === 0){
        treeCircle.setMap(null);
        trees.setMap(null);
        this.deleteTreeFromLS(id);
      }
    });
    this.treeAndOtherStructure.push(treeCircle, trees);
    
    treeCircle.addListener("center_changed", () => {
      if(this.currentTabIndex === 0){
        const circleBounds = treeCircle.getBounds();
      trees.set("bounds", circleBounds)
      trees.setMap(this.map);
      this.updateTreeFromLS(id, treeCircle);
      }
    });

    treeCircle.addListener("radius_changed", () => {
      if(this.currentTabIndex === 0){
        const circleBounds = treeCircle.getBounds();
      trees.set("bounds", circleBounds)
      trees.setMap(this.map);
      this.updateTreeFromLS(id, treeCircle);
      }
    });

    treeCircle.addListener("drag", () => {
      const circleBounds = treeCircle.getBounds();
      trees.set("bounds", circleBounds)
      trees.setMap(this.map);
      this.updateTreeFromLS(id, treeCircle);
    });
    const treeObject = { id, center: treeCircle.getCenter(), radius: treeCircle.getRadius() };
    this.saveDataToLocalStorage(treeObject, 'tree');
    }
  }

  deleteTreeFromLS(id: string){
    // Now Update local storage data
    let localStorageData = localStorage.getItem('mapData');
    let parsedData = JSON.parse(localStorageData);
    parsedData.trees = parsedData.trees.filter((item: any) => item?.id !== id);
    localStorage.setItem('mapData', JSON.stringify(parsedData));
  }

  updateTreeFromLS(id, treeCircle){
    // Now Update local storage data
    let localStorageData = localStorage.getItem('mapData');
    let parsedData = JSON.parse(localStorageData);
    const tree = parsedData.trees.find((item: any) => item?.id === id);
    if(tree){
      tree.center = treeCircle.getCenter();
      tree.radius = treeCircle.getRadius();
      localStorage.setItem('mapData', JSON.stringify(parsedData));
    }
  }

  closeInfoWindow() {
    this.showInfowindow = false;
  }

  saveDataToLocalStorage(data: any, type: string, inititalAngle?: any) {
    let mapData = {
      customText: this.customTextMarkersArray,
      trees: this.treeMarkersArray,
      Drawings: {
        rectangle: this.rectangleDrawingArray,
        circle: this.circleDrawingArray,
        polyline: this.polylineDrawingArray
      },
      equipments: this.equipmentsArray
      ,
      roofLabel: this.roofLabelArray,
      roofLines: this.roofLinesArray,
      plotOutline: this.propertylineArray,
      driveways: this.polygonDrawingArray,
      rotate: this.mapRotationDegree
    };
    // Now push data to respective array in switch
    switch (type) {
      case 'tree': {
        this.treeMarkersArray.push(data);
        mapData.trees = this.treeMarkersArray;
        break;
      }
      case 'equipment': {
        const path = data.getPath().getArray();
        this.equipmentsArray.push({
          paths: path,
          id: data.id,
          title: data.title,
          rotation: data.rotation,
          scaleSize: data.scaleSize,
          equipmentText: data.equipmentText.label
        });
        mapData.equipments = this.equipmentsArray;
        break;
      }
      case 'customText': {
        this.customTextMarkersArray.push({
          icons: data.icon,
          label: data.label,
          position: data.position,
        });
        mapData.customText = this.customTextMarkersArray;
        break;
      }
      case 'plotOutline': {
        mapData.plotOutline = this.propertylineArray;
        const path = data.getPath().getArray();
        this.propertylineArray.push({
          path: path,
          strokeColor: data.strokeColor,
          strokeWeight: data.strokeWeight,
          id: data.id,
          solid: true,
          editable: true,
          draggable: true,
        });
        break;
      }
      case 'driveway': {
        const path = data.getPath().getArray();
        this.polygonDrawingArray.push({
          id: data.id,
          paths: path,
          strokeColor: data.strokeColor,
          strokeWeight: data.strokeWeight,
          fillOpacity: data.fillOpacity,
          fillColor: data.fillColor,
          editable: data.editable,
          draggable: data.draggable,
        });
        mapData.driveways = this.polygonDrawingArray;
        break;
      }
      case 'roof': {
        const path = data.getPath().getArray();
        this.roofLinesArray.push({
          id: data.id,
          paths: path,
          strokeColor: data.strokeColor,
          strokeWeight: data.strokeWeight,
          fillOpacity: data.fillOpacity,
          fillColor: data.fillColor,
          editable: data.editable,
          draggable: data.draggable,
        });
        mapData.roofLines = this.roofLinesArray;
        break;
      }
      case 'polyline': {
        const path = data.getPath().getArray();
        this.polylineDrawingArray.push({
          path: path,
          strokeColor: data.strokeColor,
          strokeWeight: data.strokeWeight,
          id: data.id,
          solid: true,
          editable: true,
          draggable: true,
        });
        mapData.Drawings.polyline = this.polylineDrawingArray;
        break;
      }
    }
    // Store data in local storage
    localStorage.setItem('mapData', JSON.stringify(mapData));
  }

  addLabel(path: any = [], index: number) {
    // converting data into array
    path = path.getArray();
    path.push(path[0]);
    let labelArr = [];
    // Loop on array
    for (let i = 0; i < (path.length - 1); i++) {
      // Get Start Point and End Point
      const startPoint = path[i];
      const endPoint = path[i + 1];
      // Calculate the length of the current segment
      const length = google.maps.geometry.spherical.computeLength([startPoint, endPoint]);
      const lengthMeter = length.toFixed(2);
      // Calculate the angle of the current segment
      let angle = google.maps.geometry.spherical.computeHeading(startPoint, endPoint);
      (angle >= 0) ? angle = angle - 90 : angle = 90 + angle;
      // Calculate the midpoint of the current segment
      const midpoint = this.calculateMidPoint([startPoint, endPoint]);
      // create dynamic class name
      const className = `label_${(Math.random() + 1).toString(36).substring(7)}_${i}`;
      // Adding Distance Label on Map
      const distanceLabel = new google.maps.Marker({
        position: midpoint,
        map: this.map,
        draggable: true,
        label: {
          text: this.metersToFeetAndInches(lengthMeter),
          color: 'black',
          className: className
        },
        icon: {
          url: "../../assets/icons/transparent_img.png",
          scaledSize: new google.maps.Size(10, 10),
        },
        crossOnDrag: false,
      });
      distanceLabel.set('labelAngle', angle);
      // Pushing Labels to array
      labelArr.push(distanceLabel);
      // Adding Rotation
      setTimeout(() => {
        let currentLabelClass = document.getElementsByClassName(className) as any;
        currentLabelClass[0].style.transform = `rotate(${angle}deg)`;
      }, 1000);
      // Add CLick event on distance Label
      google.maps.event.addListener(distanceLabel, 'click', () => {
        if (this.currentTabIndex === 0) {
          this.infoWindow.close();
          const element = document.getElementsByClassName(distanceLabel.getLabel().className) as any;
          let value = element[0].style.transform;
          value = value.split('(')[1].split(')')[0].split(',')[0].split('deg')[0];
          this.labelForm.patchValue({
            labelText: distanceLabel.getLabel().text,
            labelColor: distanceLabel.getLabel().color,
            labelRotation: value,
          })
          this.infoWindow.setContent(this.createLabelInfoWindowContent(className, distanceLabel))

          this.infoWindow.setPosition(distanceLabel.getPosition());
          this.infoWindow.open(this.map);

          this.infoWindow.addListener('domready', () => {
          });
        }
      });
    }
    // Pushing label array to global label array
    this.shapesLabels[index] = labelArr;
  }

  calculateMidPoint(path: any = []) {
    let centerLat = 0;
    let centerLng = 0;
    // Loop on given path
    path.forEach((latLng: { lng: () => any; lat: () => any; }) => {
      centerLat += latLng.lat();
      centerLng += latLng.lng();
    });
    centerLat /= path.length;
    centerLng /= path.length;
    // Adding some point to lat and lng to label
    centerLng += 0.000004;
    const midPoint = new google.maps.LatLng(centerLat, centerLng);
    return midPoint;
  }

  createLabelInfoWindowContent(className: string, distanceLabel: google.maps.Marker) {
    const div = document.createElement('div');
    div.classList.add('container');
    const heading = document.createElement('h2');
    heading.innerHTML = 'Change Label Details';
    div.appendChild(heading);
    const row1 = document.createElement('div');
    row1.classList.add('row');
    const col1 = document.createElement('div');
    col1.classList.add('col-md-6', 'col-lg-6', 'form-group');
    const label1 = document.createElement('label');
    label1.innerHTML = 'Label Text';
    col1.appendChild(label1);
    const labelText = document.createElement('input');
    labelText.classList.add('form-control')
    labelText.setAttribute('type', 'string');
    labelText.setAttribute('value', this.labelForm.get('labelText').value);
    col1.appendChild(labelText);
    row1.appendChild(col1);

    labelText.addEventListener('input', (event) => {
      // Patching value to label form
      this.labelForm.patchValue({
        labelText: (event.target as HTMLInputElement).value
      });
      // distanceLabel.setLabel({
      //   text: this.labelForm.get('labelText').value,
      //   color: this.labelForm.get('labelColor').value,
      //   className: distanceLabel.getLabel().className
      // });
    });

    const col2 = document.createElement('div');
    col2.classList.add('col-md-6', 'col-lg-6', 'form-group');
    const label2 = document.createElement('label');
    label2.innerHTML = 'Label Color';
    col2.appendChild(label2);
    const labelColor = document.createElement('input');
    labelColor.setAttribute('type', 'color');
    labelColor.setAttribute('value', this.labelForm.get('labelColor').value);
    labelColor.classList.add('form-control')
    col2.appendChild(labelColor);
    row1.appendChild(col2);

    labelColor.addEventListener('input', (event) => {
      this.labelForm.patchValue({
        labelColor: (event.target as HTMLInputElement).value
      });
      const colorCode: string = this.labelForm.get('labelColor').value;
      // distanceLabel.setLabel({
      //   text: this.labelForm.get('labelText').value,
      //   color: this.labelForm.get('labelColor').value,
      //   className: distanceLabel.getLabel().className
      // });
    });
    div.appendChild(row1);

    const row2 = document.createElement('div');
    row2.classList.add('row');
    const col3 = document.createElement('div');
    col3.classList.add('col-md-6', 'col-lg-6', 'form-group');
    const label3 = document.createElement('label');
    label3.innerHTML = 'Label Degree';
    col3.appendChild(label3);

    const labelDegree = document.createElement('input');
    labelDegree.setAttribute('min', '0');
    labelDegree.setAttribute('max', '180');
    labelDegree.setAttribute('value', this.labelForm.get('labelRotation').value);

    labelDegree.classList.add('form-control')
    labelDegree.setAttribute('type', 'range');

    col3.appendChild(labelDegree);
    row2.appendChild(col3);


    labelDegree.addEventListener('input', (event) => {
      this.labelForm.patchValue({
        labelRotation: (event.target as HTMLInputElement).value
      });
      let currentLabelClass = document.getElementsByClassName(distanceLabel.getLabel().className) as any;
      currentLabelClass[0].style.transform = `rotate(${this.labelForm.get('labelRotation').value}deg)`;
    });

    const row3 = document.createElement('div');
    row3.classList.add('row');
    const col5 = document.createElement('div');
    col5.classList.add('col-md-12', 'col-lg-12');
    const submitBtn = document.createElement('input');
    submitBtn.setAttribute('type', 'success');
    submitBtn.setAttribute('value', 'Submit');
    submitBtn.classList.add('btn', 'btn-primary', 'float-right');

    col5.appendChild(submitBtn);
    row3.appendChild(col5);

    const submitlistener = submitBtn.addEventListener('click', (event) => {
      if (this.labelForm.invalid) {
        this.toastr.error('Please enter all details of label.');
        return;
      } else {
        distanceLabel.setLabel({
          text: this.labelForm.get('labelText').value,
          color: this.labelForm.get('labelColor').value,
          className: distanceLabel.getLabel().className
        });
        this.infoWindow.close();
      }
    });

    div.appendChild(row2);
    div.appendChild(row3);

    return div;
  }

  metersToFeetAndInches(meters: any) {
    // 1 meter = 3.28084 feet
    const feet = meters * 3.28084;
    // 1 foot = 12 inches
    const inches = (feet % 1) * 12;
    return `${Math.floor(feet)}'-${Math.round(inches)}"`;
  }

  inchestometer(inches: any) {
    return inches / 39.370;
  }

  addCustomText(markers?: any) {
    const timestamp = new Date().getTime();
    const className = "customText_" + timestamp;
    let customText = "Click to change text";
    let marker: any;
    if (!markers) {
      marker = new google.maps.Marker({
        position: { lat: this.currentSelectedLocation.lat(), lng: this.currentSelectedLocation.lng() },
        map: this.map,
        draggable: true,
        label: {
          text: `${customText}`,
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
      this.addListnerOnCustomText(marker, 'new');
      this.saveDataToLocalStorage(marker, 'customText');
      this.treeAndOtherStructure.push(marker);
    } else {
      markers.forEach((data: any) => {
        marker = new google.maps.Marker({
          position: { lat: data?.position.lat, lng: data?.position.lng },
          map: this.map,
          draggable: true,
          label: {
            text: data?.label?.text,
            className: data?.label?.className,
            fontSize: data?.label?.fontSize,
            color: data?.label?.color
          },
          icon: {
            url: "../../assets/transparent_img.png",
            scaledSize: new google.maps.Size(50, 50),
          },
          crossOnDrag: false,
        });
        this.addListnerOnCustomText(marker, 'existing');
        this.treeAndOtherStructure.push(marker);
      })
    }
  }

  addListnerOnCustomText(marker: any, type: string) {
    if (marker && this.currentTabIndex === 0) {
      if (type == 'existing') {
        setTimeout(() => {
          let localStorageData = localStorage.getItem('mapData');
          if (localStorageData) {
            let parsedData = JSON.parse(localStorageData);
            parsedData.customText.forEach((item: any) => {
              if (item?.rotation) {
                let currentLabelClass = document.getElementsByClassName(item?.label?.className) as any;
                currentLabelClass[0].style.transform = `rotate(${item?.rotation}deg)`;
              }
            })
          }
        }, 1000);
      }
      // Adding Click Event
      marker.addListener('click', (event: any) => {
        this.showInfowindow = true;
        this.showObjectInfoWindow = 'text';
        // Getting Text properties
        const customTextProperties = marker.getLabel();
        this.customTextObject['customTextValue'] = customTextProperties.text;
        this.customTextObject['customTextFont'] = customTextProperties.fontSize;
        this.customTextObject['customTextColor'] = customTextProperties.color;
        // Updating data on change
        setTimeout(() => {
          const handleSliderChange = (args: any) => {
            const currentSliderValue = args.value;
            let currentLabelClass = document.getElementsByClassName(marker?.label?.className) as any;
            currentLabelClass[0].style.transform = `rotate(${currentSliderValue}deg)`;
            let localStorageData = localStorage.getItem('mapData');
            let parsedData = JSON.parse(localStorageData);
            this.customTextMarkersArray = this.customTextMarkersArray.map(item => {
              if (item?.label?.className == marker?.label?.className) {
                item.rotation = args.value;
              }
              return item;
            })
            if (parsedData?.customText) {
              parsedData.customText = this.customTextMarkersArray;
              localStorage.setItem('mapData', JSON.stringify(parsedData));
            }
          };
          const sliderElement: any = $("#slider1");
          sliderElement.roundSlider({
            value: 0,
            min: -180,
            max: 180,
            radius: 70,
            drag: handleSliderChange,
            change: handleSliderChange,
          });
          const inputFontSize = document.getElementById('inputFontSize') as HTMLInputElement;
          const sliderValueSpan = document.getElementById('FontSliderValue');
          const inputText = document.getElementById('inputText') as HTMLInputElement;
          const colorPicker = document.getElementById('colorPicker') as HTMLInputElement;
          const removeCustomText = document.getElementById('removeCustomText') as HTMLInputElement;

          // To change the font-size
          if (inputFontSize && sliderValueSpan) {
            inputFontSize.addEventListener('input', () => {
              const newSize = Number(inputFontSize.value);
              if (marker) {
                const label = marker.getLabel() as google.maps.MarkerLabel;

                if (label) {
                  label.fontSize = `${newSize + 'px'}`; // Set your desired font size
                  marker.setLabel(label);
                }
              }
              // Update the value in the span
              sliderValueSpan.innerText = newSize.toString();
              this.saveCustomMarkerData(marker, 'fontSize');
            });
          }

          if (colorPicker) {
            colorPicker.addEventListener('input', () => {
              const newColor = colorPicker.value;
              const label = marker.getLabel() as google.maps.MarkerLabel;
              if (label) {
                label.color = newColor; // Set the label text color
                marker.setLabel(label);
              }
              this.saveCustomMarkerData(marker, 'color');
            });
          }

          // To change the text value
          if (inputText) {
            inputText.addEventListener('input', () => {
              // Get the input value
              let newText = inputText.value;
              if (marker) {
                const label = marker.getLabel() as google.maps.MarkerLabel;
                if (label) {
                  label.text = newText; // Set the label text
                  if (newText === '') {
                    // If the input text is empty, hide the label
                    newText = 'Text Value Cannot Be Empty'
                    label.text = newText; // Set the label text
                    marker.setLabel(label);
                  } else {
                    // If there is text, show the label with the new text
                    marker.setLabel(label);
                  }
                }
              }
              this.saveCustomMarkerData(marker, 'text');
            });
          }

          removeCustomText.addEventListener('click', () => {
            let localStorageData = localStorage.getItem('mapData');
            if (localStorageData) {
              let parsedData = JSON.parse(localStorageData);
              parsedData.customText = parsedData.customText.filter((item: any) => item?.label?.className !== marker?.label?.className);
              localStorage.setItem('mapData', JSON.stringify(parsedData));
              this.customTextMarkersArray = this.customTextMarkersArray.filter((item: any) => item?.label?.className !== marker?.label?.className);
              marker.setMap(null); // Remove the tree from the map
              this.closeInfoWindow();
            }
          })
          // });
        }, 500);
      });
      marker.addListener('dragend', (event: any) => {
        this.saveCustomMarkerData(marker, 'position');
      })
    }
  }

  // Updating Local Storage Custom text data
  saveCustomMarkerData(marker: any, type: string) {
    let localStorageData = localStorage.getItem('mapData');
    let parsedData = JSON.parse(localStorageData);
    // Update the array based on the condition
    const customText = this.customTextMarkersArray.find((customText) => customText.label.className === marker.label.className);
    if (customText) {
      customText.label.text = marker.label.text;
      customText.label.color = marker.label.color;
      customText.position = marker.position;
      customText.label.fontSize = marker?.label?.fontSize;
    }
    if (parsedData.customText) {
      parsedData.customText = this.customTextMarkersArray;
      localStorage.setItem('mapData', JSON.stringify(parsedData));
    }
  }

  // String Layout Code
  isEndOfArray(): boolean {
    return this.currentIndex >= this.stringColors.length;
  }

  addStringLayout(): void {
    if (this.stringColors.length === this.stringPannelData.length) {
      return;
    }
    const newStringLayout = {
      color: this.stringColors[this.stringPannelData.length].color,
      stringValue: this.stringColors[this.stringPannelData.length].name,
      totalString: 0,
      polygons: []
    };
    this.stringPannelData.push(newStringLayout);
    this.currentIndex = this.stringPannelData.length;
  }

  selectCurrentColor(index: number) {
    this.currentIndex = index + 1
  }

  addBlankLabelToModule(polygon) {
    if (polygon instanceof google.maps.Polygon) {
      let bounds = new google.maps.LatLngBounds();
      let paths = polygon.getPaths();
      if (paths && paths.getLength() > 0) {
        let firstPath = paths.getAt(0);
        if (firstPath && firstPath.getLength() > 0) {
          firstPath.forEach((latLng) => {
            bounds.extend(latLng);
          });
          // getting panel center
          let center = bounds.getCenter();
          // Creating Label
          let labelMarker = new google.maps.Marker({
            position: { lat: center.lat(), lng: center.lng() },
            draggable: true,
            icon: {
              url: "../../assets/transparent_img.png",
              scaledSize: new google.maps.Size(1, 1),
              anchor: new google.maps.Point(0.5, 0.5),
            },
            crossOnDrag: false,
            map: this.map
          });
          // Show and hide on zoom
          google.maps.event.addListener(this.map, 'zoom_changed', () => {
            const currentZoom = this.map.getZoom();
            if (currentZoom === 22) {
              labelMarker.setMap(this.map);
            } else {
              labelMarker.setMap(null);
            }
          });
          return labelMarker;
        }
      }
    }
    return '';
  }

  addStringLayoutIndex(moduleObj) {
    if (this.currentIndex > 0) {
      const findClickedModule = this.rawModules.find((el) => el.moduleId === moduleObj.id);
      if (findClickedModule) {
        this.rawModules = this.rawModules.filter(object => {
          return object.moduleId !== moduleObj.id;
        });
        // Change Module Color back to black
        moduleObj.module.setOptions({
          fillColor: 'black',
          fillOpacity: 0.3,
          strokeOpacity: 1,
          strokeWeight: 0.9,
        });
        // Remove Module Label
        moduleObj.labelMarker.setLabel('');
        // Remove polygon data from array index
        this.stringPannelData[this.currentIndex - 1]['polygons'] = this.stringPannelData[this.currentIndex - 1]['polygons'].filter((panelId) => {
          return panelId !== moduleObj.id;
        });
        // Update existing panel
        this.stringPannelData[this.currentIndex - 1]['polygons'].forEach((panelId, index) => {
          const findModule = this.modulesObject.find((panel) => panel.id === panelId);
          if (findModule) {
            const panelLabel = `${this.stringPannelData[this.currentIndex - 1].stringValue}${index + 1}`;
            findModule.labelMarker.setLabel(panelLabel);
          }
        });
        if (findClickedModule.stringLayoutIndex !== this.currentIndex - 1) {
          this.stringPannelData[findClickedModule.stringLayoutIndex]['polygons'] = this.stringPannelData[findClickedModule.stringLayoutIndex]['polygons'].filter((panelId) => {
            return panelId != findClickedModule.moduleId;
          })
          this.stringPannelData[findClickedModule.stringLayoutIndex]['polygons'].forEach((panelId, index) => {
            const findModule = this.modulesObject.find((panel) => panel.id === panelId);
            if (findModule) {
              const panelLabel = `${this.stringPannelData[findClickedModule.stringLayoutIndex].stringValue}${index + 1}`;
              findModule.labelMarker.setLabel(panelLabel);
            }
          });
        }
      } else {
        if (this.stringPannelData[this.currentIndex - 1]) {
          this.rawModules.push({ moduleId: moduleObj.id, stringLayoutIndex: this.currentIndex - 1, ...moduleObj });
          moduleObj.module.setOptions({
            strokeOpacity: 1,
            strokeWeight: 1,
            fillColor: this.stringPannelData[this.currentIndex - 1].color,
            fillOpacity: 0.8,
          });
          // Push polygon and other data to string layout
          this.stringPannelData[this.currentIndex - 1]['polygons'].push(moduleObj.id);
          const stringCount = this.stringPannelData[this.currentIndex - 1]['polygons'].length;
          this.stringPannelData[this.currentIndex - 1]['totalString'] = stringCount;
          const panelLabel = `${this.stringPannelData[this.currentIndex - 1].stringValue}${stringCount}`;
          moduleObj.labelMarker.setLabel(panelLabel);
        }
      }
      this.createStringLayoutJson();
    }
  }

  createStringLayoutJson() {
    const stringingModules = [];
    this.stringPannelData.forEach((stringObject, stringIndex) => {
      stringObject.polygons.forEach((moduleId, modulndex) => {
        const findModule = this.modulesObject.find((module) => module.id === moduleId);
        if (findModule) {
          const panelLabel = `${this.stringPannelData[stringIndex].stringValue}${modulndex + 1}`;
          const object = {
            id: findModule.id,
            lines: findModule.lines,
            stringingvalue: panelLabel,
            orientation: findModule.orientation
          };
          stringingModules.push(object);
        }
      });
    });
    localStorage.setItem('stringLayoutArr', JSON.stringify(stringingModules));
  }

  createShapesFromLocalStorage(data: any, type: any) {
    switch (type) {
      case 'polyline': {
        data.forEach((item: any) => {
          let polyline = new google.maps.Polyline({
            path: item.path,
            editable: true,
            strokeColor: item.strokeColor,
            strokeWeight: item.strokeWeight,
            map: this.map,
          });
          polyline.set('id', item.id);
          if (!item.solid) {
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
          }
          this.allOtherHouseObjects.push(polyline);
          google.maps.event.addListener(polyline, 'click', () => {
            this.openPolylineInfoWindow(polyline);
          });
          google.maps.event.addListener(polyline.getPath(), 'set_at', () => {
            this.savePolylineData(polyline, '');
          });
        });
      }
    }
  }

  savePolylineData(polyline?: any, type?: string) {
    let localStorageData = localStorage.getItem('mapData');
    let parsedData = JSON.parse(localStorageData);
    // Update the array based on the condition
    const line = parsedData.Drawings.polyline.find((poly) => poly.id === polyline['id']);
    if (line) {
      const path = polyline.getPath().getArray();
      line.path = path;
      line.strokeColor = polyline.strokeColor;
      line.strokeWeight = polyline.strokeWeight;
      line.solid = polyline.solid;
      // Now update local storage data
      parsedData.Drawings.polyline = parsedData.Drawings.polyline;
      localStorage.setItem('mapData', JSON.stringify(parsedData));
    }
  }

  drawRafter(roofId: number = 0) {
    const rafter = [];
    const roofModules = this.modulesObject.filter((module) => module.roofIndex === roofId && module.isVisible);
    if (roofModules.length > 0) {
      // getting first module line
      const panelFirstLineStart = roofModules[0].module.getPath().getArray()[3];
      const panelFirstLineEnd = roofModules[0].module.getPath().getArray()[0];
      // Get line angle
      const panelFirstLineAngle = google.maps.geometry.spherical.computeHeading(panelFirstLineStart, panelFirstLineEnd);
      // forward and backward rafter variable
      const forwardRafter = [];
      const backwardRafter = [];

      const firstRafterStartPoint = google.maps.geometry.spherical.computeOffset(panelFirstLineStart, -5, panelFirstLineAngle);
      const firstRafterEndPoint = google.maps.geometry.spherical.computeOffset(panelFirstLineEnd, 5, panelFirstLineAngle);

      forwardRafter.push([firstRafterStartPoint, firstRafterEndPoint]);
      backwardRafter.push([firstRafterStartPoint, firstRafterEndPoint]);


      const roof = this.updatedRoofs.find((roof) => roof.roofIndex === roofId);

      if (roof && roof.paths) {
        const firstRafter = this.getIntersection(roof.paths, [firstRafterStartPoint, firstRafterEndPoint]);
        if (firstRafter) {
          rafterFormat(firstRafter)
          this.drawRafterLine(firstRafter);
        }

        createForwardRafter(this.map, this.rafterGap, this);
        createBackwardRafter(this.map, this.rafterGap, this);

      }

      function createForwardRafter(map, rafterGap, self) {
        let createNew = true;
        while (createNew) {
          const lineStart = google.maps.geometry.spherical.computeOffset(forwardRafter[forwardRafter.length - 1][0], (rafterGap * 0.0254), panelFirstLineAngle + 90);
          const lineEnd = google.maps.geometry.spherical.computeOffset(forwardRafter[forwardRafter.length - 1][1], (rafterGap * 0.0254), panelFirstLineAngle + 90);
          forwardRafter.push([lineStart, lineEnd])
          let newLine = self.getIntersection(roof.paths, [lineStart, lineEnd])
          if (!newLine) createNew = false;
          else {
            rafterFormat(newLine);
            self.drawRafterLine(newLine);
          }
        }
      }

      function createBackwardRafter(map, rafterGap, self) {
        let createNew = true;
        while (createNew) {
          const lineStart = google.maps.geometry.spherical.computeOffset(backwardRafter[backwardRafter.length - 1][0], -(rafterGap * 0.0254), panelFirstLineAngle + 90);
          const lineEnd = google.maps.geometry.spherical.computeOffset(backwardRafter[backwardRafter.length - 1][1], -(rafterGap * 0.0254), panelFirstLineAngle + 90);
          backwardRafter.push([lineStart, lineEnd])
          let newLine = self.getIntersection(roof.paths, [lineStart, lineEnd])
          if (!newLine) createNew = false;
          else {
            rafterFormat(newLine);
            self.drawRafterLine(newLine);
          }
        }
      }

      function rafterFormat(line) {
        let singleRafter: any = {}
        singleRafter.id = `R${rafter.length + 1}`;
        singleRafter.unit = "feet"
        const startPoint = line[0];
        const endPoint = line[1];
        singleRafter.length = (google.maps.geometry.spherical.computeLength(line) * 3.28084).toFixed(2);
        singleRafter.angle = google.maps.geometry.spherical.computeHeading(startPoint, endPoint);
        singleRafter.start = startPoint;
        singleRafter.end = endPoint;
        rafter.push(singleRafter);
      }

      this.drawAttachments(roofId);

    }
  }

  drawRafterLine(line: any) {
    const rafter = new google.maps.Polyline({
      path: line,
      icons: [{
        icon: {
          path: 'M 0,-1 0,1',
          strokeOpacity: 0.5,
          scale: 2,
        },
        offset: '0',
        repeat: '10px',
      }],
      strokeColor: "gray",
      strokeOpacity: 0,
      strokeWeight: 2,
      zIndex: 11,
      map: this.map
    });
    this.allAttachmentsRaftersRails.push(rafter);
  }

  drawAttachments(roofId: number = 0) {
    const distanceBwModules = parseFloat(this.inchestometer(this.distanceBwModules).toFixed(2));
    const roofModules = this.modulesObject.filter((module) => module.roofIndex === roofId && module.isVisible);
    let rows = [];
    for (let i = 0; i < roofModules.length; i++) {
      if (i === 0) {
        rows[rows.length] = [roofModules[i]];
      } else {
        const lastPanelIndex = rows[rows.length - 1].length - 1;
        const lastPanel = rows[rows.length - 1][lastPanelIndex];
        // Calculate Distance
        const distance = parseFloat(google.maps.geometry.spherical.computeLength([lastPanel.module.getPath().getArray()[1], roofModules[i].module.getPath().getArray()[0]]).toFixed(2));
        if (distance === distanceBwModules) {
          rows[rows.length - 1].push(roofModules[i]);
        } else {
          rows[rows.length] = [roofModules[i]];
        }
      }
    }
    // Now Draw Rails
    rows.forEach((rowModules) => {
      const orientation = rowModules[0].orientation;
      const angle = rowModules[0].angle;
      const checkIntersetionAngle = rowModules[0].checkIntersetionAngle;
      // Now draw Rails
      const railPoint1 = google.maps.geometry.spherical.computeOffset(rowModules[0].module.getPath().getArray()[0], (orientation === 'LANDSCAPE') ? -this.inchesToMeters(8) : -this.inchesToMeters(12), checkIntersetionAngle ? angle - 90 : angle + 90);
      const railPoint2 = google.maps.geometry.spherical.computeOffset(rowModules[rowModules.length - 1].module.getPath().getArray()[1], (orientation === 'LANDSCAPE') ? -this.inchesToMeters(8) : -this.inchesToMeters(12), checkIntersetionAngle ? angle - 90 : angle + 90);
      const railPoint3 = google.maps.geometry.spherical.computeOffset(rowModules[0].module.getPath().getArray()[3], (orientation === 'LANDSCAPE') ? this.inchesToMeters(8) : this.inchesToMeters(12), checkIntersetionAngle ? angle - 90 : angle + 90);
      const railPoint4 = google.maps.geometry.spherical.computeOffset(rowModules[rowModules.length - 1].module.getPath().getArray()[2], (orientation === 'LANDSCAPE') ? this.inchesToMeters(8) : this.inchesToMeters(12), checkIntersetionAngle ? angle - 90 : angle + 90);
      // Drawing polyline
      const rail1 = new google.maps.Polyline({
        path: [railPoint1, railPoint2],
        zIndex: 12,
        strokeWeight: 1,
        strokeOpacity: 1,
        strokeColor: "#2b2d47",
        map: this.map
      });
      const rail2 = new google.maps.Polyline({
        path: [railPoint3, railPoint4],
        zIndex: 12,
        strokeWeight: 1,
        strokeOpacity: 1,
        strokeColor: "#2b2d47",
        map: this.map
      });
      this.allAttachmentsRaftersRails.push(rail1, rail2);
      // Now draw Attachments
      const railLength = google.maps.geometry.spherical.computeLength([railPoint1, railPoint2]);
      const railAngle = this.calculateAngle(railPoint1.lat(), railPoint1.lng(), railPoint2.lat(), railPoint2.lng());
      const gap1 = this.inchesToMeters(6);
      const gap2 = this.inchesToMeters(24);
      const continuousGap = this.inchesToMeters(48);

      let attachmentPosition = google.maps.geometry.spherical.computeOffset(railPoint1, gap1, railAngle);
      this.drawAttachmentCiecle(railPoint1);

      attachmentPosition = google.maps.geometry.spherical.computeOffset(attachmentPosition, gap2, railAngle);
      this.drawAttachmentCiecle(attachmentPosition);

      // Continue with regular intervals
      const numAttachments = Math.floor((railLength - gap1 - gap2) / continuousGap);

      for (let i = 0; i < numAttachments; i++) {
        attachmentPosition = google.maps.geometry.spherical.computeOffset(attachmentPosition, continuousGap, railAngle);
        this.drawAttachmentCiecle(attachmentPosition);
      }
      // Now Adiding bototm attachments
      const bottomContinuousGap = this.inchesToMeters(48);
      let lastAttachmentGap = google.maps.geometry.spherical.computeLength([attachmentPosition, railPoint2]);

      this.drawAttachmentCiecle(railPoint3);

      const lastAttachmentPosition = google.maps.geometry.spherical.computeOffset(railPoint4, -lastAttachmentGap, railAngle);

      this.drawAttachmentCiecle(lastAttachmentPosition);

      let bottomLength = railLength - lastAttachmentGap;

      const bottomNumAttachments = Math.floor(bottomLength / continuousGap);

      let bottomAttachmentPosition = railPoint3;
      for (let i = 0; i < bottomNumAttachments; i++) {
        bottomAttachmentPosition = google.maps.geometry.spherical.computeOffset(bottomAttachmentPosition, bottomContinuousGap, railAngle);
        this.drawAttachmentCiecle(bottomAttachmentPosition);
      }
    });
  }

  drawAttachmentCiecle(center: google.maps.LatLng) {
    const attachment = new google.maps.Circle({
      center: center,
      radius: 0.05,
      fillColor: "black",
      fillOpacity: 1,
      zIndex: 12,
      map: this.map
    });
    this.allAttachmentsRaftersRails.push(attachment);
  }

  getIntersection(roofLines, line) {
    let newLine = [];

    for (let i = 0; i < roofLines.length - 1; i++) {
      const d1 = [{ lat: roofLines[i].lat(), lng: roofLines[i].lng() }, { lat: roofLines[i + 1].lat(), lng: roofLines[i + 1].lng() }];
      const intersection = this.findIntersection({ lat: line[0].lat(), lng: line[0].lng() }, { lat: line[1].lat(), lng: line[1].lng() }, d1);

      if (intersection) {
        newLine.push(intersection);
      }
    }
    if (newLine.length > 1) {
      return newLine;
    }
    return null;
  }

  getMapCenter() {
    let finalPdfJSON = JSON.parse(localStorage.getItem('roofsJSON'));
    const propertylinePath = finalPdfJSON.propertyLine.map((line) => new google.maps.LatLng(line.start.lat, line.start.lng));
    const bounds = new google.maps.LatLngBounds();
    propertylinePath.forEach((latLng: google.maps.LatLng | google.maps.LatLngLiteral) => {
      bounds.extend(latLng);
    });
    this.mapCenter = bounds.getCenter();
  }

  rotateMap = (amount: number) => {
    this.accumulatedAmount += amount;
    this.map.setHeading(this.map.getHeading()! + amount);
    if (this.accumulatedAmount > 360) {
      this.accumulatedAmount = 0;
    }
    this.addStringLayoutRotation();
  }

  addStringLayoutRotation() {
    const stringLayoutRotation = { rotation: this.accumulatedAmount, center: this.mapCenter };
    localStorage.setItem('stringLayoutRotation', JSON.stringify(stringLayoutRotation));
  }

}
