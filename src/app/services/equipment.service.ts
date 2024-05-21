import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ToasterService } from './notify.service';

@Injectable({
  providedIn: 'root'
})
export class EquipmentService {

  public equipmentDataSubject = new BehaviorSubject<any>(null);
  equipmentData$ = this.equipmentDataSubject.asObservable();
  polylineFirstAcFused: any;
  polylineSecondFused: any;
  polylineThirdFused: any;
  polylineFourthFused: any;
  rectangleAcDisconnect: any;
  polylineFirstAcNonFused: any;
  polylineSecondNonFused: any;
  polylineThirdNonFused: any;
  polylineFourthNonFused: any;
  NonFusedAcDisconnectLinesArray: any = [];
  FusedAcDisconnectLinesArray: any = [];
  equipmentsArray: any = [];
  currentTab: string = "Site Plan";
  panelArray:any = [];
  eaveLinesArray = [];

  constructor(
    private toasterService:ToasterService
  ) { }

  fetchAction(map:any,location:any,event:any,currentTab:string) {
    this.currentTab = currentTab;
    const existingEquipment = this.equipmentsArray.find(data => data?.title == event);
    if (!existingEquipment || this.equipmentsArray.length == 0 || existingEquipment.title === "JB") {
        if (event) {
            switch (event) {
                case 'UM':
                case 'DG':
                    this.drawEquipmentWithCircle(map, location, event);
                    break;

                case 'MSP':
                case 'AC (Fused)':
                case 'AC (Non-Fused)':
                case 'JB':
                    this.drawEquipment(map, location, event);
                    break;

                case 'IQ':
                    this.drawEquipmentIQ(map, location);
                    break;
            }
        }
    } else {
        this.toasterService.showError("Equipment Already Exists");
    }
}

  drawEquipment(map: any, location: any, title: string, existingEquipment?: any, index?: number) {
    let polygonCoords;
    let equipmentTitle = title;
    const timestamp = new Date().getTime();
    let polygon: google.maps.Polygon;
    let labelMarker: google.maps.Marker | undefined; // Define label marker outside to make it accessible

    if(title === "JB"){
    polygonCoords = [ // Define polygon coordinates (example coordinates)
    { lat: location.lat() + 0.0000016, lng: location.lng() + 0.0000016 }, // Top-right
    { lat: location.lat() + 0.0000016, lng: location.lng() - 0.0000016 }, // Top-left
    { lat: location.lat() - 0.0000016, lng: location.lng() - 0.0000016 }, // Bottom-left
    { lat: location.lat() - 0.0000016, lng: location.lng() + 0.0000016 }  // Bottom-right
  ];
    }
    else{
      polygonCoords = [ // Define polygon coordinates (example coordinates)
      { lat: location.lat() + 0.000005, lng: location.lng() + 0.000005 },
      { lat: location.lat() + 0.000005, lng: location.lng() - 0.000005 },
      { lat: location.lat() - 0.000005, lng: location.lng() - 0.000005 },
      { lat: location.lat() - 0.000005, lng: location.lng() + 0.000005 }
    ];
    }

    if (title == "AC (Fused)" || title == "AC (Non-Fused)") {
      equipmentTitle = "AC";
    }

    polygon = new google.maps.Polygon({
      paths: existingEquipment?.paths || existingEquipment?.getPath().getArray() || polygonCoords,
      editable: false,
      draggable:(this.currentTab === "Site Plan" || title === "JB") ? true : false,
      map: map,
      fillColor: title === "JB" ? "#32CD32" : "#FFFFFF",
      strokeColor: "#70D454",
      strokeWeight: 1,
      fillOpacity: 1,
      zIndex:10
    });

    if(title !== "JB"){
    const center = this.calculatePolygonCenter(polygon.getPath().getArray()); // Add label marker to the center of the polygon

      labelMarker = new google.maps.Marker({
        position: center,
        draggable: false,
        icon: {
          url: "../../assets/transparent_img.png",
          scaledSize: new google.maps.Size(1, 1),
          anchor: new google.maps.Point(0.5, 0.5),
        },
        crossOnDrag: false,
        map: map,
        title: title,
        label: {
          text: title === "JB" ? " " : `${equipmentTitle}`,
          color: "#70D454",
          fontSize: existingEquipment?.equipmentText?.label?.fontSize || existingEquipment?.equipmentText?.fontSize ||  (title === "JB" ? "4px" : "9px"),
          className: existingEquipment?.equipmentText?.label?.className || existingEquipment?.equipmentText?.className || "equipmentLabel_" + timestamp,
        }
      });
    }

    title !== "JB" ? polygon.set('equipmentText', labelMarker) : null;
    polygon.set('title', title);
    existingEquipment ? polygon.set('id', existingEquipment.id) : polygon.set('id', 'equipment_' + timestamp);
    existingEquipment ? polygon.set('scaleSize', existingEquipment.scaleSize) : polygon.set('scaleSize', 1);
    existingEquipment ? polygon.set('rotation', existingEquipment.rotation) : polygon.set('rotation', 0);
    existingEquipment ? polygon.set('titleRotation', existingEquipment.titleRotation) : polygon.set('titleRotation', 0);
    this.addListnerToEquipment(polygon,labelMarker,polygonCoords,map);
    !existingEquipment ? this.equipmentsArray.push(polygon) : null;
    existingEquipment ? this.equipmentsArray[index] = polygon : null;

    if (title == "AC (Fused)") {
      this.drawAcDisconnectFused(map, polygon);
    }
    if (title == "AC (Non-Fused)") {
      this.drawAcDisconnectNoneFused(map, polygon);
    }

    if (existingEquipment) {
      if(polygon['equipmentText'] && (polygon['equipmentText']?.label?.className || polygon['equipmentText']?.className)){
        setTimeout(() => {
            let currentLabelClass = document.getElementsByClassName(polygon['equipmentText']?.label?.className || polygon['equipmentText']?.className) as any;
            currentLabelClass[0].style.transform = `rotate(${polygon["titleRotation"]}deg)`;
    
            const equipmentLabel = labelMarker.getLabel() as google.maps.MarkerLabel;
            if (equipmentLabel) {
              equipmentLabel.fontSize = `${polygon["scaleSize"] * 8 + 'px'}`; // Set your desired font size
              labelMarker.setLabel(equipmentLabel);
            }
        }, 1500);
      }
    }
  }

