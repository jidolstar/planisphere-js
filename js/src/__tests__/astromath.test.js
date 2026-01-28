/**
 * @fileoverview AstroMath 단위 테스트
 * 천문학 수학 상수 및 유틸리티 함수 검증
 */

import { describe, it, expect } from 'vitest';
import { AstroMath } from '../astronomy.js';

describe('AstroMath', () => {
    describe('상수 검증', () => {
        it('R2D: 라디안→도 변환 계수', () => {
            // 180/π ≈ 57.2958
            expect(AstroMath.R2D).toBeCloseTo(57.29577951308232, 10);
            // 1 라디안 = 약 57.3도
            expect(1 * AstroMath.R2D).toBeCloseTo(57.2958, 4);
        });

        it('D2R: 도→라디안 변환 계수', () => {
            // π/180 ≈ 0.0175
            expect(AstroMath.D2R).toBeCloseTo(0.017453292519943295, 10);
            // 180도 = π 라디안
            expect(180 * AstroMath.D2R).toBeCloseTo(Math.PI, 10);
        });

        it('R2D * D2R = 1 (역변환 검증)', () => {
            expect(AstroMath.R2D * AstroMath.D2R).toBeCloseTo(1, 10);
        });

        it('R2H: 라디안→시 변환 계수', () => {
            // 12/π ≈ 3.8197
            expect(AstroMath.R2H).toBeCloseTo(12 / Math.PI, 10);
            // 2π 라디안 = 24시
            expect(AstroMath.TPI * AstroMath.R2H).toBeCloseTo(24, 10);
        });

        it('H2R: 시→라디안 변환 계수', () => {
            // π/12 ≈ 0.2618
            expect(AstroMath.H2R).toBeCloseTo(Math.PI / 12, 10);
            // 24시 = 2π 라디안
            expect(24 * AstroMath.H2R).toBeCloseTo(AstroMath.TPI, 10);
        });

        it('J2000: J2000.0 기원 율리우스일', () => {
            // 2000년 1월 1일 12:00 TT의 율리우스일
            expect(AstroMath.J2000).toBe(2451545.0);
        });

        it('PI, TPI, HPI 관계', () => {
            expect(AstroMath.TPI).toBeCloseTo(2 * AstroMath.PI, 10);
            expect(AstroMath.HPI).toBeCloseTo(AstroMath.PI / 2, 10);
        });
    });

    describe('mod() - 나머지 연산', () => {
        it('양수 나머지', () => {
            expect(AstroMath.mod(362.2, 360)).toBeCloseTo(2.2, 10);
            expect(AstroMath.mod(720, 360)).toBeCloseTo(0, 10);
            expect(AstroMath.mod(450, 360)).toBeCloseTo(90, 10);
        });

        it('음수 입력 처리 (항상 양수 결과)', () => {
            expect(AstroMath.mod(-10, 360)).toBeCloseTo(350, 10);
            expect(AstroMath.mod(-90, 360)).toBeCloseTo(270, 10);
            expect(AstroMath.mod(-360, 360)).toBeCloseTo(0, 10);
        });

        it('시간 범위 (24시간)', () => {
            expect(AstroMath.mod(25, 24)).toBeCloseTo(1, 10);
            expect(AstroMath.mod(-1, 24)).toBeCloseTo(23, 10);
            expect(AstroMath.mod(48, 24)).toBeCloseTo(0, 10);
        });

        it('소수점 처리', () => {
            expect(AstroMath.mod(10.5, 3)).toBeCloseTo(1.5, 10);
            expect(AstroMath.mod(-0.5, 24)).toBeCloseTo(23.5, 10);
        });
    });

    describe('normalize() - 범위 정규화', () => {
        it('[0, 360) 범위로 정규화', () => {
            expect(AstroMath.normalize(450, 0, 360)).toBeCloseTo(90, 10);
            expect(AstroMath.normalize(-30, 0, 360)).toBeCloseTo(330, 10);
            expect(AstroMath.normalize(360, 0, 360)).toBeCloseTo(0, 10);
            expect(AstroMath.normalize(0, 0, 360)).toBeCloseTo(0, 10);
        });

        it('[0, 24) 범위로 정규화 (시간)', () => {
            expect(AstroMath.normalize(25, 0, 24)).toBeCloseTo(1, 10);
            expect(AstroMath.normalize(-1, 0, 24)).toBeCloseTo(23, 10);
            expect(AstroMath.normalize(48, 0, 24)).toBeCloseTo(0, 10);
        });

        it('[-180, 180) 범위로 정규화', () => {
            expect(AstroMath.normalize(270, -180, 180)).toBeCloseTo(-90, 10);
            expect(AstroMath.normalize(-270, -180, 180)).toBeCloseTo(90, 10);
        });

        it('[0, 2π) 범위로 정규화 (라디안)', () => {
            const TPI = AstroMath.TPI;
            expect(AstroMath.normalize(TPI + 1, 0, TPI)).toBeCloseTo(1, 10);
            expect(AstroMath.normalize(-1, 0, TPI)).toBeCloseTo(TPI - 1, 10);
        });
    });

    describe('단위 변환 실제 사용 케이스', () => {
        it('북극성 적경 변환 (약 2h 31m)', () => {
            // 북극성 적경: 약 2.5시 = 37.5도 = 0.654 라디안
            const raHours = 2.5;
            const raRadians = raHours * AstroMath.H2R;
            const raDegrees = raRadians * AstroMath.R2D;

            expect(raDegrees).toBeCloseTo(37.5, 1);
        });

        it('직각 (90도) 변환', () => {
            const deg90 = 90;
            const rad90 = deg90 * AstroMath.D2R;

            expect(rad90).toBeCloseTo(AstroMath.HPI, 10);
            expect(rad90).toBeCloseTo(Math.PI / 2, 10);
        });

        it('완전한 원 (360도/24시/2π)', () => {
            const fullCircleDeg = 360;
            const fullCircleHours = 24;

            expect(fullCircleDeg * AstroMath.D2R).toBeCloseTo(AstroMath.TPI, 10);
            expect(fullCircleHours * AstroMath.H2R).toBeCloseTo(AstroMath.TPI, 10);
        });
    });

    describe('불변성 검증', () => {
        it('Object.freeze로 인해 수정 불가', () => {
            // strict mode에서는 에러, non-strict에서는 무시
            const originalR2D = AstroMath.R2D;

            // 시도해도 변경되지 않음
            try {
                AstroMath.R2D = 999;
            } catch (e) {
                // TypeError in strict mode
            }

            expect(AstroMath.R2D).toBe(originalR2D);
        });
    });
});
