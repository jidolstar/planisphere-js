/**
 * 별자리판 JS 
 * 저작권 : 지용호(jidolstar@gmail.com)
 */
"use strict";
const AstroMath = Object.freeze({
    R2D: 180.0/Math.PI,   // degrees per radian 
    D2R: Math.PI / 180.0,	// radians per degree 
    S2R: 4.8481368110953599359e-6,	// radians per arc second 
    R2H: 3.8197186342054880584532103209403, // radians per hour 
    H2R: 0.26179938779914943653855361527329, // hour per radians 
    J2000: 2451545.0, //2000년 Julian Day
    PI: 3.1415926535897932384626433832795, // PI 
    TPI: 6.28318530717958647693, // 2PI 
    HPI: 1.5707963267948966192313216916395, // PI/2 

    //------------------------------------------------------------
    // Dividend를 Divisor 내로 넣어준다. 
    // 가령 0~360까지 표현한다면 362.2일때 2.2가 되게 해준다.
    mod: (dividend, divisor) => { 
        return dividend - (Math.floor(dividend/divisor)*divisor);
    },
    // from <= x < to로 정규화한다.
    normalize: (x, from, to) => {
        let w = to - from;
        return x - Math.floor((x - from) / w) * w;
    }
}); 
/*
UT = TT - dT
DT = 역학시
TDT(Terrestrial Dynamical Time) = DT(Dynamical Time) = TT(Terrestrial Time)

- local = time(),date()
- JD    = GMT 12:00:00 기준 이므로 local 속성
- UT    = gmtime(),gmdate() or local-time_offset
- TT    = UT + dT // 각종 천체 운행에 사용

- JD <-> UT <-> GST <-> LST
          <------------->
   <------------->
   <-------------------->

- JD2UT(JD,-time_offset) <-> UT2JD(ut,+time_offset)
- UT2GST(ut) <-> GST2UT(gst)  // 아래 함수
- GST2LST(gst,+lon_offset) <-> LST2GST(lst,-lon_offset)
*/
class AstroTime{
    constructor(dgmt, lon, lat){
        this.dgmt = dgmt; //한국표준시의 경우 9
        this.glon = lon * AstroMath.D2R; //지방 경도. 라디안 값으로 변환 
        this.glat = lat * AstroMath.D2R; //지방 위도. 라디안 값으로 변환 
    }
    //Julian Day Number 
    //비교 : https://planetcalc.com/503/ 
    static jd(year, month, day, hour, minute, second){
        if(month < 3){
            year--;
            month += 12;
        }
        let a = Math.floor(year / 100);
        let b = Math.floor(a / 4);
        return Math.floor(365.25 * year) + 2 - a + b + 
            Math.floor(30.6 * month - 0.4) + day + 1721025.5 + 
            hour / 24.0 +
            minute / 1440.0 + 
            second / 86400.0;
    }
    // Julian Day Number -> Date(일자단위)
    static jd2Date(jd){
        return Math.floor(jd - 0.5) + 0.5;
    }
    //Julian Day Number -> Time(시간단위)
    static jd2Time(jd){
        return (jd - this.jd2Date(jd)) * 24.0;
    }
    //Universial time -> Greenwich sidereal time
    static UT2GST(ut){
        let ut_date = this.jd2Date(ut);
        let ut_time = (ut - ut_date) * 24.0;
        let t = (ut_date - 2451545.0) / 36525.0;
        let t0 = AstroMath.normalize(6.697374558 + (2400.051336 * t) + (0.000025862 * t * t), 0, 24);
        let gst_time = AstroMath.normalize(ut_time * 1.00273790935 + t0, 0, 24);
        return ut_date + gst_time / 24.0;
    }
    //Greenwich sidereal time -> Universal time
    static GST2UT(gst){
        var gst_date = this.jd2Date(gst);
        let gst_time = (gst - gst_date) * 24.0;
        var t = (gst_date - 2451545.0) / 36525.0;
        var t0 = AstroMath.normalize(6.697374558 + (2400.051336 * t) + (0.000025862 * t * t), 0, 24);
        var ut_time = AstroMath.normalize(gst_time - t0, 0, 24);
  
        // 이 계산 때문에 날짜가 달라질 수 있으며 하루에 두개가 생길 수 도 있음
        return gst_date + ut_time * 0.9972695663 / 24.0;
    }
    /*
        ## JD to Local/Greenwich Sidreal Time
        ## http://www.jgiesen.de/astro/astroJS/sunriseJS/index.htm // in rsTL.js
        ##
        function jd2lst($JD, $longitude=0)
        {
        $MJD = $JD - 2400000.5;
        $MJD0 = floor($MJD);
        $ut = ($MJD - $MJD0) * 24.0;
        $t  = ($MJD0 - 51544.5) / 36525.0;

        $gst = 6.697374558 + (1.00273790935*$ut) + (8640184.812866 + (0.093104-0.0000062*$t)*$t) * $t/3600.0;
        $gst = ($gst>=0) ? fmod($gst,24.0) : fmod($gst,24.0) + 24.0; // to 24hours unit
        $lst = fmod($gst+$longitude/15.0,24.0); // to 24hours unit

        return $lst; // 24hours unit (hour angle)
        }    
    */
    // 특정 고도에 있을 때의 local hour angle을 구함
    // alt : 고도(라디안)
    // dec : 적위(라디안)
    HAFromDec(alt, dec){
        return Math.acos(
            (Math.sin(alt) - Math.sin(glat) * Math.sin(dec)) / 
            (Math.cos(glat) * Math.cos(dec))
        );
    }
    //Universial Time -> Local Civil Time
    UT2LCT(ut){
        return ut + this.dgmt / 24.0;
    }
    //Greenwich siderial time -> Local Civil Time
    GST2LCT(gst){
        let ut = AstroTime.GST2UT(gst);
        return this.UT2LCT(ut);
    }
    //Local sidereal time -> Greenwich sidereal time
    LST2GST(lst){
        return lst - this.glon / AstroMath.TPI;
    }
    //Local sidereal time -> Universial time
    LST2UT(lst){
        let gst = this.LST2GST(lst);
        return AstroTime.GST2UT(gst);
    }
    //Local sidereal time -> Local civil time
    LST2LCT(lst){
        let gst = this.LST2GST(lst);
        return this.GST2LCT(gst);
    }
    //Local civil time -> Universial time
    LCT2UT(lct){
        return lct - this.dgmt / 24.0;
    }
    //Local civil time -> Greenwich sidereal time
    LCT2GST(lct){
        let ut = this.LCT2UT(lct);
        return AstroTime.UT2GST(ut);
    }
    //Greenwich sidereal time -> Local sidereal time
    GST2LST(gst){
        return gst + this.glon * AstroMath.R2H / 24.0;
    }
    //Universial time -> Local sidereal time
    UT2LST(ut){
        let gst = AstroTime.UT2GST(ut);
        return this.GST2LST(gst);
    }
    //Local civil time -> Local siderial time
    LCT2LST(lct){
        let ut = this.LCT2UT(lct);
        return this.UT2LST(ut);
    }

};

