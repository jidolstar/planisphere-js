/**
 * @fileoverview 별자리판 JS - 렌더링 모듈
 * @author 지용호 <jidolstar@gmail.com>
 * @version 1.0.0
 * @license MIT
 *
 * @description
 * 별자리판의 모든 SVG 렌더링 로직을 담당합니다.
 *
 * 주요 컴포넌트:
 * - THEMES: 색상 테마 정의 (default, dark, light)
 * - SkyPanelRenderer: 하늘 패널 (별, 별자리, 좌표선)
 * - TimeRingRenderer: 시간환 (지평선, 시간 눈금, 방위)
 * - InfoPanelRenderer: 정보 패널 (범례, 타이틀)
 *
 * @requires SVG.js
 */

import { AstroMath, AstroTime } from './astronomy.js';
import { STARS_DATA, CONSTELLATION_LINES, CONSTELLATION_NAMES } from './models.js';

/**
 * Cross-platform font stack
 * @constant {string}
 */
const FONT_FAMILY = "'Inconsolata', 'Menlo', 'Consolas', 'Monaco', monospace";

/**
 * 별자리판 색상 테마 정의
 *
 * 3가지 미리 정의된 테마를 제공합니다:
 * - default: 기본 테마 (파란색 날짜환, 주황색 시간환)
 * - dark: 다크 테마 (어두운 배경, 녹색 계열 강조)
 * - light: 라이트 테마 (밝은 배경, 파란색 계열)
 *
 * @constant {Object.<string, ThemeConfig>}
 * @property {ThemeConfig} default - 기본 테마
 * @property {ThemeConfig} dark - 다크 모드 테마
 * @property {ThemeConfig} light - 라이트 모드 테마
 *
 * @example
 * import { THEMES } from './renderers.js';
 * const theme = THEMES['dark'];
 * console.log(theme.bgColor); // '#000'
 */

/**
 * @typedef {Object} ThemeConfig
 * @property {string[]} gradientBackgroundColor - 배경 그라디언트 색상 [시작, 끝]
 * @property {string} bgColor - 하늘 영역 배경색
 * @property {string} raLineColor - 적경선 색상
 * @property {number} raLineStroke - 적경선 두께
 * @property {string} decLineColor1 - 적위선 기본 색상
 * @property {string} decLineColor2 - 적위선 강조 색상 (천구 적도)
 * @property {number} decLineStroke - 적위선 두께
 * @property {string} raTextColor - 적경 텍스트 색상
 * @property {number} raTextSize - 적경 텍스트 크기
 * @property {string} dateCircleBgColor - 날짜환 배경색
 * @property {{width: number, color: string}} dateCircleOuterStroke - 날짜환 외곽선
 * @property {{width: number, color: string}} dateCircleInnerStroke - 날짜환 내곽선
 * @property {string} dateColor - 날짜 텍스트 색상
 * @property {number} dateMonthTextSize - 월 텍스트 크기
 * @property {number} dateDayTextSize - 일 텍스트 크기
 * @property {string} conNameTextColor - 별자리명 색상
 * @property {number} conNameTextSize - 별자리명 크기
 * @property {string} conlineColor - 별자리선 색상
 * @property {number} conlineOpacity - 별자리선 투명도
 * @property {string} topPanelBgColor - 시간환 배경색
 * @property {{width: number, color: string}} topPanelStroke - 시간환 테두리
 * @property {string} timeLineColor - 시간 눈금 색상
 * @property {number} timeLineStroke - 시간 눈금 두께
 * @property {string} timeTextColor - 시간 텍스트 색상
 * @property {number} timeTextSize - 시간 텍스트 크기
 * @property {string} legendColor - 범례 색상
 * @property {number} legendTextSize - 범례 텍스트 크기
 * @property {string} nwesColor - 방위 텍스트 색상
 * @property {number} nwesTextSize - 방위 텍스트 크기
 * @property {Object.<string, string>} starColors - 분광형별 별 색상
 */
