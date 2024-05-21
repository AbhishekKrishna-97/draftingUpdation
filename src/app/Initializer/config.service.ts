import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { BehaviorSubject, filter, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  private currentUserdata = new BehaviorSubject<any | null>(null);
  readonly api$ = this.currentUserdata.asObservable();
  currentUser:any;
  constructor(
    private router : Router,
  ) {
  }

  fetchUserData() {
    // Access query parameters directly
    const queryParams = new URLSearchParams(window.location.search);
    const userParam = queryParams.get('user');
    const currentUserLocalStorageString = localStorage.getItem('currentUser');
     if (currentUserLocalStorageString !== null) {
        this.currentUser = JSON.parse(currentUserLocalStorageString);
     }
     else {
         this.currentUser = null;
    }
    if (userParam) {
      const user = JSON.parse(userParam);
      this.currentUserdata.next(user);
      localStorage.setItem("currentUser", JSON.stringify(user));
     
   
    }
    else if(this.currentUser){
        //  this.router.navigate([''])
    }
    else {
      // Handle the case when 'user' query parameter is not found
      console.log("User not found in query parameters");
      // this.router.navigate([''])
     // this.router.navigate(['not-found'])

    }
  }
}
