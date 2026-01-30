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

/**
 * 타임존 관련 서비스
 * 외부 라이브러리(tz-lookup)를 동기적으로 로드하고 좌표 기반 오프셋을 계산합니다.
 */
export const TimezoneService = {
    _lookup: null,
    _loading: false,

    /**
     * 외부 타임존 라이브러리를 동적으로 로드합니다.
     * @returns {Promise<boolean>} 로드 성공 여부
     */
    async loadLibrary() {
        if (this._lookup) return true;
        if (this._loading) return false;

        this._loading = true;
        try {
            const url = 'https://unpkg.com/tz-lookup';
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Network error: ${response.status}`);
            const script = await response.text();

            try {
                const factory = new Function('module', 'exports', script + '\nreturn module.exports;');
                const mockModule = { exports: {} };
                const result = factory(mockModule, mockModule.exports);
                this._lookup = (typeof result === 'function') ? result : mockModule.exports;
            } catch (evalErr) {
                const simpleFactory = new Function(script + '\nreturn typeof tzlookup !== "undefined" ? tzlookup : null;');
                this._lookup = simpleFactory();
            }

            if (typeof this._lookup !== 'function') {
                throw new Error("Invalid library format");
            }
            return true;
        } catch (e) {
            return false;
        } finally {
            this._loading = false;
        }
    },

    /**
     * 위도/경도를 기반으로 IANA 타임존 이름을 반환합니다.
     * @param {number} lat 
     * @param {number} lon 
     * @returns {string|null}
     */
    getTimezoneName(lat, lon) {
        if (!this._lookup) return null;
        try {
            return this._lookup(lat, lon);
        } catch (e) {
            return null;
        }
    },

    /**
     * 타임존 이름을 기반으로 현재 시각의 UTC 오프셋(시간 단위)을 반환합니다.
     * @param {string} tzName 
     * @param {Date} [date] 
     * @returns {number}
     */
    getOffsetFromTimezone(tzName, date = new Date()) {
        try {
            const str = date.toLocaleString('en-US', { timeZone: tzName, timeZoneName: 'short' });
            const match = str.match(/[+-]\d+/);
            if (match) {
                const offsetStr = match[0];
                return parseInt(offsetStr, 10);
            }

            const parts = new Intl.DateTimeFormat('en-US', {
                timeZone: tzName,
                timeZoneName: 'longOffset'
            }).formatToParts(date);

            const offsetPart = parts.find(p => p.type === 'timeZoneName');
            if (offsetPart) {
                const m = offsetPart.value.match(/GMT([+-]\d+):?(\d+)?/);
                if (m) {
                    const hours = parseInt(m[1], 10);
                    const minutes = m[2] ? parseInt(m[2], 10) : 0;
                    return hours + (minutes / 60) * (hours < 0 ? -1 : 1);
                }
            }
        } catch (e) {
            // Error handled by fallback
        }
        return Math.round(date.getTimezoneOffset() / -60);
    },

    /**
     * 경도를 기반으로 대략적인 표준시간대 오프셋(DGMT)을 계산합니다.
     * @param {number} lon - 경도 (-180 ~ 180)
     * @returns {number} 시간대 오프셋 (정수)
     */
    getGeographicOffset(lon) {
        return Math.round(lon / 15);
    }
};