export const THEMES = {
    default: {
        gradientBackgroundColor: ['#777794', '#adb2ce'],
        bgColor: '#000',
        raLineColor: '#aaa',
        raLineStroke: 1,
        decLineColor1: '#aaa',
        decLineColor2: '#facc99',
        decLineStroke: 1,
        raTextColor: '#fff',
        raTextSize: 10,
        dateCircleBgColor: '#3d44aa',
        dateCircleOuterStroke: { width: 6, color: '#000' },
        dateCircleInnerStroke: { width: 3, color: '#000' },
        dateColor: '#fff',
        dateMonthTextSize: 11,
        dateDayTextSize: 10,
        conNameTextColor: '#AACC00',
        conNameTextSize: 10,
        conlineColor: '#f06',
        conlineOpacity: 0.7,
        topPanelBgColor: '#ffaa00',
        topPanelStroke: { width: 3, color: '#000' },
        timeLineColor: '#000',
        timeLineStroke: 1,
        timeTextColor: '#000',
        timeTextSize: 11,
        legendColor: '#000',
        legendTextSize: 11,
        nwesColor: '#000',
        nwesTextSize: 12,
        starColors: {
            O: '#9bb0ff',
            B: '#aabfff',
            A: '#cad7ff',
            F: '#f8f7ff',
            G: '#fff4ea',
            K: '#ffd2a1',
            M: '#ffcc6f',
            default: '#fff'
        }
    },

    dark: {
        gradientBackgroundColor: ['#1a1a1a', '#333333'],
        bgColor: '#000',
        raLineColor: '#666',
        raLineStroke: 1,
        decLineColor1: '#444',
        decLineColor2: '#777',
        decLineStroke: 1,
        raTextColor: '#ccc',
        raTextSize: 10,
        dateCircleBgColor: '#222266',
        dateCircleOuterStroke: { width: 6, color: '#444' },
        dateCircleInnerStroke: { width: 3, color: '#666' },
        dateColor: '#eee',
        dateMonthTextSize: 11,
        dateDayTextSize: 10,
        conNameTextColor: '#88cc44',
        conNameTextSize: 10,
        conlineColor: '#44cc88',
        conlineOpacity: 0.6,
        topPanelBgColor: '#333333',
        topPanelStroke: { width: 3, color: '#555' },
        timeLineColor: '#888',
        timeLineStroke: 1,
        timeTextColor: '#ccc',
        timeTextSize: 11,
        legendColor: '#ccc',
        legendTextSize: 11,
        nwesColor: '#ccc',
        nwesTextSize: 12,
        starColors: {
            O: '#9bb0ff',
            B: '#aabfff',
            A: '#cad7ff',
            F: '#f8f7ff',
            G: '#fff4ea',
            K: '#ffd2a1',
            M: '#ffcc6f',
            default: '#fff'
        }
    },

    light: {
        gradientBackgroundColor: ['#e6e6f0', '#ffffff'],
        bgColor: '#fff',
        raLineColor: '#444',
        raLineStroke: 1,
        decLineColor1: '#666',
        decLineColor2: '#999',
        decLineStroke: 1,
        raTextColor: '#000',
        raTextSize: 10,
        dateCircleBgColor: '#dde5ff',
        dateCircleOuterStroke: { width: 6, color: '#aaa' },
        dateCircleInnerStroke: { width: 3, color: '#888' },
        dateColor: '#000',
        dateMonthTextSize: 11,
        dateDayTextSize: 10,
        conNameTextColor: '#224488',
        conNameTextSize: 10,
        conlineColor: '#2266cc',
        conlineOpacity: 0.7,
        topPanelBgColor: '#f2f2f2',
        topPanelStroke: { width: 3, color: '#bbb' },
        timeLineColor: '#444',
        timeLineStroke: 1,
        timeTextColor: '#000',
        timeTextSize: 11,
        legendColor: '#222',
        legendTextSize: 11,
        nwesColor: '#222',
        nwesTextSize: 12,
        starColors: {
            O: '#3366ff',
            B: '#4d7fff',
            A: '#668cff',
            F: '#9999ff',
            G: '#cc9900',
            K: '#ff6600',
            M: '#cc0000',
            default: '#222'
        }
    }
};