class AstroVector{
    constructor(x, y, z){
        this.x = x;
        this.y = y;
        this.z = z;
    }
    		
	// 구면좌표계 값을 이용해 Vector값을 구한다.
	// r = 1이라고 가정함
    setSphe(lon, lat){
        const cos_lat = Math.cos(lat)
        this.x = cos_lat * Math.cos(lon);
        this.y = cos_lat * Math.sin(lon);
        this.z = Math.sin(lat);
    }

    //Longitude 값을 반환 
    lon(){
        let r = Math.atan2(this.y, this.x);
        if(r < 0) r += AstroMath.TPI;
        return r;
    }

    //Latitude값을 Return
    lat(){
        const r = Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);
        return Math.asin(this.z / r);
    }

    //r값을 리턴 
    length(){
        return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z)
    }

    //r값을 1로 설정하여 x,y,z값을 수정, 방향은 변하지 않음
    normalize(){
        const r = this.length();
        this.x /= r;
        this.y /= r;
        this.z /= r;
    }

    //Matirx와 vector값을 인자로 받아 새로운 vector값을 만듬
    //m : matrix
    //v : vector 	
    multiply(m, v){
        this.x = v.x * m.v[0][0] + v.y * m.v[0][1] + v.z * m.v[0][2];
        this.y = v.x * m.v[1][0] + v.y * m.v[1][1] + v.z * m.v[1][2];
        this.z = v.x * m.v[2][0] + v.y * m.v[2][1] + v.z * m.v[2][2];
    }
    
    // 적도좌표 -> 황도좌표값을 계산
	// 인자 : 적도좌표 Vector값과 Day Number값		
	// 주의 : 한개의 좌표값에 대해서만 사용할 것 - 많은 좌표는 Matirx이용
    equ2ecl(equ, dt){
        const d = dt - 2451543.5;
        const e = (23.4393 - 3.563e-7 * d) * AstroMath.D2R;
        const cos_e = Math.cos(e);
        const sin_e = Math.sin(e);
        const x1 = equ.x;
        const y1 = equ.y;
        const z1 = equ.z;
        this.x = x1; 						//x1 * 1.0 + y1 * 0 + z1 * 0;
        this.y = y1 * cos_e + z1 * sin_e; 	//x1 * 0 + y1 * cos_e + z1 * sin_e;
        this.z = y1 * -sin_e + z1 * cos_e; 	//x1 * 0 + y1 * -sin_e + z1 * cos_e;
    }
    
    // 지평좌표 -> 적도좌표
    // 인자 : 지평좌표값, Local Siderial Time, 위도			
	// 주의 : 한개의 좌표값에 대해서만 사용할 것 - 많은 좌표는 Matirx이용
    hor2equ(hor, lst, lat){
        var mat = new AstroMatrix(0,0,0,0,0,0,0,0,0); 
        mat.hor2equ(lst, lat);
        this.multiply(mat, hor);		
    }

    // 적도좌표 -> 은하좌표
    // 인자 : 적도좌표값				
    // 주의 : 한개의 좌표값에 대해서만 사용할 것 - 많은 좌표는 Matirx이용
    equ2gal(equ){
        const x1 = equ.x;
        const y1 = equ.y;
        const z1 = equ.z;
        this.x = x1 * -0.0669887 + y1 * -0.8727558 + z1 * -0.4835389;
        this.y = x1 * 0.4927285 + y1 * -0.4503470 + z1 * 0.7445846;
        this.z = x1 * -0.8676008 + y1 * -0.1883746 + z1 * 0.4601998;
    }

    // 황도좌표->적도좌표
    // 인자 : 황도좌표, Day Number				
    // 주의 : 한개의 좌표값에 대해서만 사용할 것 - 많은 좌표는 Matirx이용
    ecl2equ(ecl, dt){
        const x1 = ecl.x;
        const y1 = ecl.y;
        const z1 = ecl.z;
    
        const d = dt - 2451543.5;
        const e = (23.4393 - 3.563e-7 * d) * AstroMath.D2R;
        const cos_e = Math.cos(e);
        const sin_e = Math.sin(e);
        this.x = x1;						//x1 * 1.0 + y1 * 0.0 + z1 * 0.0;
        this.y = y1 * cos_e + z1 * -sin_e; 	//x1 * 0.0 + y1 * cos_e + z1 * -sin_e;
        this.z = y1 * sin_e + z1 * cos_e; 	//x1 * 0.0 + y1 * sin_e + z1 * cos_e;
    }

    // 황도좌표->지평좌표
    // 인자 : 황도좌표값, Local siderial Time, 위도				
    // 주의 : 한개의 좌표값에 대해서만 사용할 것 - 많은 좌표는 Matirx이용	
    ecl2hor(ecl, lst, lat){
        const equ = new AstroVector(0,0,0);
        equ.ecl2equ(ecl, lst);
        this.equ2hor(equ, lst, lat);
    }

    // 적도좌표 -> 지평좌표
    // 인자 : 지평좌표값, Local siderial Time, 위도				
    // 주의 : 한개의 좌표값에 대해서만 사용할 것 - 많은 좌표는 Matirx이용	
    equ2hor(equ, lst, lat){
        const mat = new AstroMatrix(0,0,0,0,0,0,0,0,0); 
        mat.equ2hor(lst, lat);
        this.multiply(mat, equ);
    }
}

