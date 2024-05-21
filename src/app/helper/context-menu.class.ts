export class CustomMenu extends google.maps.OverlayView {
    private divListener_?: google.maps.MapsEventListener;
    private menuElement_: HTMLElement;
  
    constructor(contextMenuId) {
      super();
      this.menuElement_ = document.getElementById(contextMenuId)!;
    }
  
    override onAdd() {
      const map = this.getMap() as google.maps.Map;
  
      if (!this.menuElement_) {
        console.error("Menu element is not initialized.");
        return;
      }
  
      const floatPane = this.getPanes()?.floatPane;
  
      if (!floatPane) {
        console.error("Float pane is not available.");
        return;
      }
  
      floatPane.appendChild(this.menuElement_);
  
      // Store a reference to the CustomMenu instance for use inside the event listener
      const self = this;
  
      // mousedown anywhere on the map except on the menu div will close the menu.
      this.divListener_ = google.maps.event.addDomListener(
        map.getDiv(),
        "mousedown",
        (e: Event) => {
          // Check if the event target is not a descendant of the menu element
          if (!self.menuElement_.contains(e.target as Node)) {
            // Close the menu
            this.close();
          }
        },
        false
      );
    }
  
    override onRemove() {
      if (this.menuElement_) {
        if (this.menuElement_.parentNode) {
          (this.menuElement_.parentNode as HTMLElement).removeChild(this.menuElement_);
        }
        google.maps.event.removeListener(this.divListener_);
      }
      // Clean up other resources if necessary
      this.set("position", null);
    }
  
    close() {
      this.setMap(null);
    }
  
    override draw() {
      const position = this.get("position");
      const projection = this.getProjection();
  
      if (!position || !projection) {
        return;
      }
  
      const point = projection.fromLatLngToDivPixel(position)!;
  
      this.menuElement_.style.top = point.y + "px";
      this.menuElement_.style.left = point.x + "px";
      this.menuElement_.style.display = "block";
    }
  
    /**
     * Opens the menu at a given position on the map.
     */
    open(map: google.maps.Map, position: google.maps.LatLng) {
      this.set("position", position);
      this.setMap(map);
      this.draw();
    }
  
    showMenu() {
      this.menuElement_.style.display = "block";
    }
  
    hideMenu() {
      this.menuElement_.style.display = "none";
    }
  }
  
  export class CustomOrientationMenu extends google.maps.OverlayView {
    private divListener_?: google.maps.MapsEventListener;
    private menuElement_: HTMLElement;
  
    constructor() {
      super();
      this.menuElement_ = document.getElementById("contextMenu")!;
    }
  
    override onAdd() {
      const map = this.getMap() as google.maps.Map;
  
      if (!this.menuElement_) {
        console.error("Menu element is not initialized.");
        return;
      }
  
      const floatPane = this.getPanes()?.floatPane;
  
      if (!floatPane) {
        console.error("Float pane is not available.");
        return;
      }
  
      floatPane.appendChild(this.menuElement_);
  
      // Store a reference to the CustomMenu instance for use inside the event listener
      const self = this;
  
      // mousedown anywhere on the map except on the menu div will close the menu.
      this.divListener_ = google.maps.event.addDomListener(
        map.getDiv(),
        "mousedown",
        (e: Event) => {
          // Check if the event target is not a descendant of the menu element
          if (!self.menuElement_.contains(e.target as Node)) {
            // Close the menu
            this.close();
          }
        },
        false
      );
    }
  
    override onRemove() {
      if (this.menuElement_) {
        if (this.menuElement_.parentNode) {
          (this.menuElement_.parentNode as HTMLElement).removeChild(this.menuElement_);
        }
        google.maps.event.removeListener(this.divListener_);
      }
      this.set("position", null);
    }
  
    close() {
      this.setMap(null);
    }
  
    override draw() {
      const position = this.get("position");
      const projection = this.getProjection();
  
      if (!position || !projection) {
        return;
      }
  
      const point = projection.fromLatLngToDivPixel(position)!;
  
      this.menuElement_.style.top = point.y + "px";
      this.menuElement_.style.left = point.x + "px";
      this.menuElement_.style.display = "block";
    }
  
    /**
     * Opens the menu at a given position on the map.
     */
    open(map: google.maps.Map, position: google.maps.LatLng) {
      this.set("position", position);
      this.setMap(map);
      this.draw();
    }
  
    showMenu() {
      this.menuElement_.style.display = "block";
    }
  
    hideMenu() {
      this.menuElement_.style.display = "none";
    }
  }