import { Component, EventEmitter, Input, OnInit, Output, OnDestroy } from '@angular/core';
import * as $ from 'jquery';
import 'round-slider';
import { Subscription } from 'rxjs';
import { CommonService } from 'src/app/services/commonservice';
import { ToasterService } from 'src/app/services/notify.service';
import { AdditionalDrawingsService } from '../../../../services/additional-drawings.service'
import { CustomTextService } from 'src/app/services/custom-text.service';
import { FenceService } from 'src/app/services/fence.service';
import { EquipmentService } from 'src/app/services/equipment.service';
import { ToolsService } from 'src/app/services/tools.service';
import { ObjectService } from 'src/app/services/object.service';

interface Roof {
  id: string;
  lines: { start: { lat: number; lng: number } }[];
}

interface Setback {
  lines: { start: { lat: number; lng: number } }[];
}

interface Panel {
  lines: { start: { lat: number; lng: number } }[];
}

@Component({
  selector: 'app-dxf-site-plan',
  templateUrl: './dxf-site-plan.component.html',
  styleUrls: ['./dxf-site-plan.component.scss']
})
export class DxfSitePlanComponent implements OnInit, OnDestroy {
  dxfJsonData: any;
  map: any;
  pdfJSON: any = {
    roofs: [],
    obstacles: []
  };
  lineTypes = [
    { key: 'RIDGE', value: 'RIDGE' },
    { key: 'EAVE', value: 'EAVE' },
    { key: 'HIP', value: 'HIP' },
    { key: 'VALLEY', value: 'VALLEY' },
    { key: 'RAKE', value: 'RAKE' },
  ];
  showLineTypeForm: Boolean = false
  activeLine: google.maps.Polyline;
  undo: any = [];
  redo: any = [];
  roofLabelTextProperties: any;
  roofLabelValue: any;
  roofLabelFontSize: any;
  roofLabelTextColor: any = '#000000';
  boundaryLineColor: any;
  roofBoundaryPolylineThickness: any;
  roofBoundaryThicknessValue: any = 2;
  roofFacetLength: any;
  accumulatedAmount: number = 0;
  mapRotationDegree: number;
  roofLabelArray: any = [];
  roofLinesArray: any = [];
  report_Id: string
  isloading: boolean = false;
  selectedRoofLine: any;
  changeRoofLineType = [];
  selectedRoofData: any;
  showev = true;
  location = {
    latitude: 29.57065,
    longitude: -81.230576
  };
  dxfDataSubscription: Subscription;
  selectedSinglePanels: any;
  selectedPanels: any = [];
  sitePanels: any;
  panelPolygons: any = [];
  referencePanel: any
  selectSingleRoof: any
  selectedRoof: google.maps.Polygon[] = [];
  hiddenRoof: google.maps.Polygon[] = [];
  roofAndSetbacksArray: any = [];
  panelsArray: any = [];
  selectedPanelEvent = [];
  isDragArray: boolean = false;
  activeInfoWindow: any = null;
  fenceDataSubscription: Subscription;
  @Output() istabshow = new EventEmitter(false);
  @Output() mapInstance = new EventEmitter();
  @Input() tabclicksecondTime: boolean = false;

  constructor(private jsonService: CommonService,
    private toasterService: ToasterService,
    private drawingService: AdditionalDrawingsService,
    private customTextService: CustomTextService,
    private fenceService: FenceService,
    private equipmentService: EquipmentService,
    private toolService: ToolsService,
    private objectService: ObjectService) { }

  ngOnInit(): void {
    this.isloading = true;
    setTimeout(() => {
      let permitdata = JSON.parse(localStorage.getItem("permitdata"))
      this.dxfJsonData = JSON.parse(localStorage.getItem("dxfJsonData"))
      this.location.latitude = Number(permitdata.lat),
        this.location.longitude = Number(permitdata.lng)
      this.initializeMap();
      this.mapInstance.emit(this.map);
      if (!this.dxfJsonData) {
        this.dxfDataSubscription = this.jsonService.dxfData$.subscribe(data => {
          this.dxfJsonData = data;
          this.findModulesOrientation(this.dxfJsonData.panels, this.dxfJsonData.setbacks, this.dxfJsonData.obstructionsLine)
          this.drawStructures(this.dxfJsonData);
          this.isloading = false;
        })
      }
      else {
        this.drawStructures(this.dxfJsonData);
        this.isloading = false;
      }
    }, 1500);
  }

   initializeMap() {
    const center = { lat: this.location.latitude, lng: this.location.longitude };
    this.map = new google.maps.Map(document.getElementById("dxfSitePlanMap")!, {
      center: center,
      zoom: 22,
      tilt: 0,
      heading: 0,
    });
    this.map.set("mapId", "90f87356969d889c");
    google.maps.event.addListener(this.map, 'zoom_changed', () => {
    });
    // let localStorageData = await this.getLocalStorageData();
    // if (localStorageData) {
    //   if (localStorageData.rotate) {
    //     this.mapRotationDegree = localStorageData.rotate
    //     this.adjustMap('rotate', this.mapRotationDegree);
    //   }
    // }
    // let localStorageData = JSON.parse(localStorage.getItem('mapData'));
    this.reDrawActions();
  }

