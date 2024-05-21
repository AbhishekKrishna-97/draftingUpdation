import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-add-fence',
  templateUrl: './add-fence.component.html',
  styleUrls: ['./add-fence.component.scss']
})
export class AddFenceComponent implements OnInit {

  fenceValue:number = 0;
  @Output() fenceOffset: EventEmitter<any> = new EventEmitter<any>();
  @Output() hideFenceModal: EventEmitter<any> = new EventEmitter<any>();

  constructor() { }

  ngOnInit(): void {
  }

  addFence(){
   this.fenceOffset.emit(this.fenceValue);
  }

  hideFenceDialog(){
    this.hideFenceModal.emit(null);
  }

}
