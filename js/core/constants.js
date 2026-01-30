/**
 * @fileoverview 별자리판 JS - 상수 정의
 * @author 지용호 <jidolstar@gmail.com>
 * @version 1.0.0
 * @license MIT
 *
 * @description
 * 프로젝트 전체에서 사용되는 상수를 중앙화하여 관리합니다.
 * 매직 넘버를 제거하고 설정값을 한 곳에서 관리하기 위한 모듈입니다.
 */

/**
 * 프로젝트 버전
 * @constant {string}
 */
export const VERSION = '1.3.2';

/**
 * 기본 경도: 동경 126.98도 (서울 시청 기준)
 * @constant {number}
 */
export const DEFAULT_LONGITUDE = 126.98;

/**
 * 기본 위도: 북위 37.57도 (서울 시청 기준)
 * @constant {number}
 */
export const DEFAULT_LATITUDE = 37.57;

/**
 * 기본 관측 위치 (서울)
 * @constant {Object}
 * @property {number} lon - 경도 (동경, 도 단위)
 * @property {number} lat - 위도 (북위, 도 단위)
 * @example
 * import { DEFAULT_LOCATION } from './constants.js';
 * console.log(DEFAULT_LOCATION.lon); // 126.98
 */
export const DEFAULT_LOCATION = {
    /** @type {number} 동경 126.98도 (서울 시청 기준) */
    lon: DEFAULT_LONGITUDE,
    /** @type {number} 북위 37.57도 (서울 시청 기준) */
    lat: DEFAULT_LATITUDE
};

/**
 * 표시할 별의 등급 제한
 * 이 값 이하의 겉보기 등급을 가진 별만 표시됩니다.
 * (숫자가 작을수록 밝은 별)
 * @constant {number}
 * @default 6
 */
export const MAGNITUDE_LIMIT = 6;

/**
 * 분광형(Spectral Type)별 색상 매핑
 *
 * 하버드 분광형 분류에 따른 별의 색상입니다.
 * 분광형은 별의 표면 온도를 나타냅니다.
 *
 * @constant {Object.<string, string>}
 * @property {string} O - O형: 매우 뜨거운 별 (30,000K+, 청색)
 * @property {string} B - B형: 뜨거운 별 (10,000-30,000K, 청백색)
 * @property {string} A - A형: 고온 별 (7,500-10,000K, 백색)
 * @property {string} F - F형: 중온 별 (6,000-7,500K, 황백색)
 * @property {string} G - G형: 태양형 별 (5,200-6,000K, 황색)
 * @property {string} K - K형: 저온 별 (3,700-5,200K, 주황색)
 * @property {string} M - M형: 차가운 별 (2,400-3,700K, 적색)
 * @property {string} default - 분광형 미상 시 기본 색상 (백색)
 *
 * @example
 * import { SPECTRAL_COLORS } from './constants.js';
 * const sunColor = SPECTRAL_COLORS['G']; // '#fff4ea' (황색)
 */
export const SPECTRAL_COLORS = {
    O: '#9bb0ff',
    B: '#aabfff',
    A: '#cad7ff',
    F: '#f8f7ff',
    G: '#fff4ea',
    K: '#ffd2a1',
    M: '#ffcc6f',
    default: '#fff'
};

/**
 * 확대/축소 배율 범위
 * @constant {Object}
 * @property {number} min - 최소 배율 (축소 한계)
 * @property {number} max - 최대 배율 (확대 한계)
 * @property {number} default - 기본 배율
 */
export const SCALE_RANGE = {
    /** @type {number} 최소 배율 */
    min: 0.6,
    /** @type {number} 최대 배율 */
    max: 3.0,
    /** @type {number} 기본 배율 */
    default: 1.0
};

/**
 * 날짜환 정렬 모드
 *
 * 별자리판에서 날짜환과 시간환을 맞출 때 사용하는 기준 시각입니다.
 *
 * @constant {Object.<string, string>}
 * @property {string} MIDNIGHT - 표준시 자정 (0시) 기준
 * @property {string} LOCAL_NOON - 단순 정오 (12시) 기준
 * @property {string} LASN - 진정오 (Local Apparent Solar Noon) - 기본값
 * @property {string} LAMN - 진정자정 (Local Apparent Midnight)
 * @property {string} LOCAL_21H - 교육용 밤 9시 프리셋
 *
 * @example
 * import { DATE_RING_MODE } from './constants.js';
 * const mode = DATE_RING_MODE.LASN; // 진정오 모드
 */
export const DATE_RING_MODE = {
    /** 표준시 자정 기준 (시간환 0시와 정확히 정렬) */
    MIDNIGHT: 'MIDNIGHT',
    /** 단순 정오 기준 (12시) */
    LOCAL_NOON: 'LOCAL_NOON',
    /** 진정오 기준 (태양이 실제로 남중하는 시각) - 기본값 */
    LASN: 'LASN',
    /** 진정자정 기준 (진정오의 반대편) */
    LAMN: 'LAMN',
    /** 교육용 밤 9시 프리셋 (야간 관측 시작 시각) */
    LOCAL_21H: 'LOCAL_21H'
};

/**
 * 로컬 스토리지 키
 *
 * 브라우저 localStorage에 저장되는 설정값의 키입니다.
 *
 * @constant {Object.<string, string>}
 * @property {string} THEME - 테마 설정 저장 키
 */
export const STORAGE_KEYS = {
    /** @type {string} 테마 설정 저장 키 */
    THEME: 'planisphere_theme',
    /** @type {string} 위치(경도,위도) 설정 저장 키 */
    LOCATION: 'planisphere_location'
};