  drawEquipmentIQ(map: any, location: any, existingEquipment?: any, index?: number) {
    const timestamp = new Date().getTime();
    let labelMarker: google.maps.Marker | undefined; // Define label marker outside to make it accessible
    let polygonCoordsInner = [
      { lat: location.lat() + 0.000004, lng: location.lng() + 0.000003 },
      { lat: location.lat() + 0.000004, lng: location.lng() - 0.000003 },
      { lat: location.lat() - 0.000004, lng: location.lng() - 0.000003 },
      { lat: location.lat() - 0.000004, lng: location.lng() + 0.000003 }
    ];

    let polygonInnerIQ = new google.maps.Polygon({
      paths: existingEquipment?.paths || existingEquipment?.getPath().getArray() || polygonCoordsInner,
      editable: false,
      draggable: this.currentTab === "Site Plan" ? true : false,
      map: map,
      fillColor: "#FFFFFF",
      strokeColor: "#70D454",
      strokeWeight: 1,
      fillOpacity: 1,
      zIndex: 100
    });

    let innerPolygonCenter = this.calculatePolygonCenter(polygonInnerIQ.getPath().getArray());
    let polygonCoordsOuter = this.calOuterPolygonCoords(innerPolygonCenter);

    let polygonOuterIQ = new google.maps.Polygon({
      paths: existingEquipment?.outerPaths || existingEquipment?.polygonOuterIQ?.getPath().getArray() || polygonCoordsOuter,
      editable: false,
      draggable: false,
      map: map,
      fillColor: "#FFFFFF",
      strokeColor: "#70D454",
      strokeWeight: 1,
      fillOpacity: 1,
      zIndex: 99
    });
    // Add label marker to the center of the polygon
    const center = this.calculatePolygonCenter(polygonInnerIQ.getPath().getArray());

    labelMarker = new google.maps.Marker({
      position: center,
      draggable: false,
      icon: {
        url: "../../assets/transparent_img.png",
        scaledSize: new google.maps.Size(1, 1),
        anchor: new google.maps.Point(0.5, 0.5),
      },
      crossOnDrag: false,
      map: map,
      title: "IQ",
      label: {
        text: "IQ",
        color: "#70D454",
        fontSize: existingEquipment?.equipmentText?.label?.fontSize || existingEquipment?.equipmentText?.fontSize || "8px",
        className: existingEquipment?.equipmentText?.label?.className || existingEquipment?.equipmentText?.className || "equipmentLabel_" + timestamp,
      }
    });

    existingEquipment ? polygonInnerIQ.set('id', existingEquipment.id) : polygonInnerIQ.set('id', 'equipment_' + timestamp);
    polygonInnerIQ.set('equipmentText', labelMarker);
    polygonInnerIQ.set('title', "IQ");
    existingEquipment ? polygonInnerIQ.set('scaleSize', existingEquipment.scaleSize) : polygonInnerIQ.set('scaleSize', 1);
    existingEquipment ? polygonInnerIQ.set('rotation', existingEquipment.rotation) : polygonInnerIQ.set('rotation', 0);
    existingEquipment ? polygonInnerIQ.set('titleRotation', existingEquipment.titleRotation) : polygonInnerIQ.set('titleRotation', 0);
    polygonOuterIQ.set('title', "IQ");
    existingEquipment ? polygonOuterIQ.set('scaleSize', existingEquipment.scaleSize) : polygonInnerIQ.set('scaleSize', 1);
    existingEquipment ? polygonOuterIQ.set('rotation', existingEquipment.rotation) : polygonInnerIQ.set('rotation', 0);
    polygonInnerIQ.set('polygonOuterIQ', polygonOuterIQ);
    this.addListnerToEquipmentIQ(polygonInnerIQ,labelMarker,map);
    !existingEquipment ? this.equipmentsArray.push(polygonInnerIQ) : null;
    existingEquipment ? this.equipmentsArray[index] = polygonInnerIQ : null;

    if (existingEquipment) {
      if(polygonInnerIQ['equipmentText'] && (polygonInnerIQ['equipmentText']?.label?.className || polygonInnerIQ['equipmentText']?.className)){
        setTimeout(() => {
          let currentLabelClass = document.getElementsByClassName(polygonInnerIQ['equipmentText']?.label?.className || polygonInnerIQ['equipmentText']?.className) as any;
          currentLabelClass[0].style.transform = `rotate(${polygonInnerIQ["titleRotation"]}deg)`;
          const equipmentLabel = labelMarker.getLabel() as google.maps.MarkerLabel;
          if (equipmentLabel) {
            equipmentLabel.fontSize = `${polygonInnerIQ["scaleSize"] * 8 + 'px'}`; // Set your desired font size
            labelMarker.setLabel(equipmentLabel);
          }
        }, 1500);
      }
    }
  }

