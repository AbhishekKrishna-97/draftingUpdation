import { Component, OnInit, ViewChild, HostListener, ChangeDetectorRef } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material/dialog';
import { ModuleDetailComponent } from '../module-detail/module-detail.component';
import { CommonService } from 'src/app/services/commonservice';
import { CustomMenu } from 'src/app/helper/context-menu.class';
import { CustomModuleComponent } from '../custom-module/custom-module.component';
import { event } from 'jquery';
import { filter } from 'rxjs';
import { HttpBackend } from '@angular/common/http';

@Component({
  selector: 'app-roof-marking',
  templateUrl: './roof-marking.component.html',
  styleUrls: ['./roof-marking.component.scss']
})
export class RoofMarkingComponent implements OnInit {

  isloading: boolean;
  map: any;
  activeTool: string;
  @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
  drawingManager: any;
  defaultTimeOut: number = 1000;
  allRoofLines: any = [];
  polygon: any;
  label: any;
  clickedPoints = [];
  roofPolyline: google.maps.Polyline;
  roofLabels = [];
  arc: any;
  roofArcAngles = [];
  roofPolygon: any = [];
  currentSelectedLocation: google.maps.LatLng;
  undoMarker: google.maps.Marker;
  mapDblClickEvent: any;
  mapMouseMoveEvent: any;
  mouseClickEvent: any;
  obstaclesArray: any = [];
  currentTabIndex: number = 0;
  allEaveLines: any = [];
  allRidgeLines: any = [];
  checkPairLineClicked: boolean = false;
  nearestPoints: google.maps.Marker[] = [];
  roofLine = { strokeColor: 'black', size: 2, fillColor: '#FF9393' };
  eaveLineColor: string = 'grey';
  ridgeLineColor: string = 'orange';
  moduleDetailsFormData = {
    moduleHeight: 61.68,
    moduleWidth: 40.08,
    distanceBwModule: 0.25,
    eaveSetBack: 6,
    ridgeSetBack: 12,
    otherSetBack: 18,
    rakeSetBack: 36,
    obstacleSetBack: 0
  };
  noSetBackRoof: google.maps.Polygon[] = [];
  contextMenuPolygon: google.maps.Polygon;

  moduleHegiht: any = 61.68;
  modulewidth: any = 40.08;
  distanceBwModules: any = 0.25;
  guidedLine: google.maps.Polyline;
  guidedLine90deg: google.maps.Polyline;
  roofMarkedConfirmation: string = 'Are you sure, you want to proceed for eave marking?';
  customMenu: any;
  contextMenuVertex: any;
  vertexClickEvent = [];
  vertexMarker: google.maps.Marker[] = [];
  clikedPolygonVertex: google.maps.Polygon;

