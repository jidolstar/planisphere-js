/**
 * @fileoverview 별자리판 JS - 메인 컨트롤러
 * @author 지용호 <jidolstar@gmail.com>
 * @version 1.3.0
 * @license MIT
 *
 * @description
 * 별자리판 애플리케이션의 메인 진입점입니다.
 * 사용자 입력, 상태 관리, 렌더링을 조율합니다.
 *
 * 주요 컴포넌트:
 * - InputHandler: 마우스/터치/제스처 입력 통합 처리
 * - Planisphere: 메인 컨트롤러 클래스
 *
 * @example
 * // 별자리판 생성
 * const planisphere = new Planisphere({
 *     wrapperDomId: '#planisphere',
 *     currentDate: new Date(),
 *     lon: 126.98,  // 서울
 *     lat: 37.57,
 *     dgmt: 9,      // KST
 *     version: 'v1.0.3'
 * });
 *
 * // 날짜 변경
 * planisphere.setDateTime(new Date(2024, 6, 21, 21, 0));
 *
 * // 테마 변경
 * planisphere.setTheme('dark');
 *
 * @requires SVG.js
 */

// 천문학 계산 모듈 import
import {
    AstroMath,
    AstroTime,
    AstroVector,
    AstroMatrix,
    AstroPoint,
    EquiDistanceProjection
} from './astronomy.js';

import { Env, TimezoneService } from './util.js';

// 상수 import
import {
    DEFAULT_LOCATION,
    DEFAULT_LATITUDE,
    DEFAULT_LONGITUDE,
    VERSION,
    SPECTRAL_COLORS,
    STORAGE_KEYS
} from './constants.js';

// 렌더러 import
import {
    THEMES,
    SkyPanelRenderer,
    TimeRingRenderer,
    InfoPanelRenderer
} from './renderers.js';

// SVG.js 라이브러리 직접 import (사용자가 HTML에 별도로 넣지 않아도 되도록 함)
import { SVG } from 'https://cdn.jsdelivr.net/npm/@svgdotjs/svg.js@3.2/dist/svg.esm.js';

/**
 * 입력 처리 통합 클래스
 *
 * 다양한 입력 방식을 통합하여 일관된 인터페이스를 제공합니다:
 * - Pointer Events (최신 브라우저)
 * - Touch Events (모바일)
 * - Mouse Events (데스크톱 폴백)
 * - Wheel Events (줌)
 * - Gesture Events (Safari 핀치/줌)
 *
 * 지원하는 상호작용:
 * - 드래그: 별자리판 회전
 * - 휠/핀치: 확대/축소
 * - 2손가락 드래그/우클릭: 패닝
 *
 * @class
 * @private
 */
class InputHandler {
    /** @type {HTMLElement} */
    #parentDom;
    /** @type {Map<number, {x: number, y: number}>} 활성 포인터 추적 */
    #pointers = new Map();
    /** @type {boolean} 드래그(회전) 중 여부 */
    #dragging = false;
    /** @type {number} 드래그 시작 X 좌표 */
    #dragDownX = 0;
    /** @type {number} 드래그 시작 Y 좌표 */
    #dragDownY = 0;
    /** @type {number} 화면 중심 X 좌표 */
    #screenCenterX = 0;
    /** @type {number} 화면 중심 Y 좌표 */
    #screenCenterY = 0;
    /** @type {number} 현재 회전각 (도) */
    #currentRotation = 0;
    /** @type {number} 마지막 확정 회전각 (도) */
    #lastRotation = 0;

    /** @type {boolean} 패닝 중 여부 */
    #panning = false;
    /** @type {number} 패닝 시작 X */
    #panStartX = 0;
    /** @type {number} 패닝 시작 Y */
    #panStartY = 0;
    /** @type {number} 현재 패닝 X 오프셋 */
    #panX = 0;
    /** @type {number} 현재 패닝 Y 오프셋 */
    #panY = 0;

    /** @type {number} 현재 줌 배율 */
    #scale = 1;
    /** @type {number} 최소 줌 배율 */
    #minScale = 0.6;
    /** @type {number} 최대 줌 배율 */
    #maxScale = 3.0;

    /** @type {number} 이전 터치/마우스 X */
    #panPrevX = 0;
    /** @type {number} 이전 터치/마우스 Y */
    #panPrevY = 0;
    /** @type {number} 핀치 이전 중심 X */
    #pinchPrevCenterX = 0;
    /** @type {number} 핀치 이전 중심 Y */
    #pinchPrevCenterY = 0;
    /** @type {number} 핀치 시작 거리 */
    #pinchStartDist = 0;
    /** @type {number} 핀치 시작 배율 */
    #pinchStartScale = 1;
    /** @type {number} 제스처 시작 배율 */
    #gestureStartScale = 1;

