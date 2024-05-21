import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, of, switchMap, throwError } from 'rxjs';
import { BaseUrl } from '../helper/constant';

@Injectable({
    providedIn: 'root',
})
export class PlanSetService {
  permitdata
    constructor(private http: HttpClient) {
      this.permitdata  = JSON.parse(localStorage.getItem("permitdata"))
     }

    getDesignDetails(id: any) {
        return this.http
          .get(BaseUrl + "permits/detail/" + id, {
            // headers: new HttpHeaders({
            //     "Content-Type": "application/json",
            //     Authorization:
            //       "Bearer " + JSON.parse(localStorage.getItem("currentUser")).jwt,
            //   }),
            observe: "response",
          })
          .pipe(
            switchMap((value) => {
              const designs= value.body;
              return of(designs);
            }),
            catchError((err: HttpErrorResponse) => {
              return throwError(err.error.message)
            })
          );
      }

     getJsonFromEV(recordid){
     
      return this.http
          .get(BaseUrl + "commonsetting/evorderdownload?reportid=" + recordid+"&permitid="+this.permitdata.id, {
            // headers: new HttpHeaders({
            //     "Content-Type": "application/json",
            //     Authorization:
            //       "Bearer " + JSON.parse(localStorage.getItem("currentUser")).jwt,
            //   }),
            observe: "response",
          })
          .pipe(
            switchMap((value) => {
              const designs= value.body;
              return of(designs);
            }),
            catchError((err: HttpErrorResponse) => {
              return throwError(err.error.message)
            })
          );

     } 

     getroofDrawingdata(){
      return this.http
          .get(BaseUrl + "draftingdatas?filters[recordid][$eq]="+this.permitdata.id, {
            // headers: new HttpHeaders({
            //     "Content-Type": "application/json",
            //     Authorization:
            //       "Bearer " + JSON.parse(localStorage.getItem("currentUser")).jwt,
            //   }),
            observe: "response",
          })
          .pipe(
            switchMap((value) => {
              const designs= value.body;
              return of(designs);
            }),
            catchError((err: HttpErrorResponse) => {
              return throwError(err.error.message)
            })
          );
     }

     getFinalDrafting(postData:any){
      return this.http
          .post(BaseUrl + "draftings/drawpdf", postData,{
            // headers: new HttpHeaders({
            //     "Content-Type": "application/json",
            //     Authorization:
            //       "Bearer " + JSON.parse(localStorage.getItem("currentUser")).jwt,
            //   }),
            observe: "response",
          })
          .pipe(
            switchMap((value) => {
              const designs= value.body;
              return of(designs);
            }),
            catchError((err: HttpErrorResponse) => {
              return throwError(err.error.message)
            })
          );
     }
     downloadPermitDesign() {
      return this.http
        .get(BaseUrl + "permitpdfs/generate/" +this.permitdata.id +"?pdftype=full", {
          headers: new HttpHeaders({
            "Content-Type": "application/json",
            Authorization:
              "Bearer " + localStorage.getItem("accessToken"),
          }),
          observe: "response",
        })
        .pipe(
          switchMap((value) => {
            const designs= value.body;
            return of(designs);
          }),
          catchError((err: HttpErrorResponse) => {
            return throwError(err.error.message)
          })
        );
    }

    preserveDraftingData(payload:any){
      return this.http.put(BaseUrl + "draftingdata/draftingdataupdate", payload,{
            // headers: new HttpHeaders({
            //     "Content-Type": "application/json",
            //     Authorization:
            //       "Bearer " + JSON.parse(localStorage.getItem("currentUser")).jwt,
            //   }),
            observe: "response",
          })
     }
     
     fetchDraftingData(permitId:any){
      return this.http.get(BaseUrl + `draftingdatas?filters[recordid][$eq]=${permitId}`,{
            // headers: new HttpHeaders({
            //     "Content-Type": "application/json",
            //     Authorization:
            //       "Bearer " + JSON.parse(localStorage.getItem("currentUser")).jwt,
            //   }),
            observe: "response",
          }).pipe(
            switchMap((value) => {
              const designs= value.body;
              return of(designs);
            }),
            catchError((err: HttpErrorResponse) => {
              return throwError(err.error.message)
            })
          );
     }

}