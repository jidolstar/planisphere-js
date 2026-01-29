/**
 * @fileoverview 별자리판 JS - 천문학 계산 모듈
 * @author 지용호 <jidolstar@gmail.com>
 * @version 1.0.0
 * @license MIT
 *
 * @description
 * 이 모듈은 순수한 천문학 계산 로직을 포함합니다.
 * 다른 프로젝트에서도 재사용 가능하도록 설계되었습니다.
 *
 * 주요 기능:
 * - 천문학 상수 및 단위 변환 (AstroMath)
 * - 시간 변환: LCT/UT/GST/LST (AstroTime)
 * - 3D 벡터 및 좌표계 변환 (AstroVector)
 * - 3×3 행렬 연산 (AstroMatrix)
 * - 등거리 투영 (EquiDistanceProjection)
 */

/**
 * 천문학 수학 상수 및 유틸리티 함수 모음
 * @namespace
 * @readonly
 *
 * @property {number} R2D - 라디안에서 도(degree)로 변환 (180/π ≈ 57.2958)
 * @property {number} D2R - 도(degree)에서 라디안으로 변환 (π/180 ≈ 0.0175)
 * @property {number} S2R - 초(arcsecond)에서 라디안으로 변환
 * @property {number} R2H - 라디안에서 시(hour)로 변환 (12/π ≈ 3.8197)
 * @property {number} H2R - 시(hour)에서 라디안으로 변환 (π/12 ≈ 0.2618)
 * @property {number} J2000 - J2000.0 기원 율리우스일 (2451545.0)
 * @property {number} PI - 원주율 π
 * @property {number} TPI - 2π (360도)
 * @property {number} HPI - π/2 (90도)
 *
 * @example
 * // 도를 라디안으로 변환
 * const radians = 45 * AstroMath.D2R; // 0.7854...
 *
 * // 각도를 0~360 범위로 정규화
 * const normalized = AstroMath.normalize(450, 0, 360); // 90
 */
export const AstroMath = Object.freeze({
    /** @type {number} 라디안 → 도 변환 계수 */
    R2D: 180.0/Math.PI,
    /** @type {number} 도 → 라디안 변환 계수 */
    D2R: Math.PI / 180.0,
    /** @type {number} 초(arcsecond) → 라디안 변환 계수 */
    S2R: 4.8481368110953599359e-6,
    /** @type {number} 라디안 → 시(hour) 변환 계수 */
    R2H: 3.8197186342054880584532103209403,
    /** @type {number} 시(hour) → 라디안 변환 계수 */
    H2R: 0.26179938779914943653855361527329,
    /** @type {number} J2000.0 기원 율리우스일 */
    J2000: 2451545.0,
    /** @type {number} 원주율 π */
    PI: 3.1415926535897932384626433832795,
    /** @type {number} 2π (한 바퀴) */
    TPI: 6.28318530717958647693,
    /** @type {number} π/2 (직각) */
    HPI: 1.5707963267948966192313216916395,

    /**
     * 나머지 연산 (모듈러)
     * dividend를 divisor 범위 내로 맞춤
     * @param {number} dividend - 피제수
     * @param {number} divisor - 제수
     * @returns {number} 0 이상 divisor 미만의 나머지
     * @example
     * AstroMath.mod(362.2, 360); // 2.2
     * AstroMath.mod(-10, 360);   // 350
     */
    mod: (dividend, divisor) => {
        return dividend - (Math.floor(dividend/divisor)*divisor);
    },

    /**
     * 값을 지정된 범위 [from, to)로 정규화
     * @param {number} x - 정규화할 값
     * @param {number} from - 범위 시작 (포함)
     * @param {number} to - 범위 끝 (미포함)
     * @returns {number} 정규화된 값
     * @example
     * AstroMath.normalize(450, 0, 360); // 90
     * AstroMath.normalize(-30, 0, 360); // 330
     * AstroMath.normalize(25, 0, 24);   // 1
     */
    normalize: (x, from, to) => {
        let w = to - from;
        return x - Math.floor((x - from) / w) * w;
    }
});

