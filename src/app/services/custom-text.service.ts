import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CustomTextService {

  customTextArray: google.maps.Marker[] = [];
  public customTextDataSubject = new BehaviorSubject<any>(null);
  customTextData$ = this.customTextDataSubject.asObservable();

  constructor() { }

  addCustomText(map: any, location: any, tab?: string, customTextElement?: google.maps.Marker,index?) {
    const timestamp = new Date().getTime();
    const className = "customText_" + timestamp;
    const customText = "Click to change text";
    const marker = new google.maps.Marker({
      position: customTextElement ? customTextElement.getPosition() : location,
      map: map,
      draggable: true,
      label: {
        text: customTextElement ? customTextElement['label'].text : `${customText}`,
        className: customTextElement ? customTextElement['label'].className : className,
        fontSize: customTextElement ? customTextElement['label'].fontSize : '14px',
        color: customTextElement ? customTextElement['label'].color : 'black'
      },
      icon: {
        url: "../../assets/transparent_img.png",
        scaledSize: new google.maps.Size(50, 50),
        anchor: new google.maps.Point(25,25)
      },
      crossOnDrag: true,
    });
    customTextElement ? marker.set('rotation', customTextElement['rotation']) : marker.set('rotation', 0);
    customTextElement ? marker.set('rotationThroughMap', customTextElement['rotationThroughMap']) : marker.set('rotationThroughMap', 0);
    customTextElement ? marker.set('currentMapAngle', customTextElement['currentMapAngle']) : marker.set('currentMapAngle', 0);
    customTextElement ? marker.set('tabName', customTextElement['tabName']) : marker.set('tabName', tab);
    this.addListnerOnCustomText(marker);
    !customTextElement ? this.customTextArray.push(marker) : null;
    customTextElement ? this.customTextArray[index] = marker : null;
    if(customTextElement){
      setTimeout(() => {
        const currentLabelClass = document.getElementsByClassName(marker['label'].className) as any;
        currentLabelClass[0].style.transform = `rotate(${marker['rotation']}deg)`;
      }, 1000);
    }
  }

  addListnerOnCustomText(marker: google.maps.Marker) {
    marker.addListener('click', () => {
      this.customTextDataSubject.next({marker});
    })
  }

  reDrawCustomText(map: any, location: any, tab?: string) {
    this.customTextArray.forEach((element,index) => {
      if(element['tabName'] === tab){
        this.addCustomText(map,location,tab,element,index);
      }
    })
  }

  getCustomTextData() {
    let customData = {
      sitePlanText: [],
      roofPlanText: [],
      stringLayoutText: []
    };
    this.customTextArray.forEach((element) => {
      let data = {
        icons: element["icon"],
        label: element["label"],
        position: element["position"],
        rotation: element["rotation"]
      }
      if (element['tabName'] === "Site Plan") {
        customData.sitePlanText.push(data);
      }
      else if (element['tabName'] === "Roof Plan") {
        customData.roofPlanText.push(data);
      }
      else {
        customData.stringLayoutText.push(data);
      }
  })
  return customData;
}

setRotation(value:number){
  // this.customTextArray.forEach((marker)=>{
  //   let rotation = marker["rotation"];
  //   let rotationThroughMap = marker["rotationThroughMap"];
  //   let currentMapAngle = marker["currentMapAngle"];
  //   let currentLabelClass = document.getElementsByClassName(marker?.['label']?.className) as any;
  //   if(rotation > 0){
  //     // let myvalue  = (currentMapAngle - value);
  //     // let newValue = myvalue + rotation;
  //     // debugger;
  //     // if(newValue < 0){
  //     // debugger;
  //     //   currentLabelClass[0].style.transform = `rotate(${ newValue }deg)`;
  //     // }
  //     // else{
  //     // debugger;
  //     //   currentLabelClass[0].style.transform = `rotate(${ (newValue) + 360 }deg)`;
  //     // }
  //     // debugger;
  //     // marker.set('rotation', rotation);
  //     //   currentLabelClass[0].style.transform = `rotate(${ 360-value + rotation + 30}deg)`;

  //     currentLabelClass[0].style.transform = `rotate(${ rotation - (value - currentMapAngle) }deg)`;
  //     marker.set('rotation', rotation - (value - currentMapAngle));
  //   }
  //   else{
  //   currentLabelClass[0].style.transform = `rotate(${ 360 - value }deg)`;
  //   marker.set('rotationThroughMap', 360 - value);
  //   }
  //   marker.set('currentMapAngle', value);

  //   console.log("rotation", rotation);
  //   console.log("value", value);
    
  // })
}

}

