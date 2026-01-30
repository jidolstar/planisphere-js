/**
 * @fileoverview 별자리판 JS - 위치 설정 모달 모듈
 * @author 지용호 <jidolstar@gmail.com>
 * @version 1.2.2
 * @license MIT
 *
 * @description
 * 세계 지도를 이용한 관측 위치 선택 기능을 제공합니다.
 * world_map.jpg (North-Up, Pacific-centered Equirectangular) 투영법에 최적화되었습니다.
 */

import { formatDMS, TimezoneService } from '../core/util.js';

export default class LocationModal {
    #modal;
    #canvas;
    #wrapper;
    #info;
    #applyBtn;
    #cancelBtn;
    #closeBtn;
    #restricted;
    #dgmtInput;
    #tzInfo;
    #ctx;
    #onApply;
    #mapImg;

    // 상태 변수
    #tempLon = 0;
    #tempLat = 0;
    #tempDgmt = 0;
    #tempTzName = '';
    #zoom = 1.0;
    #minZoom = 1.0;
    #maxZoom = 10.0;

    #viewX = null;
    #viewY = null;

    #isMoving = false;
    #isDragging = false;
    #startX = 0;
    #startY = 0;
    #lastX = 0;
    #lastY = 0;

    constructor(options) {
        this.#modal = document.getElementById(options.modalId);
        this.#canvas = document.getElementById(options.canvasId);
        this.#wrapper = document.getElementById(options.wrapperId);
        this.#info = document.getElementById(options.infoId);
        this.#applyBtn = document.getElementById(options.applyBtnId);
        this.#cancelBtn = document.getElementById(options.cancelBtnId);
        this.#closeBtn = document.getElementById(options.closeBtnId);
        this.#restricted = document.getElementById(options.restrictedZoneId);
        this.#dgmtInput = document.getElementById(options.dgmtInputId);
        this.#tzInfo = document.getElementById(options.tzInfoId);
        this.#ctx = this.#canvas.getContext('2d');
        this.#onApply = options.onApply;

        this.#mapImg = new Image();
        this.#mapImg.src = options.imageSrc;

        this.#initEvents();
    }

    open(lon, lat, dgmt, tzName) {
        this.#tempLon = lon;
        this.#tempLat = lat;
        this.#tempDgmt = dgmt;
        this.#tempTzName = tzName || '';
        this.#zoom = 1.0;

        this.#modal.style.display = 'flex';
        this.#modal.classList.add('open');

        this.#resize();

        const init = () => {
            this.#resetViewTo(this.#tempLon, this.#tempLat);
            this.draw();
            this.#updateUI();
        };

        if (this.#mapImg.complete && this.#mapImg.width > 0) {
            init();
        } else {
            this.#mapImg.onload = init;
        }
    }