/**
 * 천문학 시간 변환 클래스
 *
 * 다양한 천문학 시간 체계 간의 변환을 담당합니다:
 * - LCT (Local Civil Time): 지방 표준시
 * - UT (Universal Time): 세계시
 * - GST (Greenwich Sidereal Time): 그리니치 항성시
 * - LST (Local Sidereal Time): 지방 항성시
 * - JD (Julian Day): 율리우스일
 *
 * 시간 변환 관계도:
 * ```
 * JD <-> UT <-> GST <-> LST
 *          <------------->
 *    <------------->
 *    <-------------------->
 * ```
 *
 * @class
 * @example
 * // 서울 기준 시간 변환기 생성
 * const astroTime = new AstroTime(9, 126.98, 37.57);
 *
 * // 현재 시간의 율리우스일 계산
 * const jd = AstroTime.jd(2024, 1, 15, 21, 0, 0);
 *
 * // 지방 표준시를 지방 항성시로 변환
 * const lst = astroTime.LCT2LST(jd);
 */
export class AstroTime{
    /**
     * AstroTime 인스턴스 생성
     * @param {number} dgmt - UTC 기준 시간대 오프셋 (예: 한국 표준시는 9)
     * @param {number} lon - 관측 지점의 경도 (도 단위, 동경 양수)
     * @param {number} lat - 관측 지점의 위도 (도 단위, 북위 양수)
     */
    constructor(dgmt, lon, lat){
        /** @type {number} UTC 오프셋 (시간) */
        this.dgmt = dgmt;
        /** @type {number} 경도 (라디안) */
        this.glon = lon * AstroMath.D2R;
        /** @type {number} 위도 (라디안) */
        this.glat = lat * AstroMath.D2R;
    }

    /**
     * 그레고리력 윤년 판단
     * @static
     * @param {number} year - 연도
     * @returns {boolean} 윤년이면 true
     * @example
     * AstroTime.isLeapYear(2024); // true
     * AstroTime.isLeapYear(2023); // false
     */
    static isLeapYear(year) {
        return (year % 400 === 0) || (year % 4 === 0 && year % 100 !== 0);
    }

    /**
     * 월별 일수 배열 반환 (윤년 반영)
     * @static
     * @param {number} year - 연도
     * @returns {number[]} 1월부터 12월까지의 일수 배열 (길이 12)
     * @example
     * AstroTime.monthDayCounts(2024); // [31, 29, 31, 30, ...]
     */
    static monthDayCounts(year) {
        return [
            31,
            AstroTime.isLeapYear(year) ? 29 : 28,
            31, 30, 31, 30, 31, 31, 30, 31, 30, 31
        ];
    }

    /**
     * 월의 중간일 반환 (라벨 배치용)
     * @static
     * @param {number} year - 연도
     * @param {number} month - 월 (1-12)
     * @returns {number} 해당 월의 중간일 (ceil(일수/2))
     */
    static monthMidDay(year, month) {
        const days = AstroTime.monthDayCounts(year)[month - 1];
        return Math.ceil(days / 2);
    }

    /**
     * 율리우스일(Julian Day Number) 계산
     * @static
     * @param {number} year - 연도
     * @param {number} month - 월 (1-12)
     * @param {number} day - 일 (1-31)
     * @param {number} hour - 시 (0-23)
     * @param {number} minute - 분 (0-59)
     * @param {number} second - 초 (0-59)
     * @returns {number} 율리우스일
     * @see {@link https://planetcalc.com/503/|검증 계산기}
     * @example
     * // 2024년 1월 1일 정오의 율리우스일
     * AstroTime.jd(2024, 1, 1, 12, 0, 0); // 2460310.5
     */
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

    /**
     * 율리우스일에서 날짜 부분만 추출 (정수 + 0.5)
     * @static
     * @param {number} jd - 율리우스일
     * @returns {number} 날짜 부분 (0시 기준)
     */
    static jd2Date(jd){
        return Math.floor(jd - 0.5) + 0.5;
    }

    /**
     * 율리우스일에서 시간 부분 추출
     * @static
     * @param {number} jd - 율리우스일
     * @returns {number} 시간 (0-24 시간 단위)
     */
    static jd2Time(jd){
        return (jd - this.jd2Date(jd)) * 24.0;
    }