  drawEquipmentWithCircle(map: any, location: any, title, existingEquipment?: any, index?: number) {
    let labelMarker;
    const timestamp = new Date().getTime();

    const circle = new google.maps.Circle({
      fillColor: "#FFFFFF",
      strokeColor: "#70D454",
      strokeWeight: 1,
      fillOpacity: 1,
      map: map,
      draggable: this.currentTab === "Site Plan" ? true : false,
      editable: false,
      center: existingEquipment ? existingEquipment.circle.center : location,
      radius: existingEquipment ? existingEquipment.circle.radius : 0.5,
      zIndex: 100
    });
    const boundsCoords = this.getPolygonBoundsForEquipmentWithCircle(circle);

    const polygon = new google.maps.Polygon({
      paths: existingEquipment?.paths || existingEquipment?.getPath().getArray() || boundsCoords,
      fillColor: "#FFFFFF",
      strokeColor: "#70D454",
      strokeWeight: 1,
      fillOpacity: 1,
      map: map,
      zIndex: 99
    });

    const center = circle.getCenter();

    labelMarker = new google.maps.Marker({
      position: center,
      draggable: false,
      icon: {
        url: "../../assets/transparent_img.png",
        scaledSize: new google.maps.Size(1, 1),
        anchor: new google.maps.Point(0.5, 0.5),
      },
      crossOnDrag: false,
      map: map,
      title: title,
      label: {
        text: title,
        color: "#70D454",
        fontSize: existingEquipment?.equipmentText?.label?.fontSize || existingEquipment?.equipmentText?.fontSize ||  "8px",
        className: existingEquipment?.equipmentText?.label?.className || existingEquipment?.equipmentText?.className || "equipmentLabel_" + timestamp,
      }
    });
    
    polygon.set('equipmentText', labelMarker);
    existingEquipment ? polygon.set('id', existingEquipment.id) : polygon.set('id', 'equipment_' + timestamp);
    polygon.set('title', title);
    polygon.set('circle', circle);
    existingEquipment ? polygon.set('scaleSize', existingEquipment.scaleSize) : polygon.set('scaleSize', 1);
    existingEquipment ? polygon.set('rotation', existingEquipment.rotation) : polygon.set('rotation', 0);
    existingEquipment ? polygon.set('titleRotation', existingEquipment.titleRotation) : polygon.set('titleRotation', 0);
    !existingEquipment ? this.equipmentsArray.push(polygon) : null;
    existingEquipment ? this.equipmentsArray[index] = polygon : null;
    this.addListenerToEquipmentWithCircle(circle,polygon,labelMarker,map);

    if (existingEquipment) {
      if(polygon['equipmentText'] && (polygon['equipmentText']?.label?.className || polygon['equipmentText']?.className)){
        setTimeout(() => {
          let currentLabelClass = document.getElementsByClassName(polygon['equipmentText']?.label?.className || polygon['equipmentText']?.className) as any;
          currentLabelClass[0].style.transform = `rotate(${polygon["titleRotation"]}deg)`;
  
          const equipmentLabel = labelMarker.getLabel() as google.maps.MarkerLabel;
          if (equipmentLabel) {
            equipmentLabel.fontSize = `${polygon["scaleSize"] * 8 + 'px'}`; // Set your desired font size
            labelMarker.setLabel(equipmentLabel);
          }
        }, 1500);
      }
    }
  }

  addListnerToEquipment(polygon:google.maps.Polygon,labelMarker:google.maps.Marker,polygonCoords:any,map:any) {
    
    if(polygon['title'] !== "JB"){
      polygon.addListener('click', () => {
        this.equipmentDataSubject.next({polygon:polygon,labelMarker:labelMarker,polygonCoords:polygonCoords});
      })
    }

    if(polygon['title'] !== "JB"){
      polygon.addListener('drag', () => {
        if (labelMarker) {
          const newCenter = this.calculatePolygonCenter(polygon.getPath().getArray());
          labelMarker.setPosition(newCenter);
        }
        if (labelMarker['title'] == "AC (Fused)") {
          this.updateAcDisconnectFused(polygon, polygon["scaleSize"]);
        }
        if (labelMarker['title'] == "AC (Non-Fused)") {
          this.updateAcDisconnectNonFused(polygon, polygon["scaleSize"]);
        }
      })
    }

    if(polygon['title'] === "JB"){
      polygon.addListener('dblclick', () => {
        this.equipmentsArray = this.equipmentsArray.filter((item: any) => item?.id !== polygon['id']);
        polygon.setMap(null);
      })
    }

    polygon.addListener('dragend', () => {
      if (polygon['title'] === "JB") {
        // Get the new position of the dragged polygon
        var newPosition = polygon.getPath().getArray();
        
        // Iterate over each panel in the panelArray
        for (var i = 0; i < this.panelArray.length; i++) {
            var panel = this.panelArray[i];
            // Check if the new position of the polygon intersects with the panel's path
            if (this.isPolygonInsidePanel(newPosition, panel.getPath().getArray())) {
                // The polygon is inside this panel
                
                // Find the nearest point
                var nearestPoint = null;
                var minDistance = Infinity;
                var panelVertices = panel.getPath().getArray();
                var nearestPointIndex = null; // Variable to hold the index of the nearest point
                for (var j = 0; j < panelVertices.length; j++) {
                    var panelVertex = panelVertices[j];
                    for (var k = 0; k < newPosition.length; k++) {
                        var distance = google.maps.geometry.spherical.computeDistanceBetween(panelVertex, newPosition[k]);
                        if (distance < minDistance) {
                            minDistance = distance;
                            nearestPoint = panelVertex;
                            nearestPointIndex = j; // Update the index of the nearest point
                        }
                    }
                }
                // Output nearest point in the desired format
                var nearestPointLatLng = { lat: nearestPoint.lat(), lng: nearestPoint.lng() };
                
                // Calculate indices of previous and next points, handling array wrap-around
                var prevIndex = (nearestPointIndex - 1 + panelVertices.length) % panelVertices.length;
                var nextIndex = (nearestPointIndex + 1) % panelVertices.length;
                
                // Output previous and next points along with their indices
                var prevPointLatLng = { lat: panelVertices[prevIndex].lat(), lng: panelVertices[prevIndex].lng() };
                var nextPointLatLng = { lat: panelVertices[nextIndex].lat(), lng: panelVertices[nextIndex].lng() };

                let angleOfPreviousPoint = google.maps.geometry.spherical.computeHeading(panelVertices[nearestPointIndex], panelVertices[prevIndex]);
                let angleOfNextPoint = google.maps.geometry.spherical.computeHeading(panelVertices[nearestPointIndex], panelVertices[nextIndex]);

                const firstPoint = google.maps.geometry.spherical.computeOffset(panelVertices[nearestPointIndex], 0.3, angleOfPreviousPoint);
                const secondPoint = google.maps.geometry.spherical.computeOffset(panelVertices[nearestPointIndex], 0.3, angleOfNextPoint)
                const thirdPoint = google.maps.geometry.spherical.computeOffset(firstPoint, 0.3, angleOfNextPoint);

                polygon.setPath([panelVertices[nearestPointIndex],firstPoint,thirdPoint,secondPoint]);
            }
        }
    }

    else{
    this.alignEquipment(polygon,labelMarker);

// Get the path of the polygon
// let polygonPath = polygon.getPath().getArray();

// // Loop through each line in eaveLinesArray
// for (let i = 0; i < this.eaveLinesArray.length; i++) {
//     let line = this.eaveLinesArray[i];

//     // Construct line coordinates
//     let lineCoordinates = [
//         { lat: line.start.lat, lng: line.start.lng },
//         { lat: line.end.lat, lng: line.end.lng }
//     ];

//     // Construct Polyline object for the line segment
//     let linePath = new google.maps.Polyline({
//         path: lineCoordinates
//     });

//     // Check if any vertex of the polygon intersects with the line segment
//     for (let j = 0; j < polygonPath.length; j++) {
//         if (google.maps.geometry.poly.isLocationOnEdge(polygonPath[j], linePath, 1e-6)) {
//             console.log("Polygon is touching line: " + line.id);

//             // Calculate the angle of the line
//             let angle = Math.atan2(line.end.lat - line.start.lat, line.end.lng - line.start.lng) * (180 / Math.PI);

//             // Ensure angle is positive
//             if (angle < 0) {
//                 angle += 360;
//             }

//             console.log("Angle of the line: " + angle);

//             // Do something with the touched line
//             return; // If you want to stop after finding the first intersection
//         }
//     }
// }

      polygonCoords.length = 0; // Clear the array
      polygon.getPath().getArray().forEach(coord => {
        polygonCoords.push({ lat: coord.lat(), lng: coord.lng() });
      });

      if (labelMarker['title'] == "AC (Fused)") {
        this.updateAcDisconnectFused(polygon, polygon["scaleSize"]);
      }

      if (labelMarker['title'] == "AC (Non-Fused)") {
        this.updateAcDisconnectNonFused(polygon, polygon["scaleSize"]);
      }
    }
    })

    this.hideShowEquipments(map);
  }