    /**
     * InputHandler 인스턴스 생성
     * @param {HTMLElement} parentDom - 이벤트를 바인딩할 DOM 요소
     * @param {Object} callbacks - 콜백 함수 객체
     * @param {Function} callbacks.onTransform - 변환 시 호출 (rotation, scale, panX, panY) => void
     */
    constructor(parentDom, callbacks) {
        this.#parentDom = parentDom;
        /** @type {Function} 변환 콜백 */
        this.onTransform = callbacks.onTransform;
        this.#setupEventListeners();
    }

    /**
     * 현재 회전각 (도)
     * @readonly
     * @returns {number}
     */
    get rotation() { return this.#currentRotation; }

    /**
     * 외부에서 회전각을 강제로 설정 (동기화용)
     * @param {number} angle - 설정할 회전각 (도)
     */
    setRotation(angle) {
        this.#currentRotation = angle;
        this.#lastRotation = angle;
        // 드래그 중인 상태에서 강제 설정될 경우를 대비해 초기화
        this.#dragging = false;
    }

    /**
     * 현재 줌 배율
     * @readonly
     * @returns {number}
     */
    get scale() { return this.#scale; }

    /**
     * 현재 패닝 X 오프셋
     * @readonly
     * @returns {number}
     */
    get panX() { return this.#panX; }

    /**
     * 현재 패닝 Y 오프셋
     * @readonly
     * @returns {number}
     */
    get panY() { return this.#panY; }

    #setupEventListeners() {
        if ('onpointerdown' in window) {
            this.#parentDom.style.touchAction = 'none';
            this.#parentDom.addEventListener('pointerdown', this.#onPointerDown.bind(this), { passive: false });
            this.#parentDom.addEventListener('pointermove', this.#onPointerMove.bind(this), { passive: false });
            this.#parentDom.addEventListener('pointerup', this.#onPointerUp.bind(this), { passive: false });
            this.#parentDom.addEventListener('pointercancel', this.#onPointerUp.bind(this), { passive: false });
            this.#parentDom.addEventListener('pointerleave', this.#onPointerUp.bind(this), { passive: false });
        } else if ('ontouchstart' in window) {
            this.#parentDom.addEventListener('touchstart', this.#onTouchStart.bind(this), { capture: true, passive: false });
            this.#parentDom.addEventListener('touchmove', this.#onTouchMove.bind(this), { capture: true, passive: false });
            this.#parentDom.addEventListener('touchend', this.#onTouchEnd.bind(this), { capture: true, passive: false });
            this.#parentDom.addEventListener('touchcancel', this.#onTouchEnd.bind(this), { capture: true, passive: false });
        } else {
            this.#parentDom.addEventListener('mousedown', this.#onMouseDown.bind(this));
            this.#parentDom.addEventListener('mousemove', this.#onMouseMove.bind(this));
            this.#parentDom.addEventListener('mouseup', this.#onMouseUp.bind(this));
            this.#parentDom.addEventListener('mouseleave', this.#onMouseUp.bind(this));
        }

        if ('onwheel' in this.#parentDom) {
            this.#parentDom.addEventListener('wheel', this.#onWheel.bind(this), { passive: false });
        }

        const isSafari = Env.isSafari();
        const isIPad = Env.isIPad();

        if (isSafari || isIPad) {
            this.#parentDom.addEventListener('gesturestart', this.#onGestureStart.bind(this), { passive: false });
            this.#parentDom.addEventListener('gesturechange', this.#onGestureChange.bind(this), { passive: false });
            this.#parentDom.addEventListener('gestureend', this.#onGestureEnd.bind(this), { passive: false });

            // Safari needs explicit touch preventDefault even with pointer events
            this.#parentDom.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
            this.#parentDom.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
        }

        // Prevent context menu
        document.addEventListener('contextmenu', e => {
            e.preventDefault();
            return false;
        });
    }

    // Mouse Events
    #onMouseDown(e) {
        this.#dragging = true;
        const rect = this.#parentDom.getBoundingClientRect();
        this.#screenCenterX = rect.left + rect.width * 0.5 + this.#panX;
        this.#screenCenterY = rect.top + rect.height * 0.5 + this.#panY;
        this.#dragDownX = e.pageX - this.#screenCenterX;
        this.#dragDownY = e.pageY - this.#screenCenterY;
    }

    #onMouseMove(e) {
        if (!this.#dragging) return;
        const r1 = Math.atan2(this.#dragDownY, this.#dragDownX);
        const r2 = Math.atan2(e.pageY - this.#screenCenterY, e.pageX - this.#screenCenterX);
        let deltaR = (r2 - r1) * AstroMath.R2D;

        // Wrap around handling
        if (deltaR > 180) deltaR -= 360;
        else if (deltaR < -180) deltaR += 360;

        this.#currentRotation = this.#lastRotation + deltaR;
        this.#applyTransform();
    }

    #onMouseUp(e) {
        if (this.#dragging) {
            this.#lastRotation = this.#currentRotation;
            this.#dragging = false;
        }
    }

    #onWheel(e) {
        e.preventDefault();
        const delta = -e.deltaY;
        let newScale = this.#scale + delta * 0.001;
        this.#scale = Math.max(this.#minScale, Math.min(this.#maxScale, newScale));
        this.#applyTransform();
    }

    // Touch Events
    #onTouchStart(e) {
        e.preventDefault();
        const rect = this.#parentDom.getBoundingClientRect();
        this.#screenCenterX = rect.left + rect.width * 0.5 + this.#panX;
        this.#screenCenterY = rect.top + rect.height * 0.5 + this.#panY;

        if (e.touches.length === 2) {
            this.#panning = true;
            this.#panStartX = (e.touches[0].pageX + e.touches[1].pageX) / 2;
            this.#panStartY = (e.touches[0].pageY + e.touches[1].pageY) / 2;
        } else if (e.touches.length === 1) {
            this.#dragging = true;
            const t = e.touches[0];
            this.#dragDownX = t.pageX - this.#screenCenterX;
            this.#dragDownY = t.pageY - this.#screenCenterY;
        }
    }

    #onTouchMove(e) {
        e.preventDefault();
        if (e.touches.length === 2 && this.#panning) {
            const cx = (e.touches[0].pageX + e.touches[1].pageX) / 2;
            const cy = (e.touches[0].pageY + e.touches[1].pageY) / 2;
            this.#panX += cx - this.#panStartX;
            this.#panY += cy - this.#panStartY;
            this.#panStartX = cx;
            this.#panStartY = cy;
        } else if (e.touches.length === 1 && !this.#panning) {
            const t = e.touches[0];
            const r1 = Math.atan2(this.#dragDownY, this.#dragDownX);
            const r2 = Math.atan2(t.pageY - this.#screenCenterY, t.pageX - this.#screenCenterX);
            let deltaR = (r2 - r1) * AstroMath.R2D;

            // Wrap around handling
            if (deltaR > 180) deltaR -= 360;
            else if (deltaR < -180) deltaR += 360;

            this.#currentRotation = this.#lastRotation + deltaR;
        }
        this.#applyTransform();
    }

    #onTouchEnd(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            this.#panning = false;
            const t = e.touches[0];
            this.#dragDownX = t.pageX - this.#screenCenterX;
            this.#dragDownY = t.pageY - this.#screenCenterY;
            return;
        }
        if (e.touches.length === 0) {
            if (!this.#panning) this.#lastRotation = this.#currentRotation;
            this.#dragging = false;
            this.#panning = false;
        }
    }

    // Pointer Events
    #onPointerDown(e) {
        e.preventDefault();
        this.#parentDom.setPointerCapture?.(e.pointerId);
        this.#pointers.set(e.pointerId, { x: e.pageX, y: e.pageY });

        const rect = this.#parentDom.getBoundingClientRect();
        this.#screenCenterX = rect.left + rect.width * 0.5 + this.#panX;
        this.#screenCenterY = rect.top + rect.height * 0.5 + this.#panY;

        const isMouse = e.pointerType === 'mouse';
        // Right click (button 2) triggers panning
        const isRightClick = e.button === 2;
        const wantPan = isMouse && (isRightClick || (e.buttons & 4) || e.shiftKey || e.altKey || e.ctrlKey || e.metaKey);

        if (this.#pointers.size === 1) {
            if (wantPan) {
                this.#dragging = false;
                this.#panning = true;
                this.#panPrevX = e.pageX;
                this.#panPrevY = e.pageY;
            } else {
                this.#dragging = true;
                this.#panning = false;
                this.#dragDownX = e.pageX - this.#screenCenterX;
                this.#dragDownY = e.pageY - this.#screenCenterY;
            }
        } else if (this.#pointers.size === 2) {
            const pts = Array.from(this.#pointers.values());
            this.#pinchPrevCenterX = (pts[0].x + pts[1].x) / 2;
            this.#pinchPrevCenterY = (pts[0].y + pts[1].y) / 2;
            this.#pinchStartDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
            this.#pinchStartScale = this.#scale;
            this.#currentRotation = this.#lastRotation;
            this.#panning = true;
        }
    }

    #onPointerMove(e) {
        if (!this.#pointers.has(e.pointerId)) return;
        e.preventDefault();
        this.#pointers.set(e.pointerId, { x: e.pageX, y: e.pageY });

        if (this.#pointers.size === 2 && this.#panning) {
            const pts = Array.from(this.#pointers.values());
            const cx = (pts[0].x + pts[1].x) / 2;
            const cy = (pts[0].y + pts[1].y) / 2;
            this.#panX += cx - this.#pinchPrevCenterX;
            this.#panY += cy - this.#pinchPrevCenterY;
            this.#pinchPrevCenterX = cx;
            this.#pinchPrevCenterY = cy;

            const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
            let next = this.#pinchStartScale * (dist / this.#pinchStartDist);
            this.#scale = Math.max(this.#minScale, Math.min(this.#maxScale, next));
        } else if (this.#pointers.size === 1 && this.#panning) {
            this.#panX += e.pageX - this.#panPrevX;
            this.#panY += e.pageY - this.#panPrevY;
            this.#panPrevX = e.pageX;
            this.#panPrevY = e.pageY;
        } else if (this.#pointers.size === 1 && this.#dragging && !this.#panning) {
            const r1 = Math.atan2(this.#dragDownY, this.#dragDownX);
            const r2 = Math.atan2(e.pageY - this.#screenCenterY, e.pageX - this.#screenCenterX);
            let deltaR = (r2 - r1) * AstroMath.R2D;

            // Wrap around handling
            if (deltaR > 180) deltaR -= 360;
            else if (deltaR < -180) deltaR += 360;

            this.#currentRotation = this.#lastRotation + deltaR;
        }
        this.#applyTransform();
    }

    #onPointerUp(e) {
        e.preventDefault();
        this.#pointers.delete(e.pointerId);

        if (this.#pointers.size === 0) {
            if (!this.#panning) this.#lastRotation = this.#currentRotation;
            this.#dragging = false;
            this.#panning = false;
        } else if (this.#pointers.size === 1) {
            const [t] = this.#pointers.values();
            this.#panning = false;
            this.#dragging = true;
            this.#dragDownX = t.x - this.#screenCenterX;
            this.#dragDownY = t.y - this.#screenCenterY;
        }
    }

    // Safari Gesture Events
    #onGestureStart(e) {
        e.preventDefault();
        this.#gestureStartScale = this.#scale;
    }

    #onGestureChange(e) {
        e.preventDefault();
        let next = this.#gestureStartScale * e.scale;
        this.#scale = Math.max(this.#minScale, Math.min(this.#maxScale, next));
        this.#applyTransform();
    }

    #onGestureEnd(e) {
        e.preventDefault();
    }

    #applyTransform() {
        if (this.onTransform) {
            this.onTransform(this.#currentRotation, this.#scale, this.#panX, this.#panY);
        }
    }
}

/**
 * 별자리판 메인 컨트롤러 클래스
 *
 * 인터랙티브 별자리판을 생성하고 관리합니다.
 * SVG.js를 사용하여 3개의 레이어로 구성됩니다:
 * - skyPanel: 별, 별자리, 좌표선, 날짜환 (고정)
 * - topPanel: 지평선, 시간환, 방위 (회전)
 * - infoPanel: 범례, 타이틀 (고정)
 *
 * @class
 * @example
 * const planisphere = new Planisphere({
 *     wrapperDomId: '#app',
 *     currentDate: new Date(),
 *     lon: 126.98,
 *     lat: 37.57,
 *     dgmt: 9
 * });
 */
class Planisphere {
    /**
     * 기본 테마 스타일
     * @static
     * @type {ThemeConfig}
     */
    static defaultStyles = THEMES.default;

