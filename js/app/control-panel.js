/**
 * @fileoverview 별자리판 JS - 컨트롤 패널 모듈
 * @author 지용호 <jidolstar@gmail.com>
 * @version 1.0.0
 * @license MIT
 */

export default class ControlPanel {
    constructor(planisphere) {
        this.planisphere = planisphere;

        // --- DOM 요소 ---
        this.$date = document.getElementById('ps-date');
        this.$time = document.getElementById('ps-time');
        this.$now = document.getElementById('ps-now');

        this._initEvents();
        this.initNow();
    }

    // 공통: input값 → Date 변환
    getDateFromInputs() {
        if (!this.$date.value || !this.$time.value) return null;
        return new Date(`${this.$date.value}T${this.$time.value}`);
    }

    // 초기값 현재 시간 반영
    initNow() {
        const now = new Date();
        const pad = n => String(n).padStart(2, '0');
        const Y = now.getFullYear();
        const M = pad(now.getMonth() + 1);
        const D = pad(now.getDate());
        const h = pad(now.getHours());
        const m = pad(now.getMinutes());
        this.$date.value = `${Y}-${M}-${D}`;
        this.$time.value = `${h}:${m}`;
        this.planisphere.setDateTime(now);
    }

    _initEvents() {
        // input 변경 이벤트
        this.$date.addEventListener('change', () => {
            const dt = this.getDateFromInputs();
            if (dt) this.planisphere.setDateTime(dt);
        });
        this.$time.addEventListener('change', () => {
            const dt = this.getDateFromInputs();
            if (dt) this.planisphere.setDateTime(dt);
        });

        // "지금" 버튼
        this.$now.addEventListener('click', () => {
            this.initNow();
        });

        // 프리셋 버튼들
        document.querySelectorAll('.ps-preset').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!this.$date.value) return;
                const [Y, M, D] = this.$date.value.split('-').map(Number);
                const h = Number(btn.dataset.preset);
                const dt = new Date(Y, M - 1, D, h, 0, 0);
                const pad = n => String(n).padStart(2, '0');
                this.$time.value = `${pad(h)}:00`;
                this.planisphere.setDateTime(dt);
            });
        });

        // 증감 버튼 바인딩
        const bindAdjust = (id, unit, delta) => {
            const el = document.getElementById(id);
            if (el) el.onclick = () => this.adjust(unit, delta);
        };

        bindAdjust('year-minus', 'year', -1);
        bindAdjust('year-plus', 'year', +1);
        bindAdjust('month-minus', 'month', -1);
        bindAdjust('month-plus', 'month', +1);
        bindAdjust('day-minus', 'day', -1);
        bindAdjust('day-plus', 'day', +1);
        bindAdjust('hour-minus', 'hour', -1);
        bindAdjust('hour-plus', 'hour', +1);
        bindAdjust('minute-minus', 'minute', -1);
        bindAdjust('minute-plus', 'minute', +1);

        // 접기/펼치기
        const controls = document.getElementById("ps-controls");
        const toggleBtn = document.getElementById("ps-toggle");
        if (toggleBtn && controls) {
            let isCollapsed = false;
            toggleBtn.addEventListener("click", () => {
                isCollapsed = !isCollapsed;
                controls.classList.toggle("collapsed", isCollapsed);
                toggleBtn.textContent = isCollapsed ? "+" : "−";
            });
        }
    }

    // --- 증감 버튼 유틸 ---
    adjust(unit, delta) {
        const dt = this.getDateFromInputs();
        if (!dt) return;
        switch (unit) {
            case 'year': dt.setFullYear(dt.getFullYear() + delta); break;
            case 'month': dt.setMonth(dt.getMonth() + delta); break;
            case 'day': dt.setDate(dt.getDate() + delta); break;
            case 'hour': dt.setHours(dt.getHours() + delta); break;
            case 'minute': dt.setMinutes(dt.getMinutes() + delta); break;
        }
        const pad = n => String(n).padStart(2, '0');
        const Y = dt.getFullYear();
        const M = pad(dt.getMonth() + 1);
        const D = pad(dt.getDate());
        const h = pad(dt.getHours());
        const m = pad(dt.getMinutes());
        this.$date.value = `${Y}-${M}-${D}`;
        this.$time.value = `${h}:${m}`;
        this.planisphere.setDateTime(dt);
    }
}