  isPolygonInsidePanel(polygonCoords, panelCoords) {
    var poly = new google.maps.Polygon({ paths: polygonCoords });
    var panelPoly = new google.maps.Polygon({ paths: panelCoords });
    // Check if any of the points of the polygon are inside the panel
    for (var i = 0; i < polygonCoords.length; i++) {
        if (google.maps.geometry.poly.containsLocation(polygonCoords[i], panelPoly)) {
            return true;
        }
    }
    return false;
}

  addListenerToEquipmentWithCircle(circle:google.maps.Circle,polygon:google.maps.Polygon,labelMarker:google.maps.Marker,map:any) {
    circle.addListener('click', () => {
      this.equipmentDataSubject.next({circle:circle,polygon:polygon,labelMarker:labelMarker});
    })

    circle.addListener('drag', () => {
      let boundsCoords = this.getPolygonBoundsForEquipmentWithCircle(circle);
      polygon.setPaths(boundsCoords);
      labelMarker.setPosition(circle.getCenter());
      this.updatePolygon(polygon, labelMarker, polygon['rotation'], polygon['scaleSize'] , "none");
    })

    circle.addListener('dragend', () => {
      this.alignEquipment(polygon,labelMarker);
    })

    circle.addListener('radius_changed', () => {
      let boundsCoords = this.getPolygonBoundsForEquipmentWithCircle(circle);
      polygon.setPaths(boundsCoords);
      labelMarker.setPosition(circle.getCenter());
    })

    this.hideShowEquipments(map);
  }

  addListnerToEquipmentIQ(polygon:google.maps.Polygon,labelMarker:any,map:any) {
    polygon.addListener('click', () => {
      this.equipmentDataSubject.next({ polygon:polygon,labelMarker:labelMarker});
    })

    google.maps.event.addListener(polygon, "drag", (event) => { // Update label marker position when polygon is dragged
      if (labelMarker) {
        const newCenter = this.calculatePolygonCenter(polygon.getPath().getArray());
        labelMarker.setPosition(newCenter);
      }
      let innerPolygonCenter = this.calculatePolygonCenter(polygon.getPath().getArray());
      let polygonCoordsOuter = this.calOuterPolygonCoords(innerPolygonCenter);
      polygon['polygonOuterIQ'].setPath(polygonCoordsOuter);
      this.updatePolygon(polygon['polygonOuterIQ'], labelMarker, polygon['polygonOuterIQ']['rotation'], polygon['polygonOuterIQ']['scaleSize'], "outer");
    });

    google.maps.event.addListener(polygon, "dragend", (event) => {  
      this.alignEquipment(polygon,labelMarker);
      let innerPolygonCenter = this.calculatePolygonCenter(polygon.getPath().getArray());
      let polygonCoordsOuter = this.calOuterPolygonCoords(innerPolygonCenter);
      polygon['polygonOuterIQ'].setPath(polygonCoordsOuter);
      this.updatePolygon(polygon['polygonOuterIQ'], labelMarker, polygon['polygonOuterIQ']['rotation'], polygon['polygonOuterIQ']['scaleSize'], "outer");
    });

    this.hideShowEquipments(map);
  }