/**
 * 하늘 패널 렌더러 (별자리판 메인 부분)
 *
 * 별자리판의 고정된 하늘 부분을 렌더링합니다:
 * - 날짜환: 1년 365/366일의 날짜 눈금
 * - 적경선/적위선: 천구 좌표계 그리드
 * - 별: 밝기와 분광형에 따른 색상/크기
 * - 별자리선: 88개 별자리 연결선
 * - 별자리명: 한글 별자리 이름
 *
 * @class
 * @example
 * const renderer = new SkyPanelRenderer(
 *     canvas, proj, styles, astroTime,
 *     300, -30 * D2R, 2, 10, new Date()
 * );
 * renderer.render();
 */
export class SkyPanelRenderer {
    /**
     * SkyPanelRenderer 인스턴스 생성
     * @param {SVG.Container} canvas - SVG.js 캔버스 객체
     * @param {EquiDistanceProjection} proj - 등거리 투영 객체
     * @param {ThemeConfig} styles - 테마 스타일 설정
     * @param {AstroTime} astroTime - 천문 시간 변환 객체
     * @param {number} radius - 하늘 패널 반경 (픽셀)
     * @param {number} limitDE - 적위 하한 (라디안)
     * @param {number} intervalRA - 적경선 간격 (시간)
     * @param {number} intervalDE - 적위선 간격 (도)
     * @param {Date} currentDate - 현재 날짜/시간
     */
    constructor(canvas, proj, styles, astroTime, radius, limitDE, intervalRA, intervalDE, currentDate) {
        /** @type {SVG.Container} */
        this.canvas = canvas;
        /** @type {EquiDistanceProjection} */
        this.proj = proj;
        /** @type {ThemeConfig} */
        this.styles = styles;
        /** @type {AstroTime} */
        this.astroTime = astroTime;
        /** @type {number} */
        this.radius = radius;
        /** @type {number} */
        this.limitDE = limitDE;
        /** @type {number} */
        this.intervalRA = intervalRA;
        /** @type {number} */
        this.intervalDE = intervalDE;
        /** @type {Date} */
        this.currentDate = currentDate;
    }

    /**
     * 하늘 패널 전체 렌더링
     *
     * 다음 순서로 레이어를 그립니다:
     * 1. 날짜환 (가장 바깥)
     * 2. 적경선/적위선 (좌표 그리드)
     * 3. 별자리선
     * 4. 별
     * 5. 별자리명 (가장 위)
     */
    render() {
        const diameter = this.radius * 2;
        const cx = 0;
        const cy = 0;
        const year = this.currentDate.getFullYear();
        const daysInYear = this.astroTime.daysInYear(year);
        const dailyStep = AstroMath.TPI / daysInYear;
        let path = '';

        // 날짜 눈금 부분
        this.#renderDateRing(cx, cy, diameter, year, dailyStep);

        // 적경선과 적위선
        this.#renderRALines(cx, cy);
        this.#renderDECLines(cx, cy);

        // 별자리선
        this.#renderConstellationLines(cx, cy);

        // 별
        this.#renderStars(cx, cy);

        // 별자리명
        this.#renderConstellationNames(cx, cy);
    }

    #renderDateRing(cx, cy, diameter, year, dailyStep) {
        const canvas = this.canvas;

        // 날짜환 원들
        canvas.circle(diameter + 85).center(cx, cy).stroke({
            width: this.styles.dateCircleOuterStroke.width,
            color: this.styles.dateCircleOuterStroke.color
        });
        canvas.circle(diameter + 85).center(cx, cy).fill(this.styles.dateCircleBgColor);
        canvas.circle(diameter).center(cx, cy).stroke({
            width: this.styles.dateCircleInnerStroke.width,
            color: this.styles.dateCircleInnerStroke.color
        });
        canvas.circle(diameter).center(cx, cy).fill(this.styles.bgColor);
        canvas.circle(diameter + 45).center(cx, cy).fill('none').stroke({
            width: 1,
            color: this.styles.dateColor
        });