    /**
     * 연중 일수(Day of Year) 계산
     * @static
     * @param {number} year - 연도
     * @param {number} month - 월 (1-12)
     * @param {number} day - 일 (1-31)
     * @returns {number} 1월 1일부터의 일수 (1-366)
     * @example
     * AstroTime.dayOfYear(2024, 3, 1); // 61 (윤년)
     */
    static dayOfYear(year, month, day) {
        const d0 = new Date(year, 0, 1);
        const d1 = new Date(year, month - 1, day);
        return Math.floor((d1 - d0) / 86400000) + 1;
    }

    /**
     * 시각방정식(Equation of Time) 계산
     *
     * 평균 태양시와 진태양시의 차이를 분 단위로 반환합니다.
     * 근사식으로 교육용으로 충분한 ±1~2분 정확도입니다.
     *
     * @static
     * @param {number} year - 연도
     * @param {number} month - 월 (1-12)
     * @param {number} day - 일 (1-31)
     * @returns {number} 시각방정식 값 (분)
     * @example
     * // 2월 초: 약 -14분 (태양이 평균보다 늦음)
     * // 11월 초: 약 +16분 (태양이 평균보다 빠름)
     */
    static equationOfTimeMinutes(year, month, day) {
        const N = AstroTime.dayOfYear(year, month, day);
        const B = 2 * Math.PI * (N - 81) / 365.0;
        return 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
    }

    /**
     * 세계시(UT)를 그리니치 항성시(GST)로 변환
     * @static
     * @param {number} ut - 세계시 (율리우스일 형식)
     * @returns {number} 그리니치 항성시 (율리우스일 형식)
     */
    static UT2GST(ut){
        let ut_date = this.jd2Date(ut);
        let ut_time = (ut - ut_date) * 24.0;
        let t = (ut_date - 2451545.0) / 36525.0;
        let t0 = AstroMath.normalize(6.697374558 + (2400.051336 * t) + (0.000025862 * t * t), 0, 24);
        let gst_time = AstroMath.normalize(ut_time * 1.00273790935 + t0, 0, 24);
        return ut_date + gst_time / 24.0;
    }

    /**
     * 그리니치 항성시(GST)를 세계시(UT)로 변환
     * @static
     * @param {number} gst - 그리니치 항성시 (율리우스일 형식)
     * @returns {number} 세계시 (율리우스일 형식)
     * @note 이 변환으로 인해 날짜가 변경될 수 있으며, 하루에 두 값이 존재할 수 있음
     */
    static GST2UT(gst){
        var gst_date = this.jd2Date(gst);
        let gst_time = (gst - gst_date) * 24.0;
        var t = (gst_date - 2451545.0) / 36525.0;
        var t0 = AstroMath.normalize(6.697374558 + (2400.051336 * t) + (0.000025862 * t * t), 0, 24);
        var ut_time = AstroMath.normalize(gst_time - t0, 0, 24);

        // 이 계산 때문에 날짜가 달라질 수 있으며 하루에 두개가 생길 수 도 있음
        return gst_date + ut_time * 0.9972695663 / 24.0;
    }

    /**
     * 특정 고도에서의 지방시각(Hour Angle) 계산
     * @param {number} alt - 고도 (라디안)
     * @param {number} dec - 적위 (라디안)
     * @returns {number} 지방시각 (라디안)
     */
    HAFromDec(alt, dec){
        return Math.acos(
            (Math.sin(alt) - Math.sin(glat) * Math.sin(dec)) /
            (Math.cos(glat) * Math.cos(dec))
        );
    }

    /**
     * 세계시(UT)를 지방 표준시(LCT)로 변환
     * @param {number} ut - 세계시 (율리우스일 형식)
     * @returns {number} 지방 표준시 (율리우스일 형식)
     */
    UT2LCT(ut){
        return ut + this.dgmt / 24.0;
    }

    /**
     * 그리니치 항성시(GST)를 지방 표준시(LCT)로 변환
     * @param {number} gst - 그리니치 항성시 (율리우스일 형식)
     * @returns {number} 지방 표준시 (율리우스일 형식)
     */
    GST2LCT(gst){
        let ut = AstroTime.GST2UT(gst);
        return this.UT2LCT(ut);
    }

    /**
     * 지방 항성시(LST)를 그리니치 항성시(GST)로 변환
     * @param {number} lst - 지방 항성시 (율리우스일 형식)
     * @returns {number} 그리니치 항성시 (율리우스일 형식)
     */
    LST2GST(lst){
        return lst - this.glon / AstroMath.TPI;
    }

