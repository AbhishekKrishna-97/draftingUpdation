import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import 'round-slider';
import { AdditionalDrawingsService } from 'src/app/services/additional-drawings.service';
import { CustomTextService } from 'src/app/services/custom-text.service';
import { RoofSlopeService } from 'src/app/services/roof-slope.service';
import { EquipmentService } from 'src/app/services/equipment.service';
import { ToolsService } from 'src/app/services/tools.service';

interface Roof {
  lines: { start: { lat: number; lng: number } }[];
}

interface Setback {
  lines: { start: { lat: number; lng: number } }[];
}

interface Panel {
  id: any;
  orientation: string;
  isVisible: boolean;
  lines: { start: { lat: number; lng: number } }[];
}
@Component({
  selector: 'app-dxf-roof-plan',
  templateUrl: './dxf-roof-plan.component.html',
  styleUrls: ['./dxf-roof-plan.component.scss']
})
export class DxfRoofPlanComponent implements OnInit {
  dxfJsonData: any = null;
  map: any;
  pdfJSON: any = {
    roofs: [],
    obstacles: []
  };
  roofFacetLength: any;
  isloading: boolean = false;
  location = {
    latitude: 29.57065,
    longitude: -81.230576
  };
  rafterGap: number = 24;
  selectedRoof: google.maps.Polygon[] = [];
  panelArray:any = [];
  @Output() mapInstance = new EventEmitter();

  constructor(
    private drawingService : AdditionalDrawingsService,
    private customTextService : CustomTextService,
    private roofSlopeService: RoofSlopeService,
    private equipmentService: EquipmentService,
    private toolService: ToolsService) { }

  ngOnInit(): void {
    let permitdata = JSON.parse(localStorage.getItem("permitdata"))
    this.location.latitude = Number(permitdata.lat),
      this.location.longitude = Number(permitdata.lng)
    this.isloading = true;
    setTimeout(() => {
      this.dxfJsonData = JSON.parse(localStorage.getItem('dxfJsonData'));
      if (this.dxfJsonData) {
        this.initializeMap();
        this.mapInstance.emit(this.map);
        this.drawStructures(this.dxfJsonData);
        this.reDrawActions();
        this.isloading = false;
      }
    }, 1500);
  }