        // 월 표시
        for (let month = 1; month <= 12; month++) {
            const midDay = AstroTime.monthMidDay(year, month) + 1;
            const hour = this.astroTime.hourForDateRing(year, month, midDay);
            const lct = AstroTime.jd(year, month, midDay, hour, 0, 0);
            const lst = this.astroTime.LCT2LST(lct);
            const ra = AstroTime.jd2Time(lst) * AstroMath.H2R;
            let { x, y } = this.proj.project(ra + dailyStep / 2, this.limitDE);
            let t = Math.atan2(y, x);
            let r = this.radius + 30;
            x = r * Math.cos(t);
            y = r * Math.sin(t);
            canvas.text(`${month}월`).attr('text-anchor', 'middle').center(cx + x, cy + y)
                .transform({ rotate: AstroMath.R2D * (Math.atan2(y, x) - AstroMath.HPI) })
                .font({
                    fill: this.styles.dateColor,
                    size: this.styles.dateMonthTextSize,
                    family: FONT_FAMILY,
                    opacity: 0.8
                });
        }

        // 월 경계선
        let path = '';
        for (let month = 1; month <= 12; month++) {
            const hour = this.astroTime.hourForDateRing(year, month, 1);
            const lct = AstroTime.jd(year, month, 1, hour, 0, 0);
            const lst = this.astroTime.LCT2LST(lct);
            const ra = AstroTime.jd2Time(lst) * AstroMath.H2R;
            const { x, y } = this.proj.project(ra + dailyStep / 2, this.limitDE);
            const t = Math.atan2(y, x);
            const r1 = this.radius + 17;
            const x1 = r1 * Math.cos(t);
            const y1 = r1 * Math.sin(t);
            const r2 = this.radius + 42;
            const x2 = r2 * Math.cos(t);
            const y2 = r2 * Math.sin(t);
            path += `M${cx + x1} ${cy + y1} L${cx + x2} ${cy + y2} `;
        }
        canvas.path(path).fill('none').stroke({
            color: this.styles.dateColor,
            width: 1,
            linecap: 'round',
            linejoin: 'round',
            opacity: 1
        });