    /**
     * 지방 항성시(LST)를 세계시(UT)로 변환
     * @param {number} lst - 지방 항성시 (율리우스일 형식)
     * @returns {number} 세계시 (율리우스일 형식)
     */
    LST2UT(lst){
        let gst = this.LST2GST(lst);
        return AstroTime.GST2UT(gst);
    }

    /**
     * 지방 항성시(LST)를 지방 표준시(LCT)로 변환
     * @param {number} lst - 지방 항성시 (율리우스일 형식)
     * @returns {number} 지방 표준시 (율리우스일 형식)
     */
    LST2LCT(lst){
        let gst = this.LST2GST(lst);
        return this.GST2LCT(gst);
    }

    /**
     * 지방 표준시(LCT)를 세계시(UT)로 변환
     * @param {number} lct - 지방 표준시 (율리우스일 형식)
     * @returns {number} 세계시 (율리우스일 형식)
     */
    LCT2UT(lct){
        return lct - this.dgmt / 24.0;
    }

    /**
     * 지방 표준시(LCT)를 그리니치 항성시(GST)로 변환
     * @param {number} lct - 지방 표준시 (율리우스일 형식)
     * @returns {number} 그리니치 항성시 (율리우스일 형식)
     */
    LCT2GST(lct){
        let ut = this.LCT2UT(lct);
        return AstroTime.UT2GST(ut);
    }

    /**
     * 그리니치 항성시(GST)를 지방 항성시(LST)로 변환
     * @param {number} gst - 그리니치 항성시 (율리우스일 형식)
     * @returns {number} 지방 항성시 (율리우스일 형식)
     */
    GST2LST(gst){
        return gst + this.glon * AstroMath.R2H / 24.0;
    }

    /**
     * 세계시(UT)를 지방 항성시(LST)로 변환
     * @param {number} ut - 세계시 (율리우스일 형식)
     * @returns {number} 지방 항성시 (율리우스일 형식)
     */
    UT2LST(ut){
        let gst = AstroTime.UT2GST(ut);
        return this.GST2LST(gst);
    }

    /**
     * 지방 표준시(LCT)를 지방 항성시(LST)로 변환
     * @param {number} lct - 지방 표준시 (율리우스일 형식)
     * @returns {number} 지방 항성시 (율리우스일 형식)
     */
    LCT2LST(lct){
        let ut = this.LCT2UT(lct);
        return this.UT2LST(ut);
    }

    /**
     * 해당 연도의 총 일수 반환
     * @param {number} year - 연도
     * @returns {number} 일수 (365 또는 366)
     */
    daysInYear(year) {
        return (AstroTime.isLeapYear(year)) ? 366 : 365;
    }

    /**
     * 진정오(Local Apparent Solar Noon)의 표준시(LCT) 시각 계산
     *
     * 진정오는 태양이 자오선을 통과하는 실제 시각입니다.
     * 시각방정식과 경도 보정을 적용합니다.
     *
     * @param {number} year - 연도
     * @param {number} month - 월 (1-12)
     * @param {number} day - 일 (1-31)
     * @param {number} [dstHours=0] - 일광절약시간 오프셋 (시간)
     * @returns {number} 진정오 시각 (0-24 시간 단위)
     * @example
     * const astroTime = new AstroTime(9, 126.98, 37.57);
     * astroTime.lasn(2024, 6, 21); // 약 12.2 (서울의 하지 진정오)
     */
    lasn(year, month, day, dstHours = 0) {
        const lonHours = this.glon * AstroMath.R2H;
        const zoneHours = this.dgmt;
        const eotHours = AstroTime.equationOfTimeMinutes(year, month, day) / 60.0;
        const meanNoonOffset = zoneHours - lonHours;
        let hour = 12 + meanNoonOffset - eotHours + dstHours;
        hour = AstroMath.normalize(hour, 0, 24);
        return hour;
    }

    /**
     * 진정자정(Local Apparent Midnight)의 표준시(LCT) 시각 계산
     * @param {number} year - 연도
     * @param {number} month - 월 (1-12)
     * @param {number} day - 일 (1-31)
     * @param {number} [dstHours=0] - 일광절약시간 오프셋 (시간)
     * @returns {number} 진정자정 시각 (0-24 시간 단위)
     */
    lamn(year, month, day, dstHours=0) {
        return AstroMath.normalize(
            this.lasn(year, month, day, dstHours) - 12,
            0, 24
        );
    }