class AstroPoint{
    constructor(x, y){
        this.x = x 
        this.y = y
    }
}

class AstroMatrix{
    constructor(x11, x12, x13,
                x21, x22, x23,
                x31, x32, x33){
        this.v = [[],[],[]];
        this.set(x11, x12, x13,
                x21, x22, x23,
                x31, x32, x33);
    }
    set(x11, x12, x13,
        x21, x22, x23,
        x31, x32, x33){
        this.v[0][0] = x11;
        this.v[0][1] = x12;
        this.v[0][2] = x13;
        this.v[1][0] = x21;
        this.v[1][1] = x22;
        this.v[1][2] = x23;
        this.v[2][0] = x31;
        this.v[2][1] = x32;
        this.v[2][2] = x33;
    }

    //행과 열을 받으면 그에 대한 값을 리턴 
    get(row, col){
        return this.v[row][col];
    }

    //두개의 행렬을 곱해준다.
    multiply(m1, m2){
        for(let r = 0; r < 3; r++){
            for(let c = 0; c < 3; c++){
                this.v[r][c] = 0;
                for(let i = 0; i < 3; i++){
                    this.v[r][c] += m1.v[r][i] * m2.v[i][c];
                }
            }
        }
    }

    // 지평좌표->적도좌표 로 변환하는 행렬 만들기
    // 인자 : Local Sidereal Time, 위도
    hor2equ(lst, lat){
        const lst_rad = AstroTime.jd2Time(lst) * AstroMath.H2R;
        const cos_lst = Math.cos(lst_rad); 
        const sin_lst = Math.sin(lst_rad);
        const cos_lat = Math.cos(lat); 
        const sin_lat = Math.sin(lat);
        this.set(-cos_lst * sin_lat, -sin_lst, cos_lst * cos_lat,
            -sin_lst * sin_lat, cos_lst, sin_lst * cos_lat,
            cos_lat, 0.0, sin_lat);
    }