        // 일 경계선
        path = '';
        const daysPerMonth = AstroTime.monthDayCounts(year);
        for (let month = 1; month <= 12; month++) {
            const days = daysPerMonth[month - 1];
            for (let dayOfMonth = 1; dayOfMonth <= days; dayOfMonth++) {
                const hour = this.astroTime.hourForDateRing(year, month, dayOfMonth);
                const lct = AstroTime.jd(year, month, dayOfMonth, hour, 0, 0);
                const lst = this.astroTime.LCT2LST(lct);
                const ra = AstroTime.jd2Time(lst) * AstroMath.H2R;
                const { x, y } = this.proj.project(ra + dailyStep / 2, this.limitDE);
                const t = Math.atan2(y, x);
                const r1 = this.radius + 2;
                const x1 = r1 * Math.cos(t);
                const y1 = r1 * Math.sin(t);
                let r2 = r1 + 2;
                if (dayOfMonth !== 1) {
                    if (dayOfMonth % 10 === 0) {
                        const x2txt = (r1 + 9) * Math.cos(t - 0.05 * AstroMath.D2R);
                        const y2txt = (r1 + 9) * Math.sin(t - 0.05 * AstroMath.D2R);
                        canvas.text(`${dayOfMonth}`).attr('text-anchor', 'middle').center(cx + x2txt, cy + y2txt)
                            .transform({ rotate: AstroMath.R2D * (Math.atan2(y2txt, x2txt) - AstroMath.HPI) })
                            .font({
                                fill: this.styles.dateColor,
                                size: this.styles.dateDayTextSize,
                                family: FONT_FAMILY,
                                opacity: 0.8
                            });
                        r2 = r1 + 6;
                    } else if (dayOfMonth % 5 === 0) {
                        r2 = r1 + 5;
                    }
                } else {
                    r2 = r1 + 15;
                }
                const x2 = r2 * Math.cos(t);
                const y2 = r2 * Math.sin(t);
                path += `M${cx + x1} ${cy + y1} L${cx + x2} ${cy + y2} `;
            }
        }
        canvas.path(path).fill('none').stroke({
            color: this.styles.dateColor,
            width: 1,
            linecap: 'round',
            linejoin: 'round',
            opacity: 1
        });
    }

    #renderRALines(cx, cy) {
        // 적경선
        let path = '';
        for (let ra = 0; ra < 24; ra = ra + this.intervalRA) {
            const { x, y } = this.proj.project(ra * AstroMath.H2R, this.limitDE);
            path += `M${cx} ${cy} L${cx + x} ${cy + y} `;
        }
        this.canvas.path(path).fill('none').stroke({
            color: this.styles.raLineColor,
            width: this.styles.raLineStroke,
            linecap: 'round',
            linejoin: 'round',
            opacity: 0.4
        });

        // 적경값
        for (let ra = 0; ra < 24; ra = ra + this.intervalRA) {
            const { x, y } = this.proj.project(ra * AstroMath.H2R, -3 * AstroMath.D2R);
            this.canvas.text(`${ra}h`).attr('text-anchor', 'middle').center(cx + x, cy + y)
                .font({
                    fill: this.styles.raTextColor,
                    size: this.styles.raTextSize,
                    family: FONT_FAMILY
                })
                .transform({ rotate: AstroMath.R2D * (Math.atan2(y, x) - AstroMath.HPI) });
        }
    }

    #renderDECLines(cx, cy) {
        // 적위선
        for (let dec = -90.0; dec < 90.0; dec += this.intervalDE) {
            const { x, y } = this.proj.project(0, dec * AstroMath.D2R);
            if (Math.hypot(x, y) < this.proj.screenRadius) {
                let color = this.styles.decLineColor1;
                let opacity = 0.4;
                if (Math.abs(dec) < 0.00001) {
                    color = this.styles.decLineColor2;
                    opacity = 0.7;
                }
                this.canvas.circle(x * 2).center(cx, cy).fill('none').stroke({
                    color,
                    width: this.styles.decLineStroke,
                    opacity
                });
            }
        }
    }

    #renderConstellationLines(cx, cy) {
        let path = '';
        for (let i = 0; i < CONSTELLATION_LINES.length; i += 4) {
            const { x: x1, y: y1 } = this.proj.project(CONSTELLATION_LINES[i], CONSTELLATION_LINES[i + 1]);
            const { x: x2, y: y2 } = this.proj.project(CONSTELLATION_LINES[i + 2], CONSTELLATION_LINES[i + 3]);
            if (Math.hypot(x1, y1) < this.proj.screenRadius && Math.hypot(x2, y2) < this.proj.screenRadius) {
                path += `M${cx + x1} ${cy + y1} L${cx + x2} ${cy + y2} `;
            }
        }
        this.canvas.path(path).fill('none').stroke({
            color: this.styles.conlineColor,
            width: 1,
            linecap: 'round',
            linejoin: 'round',
            opacity: this.styles.conlineOpacity
        });
    }

    #renderStars(cx, cy) {
        let stars = STARS_DATA.split("\n");
        for (let i = 0; i < stars.length; i++) {
            let star = stars[i].split(',');
            let ra = star[2];
            let dec = star[3];
            const { x, y } = this.proj.project(ra * AstroMath.H2R, dec * AstroMath.D2R);
            if (Math.hypot(x, y) < this.proj.screenRadius) {
                let mag = star[4];
                let type = star[5];
                let radius = 0.5;
                let alpha = 0.5;
                let color = this.styles.starColors[type] || this.styles.starColors['default'];
                if (mag < -1) { radius = 7; alpha = 1 }
                else if (mag < 0) { radius = 6; alpha = 1 }
                else if (mag < 1) { radius = 5; alpha = 1 }
                else if (mag < 2) { radius = 4; alpha = 1 }
                else if (mag < 3) { radius = 3; alpha = 0.8 }
                else if (mag < 4) { radius = 2; alpha = 0.8 }
                else if (mag < 5) { radius = 1; alpha = 0.5 }
                this.canvas.circle(radius * 2).center(cx + x, cy + y).fill({ color, alpha });
            }
        }
    }

    #renderConstellationNames(cx, cy) {
        for (let i = 0; i < CONSTELLATION_NAMES.length; i += 3) {
            const name = CONSTELLATION_NAMES[i + 2];
            const { x, y } = this.proj.project(CONSTELLATION_NAMES[i], CONSTELLATION_NAMES[i + 1]);
            if (Math.hypot(x, y) < this.proj.screenRadius - 30) {
                this.canvas.text(name).attr('text-anchor', 'middle').center(cx + x, cy + y)
                    .transform({ rotate: AstroMath.R2D * (Math.atan2(y, x) - AstroMath.HPI) })
                    .font({
                        fill: this.styles.conNameTextColor,
                        size: this.styles.conNameTextSize,
                        family: FONT_FAMILY,
                        opacity: 0.8
                    });
            }
        }
    }
}

