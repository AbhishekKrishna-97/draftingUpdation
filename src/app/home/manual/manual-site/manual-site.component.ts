import { Component, OnInit, ViewChild } from '@angular/core';
import { RoofMarkingComponent } from '../roof-marking/roof-marking.component';
import { CommonService } from 'src/app/services/commonservice';

@Component({
  selector: 'app-manual-site',
  templateUrl: './manual-site.component.html',
  styleUrls: ['./manual-site.component.scss']
})
export class ManualSiteComponent implements OnInit {

  currentSelectedLocation: google.maps.LatLng;
  map: google.maps.Map;

  constructor(
    private commonService: CommonService
  ) { }

  ngOnInit(): void {
    this.initializeMap();
  }

  initializeMap(): void {
    // Initialzing Map by passing map id
    this.map = this.commonService.initializeMap('mapSite');
    // Re draw roof marking data
    this.commonService.reDrawRoofMarkingData(this.map);
  }

}