  updatePolygon(polygon: google.maps.Polygon, labelMarker: google.maps.Marker, currentSliderValue: number, inputEquipmentImgSize: any, polygonType?: string,eaveLineAngle?:boolean) {

    if(eaveLineAngle){
      
    // console.log(polygon,labelMarker,currentSliderValue,inputEquipmentImgSize,polygonType,eaveLineAngle);
    console.log("polygon", polygon);
    console.log("labelMarker" ,labelMarker);
    console.log("currentSliderValue" ,currentSliderValue);
    console.log("inputEquipmentImgSize", inputEquipmentImgSize);
    console.log("polygonType" ,polygonType);
    console.log("eaveLineAngle" ,eaveLineAngle);

    
    }

    if (!inputEquipmentImgSize || !labelMarker) return;
    let polygonCoords;
    let equipmentPolygonCenter = this.calculatePolygonCenter(polygon.getPath().getArray());

    if (polygonType == "inner") {
      polygonCoords = [
        { lat: equipmentPolygonCenter.lat() + 0.0000045, lng: equipmentPolygonCenter.lng() + 0.000003 },
        { lat: equipmentPolygonCenter.lat() + 0.0000045, lng: equipmentPolygonCenter.lng() - 0.000003 },
        { lat: equipmentPolygonCenter.lat() - 0.0000045, lng: equipmentPolygonCenter.lng() - 0.000003 },
        { lat: equipmentPolygonCenter.lat() - 0.0000045, lng: equipmentPolygonCenter.lng() + 0.000003 }
      ];
    }
    else if(polygon["title"] === "JB") {
      polygonCoords = [ // Define polygon coordinates (example coordinates)
      { lat: equipmentPolygonCenter.lat() + 0.0000012, lng: equipmentPolygonCenter.lng() + 0.0000018 },
      { lat: equipmentPolygonCenter.lat() + 0.0000012, lng: equipmentPolygonCenter.lng() - 0.0000018 },
      { lat: equipmentPolygonCenter.lat() - 0.0000012, lng: equipmentPolygonCenter.lng() - 0.0000018 },
      { lat: equipmentPolygonCenter.lat() - 0.0000012, lng: equipmentPolygonCenter.lng() + 0.0000018 }
    ];
    }
    else{
      polygonCoords = [
        { lat: equipmentPolygonCenter.lat() + 0.000005, lng: equipmentPolygonCenter.lng() + 0.000005 },
        { lat: equipmentPolygonCenter.lat() + 0.000005, lng: equipmentPolygonCenter.lng() - 0.000005 },
        { lat: equipmentPolygonCenter.lat() - 0.000005, lng: equipmentPolygonCenter.lng() - 0.000005 },
        { lat: equipmentPolygonCenter.lat() - 0.000005, lng: equipmentPolygonCenter.lng() + 0.000005 }
      ];
    }

    const labelPos = labelMarker.getPosition();
    const scaleValue = parseFloat(inputEquipmentImgSize);
    const rotationValue = currentSliderValue;

    if (isNaN(scaleValue) || isNaN(rotationValue) || !labelPos) return;

    const angle = Math.abs(eaveLineAngle && polygonType === "outer" ? rotationValue - 360 : eaveLineAngle === null ? rotationValue - 360 : rotationValue) * Math.PI / 180;
    
    const newCoords = polygonCoords.map(coord => {
      const deltaX = coord.lng - equipmentPolygonCenter.lng();
      const deltaY = coord.lat - equipmentPolygonCenter.lat();
      // Apply scaling
      const scaledX = equipmentPolygonCenter.lng() + deltaX * scaleValue;
      const scaledY = equipmentPolygonCenter.lat() + deltaY * scaleValue;
      // Apply rotation
      const rotatedX = labelPos.lng() + (scaledX - labelPos.lng()) * Math.cos(angle) - (scaledY - labelPos.lat()) * Math.sin(angle);
      const rotatedY = labelPos.lat() + (scaledX - labelPos.lng()) * Math.sin(angle) + (scaledY - labelPos.lat()) * Math.cos(angle);
      return { lat: rotatedY, lng: rotatedX };
    });

    polygon.setPaths(newCoords);

    if (labelMarker) {
      let currentLabelClass = document.getElementsByClassName(labelMarker['label'].className) as any;
      currentLabelClass[0].style.transform = `rotate(${360-rotationValue}deg)`;
      polygon.set('rotation', rotationValue);
      polygon.set('scaleSize', scaleValue);
      polygon.set('titleRotation', 360-rotationValue);
      const equipmentLabel = labelMarker.getLabel() as google.maps.MarkerLabel;

      if (equipmentLabel) {
        equipmentLabel.fontSize = `${scaleValue * 8}px`; // Set your desired font size
        if( polygon["title"] === "JB"){
          equipmentLabel.fontSize = `${scaleValue * 4}px`; // Set your desired font size
        }
        labelMarker.setLabel(equipmentLabel);
      }
    }

    if (labelMarker['title'] == "AC (Fused)") {
      this.updateAcDisconnectFused(polygon, scaleValue);
    }

    if (labelMarker['title'] == "AC (Non-Fused)") {
      this.updateAcDisconnectNonFused(polygon, scaleValue);
    }
  }

  calculatePolygonCenter(coords: google.maps.LatLng[]): google.maps.LatLng {
    let latSum = 0;
    let lngSum = 0;
    for (const coord of coords) {
      latSum += coord.lat();
      lngSum += coord.lng();
    }
    const latAvg = latSum / coords.length;
    const lngAvg = lngSum / coords.length;
    return new google.maps.LatLng(latAvg, lngAvg);
  }

  getPolygonBoundsForEquipmentWithCircle(circle) {
    let circleBounds = circle.getBounds();
    let boundsCoords = [
      { lat: circleBounds.getNorthEast().lat(), lng: circleBounds.getNorthEast().lng() },
      { lat: circleBounds.getNorthEast().lat(), lng: circleBounds.getSouthWest().lng() },
      { lat: circleBounds.getSouthWest().lat(), lng: circleBounds.getSouthWest().lng() },
      { lat: circleBounds.getSouthWest().lat(), lng: circleBounds.getNorthEast().lng() }
    ];
    return boundsCoords
  }

  calOuterPolygonCoords(innerPolygonCenter) {
    const offset = 0.000005; // Offset for the outer polygon, adjust as needed
    let polygonCoordsOuter = [
      { lat: innerPolygonCenter.lat() + offset, lng: innerPolygonCenter.lng() + offset },
      { lat: innerPolygonCenter.lat() + offset, lng: innerPolygonCenter.lng() - offset },
      { lat: innerPolygonCenter.lat() - offset, lng: innerPolygonCenter.lng() - offset },
      { lat: innerPolygonCenter.lat() - offset, lng: innerPolygonCenter.lng() + offset }
    ];
    return polygonCoordsOuter
  }

  drawAcDisconnectFused(map, polygon) {
    const firstPolylinePoints = this.getPointsForFirstPolylineSet(polygon, "firstPoint");
    this.polylineFirstAcFused = new google.maps.Polyline({
      path: firstPolylinePoints,
      geodesic: true,
      strokeColor: '#70D454',
      strokeOpacity: 1.0,
      strokeWeight: 1,
      editable: false,
      draggable: false,
      zIndex:11
    });
    this.polylineFirstAcFused.setMap(map);

    const secondPolylinePoints = this.getPointsForFirstPolylineSet(polygon, "secondPoint");
    this.polylineSecondFused = new google.maps.Polyline({
      path: [firstPolylinePoints[1], secondPolylinePoints[1]],
      geodesic: true,
      strokeColor: '#70D454',
      strokeOpacity: 1.0,
      strokeWeight: 1,
      editable: false,
      draggable: false,
      zIndex:11
    });
    this.polylineSecondFused.setMap(map);

    const thirdPolylinePoints = this.getPointsForSecondPolylineSet(polygon, "firstPoint");
    this.polylineThirdFused = new google.maps.Polyline({
      path: thirdPolylinePoints,
      geodesic: true,
      strokeColor: '#70D454',
      strokeOpacity: 1.0,
      strokeWeight: 1,
      editable: false,
      draggable: false,
      zIndex:11
    });
    this.polylineThirdFused.setMap(map);

    const fourthPolylinePoints = this.getPointsForSecondPolylineSet(polygon, "secondPoint");
    this.polylineFourthFused = new google.maps.Polyline({
      path: fourthPolylinePoints,
      geodesic: true,
      strokeColor: '#70D454',
      strokeOpacity: 1.0,
      strokeWeight: 1,
      editable: false,
      draggable: false,
      zIndex:11
    });
    this.polylineFourthFused.setMap(map);

    let rectanglePoints = this.getPointForRectangle(polygon);
    const delta = { width: 0.0000020, height: 0.0000006 }; // Example delta values
    this.drawRectangle(map, rectanglePoints, delta);

    this.FusedAcDisconnectLinesArray.push(this.polylineFirstAcFused);
    this.FusedAcDisconnectLinesArray.push(this.polylineSecondFused);
    this.FusedAcDisconnectLinesArray.push(this.polylineThirdFused);
    this.FusedAcDisconnectLinesArray.push(this.polylineFourthFused);
  }

