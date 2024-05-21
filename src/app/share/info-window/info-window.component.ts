import { Component, OnDestroy, OnInit ,ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { AdditionalDrawingsService } from 'src/app/services/additional-drawings.service';
import { CustomTextService } from 'src/app/services/custom-text.service';
import { EquipmentService } from 'src/app/services/equipment.service';
import { FenceService } from 'src/app/services/fence.service';
import { RoofSlopeService } from 'src/app/services/roof-slope.service';
import { ToolsService } from 'src/app/services/tools.service';

@Component({
  selector: 'app-info-window',
  templateUrl: './info-window.component.html',
  styleUrls: ['./info-window.component.scss']
})
export class InfoWindowComponent implements OnInit, OnDestroy {

  resizeNgModel: any = 1;
  textNgModel: any;
  fontSizeNgModel: any;
  fontColorNgModel: any = '#000000';
  toolThicknessNgModel: any = 2;
  toolColor: any;
  toolFillColorNgModel: any = '#FFFFFF';
  toolOpacityNgModel: any = 1;
  equipmentDataSubscription: Subscription;
  drawingDataSubscription: Subscription;
  customTextDataSubscription: Subscription;
  toolDataSubscription: Subscription;
  fenceDataSubscription: Subscription;
  roofSlopeDataSubscription: Subscription
  activeInfoWindow: string;
  showInfoWindow: boolean = false;
  maxFontSize: number = 50;
  activeTool: string = '';

  constructor(
    private equipmentService: EquipmentService,
    private drawingService: AdditionalDrawingsService,
    private customTextService: CustomTextService,
    private toolService: ToolsService,
    private fenceService: FenceService,
    private roofSlopeService: RoofSlopeService,
    private cdRef:ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.equipmentDataSubscription = this.equipmentService.equipmentData$.subscribe(data => {
      if (data) {
        this.addListnerToEquipment(data.polygon, data.labelMarker);
      }
    });

    this.drawingDataSubscription = this.drawingService.data$.subscribe(data => {
      if (data) {
        this.addListnerToChimney(data.polygon);
      }
    });

    this.customTextDataSubscription = this.customTextService.customTextData$.subscribe(data => {
      if (data) {
        this.addListnerOnCustomText(data.marker);
      }
    });

    this.toolDataSubscription = this.toolService.toolData$.subscribe(data => {
      if (data) {
        this.addListnerOnTool(data.type, data.tool, data.map);
      }
    });

    this.fenceDataSubscription = this.fenceService.fenceData$.subscribe(data => {
      if (data) {
        this.addListnerOnFence(data.polyline);
      }
    });

    this.roofSlopeDataSubscription = this.roofSlopeService.roofSlopeData$.subscribe(data => {
      if (data) {
        this.addListnerOnRoofSlope(data.marker);
      }
    });

  }

  addListnerToEquipment(polygon: google.maps.Polygon, labelMarker: any): any {
    this.activeInfoWindow = "equipment";
    this.openInfoWindow();
    this.cdRef.detectChanges();
    setTimeout(() => {
      let currentSliderValue = 0;
      const resizeInputId = document.getElementById('resizeInputId') as HTMLInputElement;
      const removeElement = document.getElementById('removeElement') as HTMLElement;
      const sliderValue = document.getElementById('sliderValue') as any;

      if (polygon['scaleSize']) {
        this.resizeNgModel = polygon["scaleSize"];
        sliderValue.value = polygon["scaleSize"];
      }

      resizeInputId?.addEventListener("input", () => {
        this.equipmentService.updatePolygon(polygon, labelMarker, currentSliderValue, resizeInputId.value, polygon['polygonOuterIQ'] ? "inner" : "none");
        if (polygon['circle']) {
          polygon['circle'].setRadius(parseFloat(resizeInputId.value) * 0.5);
        }
        if (polygon['polygonOuterIQ']) {
          this.equipmentService.updatePolygon(polygon['polygonOuterIQ'], labelMarker, currentSliderValue, resizeInputId.value, "outer");
        }
      });

      const handleSliderChange = (args: any) => {
        currentSliderValue = args.value
        this.equipmentService.updatePolygon(polygon, labelMarker, currentSliderValue, resizeInputId.value, polygon['polygonOuterIQ'] ? "inner" : "none");
        if (polygon['polygonOuterIQ']) {
          this.equipmentService.updatePolygon(polygon['polygonOuterIQ'], labelMarker, currentSliderValue, resizeInputId.value, "outer");
        }
      };
      const sliderElement: any = $("#slider1");
      sliderElement.roundSlider({
        value: 0,
        min: 0,
        max: 360,
        radius: 70,
        drag: handleSliderChange,
        change: handleSliderChange,
      });

      removeElement.addEventListener(("click"), () => {
        if (polygon) {
          this.equipmentService.equipmentsArray = this.equipmentService.equipmentsArray.filter((item: any) => item?.id !== polygon['id']);
          polygon.setMap(null);
          labelMarker.setMap(null);
          if (polygon['circle']) {
            polygon['circle'].setMap(null);
          }
          if (polygon['polygonOuterIQ']) {
            polygon['polygonOuterIQ'].setMap(null);
          }
          this.showInfoWindow = false;
        }
        if (labelMarker.title == "AC (Fused)") {
          this.equipmentService.FusedAcDisconnectLinesArray.forEach((polyline) => {
            polyline.setMap(null);
          })
          this.equipmentService.rectangleAcDisconnect.setMap(null);
        }
        if (labelMarker.title == "AC (Non-Fused)") {
          this.equipmentService.NonFusedAcDisconnectLinesArray.forEach((polyline) => {
            polyline.setMap(null);
          })
        }
        this.cdRef.detectChanges();
      })
    }, 500);
  }

  addListnerToChimney(polygon) {
    this.activeInfoWindow = "chimney";
    this.openInfoWindow();
    this.cdRef.detectChanges();
    setTimeout(() => {
      let currentSliderValue = 0;
      const resizeInputId = document.getElementById('resizeInputId') as HTMLInputElement;
      const removeElement = document.getElementById('removeElement') as HTMLElement;
      const sliderValue = document.getElementById('sliderValue') as any; ``

      if (polygon['scaleSize'] && sliderValue != null) {
        this.resizeNgModel = polygon['scaleSize'];
        sliderValue.value = polygon['scaleSize'];
      }

      if (resizeInputId) {
        resizeInputId?.addEventListener("input", () => {
          const scaleValue = parseFloat(resizeInputId.value);
          this.drawingService.updateChimney(polygon, polygon['rotation'], scaleValue);
        });
      }

      const handleSliderChange = (args: any) => {
        currentSliderValue = args.value;
        this.drawingService.updateChimney(polygon, currentSliderValue, polygon['scaleSize']);
      };

      const sliderElement: any = $("#slider1");
      sliderElement.roundSlider({
        value: 0,
        min: 0,
        max: 360,
        radius: 70,
        change: handleSliderChange,
        drag: handleSliderChange
      });
      removeElement.addEventListener(("click"), () => {
        if (polygon) {
          this.drawingService.chimneyArray = this.drawingService.chimneyArray.filter((item: any) => item?.id !== polygon['id']);
          polygon.setMap(null);
          polygon['circle'].setMap(null);
          polygon['diagonalOne'].setMap(null);
          polygon['diagonalTwo'].setMap(null);
          this.closeOpenedInfoWindow();
        }
        this.cdRef.detectChanges();
      })
    }, 500);
  }

  addListnerOnCustomText(marker: any) {
    this.activeInfoWindow = "customText";
    let customTextProperties = marker.getLabel();
    this.textNgModel = customTextProperties.text;
    this.fontSizeNgModel = customTextProperties.fontSize;
    this.maxFontSize = 50;

    if (customTextProperties.color) {
      this.fontColorNgModel = customTextProperties.color;
    }

    this.openInfoWindow();

    setTimeout(() => {
      const handleSliderChange = (args: any) => {
        const currentSliderValue = args.value;
        let currentLabelClass = document.getElementsByClassName(marker?.label?.className) as any;
        currentLabelClass[0].style.transform = `rotate(${currentSliderValue}deg)`;
        marker.set('rotation', currentSliderValue);
      };

      const sliderElement: any = $("#slider1");
      sliderElement.roundSlider({
        value: 0,
        min: 0,
        max: 360,
        radius: 70,
        drag: handleSliderChange,
        change: handleSliderChange,
      });

      const inputFontSize = document.getElementById('inputFontSize') as HTMLInputElement;
      const sliderValueSpan = document.getElementById('FontSliderValue');
      const inputText = document.getElementById('inputText') as HTMLInputElement;
      const colorPicker = document.getElementById('colorPicker') as HTMLInputElement;
      const removeElement = document.getElementById('removeElement') as HTMLInputElement;

      if (sliderValueSpan) {
        sliderValueSpan.innerText = inputFontSize.value;
      }

      // To change the font-size
      if (inputFontSize && sliderValueSpan) {
        inputFontSize.addEventListener('input', () => {
          const newSize = Number(inputFontSize.value);
          marker['label'].fontSize = `${newSize + 'px'}`; // Set your desired font size
          marker.setLabel(marker['label']);
          sliderValueSpan.innerText = newSize.toString();
        });
      }

      if (colorPicker) {
        colorPicker.addEventListener('input', () => {
          const newColor = colorPicker.value;
          marker['label'].color = newColor; // Set the label text color
          marker.setLabel(marker['label']);
        });
      }

      // To change the text value
      if (inputText) {
        inputText.addEventListener('input', () => {
          let newText = inputText.value;
          if (marker) {
            const label = marker.getLabel() as google.maps.MarkerLabel;
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
        });
      }

      if (removeElement) {
        removeElement.addEventListener('click', () => {
          if (marker) {
            this.customTextService.customTextArray = this.customTextService.customTextArray.filter((item: any) => item['label'].className !== marker['label'].className);
            marker.setMap(null);
            this.closeOpenedInfoWindow();
          }
        })
      }
    }, 1000);
  }

  addListnerOnTool(toolType: string, toolInstance: any, map: any) {
    this.activeInfoWindow = 'tool';
    this.activeTool = toolType;
    this.openInfoWindow();
    if (toolInstance) {
      this.toolThicknessNgModel = 2;
      this.toolFillColorNgModel = '#FFFFFF';
      this.toolOpacityNgModel = 1;
      if (toolInstance.strokeColor) {
        this.toolColor = (toolInstance as any).strokeColor;
      }
      if (toolInstance.strokeWeight) {
        this.toolThicknessNgModel = (toolInstance as any).strokeWeight;
      }
      if (toolInstance.fillColor) {
        this.toolFillColorNgModel = (toolInstance as any).fillColor;
      }
      if (toolInstance.fillOpacity) {
        this.toolOpacityNgModel = (toolInstance as any).fillOpacity;
      }
    }
    setTimeout(() => {
      let toolColorPicker = document.getElementById('toolColorPicker') as any;
      let toolThicknessInputId = document.getElementById('toolThicknessInputId') as HTMLInputElement;
      let toolThicknessSliderValue = document.getElementById('toolThicknessSliderValue');
      let toolFillColorPicker = document.getElementById('toolFillColorPicker') as any;
      let toolOpacitySliderValue = document.getElementById('toolOpacitySliderValue') as any;
      let toolOpacityInputId = document.getElementById('toolOpacityInputId') as HTMLInputElement;
      let toolDashed = document.getElementById('toolDashed') as any;
      let toolSolid = document.getElementById('toolSolid') as any;
      let removeElement = document.getElementById('removeElement') as HTMLElement;

      if (toolColorPicker) {
        toolColorPicker.addEventListener('input', () => {
          const newColor = toolColorPicker.value;
          toolInstance.setOptions({
            strokeColor: newColor
          });
          this.toolColor = toolColorPicker.value;
        });
      }

      if (toolFillColorPicker) {
        if (toolType != "driveway" || 'connectionWire' || 'polyline') {
          toolFillColorPicker.addEventListener('input', () => {
            const newFillColor = toolFillColorPicker.value;
            toolInstance.setOptions({
              fillColor: newFillColor,
              fillOpacity: 0.5
            });
            this.toolFillColorNgModel = toolFillColorPicker.value;
          });
        }
      }

      if (toolThicknessInputId && toolThicknessSliderValue) {
        toolThicknessInputId.addEventListener('input', () => {
          const newSize = Number(toolThicknessInputId.value);
          toolInstance.setOptions({
            strokeWeight: newSize, // Change the value to the desired thickness
          });
          if (toolThicknessSliderValue) {
            toolThicknessSliderValue.innerText = newSize.toString();
          }
        });
      }

      if (toolType != "driveway" || 'connectionWire' || 'polyline') {
        if (toolOpacityInputId && toolOpacitySliderValue) {
          toolOpacityInputId.addEventListener('input', () => {
            let newOpacity = Number(toolOpacityInputId.value);
            toolInstance.setOptions({
              fillOpacity: newOpacity
            });
            if (toolOpacitySliderValue) {
              toolOpacitySliderValue.innerText = newOpacity.toString();
            }
          });
        }
      }

      if (toolType === "connectionWire" || toolType === 'polyline' || toolType === 'propertyline') {
        if (toolDashed) {
          toolDashed.addEventListener('click', () => {
            if (toolType === 'propertyline') {
              let dashedPolyline;
              if (!toolInstance["dashed"]) {
                let path = toolInstance.getPath().getArray();
                path.push(path[0]);
                dashedPolyline = new google.maps.Polyline({
                  path: path,
                  strokeColor: toolInstance['strokeColor'],
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
                toolInstance.set("dashed", true);
                toolInstance.set("dashedPolyline", dashedPolyline);
                toolInstance.setVisible(false);
                dashedPolyline.addListener('click', () => {
                  dashedPolyline.setVisible(false);
                  toolInstance.setVisible(true);
                  toolInstance.set("dashed", false);
                })
              }
            }
            else{
                toolInstance.setOptions({
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
                toolInstance.setOptions({
                  lineType: "dashed"
                })
            }
          })
        }

        if (toolSolid) {
          toolSolid.addEventListener('click', () => {
              if(toolType === "propertyline"){
                if (toolInstance["dashed"]) {
                  toolInstance["dashedPolyline"].setVisible(false);
                  toolInstance.setVisible(true);
                  toolInstance.set("dashed", false);
                }
                else {
                  return;
                }
              }
              else{
                toolInstance.setOptions({
                  strokeOpacity: 1,
                  icons: [] // Remove the icons property to make it a solid line
                });
                toolInstance.setOptions({
                  lineType: "solid"
                })
              }
          })
        }

      }

      if (removeElement) {
        removeElement.addEventListener('click', () => {
          this.toolService.toolDataArray = this.toolService.toolDataArray.filter((item: any) => item?.id !== toolInstance?.id);
          toolInstance.setMap(null); // Remove the polygon from the map
          this.closeOpenedInfoWindow();
        });
      }
    }, 1000);
  }

  addListnerOnFence(polyline) {
    this.activeInfoWindow = 'fence';
    this.openInfoWindow();
    if (polyline) {
      this.toolThicknessNgModel = 3;
      if (polyline.strokeColor) {
        this.toolColor = polyline.strokeColor;
      }
      if (polyline.strokeWeight) {
        this.toolThicknessNgModel = polyline.strokeWeight;
      }
    }

    setTimeout(() => {
      let toolColorPicker = document.getElementById('toolColorPicker') as any;
      let toolThicknessInputId = document.getElementById('toolThicknessInputId') as HTMLInputElement;
      let toolThicknessSliderValue = document.getElementById('toolThicknessSliderValue');
      let removeElement = document.getElementById('removeElement') as HTMLElement;

      toolColorPicker.addEventListener('input', () => {
        this.toolColor = toolColorPicker.value;
      })

      if (toolColorPicker) {
        toolColorPicker.addEventListener('input', () => {
          const newColor = toolColorPicker.value;
          polyline.setOptions({
            strokeColor: newColor
          })
        });
      }

      if (toolThicknessInputId && toolThicknessSliderValue) {
        toolThicknessInputId.addEventListener('input', () => {
          const newSize = Number(toolThicknessInputId.value);
          polyline.setOptions({
            strokeWeight: newSize, // Change the value to the desired thickness
          });
          if (toolThicknessSliderValue) {
            toolThicknessSliderValue.innerText = newSize.toString();
          }
        });
      }

      removeElement.addEventListener('click', () => {
        if (polyline) {
          this.fenceService.fencingArray = this.fenceService.fencingArray.filter((item: any) => item['id'] !== polyline['id']);
          polyline.setMap(null);
          this.closeOpenedInfoWindow();
        }
      })
    }, 1000);
  }

  addListnerOnRoofSlope(marker: any) {
    this.activeInfoWindow = "roofSlope";
    let roofSlopeProperties = marker.getLabel();
    if (roofSlopeProperties.color) {
      this.fontColorNgModel = roofSlopeProperties.color;
    }
    this.fontSizeNgModel = roofSlopeProperties.fontSize;
    this.maxFontSize = 80;

    this.openInfoWindow();

    setTimeout(() => {
      const handleSliderChange = (args: any) => {
        const currentSliderValue = args.value;
        let currentLabelClass = document.getElementsByClassName(marker?.label?.className) as any;
        currentLabelClass[0].style.transform = `rotate(${currentSliderValue}deg)`;
        marker.set('rotation', currentSliderValue);
      };
      const sliderElement: any = $("#slider1");
      sliderElement.roundSlider({
        value: 0,
        min: 0,
        max: 360,
        radius: 70,
        drag: handleSliderChange,
        change: handleSliderChange,
      });

      const inputFontSize = document.getElementById('inputFontSize') as HTMLInputElement;
      const sliderValueSpan = document.getElementById('FontSliderValue');
      const colorPicker = document.getElementById('colorPicker') as HTMLInputElement;
      const removeElement = document.getElementById('removeElement') as HTMLInputElement;


      if (sliderValueSpan) {
        sliderValueSpan.innerText = inputFontSize.value;
      }

      // To change the font-size
      if (inputFontSize && sliderValueSpan) {
        inputFontSize.addEventListener('input', () => {
          const newSize = Number(inputFontSize.value);
          marker['label'].fontSize = `${newSize + 'px'}`; // Set your desired font size
          marker.setLabel(marker['label']);
          sliderValueSpan.innerText = newSize.toString();
        });
      }

      if (colorPicker) {
        colorPicker.addEventListener('input', () => {
          const newColor = colorPicker.value;
          marker['label'].color = newColor; // Set the label text color
          marker.setLabel(marker['label']);
        });
      }

      if (removeElement) {
        removeElement.addEventListener('click', () => {
          if (marker) {
            this.roofSlopeService.roofSlopeArray = this.roofSlopeService.roofSlopeArray.filter((item: any) => item['label'].className !== marker['label'].className);
            marker.setMap(null);
            this.closeOpenedInfoWindow();
          }
        })
      }
    }, 1000);
  }

  openInfoWindow() {
    if (this.showInfoWindow) {
      this.showInfoWindow = false;
      setTimeout(() => {
        this.showInfoWindow = true;
      }, 300);
    }
    else {
      this.showInfoWindow = true;
    }
  }

  closeOpenedInfoWindow() {
    this.showInfoWindow = false;
    this.cdRef.detectChanges();
  }

  ngOnDestroy() {
    this.fenceDataSubscription.unsubscribe();
    this.fenceService.fenceDataSubject.next(null);
    this.toolDataSubscription.unsubscribe();
    this.toolService.toolDataSubject.next(null);
    this.drawingDataSubscription.unsubscribe();
    this.drawingService.dataSubject.next(null);
    this.equipmentDataSubscription.unsubscribe();
    this.equipmentService.equipmentDataSubject.next(null);
    this.customTextDataSubscription.unsubscribe();
    this.customTextService.customTextDataSubject.next(null);
    this.roofSlopeDataSubscription.unsubscribe();
    this.roofSlopeService.roofSlopeDataSubject.next(null);
  }

}
