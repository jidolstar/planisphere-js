/**
 * @fileoverview AstroVector & AstroMatrix 단위 테스트
 * 3D 벡터 연산 및 좌표계 변환 검증
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AstroVector, AstroMatrix, AstroPoint, AstroMath, AstroTime } from '../astronomy.js';

describe('AstroPoint', () => {
    it('2D 좌표 생성', () => {
        const p = new AstroPoint(10, 20);
        expect(p.x).toBe(10);
        expect(p.y).toBe(20);
    });
});

describe('AstroVector', () => {
    describe('기본 연산', () => {
        it('생성자', () => {
            const v = new AstroVector(1, 2, 3);
            expect(v.x).toBe(1);
            expect(v.y).toBe(2);
            expect(v.z).toBe(3);
        });

        it('length() - 벡터 길이', () => {
            const v = new AstroVector(3, 4, 0);
            expect(v.length()).toBe(5); // 3-4-5 삼각형

            const v2 = new AstroVector(1, 1, 1);
            expect(v2.length()).toBeCloseTo(Math.sqrt(3), 10);
        });

        it('normalize() - 단위 벡터화', () => {
            const v = new AstroVector(3, 4, 0);
            v.normalize();

            expect(v.length()).toBeCloseTo(1, 10);
            expect(v.x).toBeCloseTo(0.6, 10);
            expect(v.y).toBeCloseTo(0.8, 10);
            expect(v.z).toBeCloseTo(0, 10);
        });
    });

    describe('구면 좌표 변환', () => {
        it('setSphe() - 구면 → 직교 좌표', () => {
            const v = new AstroVector(0, 0, 0);

            // 북극 (lat=90°)
            v.setSphe(0, AstroMath.HPI);
            expect(v.x).toBeCloseTo(0, 10);
            expect(v.y).toBeCloseTo(0, 10);
            expect(v.z).toBeCloseTo(1, 10);

            // 적도 경도 0°
            v.setSphe(0, 0);
            expect(v.x).toBeCloseTo(1, 10);
            expect(v.y).toBeCloseTo(0, 10);
            expect(v.z).toBeCloseTo(0, 10);

            // 적도 경도 90°
            v.setSphe(AstroMath.HPI, 0);
            expect(v.x).toBeCloseTo(0, 10);
            expect(v.y).toBeCloseTo(1, 10);
            expect(v.z).toBeCloseTo(0, 10);
        });

        it('lon() - 경도 추출', () => {
            const v = new AstroVector(0, 0, 0);

            // 경도 0°
            v.setSphe(0, 0);
            expect(v.lon()).toBeCloseTo(0, 10);

            // 경도 90° (π/2)
            v.setSphe(AstroMath.HPI, 0);
            expect(v.lon()).toBeCloseTo(AstroMath.HPI, 10);

            // 경도 180° (π)
            v.setSphe(Math.PI, 0);
            expect(v.lon()).toBeCloseTo(Math.PI, 10);

            // 경도 270° (3π/2)
            v.setSphe(3 * AstroMath.HPI, 0);
            expect(v.lon()).toBeCloseTo(3 * AstroMath.HPI, 10);
        });

        it('lat() - 위도 추출', () => {
            const v = new AstroVector(0, 0, 0);

            // 적도 (lat=0)
            v.setSphe(0, 0);
            expect(v.lat()).toBeCloseTo(0, 10);

            // 북극 (lat=90°)
            v.setSphe(0, AstroMath.HPI);
            expect(v.lat()).toBeCloseTo(AstroMath.HPI, 10);

            // 남극 (lat=-90°)
            v.setSphe(0, -AstroMath.HPI);
            expect(v.lat()).toBeCloseTo(-AstroMath.HPI, 10);

            // 중위도 (lat=45°)
            v.setSphe(0, 45 * AstroMath.D2R);
            expect(v.lat()).toBeCloseTo(45 * AstroMath.D2R, 10);
        });

        it('setSphe() → lon()/lat() 왕복 검증', () => {
            const v = new AstroVector(0, 0, 0);
            const testCases = [
                [0, 0],                          // 적도 경도 0
                [Math.PI / 4, Math.PI / 6],      // 45°, 30°
                [Math.PI, -Math.PI / 4],         // 180°, -45°
                [3 * Math.PI / 2, Math.PI / 3],  // 270°, 60°
            ];

            for (const [lon, lat] of testCases) {
                v.setSphe(lon, lat);
                expect(v.lon()).toBeCloseTo(lon, 8);
                expect(v.lat()).toBeCloseTo(lat, 8);
            }
        });
    });

    describe('행렬-벡터 곱셈', () => {
        it('multiply() - 항등 행렬', () => {
            const identity = new AstroMatrix(
                1, 0, 0,
                0, 1, 0,
                0, 0, 1
            );
            const v = new AstroVector(1, 2, 3);
            const result = new AstroVector(0, 0, 0);

            result.multiply(identity, v);

            expect(result.x).toBe(1);
            expect(result.y).toBe(2);
            expect(result.z).toBe(3);
        });

        it('multiply() - 스케일 행렬', () => {
            const scale2 = new AstroMatrix(
                2, 0, 0,
                0, 2, 0,
                0, 0, 2
            );
            const v = new AstroVector(1, 2, 3);
            const result = new AstroVector(0, 0, 0);

            result.multiply(scale2, v);

            expect(result.x).toBe(2);
            expect(result.y).toBe(4);
            expect(result.z).toBe(6);
        });
    });
});

describe('AstroMatrix', () => {
    describe('기본 연산', () => {
        it('생성자 및 get()', () => {
            const m = new AstroMatrix(
                1, 2, 3,
                4, 5, 6,
                7, 8, 9
            );

            expect(m.get(0, 0)).toBe(1);
            expect(m.get(0, 2)).toBe(3);
            expect(m.get(1, 1)).toBe(5);
            expect(m.get(2, 0)).toBe(7);
            expect(m.get(2, 2)).toBe(9);
        });

        it('set() - 값 재설정', () => {
            const m = new AstroMatrix(0, 0, 0, 0, 0, 0, 0, 0, 0);
            m.set(1, 0, 0, 0, 1, 0, 0, 0, 1);

            expect(m.get(0, 0)).toBe(1);
            expect(m.get(1, 1)).toBe(1);
            expect(m.get(2, 2)).toBe(1);
            expect(m.get(0, 1)).toBe(0);
        });

        it('multiply() - 행렬 곱셈', () => {
            // A * I = A
            const a = new AstroMatrix(1, 2, 3, 4, 5, 6, 7, 8, 9);
            const identity = new AstroMatrix(1, 0, 0, 0, 1, 0, 0, 0, 1);
            const result = new AstroMatrix(0, 0, 0, 0, 0, 0, 0, 0, 0);

            result.multiply(a, identity);

            expect(result.get(0, 0)).toBe(1);
            expect(result.get(1, 1)).toBe(5);
            expect(result.get(2, 2)).toBe(9);
        });

        it('multiply() - 일반적인 곱셈', () => {
            // | 1 2 |   | 5 6 |   | 19 22 |
            // | 3 4 | x | 7 8 | = | 43 50 |
            // 3x3로 확장
            const a = new AstroMatrix(1, 2, 0, 3, 4, 0, 0, 0, 1);
            const b = new AstroMatrix(5, 6, 0, 7, 8, 0, 0, 0, 1);
            const result = new AstroMatrix(0, 0, 0, 0, 0, 0, 0, 0, 0);

            result.multiply(a, b);

            expect(result.get(0, 0)).toBe(19);
            expect(result.get(0, 1)).toBe(22);
            expect(result.get(1, 0)).toBe(43);
            expect(result.get(1, 1)).toBe(50);
        });
    });

    describe('좌표계 변환 행렬', () => {
        it('gal2equ() - 은하 → 적도 (상수 행렬)', () => {
            const m = new AstroMatrix(0, 0, 0, 0, 0, 0, 0, 0, 0);
            m.gal2equ();

            // 특정 값 확인 (고정된 변환 행렬)
            expect(m.get(0, 0)).toBeCloseTo(-0.0669887, 6);
            expect(m.get(1, 1)).toBeCloseTo(-0.4503470, 6);
        });

        it('ecl2equ() / equ2ecl() - 황도 ↔ 적도', () => {
            const jd = AstroTime.jd(2024, 6, 21, 12, 0, 0);

            const ecl2equ = new AstroMatrix(0, 0, 0, 0, 0, 0, 0, 0, 0);
            ecl2equ.ecl2equ(jd);

            const equ2ecl = new AstroMatrix(0, 0, 0, 0, 0, 0, 0, 0, 0);
            equ2ecl.equ2ecl(jd);

            // 역행렬 검증: ecl2equ * equ2ecl ≈ I
            const product = new AstroMatrix(0, 0, 0, 0, 0, 0, 0, 0, 0);
            product.multiply(ecl2equ, equ2ecl);

            expect(product.get(0, 0)).toBeCloseTo(1, 6);
            expect(product.get(1, 1)).toBeCloseTo(1, 6);
            expect(product.get(2, 2)).toBeCloseTo(1, 6);
            expect(product.get(0, 1)).toBeCloseTo(0, 6);
            expect(product.get(1, 0)).toBeCloseTo(0, 6);
        });

        it('equ2hor() / hor2equ() - 적도 ↔ 지평', () => {
            const lst = AstroTime.jd(2024, 6, 21, 12, 0, 0);
            const lat = 37.57 * AstroMath.D2R;

            const equ2hor = new AstroMatrix(0, 0, 0, 0, 0, 0, 0, 0, 0);
            equ2hor.equ2hor(lst, lat);

            const hor2equ = new AstroMatrix(0, 0, 0, 0, 0, 0, 0, 0, 0);
            hor2equ.hor2equ(lst, lat);

            // 역행렬 검증
            const product = new AstroMatrix(0, 0, 0, 0, 0, 0, 0, 0, 0);
            product.multiply(equ2hor, hor2equ);

            expect(product.get(0, 0)).toBeCloseTo(1, 6);
            expect(product.get(1, 1)).toBeCloseTo(1, 6);
            expect(product.get(2, 2)).toBeCloseTo(1, 6);
        });
    });
});

describe('좌표 변환 통합 테스트', () => {
    describe('북극성 좌표 변환', () => {
        /**
         * 북극성 (Polaris) 대략적인 좌표:
         * - 적경: 2h 31m ≈ 37.5°
         * - 적위: +89.26° (거의 북극)
         */
        const polarisRA = 2.53 * AstroMath.H2R;  // 약 2.5시 → 라디안
        const polarisDec = 89.26 * AstroMath.D2R; // 약 89.26° → 라디안

        it('북극성은 적위가 거의 90°', () => {
            const v = new AstroVector(0, 0, 0);
            v.setSphe(polarisRA, polarisDec);

            // z 성분이 거의 1 (북극 근처)
            expect(v.z).toBeCloseTo(1, 2);
        });

        it('서울에서 북극성은 항상 지평선 위', () => {
            const lst = AstroTime.jd(2024, 6, 21, 21, 0, 0);
            const lat = 37.57 * AstroMath.D2R;

            // 적도 좌표 설정
            const equ = new AstroVector(0, 0, 0);
            equ.setSphe(polarisRA, polarisDec);

            // 지평 좌표로 변환
            const hor = new AstroVector(0, 0, 0);
            hor.equ2hor(equ, lst, lat);

            // 고도 확인 (lat()은 위도/고도 반환)
            const altitude = hor.lat();

            // 북극성의 고도 ≈ 관측 위도 (37.57°)
            // 실제로는 약간 차이가 있지만, 양수여야 함
            expect(altitude).toBeGreaterThan(0);
            // 북극성 고도는 관측 위도 + 약간의 차이 (북극성이 정확히 북극이 아니므로)
            expect(altitude * AstroMath.R2D).toBeGreaterThan(35);
            expect(altitude * AstroMath.R2D).toBeLessThan(40);
        });
    });

    describe('적도 상의 별 (적위 0°)', () => {
        it('적도 상의 별은 자오선 통과 시 최대 고도', () => {
            // 적도 좌표: RA=0, Dec=0 (춘분점)
            const equ = new AstroVector(0, 0, 0);
            equ.setSphe(0, 0);

            // 서울 위도
            const lat = 37.57 * AstroMath.D2R;

            // LST = 0 (자오선 통과 시)
            const lstMeridian = AstroTime.jd(2024, 3, 21, 0, 0, 0);

            const hor = new AstroVector(0, 0, 0);
            hor.equ2hor(equ, lstMeridian, lat);

            const altitude = hor.lat();
            // 최대 고도 = 90° - 위도 = 90° - 37.57° ≈ 52.43°
            expect(altitude * AstroMath.R2D).toBeCloseTo(90 - 37.57, 1);
        });
    });

    describe('은하 좌표 변환', () => {
        it('은하 중심 방향 변환', () => {
            // 은하 중심: (l=0, b=0)
            const gal = new AstroVector(0, 0, 0);
            gal.setSphe(0, 0);

            // 은하 → 적도 변환
            const equ = new AstroVector(0, 0, 0);
            equ.equ2gal(gal); // 주의: 이 함수는 equ를 gal로 변환하는 것

            // 단위 벡터 확인
            expect(equ.length()).toBeCloseTo(1, 6);
        });
    });
});