/**
 * 시간환 렌더러 (회전 가능한 윗부분)
 *
 * 별자리판에서 관측 시각과 위치에 따라 회전하는 부분을 렌더링합니다:
 * - 지평선 커버: 지평선 아래 영역을 가림
 * - 시간 눈금: 24시간 눈금과 분 단위 표시
 * - 방위 표시: 동서남북 8방위
 *
 * @class
 * @example
 * const renderer = new TimeRingRenderer(
 *     canvas, proj, styles, astroTime, radius, currentDate,
 *     horToEquMatrix, horVector, equVector, deltaCulminationTime
 * );
 * renderer.render();
 */
export class TimeRingRenderer {
    /**
     * TimeRingRenderer 인스턴스 생성
     * @param {SVG.Container} canvas - SVG.js 캔버스 객체
     * @param {EquiDistanceProjection} proj - 등거리 투영 객체
     * @param {ThemeConfig} styles - 테마 스타일 설정
     * @param {AstroTime} astroTime - 천문 시간 변환 객체
     * @param {number} radius - 시간환 반경 (픽셀)
     * @param {Date} currentDate - 현재 날짜/시간
     * @param {AstroMatrix} horToEquMatrix - 지평→적도 좌표 변환 행렬
     * @param {AstroVector} horVector - 지평 좌표 벡터 (재사용)
     * @param {AstroVector} equVector - 적도 좌표 벡터 (재사용)
     * @param {number} deltaCulminationTime - 남중시 보정값
     */
    constructor(canvas, proj, styles, astroTime, radius, currentDate, horToEquMatrix, horVector, equVector, deltaCulminationTime) {
        /** @type {SVG.Container} */
        this.canvas = canvas;
        /** @type {EquiDistanceProjection} */
        this.proj = proj;
        /** @type {ThemeConfig} */
        this.styles = styles;
        /** @type {AstroTime} */
        this.astroTime = astroTime;
        /** @type {number} */
        this.radius = radius;
        /** @type {Date} */
        this.currentDate = currentDate;
        /** @type {AstroMatrix} */
        this.horToEquMatrix = horToEquMatrix;
        /** @type {AstroVector} */
        this.horVector = horVector;
        /** @type {AstroVector} */
        this.equVector = equVector;
        /** @type {number} */
        this.deltaCulminationTime = deltaCulminationTime;
    }

