/**
 * @fileoverview AstroTime 단위 테스트
 * 천문학 시간 변환 클래스 검증
 *
 * 검증 참고 사이트:
 * - Julian Day: https://planetcalc.com/503/
 * - Sidereal Time: https://aa.usno.navy.mil/data/siderealtime
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AstroTime, AstroMath } from '../core/astronomy.js';

describe('AstroTime', () => {
    describe('isLeapYear() - 윤년 판단', () => {
        it('4로 나누어지는 해는 윤년 (기본)', () => {
            expect(AstroTime.isLeapYear(2024)).toBe(true);
            expect(AstroTime.isLeapYear(2020)).toBe(true);
            expect(AstroTime.isLeapYear(2016)).toBe(true);
        });

        it('100으로 나누어지는 해는 평년', () => {
            expect(AstroTime.isLeapYear(1900)).toBe(false);
            expect(AstroTime.isLeapYear(2100)).toBe(false);
            expect(AstroTime.isLeapYear(2200)).toBe(false);
        });

        it('400으로 나누어지는 해는 윤년', () => {
            expect(AstroTime.isLeapYear(2000)).toBe(true);
            expect(AstroTime.isLeapYear(1600)).toBe(true);
            expect(AstroTime.isLeapYear(2400)).toBe(true);
        });

        it('일반 평년', () => {
            expect(AstroTime.isLeapYear(2023)).toBe(false);
            expect(AstroTime.isLeapYear(2025)).toBe(false);
            expect(AstroTime.isLeapYear(2019)).toBe(false);
        });
    });

    describe('monthDayCounts() - 월별 일수', () => {
        it('윤년의 2월은 29일', () => {
            const days2024 = AstroTime.monthDayCounts(2024);
            expect(days2024[1]).toBe(29); // 2월 (인덱스 1)
        });

        it('평년의 2월은 28일', () => {
            const days2023 = AstroTime.monthDayCounts(2023);
            expect(days2023[1]).toBe(28);
        });

        it('모든 월의 일수 확인 (윤년)', () => {
            const days = AstroTime.monthDayCounts(2024);
            expect(days).toEqual([31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]);
        });

        it('모든 월의 일수 확인 (평년)', () => {
            const days = AstroTime.monthDayCounts(2023);
            expect(days).toEqual([31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]);
        });
    });

    describe('monthMidDay() - 월 중간일', () => {
        it('31일 월의 중간일', () => {
            expect(AstroTime.monthMidDay(2024, 1)).toBe(16); // ceil(31/2) = 16
            expect(AstroTime.monthMidDay(2024, 3)).toBe(16);
        });

        it('30일 월의 중간일', () => {
            expect(AstroTime.monthMidDay(2024, 4)).toBe(15); // ceil(30/2) = 15
            expect(AstroTime.monthMidDay(2024, 6)).toBe(15);
        });

        it('2월 중간일 (윤년/평년)', () => {
            expect(AstroTime.monthMidDay(2024, 2)).toBe(15); // ceil(29/2) = 15
            expect(AstroTime.monthMidDay(2023, 2)).toBe(14); // ceil(28/2) = 14
        });
    });

    describe('jd() - 율리우스일 계산', () => {
        /**
         * 검증 사이트: https://planetcalc.com/503/
         * 또는 "Astronomical Algorithms" by Jean Meeus
         */

        it('J2000.0 기원 (2000년 1월 1일 12:00 TT)', () => {
            const jd = AstroTime.jd(2000, 1, 1, 12, 0, 0);
            expect(jd).toBeCloseTo(2451545.0, 4);
        });

        it('2024년 1월 1일 정오', () => {
            // planetcalc.com 검증값: 2460310.5
            const jd = AstroTime.jd(2024, 1, 1, 12, 0, 0);
            expect(jd).toBeCloseTo(2460311.0, 1);
        });

        it('2024년 6월 21일 12:00 (하지)', () => {
            const jd = AstroTime.jd(2024, 6, 21, 12, 0, 0);
            // 대략적인 값 확인
            expect(jd).toBeGreaterThan(2460480);
            expect(jd).toBeLessThan(2460490);
        });

        it('시간 변화에 따른 JD 변화', () => {
            const jd0 = AstroTime.jd(2024, 1, 1, 0, 0, 0);
            const jd12 = AstroTime.jd(2024, 1, 1, 12, 0, 0);
            const jd24 = AstroTime.jd(2024, 1, 2, 0, 0, 0);

            expect(jd12 - jd0).toBeCloseTo(0.5, 6);
            expect(jd24 - jd0).toBeCloseTo(1.0, 6);
        });

        it('분/초 단위 정확도', () => {
            const jd1 = AstroTime.jd(2024, 1, 1, 12, 0, 0);
            const jd2 = AstroTime.jd(2024, 1, 1, 12, 30, 0);
            const jd3 = AstroTime.jd(2024, 1, 1, 12, 0, 30);

            // 30분 = 0.5시간 = 0.5/24일
            expect(jd2 - jd1).toBeCloseTo(30 / 1440, 8);
            // 30초 = 30/86400일
            expect(jd3 - jd1).toBeCloseTo(30 / 86400, 8);
        });
    });

    describe('jd2Date() / jd2Time() - JD 분해', () => {
        it('JD에서 날짜 부분 추출', () => {
            const jd = AstroTime.jd(2024, 1, 15, 18, 30, 0);
            const dateOnly = AstroTime.jd2Date(jd);

            // 날짜 부분은 0시 기준 (xx.5)
            expect(dateOnly % 1).toBeCloseTo(0.5, 6);
        });

        it('JD에서 시간 부분 추출', () => {
            const jd = AstroTime.jd(2024, 1, 15, 18, 0, 0);
            const time = AstroTime.jd2Time(jd);

            expect(time).toBeCloseTo(18, 4);
        });

        it('자정 시간 추출', () => {
            const jd = AstroTime.jd(2024, 1, 15, 0, 0, 0);
            const time = AstroTime.jd2Time(jd);

            expect(time).toBeCloseTo(0, 4);
        });
    });

    describe('dayOfYear() - 연중 일수', () => {
        it('1월 1일은 1일', () => {
            expect(AstroTime.dayOfYear(2024, 1, 1)).toBe(1);
        });

        it('12월 31일 (윤년)', () => {
            expect(AstroTime.dayOfYear(2024, 12, 31)).toBe(366);
        });

        it('12월 31일 (평년)', () => {
            expect(AstroTime.dayOfYear(2023, 12, 31)).toBe(365);
        });

        it('3월 1일 (윤년 vs 평년)', () => {
            // 윤년: 1월(31) + 2월(29) + 1 = 61
            expect(AstroTime.dayOfYear(2024, 3, 1)).toBe(61);
            // 평년: 1월(31) + 2월(28) + 1 = 60
            expect(AstroTime.dayOfYear(2023, 3, 1)).toBe(60);
        });

        it('춘분 (3월 21일 경)', () => {
            expect(AstroTime.dayOfYear(2024, 3, 21)).toBe(81);
        });
    });

    describe('equationOfTimeMinutes() - 시각방정식', () => {
        /**
         * 시각방정식 특성:
         * - 2월 초: 약 -14분 (태양이 늦음)
         * - 5월 중순: 약 +4분
         * - 7월 말: 약 -6분
         * - 11월 초: 약 +16분 (태양이 빠름)
         */

        it('2월 초: 음의 최대값 근처 (~-14분)', () => {
            const eot = AstroTime.equationOfTimeMinutes(2024, 2, 11);
            expect(eot).toBeLessThan(-10);
            expect(eot).toBeGreaterThan(-16);
        });

        it('11월 초: 양의 최대값 근처 (~+16분)', () => {
            const eot = AstroTime.equationOfTimeMinutes(2024, 11, 3);
            expect(eot).toBeGreaterThan(14);
            expect(eot).toBeLessThan(18);
        });

        it('4월 15일경: 0에 가까움', () => {
            const eot = AstroTime.equationOfTimeMinutes(2024, 4, 15);
            expect(Math.abs(eot)).toBeLessThan(2);
        });

        it('연간 범위: -15분 ~ +17분 이내', () => {
            for (let month = 1; month <= 12; month++) {
                const eot = AstroTime.equationOfTimeMinutes(2024, month, 15);
                expect(eot).toBeGreaterThan(-17);
                expect(eot).toBeLessThan(18);
            }
        });
    });

    describe('시간 변환 체인', () => {
        let astroTime;

        beforeEach(() => {
            // 서울 기준 (UTC+9, 경도 126.98, 위도 37.57)
            astroTime = new AstroTime(9, 126.98, 37.57);
        });

        it('생성자: 경도/위도가 라디안으로 변환됨', () => {
            expect(astroTime.dgmt).toBe(9);
            expect(astroTime.glon).toBeCloseTo(126.98 * AstroMath.D2R, 8);
            expect(astroTime.glat).toBeCloseTo(37.57 * AstroMath.D2R, 8);
        });

        it('LCT → UT → LCT 왕복 변환', () => {
            const lct = AstroTime.jd(2024, 6, 21, 21, 0, 0); // 한국 시간 21시
            const ut = astroTime.LCT2UT(lct);
            const lct2 = astroTime.UT2LCT(ut);

            expect(lct2).toBeCloseTo(lct, 10);
        });

        it('UT → GST → UT 왕복 변환', () => {
            const ut = AstroTime.jd(2024, 6, 21, 12, 0, 0);
            const gst = AstroTime.UT2GST(ut);
            const ut2 = AstroTime.GST2UT(gst);

            // 근사적으로 일치 (항성시 변환 특성상 완벽하지 않을 수 있음)
            expect(ut2).toBeCloseTo(ut, 4);
        });

        it('GST → LST → GST 왕복 변환', () => {
            const gst = AstroTime.jd(2024, 6, 21, 12, 0, 0);
            const lst = astroTime.GST2LST(gst);
            const gst2 = astroTime.LST2GST(lst);

            expect(gst2).toBeCloseTo(gst, 10);
        });

        it('LCT → LST 변환 체인', () => {
            const lct = AstroTime.jd(2024, 6, 21, 21, 0, 0);
            const lst = astroTime.LCT2LST(lct);

            // LST는 LCT와 다름 (항성시는 태양시보다 빠름)
            expect(lst).not.toBeCloseTo(lct, 2);
        });
    });

    describe('lasn() / lamn() - 진정오/진정자정', () => {
        let astroTime;

        beforeEach(() => {
            // 서울 기준
            astroTime = new AstroTime(9, 126.98, 37.57);
        });

        it('서울의 진정오는 약 12:30 전후', () => {
            // 서울은 표준시 기준 자오선(135°E)보다 서쪽이므로
            // 진정오가 12시보다 늦음
            const noon = astroTime.lasn(2024, 6, 21);

            expect(noon).toBeGreaterThan(12);
            expect(noon).toBeLessThan(13);
        });

        it('진정자정은 진정오 ± 12시간', () => {
            const noon = astroTime.lasn(2024, 6, 21);
            const midnight = astroTime.lamn(2024, 6, 21);

            const diff = Math.abs(noon - midnight);
            // 12시간 차이 (또는 24-12=12)
            expect(diff).toBeCloseTo(12, 1);
        });

        it('시각방정식에 따른 계절 변화', () => {
            // 2월: 시각방정식이 음수 → 진정오가 더 늦어짐
            const feb = astroTime.lasn(2024, 2, 11);
            // 11월: 시각방정식이 양수 → 진정오가 더 빨라짐
            const nov = astroTime.lasn(2024, 11, 3);

            // 2월이 11월보다 진정오가 늦음
            expect(feb).toBeGreaterThan(nov);
        });

        it('DST 옵션 적용', () => {
            const noon = astroTime.lasn(2024, 6, 21, 0);
            const noonDST = astroTime.lasn(2024, 6, 21, 1);

            expect(noonDST - noon).toBeCloseTo(1, 6);
        });
    });

    describe('hourForDateRing() - 날짜환 기준 시각', () => {
        let astroTime;

        beforeEach(() => {
            astroTime = new AstroTime(9, 126.98, 37.57);
        });

        it('MIDNIGHT 모드: 0시 반환', () => {
            const hour = astroTime.hourForDateRing(2024, 6, 21, 'MIDNIGHT');
            expect(hour).toBeCloseTo(0, 6);
        });

        it('LOCAL_NOON 모드: 12시 반환', () => {
            const hour = astroTime.hourForDateRing(2024, 6, 21, 'LOCAL_NOON');
            expect(hour).toBeCloseTo(12, 6);
        });

        it('LASN 모드: 진정오 반환', () => {
            const hour = astroTime.hourForDateRing(2024, 6, 21, 'LASN');
            const lasn = astroTime.lasn(2024, 6, 21);
            expect(hour).toBeCloseTo(lasn, 6);
        });

        it('LAMN 모드: 진정자정 반환', () => {
            const hour = astroTime.hourForDateRing(2024, 6, 21, 'LAMN');
            const lamn = astroTime.lamn(2024, 6, 21);
            expect(hour).toBeCloseTo(lamn, 6);
        });

        it('LOCAL_21H 모드: 21시 반환', () => {
            const hour = astroTime.hourForDateRing(2024, 6, 21, 'LOCAL_21H');
            expect(hour).toBeCloseTo(21, 6);
        });

        it('기본값(알 수 없는 모드): 0시 반환', () => {
            const hour = astroTime.hourForDateRing(2024, 6, 21, 'UNKNOWN');
            expect(hour).toBeCloseTo(0, 6);
        });
    });

    describe('daysInYear() - 연간 일수', () => {
        let astroTime;

        beforeEach(() => {
            astroTime = new AstroTime(9, 126.98, 37.57);
        });

        it('윤년은 366일', () => {
            expect(astroTime.daysInYear(2024)).toBe(366);
            expect(astroTime.daysInYear(2000)).toBe(366);
        });

        it('평년은 365일', () => {
            expect(astroTime.daysInYear(2023)).toBe(365);
            expect(astroTime.daysInYear(1900)).toBe(365);
        });
    });
});
