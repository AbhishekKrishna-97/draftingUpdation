import { Component, OnInit, OnDestroy, ChangeDetectorRef, Output, EventEmitter, ViewChild } from '@angular/core';
import { AdditionalDrawingsService } from 'src/app/services/additional-drawings.service';
import { PlanSetService } from 'src/app/services/plansetservice';
import { CustomTextService } from 'src/app/services/custom-text.service';
import { FenceService } from 'src/app/services/fence.service';
import { RoofSlopeService } from 'src/app/services/roof-slope.service';
import { EquipmentService } from 'src/app/services/equipment.service';
import { ToolsService } from 'src/app/services/tools.service';
import { ObjectService } from 'src/app/services/object.service';
import { MapCompassComponent } from 'src/app/share/map-compass/map-compass.component';
import { CommonService } from 'src/app/services/commonservice';

@Component({
  selector: 'app-dxf-string-layout',
  templateUrl: './dxf-string-layout.component.html',
  styleUrls: ['./dxf-string-layout.component.scss']
})
export class DxfStringLayoutComponent implements OnInit, OnDestroy {
  dxfJsonData: any;
  map: any;
  location = {
    latitude: 29.57065,
    longitude: -81.230576
  };
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
  isloading = false;
  @ViewChild(MapCompassComponent) mapCompassComponent: MapCompassComponent;
  @Output() mapInstance = new EventEmitter();
  @Output() StringLayoutAccordian = new EventEmitter();

  constructor(
    private plansetService: PlanSetService,
    private changeDetector: ChangeDetectorRef,
    private drawingService: AdditionalDrawingsService,
    private customTextService: CustomTextService,
    private fenceService: FenceService,
    private roofSlopeService: RoofSlopeService,
    private equipmentService: EquipmentService,
    private toolService: ToolsService,
    private objectService: ObjectService,
    private commonService: CommonService
  ) { }

  ngOnInit(): void {
    let permitdata = JSON.parse(localStorage.getItem("permitdata"))
    this.location.latitude = Number(permitdata.lat),
      this.location.longitude = Number(permitdata.lng)
    this.isloading = true;
    this.dxfJsonData = JSON.parse(localStorage.getItem('dxfJsonData'));

    setTimeout(() => {
      if (this.dxfJsonData) {
        this.initializeMap(this.dxfJsonData);
        this.mapInstance.emit(this.map);
        this.drawStructures(this.dxfJsonData);
        this.reDrawActions();
        this.StringLayoutAccordian.emit(this.isPanel);
        this.isloading = false;
      }
    }, 1500);
  }