  findModulesOrientation(panels, setback, obstructionsLine) {
    this.dxfJsonData.roofs.map((roof) => {
      let modules = [], setbacks = [], obstructionsLine = [];
      panels.map(element => {
        if (element.lines[0].length > element.lines[1].length) {
          element.orientation = "portrait"
        }
        else {
          element.orientation = "landscape"
        }
        if (element.roofId === roof.id) {
          modules.push(element)
        }
      });
      roof.modules = modules;
      setback.map(element => {
        if (element.roofId === roof.id) {
          setbacks.push(element)
        }
      });
      roof.setbacks = setbacks;
      obstructionsLine.map(element => {
        if (element.roofId === roof.id) {
          obstructionsLine.push(element)
        }
      });
      roof.obstructionsLine = obstructionsLine;
    })
  }

  drawStructures(dxfJsonData): void {
    const { roofLine, roofs, setbacks, panels, obstructionsLine } = dxfJsonData

    let localStorageData = JSON.parse(localStorage.getItem('finalPdfJSON'));
    if (localStorageData?.sitePlan?.panels) {
      this.sitePanels = localStorageData.sitePlan.panels;
    } else {
      this.sitePanels = panels;
    }

    roofLine.forEach(line => {

      if (line.type === "RIDGE" || line.color == 'red') {
        line.color = '#E74C3C'
        line.type = 'RIDGE'
      }
      if (line.type === "EAVE" || line.color == 'blue') {
        line.color = 'blue'
        line.type = 'EAVE'
      }
      if (line.type === "RAKE") {
        line.color = 'green'
      }
      if (line.type === "HIP") {
        line.color = 'gray'
      }
      if (line.type === "VALLEY") {
        line.color = 'brown'
      }

      const roofPolyline = new google.maps.Polyline({
        path: [line.start, line.end],
        geodesic: true,
        strokeColor: line.color,
        strokeOpacity: 1.0,
        strokeWeight: 3,
        map: this.map,
      });

      roofPolyline.addListener('click', () => {
        this.openInfoWindow("changeLineType");
        this.selectedRoofLine = { line, roofPolyline };
        const sameLine = this.changeRoofLineType.find((element) => element.id === line.id)
        if (!sameLine) {
          this.changeRoofLineType.push(line)
        }
      })
    })
    const roofsWithoutSetbacks: google.maps.Polygon[] = []; // Array to store roof polygons without setbacks inside
    // Iterate over each roof
    roofs.forEach((roof, roofIndex) => {
      let maxLength = -Infinity; // Initialize with a very small value
      let maxAngle;

      roof.lines.forEach(line => {
        const length = parseFloat(line.length); // Convert length from string to number
        if (length > maxLength && line.type === 'EAVE') {
          maxLength = length;
          maxAngle = line.angle;
        }
      });
      let fillOpacity = 0.2
      let zIndex = 10
      if (roof.isVisible) {
        fillOpacity = 0.7
        zIndex = -10
      }
      const roofPath = roof.lines.map((line: { start: { lat: any; lng: any; }; }) => new google.maps.LatLng(line.start.lat, line.start.lng));
      const roofPolygon = new google.maps.Polygon({
        paths: roofPath,
        geodesic: true,
        strokeColor: "black",
        strokeOpacity: 0,
        strokeWeight: 1,
        fillColor: "#FF9393",
        fillOpacity,
        map: this.map,
        zIndex,
      });
      roofPolygon.set('id', roof.id);
      roofPolygon.set('isVisible', roof.isVisible);

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
          this.setbackListener(roof, roofPolygon, setbackPolygon, maxAngle)
        }
      });

      roof.modules.forEach((panel, index) => {
        if (panel.isVisible) {
          const panelPath = panel.lines.map((line: { start: { lat: any; lng: any; }; }) => ({
            lat: line.start.lat,
            lng: line.start.lng
          }));

          const panelPolygon = new google.maps.Polygon({
            paths: panelPath,
            geodesic: true,
            strokeColor: "#FFA500",
            strokeOpacity: 1.0,
            strokeWeight: 2,
            fillColor: "#FFFA41",
            fillOpacity: 0.7,
            draggable: true,
            map: this.map,
            zIndex: 0
          });
          panelPolygon.set('id', panel.id);
          panelPolygon.set('roofId', roof.id);
          if (panel.orientation == "portrait" && !this.referencePanel) {
            this.referencePanel = panelPolygon;
          }
          this.modulesListener(roof, roofPolygon, panelPolygon, maxAngle)

          // this.arrayDragAndRotate(panelPolygon)
          this.panelsArray.push(panelPolygon);
        }
      })

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

