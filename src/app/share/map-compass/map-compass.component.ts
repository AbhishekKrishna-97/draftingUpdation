import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-map-compass',
  templateUrl: './map-compass.component.html',
  styleUrls: ['./map-compass.component.scss']
})
export class MapCompassComponent implements OnInit {

  accumulatedAmount: number = 0;
  @Input() map: any;

  constructor() { }

  ngOnInit(): void {
  }

  rotateMap = (amount: number) => {
    this.accumulatedAmount += amount;
    this.map.setHeading(this.map.getHeading()! + amount);
    if (this.accumulatedAmount > 360) {
      this.accumulatedAmount = 0;
    }
  }
}