    /**
     * 다크 테마 스타일
     * @static
     * @type {ThemeConfig}
     */
    static darkStyles = THEMES.dark;

    /**
     * 라이트 테마 스타일
     * @static
     * @type {ThemeConfig}
     */
    static lightStyles = THEMES.light;

    /** @type {HTMLElement} */
    #parentDom;
    /** @type {InputHandler} */
    #inputHandler;
    /** @type {import('@svgdotjs/svg.js').G} */
    #skyGroup;
    /** @type {import('@svgdotjs/svg.js').G} */
    #topGroup;
    /** @type {import('@svgdotjs/svg.js').G} */
    #infoGroup;
    /** @type {number} */
    #topPanelRotation = 0;
    /** @type {number} */
    #skyRotation = 0;

    /** @type {string} */
    #version;
    /** @type {number} */
    #width = 1000;
    /** @type {number} */
    #height = 1000;
    /** @type {number} */
    #centerX = 500;
    /** @type {number} */
    #centerY = 500;
    /** @type {number} */
    #deltaX = 30;
    /** @type {number} */
    #deltaY = 30;
    /** @type {number} */
    #radius;
    /** @type {number} */
    #intervalRA = 2;
    /** @type {number} */
    #intervalDE = 30;
    /** @type {AstroVector} */
    #horVector = new AstroVector();
    /** @type {AstroVector} */
    #equVector = new AstroVector();
    /** @type {AstroMatrix} */
    #horToEquMatrix = new AstroMatrix(0, 0, 0, 0, 0, 0, 0, 0, 0);

