/**
 * @fileoverview EquiDistanceProjection 단위 테스트
 * 등거리 방위 투영 검증
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EquiDistanceProjection, AstroMath } from '../astronomy.js';

describe('EquiDistanceProjection', () => {
    describe('생성자 및 초기화', () => {
        it('화면 반경과 적위 한계 설정', () => {
            const screenRadius = 300;
            const limitDE = -30 * AstroMath.D2R; // -30도

            const proj = new EquiDistanceProjection(screenRadius, limitDE);

            expect(proj.screenRadius).toBe(300);
            expect(proj.limitDE).toBeCloseTo(-30 * AstroMath.D2R, 10);
        });

        it('가상 천구 반경 계산', () => {
            const screenRadius = 300;
            const limitDE = -30 * AstroMath.D2R;

            const proj = new EquiDistanceProjection(screenRadius, limitDE);

            // virtualCelestrialRadius = screenRadius / |HPI - limitDE|
            // = 300 / |π/2 - (-π/6)| = 300 / |π/2 + π/6| = 300 / (2π/3)
            const expectedRadius = screenRadius / Math.abs(AstroMath.HPI - limitDE);
            expect(proj.virtualCelestrialRadius).toBeCloseTo(expectedRadius, 10);
        });
    });

    describe('project() - 투영 계산', () => {
        let proj;

        beforeEach(() => {
            // 화면 반경 300px, 적위 한계 -30도 (120도 범위)
            proj = new EquiDistanceProjection(300, -30 * AstroMath.D2R);
        });

        describe('북극 (적위 90도)', () => {
            it('북극은 원점 (0, 0)', () => {
                const pos = proj.project(0, AstroMath.HPI);
                expect(pos.x).toBeCloseTo(0, 6);
                expect(pos.y).toBeCloseTo(0, 6);
            });

            it('북극은 적경에 무관하게 원점', () => {
                // 적경이 달라도 북극은 항상 원점
                const pos1 = proj.project(0, AstroMath.HPI);
                const pos2 = proj.project(Math.PI, AstroMath.HPI);
                const pos3 = proj.project(AstroMath.TPI * 0.75, AstroMath.HPI);

                expect(pos1.x).toBeCloseTo(0, 6);
                expect(pos1.y).toBeCloseTo(0, 6);
                expect(pos2.x).toBeCloseTo(0, 6);
                expect(pos2.y).toBeCloseTo(0, 6);
                expect(pos3.x).toBeCloseTo(0, 6);
                expect(pos3.y).toBeCloseTo(0, 6);
            });
        });

        describe('적도 (적위 0도)', () => {
            it('적경 0도 → 양의 x축', () => {
                const pos = proj.project(0, 0);

                expect(pos.x).toBeGreaterThan(0);
                expect(pos.y).toBeCloseTo(0, 6);
            });

            it('적경 90도 → 양의 y축', () => {
                const pos = proj.project(AstroMath.HPI, 0);

                expect(pos.x).toBeCloseTo(0, 6);
                expect(pos.y).toBeGreaterThan(0);
            });

            it('적경 180도 → 음의 x축', () => {
                const pos = proj.project(Math.PI, 0);

                expect(pos.x).toBeLessThan(0);
                expect(Math.abs(pos.y)).toBeLessThan(0.01);
            });

            it('적경 270도 → 음의 y축', () => {
                const pos = proj.project(3 * AstroMath.HPI, 0);

                expect(Math.abs(pos.x)).toBeLessThan(0.01);
                expect(pos.y).toBeLessThan(0);
            });
        });

        describe('적위에 따른 거리', () => {
            it('동일 적경에서 적위가 낮을수록 원점에서 멀어짐', () => {
                const ra = 0;

                // 주의: project()는 내부 객체를 재사용하므로 즉시 거리 계산
                let pos = proj.project(ra, 90 * AstroMath.D2R);  // 북극
                const dist90 = Math.hypot(pos.x, pos.y);

                pos = proj.project(ra, 60 * AstroMath.D2R);
                const dist60 = Math.hypot(pos.x, pos.y);

                pos = proj.project(ra, 30 * AstroMath.D2R);
                const dist30 = Math.hypot(pos.x, pos.y);

                pos = proj.project(ra, 0);                    // 적도
                const dist0 = Math.hypot(pos.x, pos.y);

                expect(dist90).toBeLessThan(dist60);
                expect(dist60).toBeLessThan(dist30);
                expect(dist30).toBeLessThan(dist0);
            });

            it('등거리 투영: 적위 차이에 비례한 거리', () => {
                const ra = 0;

                // 주의: project()는 내부 객체를 재사용하므로 즉시 거리 계산
                // 북극에서 60°, 30°, 0° (각각 30°, 60°, 90° 거리)
                let pos = proj.project(ra, 60 * AstroMath.D2R);
                const dist60 = Math.hypot(pos.x, pos.y);

                pos = proj.project(ra, 30 * AstroMath.D2R);
                const dist30 = Math.hypot(pos.x, pos.y);

                pos = proj.project(ra, 0);
                const dist0 = Math.hypot(pos.x, pos.y);

                // 거리 비율이 1:2:3에 가까워야 함
                expect(dist30 / dist60).toBeCloseTo(2, 1);
                expect(dist0 / dist60).toBeCloseTo(3, 1);
            });
        });

        describe('적경에 따른 각도', () => {
            it('적경이 투영 평면에서의 각도로 변환', () => {
                const dec = 45 * AstroMath.D2R; // 고정된 적위

                // 적경 0° → 각도 0 (양의 x축)
                const pos0 = proj.project(0, dec);
                const angle0 = Math.atan2(pos0.y, pos0.x);
                expect(angle0).toBeCloseTo(0, 4);

                // 적경 90° → 각도 π/2 (양의 y축)
                const pos90 = proj.project(AstroMath.HPI, dec);
                const angle90 = Math.atan2(pos90.y, pos90.x);
                expect(angle90).toBeCloseTo(AstroMath.HPI, 4);

                // 적경 180° → 각도 π (음의 x축)
                const pos180 = proj.project(Math.PI, dec);
                const angle180 = Math.atan2(pos180.y, pos180.x);
                expect(Math.abs(angle180)).toBeCloseTo(Math.PI, 4);
            });

            it('같은 적위에서 적경이 달라도 원점에서의 거리는 동일', () => {
                const dec = 30 * AstroMath.D2R;

                const pos1 = proj.project(0, dec);
                const pos2 = proj.project(Math.PI / 4, dec);
                const pos3 = proj.project(Math.PI, dec);
                const pos4 = proj.project(3 * Math.PI / 2, dec);

                const dist1 = Math.hypot(pos1.x, pos1.y);
                const dist2 = Math.hypot(pos2.x, pos2.y);
                const dist3 = Math.hypot(pos3.x, pos3.y);
                const dist4 = Math.hypot(pos4.x, pos4.y);

                expect(dist1).toBeCloseTo(dist2, 6);
                expect(dist2).toBeCloseTo(dist3, 6);
                expect(dist3).toBeCloseTo(dist4, 6);
            });
        });

        describe('경계 케이스', () => {
            it('적위 한계에서 화면 반경에 위치', () => {
                // 적위 한계가 -30도일 때, 적위 -30도의 별은 화면 가장자리
                const pos = proj.project(0, -30 * AstroMath.D2R);
                const dist = Math.hypot(pos.x, pos.y);

                expect(dist).toBeCloseTo(proj.screenRadius, 2);
            });

            it('남반구 별 (적위 음수)', () => {
                const pos = proj.project(0, -15 * AstroMath.D2R);
                const dist = Math.hypot(pos.x, pos.y);

                // 적도보다 더 멀리 투영
                const posEquator = proj.project(0, 0);
                const distEquator = Math.hypot(posEquator.x, posEquator.y);

                expect(dist).toBeGreaterThan(distEquator);
            });
        });
    });

    describe('screenCoord 재사용', () => {
        it('project()는 내부 객체를 재사용', () => {
            const proj = new EquiDistanceProjection(300, -30 * AstroMath.D2R);

            const pos1 = proj.project(0, 45 * AstroMath.D2R);
            const x1 = pos1.x;
            const y1 = pos1.y;

            // 다른 좌표 투영
            const pos2 = proj.project(Math.PI, 30 * AstroMath.D2R);

            // pos1과 pos2는 같은 객체
            expect(pos1).toBe(pos2);

            // pos1의 값이 변경됨
            expect(pos1.x).not.toBe(x1);
            expect(pos1.y).not.toBe(y1);
        });

        it('값을 보존하려면 복사 필요', () => {
            const proj = new EquiDistanceProjection(300, -30 * AstroMath.D2R);

            const pos1 = proj.project(0, 45 * AstroMath.D2R);
            // 값 복사
            const savedX = pos1.x;
            const savedY = pos1.y;

            // 다른 좌표 투영
            proj.project(Math.PI, 30 * AstroMath.D2R);

            // 복사된 값은 유지
            expect(savedX).not.toBe(pos1.x);
        });
    });

    describe('다양한 화면 크기', () => {
        it('화면 반경에 비례한 출력', () => {
            const proj100 = new EquiDistanceProjection(100, -30 * AstroMath.D2R);
            const proj300 = new EquiDistanceProjection(300, -30 * AstroMath.D2R);

            const ra = Math.PI / 4;
            const dec = 30 * AstroMath.D2R;

            const pos100 = proj100.project(ra, dec);
            const dist100 = Math.hypot(pos100.x, pos100.y);

            const pos300 = proj300.project(ra, dec);
            const dist300 = Math.hypot(pos300.x, pos300.y);

            // 화면 크기 비율 = 거리 비율
            expect(dist300 / dist100).toBeCloseTo(3, 4);
        });

        it('화면 반경에 비례한 각도 유지', () => {
            const proj100 = new EquiDistanceProjection(100, -30 * AstroMath.D2R);
            const proj300 = new EquiDistanceProjection(300, -30 * AstroMath.D2R);

            const ra = Math.PI / 3; // 60도
            const dec = 45 * AstroMath.D2R;

            const pos100 = proj100.project(ra, dec);
            const angle100 = Math.atan2(pos100.y, pos100.x);

            const pos300 = proj300.project(ra, dec);
            const angle300 = Math.atan2(pos300.y, pos300.x);

            // 각도는 동일
            expect(angle100).toBeCloseTo(angle300, 8);
        });
    });

    describe('적위 한계 변화', () => {
        it('적위 한계가 더 낮으면 더 많은 영역 표시', () => {
            const proj30 = new EquiDistanceProjection(300, -30 * AstroMath.D2R);
            const proj60 = new EquiDistanceProjection(300, -60 * AstroMath.D2R);

            // 적도 위치 비교
            const pos30 = proj30.project(0, 0);
            const pos60 = proj60.project(0, 0);

            const dist30 = Math.hypot(pos30.x, pos30.y);
            const dist60 = Math.hypot(pos60.x, pos60.y);

            // 적위 한계가 더 낮은 proj60에서 적도가 더 가까움
            // (같은 화면에 더 넓은 영역을 표시하므로)
            expect(dist60).toBeLessThan(dist30);
        });
    });
});
