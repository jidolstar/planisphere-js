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