    #resize() {
        const rect = this.#wrapper.getBoundingClientRect();
        this.#canvas.width = rect.width;
        this.#canvas.height = rect.width / 2; // 2:1 aspect ratio
    }

    /**
     * 투영법 변환: Lat -> Y (0~1)
     * 2D 지도가 주로 Plate Carrée (Equirectangular)라고 가정합니다.
     * (Mercator가 필요할 경우 수식 변경 가능)
     */
    #latToYRatio(lat) {
        // North-Up: 90N = 0, 0 = 0.5, 90S = 1
        return (90 - lat) / 180;
    }

    #lonToXRatio(lon) {
        // 본초 자오선(0)이 왼쪽 끝에서 약 30도(8.3%) 지점에 있음
        // 즉, 왼쪽 끝은 -30도임.
        return ((lon + 30 + 360) % 360) / 360;
    }

    #yRatioToLat(ry) {
        return 90 - (ry * 180);
    }

    #xRatioToLon(rx) {
        let lon = rx * 360 - 30;
        if (lon > 180) lon -= 360;
        if (lon < -180) lon += 360;
        return lon;
    }

    #resetViewTo(lon, lat) {
        if (!this.#mapImg.width) return;

        const rx = this.#lonToXRatio(lon);
        const ry = this.#latToYRatio(lat);

        this.#viewX = rx * this.#mapImg.width;
        this.#viewY = ry * this.#mapImg.height;
        this.#clampView();
    }

    #clampView() {
        if (!this.#mapImg.width) return;
        const sw = this.#mapImg.width / this.#zoom;
        const sh = this.#mapImg.height / this.#zoom;

        // 경계 고정 (Wrap-around는 현재 미지원)
        this.#viewX = Math.max(sw / 2, Math.min(this.#mapImg.width - sw / 2, this.#viewX));
        this.#viewY = Math.max(sh / 2, Math.min(this.#mapImg.height - sh / 2, this.#viewY));
    }

    draw() {
        if (!this.#mapImg.complete || !this.#mapImg.width) return;
        if (this.#viewX === null) this.#resetViewTo(this.#tempLon, this.#tempLat);

        const w = this.#canvas.width;
        const h = this.#canvas.height;
        this.#ctx.clearRect(0, 0, w, h);

        const sw = this.#mapImg.width / this.#zoom;
        const sh = this.#mapImg.height / this.#zoom;

        const sx = this.#viewX - sw / 2;
        const sy = this.#viewY - sh / 2;

        // 1. 배경 지도 그리기
        this.#ctx.drawImage(this.#mapImg, sx, sy, sw, sh, 0, 0, w, h);

        // 2. 가이드 그리드 (디버깅 및 정확도 확인용)
        this.#drawGrid(sx, sy, sw, sh, w, h);

        // 3. 선택 마커
        this.#drawMarker(sx, sy, sw, sh, w, h);

        // 4. 제한 구역 시각화
        this.#drawRestrictedZone(sy, sh, h);
    }

    #drawGrid(sx, sy, sw, sh, w, h) {
        this.#ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        this.#ctx.lineWidth = 1;
        this.#ctx.setLineDash([5, 5]);

        // 적도
        const eqY = (this.#latToYRatio(0) * this.#mapImg.height - sy) * (h / sh);
        if (eqY >= 0 && eqY <= h) {
            this.#ctx.beginPath();
            this.#ctx.moveTo(0, eqY);
            this.#ctx.lineTo(w, eqY);
            this.#ctx.stroke();
        }

        // 본초 자오선 (0)
        const pmX = (this.#lonToXRatio(0) * this.#mapImg.width - sx) * (w / sw);
        if (pmX >= 0 && pmX <= w) {
            this.#ctx.beginPath();
            this.#ctx.moveTo(pmX, 0);
            this.#ctx.lineTo(pmX, h);
            this.#ctx.stroke();
        }

        // 180도
        const cX = (this.#lonToXRatio(180) * this.#mapImg.width - sx) * (w / sw);
        if (cX >= 0 && cX <= w) {
            this.#ctx.beginPath();
            this.#ctx.moveTo(cX, 0);
            this.#ctx.lineTo(cX, h);
            this.#ctx.stroke();
        }

        // 90E
        const eX = (this.#lonToXRatio(90) * this.#mapImg.width - sx) * (w / sw);
        if (eX >= 0 && eX <= w) {
            this.#ctx.beginPath();
            this.#ctx.moveTo(eX, 0);
            this.#ctx.lineTo(eX, h);
            this.#ctx.stroke();
        }

        // 90W (-90)
        const wX = (this.#lonToXRatio(-90) * this.#mapImg.width - sx) * (w / sw);
        if (wX >= 0 && wX <= w) {
            this.#ctx.beginPath();
            this.#ctx.moveTo(wX, 0);
            this.#ctx.lineTo(wX, h);
            this.#ctx.stroke();
        }
        this.#ctx.setLineDash([]);
    }

    #drawMarker(sx, sy, sw, sh, w, h) {
        const rx = this.#lonToXRatio(this.#tempLon);
        const ry = this.#latToYRatio(this.#tempLat);

        const mapPX = rx * this.#mapImg.width;
        const mapPY = ry * this.#mapImg.height;

        const screenX = (mapPX - sx) * (w / sw);
        const screenY = (mapPY - sy) * (h / sh);

        if (screenX >= 0 && screenX <= w && screenY >= 0 && screenY <= h) {
            this.#ctx.beginPath();
            this.#ctx.arc(screenX, screenY, 8, 0, Math.PI * 2);
            this.#ctx.fillStyle = '#ffcc00';
            this.#ctx.fill();
            this.#ctx.strokeStyle = '#000';
            this.#ctx.lineWidth = 2;
            this.#ctx.stroke();

            this.#ctx.beginPath();
            this.#ctx.moveTo(screenX - 12, screenY);
            this.#ctx.lineTo(screenX + 12, screenY);
            this.#ctx.moveTo(screenX, screenY - 12);
            this.#ctx.lineTo(screenX, screenY + 12);
            this.#ctx.strokeStyle = '#fff';
            this.#ctx.lineWidth = 1;
            this.#ctx.stroke();
        }
    }

    #drawRestrictedZone(sy, sh, h) {
        const r_ty = this.#latToYRatio(10) * this.#mapImg.height;
        const r_by = this.#latToYRatio(-10) * this.#mapImg.height;

        const screen_rsy = (r_ty - sy) * (h / sh);
        const screen_rey = (r_by - sy) * (h / sh);

        if (this.#restricted) {
            this.#restricted.style.top = `${Math.max(0, screen_rsy)}px`;
            this.#restricted.style.height = `${Math.min(h, screen_rey) - Math.max(0, screen_rsy)}px`;
            this.#restricted.style.display = (screen_rey < 0 || screen_rsy > h) ? 'none' : 'flex';
        }
    }

    #updateUI() {
        const isRestricted = Math.abs(this.#tempLat) <= 10;
        const infoText = `${formatDMS(this.#tempLat, true)} / ${formatDMS(this.#tempLon, false)}`;

        if (this.#dgmtInput) this.#dgmtInput.value = this.#tempDgmt;

        if (isRestricted) {
            this.#info.innerHTML = `<span style="color:#ffcc00">${infoText}</span> <span style="color:#ff4444; font-size:11px; margin-left:8px;">⚠️ 사용 제한 (±10°)</span>`;
            this.#applyBtn.disabled = true;
        } else {
            this.#info.innerHTML = infoText;
            this.#applyBtn.disabled = false;
        }
    }

    #initEvents() {
        this.#canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.8 : 1.25;
            this.#zoomAt(e.offsetX, e.offsetY, delta);
        }, { passive: false });

        const onDown = (x, y) => {
            this.#isMoving = true;
            this.#isDragging = false;
            this.#startX = x;
            this.#startY = y;
            this.#lastX = x;
            this.#lastY = y;
        };

        const onMove = (x, y) => {
            if (!this.#isMoving) return;
            const dx = x - this.#lastX;
            const dy = y - this.#lastY;
            if (Math.abs(x - this.#startX) > 3 || Math.abs(y - this.#startY) > 3) this.#isDragging = true;

            if (this.#isDragging) {
                const sw = this.#mapImg.width / this.#zoom;
                const sh = this.#mapImg.height / this.#zoom;
                this.#viewX -= dx * (sw / this.#canvas.width);
                this.#viewY -= dy * (sh / this.#canvas.height);
                this.#clampView();
                this.draw();
            }
            this.#lastX = x;
            this.#lastY = y;
        };

        const onUp = (x, y) => {
            if (!this.#isMoving) return;
            if (!this.#isDragging) this.#selectAt(x, y);
            this.#isMoving = false;
            this.#isDragging = false;
        };

        this.#canvas.addEventListener('mousedown', (e) => onDown(e.offsetX, e.offsetY));
        window.addEventListener('mousemove', (e) => {
            if (!this.#isMoving) return;
            const rect = this.#canvas.getBoundingClientRect();
            onMove(e.clientX - rect.left, e.clientY - rect.top);
        });
        window.addEventListener('mouseup', (e) => {
            if (!this.#isMoving) return;
            const rect = this.#canvas.getBoundingClientRect();
            onUp(e.clientX - rect.left, e.clientY - rect.top);
        });

        // 터치 지원 생략 가능하나 유지함
        this.#canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                const rect = this.#canvas.getBoundingClientRect();
                onDown(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
            }
        }, { passive: false });
        this.#canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const rect = this.#canvas.getBoundingClientRect();
            if (e.touches.length === 1) onMove(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
        }, { passive: false });
        this.#canvas.addEventListener('touchend', (e) => {
            if (this.#isMoving) onUp(this.#lastX, this.#lastY);
        });

        this.#dgmtInput.onchange = () => {
            this.#tempDgmt = parseFloat(this.#dgmtInput.value) || 0;
        };

        this.#applyBtn.onclick = () => {
            if (this.#onApply) this.#onApply(this.#tempLon, this.#tempLat, this.#tempDgmt, this.#tempTzName);
            this.close();
        };
        this.#cancelBtn.onclick = this.#closeBtn.onclick = () => this.close();
    }

    #zoomAt(x, y, delta) {
        const oldZoom = this.#zoom;
        this.#zoom = Math.max(this.#minZoom, Math.min(this.#maxZoom, this.#zoom * delta));
        if (this.#zoom === oldZoom) return;

        const sw = this.#mapImg.width / oldZoom;
        const sh = this.#mapImg.height / oldZoom;
        const sx = this.#viewX - sw / 2;
        const sy = this.#viewY - sh / 2;
        const mapX = sx + x * (sw / this.#canvas.width);
        const mapY = sy + y * (sh / this.#canvas.height);

        const nsw = this.#mapImg.width / this.#zoom;
        const nsh = this.#mapImg.height / this.#zoom;
        this.#viewX = mapX - (x / this.#canvas.width - 0.5) * nsw;
        this.#viewY = mapY - (y / this.#canvas.height - 0.5) * nsh;

        this.#clampView();
        this.draw();
    }

    #selectAt(x, y) {
        const sw = this.#mapImg.width / this.#zoom;
        const sh = this.#mapImg.height / this.#zoom;
        const sx = this.#viewX - sw / 2;
        const sy = this.#viewY - sh / 2;

        const mapX = sx + x * (sw / this.#canvas.width);
        const mapY = sy + y * (sh / this.#canvas.height);

        this.#tempLon = this.#xRatioToLon(mapX / this.#mapImg.width);
        this.#tempLat = this.#yRatioToLat(mapY / this.#mapImg.height);

        this.#tempLon = Math.max(-180, Math.min(180, this.#tempLon));
        this.#tempLat = Math.max(-90, Math.min(90, this.#tempLat));

        // 타임존 자동 검색 (동적 데이터 로드 기반)
        this.#autoLookupTimezone(this.#tempLat, this.#tempLon);

        this.#updateUI();
        this.draw();
    }

    async #autoLookupTimezone(lat, lon) {
        if (this.#tzInfo) this.#tzInfo.textContent = "타임존 로딩중...";

        const success = await TimezoneService.loadLibrary();
        if (success) {
            const tzName = TimezoneService.getTimezoneName(lat, lon);

            if (tzName) {
                this.#tempDgmt = TimezoneService.getOffsetFromTimezone(tzName);
                this.#tempTzName = tzName;
                if (this.#tzInfo) this.#tzInfo.textContent = tzName;
            } else {
                this.#tempDgmt = TimezoneService.getGeographicOffset(lon);
                this.#tempTzName = "";
                if (this.#tzInfo) this.#tzInfo.textContent = "지리적 표준시 사용";
            }
        } else {
            this.#tempDgmt = TimezoneService.getGeographicOffset(lon);
            this.#tempTzName = "";
            if (this.#tzInfo) this.#tzInfo.textContent = "지리적 표준시 사용";
        }
        this.#updateUI();
    }

    close() {
        this.#modal.style.display = 'none';
        this.#modal.classList.remove('open');
    }
}