    render() {
        const diameter = this.radius * 2;
        const cx = 0;
        const cy = 0;
        let path = '';

        // 현재시간 지평좌표계->적도좌표계 행렬
        const lct = AstroTime.jd(
            this.currentDate.getFullYear(),
            this.currentDate.getMonth() + 1,
            this.currentDate.getDate(),
            this.currentDate.getHours(),
            this.currentDate.getMinutes(),
            this.currentDate.getSeconds()
        );
        const lst = this.astroTime.LCT2LST(lct);
        this.horToEquMatrix.hor2equ(lst, this.astroTime.glat);

        // 커버 (지평선 아래 가리기)
        this.#renderHorizonCover(cx, cy, diameter);

        // 동서남북
        this.#renderCardinalDirections(cx, cy);

        // 시간 눈금
        this.#renderTimeScale(cx, cy);
    }

    #renderHorizonCover(cx, cy, diameter) {
        let path = `M${cx - this.radius},${cy} `;
        path += `a ${this.radius},${this.radius} 0 1,1, ${diameter},0 `;
        path += `a ${this.radius},${this.radius} 0 1,1, -${diameter},0 `;

        for (let azimuth = 0; azimuth <= 360 * AstroMath.D2R; azimuth += 0.01) {
            this.horVector.setSphe(azimuth, 0);
            this.equVector.multiply(this.horToEquMatrix, this.horVector);
            const ra = this.equVector.lon();
            const dec = this.equVector.lat();
            let { x, y } = this.proj.project(ra, dec);
            if (azimuth == 0) path += 'M';
            else path += 'L';
            path += `${cx + x} ${cy + y} `;
        }
        this.canvas.path(path).fill(this.styles.topPanelBgColor).stroke({
            width: this.styles.topPanelStroke.width,
            color: this.styles.topPanelStroke.color
        });
    }

    #renderCardinalDirections(cx, cy) {
        const arrayAzimuthName = ["북", "북동", "동", "남동", "남", "남서", "서", "북서"];
        let azimuth = 0;

        for (let i = 0; i < arrayAzimuthName.length; i++) {
            this.horVector.setSphe(azimuth * AstroMath.D2R, -4 * AstroMath.D2R);
            this.equVector.multiply(this.horToEquMatrix, this.horVector);
            const ra1 = this.equVector.lon();
            const dec1 = this.equVector.lat();
            const { x: x1, y: y1 } = this.proj.project(ra1, dec1);

            this.horVector.setSphe(azimuth * AstroMath.D2R, 90 * AstroMath.D2R);
            this.equVector.multiply(this.horToEquMatrix, this.horVector);
            const ra2 = this.equVector.lon();
            const dec2 = this.equVector.lat();
            const { x: x2, y: y2 } = this.proj.project(ra2, dec2);

            this.canvas.text(`${arrayAzimuthName[i]}`).attr('text-anchor', 'middle').center(cx + x1, cy + y1)
                .font({
                    fill: this.styles.nwesColor,
                    size: this.styles.nwesTextSize,
                    family: FONT_FAMILY
                })
                .transform({ rotate: AstroMath.R2D * (Math.atan2(y1 - y2, x1 - x2) - AstroMath.HPI) });

            azimuth += 45;
        }
    }

    #renderTimeScale(cx, cy) {
        this.horVector.setSphe(180 * AstroMath.H2R, 0);
        this.equVector.multiply(this.horToEquMatrix, this.horVector);
        let path = '';

        for (let hour = 1; hour <= 24; hour++) {
            const t = -(-this.equVector.lon() - this.deltaCulminationTime + hour * AstroMath.H2R + AstroMath.PI);
            const cos_lon = Math.cos(t);
            const sin_lon = Math.sin(t);
            const x1 = this.radius * cos_lon;
            const y1 = this.radius * sin_lon;
            const x2 = (this.radius - 9) * cos_lon;
            const y2 = (this.radius - 9) * sin_lon;
            path += `M${x1 + cx} ${y1 + cy} L${x2 + cx} ${y2 + cy} `;

            const x3 = (this.radius - 18) * cos_lon;
            const y3 = (this.radius - 18) * sin_lon;

            this.canvas.text(`${hour}시`).attr('text-anchor', 'middle').center(cx + x3, cy + y3)
                .font({
                    fill: this.styles.timeTextColor,
                    size: this.styles.timeTextSize,
                    family: FONT_FAMILY
                })
                .transform({ rotate: AstroMath.R2D * (Math.atan2(y3, x3) - AstroMath.HPI - AstroMath.PI) });

            for (let min = 5; min < 60; min += 5) {
                const t = -(-this.equVector.lon() - this.deltaCulminationTime + (hour + (min / 60)) * AstroMath.H2R + AstroMath.PI);
                const cos_lon = Math.cos(t);
                const sin_lon = Math.sin(t);
                const x1 = this.radius * cos_lon;
                const y1 = this.radius * sin_lon;
                let r;
                if (min % 10 == 0) {
                    if (min % 30 == 0) r = this.radius - 10;
                    else r = this.radius - 6;
                } else {
                    r = this.radius - 3;
                }
                const x2 = r * cos_lon;
                const y2 = r * sin_lon;
                path += `M${x1 + cx} ${y1 + cy} L${x2 + cx} ${y2 + cy} `;
            }
        }
        this.canvas.path(path).fill('none').stroke({
            width: this.styles.timeLineStroke,
            color: this.styles.timeLineColor
        });
    }
}

