import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { AdditionalDrawingsService } from 'src/app/services/additional-drawings.service';
import { CustomTextService } from 'src/app/services/custom-text.service';
import { EquipmentService } from 'src/app/services/equipment.service';
import { FenceService } from 'src/app/services/fence.service';
import { ToasterService } from 'src/app/services/notify.service';
import { ObjectService } from 'src/app/services/object.service';
import { RoofSlopeService } from 'src/app/services/roof-slope.service';
import { ToolsService } from 'src/app/services/tools.service';

@Component({
  selector: 'app-actionbar',
  templateUrl: './actionbar.component.html',
  styleUrls: ['./actionbar.component.scss']
})
export class ActionbarComponent implements OnInit, OnDestroy {

  selectedMenuToolsId: number = -1;
  selectedMenuEquipmentId: number = -1;
  toolsaction!: string;
  equipementaction!: string;
  sections = [
    { id: 1, title: 'UM', icon: `` },
    { id: 2, title: 'MSP', icon: `` },
    { id: 3, title: 'AC (Fused)', icon: `` },
    { id: 4, title: 'AC (Non-Fused)', icon: `` },
    { id: 5, title: 'DG', icon: `` },
    { id: 6, title: 'IQ', icon: `` },
  ];
  // activeTool: any;
  @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
  @Input() activeTool = 'hand';
  showRoofTool: boolean = false;

  @Output() actionTypeChange = new EventEmitter<any>();
  @Output() equipmentChange = new EventEmitter<any>();
  currentUrl: string = '';
  @Input() viewType: string = '';
  @Input() map: any;
  @Input() location: any;
  toolDataSubscription: Subscription;
  activeInfoWindow:any;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private equipmentService: EquipmentService,
    private drawingService: AdditionalDrawingsService,
    private customTextService: CustomTextService,
    private toolsService: ToolsService,
    private roofSlopeService: RoofSlopeService,
    private fenceService: FenceService,
    private toasterService: ToasterService,
    private objectService: ObjectService
  ) { }

  ngOnInit(): void {
    if (this.router.url === '/manual-drawing') {
      this.showRoofTool = true;
    }
    this.currentUrl = this.router.url;
    if (this.viewType === "Roof Plan") {
      this.sections = [
        { id: 7, title: 'JB', icon: `` },
      ];
    }
    this.toolDataSubscription = this.toolsService.toolData$.subscribe(data => {
      if (data) {
        this.activeTool = data.resetTool;
      }
    });
  }

  actionToggle($event: Event, action: string) {
    $event.stopPropagation();
    if (this.activeTool === action) {
      this.activeTool = 'hand'; // Reset active tool
      this.actionTypeChange.emit("reset"); // Emit false when clicking again on the same action
    } else {
      switch (action) {
        case "chimney":
          this.drawingService.drawChimney(this.map, this.map.getCenter(), this.viewType);
          this.activeTool = "hand"; // Set new active tool
          break;

        case "text":
          this.customTextService.addCustomText(this.map, this.map.getCenter(), this.viewType);
          this.activeTool = "hand"; // Set new active tool
          break;

        case "pool":
          this.toolsService.addPool(this.map);
          this.activeTool = "hand"; // Set new active tool
          break;

        case "roofSlope":
          this.roofSlopeService.addRoofSlope(this.map,this.map.getCenter());
          this.activeTool = "hand"; // Set new active tool
          break;

        case "driveway":
          this.toolsService.drawDriveway(this.map);
          this.activeTool = "hand"; // Set new active tool
          break;

        case "connectionWire":
          this.toolsService.drawConnectionWire(this.map, this.viewType);
          this.activeTool = "hand"; // Set new active tool
          break;

        case "rectangle":
          this.toolsService.drawRectangle(this.map);
          this.activeTool = action; // Set new active tool
          break;

        case "circle":
          this.toolsService.drawCircle(this.map);
          this.activeTool = action; // Set new active tool
          break;

        case "polyline":
          this.toolsService.drawPolyline(this.map);
          this.activeTool = action; // Set new active tool
          break;

        case "property-line":
          this.toolsService.drawPropertyLine(this.map);
          this.activeTool = action; // Set new active tool
          break;

        case "adjustmap":
          this.toolsService.adjustMap(this.map, 'rotate', 5);
          this.activeTool = "hand"; // Set new active tool
          break;

        case "hand":
          this.toolsService.enableSelect();
          this.activeTool = "hand"; // Set new active tool
          break;

        case 'tree':
          this.objectService.addTree(this.map,this.map.getCenter());
          break;

        case 'fence':
          let propertylineExist = this.toolsService.toolDataArray.filter((element) => element.toolType === 'propertyline');
          if (propertylineExist[0]) {
            if (this.fenceService.fencingArray.length > 0) {
              this.toasterService.showError('Fence Already Exits !');
            }
            else {
              this.activeInfoWindow = 'addfence';
            }
          }
          else {
            this.toasterService.showError('Kindly Draw Propertyline First !');
          }
          break;

        default:
          // Default action if action is not recognized
          break;
      }
      this.actionTypeChange.emit(action); // Emit the action
    }
  }

  closeMenu() {
    this.trigger.closeMenu();
  }

  addEquipment(equipment: any) {
    this.equipmentService.fetchAction(this.map, this.map.getCenter(), equipment, this.viewType);
  }

  addFence(fenceOffset: number) {
    let  propertylineExist = this.toolsService.toolDataArray.filter((element)=> element.toolType === 'propertyline');
    if (propertylineExist[0]) {
      if (fenceOffset > 0) {
        this.fenceService.drawFence(this.map, propertylineExist[0], fenceOffset);
        this.activeInfoWindow = null;
      }
      else {
        this.toasterService.showError('Kindly Enter Valid Fence Offset');
      }
    }
  }

  hideFenceModal(event) {
    this.activeInfoWindow = event;
  }

  ngOnDestroy() {
    this.toolDataSubscription.unsubscribe();
  }
}
