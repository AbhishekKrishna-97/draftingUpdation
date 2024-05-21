import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-module-detail',
  templateUrl: './module-detail.component.html',
  styleUrls: ['./module-detail.component.scss']
})
export class ModuleDetailComponent implements OnInit {

  moduleDetailForm: FormGroup;
  formData: any;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private dialogRef: MatDialogRef<ModuleDetailComponent>
  ) {
    this.formData = data;
  }

  ngOnInit(): void {
    this.initializeModuleDetailForm(this.formData);
  }

  initializeModuleDetailForm(formData?: any): void {
    this.moduleDetailForm = this.fb.group({
      eaveSetBack: [formData?.eaveSetBack, [Validators.required, Validators.pattern('^-?[0-9]\\d*(\\.\\d{1,3})?$')]],
      ridgeSetBack: [formData?.ridgeSetBack, [Validators.required, Validators.pattern('^-?[0-9]\\d*(\\.\\d{1,3})?$')]],
      otherSetBack: [formData?.otherSetBack, [Validators.required, Validators.pattern('^-?[0-9]\\d*(\\.\\d{1,3})?$')]],
      rakeSetBack: [formData?.rakeSetBack, [Validators.required, Validators.pattern('^-?[0-9]\\d*(\\.\\d{1,3})?$')]],
      obstacleSetBack: [formData?.obstacleSetBack, [Validators.required, Validators.pattern('^-?[0-9]\\d*(\\.\\d{1,3})?$')]],
    });
  }

  submitForm(){
    if(this.moduleDetailForm.invalid){
      this.toastr.error('Form has error!');
      return;
    }
    const formValues = this.moduleDetailForm.value;
    this.dialogRef.close({
      status: true,
      data: {...this.formData, ...formValues}
    });
  }

  closeDialog(){
    this.dialogRef.close({
      status: false
    });
  }
}
