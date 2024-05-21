import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { MatSliderModule } from '@angular/material/slider';
import { PagenotfoundComponent } from './pagenotfound/pagenotfound.component';
import { InitializerModule } from './Initializer/initializer.module';
import { ShareModule } from './share/share.module';
import { ToastrModule } from 'ngx-toastr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';

@NgModule({
  declarations: [
    AppComponent,
    PagenotfoundComponent,
  ],
  imports: [
    BrowserModule,
    MatSliderModule,
    HttpClientModule,
    AppRoutingModule,
    InitializerModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
    ToastrModule.forRoot(
    { progressBar: true,
      timeOut: 2000,
      positionClass: 'toast-top-right',
      closeButton: true
    }
    ),
    BrowserAnimationsModule,
    ShareModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
