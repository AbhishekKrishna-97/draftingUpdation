import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-loder',
  templateUrl: './loder.component.html',
  styleUrls: ['./loder.component.scss']
})
export class LoderComponent implements OnInit {

  constructor() { }

  @Input() isLoading = false;
   ngOnInit(): void {
   }

}