    /**
     * 날짜환 기준 시각 계산
     *
     * 별자리판의 날짜환을 맞출 때 사용할 기준 시각을 반환합니다.
     *
     * @param {number} year - 연도
     * @param {number} month - 월 (1-12)
     * @param {number} day - 일 (1-31)
     * @param {string} [mode='LASN'] - 기준 모드
     *   - 'MIDNIGHT': 표준시 자정 (0시)
     *   - 'LOCAL_NOON': 단순 정오 (12시)
     *   - 'LASN': 진정오 (기본값)
     *   - 'LAMN': 진정자정
     *   - 'LOCAL_21H': 교육용 밤 9시
     * @param {number} [dstHours=0] - 일광절약시간 오프셋 (시간)
     * @returns {number} 기준 시각 (0-24 시간 단위)
     */
    hourForDateRing(year, month, day, mode = 'LASN', dstHours = 0) {
        switch (mode) {
            case 'MIDNIGHT':
                return AstroMath.normalize(0 + dstHours, 0, 24);
            case 'LOCAL_NOON':
                return AstroMath.normalize(12 + dstHours, 0, 24);
            case 'LASN':
                return this.lasn(year, month, day, dstHours);
            case 'LAMN':
                return this.lamn(year, month, day, dstHours);
            case 'LOCAL_21H':
                return AstroMath.normalize(21 + dstHours, 0, 24);
            default:
                return AstroMath.normalize(0 + dstHours, 0, 24);
        }
    }
}

/**
 * 3D 벡터 및 천문 좌표계 변환 클래스
 *
 * 천문학에서 사용되는 다양한 좌표계 간의 변환을 지원합니다:
 * - 적도 좌표계 (Equatorial): 적경(RA), 적위(Dec)
 * - 지평 좌표계 (Horizontal): 방위각(Az), 고도(Alt)
 * - 황도 좌표계 (Ecliptic): 황경, 황위
 * - 은하 좌표계 (Galactic): 은경, 은위
 *
 * @class
 * @example
 * // 별의 적도 좌표를 지평 좌표로 변환
 * const equ = new AstroVector(0, 0, 0);
 * equ.setSphe(ra, dec);
 * const hor = new AstroVector(0, 0, 0);
 * hor.equ2hor(equ, lst, lat);
 */
export class AstroVector{
    /**
     * AstroVector 인스턴스 생성
     * @param {number} x - X 좌표
     * @param {number} y - Y 좌표
     * @param {number} z - Z 좌표
     */
    constructor(x, y, z){
        /** @type {number} X 좌표 */
        this.x = x;
        /** @type {number} Y 좌표 */
        this.y = y;
        /** @type {number} Z 좌표 */
        this.z = z;
    }

    /**
     * 구면 좌표로부터 직교 좌표 설정 (반경 r=1 가정)
     * @param {number} lon - 경도 (라디안)
     * @param {number} lat - 위도 (라디안)
     */
    setSphe(lon, lat){
        const cos_lat = Math.cos(lat)
        this.x = cos_lat * Math.cos(lon);
        this.y = cos_lat * Math.sin(lon);
        this.z = Math.sin(lat);
    }

    /**
     * 경도(Longitude) 반환
     * @returns {number} 경도 (0 ~ 2π 라디안)
     */
    lon(){
        let r = Math.atan2(this.y, this.x);
        if(r < 0) r += AstroMath.TPI;
        return r;
    }

