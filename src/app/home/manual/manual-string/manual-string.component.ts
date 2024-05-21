import { Component, OnInit } from '@angular/core';
import { CommonService } from 'src/app/services/commonservice';

@Component({
  selector: 'app-manual-string',
  templateUrl: './manual-string.component.html',
  styleUrls: ['./manual-string.component.scss']
})
export class ManualStringComponent implements OnInit {

  map: google.maps.Map;

  constructor(
    private commonService: CommonService
  ) { }

  ngOnInit(): void {
    this.initializeMap();
  }

  initializeMap(): void {
    // Initialzing Map by passing map id
    this.map = this.commonService.initializeMap('mapString');
    // Re draw roof marking data
    this.commonService.reDrawRoofMarkingData(this.map);
  }

}
