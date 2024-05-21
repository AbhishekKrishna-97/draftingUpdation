import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StringlayoutComponent } from '../stringlayout/stringlayout.component';
import { ToasterService } from 'src/app/services/notify.service';
import { ToolsService } from 'src/app/services/tools.service';
import { CommonService } from 'src/app/services/commonservice';


@Component({
  selector: 'app-draftingdetail',
  templateUrl: './draftingdetail.component.html',
  styleUrls: ['./draftingdetail.component.scss']
})
export class DraftingdetailComponent implements OnInit {

  constructor(
    private toasterService : ToasterService,
    private toolsService: ToolsService,
    private commonService: CommonService
  ) { }
  @ViewChild(StringlayoutComponent) stringlayout: StringlayoutComponent;

  tablist = [
    {name:'Site Plan', value: 'siteplan'},
    {name:'Roof Plan', value: 'roofplan'},
    {name:'String Layout', value: 'stringlayout'},
  ];
  selectedtabindex:number = 0;
  public router = inject(Router);
  public route = inject(ActivatedRoute);
  currentMap:any;

  ngOnInit(): void {
     this.onTabChange();
  }

  issiteplan :boolean = true;
  isroofplan :boolean = false;
  isstringlayout :boolean = false;
  istabshow : boolean = false;

  count:number =0;
  tabclicksecondTime :boolean = false;
  tabvalue : string = 'siteplan';
  showHomeBtn:boolean = false;
  stringLayoutAccordian:boolean = false;

  onTabChange(action?) {
    let propertylineExist = this.toolsService.toolDataArray.filter((element) => element.toolType === 'propertyline');
    if (action == 'next') {
      if(propertylineExist[0]){
        if (this.selectedtabindex < 2) {
          this.selectedtabindex = this.selectedtabindex + 1;
        }
      }
      else{
      this.toasterService.showError("Kindly Draw Propertyline First !");
      }
  
    }
    if (action == 'prev') {
      if (this.selectedtabindex > 0) {
        this.selectedtabindex = this.selectedtabindex - 1;
      }
    }
    this.isroofplan = false;
    this.issiteplan = false;
    this.isstringlayout = false;
    if (this.selectedtabindex == 0) {
      this.tabvalue = 'siteplan'
    }
    if (this.selectedtabindex == 1) {
      this.tabvalue = 'roofplan'
    }
    if (this.selectedtabindex == 2) {
      this.tabvalue = 'stringlayout'
    }
    switch (this.tabvalue) {
      case 'siteplan': {
        this.count += 1;
        if (this.count == 2) {
          this.tabclicksecondTime = true;
        }
        this.issiteplan = true;
        break;
      }
      case 'roofplan': {
        this.isroofplan = true;
        break;
      }
      case 'stringlayout': {
        this.isstringlayout = true;
        break;
      }
    }
  }

  manageTab(value){
      this.istabshow = value;
  }

  getDrfating(finalsubmit?){
    this.stringlayout.getFinalDrafting(finalsubmit);
  }

  switchTabs(tab: string): void {
    const mapData = JSON.parse(localStorage.getItem('mapData'));
    if (mapData?.plotOutline?.length > 0) {
      switch (tab) {
        case 'Site Plan':
          this.selectedtabindex = 0;
          this.tabclicksecondTime = true;
          this.issiteplan = true;
          this.isroofplan = false;
          this.isstringlayout = false;
          break;
        case 'Roof Plan':
          this.selectedtabindex = 1;
          this.isroofplan = true;
          this.issiteplan = false;
          this.isstringlayout = false;
          break;
        case 'String Layout':
          this.selectedtabindex = 2;
          this.isstringlayout = true;
          this.isroofplan = false;
          this.issiteplan = false;
          break;
        default:
          break;
      }
    } else {
      if(tab != 'Site Plan'){
        this.toasterService.showError("Kindly Draw Propertyline First !");
      }
    }
  }

  fetchCurrentMap(event:any){
    this.currentMap = event;
  }

  setMapCenter(){
    this.currentMap.setCenter({lat: this.commonService.location.latitude, lng: this.commonService.location.longitude});
    this.currentMap.setZoom(22);
  }

  showHome(event){
    this.showHomeBtn = event;
  }

  accordianStatus(event:any){
    this.stringLayoutAccordian = event;
  }
  

}