  drawAcDisconnectNoneFused(map, polygon) {
    const firstPolylinePoints = this.getPointsForFirstPolylineSet(polygon, "firstPoint");
    this.polylineFirstAcNonFused = new google.maps.Polyline({
      path: firstPolylinePoints,
      geodesic: true,
      strokeColor: '#70D454',
      strokeOpacity: 1.0,
      strokeWeight: 1,
      editable: false,
      draggable: false,
      map: map,
      zIndex:11
    });

    const secondPolylinePoints = this.getPointsForFirstPolylineSet(polygon, "secondPoint");
    this.polylineSecondNonFused = new google.maps.Polyline({
      path: [firstPolylinePoints[1], secondPolylinePoints[1]],
      geodesic: true,
      strokeColor: '#70D454',
      strokeOpacity: 1.0,
      strokeWeight: 1,
      editable: false,
      draggable: false,
      map: map,
      zIndex:11
    });

    const thirdPolylinePoints = this.getPointsForSecondPolylineSet(polygon, "firstPoint");
    const fourthPolylinePoints = this.getPointsForSecondPolylineSet(polygon, "secondPoint");

    this.polylineThirdNonFused = new google.maps.Polyline({
      path: [thirdPolylinePoints[0], fourthPolylinePoints[1]],
      geodesic: true,
      strokeColor: '#70D454',
      strokeOpacity: 1.0,
      strokeWeight: 1,
      editable: false,
      draggable: false,
      map: map,
      zIndex:11
    });

    this.NonFusedAcDisconnectLinesArray.push(this.polylineFirstAcNonFused);
    this.NonFusedAcDisconnectLinesArray.push(this.polylineSecondNonFused);
    this.NonFusedAcDisconnectLinesArray.push(this.polylineThirdNonFused);
  }

  updateAcDisconnectFused(polygon, scaleValue?) {
    //updating the path of polylineFirstAcFused
    const firstPolylinePoints = this.getPointsForFirstPolylineSet(polygon, "firstPoint");
    this.polylineFirstAcFused.setPath(firstPolylinePoints);

    //updating the path of polylineSecondFused
    const secondPolylinePoints = this.getPointsForFirstPolylineSet(polygon, "secondPoint");
    this.polylineSecondFused.setPath([firstPolylinePoints[1], secondPolylinePoints[1]]);

    //updating the path of polylineThirdFused
    const thirdPolylinePoints = this.getPointsForSecondPolylineSet(polygon, "firstPoint");
    this.polylineThirdFused.setPath(thirdPolylinePoints);

    //updating the path of polylineFourthFused
    const fourthPolylinePoints = this.getPointsForSecondPolylineSet(polygon, "secondPoint");
    this.polylineFourthFused.setPath(fourthPolylinePoints);

    //updating the position of the rectangle
    const data = this.getPointForRectangle(polygon);
    const firstPoint = google.maps.geometry.spherical.computeOffset(data.newCoordinates, data.vlLength / 2, data.verticalAngle);
    const secondPoint = google.maps.geometry.spherical.computeOffset(data.newCoordinates, data.vlLength / 2, data.verticalAngle - 180);
    const thirdPoint = google.maps.geometry.spherical.computeOffset(secondPoint, data.hzLength * 2, data.horizontalAngle);
    const fourthPoint = google.maps.geometry.spherical.computeOffset(firstPoint, data.hzLength * 2, data.horizontalAngle);

    this.rectangleAcDisconnect.setPaths([firstPoint, secondPoint, thirdPoint, fourthPoint]);
  }

  updateAcDisconnectNonFused(polygon, scaleValue?) {
    //updating the path of polylineFirst
    const firstPolylinePoints = this.getPointsForFirstPolylineSet(polygon, "firstPoint");
    this.polylineFirstAcNonFused.setPath(firstPolylinePoints);

    //updating the path of polylineSecond
    const secondPolylinePoints = this.getPointsForFirstPolylineSet(polygon, "secondPoint");
    this.polylineSecondNonFused.setPath([firstPolylinePoints[1], secondPolylinePoints[1]]);

    //updating the path of polylineThird
    const thirdPolylinePoints = this.getPointsForSecondPolylineSet(polygon, "firstPoint");
    const fourthPolylinePoints = this.getPointsForSecondPolylineSet(polygon, "secondPoint");
    this.polylineThirdNonFused.setPath([thirdPolylinePoints[0], fourthPolylinePoints[1]]);
  }

  getPointsForFirstPolylineSet(polygon, type) {
    const path = polygon.getPath().getArray();
    // Calculate vertical and horizontal distance
    const verticalAngle = this.calculateAngle(path[2].lat(), path[2].lng(), path[1].lat(), path[1].lng());
    const horizontalAngle = this.calculateAngle(path[2].lat(), path[2].lng(), path[3].lat(), path[3].lng());
    // calculate Distance
    const hzLength = google.maps.geometry.spherical.computeLength([path[2], path[3]]);
    const vlLength = google.maps.geometry.spherical.computeLength([path[2], path[1]]);
    // calculate distance to move
    let moveVl = vlLength / 5;
    let moveHz = hzLength / 5;
    if (type === 'secondPoint') {
      moveVl = moveVl * 2;
      moveHz = moveHz * 2;
    }
    // Calculet new coordinates
    const firstPoint = google.maps.geometry.spherical.computeOffset(path[2], moveVl, verticalAngle);
    const secondPoint = google.maps.geometry.spherical.computeOffset(firstPoint, moveHz, horizontalAngle);
    // Return updated coordinates
    return [firstPoint, secondPoint];
  }

