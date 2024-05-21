import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { CommonService } from 'src/app/services/commonservice';
import { PlanSetService } from 'src/app/services/plansetservice';
import { StringlayoutComponent } from '../../roofmapping/stringlayout/stringlayout.component';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit {

  constructor(
    private toastr: ToastrService,
    private plansetService: PlanSetService,
    private jsonService: CommonService,
    private commonService: CommonService
  ) { }
  @ViewChild(StringlayoutComponent) stringlayout: StringlayoutComponent;
  tablist = [
    { name: 'Site Plan', value: 'siteplan', link: 'site-plan' },
    { name: 'Roof Plan', value: 'roofplan', link: 'site-plan' },
    { name: 'String Layout', value: 'stringlayout', link: 'site-plan' },
  ];
  selectedtabindex: number = 0;
  public router = inject(Router);
  public route = inject(ActivatedRoute);
  isloading: boolean = false;

  ngOnInit(): void {
    this.isloading = true;
    setTimeout(() => {
      this.isloading = false;
    }, this.commonService.defaultTimeOut);
  }

  issiteplan: boolean = false;
  isroofplan: boolean = false;
  isstringlayout: boolean = false;
  istabshow: boolean = false;

  count: number = 0;
  tabclicksecondTime: boolean = false;
  tabvalue: string = 'siteplan';
  disableBtn: boolean = false;

  onTabChange(action?) {
    this.isloading = true;
    let roofJSON = localStorage.getItem('roofsJSON');
    if (action == 'next' && this.selectedtabindex < 2) {
      // let roofJSON = localStorage.getItem('roofsJSON');
      // if (!roofJSON) {
      //   this.toastr.error('No JSON found~');
      //   return;
      // } else {
      //   roofJSON = JSON.parse(roofJSON);
      //   if (!roofJSON['propertyLine']) {
      //     this.toastr.error('Property Line not found, please mark property line');
      //     return;
      //   }
      // }
    setTimeout(() => {
      this.selectedtabindex++;
      this.isloading = false;
    }, this.commonService.defaultTimeOut);
    }
    if (action == 'prev') {
      
      setTimeout(() => {
        this.selectedtabindex--;
        this.isloading = false;
      }, this.commonService.defaultTimeOut);
    }
    this.disableBtn = true;
    setTimeout(() => {
      this.disableBtn = false;
    }, this.commonService.defaultTimeOut);
    this.jsonService.setCurrentTab(this.selectedtabindex);
  }

  submitJSON(action?) {
    let roofJSON = localStorage.getItem('roofsJSON');
    if (!roofJSON) {
      this.toastr.error('No JSON found~');
      // return;
    } else {
      roofJSON = JSON.parse(roofJSON);
      if (!roofJSON['propertyLine']) {
        this.toastr.error('Property Line not found, please mark property line');
        // return;
      } else {
        this.toastr.info('Sending submit request');
        roofJSON = this.createFinalJSON(roofJSON);
        let postData = {
          data: {
            siteplan: roofJSON,
            roofplan: {},
            stringlayout: { modules: JSON.parse(localStorage.getItem('stringLayoutArr')), ...JSON.parse(localStorage.getItem('stringLayoutRotation')) },
            recordid: 5938
          }
        };
        console.log('postdata', JSON.stringify(postData));
        this.plansetService.getFinalDrafting(postData).subscribe({
          next: (res: any) => {
            this.toastr.success('Submitted Successfully.');
            console.log(res)
            const a = document.createElement('a');
            a.href = res.data;
            a.target = '_blank';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          },
          error: (err) => {
            this.toastr.error('Something went wrong');
          }
        })
      }
    }
  }

  createFinalJSON(roofJSON) {
    const localStorageData = JSON.parse(localStorage.getItem('mapData'));
    if (localStorageData) {
      roofJSON['customText'] = localStorageData.customText;
      roofJSON['trees'] = localStorageData.trees;
      roofJSON['equipments'] = localStorageData.equipments;
    }
    return roofJSON;
  }             

}
