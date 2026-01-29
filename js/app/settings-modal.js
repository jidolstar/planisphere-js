/**
 * @fileoverview 별자리판 JS - 설정 모달 모듈
 * @author 지용호 <jidolstar@gmail.com>
 * @version 1.0.0
 * @license MIT
 */

export default class SettingsModal {
    constructor(planisphere, savedTheme) {
        this.planisphere = planisphere;
        this.savedTheme = savedTheme;

        this.$modal = document.getElementById("ps-modal");
        this.$modalClose = document.getElementById("ps-modal-close");
        this.$settingsBtn = document.getElementById("ps-settings");
        this.$usageDiv = document.getElementById("ps-usage");
        this.$welcome = document.getElementById("ps-welcome-text");

        this._initUsage();
        this._initEvents();
        this._initThemeSelection();
    }

    _initUsage() {
        this.$usageDiv.innerHTML = `
            <p>📱 스마트폰</p>
            <ul>
                <li>회전: 한 손가락 드래그</li>
                <li>이동: 두 손가락 드래그</li>
                <li>확대/축소: 핀치 제스처</li>
            </ul>
            <p>💻 PC</p>
            <ul>
                <li>회전: 마우스 드래그</li>
                <li>이동: 마우스 오른쪽 버튼 드래그</li>
                <li>확대/축소: 마우스 휠</li>
            </ul>
        `;
    }

    open(showWelcome = false) {
        this.$modal.style.display = "flex";
        this.$modal.classList.add("open");
        if (showWelcome) {
            this.$welcome.style.display = "block";
        } else {
            this.$welcome.style.display = "none";
        }
    }

    close() {
        this.$modal.style.display = "none";
        this.$modal.classList.remove("open");
    }

    _initEvents() {
        // 열기
        this.$settingsBtn.addEventListener("click", () => {
            this.open(false);
        });

        // 닫기
        this.$modalClose.addEventListener("click", () => {
            this.close();
        });

        // ESC 키로 닫기
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                this.close();
            }
        });

        // 첫 방문 확인 (초기화 시 호출하거나 main.js에서 처리)
        const firstVisitDone = localStorage.getItem("planisphereFirstVisitDone");
        if (!firstVisitDone) {
            this.open(true);
            localStorage.setItem("planisphereFirstVisitDone", "true");
        }
    }

    _initThemeSelection() {
        const Planisphere = this.planisphere.constructor; // Static access
        document.querySelectorAll('.ps-theme-select img').forEach(img => {
            if (img.dataset.theme === this.savedTheme) img.classList.add("active");

            img.addEventListener("click", () => {
                document.querySelectorAll('.ps-theme-select img').forEach(i => i.classList.remove('active'));
                img.classList.add('active');

                const theme = img.dataset.theme;
                localStorage.setItem("planisphereTheme", theme);

                if (theme === "dark") {
                    document.body.style.background = "#000";
                    this.planisphere.setStyles(Planisphere.darkStyles);
                } else if (theme === "light") {
                    document.body.style.background = "#fff";
                    this.planisphere.setStyles(Planisphere.lightStyles);
                } else {
                    document.body.style.background = "#777";
                    this.planisphere.setStyles(Planisphere.defaultStyles);
                }
            });
        });
    }
}