  getBottomLeftCorner(polygon) {
    const vertices = polygon.getPath().getArray();
    let bottomLeft = { lat: Infinity, lng: Infinity };

    vertices.forEach((vertex) => {
      const lat = vertex.lat();
      const lng = vertex.lng();

      // Update bottomLeft if the current vertex is bottom-left
      if (lat < bottomLeft.lat || (lat === bottomLeft.lat && lng < bottomLeft.lng)) {
        bottomLeft = { lat, lng };
      }
    });
    return bottomLeft;
  }

  getPointsForSecondPolylineSet(polygon, type: string) {
    const path = polygon.getPath().getArray();
    // Calculate vertical and horizontal distance
    const verticalAngle = this.calculateAngle(path[3].lat(), path[3].lng(), path[0].lat(), path[0].lng());
    const horizontalAngle = this.calculateAngle(path[3].lat(), path[3].lng(), path[2].lat(), path[2].lng());
    // calculate Distance
    const hzLength = google.maps.geometry.spherical.computeLength([path[2], path[3]]);
    const vlLength = google.maps.geometry.spherical.computeLength([path[2], path[1]]);
    // calculate distance to move
    let moveVl = vlLength / 5;
    let moveHz = hzLength / 5;
    if (type === 'secondPoint') {
      moveHz = moveHz * 2;
    }
    // Calculet new coordinates
    let firstPoint = google.maps.geometry.spherical.computeOffset(path[3], moveVl, verticalAngle);
    const secondPoint = google.maps.geometry.spherical.computeOffset(firstPoint, moveHz, horizontalAngle);
    if (type === 'secondPoint') {
      firstPoint = google.maps.geometry.spherical.computeOffset(secondPoint, hzLength / 5, horizontalAngle);
    }
    // Return updated coordinates
    return [firstPoint, secondPoint];
  }

  getPointForRectangle(polygon) {
    const path = polygon.getPath().getArray();
    // Calculate vertical and horizontal distance
    const verticalAngle = this.calculateAngle(path[2].lat(), path[2].lng(), path[1].lat(), path[1].lng());
    const horizontalAngle = this.calculateAngle(path[2].lat(), path[2].lng(), path[3].lat(), path[3].lng());
    // calculate Distance
    const hzLength = google.maps.geometry.spherical.computeLength([path[2], path[3]]);
    const vlLength = google.maps.geometry.spherical.computeLength([path[2], path[1]]);
    // calculate distance to move
    let moveVl = vlLength / 5;
    let moveHz = hzLength / 5;
    // Calculet new coordinates
    const firstPoint = google.maps.geometry.spherical.computeOffset(path[2], moveVl, verticalAngle);
    const secondPoint = google.maps.geometry.spherical.computeOffset(firstPoint, moveHz * 2.5, horizontalAngle);
    // Return updated coordinates
    return { newCoordinates: secondPoint, verticalAngle, horizontalAngle, hzLength: hzLength / 5, vlLength: vlLength / 5 };
  }

  drawRectangle(map, data, delta) {
    const firstPoint = google.maps.geometry.spherical.computeOffset(data.newCoordinates, data.vlLength / 2, data.verticalAngle);
    const secondPoint = google.maps.geometry.spherical.computeOffset(data.newCoordinates, data.vlLength / 2, data.verticalAngle - 180);
    const thirdPoint = google.maps.geometry.spherical.computeOffset(secondPoint, data.hzLength * 2, data.horizontalAngle);
    const fourthPoint = google.maps.geometry.spherical.computeOffset(firstPoint, data.hzLength * 2, data.horizontalAngle);

    this.rectangleAcDisconnect = new google.maps.Polygon({
      paths: [firstPoint, secondPoint, thirdPoint, fourthPoint],
      editable: false,
      draggable: false,
      map: map,
      strokeColor: "#70D454",
      strokeWeight: 1,
      fillOpacity: 0,
      zIndex:11
    });

    return this.rectangleAcDisconnect;
  }

  calculateAngle(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const radianLat1 = this.degreesToRadians(lat1);
    const radianLat2 = this.degreesToRadians(lat2);
    const radianDiffLng = this.degreesToRadians(lon2 - lon1);

    const y = Math.sin(radianDiffLng) * Math.cos(radianLat2);
    const x = Math.cos(radianLat1) * Math.sin(radianLat2) -
      Math.sin(radianLat1) * Math.cos(radianLat2) * Math.cos(radianDiffLng);

    const angleRad = Math.atan2(y, x);
    const angleDeg = this.radiansToDegrees(angleRad);

    return (angleDeg + 360) % 360; // Convert to positive angle in degrees
  }

  degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  radiansToDegrees(radians: number): number {
    return radians * (180 / Math.PI);
  }

  hideShowEquipments(map:any) {
    google.maps.event.addListener(map, 'zoom_changed', () => {
      const currentZoom = map.getZoom();
      if (currentZoom >= 21.5) {
        this.equipmentsArray.forEach((data) => {
          data.setOptions({
            fillOpacity: 1,
            strokeOpacity: 1
          })
          setTimeout(() => {
            if(data.equipmentText && data.equipmentText["label"]["className"]){
              let equipmentClassName = document.getElementsByClassName(data.equipmentText.label.className) as any;
              if (equipmentClassName[0]) {
                equipmentClassName[0].style.display = "block";
              }
            }
          }, 300);
          if (data.title == "UM" || data.title == "DG") {
            data.circle.setOptions({
              fillOpacity: 1,
              strokeOpacity: 1
            })
          }
          if (data.title == "IQ") {
            data['polygonOuterIQ'].setOptions({
              fillOpacity: 1,
              strokeOpacity: 1
            })
          }
        })
        this.showHideAcDisconnectLines(1);
        if (this.rectangleAcDisconnect) {
          this.rectangleAcDisconnect.setOptions({
            strokeColor: "#70D454",
            strokeWeight: 1,
            fillOpacity: 0,
            strokeOpacity: 1
          })
        }
      } else {
        this.equipmentsArray.forEach((data) => {
          data.setOptions({
            fillOpacity: 0,
            strokeOpacity: 0
          })
          setTimeout(() => {
            if(data.equipmentText && data.equipmentText["label"]["className"]){
              let equipmentClassName = document.getElementsByClassName(data.equipmentText.label.className) as any;
              if (equipmentClassName[0]) {
                equipmentClassName[0].style.display = "none";
              }
            }
          }, 300);
          if (data.title == "UM" || data.title == "DG") {
            data.circle.setOptions({
              fillOpacity: 0,
              strokeOpacity: 0
            })
          }
          if (data.title == "IQ") {
            data['polygonOuterIQ'].setOptions({
              fillOpacity: 0,
              strokeOpacity: 0
            })
          }
        })
        this.showHideAcDisconnectLines(0);
        if (this.rectangleAcDisconnect) {
          this.rectangleAcDisconnect.setOptions({
            fillOpacity: 0,
            strokeOpacity: 0,
            strokeWeight: 0
          })
        }
      }
    });
  }

