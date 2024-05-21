import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ConfigService } from './Initializer/config.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  title = 'drafting';

  constructor(
    private configService : ConfigService,
    private router: Router
    ) {}

  ngOnInit() {
    try{
      google
    } catch (error) {
      localStorage.setItem('mapError', localStorage.getItem('mapError') ? String(Number(localStorage.getItem('mapError')) + 1) : String(1));
      if(Number(localStorage.getItem('mapError')) > 3){
        alert('Something went wrong while loading map, Please try again!');
        localStorage.removeItem('mapError');
        history.back();
      }
      window.location.reload();
    }
    let permitdata =  JSON.parse( localStorage.getItem("permitdata"))
    if(permitdata.type =='dxf'){
    this.router.navigate(['/dxfdrawing'])
    }
    else if(permitdata.type =='manual'){
      this.router.navigate(['/manual-drawing'])
    }
    else{
      this.router.navigate(['/ev'])
    }
  }

}