  initializeMap(data: any): void {
    const center = { lat: this.location.latitude, lng: this.location.longitude };
    const centerLatLng = new google.maps.LatLng(center.lat, center.lng);

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

    this.map = new google.maps.Map(document.getElementById("dxfStringLayoutMap")!, {
      center: center,
      zoom: 21,
      tilt: 0,
      heading: 0,
      disableDefaultUI: true,
      restriction: {
        latLngBounds: bounds,
        strictBounds: true
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
    this.map.set("mapId", "90f87356969d889c");
  }

  drawStructures(dxfJsonData): void {
    const { roofs } = dxfJsonData
    // Iterate over each roof
    roofs.forEach((roof, roofIndex) => {
      if (roof.isVisible) {
        let maxLength = -Infinity;
        let maxAngle;

        roof.lines.forEach(line => {
          const length = parseFloat(line.length);
          if (length > maxLength && line.type === 'EAVE') {
            maxLength = length;
            maxAngle = line.angle;
          }
        });
        const roofPath = roof.lines.map((line: { start: { lat: any; lng: any; }; }) => new google.maps.LatLng(line.start.lat, line.start.lng));
        const roofPolygon = new google.maps.Polygon({
          paths: roofPath,
          geodesic: true,
          strokeColor: "black",
          strokeOpacity: 1,
          strokeWeight: 3,
          fillColor: "#FF9393",
          fillOpacity: 0.7,
          map: this.map,
          zIndex: -50,
        });
        roofPolygon.set('id', roof.id);

        roof.setbacks.forEach((setback, setbackIndex) => {
          const setbackPath = setback.lines.map((line) => new google.maps.LatLng(line.start.lat, line.start.lng));
          const area = google.maps.geometry.spherical.computeArea(setbackPath);
          if (area > 0.005) {
            const setbackPolygon = new google.maps.Polygon({
              paths: setbackPath,
              geodesic: true,
              strokeColor: "grey",
              strokeOpacity: 1.0,
              strokeWeight: 2,
              fillColor: "#FFFFFF",
              fillOpacity: 1,
              map: this.map,
              zIndex: -40
            });
          }
        });

        this.addString(roof.modules);

        roof.obstructionsLine.forEach((obstructions, index) => {
          const obstructionsPath = obstructions.lines.map((line: { start: { lat: any; lng: any; }; }) => ({
            lat: line.start.lat,
            lng: line.start.lng
          }));
          const obstructionsPolygon = new google.maps.Polygon({
            paths: obstructionsPath,
            geodesic: true,
            strokeColor: "red",
            strokeOpacity: 1.0,
            strokeWeight: 2,
            fillColor: "red",
            fillOpacity: 0.5,
            map: this.map,
            zIndex: -50
          });
        })
      }
    })
  }

  isEndOfArray(): boolean {
    return this.currentIndex >= this.stringColors.length;
  }

  addStringLayout(): void {
    const newStringLayout = {
      color: this.stringColors[this.stringPannelData.length].color,
      stringValue: this.stringColors[this.stringPannelData.length].name,
      totalString: 0,
      polygons: []
    };
    this.stringPannelData.push(newStringLayout)
    this.currentIndex = this.stringPannelData.length;

    // Check if the array is at its end
    if (this.isEndOfArray()) {
      // Disable further clicks or perform any other action
    }
  }

  selectCurrentColor(index: number) {
    this.currentIndex = index + 1
  }

  addString(rawModules): void {
    let data = localStorage.getItem('stringLayoutData');
    if (data) {
      let parsedData = JSON.parse(data)
      this.currentIndex = parsedData.length;
      this.stringPannelData = [...parsedData];
    }

    const self = this
    for (let data of rawModules) {
      if (data.isVisible) {
        let coordinates = data.lines.map((line: { start: { lat: any; lng: any; }; }) => ({
          lat: line.start.lat,
          lng: line.start.lng
        }));

        let polygon = new google.maps.Polygon({
          paths: coordinates,
          strokeColor: 'black',
          strokeOpacity: 1,
          strokeWeight: 1,
          fillColor: 'white',
          fillOpacity: 0,
        });
        if (polygon instanceof google.maps.Polygon) {
          let bounds = new google.maps.LatLngBounds();
          let paths = polygon.getPaths();

          if (paths && paths.getLength() > 0) {
            let firstPath = paths.getAt(0);

            if (firstPath && firstPath.getLength() > 0) {
              firstPath.forEach((latLng) => {
                bounds.extend(latLng);
              });

              let center = bounds.getCenter();

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

              google.maps.event.addListener(this.map, 'zoom_changed', () => {
                const currentZoom = this.map.getZoom();
                if (currentZoom === 22) {
                  labelMarker.setMap(this.map);
                } else {
                  labelMarker.setMap(null);
                }
              });

              polygon.set("labelMarker", labelMarker)
            }
          }
        }
        // update panels from localstorage
        this.updateStringPannelData(polygon)

        google.maps.event.addListener(polygon, 'click', function () {
          selectObject(polygon);
        });

        polygon.setMap(this.map);
      }

      function selectObject(object: google.maps.Polygon) {
        const selectedColorIndex = self.stringPannelData.findIndex((colorData: { polygons: google.maps.Polygon[]; }) => colorData.polygons.includes(object));
        if (selectedColorIndex >= 0) {
          // Deselect object      
          const selectedColorData = self.stringPannelData[selectedColorIndex];

          object.setOptions({
            strokeColor: 'black',
            strokeOpacity: 1,
            strokeWeight: 1,
            fillColor: 'white',
            fillOpacity: 0,
          });

          // Update the totalString count in stringPannelData for deselected color
          selectedColorData.totalString--;
          selectedColorData.polygons = selectedColorData.polygons.filter((polygon: google.maps.Polygon) => polygon !== object);
          setLabels(selectedColorData);
          const labelMarker = object.get("labelMarker");
          if (labelMarker) {
            labelMarker.setLabel(null);
          }
        }
        else {
          // Select object
          object.setOptions({
            strokeOpacity: 1,
            strokeWeight: 1,
            fillColor: self.stringColors[self.currentIndex - 1].color,
            fillOpacity: 0.8,
          });

          const selectedColorIndex = self.currentIndex - 1;
          const selectedColorData = self.stringPannelData[selectedColorIndex];
          selectedColorData.totalString++;
          selectedColorData.polygons.push(object);
          setLabels(selectedColorData)
        }
      }

      function setLabels(selectedColorData: any) {
        selectedColorData.polygons.forEach((pair: { get: (arg0: string) => any; }, index: number) => {
          const labelMarker = pair.get("labelMarker")
          if (labelMarker) {
            labelMarker.setLabel(`${selectedColorData.stringValue}${index + 1}`);
          }
        });
      }
    }
  }

  submitModulesString() {
    this.dxfJsonData.roofs.forEach((roof, roofIndex) => {
      roof.modules.map(module => {
        const polygonPaths = module.lines.map((line: { start: { lat: any; lng: any; }; }) => ({
          lat: line.start.lat,
          lng: line.start.lng
        }));

        for (let colorData of this.stringPannelData) {
          const matchingPolygon = colorData.polygons.find((polygon: { getPaths: () => { (): any; new(): any; getAt: { (arg0: number): any; new(): any; }; }; }) =>
            this.arePathsEqual(polygonPaths, polygon.getPaths().getAt(0))
          );

          if (matchingPolygon) {
            const labelMarker = matchingPolygon.get("labelMarker")
            if (labelMarker) {
              module.stringingvalue = labelMarker.getLabel();
            }
            break;
          }
        }
      })
    })
  }

  arePathsEqual(path1: string | any[], path2: { length: any; getAt: (arg0: number) => any; }): boolean {
    if (path1.length !== path2.length) {
      return false;
    }

    for (let i = 0; i < path1.length; i++) {
      if (!this.areLatLngEqual(path1[i], path2.getAt(i))) {
        return false;
      }
    }
    return true;
  }

  areLatLngEqual(point1: { lat: any; lng: any; }, point2: { lat: () => any; lng: () => any; }): boolean {
    return point1.lat === point2.lat() && point1.lng === point2.lng();
  }

  updateStringPannelData(object): void {
    for (let colorData of this.stringPannelData) {
      const matchingPolygon = colorData.polygons.findIndex((polygon: { paths: any[]; }) => {
        if (polygon.paths) {
          return this.arePathsEqual(polygon.paths, object.getPaths().getAt(0));
        }
        return false;
      });

      if (matchingPolygon >= 0) {
        object.setOptions({
          strokeOpacity: 1,
          strokeWeight: 1,
          fillColor: colorData.color,
          fillOpacity: 0.8,
        });

        const labelMarker = object.get("labelMarker");
        if (labelMarker) {
          labelMarker.setLabel(`${colorData.polygons[matchingPolygon].labelMarker}`);
        }

        colorData.polygons[matchingPolygon] = object;
        break;
      }
    }
  }

  saveStringPannelData(): void {
    let stringLayoutData = []
    this.stringPannelData.forEach((element: { color: any; stringValue: any; totalString: any; polygons: any[]; }) => {
      let string = {
        color: element.color,
        stringValue: element.stringValue,
        totalString: element.totalString,
        polygons: []
      }
      element.polygons.forEach((polygon: any) => {
        const paths = polygon.getPath().getArray();
        string.polygons.push({
          id: polygon.id,
          fillOpacity: polygon.fillOpacity,
          paths: paths,
          strokeWeight: polygon.strokeWeight,
          strokeColor: polygon.strokeColor,
          strokeOpacity: polygon.strokeOpacity,
          fillColor: polygon.fillColor,
          labelMarker: polygon.labelMarker.getLabel()
        });
      });
      stringLayoutData.push(string)
    });

    localStorage.setItem('stringLayoutData', JSON.stringify(stringLayoutData));

  }

  getFinalDrafting(finaldrafting?) {
    const drawingsData = {
      rectangle: this.toolService.getToolData('rectangle'),
      circle: this.toolService.getToolData('circle'),
      polyline: this.toolService.getToolData('polyline')
    }
    let pdfdata = JSON.parse(localStorage.getItem("finalPdfJSON"));
    let permitdata = JSON.parse(localStorage.getItem("permitdata"));
    let chimneyData = this.drawingService.getChimneyData();
    let customTextData = this.customTextService.getCustomTextData();
    let fenceData = this.fenceService.getfenceData();
    let roofSlopeData = this.roofSlopeService.getRoofSlopeData();
    let equipmentsData = this.equipmentService.getEquipmentsData();
    let poolData = this.toolService.getToolData('pool');
    let drivewayData = this.toolService.getToolData('driveway');
    let connectionWireData = this.toolService.getToolData('connectionWire');

    pdfdata.sitePlan.chimney = chimneyData;
    pdfdata.sitePlan.fence = fenceData;
    pdfdata.sitePlan.roofs = this.dxfJsonData.roofs;
    pdfdata.sitePlan["customText"] = customTextData.sitePlanText;
    pdfdata.sitePlan.equipments = equipmentsData;
    pdfdata.sitePlan.pool = poolData;
    pdfdata.sitePlan.driveways = drivewayData;
    pdfdata.sitePlan.drawings = drawingsData;
    pdfdata.sitePlan.trees = this.objectService.getTreeData();

    this.submitModulesString();

    let postData = {
      data: {
        siteplan: pdfdata.sitePlan,
        roofplan: { connectionWire: connectionWireData.roofPlan, customText: customTextData.roofPlanText, roofSlope: roofSlopeData },
        stringlayout: { connectionWire: connectionWireData.stringLayout, rotation: this.mapCompassComponent.accumulatedAmount, center: this.commonService.getMapCenter(), customText: customTextData.stringLayoutText },
        recordid: permitdata.id,
        hashkey: localStorage.getItem("hashkey")
      }
    }
    this.isloading = true;
    this.plansetService.getFinalDrafting(postData).subscribe((res: any) => {
      if (finaldrafting == "true") {
        window.top.close();
      }
      else {
        this.getPreview();
      }
    },
      error => {
        //  window.top.close();
        this.isloading = false;
        this.changeDetector.detectChanges();
      })
  }

  getPreview() {
    this.plansetService.downloadPermitDesign().subscribe(async (response: any) => {

      this.isloading = false;
      var fileurl = response?.message.permitdesign?.url;
      const a = document.createElement('a');
      a.href = fileurl;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      this.changeDetector.detectChanges();
    },
      error => {
        this.isloading = false;
        this.changeDetector.detectChanges();
      })
  }

  isPointInsideRoofPolygon(point: google.maps.LatLng, polygon: google.maps.Polygon) {
    return google.maps.geometry.poly.containsLocation(point, polygon); // Function to check if a point is inside a polygon
  }

  reDrawActions(){
    if (this.drawingService.chimneyArray.length > 0) {
      this.drawingService.reDrawChimney(this.map, this.map.getCenter(), "String Layout");
    }
    if (this.customTextService.customTextArray.length > 0) {
      this.customTextService.reDrawCustomText(this.map, this.map.getCenter(), "String Layout");
    }
    if (this.equipmentService.equipmentsArray.length > 0) {
      this.equipmentService.reDrawEquipments(this.map, this.map.getCenter(), "String Layout");
    }
    if (this.toolService.toolDataArray.length > 0) {
      this.toolService.reDrawTool(this.map, "String Layout");
    }
  }

  ngOnDestroy() {
    this.saveStringPannelData();
  }

}