    /**
     * 위도(Latitude) 반환
     * @returns {number} 위도 (-π/2 ~ π/2 라디안)
     */
    lat(){
        const r = Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);
        return Math.asin(this.z / r);
    }

    /**
     * 벡터의 크기(길이) 반환
     * @returns {number} 벡터 크기 (√(x²+y²+z²))
     */
    length(){
        return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z)
    }

    /**
     * 벡터를 단위 벡터로 정규화 (크기를 1로 만듦)
     */
    normalize(){
        const r = this.length();
        this.x /= r;
        this.y /= r;
        this.z /= r;
    }

    /**
     * 행렬과 벡터의 곱셈 결과를 현재 벡터에 저장
     * @param {AstroMatrix} m - 3×3 변환 행렬
     * @param {AstroVector} v - 입력 벡터
     */
    multiply(m, v){
        this.x = v.x * m.v[0][0] + v.y * m.v[0][1] + v.z * m.v[0][2];
        this.y = v.x * m.v[1][0] + v.y * m.v[1][1] + v.z * m.v[1][2];
        this.z = v.x * m.v[2][0] + v.y * m.v[2][1] + v.z * m.v[2][2];
    }

    /**
     * 적도 좌표 → 황도 좌표 변환
     * @param {AstroVector} equ - 적도 좌표 벡터
     * @param {number} dt - 율리우스일 (황도 경사각 계산용)
     * @note 단일 좌표 변환용. 다수의 좌표는 AstroMatrix 사용 권장
     */
    equ2ecl(equ, dt){
        const d = dt - 2451543.5;
        const e = (23.4393 - 3.563e-7 * d) * AstroMath.D2R;
        const cos_e = Math.cos(e);
        const sin_e = Math.sin(e);
        const x1 = equ.x;
        const y1 = equ.y;
        const z1 = equ.z;
        this.x = x1;
        this.y = y1 * cos_e + z1 * sin_e;
        this.z = y1 * -sin_e + z1 * cos_e;
    }

    /**
     * 지평 좌표 → 적도 좌표 변환
     * @param {AstroVector} hor - 지평 좌표 벡터
     * @param {number} lst - 지방 항성시 (율리우스일 형식)
     * @param {number} lat - 관측 위도 (라디안)
     * @note 단일 좌표 변환용. 다수의 좌표는 AstroMatrix 사용 권장
     */
    hor2equ(hor, lst, lat){
        var mat = new AstroMatrix(0,0,0,0,0,0,0,0,0);
        mat.hor2equ(lst, lat);
        this.multiply(mat, hor);
    }

    /**
     * 적도 좌표 → 은하 좌표 변환
     * @param {AstroVector} equ - 적도 좌표 벡터
     * @note 단일 좌표 변환용. 다수의 좌표는 AstroMatrix 사용 권장
     */
    equ2gal(equ){
        const x1 = equ.x;
        const y1 = equ.y;
        const z1 = equ.z;
        this.x = x1 * -0.0669887 + y1 * -0.8727558 + z1 * -0.4835389;
        this.y = x1 * 0.4927285 + y1 * -0.4503470 + z1 * 0.7445846;
        this.z = x1 * -0.8676008 + y1 * -0.1883746 + z1 * 0.4601998;
    }

    /**
     * 황도 좌표 → 적도 좌표 변환
     * @param {AstroVector} ecl - 황도 좌표 벡터
     * @param {number} dt - 율리우스일 (황도 경사각 계산용)
     * @note 단일 좌표 변환용. 다수의 좌표는 AstroMatrix 사용 권장
     */
    ecl2equ(ecl, dt){
        const x1 = ecl.x;
        const y1 = ecl.y;
        const z1 = ecl.z;

        const d = dt - 2451543.5;
        const e = (23.4393 - 3.563e-7 * d) * AstroMath.D2R;
        const cos_e = Math.cos(e);
        const sin_e = Math.sin(e);
        this.x = x1;
        this.y = y1 * cos_e + z1 * -sin_e;
        this.z = y1 * sin_e + z1 * cos_e;
    }

    /**
     * 황도 좌표 → 지평 좌표 변환
     * @param {AstroVector} ecl - 황도 좌표 벡터
     * @param {number} lst - 지방 항성시 (율리우스일 형식)
     * @param {number} lat - 관측 위도 (라디안)
     * @note 단일 좌표 변환용. 다수의 좌표는 AstroMatrix 사용 권장
     */
    ecl2hor(ecl, lst, lat){
        const equ = new AstroVector(0,0,0);
        equ.ecl2equ(ecl, lst);
        this.equ2hor(equ, lst, lat);
    }

    /**
     * 적도 좌표 → 지평 좌표 변환
     * @param {AstroVector} equ - 적도 좌표 벡터
     * @param {number} lst - 지방 항성시 (율리우스일 형식)
     * @param {number} lat - 관측 위도 (라디안)
     * @note 단일 좌표 변환용. 다수의 좌표는 AstroMatrix 사용 권장
     */
    equ2hor(equ, lst, lat){
        const mat = new AstroMatrix(0,0,0,0,0,0,0,0,0);
        mat.equ2hor(lst, lat);
        this.multiply(mat, equ);
    }
}

