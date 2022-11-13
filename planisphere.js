class Planisphere{
    #parentDom;

    //마우스로 별자리판 회전하기 위해 사용하는 속성 
    #dragging = false;
    #dragDownX = 0;
    #dragDownY = 0;
    #screenCenterX = 0;
    #screenCenterY = 0;
    #currentRotation = 0;
    #lastRotation = 0;


    constructor(domId){
        this.domId = domId;
        this.limitDE = -70 * AstroMath.D2R

        //스타일 관련 
        this.gradientBackgroundColor = ['#777794', '#adb2ce'];
        this.bgColor = '#000';		//Panel 기본색
        this.raLineColor = '#aaa';	//적경 라인 색
        this.decLineColor1 = '#aaa';	//적위 라인 색
        this.decLineColor2 = '#facc99'; //적위 적도 라인 색 
        this.EquatorLineColor = '#aa9944';	//적도 선 라인 
        this.eclipticLineColor = '#9955aa';	//황도 선 라인 	
        this.raTextColor = '#fff'; //적경 글자 색 
        this.raTextSize = 10; //적경 글자 크기 
        this.dateCircleBgColor = '#3d44aa';	//날짜 환원 배경색
        this.dateColor = '#fff';	//날짜글자 표시색
        this.dateMonthTextSize = 11;
        this.dateDayTextSize = 9;
        this.conNameTextColor = '#AACC00'; //별자리이름 글자색 
        this.conNameTextSize = 10; //별자리이름 글자크기
        this.conlineColor = '#f06'; //별자리선 색 
        this.conlineOpacity = 0.7; 
        this.topPanelBgColor = '#ffaa00'; //상단패널 배경색 
        this.timeLineColor = '#000'; //시간눈금 색  
        this.timeTextColor = '#000'; //시간 텍스트 색 
        this.timeTextSize = 11;
        this.legendColor = '#000'; //범례 색 
        this.legendTextSize = 11;
        this.nwesColor = '#000'; //동서남북 글자색 
        this.nwesTextSize = 12; 

        //좌표 관련 
        this.width = 1000;
        this.height = 1000;
        this.centerX = this.width * 0.5;
        this.centerY = this.height * 0.5;
        this.deltaX = 50;
        this.deltaY = 50;
        this.radius = this.width * 0.5 - this.deltaX * 2;
        this.intervalRA = 2;	//적경 라인 간격(단위 h)
        this.intervalDE = 30;	//적위 라인 간격(단위 도)
        this.horVector = new AstroVector();	//지평좌표값
        this.equVector = new AstroVector();	//적도좌표값
        this.horToEquMatrix = new AstroMatrix(0,0,0,0,0,0,0,0,0); //지평좌표->적도좌표 로 바꿔주는 행렬

        this.currentDate = new Date();
        this.astroTime = new AstroTime(9, 127, 38);
        this.deltaCulminationTime = 0; //this.astroTime.dgmt * AstroMath.H2R - this.astroTime.glon; //경도차에 따라 남중시간이 다르므로 사용 		
        this.lct = AstroTime.jd(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, this.currentDate.getDate(), this.currentDate.getHours(), this.currentDate.getMinutes(), this.currentDate.getSeconds());
        this.ut = this.astroTime.LCT2UT(this.lct);
        this.gst = AstroTime.UT2GST(this.ut);
        this.lst = this.astroTime.LCT2LST(this.lct);

        this.proj = new EquiDistanceProjection(this.radius, this.limitDE);

        //부모 Dom
        this.#parentDom = document.querySelector(this.domId);
        this.#parentDom.innerHTML = '';
        this.#parentDom.style = 'position:relative';

        //배경 
        document.querySelector('body').style = `background-color:${this.gradientBackgroundColor[1]}`;
        this.backgroundPanel = SVG().addTo(this.domId).viewbox(0, 0, this.width, this.height);
        this.backgroundPanel.rect(this.width, this.height).fill(this.backgroundPanel.gradient('linear', (add)=>{
            add.stop(0, this.gradientBackgroundColor[0]);
            add.stop(1, this.gradientBackgroundColor[1]);
        }).from(0, 0).to(0, 1));

        //Sky
        this.skyPanel = SVG().addTo(this.#parentDom)
            .attr('preserveAspectRatio', 'xMidYMin meet')
            .css({position:'absolute', left:0, right:0})
            .viewbox(-this.centerX, -this.centerY, this.width, this.height);

        //Top
        this.topPanel = SVG().addTo(this.#parentDom)
            .attr('preserveAspectRatio', 'xMidYMin meet')
            .css({position:'absolute', left:0, right:0})
            .viewbox(-this.centerX, -this.centerY, this.width, this.height);

        //Info
        this.infoPanel = SVG().addTo(this.#parentDom)
            .attr('preserveAspectRatio', 'xMidYMin meet')
            .css({position:'absolute', left:0, right:0})
            .viewbox(-this.centerX, -this.centerY, this.width, this.height);

        //마우스로 회전 
        this.#parentDom.addEventListener('mousedown', this.#touchStart.bind(this));
        this.#parentDom.addEventListener('mousemove', this.#touchMove.bind(this));
        this.#parentDom.addEventListener('mouseup', this.#touchEnd.bind(this));
        this.#parentDom.addEventListener('mouseout', this.#touchEnd.bind(this));
        this.#parentDom.addEventListener('touchstart', this.#touchStart.bind(this), true);
        this.#parentDom.addEventListener('touchmove', this.#touchMove.bind(this), true);
        this.#parentDom.addEventListener('touchend', this.#touchEnd.bind(this), true);
        this.#parentDom.addEventListener('touchcancel', this.#touchEnd.bind(this), true);

        this.render();
        this.rotateCurrentDate();

        this.skyPanel.transform({rotate:this.#lastRotation});
    }
    #touchStart(e){
        //console.log("touchStart");
        if(this.#dragging) return;
        this.#dragging = true;
        let rect = this.#parentDom.getBoundingClientRect(); //SVG viewBox와 SVG viewport의 크기가 다르기 때문에 마우스 좌표로 회전하려면 viewport기준으로 해야함. https://a11y.gitbook.io/graphics-aria/svg-graphics/svg-layout#svg-viewport
        this.#screenCenterX = rect.width * 0.5;
        this.#screenCenterY = rect.width * 0.5; 
        this.#dragDownX =(e.pageX || e.touches[0].pageX) - this.#screenCenterX;
        this.#dragDownY =(e.pageY || e.touches[0].pageY) - this.#screenCenterY;
        //console.log("touchStart", `dragDownX=${this.#dragDownX}`, `e.pageX=${e.pageX}`);
    }
    #touchMove(e){
        //console.log("touchMove");
        if(!this.#dragging) return;
        let r1 = Math.atan2(this.#dragDownY, this.#dragDownX);
        let r2 = Math.atan2((e.pageY || e.touches[0].pageY) - this.#screenCenterY, (e.pageX || e.touches[0].pageX) - this.#screenCenterX);
        let deltaR = AstroMath.mod(r2- r1, AstroMath.TPI) * AstroMath.R2D;
        this.#currentRotation = this.#lastRotation + deltaR;
        this.skyPanel.transform({
            rotate:this.#currentRotation
        });
    }
    #touchEnd(e){
        //console.log("touchEnd");
        if(!this.#dragging) return;
        this.#lastRotation = this.#currentRotation;
        this.#dragging = false;
    }

    render(){
        this.renderSkyPanel();
        this.renderTopPanel();
        this.renderInfoPanel();

        /*
        console.log(conname.root.data.conname[0]);
        conname.root.data.conname.forEach(c => {
            console.log(`${c.RA},${c.DE},"${c.NAME}",`);
        });
        console.log(AstroMath.mod(364.1, 10));
        console.log(AstroMath.normalize(301, 10, 300));
        console.log("AstroTime.jd(2022,08,26,22,35,0) = ", AstroTime.jd(2022,08,26,22,35,0));
        */
    }

    renderSkyPanel(){
        let canvas = this.skyPanel;
        let diameter = this.radius * 2;
        let cx = 0; //this.centerX;
        let cy = 0; //this.centerY;
        let path = ''; 

        //날짜 눈금부분 
        canvas.circle(diameter + 65).center(cx, cy).stroke({ width: 6, color:'#000'}); //최외곽 
        canvas.circle(diameter + 65).center(cx, cy).fill(this.dateCircleBgColor); //날짜선 배경 
        canvas.circle(diameter).center(cx, cy).stroke({width: 3, color:'#000'}); //날짜선 안쪽 선 
        canvas.circle(diameter).center(cx, cy).fill(this.bgColor); //별자리 영역 
        canvas.circle(diameter + 35).center(cx, cy).fill('none').stroke({width: 1, color:this.dateColor}); //날짜/월 경계선 

        //날짜 월 표시 
        let hour = 0;
        let minute = 0;
        let second = 0;
        for(let month = 1; month <= 12; month++){
            const lct = AstroTime.jd(this.currentDate.getFullYear(), month, 16, hour, minute, second);
			const lst = this.astroTime.LCT2LST(lct);
			this.equVector.setSphe(AstroTime.jd2Time(lst)*AstroMath.H2R + this.deltaCulminationTime, this.limitDE); 
			const ra = this.equVector.lon();	//적경
			const dec = this.equVector.lat(); //적위 
			let {x, y} = this.proj.project(ra, dec);	//화면에 투영한 값 받음
            let t = Math.atan2(y,x);
            let r = this.radius+30;
            x = r * Math.cos(t);
            y = r * Math.sin(t);
            canvas.text(`${month}월`).move(cx + x - 12, cy + y - 10)
                .transform({rotate:AstroMath.R2D * (Math.atan2(y, x)-AstroMath.HPI)})
                .font({fill:this.dateColor, size:this.dateMonthTextSize,
                    family:'Inconsolata',opacity:0.8});
        }

        //날짜 월 경계선 표시 
        path = '';
        for(let month = 1; month <= 12; month++){
            const lct = AstroTime.jd(this.currentDate.getFullYear(), month, 1, hour, minute, second);
			const lst = this.astroTime.LCT2LST(lct);
			this.equVector.setSphe(AstroTime.jd2Time(lst)*AstroMath.H2R + this.deltaCulminationTime, this.limitDE); 
			const ra = this.equVector.lon();	//적경
			const dec = this.equVector.lat(); //적위 
			const {x, y} = this.proj.project(ra, dec);	//화면에 투영한 값 받음
            const t = Math.atan2(y,x);
            const r1 = this.radius+17;
            const x1 = r1 * Math.cos(t);
            const y1 = r1 * Math.sin(t);
            const r2 = this.radius+32;
            const x2 = r2 * Math.cos(t);
            const y2 = r2 * Math.sin(t);
            path += `M${cx + x1} ${cy + y1} L${cx + x2} ${cy + y2} `;
        }
        canvas.path(path).fill('none').stroke({
            color:this.dateColor,
            width:1,
            linecap:'round',
            linejoin:'round',
            opacity:1
        });

        //날짜 일 경계선 표시 
        path = '';
        var arrMonth = [31,28,31,30,31,30,31,31,30,31,30,31];
        for(let month = 1; month <= 12; month++){
            let dayOfMonth = 0;
            while(arrMonth[month-1] >= ++dayOfMonth){
                const lct = AstroTime.jd(this.currentDate.getFullYear(), month, dayOfMonth, hour, minute, second);
                const lst = this.astroTime.LCT2LST(lct);
                this.equVector.setSphe(AstroTime.jd2Time(lst)*AstroMath.H2R + this.deltaCulminationTime, this.limitDE); 
                const ra = this.equVector.lon();	//적경
                const dec = this.equVector.lat(); //적위 
                const {x, y} = this.proj.project(ra, dec);	//화면에 투영한 값 받음
                const t = Math.atan2(y,x);
                const r1 = this.radius + 3;
                const x1 = r1 * Math.cos(t);
                const y1 = r1 * Math.sin(t);
                let r2 = r1 + 15;  //1일 일때는 길게 라인을 그린다. 
               
                if(dayOfMonth != 1){
                    if(dayOfMonth % 10 == 0){
                        const x2 = (r1 + 9.5) * Math.cos(t - 0.4 * AstroMath.D2R);
                        const y2 = (r1 + 9.5) * Math.sin(t - 0.4 * AstroMath.D2R);
                        //canvas.line(0, 0, cx+x2, cy+y2).stroke({width:1,color:'#f00'});
                        canvas.text(`${dayOfMonth}`).move(cx + x2 - 7, cy + y2  - 3.5)
                        .transform({
                            origin:[cx+x2, cy+y2],
                            rotate:AstroMath.R2D * (Math.atan2(y2, x2)-AstroMath.HPI)
                        })
                        .font({fill:this.dateColor, size:this.dateDayTextSize,
                            family:'Inconsolata',opacity:0.8});
                    }
                    if(dayOfMonth%5 == 0){
                        r2 = r1 + 4; 
                    }else{ 
                        r2 = r1 + 1;
                    }
                }
                const x2 = r2 * Math.cos(t);
                const y2 = r2 * Math.sin(t);
                path += `M${cx + x1} ${cy + y1} L${cx + x2} ${cy + y2} `;
            }
        }
        canvas.path(path).fill('none').stroke({
            color:this.dateColor,
            width:1,
            linecap:'round',
            linejoin:'round',
            opacity:1
        });

        //적경선
        path = ''; 
        for(let ra = 0; ra < 24; ra = ra + this.intervalRA){
            const {x, y} = this.proj.project(ra * AstroMath.H2R, this.limitDE);
            path += `M${cx} ${cy} L${cx+x} ${cy+y} `;
        }
        canvas.path(path).fill('none').stroke({
            color:this.raLineColor,
            width:1,
            linecap:'round',
            linejoin:'round',
            opacity:0.4
        });

        //적경값 
        for(let ra=0; ra < 24; ra = ra + this.intervalRA){
            const {x, y} = this.proj.project(ra * AstroMath.H2R, -3 * AstroMath.D2R);
            canvas.text(`${ra}h`).move(cx + x - 6, cy + y - 6)
                .font({fill:this.raTextColor, size:this.raTextSize,family:'Inconsolata'})
                .transform({
                    rotate:AstroMath.R2D * (Math.atan2(y, x)-AstroMath.HPI)
                })
        }

        //적위선 
        for(let dec = -90.0; dec < 90.0; dec += this.intervalDE){
            const {x, y} = this.proj.project(0, dec * AstroMath.D2R);
            if(Math.sqrt(x*x,y*y) < this.proj.screenRadius){
                let color = this.decLineColor1
                let opacity = 0.4;
                if(Math.abs(dec) < 0.00001){ //천구의 적도이면
                    color = this.decLineColor2;
                    opacity = 0.7;
                }
                canvas.circle(x * 2).center(cx, cy).fill('none').stroke({color,width:1,opacity});
            }
        }

        //별자리선 
        path = '';
        for(let i=0; i < dataConLineList.length; i+=4){
            const {x:x1, y:y1} = this.proj.project(dataConLineList[i], dataConLineList[i+1]);
            const {x:x2, y:y2}  = this.proj.project(dataConLineList[i+2], dataConLineList[i+3]);
            if(Math.sqrt(x1*x1+y1*y1) < this.proj.screenRadius && Math.sqrt(x2*x2+y2*y2) < this.proj.screenRadius){
                path += `M${cx+x1} ${cy+y1} L${cx+x2} ${cy+y2} `;
            }
        }
        let conline = canvas.path(path);
        conline.fill('none').stroke({color:this.conlineColor,width:1,linecap:'round',linejoin:'round',opacity:this.conlineOpacity});

        //별 
        let stars = starList.split("\n");
        for(let i=0; i < stars.length; i++){
            let star = stars[i].split(',');
            let ra = star[2];
            let dec = star[3];
            const {x, y} = this.proj.project(ra * AstroMath.H2R, dec * AstroMath.D2R);
            if(Math.sqrt(x*x+y*y) < this.proj.screenRadius){
                let mag = star[4];
                let type = star[5];
                let radius = 0.5;
                let alpha = 0.5;
                let color = '#fff';
                if(mag < -1){radius = 7; alpha = 1}
                else if(mag < 0){radius = 6; alpha = 1}
                else if(mag < 1){radius = 5; alpha = 1}
                else if(mag < 2){radius = 4; alpha = 1}
                else if(mag < 3){radius = 3; alpha = 0.8}
                else if(mag < 4){radius = 2; alpha = 0.8}
                else if(mag < 5){radius = 1; alpha = 0.5}
                switch(type){
                    case "O":color='#9bb0ff';break;
                    case "B":color='#aabfff';break;
                    case "A":color='#cad7ff';break;
                    case "F":color='#f8f7ff';break;
                    case "G":color='#fff4ea';break;
                    case "K":color='#ffd2a1';break;
                    case "M":color='#ffcc6f';break;
                    default: color='#fff';
                }
                canvas.circle(radius*2).center(cx + x, cy + y).fill({color,alpha})
            }
        }

        //별자리 명
        for(let i=0; i < dataConNameList.length; i+=3){
            const name = dataConNameList[i+2];
            const {x, y} = this.proj.project(dataConNameList[i], dataConNameList[i+1]);
            //console.log(`${name} ${x} ${y}`)
            if(Math.sqrt(x*x+y*y) < this.proj.screenRadius){
                canvas.text(name).move(cx + x, cy + y)
                .transform({rotate:AstroMath.R2D * (Math.atan2(y, x)-AstroMath.HPI)})
                .font({fill:this.conNameTextColor,size:this.conNameTextSize,family:'Inconsolata',opacity:0.8});
            }
        }
    }

    renderTopPanel(){
        let canvas = this.topPanel;
        let diameter = this.radius * 2;
        let cx = 0; //this.centerX;
        let cy = 0; //this.centerY;
        let path = ''; 

        //현재시간 지평좌표계->적도좌표계 행렬 
        const lct = AstroTime.jd(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, this.currentDate.getDate(), this.currentDate.getHours(), this.currentDate.getMinutes(), this.currentDate.getSeconds());
        const lst = this.astroTime.LCT2LST(lct);
        this.horToEquMatrix.hor2equ(lst, this.astroTime.glat);

        //커버 - 밤하늘 보이는 부분 구멍도 뚫는다.
        path = `M${cx-this.radius},${cy} `;
        path += `a ${this.radius},${this.radius} 0 1,1, ${diameter},0 `;
        path += `a ${this.radius},${this.radius} 0 1,1, -${diameter},0 `;
        for(let azimuth=0; azimuth <= 360*AstroMath.D2R; azimuth+=0.01){
            this.horVector.setSphe(azimuth, 0);
            this.equVector.multiply(this.horToEquMatrix, this.horVector);
            const ra = this.equVector.lon();	
			const dec = this.equVector.lat(); 
            let {x, y} = this.proj.project(ra, dec);	//화면에 투영한 값 받음
            if(azimuth == 0) path += 'M'
            else path += 'L';
            path += `${cx+x} ${cy+y} `;
        }
        canvas.path(path).fill(this.topPanelBgColor).stroke({width: 3, color:'#000'});  

        //동서남북 
        const arrayAzimuthName = ["북","북동","동","남동","남","남서","서","북서"];
        let azimuth = 0;
        for(let i = 0; i < arrayAzimuthName.length; i++){
            const name = arrayAzimuthName[i];
            this.horVector.setSphe(azimuth*AstroMath.D2R, -4*AstroMath.D2R);
            this.equVector.multiply(this.horToEquMatrix, this.horVector);
            const ra1 = this.equVector.lon();	
			const dec1 = this.equVector.lat(); 
            const {x:x1, y:y1} = this.proj.project(ra1, dec1);

            this.horVector.setSphe(azimuth*AstroMath.D2R, 90*AstroMath.D2R);
            this.equVector.multiply(this.horToEquMatrix, this.horVector);
            const ra2 = this.equVector.lon();	
			const dec2 = this.equVector.lat(); 
            const {x:x2, y:y2} = this.proj.project(ra2, dec2);
            //canvas.line(cx + x1, cx + y1 , cx + x2 , cy + y2).stroke({width:1,color:'#f00'});
            
            let dx = 0, dy = 5; 
            if(name.length == 1) dx = 5; else dx = 10;
            canvas.text(`${arrayAzimuthName[i]}`).move(cx + x1 - dx, cy + y1 - dy)
                .font({fill:this.nwesColor, size:this.nwesTextSize,family:'Inconsolata'})
                .transform({
                    origin:[cx + x1, + cy  + y1],
                    rotate:AstroMath.R2D * (Math.atan2(y1-y2, x1-x2)-AstroMath.HPI)
                })

            azimuth+=45;
        }

        //시간 눈금
        this.horVector.setSphe(180 * AstroMath.H2R, 0);
        this.equVector.multiply(this.horToEquMatrix, this.horVector);
        path = '';
        for(let hour = 1; hour <= 24; hour++){
            const t = -(-this.equVector.lon() - this.deltaCulminationTime + hour*AstroMath.H2R + AstroMath.PI);
            const cos_lon = Math.cos(t);
            const sin_lon =  Math.sin(t);
            const x1 = this.radius * cos_lon;
            const y1 = this.radius * sin_lon;
            const x2 = (this.radius - 9) * cos_lon;
            const y2 = (this.radius - 9) * sin_lon;
            path += `M${x1 + cx} ${y1 + cy} L${x2 + cx} ${y2 + cy} `;

            const x3 = (this.radius - 16) * cos_lon;
            const y3 = (this.radius - 16) * sin_lon;
            //canvas.line(0, 0, cx + x2, + cy  + y2).stroke({width:1,color:'#f00'});
            canvas.text(`${hour}시`).move(cx + x3 - 9, cy + y3 - 6)
                .font({fill:this.timeTextColor, size:this.timeTextSize,family:'Inconsolata'})
                .transform({
                    origin:[cx + x3, + cy  + y3],
                    rotate:AstroMath.R2D * (Math.atan2(y3, x3)-AstroMath.HPI-AstroMath.PI)
                });
            for(let min = 5; min < 60; min+=5){
                const t = -(-this.equVector.lon() - this.deltaCulminationTime + (hour + (min/60)) *AstroMath.H2R + AstroMath.PI);
                const cos_lon = Math.cos(t);
                const sin_lon =  Math.sin(t);
                const x1 = this.radius * cos_lon;
                const y1 = this.radius * sin_lon;
                let r;
                if(min % 10 == 0){
                    if(min % 30 == 0) r = this.radius - 10;
                    else r = this.radius - 6
                }else{
                    r = this.radius - 3;
                }
                const x2 = r * cos_lon;
                const y2 = r * sin_lon;
                path += `M${x1 + cx} ${y1 + cy} L${x2 + cx} ${y2 + cy} `
            }
        }
        canvas.path(path).fill('none').stroke({width: 1, color:this.timeLineColor});  
    }

    renderInfoPanel(){
        let canvas = this.infoPanel;
        let cx = 0;//this.centerX;
        let cy = 0;//this.centerY;

        //별 등성 범례
        let radius = 0.5;
        let alpha = 0.5;
        let color = '#fff';
        for(let mag = -1; mag < 5; mag++){
            if(mag < -1){radius = 7; alpha = 1}
            else if(mag < 0){radius = 6; alpha = 1}
            else if(mag < 1){radius = 5; alpha = 1}
            else if(mag < 2){radius = 4; alpha = 1}
            else if(mag < 3){radius = 3; alpha = 0.8}
            else if(mag < 4){radius = 2; alpha = 0.8}
            else if(mag < 5){radius = 1; alpha = 0.5}
            else{radius = 0.5; alpha = 0.5}
            canvas.circle(radius*2)
                .center(cx-280 - radius/2, cy - 170 + mag * 15)
                .fill({color:this.legendColor,fill:this.legendColor});
            canvas.text(`${mag+2} 등성`).move(cx-270, cy - 175 + mag * 15)
                .font({fill:this.legendColor, size:this.timeTextSize,family:'Inconsolata'})
        }
        canvas.text(`아빠별 별자리판`).move(cx - 160, cy-260)
                .font({fill:this.legendColor, size:50,family:'Inconsolata'});
     
    }

    rotateCurrentDate(){
        //Local Sidereal Time 만큼 회전시켜준다.
        // 즉, 남중해야할 별이 화면 아래로 향하게 한다.
        let rotation = -(AstroTime.jd2Time(this.lst) * AstroMath.H2R * AstroMath.R2D - 90);
        this.topPanel.transform({rotate:rotation});
        this.#lastRotation = rotation;
    }
}