  initializeMap(): void {
    const center = { lat: this.location.latitude, lng: this.location.longitude };
    this.map = new google.maps.Map(document.getElementById("dxfRoofPlanMap")!, {
      center: center,
      zoom: 22,
      tilt: 0,
      heading: 0,
      zoomControl: false,
      scrollwheel: false
    });
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
          zIndex: -10,
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
              zIndex: -8
            });
          }
        });
        this.drawInverter(roof.modules);
        this.drawRailsAttachments(roof, roof.modules)

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

  drawInverter(panels: Panel[]) {
    for (let data of panels) {
      if (data.isVisible) {
        let coordinates = data.lines.map(line => ({
          lat: line.start.lat,
          lng: line.start.lng
        }));
        const startPoint = new google.maps.LatLng(coordinates[0].lat, coordinates[0].lng);
        const endPoint = new google.maps.LatLng(coordinates[1].lat, coordinates[1].lng);

        const startPoint1 = new google.maps.LatLng(coordinates[3].lat, coordinates[3].lng);
        const endPoint1 = new google.maps.LatLng(coordinates[2].lat, coordinates[2].lng);

        const angle = this.calculateAngle(startPoint.lat(), startPoint.lng(), endPoint.lat(), endPoint.lng());

        const railPoint1 = google.maps.geometry.spherical.computeOffset(startPoint, (data.orientation === 'portrait') ? this.inchesToMeters(12) : this.inchesToMeters(8), angle);
        const railPoint2 = google.maps.geometry.spherical.computeOffset(endPoint, (data.orientation === 'portrait') ? -this.inchesToMeters(12) : -this.inchesToMeters(8), angle);

        const railPoint3 = google.maps.geometry.spherical.computeOffset(startPoint1, (data.orientation === 'portrait') ? this.inchesToMeters(12) : this.inchesToMeters(8), angle);
        const railPoint4 = google.maps.geometry.spherical.computeOffset(endPoint1, (data.orientation === 'portrait') ? -this.inchesToMeters(12) : -this.inchesToMeters(8), angle);

        let polygon = new google.maps.Polygon({
          paths: coordinates,
          strokeColor: '#2b2d47',
          strokeOpacity: 1,
          strokeWeight: 1,
          fillColor: 'white',
          fillOpacity: 1,
          zIndex: 0
        });
        polygon.setMap(this.map);
        this.panelArray.push(polygon);

        polygon.addListener('click', () => {
        })

        const railDistance: any = google.maps.geometry.spherical.computeLength([railPoint1, railPoint3]).toFixed(2);
        const railAngle = this.calculateAngle(railPoint1.lat(), railPoint1.lng(), railPoint3.lat(), railPoint3.lng());
        const centerPoint = google.maps.geometry.spherical.computeOffset(railPoint1, railDistance / 2, railAngle);

        const inverterPoint1 = google.maps.geometry.spherical.computeOffset(centerPoint, -0.15, railAngle);
        const inverterPoint2 = google.maps.geometry.spherical.computeOffset(centerPoint, 0.15, railAngle);
        const inverterPoint3 = google.maps.geometry.spherical.computeOffset(inverterPoint1, 0.3, railAngle + 90);
        const inverterPoint4 = google.maps.geometry.spherical.computeOffset(inverterPoint2, 0.3, railAngle + 90);

        new google.maps.Polygon({
          paths: [inverterPoint1, inverterPoint2, inverterPoint4, inverterPoint3],
          map: this.map,
          strokeWeight: 0.5,
          strokeColor: 'black',
          strokeOpacity: 1,
          fillColor: '#FF0097',
          fillOpacity: 1,
          zIndex: 2
        });
      }
    }
    this.equipmentService.panelArray = this.panelArray;
  }

  convertCartesiantoLAtLng(originX: number, originY: number, deltaX: any, deltaY: any) {
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

  drawRailsAttachments(roof, panels) {
    let rows = [];
    panels.forEach(panel => {
      if (panel.isVisible) {
        let addedToRow = false;

        for (let i = 0; i < rows.length; i++) {
          let lastPanel = rows[i][rows[i].length - 1];

          if (
            this.areLinesSame(lastPanel.lines[2], panel.lines[0]) &&
            lastPanel.orientation === panel.orientation
          ) {
            rows[i].push(panel);
            addedToRow = true;
            break;
          }

          if (
            this.areLinesSame(rows[i][0].lines[0], panel.lines[2]) &&
            rows[i][0].orientation === panel.orientation
          ) {
            rows[i].unshift(panel);
            addedToRow = true;
            break;
          }
        }

        if (!addedToRow) {
          // If the panel doesn't fit in any existing rows, create a new row for it
          rows.push([panel]);
        }
      }
    });

    const flatRows = rows.flat();
    if (flatRows.length) this.drawRafter(roof, flatRows);

    for (let row of rows) {
      //top rails and attachments

      const startPoint = new google.maps.LatLng(row[0].lines[0].start.lat, row[0].lines[0].start.lng);
      const endPoint = new google.maps.LatLng(row[0].lines[1].start.lat, row[0].lines[1].start.lng);

      const startPoint1 = new google.maps.LatLng(row[row.length - 1].lines[3].start.lat, row[row.length - 1].lines[3].start.lng);
      const endPoint1 = new google.maps.LatLng(row[row.length - 1].lines[2].start.lat, row[row.length - 1].lines[2].start.lng);

      const angle = this.calculateAngle(startPoint.lat(), startPoint.lng(), endPoint.lat(), endPoint.lng());
      const angle1 = this.calculateAngle(startPoint1.lat(), startPoint1.lng(), endPoint1.lat(), endPoint1.lng());

      const railStart = google.maps.geometry.spherical.computeOffset(startPoint, (row[0].orientation === 'portrait') ? this.inchesToMeters(12) : this.inchesToMeters(8), angle);
      const railEnd = google.maps.geometry.spherical.computeOffset(startPoint1, (row[0].orientation === 'portrait') ? this.inchesToMeters(12) : this.inchesToMeters(8), angle1);

      const railLength = google.maps.geometry.spherical.computeLength([railStart, railEnd]);

      new google.maps.Polyline({
        path: [railStart, railEnd],
        map: this.map,
        strokeWeight: 1,
        strokeOpacity: 1,
        strokeColor: "#2b2d47",
        zIndex: 2
      });

      // attachments
      const railAngle = this.calculateAngle(railStart.lat(), railStart.lng(), railEnd.lat(), railEnd.lng());

      const gap1 = this.inchesToMeters(6);
      const gap2 = this.inchesToMeters(24);
      const continuousGap = this.inchesToMeters(48);

      let attachmentPosition = google.maps.geometry.spherical.computeOffset(railStart, gap1, railAngle);
      new google.maps.Circle({
        center: railStart,
        map: this.map,
        radius: 0.05,
        fillColor: "black",
        fillOpacity: 1,
        zIndex: 2
      });

      attachmentPosition = google.maps.geometry.spherical.computeOffset(attachmentPosition, gap2, railAngle);
      new google.maps.Circle({
        center: attachmentPosition,
        map: this.map,
        radius: 0.05,
        fillColor: "black",
        fillOpacity: 1,
        zIndex: 2
      });

      // Continue with regular intervals
      const numAttachments = Math.floor((railLength - gap1 - gap2) / continuousGap);

      for (let i = 0; i < numAttachments; i++) {
        attachmentPosition = google.maps.geometry.spherical.computeOffset(attachmentPosition, continuousGap, railAngle);
        new google.maps.Circle({
          center: attachmentPosition,
          map: this.map,
          radius: 0.05,
          fillColor: "black",
          fillOpacity: 1,
          zIndex: 2
        });
      }

      let lastAttachmentGap = google.maps.geometry.spherical.computeLength([attachmentPosition, railEnd]);

      //bottom rails and attachments
      const bottomRailStart = google.maps.geometry.spherical.computeOffset(endPoint, (row[0].orientation === 'portrait') ? -this.inchesToMeters(12) : -this.inchesToMeters(8), angle);
      const bottomRailEnd = google.maps.geometry.spherical.computeOffset(endPoint1, (row[0].orientation === 'portrait') ? -this.inchesToMeters(12) : -this.inchesToMeters(8), angle1);

      new google.maps.Polyline({
        path: [bottomRailStart, bottomRailEnd],
        map: this.map,
        strokeWeight: 1,
        strokeOpacity: 1,
        strokeColor: "#2b2d47",
        zIndex: 2
      });

      // attachments
      const bottomRailAngle = this.calculateAngle(railStart.lat(), railStart.lng(), railEnd.lat(), railEnd.lng());

      const bottomGap1 = this.inchesToMeters(6);
      const bottomGap2 = this.inchesToMeters(24);
      const bottomContinuousGap = this.inchesToMeters(48);

      // let bottomAttachmentPosition = google.maps.geometry.spherical.computeOffset(bottomRailStart, bottomGap1, railAngle);

      new google.maps.Circle({
        center: bottomRailStart,
        map: this.map,
        radius: 0.05,
        fillColor: "black",
        fillOpacity: 1,
        zIndex: 2
      });

      const lastAttachmentPosition = google.maps.geometry.spherical.computeOffset(bottomRailEnd, -lastAttachmentGap, railAngle);

      new google.maps.Circle({
        center: lastAttachmentPosition,
        map: this.map,
        radius: 0.05,
        fillColor: "black",
        fillOpacity: 1,
        zIndex: 2
      });

      let bottomLength = railLength - lastAttachmentGap;

      const bottomNumAttachments = Math.floor(bottomLength / continuousGap);

      let bottomAttachmentPosition = bottomRailStart;
      for (let i = 0; i < bottomNumAttachments; i++) {
        bottomAttachmentPosition = google.maps.geometry.spherical.computeOffset(bottomAttachmentPosition, bottomContinuousGap, railAngle);
        new google.maps.Circle({
          center: bottomAttachmentPosition,
          map: this.map,
          radius: 0.05,
          fillColor: "black",
          fillOpacity: 1,
          zIndex: 2
        });
      }

    };
  }

  areLinesSame(line1, line2) {
    const linesGap: any = google.maps.geometry.spherical.computeLength([line1.start, line2.end]).toFixed(2);
    if (linesGap <= '0.05') return true

    return false;
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

  drawRafter(roof, modules) {
    let rafter = []
    const panelFirstLine = modules[0]?.lines[0];
    if (panelFirstLine) {
      const panelFirstLineStart = new google.maps.LatLng(panelFirstLine.start.lat, panelFirstLine.start.lng);
      const panelFirstLineEnd = new google.maps.LatLng(panelFirstLine.end.lat, panelFirstLine.end.lng);

      const panelFirstLineAngle = google.maps.geometry.spherical.computeHeading(panelFirstLineStart, panelFirstLineEnd);

      let forwardRafter = []
      let backwardRafter = []
      const firstRafterStartPoint = google.maps.geometry.spherical.computeOffset(panelFirstLineStart, -5, panelFirstLineAngle);
      const firstRafterEndPoint = google.maps.geometry.spherical.computeOffset(panelFirstLineEnd, 5, panelFirstLineAngle);

      forwardRafter.push([firstRafterStartPoint, firstRafterEndPoint])
      backwardRafter.push([firstRafterStartPoint, firstRafterEndPoint])
      let firstRafter = getIntersection(roof.lines, [firstRafterStartPoint, firstRafterEndPoint])
      if (firstRafter) {
        rafterFormat(firstRafter)
        new google.maps.Polyline({
          path: firstRafter,
          icons: [{
            icon: {
              path: 'M 0,-1 0,1',
              strokeOpacity: 0.5,
              scale: 2,
            },
            offset: '0',
            repeat: '10px',
          }],
          strokeColor: "#964B00",
          strokeOpacity: 0,
          strokeWeight: 2,
          zIndex: 4,
          map: this.map,
        });
      }

      createForwardRafter(this.map, this.rafterGap);
      createBackwardRafter(this.map, this.rafterGap);

      roof.rafter = rafter;

      function createForwardRafter(map, rafterGap) {
        let createNew = true;
        while (createNew) {
          const lineStart = google.maps.geometry.spherical.computeOffset(forwardRafter[forwardRafter.length - 1][0], (rafterGap * 0.0254), panelFirstLineAngle + 90);
          const lineEnd = google.maps.geometry.spherical.computeOffset(forwardRafter[forwardRafter.length - 1][1], (rafterGap * 0.0254), panelFirstLineAngle + 90);
          forwardRafter.push([lineStart, lineEnd])
          let newLine = getIntersection(roof.lines, [lineStart, lineEnd])
          if (!newLine) createNew = false;
          else {
            rafterFormat(newLine)
            new google.maps.Polyline({
              path: newLine,
              icons: [{
                icon: {
                  path: 'M 0,-1 0,1',
                  strokeOpacity: 0.5,
                  scale: 2,
                },
                offset: '0',
                repeat: '10px',
              }],
              strokeColor: "#964B00",
              strokeOpacity: 0,
              strokeWeight: 2,
              zIndex: 4,
              map
            });
          }
        }
      }

      function createBackwardRafter(map, rafterGap) {
        let createNew = true;
        while (createNew) {
          const lineStart = google.maps.geometry.spherical.computeOffset(backwardRafter[backwardRafter.length - 1][0], -(rafterGap * 0.0254), panelFirstLineAngle + 90);
          const lineEnd = google.maps.geometry.spherical.computeOffset(backwardRafter[backwardRafter.length - 1][1], -(rafterGap * 0.0254), panelFirstLineAngle + 90);
          backwardRafter.push([lineStart, lineEnd])
          let newLine = getIntersection(roof.lines, [lineStart, lineEnd])
          if (!newLine) createNew = false;
          else {
            rafterFormat(newLine)
            new google.maps.Polyline({
              path: newLine,
              icons: [{
                icon: {
                  path: 'M 0,-1 0,1',
                  strokeOpacity: 0.5,
                  scale: 2,
                },
                offset: '0',
                repeat: '10px',
              }],
              strokeColor: "#964B00",
              strokeOpacity: 0,
              strokeWeight: 2,
              zIndex: 4,
              map
            });
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

      function getIntersection(roofLines, line) {
        let newLine = []
        for (const roofLine of roofLines) {
          const intersection = lineIntersection(
            line[0],
            line[1],
            roofLine
          );

          if (intersection) {
            newLine.push(intersection);
          }
        }
        if (newLine.length > 1) {
          return newLine
        }
        return null;
      }

      function lineIntersection(startPoint, endPoint, roofLine) {

        const lat1 = startPoint.lat(), lng1 = startPoint.lng();
        const lat2 = endPoint.lat(), lng2 = endPoint.lng();
        const lat3 = roofLine.start.lat, lng3 = roofLine.start.lng;
        const lat4 = roofLine.end.lat, lng4 = roofLine.end.lng;

        const determinant = (lat1 - lat2) * (lng3 - lng4) - (lng1 - lng2) * (lat3 - lat4);
        if (determinant === 0) {
          return null;
        }

        const intersectionX = ((lat1 * lng2 - lng1 * lat2) * (lat3 - lat4) - (lat1 - lat2) * (lat3 * lng4 - lng3 * lat4)) / determinant;
        const intersectionY = ((lat1 * lng2 - lng1 * lat2) * (lng3 - lng4) - (lng1 - lng2) * (lat3 * lng4 - lng3 * lat4)) / determinant;

        const isOnPolyline = google.maps.geometry.poly.isLocationOnEdge(
          new google.maps.LatLng({ lat: intersectionX, lng: intersectionY }),
          new google.maps.Polyline({ path: [roofLine.start, roofLine.end] }),
          1e-6
        );
        if (isOnPolyline) {
          return { lat: intersectionX, lng: intersectionY }
        }
        return null

      }
    }
  }

  submitRoofPlanData() {
    let localStorageData = JSON.parse(localStorage.getItem('finalPdfJSON'));
    if (localStorageData) {
      // Clone the sitePlan object to create an independent copy
      let sitePlan = { ...localStorageData.sitePlan };
      // Create a new object for roofPlan with a deep copy of sitePlan
      let roofPlan = JSON.parse(JSON.stringify(sitePlan));
      let finalPdfJSON = { sitePlan, roofPlan };
      // Modify only the roofPlan object
      finalPdfJSON.roofPlan.israilsdraw = true;
      localStorage.setItem("finalPdfJSON", JSON.stringify(finalPdfJSON));
    }
  }

  isPointInsideRoofPolygon(point: google.maps.LatLng, polygon: google.maps.Polygon) {
    return google.maps.geometry.poly.containsLocation(point, polygon); // Function to check if a point is inside a polygon
  }

  reDrawActions(){
    if (this.drawingService.chimneyArray.length > 0) {
      this.drawingService.reDrawChimney(this.map, this.map.getCenter(), "Roof Plan");
    }
    if (this.customTextService.customTextArray.length > 0) {
      this.customTextService.reDrawCustomText(this.map, this.map.getCenter(), "Roof Plan");
    }
    if (this.roofSlopeService.roofSlopeArray.length > 0) {
      this.roofSlopeService.reDrawRoofSlope(this.map, this.map.getCenter());
    }
    if (this.equipmentService.equipmentsArray.length > 0) {
      this.equipmentService.reDrawEquipments(this.map,this.map.getCenter(),"Roof Plan");
    }
    if (this.toolService.toolDataArray.length > 0) {
      this.toolService.reDrawTool(this.map, "Roof Plan");
    }
  }

  ngOnDestroy() {
    this.submitRoofPlanData();
  }
}