    /** @type {Date} */
    #currentDate;
    /** @type {AstroTime} */
    #astroTime;
    /** @type {number} */
    #deltaCulminationTime;
    /** @type {number} */
    #lct;
    /** @type {number} */
    #ut;
    /** @type {number} */
    #gst;
    /** @type {number} */
    #lst;
    /** @type {EquiDistanceProjection} */
    #proj;
    /** @type {number} */
    #limitDE;

    /** @type {SVG.Doc} */
    #skyPanel;
    /** @type {SVG.Doc} */
    #topPanel;
    /** @type {SVG.Doc} */
    #infoPanel;

    /** @type {ThemeConfig} */
    #styles;
    /** @type {string} */
    #tzName;
    /** @type {number} */
    #dgmt;

    // Initial parameters (stored in constructor, used in initialize)
    /** @type {string} */
    #wrapperDomId;
    /** @type {number} */
    #initialLon;
    /** @type {number} */
    #initialLat;
    /** @type {number} */
    #initialDgmt;
    /** @type {string} */
    #initialTzName;
    /** @type {Object} */
    #initialStyles;

    /**
     * Planisphere 인스턴스 생성
     * @param {Object} options - 생성 옵션
     * @param {string} options.wrapperDomId - 래퍼 DOM 셀렉터 (예: '#planisphere')
     * @param {Date} [options.currentDate=new Date()] - 초기 날짜/시간
     * @param {number} [options.lon=126.98] - 경도 (동경 양수, -180 ~ 180)
     * @param {number} [options.lat=37.57] - 위도 (북위 양수, ±20° ~ ±90°)
     * @param {number} [options.dgmt] - UTC 오프셋 (미지정 시 lon 기반 자동 계산)
     * @param {string} [options.tzName] - 타임존 이름
     * @param {Object} [options.styles={}] - 커스텀 스타일 오버라이드
     * @throws {Error} wrapperDomId가 없거나, 위도가 범위를 벗어난 경우
     */
    constructor({
        wrapperDomId,
        currentDate = new Date(),
        lon = DEFAULT_LONGITUDE,
        lat = DEFAULT_LATITUDE,
        dgmt,
        tzName,
        styles = {}
    }) {
        if (!wrapperDomId) throw new Error("wrapperDomId는 필수입니다.");
        if (lat < -90 || lat > 90) throw new Error("위도(lat)는 -90° ~ +90° 범위여야 합니다.");
        if (Math.abs(lat) < 10) throw new Error("적도 ±10° 이내에서는 별자리판 생성이 불안정합니다.");

        // 경도 정규화
        lon = ((lon + 180) % 360 + 360) % 360 - 180;

        // 매개변수 저장 (initialize()에서 사용)
        this.#wrapperDomId = wrapperDomId;
        this.#currentDate = currentDate;
        this.#initialLon = lon;
        this.#initialLat = lat;
        this.#initialDgmt = dgmt ?? 0;
        this.#initialTzName = tzName || "";
        this.#initialStyles = styles;
    }

