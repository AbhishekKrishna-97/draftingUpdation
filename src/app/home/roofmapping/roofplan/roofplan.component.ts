import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { AdditionalDrawingsService } from 'src/app/services/additional-drawings.service';
import { CustomTextService } from 'src/app/services/custom-text.service';
import { EquipmentService } from 'src/app/services/equipment.service';
import { RoofSlopeService } from 'src/app/services/roof-slope.service';
import { ToolsService } from 'src/app/services/tools.service';
interface Point {
  id: number;
  coords: string;
}
interface Line {
  id: number;
  path: string;
  type: string;
}

interface Panel {
  inverter: any;
  id: any;
  orientation: string;
  isVisible: boolean;
  lines: { start: { lat: number; lng: number } }[];
}
@Component({
  selector: 'app-roofplan',
  templateUrl: './roofplan.component.html',
  styleUrls: ['./roofplan.component.scss']
})
export class RoofplanComponent implements OnInit {
  map: any;
  pdfJSON: any = {
    roofs: [],
    obstacles: []
  };
  finalPdfJSON: any = { roof: [] }
  isloading: boolean = false;
  location = {
    latitude: null,
    longitude: null
  };
  rafterGap: number = 24;
  panelArray: any = [];
  selectedSingleInverter: google.maps.Polygon;
  hiddenInverter: any = [];
  @Output() mapInstance = new EventEmitter();

  constructor(
    private equipmentService: EquipmentService,
    private customTextService: CustomTextService,
    private drawingService: AdditionalDrawingsService,
    private roofSlopeService: RoofSlopeService,
    private toolService: ToolsService
  ) { }

  ngOnInit(): void {
    this.isloading = true;
    this.finalPdfJSON = JSON.parse(localStorage.getItem('finalPdfJSON'));
    setTimeout(() => {
      if (this.finalPdfJSON) {
        this.initializeMap(this.finalPdfJSON.sitePlan);
        this.drawStructures(this.finalPdfJSON.sitePlan.roofs);
        this.isloading = false;
      }
    }, 2000);
  }

