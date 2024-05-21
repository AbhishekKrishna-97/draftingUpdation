import { Component, OnInit, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { ToasterService } from 'src/app/services/notify.service';
@Component({
  selector: 'app-file-upload-panel',
  templateUrl: './file-upload-panel.component.html',
  styleUrls: ['./file-upload-panel.component.scss']
})
export class FileUploadPanelComponent implements OnInit {
  @Output() onSubmit: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef;
  selectedFileName: string;
  fileEvent: any;
  dragDrop = false;
  constructor(
    private toasterService: ToasterService
  ) { }
  ngOnInit(): void {
    const mapElement = document.getElementById("drag_drop");
    if (mapElement) {
      mapElement.addEventListener('dragover', (evt) => this.handleDragOver(evt), false);
      mapElement.addEventListener('drop', (evt) => this.handleFileSelect(evt), false);
    }
  }
  onFileSelect(event: any) {
    this.selectedFileName = '';
    this.fileEvent = event;
    const files = event.target.files;
    if (files && files.length > 0) {
      this.selectedFileName = files[0].name;
      this.toasterService.showSuccess("File Added Successfully !");
    } else {
      this.selectedFileName = '';
    }
  }
  onFileSubmit() {
    if(this.fileEvent){
      let filesData = {
        event:this.fileEvent,
        dragDrop:this.dragDrop
      }
      this.onSubmit.emit(filesData);
    }
    else{
      this.toasterService.showError("Kindly Add DXF File !")
    }
  }

  removeFile(): void {
    this.selectedFileName = '';
    this.fileEvent = null;
    const fileInput = document.getElementById('fileID') as HTMLInputElement;
    if (fileInput) {
        fileInput.value = '';
    }
    this.toasterService.showSuccess("File Removed Successfully");
}

handleDragOver(evt: any) {
  evt.stopPropagation();
  evt.preventDefault();
  evt.dataTransfer.dropEffect = 'copy';
}


handleFileSelect(evt: any) {
  evt.stopPropagation();
  evt.preventDefault();
  this.fileEvent = evt.dataTransfer.files;
  this.selectedFileName = '';
  if (this.fileEvent && this.fileEvent.length > 0) {
    this.selectedFileName = this.fileEvent[0].name;
    this.toasterService.showSuccess("File Added Successfully !");
    this.dragDrop = true;
  } else {
    this.selectedFileName = '';
  }
}
}









