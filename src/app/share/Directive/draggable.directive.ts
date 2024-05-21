import { Directive, ElementRef, HostListener, OnDestroy, OnInit, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appDraggable]'
})
export class DraggableDirective implements OnDestroy , OnInit {

  private isDragging: boolean = false;
  private offsetX: number = 0;
  private offsetY: number = 0;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit(): void {
    // Add global mousemove and mouseup listeners on directive initialization
    this.renderer.listen('document', 'mousemove', this.onMouseMove.bind(this));
    this.renderer.listen('document', 'mouseup', this.onMouseUp.bind(this));

    // set intial posstion one's the component is loaded
    this.renderer.setStyle(this.el.nativeElement, 'left', `36%`);
    this.renderer.setStyle(this.el.nativeElement, 'bottom', `3%`);
  }


  ngOnDestroy(): void {
    // Remove global mousemove and mouseup listeners on directive destruction
    document.removeEventListener('mousemove', this.onMouseMove.bind(this));
    document.removeEventListener('mouseup', this.onMouseUp.bind(this));
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    event.preventDefault();

    this.isDragging = true;

    // Get the initial mouse coordinates
    this.offsetX = event.clientX - this.el.nativeElement.offsetLeft;
    this.offsetY = event.clientY - this.el.nativeElement.offsetTop;
  }

  onMouseMove(event: MouseEvent): void {
    if (this.isDragging) {
      const x = event.clientX - this.offsetX;
      const y = event.clientY - this.offsetY;

      // Update the position of the element
      this.renderer.setStyle(this.el.nativeElement, 'left', `${x}px`);
      this.renderer.setStyle(this.el.nativeElement, 'top', `${y}px`);
    }
  }

  onMouseUp(): void {
    if (this.isDragging) {
      this.isDragging = false;
    }
  }

}