  // Adding UNDO event
  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    const ctrlandCmdKey = (event.ctrlKey) || (event.metaKey);
    const pressedKey = event.key.toLowerCase();
    event.stopPropagation();
    if (ctrlandCmdKey && pressedKey === 'z') {
      // Perform undo functionality here
      this.removeLastClickedPoint();
    }
    if (ctrlandCmdKey && pressedKey === 'm') {
      if (this.currentTabIndex === 3) {
        this.actionToggle(event, 'module');
      }
    }
    if (pressedKey === 's') {
      if (this.currentTabIndex === 0) {
        this.actionToggle(event, 'module-setback-details')
        event.preventDefault();
      }
    }
  }



  constructor(
    private toastr: ToastrService,
    private dialog: MatDialog,
    private commonService: CommonService,
    private cdRef: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.isloading = true;
    // setTimeout(() => {
    //   this.activeTool = 'hand';
    //   this.initializeMap();
    //   this.editingTools();
    //   this.detectMapTypeIdChangeEvent();
    //   this.addZoomChangeEvent();
    //   const roof = [[{ "lat": 27.704652294256196, "lng": -97.41111125143387 }, { "lat": 27.704603019022578, "lng": -97.41101670356609 }, { "lat": 27.70467722870331, "lng": -97.41103950234272 }], [{ "lat": 27.704603019022578, "lng": -97.41101670356609 }, { "lat": 27.704695039019192, "lng": -97.41096068049889 }, { "lat": 27.70468079076672, "lng": -97.41103400940145 }, { "lat": 27.70467722870331, "lng": -97.41103950234272 }], [{ "lat": 27.704695039019192, "lng": -97.41096068049889 }, { "lat": 27.70472650390344, "lng": -97.4110249612855 }, { "lat": 27.70471581771735, "lng": -97.41108531098834 }, { "lat": 27.70468850857036, "lng": -97.41103501956931 }, { "lat": 27.70468079076672, "lng": -97.41103400940145 }], [{ "lat": 27.70471581771735, "lng": -97.41108531098834 }, { "lat": 27.7048002879544, "lng": -97.4110380494812 }, { "lat": 27.704809193102662, "lng": -97.41097032370358 }, { "lat": 27.70472650390344, "lng": -97.4110249612855 }], [{ "lat": 27.7048002879544, "lng": -97.4110380494812 }, { "lat": 27.704809193102662, "lng": -97.41097032370358 }, { "lat": 27.704851344127853, "lng": -97.41105749549656 }], [{ "lat": 27.704851344127853, "lng": -97.41105749549656 }, { "lat": 27.7048002879544, "lng": -97.4110380494812 }, { "lat": 27.70471581771735, "lng": -97.41108531098834 }, { "lat": 27.704685708315363, "lng": -97.41116076054364 }], [{ "lat": 27.704685708315363, "lng": -97.41116076054364 }, { "lat": 27.70467027270712, "lng": -97.41110711636334 }, { "lat": 27.70468850857036, "lng": -97.41103501956931 }, { "lat": 27.70471581771735, "lng": -97.41108531098834 }], [{ "lat": 27.70467027270712, "lng": -97.41110711636334 }, { "lat": 27.704652294256196, "lng": -97.41111125143387 }, { "lat": 27.70467722870331, "lng": -97.41103950234272 }, { "lat": 27.70468079076672, "lng": -97.41103400940145 }, { "lat": 27.70468850857036, "lng": -97.41103501956931 }]];
    //   roof.forEach((el) => {
    //     const polygon = new google.maps.Polygon({
    //       paths: el,
    //       map: this.map,
    //       strokeWeight: 2,
    //       editable: false,
    //       fillColor: this.roofLine.fillColor
    //     });
    //   });


    //   // Passing data to common service
    //   this.commonService.roofMarkingData = { roofPolygon: this.roofPolygon, obstacles: this.obstaclesArray, roofLines: this.allRoofLines };
    //   this.customMenu = new CustomMenu('contextMenu');
    //   this.contextMenuVertex = new CustomMenu('contextMenuVertex');
    // }, this.defaultTimeOut);
    // setInterval(() => {
    //   this.saveData()
    // }, 10000)
    this.getSavedData();
  }

  async getSavedData(){
    console.log('inside saved data')
    await this.commonService.fetchDraftingData().then((res: any) => {
      console.log('response added')
      const savedData = res.data[0]?.attributes?.manualrawjson?.preDraftingDataManual;
      this.addBackendData(savedData);
      this.isloading = false;
    }).catch((error) => {
      console.log(error)
    })
  }

  addBackendData(data){
    // Adding Roofs from data
    data.roofs?.forEach((el) => {
      const polygon = new google.maps.Polygon({
        paths: el.path,
        map: this.map,
        strokeWeight: 2,
        editable: false,
        fillColor: this.roofLine.fillColor
      });
      polygon.set('id', el.id);
      this.addRoofPolygonEvent(polygon);
    });
    // Adding obstacles from data
    data.obstacles?.forEach((obs) => {
      console.log(obs)
      if(obs.type === 'circle'){
        const circle = new google.maps.Circle({
          center: obs.center,
          radius: obs.radius,
          map: this.map
        })
      }
    });
  }

  detectMapTypeIdChangeEvent() {
    google.maps.event.addListener(this.map, 'maptypeid_changed', () => {
      const mapTypeId = this.map.getMapTypeId();
      if (mapTypeId === 'hybrid' || mapTypeId === 'satellite') {
        // Changing Arc colot
        // this.arc && this.arc['angleLabel'] ? this.arc['angleLabel']?.setLabel({ label: this.arc['angleLabel'].getLabel(), color: 'white' }) : null;
        // this.arc ? this.arc.setOptions({ strokeColor: 'white' }) : null;
        // Changing Roof polyline stroke color
        this.roofPolyline ? this.roofPolyline.setOptions({ strokeColor: 'white' }) : null;
        this.roofPolygon.forEach(roof => {
          roof.setOptions({
            strokeColor: 'white'
          });
        });
      } else {
        // Changing Arc colot
        // this.arc && this.arc['angleLabel'] ? this.arc['angleLabel']?.setLabel({ label: this.arc['angleLabel'].getLabel(), color: 'black' }) : null;
        // this.arc ? this.arc.setOptions({ strokeColor: 'black' }) : null;
        // Changing Roof polyline stroke color
        this.roofPolyline ? this.roofPolyline.setOptions({ strokeColor: 'black' }) : null;
        this.roofPolygon.forEach(roof => {
          roof.setOptions({
            strokeColor: 'black'
          });
        });
      }
    });
  }

  initializeMap(): void {
    let center = new google.maps.LatLng(27.704605195834535, -97.41101413311408);
    const localStorageData = localStorage.getItem('permitdata');
    if (localStorageData) {
      const parseData = JSON.parse(localStorageData);
      if (parseData.lat && parseData.lng) {
        center = new google.maps.LatLng(parseData.lat, parseData.lng);
      }
    }
    this.currentSelectedLocation = center;
    this.map = new google.maps.Map(document.getElementById("dxfBoundariesMap")!, {
      center: center,
      zoom: 21,
      tilt: 0,
      heading: 0,
      disableDoubleClickZoom: true,
      styles: [
        {
          featureType: "road",
          elementType: "labels",
          stylers: [
            { visibility: "off" } // Hide street labels
          ]
        }
      ]
    });
  }

  actionToggle($event: Event, action: string) {
    this.removeMapClickMoveDblClick();
    this.removeVertexClickEvent();
    if(this.clickedPoints.length > 0){
      this.addDrawRoofDblClickEvent();
    }
    // $event.stopPropagation();
    if (this.activeTool === action) {
      this.activeTool = 'hand';
    } else {
      this.activeTool = action; // Set new active tool
      this.handleMenuClick(action);
    }
    this.cdRef.detectChanges();
  }

  editingTools() {
    // Now initialize drawing mode
    this.drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: null,
      drawingControl: false,
    });
    // Set Editing Options for drawing
    this.drawingManager.setOptions({
      rectangleOptions: {
        editable: false,
        strokeColor: '#00FF00',
        draggable: true,
        strokeWeight: 2,
        fillOpacity: 0.5,
        zIndex: 11
      },
      circleOptions: {
        editable: false,
        strokeColor: '#0000FF',
        draggable: true,
        strokeWeight: 2,
        fillOpacity: 0.5,
        zIndex: 11
      },
      polygonOptions: {
        editable: false,
        strokeColor: '#FFA500',
        draggable: true,
        strokeWeight: 3,
        fillOpacity: 0.5,
        zIndex: 11
      }
    });
    this.drawingManager.setMap(this.map);
    // On Rectangle Complete
    google.maps.event.addListener(this.drawingManager, 'rectanglecomplete', (rectangle: google.maps.Rectangle) => {
      this.addRectangleObsEvent(rectangle);
      this.addSetbackToObstacles();
    });
    // On Circle complete
    google.maps.event.addListener(this.drawingManager, 'circlecomplete', (circle: google.maps.Circle) => {
      this.addCircleObsEvent(circle);
      this.addSetbackToObstacles();
    });
    // On polygon complete
    google.maps.event.addListener(this.drawingManager, 'polygoncomplete', (polygon: google.maps.Polygon) => {
      this.addPolygonObsEvent(polygon);
      this.addSetbackToObstacles();
    });
  }

  addPolygonObsEvent(polygon: google.maps.Polygon) {
    const polygonId = this.activeTool === 'roof' ? `roof_${new Date().getTime()}` : `polygon_${new Date().getTime()}`;
    polygon.set('id', polygonId);
    polygon.set('type', 'polygon');
    this.obstaclesArray.push(polygon);
    // Add editable vent on single clcik
    polygon.addListener("click", () => {
      this.changeObstacleEditable(polygon);
      polygon.setOptions({ editable: !polygon.getEditable() })
    });
    // Add Dounle click event on polygon
    polygon.addListener("dblclick", () => {
      const text = "Are you sure, you want to delete this obstacle?";
      if (confirm(text)) {
        this.obstaclesArray = this.obstaclesArray.filter((obsPolygon) => obsPolygon.id !== polygon['id']);
        polygon.setMap(null);
      }
    });
  }

  addCircleObsEvent(circle: google.maps.Circle) {
    const circleId = `circle_${new Date().getTime()}`;
    circle.set('id', circleId);
    circle.set('type', 'circle');
    this.obstaclesArray.push(circle);
    // Add editable vent on single clcik
    circle.addListener("click", () => {
      this.changeObstacleEditable(circle);
      circle.setOptions({ editable: !circle.getEditable() })
    });
    // Add Dounle click event on polygon
    circle.addListener("dblclick", () => {
      const text = "Are you sure, you want to delete this obstacle?";
      if (confirm(text)) {
        this.obstaclesArray = this.obstaclesArray.filter((obsCircle) => obsCircle.id !== circle['id']);
        circle.setMap(null);
      }
    });
  }

  addRectangleObsEvent(rectangle: google.maps.Rectangle) {
    const rectangleId = `rectangle_${new Date().getTime()}`;
    rectangle.set('id', rectangleId);
    rectangle.set('type', 'rectangle');
    this.obstaclesArray.push(rectangle);
    // Add editable vent on single clcik
    rectangle.addListener("click", () => {
      this.changeObstacleEditable(rectangle);
      rectangle.setOptions({ editable: !rectangle.getEditable() })
    });
    // Add Dounle click event on polygon
    rectangle.addListener("dblclick", () => {
      const text = "Are you sure, you want to delete this obstacle?";
      if (confirm(text)) {
        this.obstaclesArray = this.obstaclesArray.filter((obsRectangle) => obsRectangle.id !== rectangle['id']);
        rectangle.setMap(null);
      }
    });
  }

  changeObstacleEditable(obstacle?: any) {
    const editableObstacle = obstacle ? this.obstaclesArray.find((el) => el['editable'] && el.id !== obstacle['id']) : this.obstaclesArray.find((el) => el['editable']);
    editableObstacle ? editableObstacle.setOptions({ editable: !editableObstacle.getEditable() }) : null;
  }

  closeMenu() {
    this.trigger.closeMenu();
  }

  handleMenuClick(selectedTool: string) {
    switch (selectedTool) {
      case 'hand': {
        this.enableSelect();
        this.removeMapEvent();
        break;
      }
      case 'roof': {
        this.drawRoof();
        this.disablePolygonClick();
        break;
      }
      case 'rectangle': {
        this.enableRectangle();
        break;
      }
      case 'circle': {
        this.enableCircle();
        break;
      }
      case 'polygon': {
        this.enablePolygon(); module
        break;
      }
      case 'module-setback-details': {
        this.openModuleSetBackForm();
        break;
      }
      case 'module': {
        this.addModule();
        break;
      }
    }
  }

  openModuleSetBackForm() {
    const dialogRef = this.dialog.open(ModuleDetailComponent, {
      disableClose: true,
      data: this.moduleDetailsFormData
    });
    // on esc press close the popup
    dialogRef.keydownEvents().pipe(filter(event => event.key === 'Escape')).subscribe(() => dialogRef.close());
    // Adding after close event
    dialogRef.afterClosed().subscribe(res => {
      if (res?.status) {
        this.toastr.success('setback details saved successfully.');
        this.moduleDetailsFormData = res.data;
        this.handleMenuClick('hand');
      } else {
        this.handleMenuClick('hand');
      }
    });
  }

  enableSelect(): void {
    this.drawingManager.setDrawingMode(null);
  }

  enableCircle(): void {
    this.drawingManager.setDrawingMode(google.maps.drawing.OverlayType.CIRCLE);
    this.resetDrawingMode();
  }
  enableRectangle(): void {
    this.drawingManager.setDrawingMode(google.maps.drawing.OverlayType.RECTANGLE);
    this.resetDrawingMode();
  }

  enablePolygon(): void {
    this.drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
    this.resetDrawingMode();
  }

  resetDrawingMode() {
    google.maps.event.addListener(this.drawingManager, 'overlaycomplete', (event: any) => {
      this.drawingManager.setDrawingMode(null);
      if (this.activeTool !== 'roof') {
        this.activeTool = 'hand';
      }
      this.cdRef.detectChanges();
    });
  }



  drawRoof() {
    this.map.setOptions({
      // disableDoubleClickZoom: true,
      draggableCursor: "crosshair"
    });
    // Setting drawing manager to null
    this.drawingManager.setDrawingMode(null);

    this.roofPolyline = new google.maps.Polyline({
      map: this.map,
      clickable: false,
      strokeColor: this.roofLine.strokeColor,
      strokeWeight: this.roofLine.size,
      path: []
    });

    this.mapMouseMoveEvent = google.maps.event.addListener(this.map, 'mousemove', (event) => {
      if (this.clickedPoints.length > 0) {
        this.roofPolyline.setPath([...this.clickedPoints, event.latLng]);
        const roofPointsLength = this.roofPolyline.getPath().getArray().length;
        const roofPoints = this.roofPolyline.getPath().getArray();
        const points = [roofPoints[roofPointsLength - 2], roofPoints[roofPointsLength - 1]];
        if (this.activeTool === 'roof' && !event.domEvent.shiftKey) {
          this.addLabel(points[0], points[1]);
        } else {
          this.guidedLine?.setMap(null);
          this.guidedLine = null;
        }
      }
      // Add Nearest point marker 
      if (this.activeTool === 'roof' && !event.domEvent.shiftKey) {
        this.checkRoofPoints(event.latLng);
      } else {
        this.removeNearestPoint();
      }

    });

    this.mouseClickEvent = google.maps.event.addListener(this.map, 'click', (event) => {
      this.addDrawRoofClickEvent(event.latLng);
    });

    this.mapDblClickEvent = google.maps.event.addListenerOnce(this.map, 'dblclick', (e) => {
      this.addDrawRoofDblClickEvent();
    });
  }

  addDrawRoofClickEvent(latlng: google.maps.LatLng) {
    if(this.guidedLine && this.guidedLine['influencePoint']){
      this.clickedPoints.push(this.guidedLine['influencePoint']);
    } else {
      this.clickedPoints.push(latlng);
    }
    this.roofPolyline.setPath(this.clickedPoints);
    this.checkRoofPolyline();
    this.removeNearestPoint();
    if (this.clickedPoints.length > 1 && this.areLatLngEqual(this.clickedPoints[0], this.clickedPoints.slice(-1)[0])) {
      this.addDrawRoofDblClickEvent();
    }
  }

  addDrawRoofDblClickEvent() {
    let path = this.roofPolyline.getPath().getArray();
    path = path.slice(0, path.length - 1);
    if (path.length <= 2) {
      this.roofPolyline?.setMap(null);
    } else {
      this.roofPolyline?.setMap(null);
      const polygon = new google.maps.Polygon({
        map: this.map,
        paths: path,
        strokeColor: this.roofLine.strokeColor,
        strokeWeight: this.roofLine.size,
        fillColor: this.roofLine.fillColor,
        fillOpacity: 0.2,
      });
      const polygonId = this.activeTool === 'roof' ? `roof_${new Date().getTime()}` : `polygon_${new Date().getTime()}`;
      polygon.set('id', polygonId);
      this.addRoofPolygonEvent(polygon);
    }
    this.removeMapEvent();
  }

  addRoofPolygonEvent(polygon: google.maps.Polygon) {
    this.roofPolygon.push(polygon);
    // Adding click event
    // polygon.addListener("click", () => {
    //   this.editRoof(polygon);
    // });
    // Add double click delete event
    polygon.addListener("dblclick", () => {
      this.deleteRoof(polygon);
    });
    // Adding right click event
    polygon.addListener("contextmenu", (event) => {
      this.contextMenuPolygon = polygon;
      const clickedPosition = event.latLng;
      this.customMenu.open(this.map, clickedPosition);
      this.cdRef.detectChanges();
    });
  }

  editRoof(polygon: google.maps.Polygon,event?){
    event?.stopPropagation();
    this.checkRoofEditable(polygon['id']);
    polygon.setEditable(!polygon.getEditable());
    this.removeVertexClickEvent();
    this.customMenu?.close();
  }

  deleteRoof(polygon: google.maps.Polygon){
    const text = "Are you sure, you want to delete this roof?";
      if (confirm(text)) {
        this.roofPolygon = this.roofPolygon.filter((rPolygon) => rPolygon.id !== polygon['id']);
        polygon.setMap(null);
        this.customMenu?.close();
        this.removeVertexClickEvent();
      }
  }

  addVertexClickEvent(polygon: google.maps.Polygon){
    const paths = polygon.getPath();
    polygon.setEditable(false);
    // first remove vertex click event
    this.removeVertexClickEvent();
    // Now loop on path and add marker
    paths.forEach((vertex, index) => {
      const marker = new google.maps.Marker({
        position: vertex,
        map: this.map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 5,
          fillColor: '#FF0000',
          fillOpacity: 1,
          strokeColor: '#FF0000',
          strokeOpacity: 1,
        },
        draggable: false
      });
      this.vertexMarker.push(marker);
      this.clikedPolygonVertex = polygon;
      // Now add click event on marker
      const vertexClickEvent = google.maps.event.addListener(marker, 'click', () => {
        polygon.set('clickedVeryexToDelete', index);
        this.openContextMenuForVertex(marker.getPosition());
      });
      this.vertexClickEvent.push(vertexClickEvent);
    });
    this.customMenu?.close();
  }

  openContextMenuForVertex(position: google.maps.LatLng){
    this.contextMenuVertex.open(this.map, position);
  }

  deleteVertex(polygon: google.maps.Polygon){
    const paths = polygon.getPath();
    if(paths.getLength() > 3){
      const updatedPaths = paths.removeAt(polygon['clickedVeryexToDelete']);
    polygon.setPath(paths.getArray())
    this.addVertexClickEvent(polygon);
    this.contextMenuVertex.close();
    } else {
      this.toastr.error(`You can't delete this roof vertex!`);
    }
  }

  removeVertexClickEvent(){
    // Now remove vertex click event
    this.vertexClickEvent.forEach((vertexClickEvent) => {
      google.maps.event.removeListener(vertexClickEvent);
    });
    this.vertexClickEvent = [];
    // now remove marker from map
    this.vertexMarker.forEach((marker) => {
      marker.setMap(null);
    });
    this.vertexMarker = [];
    this.contextMenuVertex.close();
  }

  addModule() {
    const dialogRef = this.dialog.open(CustomModuleComponent, {
      disableClose: true,
      data: this.moduleDetailsFormData
    });
    // Adding after close event
    dialogRef.afterClosed().subscribe(res => {
      if (res.status) {
        this.toastr.success('Details saved successfully.');
        this.moduleDetailsFormData = res.data;
        this.changeModuleDimension();
        this.handleMenuClick('hand');
      } else {
        this.handleMenuClick('hand');
      }
    });
  }

  checkRoofEditable(roofId?: string) {
    const editablePolygon = !roofId ? this.roofPolygon.find((el) => el['editable']) : this.roofPolygon.find((el) => el['editable'] && el['id'] !== roofId);
    editablePolygon ? editablePolygon.setOptions({ editable: !editablePolygon.getEditable() }) : null;
  }

  setDimensionLabel(label: google.maps.Marker) {
    let newLabel = new google.maps.Marker({
      position: label.getPosition(),
      map: this.map,
      draggable: false,
      label: {
        text: label.getLabel().text,
        color: 'orange'
      },
      icon: {
        url: "../../assets/transparent_img.png",
        scaledSize: new google.maps.Size(10, 10),
      },
      crossOnDrag: false,
      zIndex: 10
    });

    this.roofLabels.push(newLabel)
  }

  calculateArcAngle(point1, point2, point3) {
    const offset1 = google.maps.geometry.spherical.computeOffset(point2, -1, google.maps.geometry.spherical.computeHeading(point1, point2));
    const offset2 = google.maps.geometry.spherical.computeOffset(point2, 1, google.maps.geometry.spherical.computeHeading(point2, point3));
    const startAngle = google.maps.geometry.spherical.computeHeading(point2, offset1);
    const endAngle = google.maps.geometry.spherical.computeHeading(point2, offset2);

    const startLineAngle = google.maps.geometry.spherical.computeHeading(point1, point2);
    const movingLineAngle = google.maps.geometry.spherical.computeHeading(point2, point3);
    let nearest45 = startLineAngle
    // now calculate guided line angle
    let guidedLineAngle = startLineAngle < 0 ? 180 + startLineAngle + 45 : 180 - startLineAngle - 45;
    guidedLineAngle = Math.round(guidedLineAngle);

    let newAngle = (endAngle - startAngle);
    newAngle = (newAngle >= 0) ? newAngle : newAngle + 360;
    newAngle = Math.round(newAngle);

    const angleLies = this.checkArcAngle(newAngle);
    if (angleLies) {
      const movingLineAngle = google.maps.geometry.spherical.computeHeading(point2, point3);

      const movingLineLength = google.maps.geometry.spherical.computeLength([point2, point3]);
      const newPoint = google.maps.geometry.spherical.computeOffset(point2, movingLineLength + 15, startAngle + angleLies);
      const influencePoint = google.maps.geometry.spherical.computeOffset(point2, movingLineLength, startAngle + angleLies);
      if (!this.guidedLine) {
        // Update roof line according to influence line
        this.roofPolyline.setPath([...this.clickedPoints, influencePoint]);
        this.guidedLine = new google.maps.Polyline({
          path: [point2, newPoint],
          map: this.map,
          strokeColor: "red",
          clickable: false,
          zIndex: -99
        });
        this.guidedLine.set('angleLies', angleLies);
        this.guidedLine.set('influencePoint', influencePoint);
        this.guidedLine.setOptions({
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
      } else if (angleLies) {
        this.guidedLine.setPath([point2, newPoint]);
        this.roofPolyline.setPath([...this.clickedPoints, influencePoint]);
        this.guidedLine.set('influencePoint', influencePoint);
      }
    } else {
      this.guidedLine?.setMap(null);
      this.guidedLine = null;
    }

    // const numPoints = 100;
    // let angleLabelPosition;
    // const arcCoordinates = [];
    // for (let i = 0; i <= numPoints; i++) {
    //   const angle = startAngle + (i / numPoints) * (endAngle - startAngle);
    //   const point = google.maps.geometry.spherical.computeOffset(point2, 0.5, angle);
    //   if (i == 50) {
    //     angleLabelPosition = google.maps.geometry.spherical.computeOffset(point2, 1, angle);
    //   }
    //   arcCoordinates.push(point);
    // }

    // if (!this.arc) {
    //   this.arc = new google.maps.Polyline({
    //     path: arcCoordinates,
    //     geodesic: true,
    //     strokeColor: 'black',
    //     strokeWeight: 2,
    //     map: this.map
    //   });

    //   const angleLabel = new google.maps.Marker({
    //     position: angleLabelPosition,
    //     map: this.map,
    //     draggable: false,
    //     label: {
    //       text: `${newAngle}°`,
    //       color: 'black'
    //     },
    //     icon: {
    //       url: "../../assets/transparent_img.png",
    //       scaledSize: new google.maps.Size(10, 10),
    //     },
    //     crossOnDrag: false,
    //     zIndex: 12
    //   });

    //   this.arc.set('angleLabel', angleLabel)
    // } else {
    //   this.arc.setPath(arcCoordinates)
    //   const angleLabel = this.arc.get('angleLabel')
    //   angleLabel.setPosition(angleLabelPosition)
    //   angleLabel.setLabel({
    //     text: `${newAngle}°`,
    //     color: 'black'
    //   });
    // }
  }

  add90DegreeGuided(point3) {
    const point2 = this.clickedPoints[0];
    const point1 = this.clickedPoints[1];
    const offset1 = google.maps.geometry.spherical.computeOffset(point2, -1, google.maps.geometry.spherical.computeHeading(point1, point2));
    const offset2 = google.maps.geometry.spherical.computeOffset(point2, 1, google.maps.geometry.spherical.computeHeading(point2, point3));
    const startAngle = google.maps.geometry.spherical.computeHeading(point2, offset1);
    const endAngle = google.maps.geometry.spherical.computeHeading(point2, offset2);

    let newAngle = (endAngle - startAngle);
    newAngle = (newAngle >= 0) ? newAngle : newAngle + 360;
    newAngle = Math.round(newAngle);

    const angleLies = this.checkArcAnglefor90Deg(newAngle);
    if (angleLies) {
      const movingLineAngle = google.maps.geometry.spherical.computeHeading(point2, point3);

      const movingLineLength = google.maps.geometry.spherical.computeLength([point2, point1]);
      const newPoint = google.maps.geometry.spherical.computeOffset(point2, movingLineLength + 30, startAngle + angleLies);
      if (!this.guidedLine90deg) {
        this.guidedLine90deg = new google.maps.Polyline({
          path: [point2, newPoint],
          map: this.map,
          strokeColor: "yellow",
          clickable: false,
          zIndex: -99
        });
        this.guidedLine90deg.set('angleLies', angleLies);
        this.guidedLine90deg.setOptions({
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
      } else if (angleLies != this.guidedLine90deg['angleLies']) {
        this.guidedLine90deg.setPath([point2, newPoint]);
      }
    } else {
      this.guidedLine90deg?.setMap(null);
      this.guidedLine90deg = null;
    }



    // const numPoints = 100;
    // let angleLabelPosition;
    // const arcCoordinates = [];
    // for (let i = 0; i <= numPoints; i++) {
    //   const angle = startAngle + (i / numPoints) * (endAngle - startAngle);
    //   const point = google.maps.geometry.spherical.computeOffset(point2, 0.5, angle);
    //   if (i == 50) {
    //     angleLabelPosition = google.maps.geometry.spherical.computeOffset(point2, 1, angle);
    //   }
    //   arcCoordinates.push(point);
    // }

    // if (!this.arc) {
    //   this.arc = new google.maps.Polyline({
    //     path: arcCoordinates,
    //     geodesic: true,
    //     strokeColor: 'black',
    //     strokeWeight: 2,
    //     map: this.map
    //   });

    //   const angleLabel = new google.maps.Marker({
    //     position: angleLabelPosition,
    //     map: this.map,
    //     draggable: false,
    //     label: {
    //       text: `${newAngle}°`,
    //       color: 'white'
    //     },
    //     icon: {
    //       url: "../../assets/transparent_img.png",
    //       scaledSize: new google.maps.Size(10, 10),
    //     },
    //     crossOnDrag: false,
    //     zIndex: 12
    //   });

    //   this.arc.set('angleLabel', angleLabel)
    // } else {
    //   this.arc.setPath(arcCoordinates)
    //   const angleLabel = this.arc.get('angleLabel')
    //   angleLabel.setPosition(angleLabelPosition)
    //   angleLabel.setLabel({
    //     text: `${newAngle}°`,
    //     color: 'white'
    //   });
    // }

  }

  checkArcAngle(angle: number): any {
    let refAngle = angle;
    const tolerance = 10;
    if (angle >= 45 - tolerance && angle <= 45 + tolerance) {
      refAngle = 45;
    } else if (angle >= 90 - tolerance && angle <= 90 + tolerance) {
      refAngle = 90;
    } else if (angle >= 135 - tolerance && angle <= 135 + tolerance) {
      refAngle = 135;
    } else if (angle >= 225 - tolerance && angle <= 225 + tolerance) {
      refAngle = 225;
    } else if (angle >= 270 - tolerance && angle <= 270 + tolerance) {
      refAngle = 270;
    } else if (angle >= 315 - tolerance && angle <= 315 + tolerance) {
      refAngle = 315;
    } else {
      refAngle = null;
    }
    return refAngle;
  }

  checkArcAnglefor90Deg(angle: number): any {
    let refAngle = angle;
    const tolerance = 5;
    if (angle >= 0 - tolerance && angle <= 0 + tolerance) {
      refAngle = 0;
    } else if (angle >= 45 - tolerance && angle <= 45 + tolerance) {
      refAngle = 45;
    } else if (angle >= 90 - tolerance && angle <= 90 + tolerance) {
      refAngle = 90;
    } else if (angle >= 135 - tolerance && angle <= 135 + tolerance) {
      refAngle = 135;
    } else if (angle >= 180 - tolerance && angle <= 180 + tolerance) {
      refAngle = 180;
    } else if (angle >= 225 - tolerance && angle <= 225 + tolerance) {
      refAngle = 225;
    } else if (angle >= 270 - tolerance && angle <= 270 + tolerance) {
      refAngle = 270;
    } else if (angle >= 315 - tolerance && angle <= 315 + tolerance) {
      refAngle = 315;
    } else if (angle >= 360 - tolerance && angle <= 360 + tolerance) {
      refAngle = 360;
    } else {
      refAngle = null;
    }
    return refAngle;
  }

  calculateAngleOfArc(prevPoint, currentPoint, nextPoint) {
    const angle1 = Math.atan2(prevPoint.lat() - currentPoint.lat(), prevPoint.lng() - currentPoint.lng());
    const angle2 = Math.atan2(nextPoint.lat() - currentPoint.lat(), nextPoint.lng() - currentPoint.lng());
    let angle = angle1 - angle2;
    if (angle < 0) angle += 2 * Math.PI;
    return Math.round(angle * (180 / Math.PI));
  }

  addLabel(point1, point2) {
    const midPoint = this.commonService.calculateMidPoint([point1, point2])
    const lineAngle = google.maps.geometry.spherical.computeHeading(point1, point2);
    let angle = lineAngle;
    angle = (angle >= 0) ? Math.round(angle) - 90 : 90 - Math.round(Math.abs(angle));
    // Creating polygon and checking the position is inside or outside
    const tempRoof = new google.maps.Polygon({
      paths: [...this.clickedPoints, point2]
    });
    let position = google.maps.geometry.spherical.computeOffset(midPoint, 0.5, lineAngle + 90);
    if (google.maps.geometry.poly.containsLocation(position, tempRoof)) {
      position = google.maps.geometry.spherical.computeOffset(midPoint, 0.5, lineAngle - 90);
    }
    // Add line angle 
    const roofPolylinePath = this.roofPolyline.getPath().getArray();
    if (roofPolylinePath.length > 2) {
      const pointsForAngle = roofPolylinePath.slice(-3);
      // Add Arc Angle
      this.calculateArcAngle(pointsForAngle[0], pointsForAngle[1], pointsForAngle[2]);
      this.add90DegreeGuided(pointsForAngle[2]);
    }
    const pointsDistance = google.maps.geometry.spherical.computeLength([point1, point2]);
    const length = this.commonService.metersToFeetAndInches(pointsDistance);
    if (pointsDistance < 2) {
      // Hidding Distance Label & angle arc
      this.removeLabelAndArc();
      // this.undoMarker?.setValues(true);
      // Show UNDO Marker
      // this.undoMarker ? !this.undoMarker.getVisible() ? this.undoMarker.setVisible(true) : null : null;
      return;
    }
    // Hide UNDO Marker
    // this.undoMarker ? this.undoMarker.getVisible() ? this.undoMarker.setVisible(false) : null : null;
    let label = `${length.feet}'-${length.inches}"`;
    // let label = `${Math.round(google.maps.geometry.spherical.computeHeading(point1, point2))}"`;
    return;
    // Adding Marker label to map
    if (!this.label) {
      const className = `label_${(Math.random() + 1).toString(36).substring(7)}_${5 + 5}`;
      this.label = new google.maps.Marker({
        position: position,
        map: this.map,
        draggable: false,
        label: {
          text: 'label',
          className: className,
          color: 'white',
          // fontSize: "12px",
          fontSize: "16px",
        },
        icon: {
          url: "../../../assets/transparent_img.png",
          scaledSize: new google.maps.Size(10, 10),
        },
        crossOnDrag: false,
      });
      setTimeout(() => {
        this.addLabelBackGround(className);
      }, 100);
    } else {
      this.label.setLabel({
        text: label,
        className: this.label.getLabel().className,
        color: 'white',
        // fontSize: "12px",
        fontSize: "16px",
      });
      this.label.setPosition(position);
      setTimeout(() => {
        let currentLabelClass = document.getElementsByClassName(this.label.getLabel().className) as any;
        if (currentLabelClass && currentLabelClass[0]) {
          currentLabelClass[0].style.transform = `rotate(${angle}deg)`;
        }
      }, 0);
    }
  }

  addLabelBackGround(className: string) {
    let currentLabelClass = document.getElementsByClassName(className) as any;
    if (currentLabelClass && currentLabelClass[0]) {
      currentLabelClass[0].style.backgroundColor = 'black';
      currentLabelClass[0].style.color = 'white';
      currentLabelClass[0].style.padding = '5px';
      currentLabelClass[0].style.transform = `rotate(${33})`; // Apply rotation
    }
  }

  handlePolygonComplete(polygon: google.maps.Polygon) {
    let roofPointsArr = [...polygon.getPath().getArray()];
    polygon.setMap(null);
    roofPointsArr = [...roofPointsArr, roofPointsArr[0]];
    for (let i = 0; i < roofPointsArr.length - 1; i++) {
      const polyline = new google.maps.Polyline({
        path: [roofPointsArr[i], roofPointsArr[i + 1]],
        strokeWeight: 5,
        map: this.map
      });
      polyline.set('roofId', polygon['id']);
      polyline.set('lineId', `L${i + 1}`);
      const line = `line_${new Date().getTime()}${i + 5}${Math.floor(100000 + Math.random() * 900000)}`;
      polyline.set('line', line);
      // Pushing line data to object
      const path = polyline.getPath().getArray();
      const roofLineObject = {
        roofId: polyline['roofId'],
        lineId: `L${i + 1}`,
        line,
        polyline,
        path: path,
        start: path[0],
        end: path[1],
        lineIndex: i
      };
      this.allRoofLines.push(roofLineObject);
      this.addRoofLineClickEvent(polyline);
    }
  }

  addRoofLineClickEvent(polyline: google.maps.Polyline) {
    // Adding click event listener
    google.maps.event.addListener(polyline, 'click', () => {
      const findLine = this.allRoofLines.find((el) => el.line === polyline['line']);
      if (this.currentTabIndex === 1) {
        const findEave = this.allEaveLines.find((el) => el.line === polyline['line']);
        if (!findEave) {
          this.allEaveLines.push(findLine);
          findLine.lineType = 'eave';
          findLine.polyline.setOptions({
            strokeColor: this.eaveLineColor
          });
          this.findEaveLine();
        } else {
          this.allEaveLines = this.allEaveLines.filter((el) => el.line != polyline['line']);
          delete findEave.lineType;
          findEave.polyline.setOptions({
            strokeColor: 'black'
          });
        }
      }
      if (this.currentTabIndex === 2) {
        const findRidge = this.allRidgeLines.find((el) => el.line === polyline['line']);
        if (!findRidge && findLine.lineType !== 'eave') {
          this.allRidgeLines.push(findLine);
          findLine.lineType = 'ridge';
          findLine.polyline.setOptions({
            strokeColor: this.ridgeLineColor
          });
        } else {
          if (findLine.lineType !== 'eave') {
            this.allRidgeLines = this.allRidgeLines.filter((el) => el.line != polyline['line']);
            delete findRidge.lineType;
            findRidge.polyline.setOptions({
              strokeColor: 'black'
            });
          }
        }
      }
    });
  }

  findEaveLine() {
    if (this.allEaveLines.length === 0) {
      this.toastr.error('Please select all eave lines.');
      return;
    }
    const parallelEavePairs = [];
    // Check all eave lines
    this.allEaveLines.forEach((eaveLine) => {
      let eaveLineAngle = google.maps.geometry.spherical.computeHeading(eaveLine.path[0], eaveLine.path[1]);
      eaveLineAngle = eaveLineAngle < 0 ? 180 + eaveLineAngle : eaveLineAngle;

      // line.roofId === eaveLine.roofId && 
      const roofLines = this.allRoofLines.filter((line) => !line.lineType);
      roofLines.forEach((roofLine) => {
        let lineAngle = google.maps.geometry.spherical.computeHeading(roofLine.path[0], roofLine.path[1]);
        lineAngle = lineAngle < 0 ? 180 + lineAngle : lineAngle;
        // Get line angle and eave angle difference
        let angleDifference = eaveLineAngle > lineAngle ? eaveLineAngle - lineAngle : lineAngle - eaveLineAngle;
        angleDifference = parseFloat(angleDifference.toFixed(2));

        const a = this.areLatLngEqual(eaveLine.path[0], roofLine.path[0])
        const b = this.areLatLngEqual(eaveLine.path[0], roofLine.path[1])
        const c = this.areLatLngEqual(eaveLine.path[1], roofLine.path[0])
        const d = this.areLatLngEqual(eaveLine.path[1], roofLine.path[1])

        if ((a || b || c || d) && (angleDifference >= 80 && angleDifference <= 100)) {
          roofLine.lineType = 'eave';
          roofLine.polyline.setOptions({
            strokeColor: this.eaveLineColor
          });
          this.allEaveLines.push(roofLine);
          this.checkEaveLine(roofLine);
        }
      });
    });
  }

  findRidgeLines() {
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
            strokeColor: this.ridgeLineColor
          });
          this.allRidgeLines.push(roofLine);
        } else {
          roofLine.lineType = 'others';
        }
      });
    });
  }

  checkEaveLine(eaveLine: any) {
    let eaveLineAngle = google.maps.geometry.spherical.computeHeading(eaveLine.path[0], eaveLine.path[1]);
    eaveLineAngle = eaveLineAngle < 0 ? 180 + eaveLineAngle : eaveLineAngle;
    const roofLines = this.allRoofLines.filter((line) => !line.lineType);
    roofLines.forEach((roofLine) => {
      let lineAngle = google.maps.geometry.spherical.computeHeading(roofLine.path[0], roofLine.path[1]);
      lineAngle = lineAngle < 0 ? 180 + lineAngle : lineAngle;
      // Get line angle and eave angle difference
      let angleDifference = eaveLineAngle > lineAngle ? eaveLineAngle - lineAngle : lineAngle - eaveLineAngle;
      angleDifference = parseFloat(angleDifference.toFixed(2));

      const a = this.areLatLngEqual(eaveLine.path[0], roofLine.path[0])
      const b = this.areLatLngEqual(eaveLine.path[0], roofLine.path[1])
      const c = this.areLatLngEqual(eaveLine.path[1], roofLine.path[0])
      const d = this.areLatLngEqual(eaveLine.path[1], roofLine.path[1])

      if ((a || b || c || d) && (angleDifference >= 80 && angleDifference <= 100)) {
        roofLine.lineType = 'eave';
        roofLine.polyline.setOptions({
          strokeColor: this.eaveLineColor
        });
        this.checkEaveLine(roofLine);
        this.allEaveLines.push(roofLine);
      }
    });
  }

  removeLineDblClick(roofId: string) {
    const roofLines = this.allRoofLines.filter((line) => line.roofId === roofId);
    // Remove all polyline
    roofLines.forEach((line) => {
      line.polyline.setMap(null);
    });
    this.allRoofLines = this.allRoofLines.filter((line) => line.roofId !== roofId);
  }

  checkRoofPoints(currentPoint: google.maps.LatLng) {
    this.checkNearestPoint(currentPoint);
    let isPointChanged = false;
    this.roofPolygon.forEach((polygon) => {
      polygon.getPath().getArray().forEach((polygonPoint) => {
        isPointChanged = false;
        const pointsDistance = google.maps.geometry.spherical.computeLength([polygonPoint, currentPoint]);
        let isPointExist = false;
        if (pointsDistance < 1) {

          this.clickedPoints.forEach((point) => {
            if (this.areLatLngEqual(point, polygonPoint)) {
              isPointExist = true;
            }
          });
          if (isPointExist) {
            return;
          }
          const marker = new google.maps.Marker({
            position: polygonPoint,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 4,
            },
            draggable: false,
            clickable: true,
            map: this.map,
          });
          this.nearestPoints.push(marker);
          this.checkNearestPoint(currentPoint);
          this.addNearestPointMarkerClickEvent(marker);
          isPointChanged = true;
        }
      });
    });
    // Add clicked points marker
    const clickedPoints = [...this.clickedPoints.slice(0, 1)];
    if (this.clickedPoints.length > 2) {
      clickedPoints.forEach((polygonPoint) => {
        isPointChanged = false;
        const pointsDistance = google.maps.geometry.spherical.computeLength([polygonPoint, currentPoint]);
        if (pointsDistance < 1) {
          const marker = new google.maps.Marker({
            position: polygonPoint,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 4,
            },
            draggable: false,
            clickable: true,
            map: this.map,
          });
          this.nearestPoints.push(marker);
          this.checkNearestPoint(currentPoint);
          this.addNearestPointMarkerClickEvent(marker);
          isPointChanged = true;
        }
      });
    }
  }

  addNearestPointMarkerClickEvent(marker: google.maps.Marker) {
    marker.addListener('click', (event: any) => {
      this.addDrawRoofClickEvent(marker.getPosition());
    });
  }

  checkNearestPoint(currentPoint: google.maps.LatLng) {
    let pointExist = false;
    for (let i = 0; i < this.nearestPoints.length; i++) {
      if (this.areLatLngEqual(currentPoint, this.nearestPoints[i].getPosition())) {
        pointExist = true;
        break;
      } else {
        const pointsDistance = google.maps.geometry.spherical.computeLength([this.nearestPoints[i].getPosition(), currentPoint]);
        if (pointsDistance > 1) {
          this.nearestPoints[i].setMap(null);
          this.nearestPoints.splice(i, 1);
        }
      }
    }
    if (!pointExist) {

    }
  }

  addUNDOMarker(position: google.maps.LatLng) {
    position = google.maps.geometry.spherical.computeOffset(position, 0.5, -120);
    if (!this.undoMarker) {
      this.undoMarker = new google.maps.Marker({
        position: position,
        // map: this.map,
        draggable: true,
        clickable: true,
        icon: {
          url: "../../../assets/favicon.ico",
          scaledSize: new google.maps.Size(15, 15),
        },
      });
      // Adding Click listener
      this.undoMarker.addListener('click', (event: any) => {
        this.removeLastClickedPoint();
      });
    } else {
      this.undoMarker.setPosition(position);
    }
  }

  checkRoofPolyline() {
    if (this.roofPolyline) {
      const getRoofPath = this.roofPolyline.getPath().getArray();
      if (getRoofPath.length > 0) {
        const lastClickedPosition = getRoofPath.slice(-1);
        this.addUNDOMarker(lastClickedPosition[0]);
      }
    }
  }

  removeLastClickedPoint() {
    if (this.activeTool === 'roof' && this.clickedPoints.length > 0) {
      this.clickedPoints.pop();
      if (this.clickedPoints.length === 0) {
        this.removeMapEvent();
      } else {
        this.roofPolyline.setPath([...this.clickedPoints, this.roofPolyline.getPath().getArray().slice(-1)[0]]);
        this.addUNDOMarker(this.clickedPoints.slice(-1)[0]);
      }
    }
  }

  removeMapClickMoveDblClick(){
    this.mapMouseMoveEvent ? google.maps.event.removeListener(this.mapMouseMoveEvent) : null;
    this.mouseClickEvent ? google.maps.event.removeListener(this.mouseClickEvent) : null;
    this.mapDblClickEvent ? google.maps.event.removeListener(this.mapDblClickEvent) : null;
    this.map.setOptions({
      draggableCursor: ""
    });
  }

  removeMapEvent() {
    this.removeMapClickMoveDblClick();
    this.label?.setMap(null);
    this.roofPolyline?.setMap(null);
    this.undoMarker?.setMap(null);
    setTimeout(() => {
      this.map.setOptions({
        // disableDoubleClickZoom: false,
        draggableCursor: ""
      });
    }, this.defaultTimeOut);
    this.clickedPoints = [];
    this.roofPolyline = null;
    this.undoMarker = null;
    this.removeLabelAndArc();
    this.activeTool = 'hand';
    this.disablePolygonClick();
    this.checkRoofEditable();
    // Remove nearest point marker
    this.removeNearestPoint();
    // Remove Guided Line
    this.guidedLine?.setMap(null);
    this.guidedLine = null;
    // Removing 90 deg line -> guided line
    this.guidedLine90deg?.setMap(null);
    this.guidedLine90deg = null;
    this.cdRef.detectChanges();
  }

  removeNearestPoint() {
    this.nearestPoints.forEach((marker) => {
      marker.setMap(null);
    });
    this.nearestPoints = [];
  }

  changeCurrentTab() {
    // const points = []
    // this.roofPolygon.forEach((roof) => {
    //   points.push(roof.getPath().getArray())
    // })
    // console.log(JSON.stringify(points))
    if (this.roofPolygon.length === 0) {
      this.toastr.error('Please mark roof first!!');
      return;
    }
    if (this.currentTabIndex === 1 && this.allEaveLines.length === 0) {
      this.toastr.error('Please select all eave lines!');
      return;
    }
    if (this.currentTabIndex === 0 && confirm(this.roofMarkedConfirmation)) {
      this.isloading = true;
      this.handleMenuClick('hand');
      setTimeout(() => {
        this.isloading = false;
        this.changeObstacleEditable();
        this.currentTabIndex++;
        this.removeObsDrag();
        this.roofPolygon.forEach((el) => {
          this.handlePolygonComplete(el);
        });
      }, this.defaultTimeOut);
    }
    if (this.currentTabIndex === 1) {
      const text = "Are you sure, you want to proceed and all the eave lines are marked correctly?";
      if (confirm(text)) {
        this.isloading = true;
        setTimeout(() => {
          this.isloading = false;
          this.findRidgeLines();
          this.currentTabIndex++;
        }, this.defaultTimeOut);
      }
    }
    const eaveMarkedText = "Are you sure, you want to proceed and all the ridge lines are marked correctly?";
    if (this.currentTabIndex === 2 && confirm(eaveMarkedText)) {
      this.isloading = true;
      setTimeout(() => {
        this.addSetbackToObstacles();
        this.drawRoofWithFireSetback();
        this.currentTabIndex++;
        this.isloading = false;
      }, this.defaultTimeOut);
    }

    // Moving navigation to site plan
    if (this.currentTabIndex === 3) {
      this.isloading = true;
      setTimeout(() => {
        this.currentTabIndex++;
        this.isloading = false;
      }, this.defaultTimeOut);
    }
  }

  drawRoofWithFireSetback() {
    this.roofPolygon.forEach((roof, index) => {
      const roofLines = this.allRoofLines.filter((line) => line.roofId === roof.id);
      const lineWithLengths = [];
      let roofPoints = [];
      let eaveLine = [];
      roofLines.forEach((el) => {
        el.polyline.setOptions({
          strokeWeight: this.roofLine.size
        })
        // if (el.lineType === 'eave' || el.lineType === 'ridge') {
        if (el.lineType === 'eave') {
          const lineDistance = this.calculateLineDistance(el.path);
          lineWithLengths.push({ length: lineDistance, lineIndex: el.lineIndex, lineType: el.lineType });
        }
      });
      lineWithLengths.sort(function (a, b) {
        return parseFloat(b.length) - parseFloat(a.length);
      });

      if (lineWithLengths.length > 0) {
        roofPoints = [];
        eaveLine = [];
        roofLines.forEach((el) => {
          if (el.lineIndex === lineWithLengths[0].lineIndex) {
            eaveLine.push({ lat: el.start.lat(), lng: el.start.lng(), fireSetBack: this.getLineFireSetBack(el.lineType), ...el });
          } else {
            if (eaveLine.length === 0) {
              roofPoints.push({ lat: el.start.lat(), lng: el.start.lng(), fireSetBack: this.getLineFireSetBack(el.fireSetBack), ...el });
            } else {
              eaveLine.push({ lat: el.start.lat(), lng: el.start.lng(), fireSetBack: this.getLineFireSetBack(el.lineType), ...el });
            }
          }
        });
      } else {
        roofPoints = [];
        eaveLine = [];
        roofLines.forEach((el) => {
          eaveLine.push({ lat: el.start.lat(), lng: el.start.lng(), fireSetBack: this.getLineFireSetBack(el.lineType), ...el });
        });
      }

      roofPoints = [...eaveLine, ...roofPoints];
      const updatedRoof = new google.maps.Polygon({
        map: this.map,
        paths: roofPoints,
        strokeColor: 'transparent',
        strokeWeight: 2,
        fillColor: "#FF9393",
        fillOpacity: 1,
        zIndex: -50
      });
      // Updatinf roof polygon array
      this.roofPolygon[index] = updatedRoof;
      this.drawInnerPolygon(roofPoints, updatedRoof);
    });
  }

  drawInnerPolygon(arr, roof) {
    try {
      // Draw Parallel line
      arr.forEach((el) => {
        if (!el.fireSetBack) {
          el.fireSetBack = this.getLineFireSetBack('undefined');
        }
      });
      // Get points of inner roof after leaving setback area
      const innerRoofPoints = this.commonService.getInnerPolygonPoints(arr, roof);
      // Add inner roof on map
      const updatedPolygon = new google.maps.Polygon({
        paths: innerRoofPoints,
        map: this.map,
        fillColor: 'white',
        fillOpacity: 1,
        strokeWeight: 1,
        zIndex: 10
      });
      // Calculating new points to place module and overcome module to place on setback line
      const newArr = arr.map((el) => {
        el.fireSetBack = el.fireSetBack + this.commonService.inchestometer(1);
        return el;
      });
      // Get new roof points after leaving some gap from inner setback roof
      const newPolygonPoints = this.commonService.getInnerPolygonPoints(newArr, roof);
      const newRoof = new google.maps.Polygon({
        paths: newPolygonPoints
      });
      roof.set('newRoof', newRoof);
      roof.set('newRoofArr', this.commonService.convertPointsToLine(newPolygonPoints));
      // Adding inner roof inside roof array
      roof.set('innerPolygon', updatedPolygon);
      // Check area of set back
      const area = google.maps.geometry.spherical.computeArea(updatedPolygon.getPath().getArray());
      if (area < 4) {
        updatedPolygon.setMap(null);
      }
      // Adding Inner roof click event
      this.addClickOnInnerRoof(roof);
    } catch (e) {
      console.log(e)
    }
  }

  addClickOnInnerRoof(roof: google.maps.Polygon) {
    google.maps.event.addListener(roof['innerPolygon'], 'click', (event) => {
      if (event.domEvent && (event.domEvent.ctrlKey || event.domEvent.metaKey)) {
        if (!this.moduleDetailsFormData.hasOwnProperty('type') || !this.moduleDetailsFormData.hasOwnProperty('orientationType')) {
          this.toastr.error('Module Type is not defined.')
        } else {
          // Add Module code on module type
          this.commonService.addAutomatedModuleToRoof(roof, this.moduleDetailsFormData, this.map, this.obstaclesArray);
        }
      }
    });
  }

  getLineFireSetBack(lineType: string) {
    let fireSetBack = 0;
    switch (lineType) {
      case 'eave': {
        fireSetBack = this.moduleDetailsFormData.eaveSetBack;
        break;
      }
      case 'ridge': {
        fireSetBack = this.moduleDetailsFormData.ridgeSetBack;
        break;
      }
      default: {
        fireSetBack = this.moduleDetailsFormData.otherSetBack;
        break;
      }
    }
    return this.commonService.inchestometer(fireSetBack);
  }

  removeObsDrag() {
    this.obstaclesArray.forEach((obs) => {
      obs.setOptions({
        draggable: false
      });
    });
  }

  disablePolygonClick() {
    this.roofPolygon.forEach((roof) => {
      roof.setOptions({
        clickable: this.activeTool === 'roof' ? false : true,
        editable: false
      });
    });
  }

  areLatLngEqual(latLng1: google.maps.LatLng, latLng2: google.maps.LatLng): boolean {
    return latLng1.lat() === latLng2.lat() && latLng1.lng() === latLng2.lng();
  }

  identifyEaveLine() {
    this.roofPolygon.forEach((roof, roofIndex) => {
      const roofLines = this.allRoofLines.filter((rLine) => rLine.roofId === roof.id && !rLine.lineType);
      roofLines.forEach((line, rLIndex) => {
        if (rLIndex === 0 && roofIndex === 0) {
          const otherRoofLines = this.allRoofLines.filter((rLine) => rLine.roofId !== roof.id && !rLine.lineType);
          otherRoofLines.forEach((oLine) => {
            const point1 = this.areLatLngEqual(line.start, oLine.start);
            const point2 = this.areLatLngEqual(line.start, oLine.end);
            const point3 = this.areLatLngEqual(line.end, oLine.start);
            const point4 = this.areLatLngEqual(line.end, oLine.end);

            if (point1 || point2 || point3 || point4) {
              new google.maps.Marker({
                position: this.commonService.calculateMidPoint(oLine.path),
                map: this.map
              })
            }
          });
        }
      })


    });
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

  calculateLineDistance(linesArr: any) {
    return google.maps.geometry.spherical.computeLength(linesArr).toFixed(2);
  }

  changeModuleDimension() {
    this.moduleHegiht = this.moduleDetailsFormData.moduleHeight;
    this.modulewidth = this.moduleDetailsFormData.moduleWidth;
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

  removeLabelAndArc() {
    this.label ? this.label.setMap(null) : null;
    this.label ? this.label = null : null;
    this.arc ? this.arc['angleLabel']?.setMap(null) : null;
    this.arc?.setMap(null);
    this.arc = null;
  }

  addZoomChangeEvent() {
    google.maps.event.addListener(this.map, 'zoom_changed', () => {
      const currentZoom = this.map.getZoom();
      if (this.label && currentZoom < 22) {
        this.removeLabelAndArc();
      }
    });
  }

  addSetbackToObstacles() {
    let obstacleSetback = this.moduleDetailsFormData.obstacleSetBack;
    obstacleSetback = this.commonService.inchestometer(obstacleSetback);
    this.obstaclesArray.forEach((obstacle) => {
      if (obstacle['type'] === 'circle' || obstacle['type'] === 'rectangle') {
        const boundPoints = this.commonService.convertRectangleBoundsToPolygonPoints(obstacle.getBounds());
        this.commonService.getOuterObsPoints(boundPoints, obstacleSetback, obstacle);

      } else {
        const polygonPaths = obstacle.getPath().getArray();
        this.commonService.getOuterObsPoints(polygonPaths, obstacleSetback, obstacle);
      }
    });
  }

  saveData(){
    // create roof data
    const roofs = [];
    this.roofPolygon.forEach((roof) => {
      const roofObject = {
        roofId: roof['id'],
        path: roof.getPath().getArray()
      };
      roofs.push(roofObject);
    });
    // Create obstacles JSON
    // Create final object to save on HttpBackend
    const dataToSave = {
      roofs,
      obstacles: this.createObstaclesJSON(),
      setbackData: this.moduleDetailsFormData
    };
    console.log(JSON.stringify(dataToSave))
    // this.commonService.preserveDraftingData(dataToSave)
  }

  createObstaclesJSON(){
    const obsArray = [];
    this.obstaclesArray.forEach((obs) => {
      let obsObject = { type: obs['type'] };
      if(obs['type'] === 'rectangle'){
        obsObject['bounds'] = obs.getBounds();
      } else if(obs['type'] === 'circle'){
        obsObject['center'] = obs.getCenter();
        obsObject['radius'] = obs.getRadius();
      } else {
        obsObject['path'] = obs.getPath().getArray();
      }
      obsArray.push(obsObject);
    });
    return obsArray;
  }
}