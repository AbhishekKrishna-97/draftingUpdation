import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RoofSlopeService {

  roofSlopeArray: google.maps.Marker[] = [];
  public roofSlopeDataSubject = new BehaviorSubject<any>(null);
  roofSlopeData$ = this.roofSlopeDataSubject.asObservable();

  constructor() { }

  addRoofSlope(map: any, location: any, roofSlopeElement?: google.maps.Marker, index?) {
    const timestamp = new Date().getTime();
    const className = "roofSlope_" + timestamp;
    const roofSlope = "➤";
    const marker = new google.maps.Marker({
      position: roofSlopeElement ? roofSlopeElement.getPosition() : location,
      map: map,
      draggable: true,
      label: {
        text: roofSlopeElement ? roofSlopeElement['label'].text : `${roofSlope}`,
        className: roofSlopeElement ? roofSlopeElement['label'].className : className,
        fontSize: roofSlopeElement ? roofSlopeElement['label'].fontSize : '40px',
        color: roofSlopeElement ? roofSlopeElement['label'].color : 'black'
      },
      icon: {
        url: "../../assets/transparent_img.png",
        scaledSize: new google.maps.Size(100,100),
        anchor: new google.maps.Point(50,50)
      },
      crossOnDrag: true,
    });
    roofSlopeElement ? marker.set('rotation', roofSlopeElement['rotation']) : marker.set('rotation', 0);
    this.addListnerRoofSlope(marker);
    !roofSlopeElement ? this.roofSlopeArray.push(marker) : null;
    roofSlopeElement ? this.roofSlopeArray[index] = marker : null;
    if (roofSlopeElement) {
      setTimeout(() => {
        const currentLabelClass = document.getElementsByClassName(marker['label'].className) as any;
        currentLabelClass[0].style.transform = `rotate(${marker['rotation']}deg)`;
      }, 1000);
    }
  }

  addListnerRoofSlope(marker: google.maps.Marker) {
    marker.addListener('click', () => {
      this.roofSlopeDataSubject.next({marker});
    })
  }

  reDrawRoofSlope(map: any, location: any, tab?: string) {
    this.roofSlopeArray.forEach((element, index) => {
      this.addRoofSlope(map, location, element, index);
    })
  }

  getRoofSlopeData(){
    let roofSlopeData = [];
    this.roofSlopeArray.forEach((element)=>{
      roofSlopeData.push({
        icons: element["icon"],
        label: element["label"],
        position: element["position"],
        rotation: element["rotation"]
        })
      })
      return roofSlopeData;
    }
}

