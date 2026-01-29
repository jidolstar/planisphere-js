/**
 * @fileoverview 별자리판 JS - 유틸리티 모듈
 * @author 지용호 <jidolstar@gmail.com>
 * @version 1.0.0
 * @license MIT
 *
 * @description
 * 프로젝트 전반에서 사용되는 유틸리티 함수와 환경 감지 로직을 제공합니다.
 */

/**
 * 환경 감지 유틸리티 객체
 */
export const Env = {
    /**
     * @returns {string} User Agent 문자열
     */
    get ua() {
        return navigator.userAgent;
    },

    /**
     * 모바일 기기 여부 감지
     * @returns {boolean}
     */
    isMobile() {
        return /Mobi|Android|iPhone|iPad|iPod|Tablet/i.test(this.ua);
    },

    /**
     * Safari 브라우저 여부 감지 (Chrome/Firefox 등 제외)
     * @returns {boolean}
     */
    isSafari() {
        return /^((?!chrome|android).)*safari/i.test(this.ua) && !/CriOS|FxiOS/i.test(this.ua);
    },

    /**
     * iPad 여부 감지 (iPadOS 13+ 포함)
     * @returns {boolean}
     */
    isIPad() {
        return /iPad|Macintosh/i.test(this.ua) && 'ontouchend' in document;
    },

    /**
     * macOS 플랫폼 여부 감지
     * @returns {boolean}
     */
    isMac() {
        return /Macintosh|MacIntel|MacPPC|Mac68K/i.test(this.ua);
    },

    /**
     * Windows 플랫폼 여부 감지
     * @returns {boolean}
     */
    isWindows() {
        return /Win32|Win64|Windows|WinCE/i.test(this.ua);
    }
};

/**
 * 도(degree) 단위를 도/분/초(DMS) 및 방향 표시 문자로 변환합니다.
 * 
 * @param {number} degrees - 십진수 도 단위의 좌표
 * @param {boolean} isLat - 위도 여부 (true: 위도, false: 경도)
 * @returns {string} DMS 형식의 문자열 (예: N 37° 34' 12")
 */
export function formatDMS(degrees, isLat) {
    const absDeg = Math.abs(degrees);
    const d = Math.floor(absDeg);
    const m = Math.floor((absDeg - d) * 60);
    const s = Math.round(((absDeg - d) * 60 - m) * 60);

    let direction = '';
    if (isLat) {
        direction = degrees >= 0 ? '북위' : '남위';
    } else {
        direction = degrees >= 0 ? '동경' : '서경';
    }

    return `${direction} ${d}° ${m}' ${s}"`;
}
