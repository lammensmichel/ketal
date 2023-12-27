import {AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
declare var bootstrap: any; // Add this line to use Bootstrap's JavaScript

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss']
})
export class ToastComponent implements OnInit , AfterViewInit  {
  @Input() titleMessage: string  = '';
  @Input() bodyMessage: string  = '';
  @ViewChild('toastRef') toastElement: ElementRef | undefined;
  toast: any;

  ngOnInit(): void {

  }


  ngAfterViewInit(): void {
    if (this.toastElement) {
      this.toast = new bootstrap.Toast(this.toastElement.nativeElement, {delay: 2000});
    }
  }

  show() {
    if (this.toast) {
      this.toast.show();
    }
  }
}
