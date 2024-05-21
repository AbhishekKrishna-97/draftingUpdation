import { Component, OnInit } from '@angular/core';
import { CommonService } from 'src/app/services/commonservice';

@Component({
  selector: 'app-manual-roof',
  templateUrl: './manual-roof.component.html',
  styleUrls: ['./manual-roof.component.scss']
})
export class ManualRoofComponent implements OnInit {

  map: google.maps.Map;

  constructor(
    private commonService: CommonService
  ) { }

  ngOnInit(): void {
    this.initializeMap();
  }

  initializeMap(): void {
    // Initialzing Map by passing map id
    this.map = this.commonService.initializeMap('mapRoof');
    // Re draw roof marking data
    this.commonService.reDrawRoofMarkingData(this.map);
  }

}