    /**
     * 비동기 초기화 메서드
     * 
     * 생성자 호출 후 반드시 이 메서드를 호출하여 타임존 정보를 완전히 초기화해야 합니다.
     * 생성자에서 tzName이 제공되지 않은 경우, 이 메서드가 실제 타임존 이름을 로드합니다.
     * 
     * @returns {Promise<void>}
     */
    async initialize() {
        // 1. 타임존 설정
        this.#tzName = this.#initialTzName;
        this.#dgmt = this.#initialDgmt;

        // 타임존 이름이 제공되지 않은 경우 라이브러리에서 가져오기
        if (!this.#tzName) {
            const resolvedTzName = await TimezoneService.getTimezoneName(
                this.#initialLat,
                this.#initialLon
            );
            if (resolvedTzName) {
                this.#tzName = resolvedTzName;
            }
        }

        // dgmt 계산: tzName이 있으면 타임존 기반, 없으면 지리적 오프셋
        if (this.#dgmt === 0) {
            if (this.#tzName) {
                this.#dgmt = TimezoneService.getOffsetFromTimezone(this.#tzName);
            } else {
                this.#dgmt = TimezoneService.getGeographicOffset(this.#initialLon);
            }
        }

        // 2. 스타일 설정
        this.#styles = Object.assign({}, Planisphere.defaultStyles, this.#initialStyles);

        // 3. 좌표 관련 초기화
        this.#version = VERSION;
        this.#radius = this.#width * 0.5 - this.#deltaX * 2;
        this.#astroTime = new AstroTime(this.#dgmt, this.#initialLon, this.#initialLat);
        this.#deltaCulminationTime = this.#astroTime.dgmt * AstroMath.H2R - this.#astroTime.glon;
        this.#lct = AstroTime.jd(this.#currentDate.getFullYear(), this.#currentDate.getMonth() + 1, this.#currentDate.getDate(), this.#currentDate.getHours(), this.#currentDate.getMinutes(), this.#currentDate.getSeconds());
        this.#ut = this.#astroTime.LCT2UT(this.#lct);
        this.#gst = AstroTime.UT2GST(this.#ut);
        this.#lst = this.#astroTime.LCT2LST(this.#lct);
        this.#proj = new EquiDistanceProjection(this.#radius, this.#initialLat * AstroMath.D2R);
        this.#limitDE = this.#proj.limitDE;

        // 4. DOM 설정
        const wrapper = document.querySelector(this.#wrapperDomId);
        wrapper.innerHTML = '';
        wrapper.style.position = 'relative';
        wrapper.style.width = '100%';
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.justifyContent = 'center';
        wrapper.style.overflow = 'hidden';

        // 실제 높이가 0이면(CSS 등에 정의되지 않았으면) 기본값 지정
        const computedHeight = parseFloat(window.getComputedStyle(wrapper).height);
        if (isNaN(computedHeight) || computedHeight <= 0) {
            wrapper.style.height = '600px';
        }

        // planisphere 영역 생성
        const planisphereDiv = document.createElement('div');
        planisphereDiv.style.flex = '0 0 auto';
        planisphereDiv.style.touchAction = 'none';
        planisphereDiv.style.position = 'relative';
        wrapper.appendChild(planisphereDiv);

        // 부모 Dom
        this.#parentDom = planisphereDiv;

        // 5. SVG 패널 생성
        // Sky
        this.#skyPanel = SVG().addTo(this.#parentDom)
            .attr('preserveAspectRatio', 'xMidYMin meet')
            .css({ position: 'absolute', left: 0, right: 0, overflow: 'visible' })
            .viewbox(-this.#centerX, -this.#centerY, this.#width, this.#height);
        this.#skyPanel.node.style.touchAction = 'none';
        this.#skyGroup = this.#skyPanel.group();

        // Top
        this.#topPanel = SVG().addTo(this.#parentDom)
            .attr('preserveAspectRatio', 'xMidYMin meet')
            .css({ position: 'absolute', left: 0, right: 0, overflow: 'visible' })
            .viewbox(-this.#centerX, -this.#centerY, this.#width, this.#height);
        this.#topPanel.node.style.touchAction = 'none';
        this.#topGroup = this.#topPanel.group();

        // Info
        this.#infoPanel = SVG().addTo(this.#parentDom)
            .attr('preserveAspectRatio', 'xMidYMin meet')
            .css({ position: 'absolute', left: 0, right: 0, overflow: 'visible' })
            .viewbox(-this.#centerX, -this.#centerY, this.#width, this.#height);
        this.#infoPanel.node.style.touchAction = 'none';
        this.#infoGroup = this.#infoPanel.group();

        // 6. InputHandler 설정
        this.#inputHandler = new InputHandler(this.#parentDom, {
            onTransform: (rotation, scale, panX, panY) => {
                this.#applyTransform(rotation, scale, panX, panY);
            }
        });

        // 7. 창 크기 변경 이벤트
        window.addEventListener('resize', this.#resize.bind(this));

        // 8. 초기 렌더링 수행
        this.setStyles(this.#styles, true);
    }

    /** @type {Date} */
    get currentDate() { return this.#currentDate; }
    /** @type {number} */
    get lon() { return this.#astroTime.glon * AstroMath.R2D; }
    /** @type {number} */
    get lat() { return this.#astroTime.glat * AstroMath.R2D; }
    /** @type {number} */
    get dgmt() { return this.#astroTime.dgmt; }
    /** @type {string} */
    get tzName() { return this.#tzName; }
    /**
     * 런타임 스타일 변경
     *
     * 현재 스타일에 새 스타일을 병합하고 다시 렌더링합니다.
     *
     * @param {Object} newStyles - 적용할 스타일 객체
     *   (Planisphere.defaultStyles, darkStyles, lightStyles 또는 커스텀)
     * @param {boolean} [isInit=false] - 초기화 여부 (내부 사용)
     */
    setStyles(newStyles, isInit = false) {
        // 현재 스타일을 교체
        this.#styles = Object.assign({}, this.#styles, newStyles);

        // 배경색 등 wrapper 스타일 업데이트
        this.#parentDom.parentElement.style.background =
            'linear-gradient(to bottom, ' + this.#styles.gradientBackgroundColor[0] + ', ' + this.#styles.gradientBackgroundColor[1] + ')';

        // 패널 다시 그리기
        this.#skyGroup.clear();
        this.#topGroup.clear();
        this.#infoGroup.clear();
        this.#render();
        if (isInit) {
            this.#rotateCurrentDate(true);
            this.#resize();
        } else {
            this.#applyTransform();
        }
    }
    /**
     * Public API: 날짜/시간 변경
     * @param {Date} dateObj - 설정할 날짜 객체
     */
    setDateTime(dateObj) {
        if (!(dateObj instanceof Date)) {
            throw new TypeError('dateObj must be a Date object');
        }

        this.#currentDate = dateObj;
        const Y = dateObj.getFullYear();
        const M = dateObj.getMonth() + 1;
        const D = dateObj.getDate();
        const h = dateObj.getHours();
        const m = dateObj.getMinutes();
        const s = dateObj.getSeconds();

        this.#lct = AstroTime.jd(Y, M, D, h, m, s);
        this.#lst = this.#astroTime.LCT2LST(this.#lct);

        // 회전값 갱신 및 InputHandler 동기화 (false: 수동 변경 시 jump 방지)
        this.#rotateCurrentDate(false);
    }

    /**
     * Public API: 관측 위치 변경
     * @param {number} lon - 경도 (-180 ~ 180)
     * @param {number} lat - 위도 (-90 ~ 90)
     * @param {number} [dgmt] - (Optional) 새로운 UTC 오프셋. 생략 시 기존 값 유지.
     * @param {string} [tzName] - (Optional) 새로운 타임존 이름. 생략 시 기존 값 유지.
     */
    async setLocation(lon, lat, dgmt, tzName) {
        // 경도 정규화
        lon = ((lon + 180) % 360 + 360) % 360 - 180;

        if (lat < -90 || lat > 90) {
            throw new RangeError('위도(lat)는 -90° ~ +90° 범위여야 합니다.');
        }
        if (Math.abs(lat) < 10) {
            throw new RangeError('적도 ±10° 이내에서는 별자리판 생성이 불안정합니다.');
        }

        // 시간대 설정 (명시적 값이 없으면 신규 좌표 기반으로 재계산)
        const finalTzName = (tzName != null) ? tzName : (await TimezoneService.getTimezoneName(lat, lon) || this.#tzName);
        const finalDgmt = (dgmt != null) ? dgmt : (finalTzName ? TimezoneService.getOffsetFromTimezone(finalTzName) : TimezoneService.getGeographicOffset(lon));

        this.#tzName = finalTzName;
        this.#dgmt = finalDgmt;
        this.#astroTime = new AstroTime(this.#dgmt, lon, lat);
        this.#deltaCulminationTime = this.#astroTime.dgmt * AstroMath.H2R - this.#astroTime.glon;

        // 투영 재생성
        this.#proj = new EquiDistanceProjection(this.#radius, lat * AstroMath.D2R);
        this.#limitDE = this.#proj.limitDE;

        // LST 갱신 (위치 필수 업데이트 항목)
        this.#lst = this.#astroTime.LCT2LST(this.#lct);

        // 전체 다시 그리기
        this.#skyGroup.clear();
        this.#topGroup.clear();
        this.#infoGroup.clear();
        this.#render();
        this.#rotateCurrentDate(true);
    }

    /**
     * Public API: 테마 변경
     * @param {string} themeName - 'default', 'dark', 'light' 중 하나
     */
    setTheme(themeName) {
        let themeStyles;
        switch (themeName) {
            case 'default':
                themeStyles = Planisphere.defaultStyles;
                break;
            case 'dark':
                themeStyles = Planisphere.darkStyles;
                break;
            case 'light':
                themeStyles = Planisphere.lightStyles;
                break;
            default:
                throw new Error(`Unknown theme: ${themeName}. Use 'default', 'dark', or 'light'.`);
        }
        this.setStyles(themeStyles, false);
    }

    /**
     * Public API: 명시적 렌더링
     * 별자리판을 다시 그립니다.
     */
    render() {
        this.#skyGroup.clear();
        this.#topGroup.clear();
        this.#infoGroup.clear();
        this.#render();
        this.#rotateCurrentDate(false);
    }

    #rotateCurrentDate(isResetInput = true) {
        // Local Sidereal Time 만큼 회전시켜준다.
        // 즉, 남중해야할 별이 화면 아래(South/North)로 향하게 한다.
        const lstDeg = AstroTime.jd2Time(this.#lst) * AstroMath.H2R * AstroMath.R2D;
        const direction = this.#proj.isSouthern ? -1 : 1;
        let rotation = -(direction * lstDeg - 90.0);
        this.#skyRotation = rotation;
        if (isResetInput) this.#topPanelRotation = rotation;

        // InputHandler의 상태를 현재 계산된 회전값으로 강제 동기화하여 
        // 다음 드래그 시 '튀는' 현상을 방지합니다.
        this.#inputHandler.setRotation(rotation);

        this.#applyTransform(rotation, this.#inputHandler.scale, this.#inputHandler.panX, this.#inputHandler.panY);
    }

    #applyTransform(rotation, scale, panX, panY) {
        // 인자가 생략된 경우 (예: setTheme 호출 시) InputHandler의 현재 상태를 사용
        if (rotation == null) rotation = this.#inputHandler.rotation;
        if (scale == null) scale = this.#inputHandler.scale;
        if (panX == null) panX = this.#inputHandler.panX;
        if (panY == null) panY = this.#inputHandler.panY;

        // 현재 회전상태를 저장 (동기화)
        this.#skyRotation = rotation;

        this.#skyGroup.transform({
            rotate: rotation,
            translate: [panX, panY],
            scale: scale,
            ox: 0, oy: 0
        });
        this.#topGroup.transform({
            rotate: this.#topPanelRotation,
            translate: [panX, panY],
            scale: scale,
            ox: 0, oy: 0
        });
        this.#infoGroup.transform({
            rotate: 0,
            translate: [panX, panY],
            scale: scale,
            ox: 0, oy: 0
        });
    }
    #resize(e) {
        const wrapper = this.#parentDom.parentElement;
        const w = wrapper.offsetWidth;
        const h = wrapper.offsetHeight;
        const size = Math.min(w, h);

        // 브라우저 확대/축소 비율 반영
        //const scale = window.devicePixelRatio || 1;
        const scale = 1;

        this.#parentDom.style.width = (size * scale) + 'px';
        this.#parentDom.style.height = (size * scale) + 'px';
    }

    #render() {
        this.#renderSkyPanel();
        this.#renderTopPanel();
        this.#renderInfoPanel();
    }

    #renderSkyPanel() {
        const renderer = new SkyPanelRenderer(
            this.#skyGroup,
            this.#proj,
            this.#styles,
            this.#astroTime,
            this.#radius,
            this.#limitDE,
            this.#intervalRA,
            this.#intervalDE,
            this.#currentDate
        );
        renderer.render();
    }
    #renderTopPanel() {
        const renderer = new TimeRingRenderer(
            this.#topGroup,
            this.#proj,
            this.#styles,
            this.#astroTime,
            this.#radius,
            this.#currentDate,
            this.#horToEquMatrix,
            this.#horVector,
            this.#equVector,
            this.#deltaCulminationTime
        );
        renderer.render();
    }
    #renderInfoPanel() {
        const renderer = new InfoPanelRenderer(
            this.#infoGroup,
            this.#styles,
            this.#version,
            this.#astroTime.glat
        );
        renderer.render();
    }

}

// Planisphere 클래스 export (ES6 모듈로 사용)
export default Planisphere;