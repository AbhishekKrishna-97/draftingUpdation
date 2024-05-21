import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CommonService } from './commonservice';


@Injectable({
  providedIn: 'root'
})
export class FenceService {

  constructor(
    private commonService: CommonService,
  ) { }

  fencingArray: any = [];
  public fenceDataSubject = new BehaviorSubject<any>(null);
  fenceData$ = this.fenceDataSubject.asObservable();

  drawFence(map: any, propertyline: any, fenceOffset?) {
    const fenceOffsetInMeters = this.commonService.feetToMeters(fenceOffset);
    const timestamp = new Date().getTime();
    let fencingLine: google.maps.Polyline;
    const linesArr = [];
    const propertylineArray = propertyline.getPath().getArray();

    for (let i = 0; i < propertylineArray.length - 1; i++) {
      const obj = {
        start: propertylineArray[i],
        end: propertylineArray[i + 1],
        fireSetBack: fenceOffsetInMeters
      }
      linesArr.push(obj);
    }
    const fencePoints = this.commonService.getInnerPolygonPoints(linesArr, propertyline);

    fencePoints.push(fencePoints[0]);
    for (let i = 0; i < fencePoints.length - 1; i++) {
      fencingLine = new google.maps.Polyline({
        path: [fencePoints[i], fencePoints[i + 1]],
        editable: true,
        strokeColor: '#069AF3',
        strokeWeight: 3,
        map: map
      });
      fencingLine.set('id', 'fence_' + timestamp + i);
      fencingLine.set('offset', fenceOffset);
      this.fencingArray.push(fencingLine);
      this.addListnerOnFence(fencingLine);
    }
  }

  reDrawFence(map) {
    if (this.fencingArray.length > 0) {
      this.fencingArray.forEach((polyline, index) => {
        const fencingLine = new google.maps.Polyline({
          path: polyline.getPath(),
          editable: true,
          strokeColor: polyline['strokeColor'],
          strokeWeight: polyline['strokeWeight'],
          map: map
        });
        fencingLine.set('id', polyline['id']);
        fencingLine.set('offset', polyline['offset']);
        this.fencingArray[index] = fencingLine;
        this.addListnerOnFence(fencingLine);
      })
    }
  }

  addListnerOnFence(polyline: google.maps.Polyline) {
    polyline.addListener('click', () => {
      this.fenceDataSubject.next({ polyline });
    })
  }

  getfenceData() {
    let fenceData = [];
    this.fencingArray.forEach((element) => {
      fenceData.push({
        path: element.getPath().getArray(),
        strokeColor: element.strokeColor,
        strokeWeight: element.strokeWeight,
        id: element.id,
      })
    })
    return fenceData;
  }
}
