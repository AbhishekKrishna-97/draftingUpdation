import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-custom-module',
  templateUrl: './custom-module.component.html',
  styleUrls: ['./custom-module.component.scss']
})
export class CustomModuleComponent implements OnInit {

  addModuleForm: FormGroup;
  formData: any;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CustomModuleComponent>,
    private toastr: ToastrService,
  ) {
    this.formData = data;
  }

  ngOnInit(): void {
    this.initializeAddModuleForm(this.formData);
  }

  initializeAddModuleForm(formData?): void {
    this.addModuleForm = this.fb.group({
      moduleHeight: [formData?.moduleHeight, [Validators.required, Validators.pattern('^-?[0-9]\\d*(\\.\\d{1,3})?$')]],
      moduleWidth: [formData?.moduleWidth, [Validators.required, Validators.pattern('^-?[0-9]\\d*(\\.\\d{1,3})?$')]],
      distanceBwModule: [formData?.distanceBwModule, [Validators.required, Validators.pattern('^-?[0-9]\\d*(\\.\\d{1,3})?$')]],
      type: ['automatic', [Validators.required]],
      orientationType: ['', [Validators.required]]
    });
  }

  typeChange(event){
    this.addModuleForm.patchValue({
      orientationType: ''
    });
  }

  closeDialog(){
    this.dialogRef.close({
      status: false
    });
  }

  submitForm(){
    if(this.addModuleForm.invalid){
      this.toastr.error('Form has error!');
      return;
    }
    const formValues = this.addModuleForm.value;
    this.dialogRef.close({
      status: true,
      data: {...this.formData, ...formValues}
    });
  }

}