/**
 * 정보 패널 렌더러 (범례 및 타이틀)
 *
 * 별자리판의 보조 정보를 렌더링합니다:
 * - 별 등급 범례: 1~6등성의 크기 비교
 * - 타이틀: "아빠별 별자리판"
 * - 버전 정보
 *
 * @class
 * @example
 * const renderer = new InfoPanelRenderer(canvas, styles, 'v1.0.3');
 * renderer.render();
 */
export class InfoPanelRenderer {
    /**
     * InfoPanelRenderer 인스턴스 생성
     * @param {SVG.Container} canvas - SVG.js 캔버스 객체
     * @param {ThemeConfig} styles - 테마 스타일 설정
     * @param {string} version - 버전 문자열 (예: 'v1.0.3 (2024-01-15)')
     */
    constructor(canvas, styles, version) {
        /** @type {SVG.Container} */
        this.canvas = canvas;
        /** @type {ThemeConfig} */
        this.styles = styles;
        /** @type {string} */
        this.version = version;
    }

    render() {
        const cx = 0;
        const cy = 0;

        // 별 등성 범례
        let radius = 0.5;
        let alpha = 0.5;
        for (let mag = -1; mag < 5; mag++) {
            if (mag < -1) { radius = 7; alpha = 1 }
            else if (mag < 0) { radius = 6; alpha = 1 }
            else if (mag < 1) { radius = 5; alpha = 1 }
            else if (mag < 2) { radius = 4; alpha = 1 }
            else if (mag < 3) { radius = 3; alpha = 0.8 }
            else if (mag < 4) { radius = 2; alpha = 0.8 }
            else if (mag < 5) { radius = 1; alpha = 0.5 }
            else { radius = 0.5; alpha = 0.5 }

            this.canvas.circle(radius * 2)
                .center(cx - 280 - radius / 2, cy - 170 + mag * 15)
                .fill({ color: this.styles.legendColor, fill: this.styles.legendColor });

            this.canvas.text(`${mag + 2} 등성`).move(cx - 270, cy - 180 + mag * 15)
                .font({ fill: this.styles.legendColor, size: this.styles.legendTextSize, family: FONT_FAMILY });
        }

        // 타이틀
        this.canvas.text(`아빠별 별자리판`).move(cx - 160, cy - 290)
            .font({ fill: this.styles.legendColor, size: 50, family: FONT_FAMILY });

        // 버전 정보
        this.canvas.text(this.version).center(cx, cy - 200)
            .font({ fill: this.styles.legendColor, size: 20, family: FONT_FAMILY });
    }
}