    // 적도좌표->지평좌표 로 변환하는 행렬 만들기
    //	인자 : Local Sidereal Time, 위도
    equ2hor(lst, lat){
        const lst_rad = AstroTime.jd2Time(lst) * AstroMath.H2R;
        const cos_lst = Math.cos(lst_rad);
        const sin_lst = Math.sin(lst_rad);
        const cos_lat = Math.cos(lat);
        const sin_lat = Math.sin(lat);
        this.set(-sin_lat * cos_lst, -sin_lat * sin_lst, cos_lat,
            -sin_lst, cos_lst, 0.0,
            cos_lat * cos_lst, cos_lat * sin_lst, sin_lat);
    }

    // 은하좌표->지평좌표 로 변환하는 행렬 만들기
    //	인자 : Local Sidereal Time, 위도
    gal2hor(lst, lat){
        const Equ2Hor = new Matrix(0,0,0,0,0,0,0,0,0);
        Equ2Hor.equ2hor(lst, lat);
        const gal2equ = new Matrix(0,0,0,0,0,0,0,0,0);
        gal2equ.gal2equ();
        this.multiply(Equ2Hor,gal2equ);
    }
    
    // 황도좌표->지평좌표 로 변환하는 행렬 만들기
    //	인자 : Local Sidereal Time, 위도
    ecl2hor(lst, lat){
        const Equ2Hor = new Matrix(0,0,0,0,0,0,0,0,0);
        Equ2Hor.equ2hor(lst, lat);
        const EclToEqu = new Matrix(0,0,0,0,0,0,0,0,0);
        EclToEqu.ecl2equ(lst);
        this.multiply(Equ2Hor,EclToEqu);
    }

    // 은하좌표->적도좌표 로 변환하는 행렬 만들기
    //	인자 : 없음
    gal2equ(){
        this.set(-0.0669887, 0.4927285, -0.8676008, 
            -0.8727558, -0.4503470, -0.1883746, 
            -0.4835389, 0.7445846, 0.4601998);
    }
    
    // 황도좌표->적도좌표 로 변환하는 행렬 만들기
    //	인자 : Day Number
    ecl2equ(dt){
        const d = dt - 2451543.5;
        const e = (23.4393 - 3.563e-7 * d) * AstroMath.D2R;
        const cos_e = Math.cos(e);
        const sin_e = Math.sin(e);
        this.set(1.0, 0.0, 0.0,
            0.0, cos_e, -sin_e,
            0.0, sin_e, cos_e);
    }

    // 적도좌표->황도좌표 로 변환하는 행렬 만들기
    //	인자 : Day Number
    equ2ecl(dt){
        const d = dt - 2451543.5;
        const e = (23.4393 - 3.563e-7 * d) * AstroMath.D2R;
        const cos_e = Math.cos(e);
        const sin_e = Math.sin(e);
        this.set(1.0, 0.0, 0.0,
            0.0, cos_e, sin_e,
            0.0, -sin_e, cos_e);
    }		
    
}

//--------------------------------------------------------------
// Equidistance Projection 
// 등거리 투영 
// 이 투영방식은 원에서 호의 길이 L이 2D의 위치를 나타내는 것으로
// 호에 대한 각도 A와 반경 R이 있는 경우 L=RA 관계식을 가진다.
// 별의 적경과 적위를 이용해 화면상의 x,y값을 정할 수 있다.
// 단, 북위 90도부근이 (x,y)=(0,0)이 된다. 
class EquiDistanceProjection{
    //--------------------------------------------------------------
    // 화면의 별자리를 보여줄 원의 반경과 적위쪽 한계값을 이용하여 
    // 천구의 가상 반경을 구한다. 
    // 이것을 하는 이유는 천구의 가상반경을 구함으로써 투영의 기본값을 설정하기 위함이다.
    constructor(screenRadius, limitDE){
        this.screenRadius = screenRadius
        this.limitDE = limitDE
        this.screenCoord = new AstroPoint(0,0); //객체 생성을 적게 하기 위해 이렇게 함 
        this.virtualCelestrialRadius = screenRadius / Math.abs(AstroMath.HPI - limitDE);	//천구의 반지름(가상적으로 설정함)	
    }
    project(ra,dec){
        const decScreen = (AstroMath.HPI - dec) * this.virtualCelestrialRadius;
        this.screenCoord.x = decScreen * Math.cos(ra);
        this.screenCoord.y = decScreen * Math.sin(ra);	
        return this.screenCoord;
    }
}