/**
 * 2D 좌표 포인트 클래스
 *
 * 화면 좌표나 투영된 좌표를 나타내는 데 사용됩니다.
 *
 * @class
 */
export class AstroPoint{
    /**
     * AstroPoint 인스턴스 생성
     * @param {number} x - X 좌표
     * @param {number} y - Y 좌표
     */
    constructor(x, y){
        /** @type {number} X 좌표 */
        this.x = x
        /** @type {number} Y 좌표 */
        this.y = y
    }
}

/**
 * 3×3 행렬 클래스 (좌표계 변환용)
 *
 * 천문 좌표계 간의 변환 행렬을 생성하고 연산합니다.
 * 여러 좌표를 일괄 변환할 때 AstroVector보다 효율적입니다.
 *
 * @class
 * @example
 * // 적도→지평 좌표 변환 행렬 생성
 * const mat = new AstroMatrix(0,0,0,0,0,0,0,0,0);
 * mat.equ2hor(lst, lat);
 *
 * // 벡터에 행렬 적용
 * const result = new AstroVector(0,0,0);
 * result.multiply(mat, equVector);
 */
export class AstroMatrix{
    /**
     * AstroMatrix 인스턴스 생성
     * @param {number} x11 - 행렬[0][0]
     * @param {number} x12 - 행렬[0][1]
     * @param {number} x13 - 행렬[0][2]
     * @param {number} x21 - 행렬[1][0]
     * @param {number} x22 - 행렬[1][1]
     * @param {number} x23 - 행렬[1][2]
     * @param {number} x31 - 행렬[2][0]
     * @param {number} x32 - 행렬[2][1]
     * @param {number} x33 - 행렬[2][2]
     */
    constructor(x11, x12, x13,
                x21, x22, x23,
                x31, x32, x33){
        /** @type {number[][]} 3×3 행렬 데이터 */
        this.v = [[],[],[]];
        this.set(x11, x12, x13,
                x21, x22, x23,
                x31, x32, x33);
    }

    /**
     * 행렬 값 설정
     * @param {number} x11 - 행렬[0][0]
     * @param {number} x12 - 행렬[0][1]
     * @param {number} x13 - 행렬[0][2]
     * @param {number} x21 - 행렬[1][0]
     * @param {number} x22 - 행렬[1][1]
     * @param {number} x23 - 행렬[1][2]
     * @param {number} x31 - 행렬[2][0]
     * @param {number} x32 - 행렬[2][1]
     * @param {number} x33 - 행렬[2][2]
     */
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

    /**
     * 행렬 요소 값 반환
     * @param {number} row - 행 인덱스 (0-2)
     * @param {number} col - 열 인덱스 (0-2)
     * @returns {number} 해당 위치의 값
     */
    get(row, col){
        return this.v[row][col];
    }

    /**
     * 두 행렬의 곱셈 결과를 현재 행렬에 저장
     * @param {AstroMatrix} m1 - 첫 번째 행렬
     * @param {AstroMatrix} m2 - 두 번째 행렬
     */
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

    /**
     * 지평 좌표 → 적도 좌표 변환 행렬 생성
     * @param {number} lst - 지방 항성시 (율리우스일 형식)
     * @param {number} lat - 관측 위도 (라디안)
     */
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

    /**
     * 적도 좌표 → 지평 좌표 변환 행렬 생성
     * @param {number} lst - 지방 항성시 (율리우스일 형식)
     * @param {number} lat - 관측 위도 (라디안)
     */
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

    /**
     * 은하 좌표 → 지평 좌표 변환 행렬 생성
     * @param {number} lst - 지방 항성시 (율리우스일 형식)
     * @param {number} lat - 관측 위도 (라디안)
     */
    gal2hor(lst, lat){
        const Equ2Hor = new AstroMatrix(0,0,0,0,0,0,0,0,0);
        Equ2Hor.equ2hor(lst, lat);
        const gal2equ = new AstroMatrix(0,0,0,0,0,0,0,0,0);
        gal2equ.gal2equ();
        this.multiply(Equ2Hor,gal2equ);
    }