  showHideAcDisconnectLines(value) {
    if (this.FusedAcDisconnectLinesArray.length > 0) {
      this.FusedAcDisconnectLinesArray.forEach((polyline) => {
        polyline.setOptions({
          strokeWeight: value,
          strokeOpacity: value
        })
      })
    }
    if (this.NonFusedAcDisconnectLinesArray.length > 0) {
      this.NonFusedAcDisconnectLinesArray.forEach((polyline) => {
        polyline.setOptions({
          strokeWeight: value,
          strokeOpacity: value
        })
      })
    }
  }

  reDrawEquipments(map: any, location: any, currentTab: string) {
    this.currentTab = currentTab;
    this.equipmentsArray.forEach((element, index) => {
      if (element.title === "MSP" || element.title === "AC (Fused)" || element.title === "AC (Non-Fused)" || element.title === "JB") {
        if(element.title === "JB" && this.currentTab === "Site Plan"){
          return;
        }
        else{
          this.drawEquipment(map, location, element.title, element, index);
        }
      }
      else if (element.title === "UM" || element.title === "DG") {
        this.drawEquipmentWithCircle(map, location, element.title, element, index);
      }
      else if (element.title === "IQ") {
        this.drawEquipmentIQ(map, location, element, index);
      }
    });
  }

  getEquipmentsData() {
    let equipmentsDataArray = [];
    this.equipmentsArray.forEach(data => {
    let linesData;

      if (data.title == "AC (Fused)") {
        linesData = { firstpolylinePath: [], secondpolylinePath: [], thirdpolylinePath: [], fourthpolylinePath: [], polygonPath: [] };
        linesData.firstpolylinePath = this.polylineFirstAcFused.getPath().getArray();
        linesData.secondpolylinePath = this.polylineSecondFused.getPath().getArray();
        linesData.thirdpolylinePath = this.polylineThirdFused.getPath().getArray();
        linesData.fourthpolylinePath = this.polylineFourthFused.getPath().getArray();
        linesData.polygonPath = this.rectangleAcDisconnect.getPath().getArray();
      }

      if (data.title == "AC (Non-Fused)") {
        linesData = { firstpolylinePath: [], secondpolylinePath: [], thirdpolylinePath: [] };
        linesData.firstpolylinePath = this.polylineFirstAcNonFused.getPath().getArray();
        linesData.secondpolylinePath = this.polylineSecondNonFused.getPath().getArray();
        linesData.thirdpolylinePath = this.polylineThirdNonFused.getPath().getArray();
      }

      const path = data.getPath().getArray();
      equipmentsDataArray.push({
        paths: path,
        id: data.id,
        title: data.title,
        rotation: data.rotation,
        titleRotation: data.titleRotation,
        scaleSize: data.scaleSize,
        equipmentText: data.title !== "JB" ? data.equipmentText.label : null
      });

      const fusedAcDisconnectEquipment = equipmentsDataArray.find(equipment => equipment.title === "AC (Fused)" && data.title === "AC (Fused)");
      const NonfusedAcDisconnectEquipment = equipmentsDataArray.find(equipment => equipment.title === "AC (Non-Fused)" && data.title === "AC (Non-Fused)");
      const equipmentUM = equipmentsDataArray.find(equipment => equipment.title === "UM" && data.title === "UM");
      const equipmentDG = equipmentsDataArray.find(equipment => equipment.title === "DG" && data.title === "DG");
      const equipmentIQ = equipmentsDataArray.find(equipment => equipment.title === "IQ" && data.title === "IQ");
      
      if (fusedAcDisconnectEquipment) {
        fusedAcDisconnectEquipment.linesData = linesData;
      }
      if (NonfusedAcDisconnectEquipment) {
        NonfusedAcDisconnectEquipment.linesData = linesData;
      }
      if (equipmentUM) {
        equipmentUM.circle = {
          radius: data.circle.radius,
          center: data.circle.center
        }
      }
      if (equipmentDG) {
        equipmentDG.circle = {
          radius: data.circle.radius,
          center: data.circle.center
        }
      }
      if (equipmentIQ) {
        const path = data.polygonOuterIQ.getPath().getArray();
        equipmentIQ.outerPaths = path;
      }
    });
    return equipmentsDataArray;
  }

  alignEquipment(polygon, labelMarker) {
    // Get the path of the polygon
    let polygonPath = polygon.getPath().getArray();

    // Loop through each line in eaveLinesArray
    for (let i = 0; i < this.eaveLinesArray.length; i++) {
      let line = this.eaveLinesArray[i];

      // Construct line coordinates
      let lineCoordinates = [
        { lat: line.start.lat, lng: line.start.lng },
        { lat: line.end.lat, lng: line.end.lng }
      ];

      // Construct Polyline object for the line segment
      let linePath = new google.maps.Polyline({
        path: lineCoordinates
      });

      // Check if any vertex of the polygon intersects with the line segment
      for (let j = 0; j < polygonPath.length; j++) {
        if (google.maps.geometry.poly.isLocationOnEdge(polygonPath[j], linePath, 1e-5)) {
          // Calculate the angle of the line
          let angle = Math.atan2(line.end.lat - line.start.lat, line.end.lng - line.start.lng) * (180 / Math.PI);

          // Ensure angle is positive
          if (angle < 0) {
            angle += 360;
          }

          console.log("Polygon is touching line: " + line.id);
          console.log("Angle of the line: " + angle + " degrees");
          let angleEq = Math.round(angle);

          if(angleEq){
            this.updatePolygon(polygon, labelMarker, angleEq, polygon['scaleSize'], polygon['polygonOuterIQ'] ? "inner" : "none", true);
            if (polygon['polygonOuterIQ']) {
              this.updatePolygon(polygon['polygonOuterIQ'], labelMarker, angleEq, polygon['polygonOuterIQ']['scaleSize'], "outer", true);
            }
            // Do something with the touched line
            return; // If you want to stop after finding the first intersection
          }
        }
      }
    }
  }

}