        this.roofListener(roofPolygon, maxAngle)
      })
      this.roofListener(roofPolygon, maxAngle)
    });

    this.pdfJSON.roofs = roofs;
    let eaveLinesArray = roofLine.filter((element)=> element.type === "EAVE");
    this.equipmentService.eaveLinesArray = eaveLinesArray;
  }

  highLightRoofLine(line) {
    this.removeHighLightedLine();
    if (line) {
      const path = [
        { lat: line.start.lat, lng: line.start.lng },
        { lat: line.end.lat, lng: line.end.lng },
      ]
      this.activeLine = new google.maps.Polyline({
        path: path,
        map: this.map,
        strokeColor: 'red',
        zIndex: 99
      })
    }
  }

  removeHighLightedLine() {
    if (this.activeLine) {
      this.activeLine.setMap(null);
    }
  }

  getLineType(event, index) {
    this.selectedRoofData.lines[index]['type'] = event.target.value;
  }

  submitLineType(): void {
    this.showLineTypeForm = false;
    this.removeHighLightedLine();
  }

  changeLineColor(event) {
    let strokeColor = 'grey'
    if (this.selectedRoofLine.line.type === "RIDGE") {
      strokeColor = '#E74C3C'
    }
    if (this.selectedRoofLine.line.type === "EAVE") {
      strokeColor = 'blue'
    }
    if (this.selectedRoofLine.line.type === "RAKE") {
      strokeColor = 'green'
    }
    if (this.selectedRoofLine.line.type === "HIP") {
      strokeColor = 'gray'
    }
    if (this.selectedRoofLine.line.type === "VALLEY") {
      strokeColor = 'brown'
    }
    this.selectedRoofLine.roofPolyline.setOptions({
      strokeColor
    })

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

  closeOpenedInfoWindow() {
    this.activeInfoWindow = null;
  }

  adjustMap = (mode: string, amount: number) => {
    this.accumulatedAmount += amount;
    switch (mode) {
      case "tilt":
        this.map.setTilt(this.map.getTilt()! + amount);
        break;
      case "rotate":
        this.map.setHeading(this.map.getHeading()! + amount);
        if (this.accumulatedAmount > 360) {
          this.accumulatedAmount = 0;
        }
        this.saveDataToLocalStorage(this.accumulatedAmount, 'rotate');
        break;
      default:
        break;
    }
  }

  saveDataToLocalStorage(data: any, type: string, inititalAngle?: any) {
    let mapData = {
      roofLabel: this.roofLabelArray,
      roofLines: this.roofLinesArray,
      rotate: this.mapRotationDegree
    };
    if (type == 'rotate') {
      this.mapRotationDegree = data;
      mapData.rotate = this.mapRotationDegree;
    }
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
      this.openInfoWindow("label");

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

    if(mapData){
      // delete mapData.roofLabel;
      // delete mapData.roofLines;
    }

      localStorage.setItem("dxfJsonData", JSON.stringify(this.dxfJsonData));

      delete this.pdfJSON.modules;

      let finalPdfJSON = {
        sitePlan: { ...this.pdfJSON, ...mapData }
      }
      localStorage.setItem("finalPdfJSON", JSON.stringify(finalPdfJSON));
    }
  }

  addListnerToPanels(panel: any) {
    this.panelPolygons.push(panel);
    panel.addListener('click', () => {
      this.openInfoWindow("panel");
      const index = this.selectedPanels.findIndex(ele => ele.panel.get('id') === panel.get('id'));
      if (index === -1) {
        // Panel not selected, add it to the array and highlight it
        this.selectedPanels.push({ panel, prevPosition: panel.getPath().getArray() });
        console.log(this.selectedPanels);

        panel.setOptions({ fillColor: '#9ACD32', fillOpacity: 1, strokeColor: '#FFFFFF' });
      } else {
        // Panel already selected, remove it from the array and remove highlight
        this.selectedPanels.splice(index, 1);
        console.log(this.selectedPanels);

        panel.setOptions({ fillColor: '#FFFA41', fillOpacity: '0.8', strokeColor: '#FFA500' }); // Replace 'original color' and 'original opacity' with the original values
      }
      // setTimeout(() => {
      //   let removePanel = document.getElementById('removePanel') as HTMLElement;
      //   const rotatePanelButton = document.getElementById('rotatePanel') as HTMLElement;
      //   if (rotatePanelButton) {
      //     rotatePanelButton.addEventListener('click', () => {
      //       this.selectedPanels.forEach(selectedPolygon => {
      //         const id = selectedPolygon.get('id');
      //         const panelIndex = this.sitePanels.findIndex(panel => panel.id === id);
      //         if (panelIndex !== -1) {
      //           const paths = selectedPolygon.getPath().getArray();
      //           // Find the center of the polygon
      //           const center = this.findPolygonCenter(paths);
      //           // Calculate the angle of rotation (in radians)
      //           const angle = Math.PI / 2; // 90 degrees clockwise rotation (you can change this value as needed)
      //           // Rotate each vertex around the center
      //           const rotatedPaths = paths.map(path => this.rotatePointPanel(path, center, angle));
      //           // Check for overlap with other polygons
      //           const isOverlap = this.checkOverlap(rotatedPaths, this.panelPolygons.filter(p => p !== selectedPolygon));
      //           // If no overlap with any other red panel, revert color of previously red panels
      //           if (!isOverlap) {
      //             for (const panel of this.panelPolygons) {
      //               const panelId = panel.get('id');
      //               if (panel.fillColor === '#FF0000' && panelId !== id) {
      //                 const panelPaths = panel.getPath().getArray();
      //                 const isPanelOverlap = this.checkOverlap(panelPaths, this.panelPolygons.filter(p => p !== panel));
      //                 if (!isPanelOverlap) {
      //                   panel.setOptions({ fillColor: '#FFFA41', fillOpacity: 0.8, strokeColor: '#FFA500' });
      //                 }
      //               }
      //             }
      //           }
      //           // Update color based on overlap
      //           if (isOverlap) {
      //             selectedPolygon.setOptions({ fillColor: '#FF0000', fillOpacity: 0.7, strokeColor: '#FFFFFF' });
      //           } else {
      //             selectedPolygon.setOptions({ fillColor: '#FFFA41', fillOpacity: 0.8, strokeColor: '#FFA500' });
      //           }
      //           // Update the polygon's paths
      //           selectedPolygon.setPath(rotatedPaths);
      //           // Update the panel object in sitePanels
      //           this.sitePanels[panelIndex].lines = rotatedPaths.map(path => ({ start: { lat: path.lat(), lng: path.lng() } }));
      //           this.selectedPanels = [];
      //         }
      //       });
      //       // Check for overlap after all panels are rotated
      //       this.panelPolygons.forEach(panel => {
      //         const panelId = panel.get('id');
      //         const panelPaths = panel.getPath().getArray();
      //         const isPanelOverlap = this.checkOverlap(panelPaths, this.panelPolygons.filter(p => p !== panel));
      //         if (!isPanelOverlap && panel.fillColor === '#FF0000') {
      //           panel.setOptions({ fillColor: '#FFFA41', fillOpacity: 0.8, strokeColor: '#FFA500' });
      //         }
      //       });
      //     });
      //   }
      //   if (removePanel) {
      //     removePanel.addEventListener('click', () => {
      //       // Set isible to false for selected panels in this.sitePanels
      //       const selectedPanelIds = this.selectedPanels.map(panel => panel.get('id'));
      //       this.sitePanels.forEach(panel => {
      //         if (selectedPanelIds.includes(panel.id)) {
      //           panel.isVisible = false;
      //         }
      //       });
      //       this.selectedPanels.forEach(panel => {
      //         panel.setMap(null);
      //       });
      //       this.selectedPanels = [];
      //     });
      //   }
      // }, 500);
    })
    panel.addListener('dragend', () => {
      this.checkPanelsOverlap(panel);
      // this.checkPanelOverlapWithRoof(polygon);
    });
  }

  checkOverlap(paths1, polygons) {
    const geometry = google.maps.geometry;
    for (const polygon of polygons) {
      const paths2 = polygon.getPath().getArray();
      // Check if any point of paths1 is inside paths2
      for (const path1 of paths1) {
        if (this.isPointInsidePolygon(path1, paths2)) {
          return true; // Overlap detected
        }
      }
      // Check if any point of paths2 is inside paths1
      for (const path2 of paths2) {
        if (this.isPointInsidePolygon(path2, paths1)) {
          return true; // Overlap detected
        }
      }
    }
    return false; // No overlap detected
  }

  // Function to check if a point is inside a polygon
  isPointInsidePolygon(point, polygonPaths) {
    const polygon = new google.maps.Polygon({ paths: polygonPaths });
    return google.maps.geometry.poly.containsLocation(point, polygon);
  }

  // Function to find the center of a polygon
  findPolygonCenter(paths: google.maps.LatLng[]): google.maps.LatLng {
    const bounds = new google.maps.LatLngBounds();
    paths.forEach(path => bounds.extend(path));
    return bounds.getCenter();
  }

  // Function to rotate a point around another point by a given angle (in radians)
  rotatePointPanel(point: google.maps.LatLng, center: google.maps.LatLng, angle: number): google.maps.LatLng {
    const sinA = Math.sin(angle);
    const cosA = Math.cos(angle);
    const dx = point.lng() - center.lng();
    const dy = point.lat() - center.lat();
    const newX = dx * cosA - dy * sinA + center.lng();
    const newY = dx * sinA + dy * cosA + center.lat();
    return new google.maps.LatLng(newY, newX);
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

  isPointInsideRoofPolygon(point: google.maps.LatLng, polygon: google.maps.Polygon) {
    return google.maps.geometry.poly.containsLocation(point, polygon); // Function to check if a point is inside a polygon
  }

  addPanel() {
    if (this.selectedRoof.length === 0) {
      this.toasterService.showError("Kindly Select A Roof First");
    }
  }

  roofListener(roof, angle) {
    roof.addListener('click', (event) => {
      const isVisible = roof.get('isVisible');
      if (isVisible) {
        this.map.setHeading(angle - 90);
        const index = this.selectedRoof.indexOf(roof);
        if (index === -1) {
          if (this.selectedRoof.length > 0) {
            this.selectedRoof.forEach((polygon) => {
              polygon.setOptions({ fillOpacity: 0.7 });
            })
            this.selectedRoof = [];
          }
          this.selectedRoof.push(roof);
          roof.setOptions({ fillOpacity: 1 });
        } else {
          this.selectedRoof.splice(index, 1);
          roof.setOptions({ fillOpacity: 0.7 });
        }
      }
    })
    const roofMenu = new RoofMenu();

    roof.addListener("contextmenu", (event) => {
      const clickedPosition = event.latLng;
      this.selectSingleRoof = roof;
      roofMenu.open(this.map, clickedPosition);
    });
  }

  setbackListener(roof, roofPolygon, setback, angle) {
    setback.addListener('click', (event) => {
      const isVisible = roofPolygon.get('isVisible');
      if (isVisible) {
        const inside = google.maps.geometry.poly.containsLocation(
          event.latLng,
          roofPolygon
        )
        if (!inside) {
          return;
        }
        this.map.setHeading(angle - 90);
        const index = this.selectedRoof.indexOf(roofPolygon);
        if (index === -1) {
          if (this.selectedRoof.length > 0) {
            this.selectedRoof.forEach((polygon) => {
              polygon.setOptions({ fillOpacity: 0.7 });
            })
            this.selectedRoof = [];
          }
          this.selectedRoof.push(roofPolygon);
          roofPolygon.setOptions({ fillOpacity: 1 });
        }
      }
    })
    setback.addListener('dblclick', (event) => {
      const { latLng } = event
      const inside = google.maps.geometry.poly.containsLocation(
        latLng,
        roofPolygon
      )
      if (!inside) {
        return;
      }
      this.addPanelToRoof(roof, {
        lat: latLng.lat(),
        lng: latLng.lng()
      });
    })
    const roofMenu = new RoofMenu();

    setback.addListener("contextmenu", (event) => {
      const clickedPosition = event.latLng;
      this.selectSingleRoof = roofPolygon;
      roofMenu.open(this.map, clickedPosition);
    });
  }

  modulesListener(roof, roofPolygon, module, angle) {
    module.addListener('click', (event) => {
      if (event.domEvent && (event.domEvent.ctrlKey || event.domEvent.metaKey)) {
        if (this.selectedPanels.length == 0) {
          debugger;
          this.selectedPanelEvent.forEach(ele => {
            google.maps.event.clearListeners(ele.drag, 'drag')
            google.maps.event.clearListeners(ele.dragend, 'dragend')
          })
        }
        if (this.selectedSinglePanels) {
          this.selectedSinglePanels.setOptions({ fillColor: "#FFFA41", draggable: false })
          this.selectedSinglePanels = null
        }
        const index = this.selectedPanels.findIndex(ele => ele.module.get('id') === module.get('id'));

        console.log("selectedPanelEvent", this.selectedPanelEvent);

        if (index === -1) {
          const prevPosition = module.getPath().getArray();
          this.selectedPanels.push({ module, prevPosition });
          module.setOptions({ fillColor: "#4677C7", draggable: true })
        } else {
          this.selectedPanels.splice(index, 1);
          module.setOptions({ fillColor: "#FFFA41", draggable: false });
        }

      } else {
        const inside = google.maps.geometry.poly.containsLocation(
          event.latLng,
          roofPolygon
        )
        if (!inside) {
          return;
        }
        this.map.setHeading(angle - 90);
        const index = this.selectedRoof.indexOf(roofPolygon);
        if (index === -1) {
          if (this.selectedRoof.length > 0) {
            this.selectedRoof.forEach((polygon) => {
              polygon.setOptions({ fillOpacity: 0.7 });
            })
            this.selectedRoof = [];
          }
          this.selectedRoof.push(roofPolygon);
          roof.setOptions({ fillOpacity: 1 });
        }
      }
    })
    google.maps.event.addListener(this.map, 'click', () => {
      this.selectedPanels.map(ele => ele.module.setOptions({ fillColor: "#FFFA41", draggable: true }))
      this.selectedPanels = [];
    })

    let previousInnerCoords = module.getPath().getArray();
    module.addListener('drag', () => {
      if (this.selectedPanels.length != 0) {
        const panel = this.selectedPanels.find(ele => ele.module.get('id') === module.get('id'));

        const currentCoords = module.getPath().getArray();

        const deltaLat = currentCoords[0].lat() - panel.prevPosition[0].lat();
        const deltaLng = currentCoords[0].lng() - panel.prevPosition[0].lng();
        this.selectedPanels.forEach(({ module, prevPosition }) => {
          const updatedCoords = prevPosition.map(coord => ({
            lat: coord.lat() + deltaLat,
            lng: coord.lng() + deltaLng,
          }));
          module.setPath(updatedCoords.map(coord => new google.maps.LatLng(coord.lat, coord.lng)));
        })
      }
      else {
        var path = module.getPath();
        for (var i = 0; i < path.getLength(); i++) {
          if (!google.maps.geometry.poly.containsLocation(path.getAt(i), roofPolygon)) {
            module.setPath(previousInnerCoords);
            return;
          }
        }
        previousInnerCoords = path.getArray();
      }
    });

    module.addListener('dragend', () => {
      this.checkPanelsOverlap(module);
      // this.checkPanelOverlapWithRoof(polygon);
    });
    const panelMenu = new PanelMenu();

    module.addListener("contextmenu", (event) => {
      const clickedPosition = event.latLng;
      this.selectedSinglePanels = module;
      panelMenu.open(this.map, clickedPosition);
    });
  }

  calculateCentroidOfSelectedRoof(paths) {
    // Initialize variables for calculating centroid
    let numPoints = 0;
    let centroidLat = 0;
    let centroidLng = 0;

    paths.forEach(function (path) { // Iterate over the paths
      path.getArray().forEach(function (latLng) { // Iterate over the vertices of the path
        // Add the lat and lng to the centroid variables
        centroidLat += latLng.lat();
        centroidLng += latLng.lng();
        numPoints++;
      });
    });

    // Calculate the centroid
    centroidLat /= numPoints;
    centroidLng /= numPoints;

    return { // Return an object for the centroid
      lat: centroidLat,
      lng: centroidLng
    };
  }

  addPanelToRoof(roof, clickedPoint) {
    let paths = this.referencePanel.getPath().getArray();

    let referencePanelCenter = paths.reduce((accumulator, element) => {
      accumulator.lat += element.lat();
      accumulator.lng += element.lng();
      return accumulator;
    }, { lat: 0, lng: 0 });
    referencePanelCenter.lat /= paths.length;
    referencePanelCenter.lng /= paths.length;

    let newPanelPath = paths.map(vertices => ({
      lat: clickedPoint.lat + (referencePanelCenter.lat - vertices.lat()),
      lng: clickedPoint.lng + (referencePanelCenter.lng - vertices.lng())
    }));

    const eaveLine = roof.lines.find(ele => ele.type === "EAVE")

    const center = new google.maps.LatLng(clickedPoint.lat, clickedPoint.lng)

    const rotatedPaths = newPanelPath.map(path => this.rotatePointPanel(new google.maps.LatLng(path), center, 0));
    let newPanelPolygon = new google.maps.Polygon({
      paths: rotatedPaths,
      geodesic: true,
      strokeColor: "#FFA500",
      strokeOpacity: 1.0,
      strokeWeight: 2,
      fillColor: "#FFFA41",
      fillOpacity: 0.8,
      map: this.map,
      draggable: true
    });

    let finalPanelObject;
    newPanelPolygon.set('id', `P${this.sitePanels.length + 1}`);

    let newPaths = newPanelPolygon.getPath().getArray();
    let afterarrangepath = this.arrangeArray(newPaths, eaveLine.angle)

    const panelLines: any = [];
    for (let i = 0; i < newPaths.length; i++) {
      const panelObject: any = {};
      panelObject.unit = "feet";
      const startPoint = newPaths[i];
      const endPoint = newPaths[i + 1] || newPaths[0];
      panelObject.length = (google.maps.geometry.spherical.computeLength([startPoint, endPoint]) * 3.28084).toFixed(2);
      panelObject.angle = google.maps.geometry.spherical.computeHeading(startPoint, endPoint);;
      panelObject.start = { lat: startPoint.lat(), lng: startPoint.lng() };
      panelObject.end = { lat: endPoint.lat(), lng: endPoint.lng() };
      panelObject.id = i + 1;
      panelLines.push(panelObject);
    }
    finalPanelObject = {
      id: `P${this.sitePanels.length + 1}`,
      lines: panelLines,
      orientation: "portrait",
      roofId: this.selectedRoof[0]["id"],
      isVisible: true
    }
    this.sitePanels.push(finalPanelObject);
    let updatedRoof = this.pdfJSON.roofs.filter((roof) => {
      if (roof.id == this.selectedRoof[0]["id"]) {
        return roof.modules.push(finalPanelObject);
      }
    })
    this.pdfJSON.roofs.forEach((roof) => {
      if (roof.id == updatedRoof.id) {
        roof = updatedRoof;
      }
    })
    this.addListnerToPanels(newPanelPolygon);
    this.panelsArray.push(newPanelPolygon);
    this.checkPanelsOverlap(newPanelPolygon)
  }

  arrangeArray(path, eavlineAngle) {
    const length = path.length;
    let i = 0;
    while (i < length) {
      const heading = google.maps.geometry.spherical.computeHeading(path[1], path[2]);
      const angleDifference = Math.abs(heading - eavlineAngle);

      if (angleDifference <= 1) {
        break;
      }

      const firstElement = path.shift();
      path.push(firstElement);
      i++;
    }
    return path;
  }

  checkPanelsOverlap(polygon) {
    const id = polygon.get('id');
    const panelIndex = this.sitePanels.findIndex(panel => panel.id === id);
    if (panelIndex !== -1) {
      const paths = polygon.getPath().getArray();

      this.sitePanels[panelIndex].lines = this.sitePanels[panelIndex].lines.map((line, index) => {
        const nextIndex = index + 1;
        // Check if the next index is within bounds of the array
        const nextPath = nextIndex < paths.length ? paths[nextIndex] : paths[0]; // Wrap around to the first point if reaching the end
        return {
          ...line,
          start: { lat: paths[index].lat(), lng: paths[index].lng() },
          end: { lat: nextPath.lat(), lng: nextPath.lng() }
        };
      });

      // const isOverlap = this.checkOverlap(paths, this.panelPolygons.filter(p => p !== polygon)); // Check for overlap
      // if (!isOverlap) { // If no overlap with any other red panel, revert color of previously red panels
      //   for (const panel of this.panelPolygons) {
      //     const panelId = panel.get('id');
      //     if (panel.fillColor === '#FF0000' && panelId !== id) {
      //       const panelPaths = panel.getPath().getArray();
      //       const isPanelOverlap = this.checkOverlap(panelPaths, this.panelPolygons.filter(p => p !== panel));
      //       if (!isPanelOverlap) {
      //         panel.setOptions({ fillColor: '#FFFA41', fillOpacity: 0.8, strokeColor: '#FFA500' });
      //       }
      //     }
      //   }
      // }
      // if (isOverlap) {
      //   polygon.setOptions({ fillColor: '#FF0000', fillOpacity: 0.7, strokeColor: '#FFFFFF' }); // Update color based on overlap
      // } else {
      //   polygon.setOptions({ fillColor: '#FFFA41', fillOpacity: 0.8, strokeColor: '#FFA500' });
      // }
    }
  }

  doPolygonsOverlap(polygon1, polygon2) {
    // Check if any point of polygon1 is inside polygon2
    const polygon1Path = polygon1.getPath();
    for (let i = 0; i < polygon1Path.getLength(); i++) {
      if (google.maps.geometry.poly.containsLocation(polygon1Path.getAt(i), polygon2)) {
        return true;
      }
    }

    // Check if any point of polygon2 is inside polygon1
    const polygon2Path = polygon2.getPath();
    for (let i = 0; i < polygon2Path.getLength(); i++) {
      if (google.maps.geometry.poly.containsLocation(polygon2Path.getAt(i), polygon1)) {
        return true;
      }
    }

    return false;
  }

  checkPanelOverlapWithRoof(newPanelPolygon) {
    let isOverlap = false;
    // Iterate through each edge of each roof polygon
    this.roofAndSetbacksArray.forEach((roofPolygon) => {
      const roofEdges = this.getPolygonEdges(roofPolygon);
      // Check for intersection between panel polygon and each edge of the roof polygon
      roofEdges.forEach((edge) => {
        if (this.doPolygonsIntersect(edge, newPanelPolygon)) {
          isOverlap = true;
          return; // Exit loop early if overlap found
        }
      });
      if (isOverlap) return; // Exit loop early if overlap found
    });

    // Update color based on overlap
    if (isOverlap) {
      newPanelPolygon.setOptions({ fillColor: '#FF0000', fillOpacity: 0.7, strokeColor: '#FFFFFF' });
    } else {
      newPanelPolygon.setOptions({ fillColor: '#FFFA41', fillOpacity: 0.8, strokeColor: '#FFA500' });
    }
  }

  // Function to get edges of a polygon
  getPolygonEdges(polygon) {
    const edges = [];
    const vertices = polygon.getPath();

    for (let i = 0; i < vertices.getLength(); i++) {
      const startPoint = vertices.getAt(i);
      const endPoint = vertices.getAt((i + 1) % vertices.getLength());
      edges.push([startPoint, endPoint]);
    }

    return edges;
  }

  // Function to check intersection between two polygons
  doPolygonsIntersect(edge, polygon) {
    const panelPath = polygon.getPath();

    for (let i = 0; i < panelPath.getLength(); i++) {
      const startPoint = panelPath.getAt(i);
      const endPoint = panelPath.getAt((i + 1) % panelPath.getLength());
      const intersection = this.segmentsIntersect(edge[0], edge[1], startPoint, endPoint);

      if (intersection) {
        return true;
      }
    }

    return false;
  }

  // Function to check intersection between two line segments
  segmentsIntersect(a, b, c, d) {
    const denominator = ((b.lng() - a.lng()) * (d.lat() - c.lat())) - ((b.lat() - a.lat()) * (d.lng() - c.lng()));
    const numerator1 = ((a.lat() - c.lat()) * (d.lng() - c.lng())) - ((a.lng() - c.lng()) * (d.lat() - c.lat()));
    const numerator2 = ((a.lat() - c.lat()) * (b.lng() - a.lng())) - ((a.lng() - c.lng()) * (b.lat() - a.lat()));

    // Detect coincident lines (has a problem, read below)
    if (denominator === 0) return false;

    const r = numerator1 / denominator;
    const s = numerator2 / denominator;

    return (r >= 0 && r <= 1) && (s >= 0 && s <= 1);
  }

  openInfoWindow(currentWindow: string) {
    if (this.activeInfoWindow !== null || this.activeInfoWindow === null) {
      this.activeInfoWindow = null;
      setTimeout(() => {
        this.activeInfoWindow = currentWindow;
      }, 300);
    }
  }

  updateLineTypes() {
    this.dxfJsonData.roofs.forEach((roof) => {
      roof.lines.map((line) => {
        this.changeRoofLineType.forEach(element => {
          if (element.start.lat === line.start.lat && element.end.lng === line.end.lng) {
            line.type = element.type
          }
          if (element.end.lat === line.start.lat && element.start.lng === line.end.lng) {
            line.type = element.type
          }
        });
      })
    })
  }

  hideRoof() {
    this.selectSingleRoof.setOptions({ fillOpacity: 0.2, zIndex: 10 })
    this.selectSingleRoof.set('isVisible', false);
    let roof = this.hiddenRoof.find(ele => ele.get('id') === this.selectSingleRoof.get('id'))
    if (roof) {
      roof = this.selectSingleRoof
    }
    else {
      this.hiddenRoof.push(this.selectSingleRoof)
    }

    const roofMenu = new RoofMenu();
    roofMenu.onRemove()
  }
  unhideRoof() {
    this.selectSingleRoof.setOptions({ fillOpacity: 0.7, zIndex: -50 })
    this.selectSingleRoof.set('isVisible', true);
    let roof = this.hiddenRoof.find(ele => ele.get('id') === this.selectSingleRoof.get('id'))
    if (roof) {
      roof = this.selectSingleRoof
    }
    else {
      this.hiddenRoof.push(this.selectSingleRoof)
    }
    const roofMenu = new RoofMenu();
    roofMenu.onRemove()
  }
  rotatePanel() {
    this.selectSingleRoof.setOptions({ fillOpacity: 0.2, zIndex: 10 })
    this.selectSingleRoof.set('isVisible', false);
    let roof = this.hiddenRoof.find(ele => ele.get('id') === this.selectSingleRoof.get('id'))
    if (roof) {
      roof = this.selectSingleRoof
    }
    else {
      this.hiddenRoof.push(this.selectSingleRoof)
    }

    const roofMenu = new RoofMenu();
    roofMenu.onRemove()

  }
  deletePanel() {
    this.selectSingleRoof.setOptions({ fillOpacity: 0.7, zIndex: -50 })
    this.selectSingleRoof.set('isVisible', true);
    let roof = this.hiddenRoof.find(ele => ele.get('id') === this.selectSingleRoof.get('id'))
    if (roof) {
      roof = this.selectSingleRoof
    }
    else {
      this.hiddenRoof.push(this.selectSingleRoof)
    }
    const roofMenu = new RoofMenu();
    roofMenu.onRemove()
  }

  updateDxfJsonData() {
    this.dxfJsonData.roofs.map(roof => {
      this.hiddenRoof.forEach(element => {
        if (roof.id == element.get("id")) {
          roof.isVisible = element.get("isVisible")
        }
      });
    })
  }

  reDrawActions(){
    if (this.drawingService.chimneyArray.length > 0) {
      this.drawingService.reDrawChimney(this.map, this.map.getCenter(), "Site Plan");
    }
    if (this.customTextService.customTextArray.length > 0) {
      this.customTextService.reDrawCustomText(this.map, this.map.getCenter(), "Site Plan");
    }
    if (this.fenceService.fencingArray.length > 0) {
      this.fenceService.reDrawFence(this.map);
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
    this.map.setHeading(this.toolService.accumulatedAmount);
  }

  ngOnDestroy() {
    this.updateLineTypes();
    this.updateDxfJsonData();
    this.submitSitePlanData();
    if (this.dxfDataSubscription) { this.dxfDataSubscription.unsubscribe(); }
  }
}

class RoofMenu extends google.maps.OverlayView {
  private divListener_?: google.maps.MapsEventListener;
  private menuElement_: HTMLElement;

  constructor() {
    super();
    this.menuElement_ = document.getElementById("roofMenu")!;
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
    // Clean up other resources if necessary
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
class PanelMenu extends google.maps.OverlayView {
  private divListener_?: google.maps.MapsEventListener;
  private menuElement_: HTMLElement;

  constructor() {
    super();
    this.menuElement_ = document.getElementById("panelMenu")!;
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