    /**
     * 황도 좌표 → 지평 좌표 변환 행렬 생성
     * @param {number} lst - 지방 항성시 (율리우스일 형식)
     * @param {number} lat - 관측 위도 (라디안)
     */
    ecl2hor(lst, lat){
        const Equ2Hor = new AstroMatrix(0,0,0,0,0,0,0,0,0);
        Equ2Hor.equ2hor(lst, lat);
        const EclToEqu = new AstroMatrix(0,0,0,0,0,0,0,0,0);
        EclToEqu.ecl2equ(lst);
        this.multiply(Equ2Hor,EclToEqu);
    }

    /**
     * 은하 좌표 → 적도 좌표 변환 행렬 생성
     * (상수 행렬 - 시간 무관)
     */
    gal2equ(){
        this.set(-0.0669887, 0.4927285, -0.8676008,
            -0.8727558, -0.4503470, -0.1883746,
            -0.4835389, 0.7445846, 0.4601998);
    }

    /**
     * 황도 좌표 → 적도 좌표 변환 행렬 생성
     * @param {number} dt - 율리우스일 (황도 경사각 계산용)
     */
    ecl2equ(dt){
        const d = dt - 2451543.5;
        const e = (23.4393 - 3.563e-7 * d) * AstroMath.D2R;
        const cos_e = Math.cos(e);
        const sin_e = Math.sin(e);
        this.set(1.0, 0.0, 0.0,
            0.0, cos_e, -sin_e,
            0.0, sin_e, cos_e);
    }

    /**
     * 적도 좌표 → 황도 좌표 변환 행렬 생성
     * @param {number} dt - 율리우스일 (황도 경사각 계산용)
     */
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

/**
 * 등거리 방위 투영 (Equidistant Azimuthal Projection) 클래스
 *
 * 천구를 2D 평면으로 투영하는 방법 중 하나입니다.
 * 북극(또는 남극)을 중심으로 적경-적위 좌표를 평면 x,y 좌표로 변환합니다.
 *
 * 투영 특성:
 * - 중심점(천구 극)에서의 거리가 실제 각거리에 비례
 * - 호의 길이 L = R × A (R: 반경, A: 각도)
 * - 북극 근처 (x,y) = (0,0)
 *
 * @class
 * @example
 * // 화면 반경 300px, 적위 한계 -30도로 투영기 생성
 * const proj = new EquiDistanceProjection(300, -30 * Math.PI / 180);
 *
 * // 별의 적경/적위를 화면 좌표로 변환
 * const pos = proj.project(ra, dec);
 * console.log(pos.x, pos.y);
 */
export class EquiDistanceProjection{
    /**
     * EquiDistanceProjection 인스턴스 생성
     *
     * 화면 반경과 적위 한계값으로 천구의 가상 반경을 계산합니다.
     *
     * @param {number} screenRadius - 화면상 별자리판 원의 반경 (픽셀)
     * @param {number} limitDE - 표시할 적위의 하한값 (라디안, 음수면 남반구까지 표시)
     */
    constructor(screenRadius, limitDE){
        /** @type {number} 화면 반경 (픽셀) */
        this.screenRadius = screenRadius
        /** @type {number} 적위 한계 (라디안) */
        this.limitDE = limitDE
        /** @type {AstroPoint} 재사용 좌표 객체 (메모리 최적화) */
        this.screenCoord = new AstroPoint(0,0);
        /** @type {number} 가상 천구 반경 (투영 스케일 팩터) */
        this.virtualCelestrialRadius = screenRadius / Math.abs(AstroMath.HPI - limitDE);
    }

    /**
     * 적경/적위를 화면 좌표로 투영
     * @param {number} ra - 적경 (라디안)
     * @param {number} dec - 적위 (라디안)
     * @returns {AstroPoint} 화면 좌표 (x, y)
     * @note 반환되는 AstroPoint는 내부 객체를 재사용하므로,
     *       값을 보존하려면 복사 필요
     */
    project(ra,dec){
        const decScreen = (AstroMath.HPI - dec) * this.virtualCelestrialRadius;
        this.screenCoord.x = decScreen * Math.cos(ra);
        this.screenCoord.y = decScreen * Math.sin(ra);
        return this.screenCoord;
    }
}