  initializeMap(data: any): void {
    const center = new google.maps.LatLng(data.location.latitude, data.location.longitude);
    this.location.latitude = data.location.latitude;
    this.location.longitude = data.location.longitude;

    this.map = new google.maps.Map(document.getElementById("map")!, {
      center: center,
      zoom: 21,
      tilt: 0,
      heading: 0,
      disableDefaultUI: true,
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
    this.reDrawActions();
    this.mapInstance.emit(this.map);
  }

  drawStructures(roofs: any): void {
    roofs.forEach((roof: any, index) => {
      const roofPath = roof.lines.map((line: { start: { lat: any; lng: any; }; }) => new google.maps.LatLng(line.start.lat, line.start.lng));
      let roofPolygon = new google.maps.Polygon({
        paths: roofPath,
        geodesic: true,
        strokeOpacity: 1.0,
        strokeWeight: 1,
        fillColor: "orange",
        fillOpacity: 1,
        map: this.map
      });

      const setbackPath = roof.setbacks.map((line: { start: { lat: any; lng: any; }; }) => new google.maps.LatLng(line.start.lat, line.start.lng));
      let setbackPolygon = new google.maps.Polygon({
        paths: setbackPath,
        geodesic: true,
        strokeOpacity: 1.0,
        strokeWeight: 1,
        fillColor: "white",
        fillOpacity: 1,
        map: this.map
      });

      this.drawInverter(roof.modules);
      this.drawRailsAttachments(roof, roof.modules)

    });

  }

  drawInverter(panels: Panel[]) {
    panels.map(data => {
      if (data.isVisible) {
        let coordinates = data.lines.map(line => ({
          lat: line.start.lat,
          lng: line.start.lng
        }));

        let panelPolygon = new google.maps.Polygon({
          paths: coordinates,
          strokeColor: '#2b2d47',
          strokeOpacity: 1,
          strokeWeight: 1,
          fillColor: 'white',
          fillOpacity: 1,
          zIndex: 0,
          map: this.map
        });
        this.panelArray.push(panelPolygon);

        const startPoint = new google.maps.LatLng(coordinates[1].lat, coordinates[1].lng);
        const endPoint = new google.maps.LatLng(coordinates[0].lat, coordinates[0].lng);

        const startPoint1 = new google.maps.LatLng(coordinates[2].lat, coordinates[2].lng);
        const endPoint1 = new google.maps.LatLng(coordinates[3].lat, coordinates[3].lng);

        const angle = this.calculateAngle(startPoint.lat(), startPoint.lng(), endPoint.lat(), endPoint.lng());

        const railPoint1 = google.maps.geometry.spherical.computeOffset(startPoint, (data.orientation === 'portrait') ? this.inchesToMeters(12) : this.inchesToMeters(8), angle);
        const railPoint2 = google.maps.geometry.spherical.computeOffset(endPoint, (data.orientation === 'portrait') ? -this.inchesToMeters(12) : -this.inchesToMeters(8), angle);

        const railPoint3 = google.maps.geometry.spherical.computeOffset(startPoint1, (data.orientation === 'portrait') ? this.inchesToMeters(12) : this.inchesToMeters(8), angle);
        const railPoint4 = google.maps.geometry.spherical.computeOffset(endPoint1, (data.orientation === 'portrait') ? -this.inchesToMeters(12) : -this.inchesToMeters(8), angle);

        const railDistance: any = google.maps.geometry.spherical.computeLength([railPoint1, railPoint3]).toFixed(2);
        const railAngle = this.calculateAngle(railPoint1.lat(), railPoint1.lng(), railPoint3.lat(), railPoint3.lng());
        const centerPoint = google.maps.geometry.spherical.computeOffset(railPoint1, railDistance / 2, railAngle);

        const tri0 = google.maps.geometry.spherical.computeOffset(centerPoint, -0.15, railAngle);
        const tri1 = google.maps.geometry.spherical.computeOffset(centerPoint, 0.15, railAngle);
        const tri2 = google.maps.geometry.spherical.computeOffset(tri1, 0.3, railAngle + 90);
        const tri3 = google.maps.geometry.spherical.computeOffset(tri0, 0.3, railAngle + 90);

        const tri4 = google.maps.geometry.spherical.computeOffset(tri1, 0.3, railAngle - 90);
        const tri5 = google.maps.geometry.spherical.computeOffset(tri0, 0.3, railAngle - 90);

        let topInverterPath = [tri0, tri1, tri2, tri3];
        let topInverterPath1 = [tri0, tri1, tri4, tri5];

        const inverterPolygon = new google.maps.Polygon({
          map: this.map,
          strokeWeight: 0.5,
          strokeColor: 'black',
          strokeOpacity: 1,
          fillColor: '#FF0097',
          fillOpacity: 1,
          zIndex: 2,
          draggable: true
        });
        if (data.inverter) {
          inverterPolygon.setPath(data.inverter.paths)
          inverterPolygon.set('isVisible', data.inverter.isVisible)
        }
        else {
          inverterPolygon.setPath(topInverterPath)
          inverterPolygon.set('isVisible', true)
          data.inverter = {
            isVisible: true,
            paths: topInverterPath
          }
        }


        const bottomRailDistance: any = google.maps.geometry.spherical.computeLength([railPoint2, railPoint4]).toFixed(2);
        const bottomRailAngle = this.calculateAngle(railPoint2.lat(), railPoint2.lng(), railPoint4.lat(), railPoint4.lng());
        const bottomCenterPoint = google.maps.geometry.spherical.computeOffset(railPoint2, bottomRailDistance / 2, bottomRailAngle);

        const bri0 = google.maps.geometry.spherical.computeOffset(bottomCenterPoint, -0.15, bottomRailAngle);
        const bri1 = google.maps.geometry.spherical.computeOffset(bottomCenterPoint, 0.15, bottomRailAngle);
        const bri2 = google.maps.geometry.spherical.computeOffset(bri1, 0.3, bottomRailAngle + 90);
        const bri3 = google.maps.geometry.spherical.computeOffset(bri0, 0.3, bottomRailAngle + 90);

        const bri4 = google.maps.geometry.spherical.computeOffset(bri1, 0.3, bottomRailAngle - 90);
        const bri5 = google.maps.geometry.spherical.computeOffset(bri0, 0.3, bottomRailAngle - 90);

        let bottomInverterPath = [bri0, bri1, bri2, bri3];
        let bottomInverterPath1 = [bri0, bri1, bri4, bri5];

        const inverterMenu = new InverterMenu();

        panelPolygon.addListener("contextmenu", (event) => {
          const clickedPosition = event.latLng;
          this.selectedSingleInverter = inverterPolygon;
          inverterMenu.open(this.map, clickedPosition);
        });

        inverterPolygon.addListener('dragend', () => {
          const inverterPolygonPosition = inverterPolygon.getPath().getArray()[0]; // Get the vertices of the polygon

          const distances = [
            google.maps.geometry.spherical.computeDistanceBetween(inverterPolygonPosition, tri3),
            google.maps.geometry.spherical.computeDistanceBetween(inverterPolygonPosition, tri5),
            google.maps.geometry.spherical.computeDistanceBetween(inverterPolygonPosition, bri3),
            google.maps.geometry.spherical.computeDistanceBetween(inverterPolygonPosition, bri5)
          ];

          const nearestPointIndex = distances.indexOf(Math.min(...distances));
          let nearestPoint;
          switch (nearestPointIndex) {
            case 0:
              nearestPoint = topInverterPath
              break;
            case 1:
              nearestPoint = topInverterPath1
              break;
            case 2:
              nearestPoint = bottomInverterPath
              break;
            case 3:
              nearestPoint = bottomInverterPath1
              break;
            default:
              break;
          }

          inverterPolygon.setPath(nearestPoint)
          data.inverter = {
            isVisible: true,
            paths: nearestPoint
          }
        });
      }
    })
    this.equipmentService.panelArray = this.panelArray;
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
    let railsAttachment = []
    const flatRows = rows.flat();
    let singleRailsAttachment = []
    for (let row of rows) {
      //top rails and attachments

      const startPoint = new google.maps.LatLng(row[0].lines[1].start.lat, row[0].lines[1].start.lng);
      const endPoint = new google.maps.LatLng(row[0].lines[0].start.lat, row[0].lines[0].start.lng);

      const startPoint1 = new google.maps.LatLng(row[row.length - 1].lines[2].start.lat, row[row.length - 1].lines[2].start.lng);
      const endPoint1 = new google.maps.LatLng(row[row.length - 1].lines[3].start.lat, row[row.length - 1].lines[3].start.lng);

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

      let railsAttachmentTop = {
        type: "top",
        start: { lat: railStart.lat(), lng: railStart.lng() },
        end: { lat: railEnd.lat(), lng: railEnd.lng() },
        length: (google.maps.geometry.spherical.computeLength([railStart, railEnd]) * 3.28084).toFixed(2),
        angle: google.maps.geometry.spherical.computeHeading(railStart, railEnd),
        attachments: []
      }

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
      railsAttachmentTop.attachments.push(railStart)

      attachmentPosition = google.maps.geometry.spherical.computeOffset(attachmentPosition, gap2, railAngle);
      new google.maps.Circle({
        center: attachmentPosition,
        map: this.map,
        radius: 0.05,
        fillColor: "black",
        fillOpacity: 1,
        zIndex: 2
      });
      railsAttachmentTop.attachments.push(attachmentPosition)

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
        railsAttachmentTop.attachments.push(attachmentPosition)
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

      let railsAttachmentBottom = {
        type: "bottom",
        start: { lat: bottomRailStart.lat(), lng: bottomRailStart.lng() },
        end: { lat: bottomRailEnd.lat(), lng: bottomRailEnd.lng() },
        length: (google.maps.geometry.spherical.computeLength([bottomRailStart, bottomRailEnd]) * 3.28084).toFixed(2),
        angle: google.maps.geometry.spherical.computeHeading(bottomRailStart, bottomRailEnd),
        attachments: []
      }
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
      railsAttachmentBottom.attachments.push(bottomRailStart)

      const lastAttachmentPosition = google.maps.geometry.spherical.computeOffset(bottomRailEnd, -lastAttachmentGap, railAngle);

      new google.maps.Circle({
        center: lastAttachmentPosition,
        map: this.map,
        radius: 0.05,
        fillColor: "black",
        fillOpacity: 1,
        zIndex: 2
      });
      railsAttachmentBottom.attachments.push(lastAttachmentPosition)

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
        railsAttachmentBottom.attachments.push(bottomAttachmentPosition)
      }
      singleRailsAttachment.push(railsAttachmentTop, railsAttachmentBottom)
    };
    roof.railsAttachment = singleRailsAttachment
  }

  areLinesSame(line1, line2) {
    const linesGap: any = google.maps.geometry.spherical.computeLength([line1.start, line2.end]).toFixed(2);
    if (linesGap <= '0.05') return true

    return false;
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

  deleteInverter() {
    this.selectedSingleInverter.setOptions({ visible: false })
    this.selectedSingleInverter.set('isVisible', false);
    let inverter = this.hiddenInverter.find(ele => ele.get('id') === this.selectedSingleInverter.get('id'))
    if (inverter) {
      inverter = this.selectedSingleInverter
    }
    else {
      this.hiddenInverter.push(this.selectedSingleInverter)
    }

    const inverterMenu = new InverterMenu();
    inverterMenu.onRemove()
  }
  addInverter() {
    this.selectedSingleInverter.setOptions({ visible: true })
    this.selectedSingleInverter.set('isVisible', true);
    let inverter = this.hiddenInverter.find(ele => ele.get('id') === this.selectedSingleInverter.get('id'))
    if (inverter) {
      inverter = this.selectedSingleInverter
    }
    else {
      this.hiddenInverter.push(this.selectedSingleInverter)
    }
    const inverterMenu = new InverterMenu();
    inverterMenu.onRemove()
  }

  centerizedMap(allcoordinates): void {
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

  submitRoofPlanData() {
    let sitePlan = { ...this.finalPdfJSON.sitePlan };
    let roofPlan = {}
    let finalPdfJSON = { sitePlan, roofPlan };
    localStorage.setItem("finalPdfJSON", JSON.stringify(finalPdfJSON));
  }

  reDrawActions() {
    if (this.equipmentService.equipmentsArray.length > 0) {
      this.equipmentService.reDrawEquipments(this.map, this.map.getCenter(), "Roof Plan");
    }
    if (this.customTextService.customTextArray.length > 0) {
      this.customTextService.reDrawCustomText(this.map, this.map.getCenter(), "Roof Plan");
    }
    if (this.drawingService.chimneyArray.length > 0) {
      this.drawingService.reDrawChimney(this.map, this.map.getCenter(), "Roof Plan");
    }
    if (this.roofSlopeService.roofSlopeArray.length > 0) {
      this.roofSlopeService.reDrawRoofSlope(this.map, this.map.getCenter());
    }
    if (this.customTextService.customTextArray.length > 0) {
      this.customTextService.reDrawCustomText(this.map, this.map.getCenter(), "Roof Plan");
    }
    if (this.toolService.toolDataArray.length > 0) {
      this.toolService.reDrawTool(this.map, "Roof Plan");
    }
  }

  ngOnDestroy() {
    this.submitRoofPlanData();
  }
}

class InverterMenu extends google.maps.OverlayView {
  private divListener_?: google.maps.MapsEventListener;
  private menuElement_: HTMLElement;

  constructor() {
    super();
    this.menuElement_ = document.getElementById("inverterMenu")!;
  }

  override onAdd() {
    const map = this.getMap() as google.maps.Map;

    if (!this.menuElement_) {
      console.error("Menu element is not initialized.");
      return;
    }

    const floatPane = this.getPanes()?.floatPane;

    if (!floatPane) {
      console.error("Float pane is not available.");
      return;
    }

    floatPane.appendChild(this.menuElement_);

    const self = this;

    // mousedown anywhere on the map except on the menu div will close the menu.
    this.divListener_ = google.maps.event.addDomListener(
      map.getDiv(),
      "mousedown",
      (e: Event) => {
        // Check if the event target is not a descendant of the menu element
        if (!self.menuElement_.contains(e.target as Node)) {
          // Close the menu
          this.close();
        }
      },
      false
    );
  }

  override onRemove() {
    if (this.menuElement_) {
      if (this.menuElement_.parentNode) {
        (this.menuElement_.parentNode as HTMLElement).removeChild(this.menuElement_);
      }
      google.maps.event.removeListener(this.divListener_);
    }
    this.set("position", null);
  }

  close() {
    this.setMap(null);
  }

  override draw() {
    const position = this.get("position");
    const projection = this.getProjection();

    if (!position || !projection) {
      return;
    }

    const point = projection.fromLatLngToDivPixel(position)!;

    this.menuElement_.style.top = point.y + "px";
    this.menuElement_.style.left = point.x + "px";
    this.menuElement_.style.display = "block";
  }

  /**
   * Opens the menu at a given position on the map.
   */
  open(map: google.maps.Map, position: google.maps.LatLng) {
    this.set("position", position);
    this.setMap(map);
    this.draw();
  }

  showMenu() {
    this.menuElement_.style.display = "block";
  }

  hideMenu() {
    this.menuElement_.style.display = "none";
  }
}