/**
 * @fileoverview 별자리판 JS - 메인 엔트리 포인트
 * @author 지용호 <jidolstar@gmail.com>
 * @version 1.3.0
 * @license MIT
 */

import Planisphere from '../core/planisphere.js';
import { formatDMS, TimezoneService } from '../core/util.js';
import { STORAGE_KEYS, DEFAULT_LOCATION } from '../core/constants.js';
import LocationModal from './location-modal.js';
import ControlPanel from './control-panel.js';
import SettingsModal from './settings-modal.js';

// 비동기 초기화를 위한 IIFE
(async () => {
    // 1. 초기 테마 설정
    const savedTheme = localStorage.getItem("planisphereTheme") || "default";
    let initialStyles;
    if (savedTheme === "dark") {
        document.body.style.background = "#000";
        initialStyles = Planisphere.darkStyles;
    } else if (savedTheme === "light") {
        document.body.style.background = "#fff";
        initialStyles = Planisphere.lightStyles;
    } else {
        document.body.style.background = "#777";
        initialStyles = Planisphere.defaultStyles;
    }

    // 2. 초기 위치 정보 설정
    const savedLocStr = localStorage.getItem(STORAGE_KEYS.LOCATION);
    let initialLoc = { ...DEFAULT_LOCATION };

    if (savedLocStr) {
        try {
            const parsed = JSON.parse(savedLocStr);
            initialLoc = { ...initialLoc, ...parsed };
        } catch (e) {
            console.error("Failed to parse saved location", e);
        }
    } else {
        // 첫 실행 시 기본값을 명시적으로 저장
        localStorage.setItem(STORAGE_KEYS.LOCATION, JSON.stringify(initialLoc));
    }

    // 3. Planisphere 초기화
    const planisphere = new Planisphere({
        wrapperDomId: '#planisphere',
        currentDate: new Date(),
        lon: initialLoc.lon,
        lat: initialLoc.lat,
        dgmt: initialLoc.dgmt,
        tzName: initialLoc.tzName,
        styles: initialStyles
    });

    // 3-1. 비동기 초기화 (타임존 라이브러리 로드)
    await planisphere.initialize();

    // 4. 컴포넌트 초기화
    const controlPanel = new ControlPanel(planisphere);
    const settingsModal = new SettingsModal(planisphere, savedTheme);

    // 5. 위치 관련 설정 및 모달
    const $locText = document.getElementById('ps-location-text');
    const $locEdit = document.getElementById('ps-location-edit');

    const updateLocationDisplay = () => {
        if ($locText) {
            const dmsText = `${formatDMS(planisphere.lat, true)} / ${formatDMS(planisphere.lon, false)}`;
            const gmtOffset = `(GMT ${planisphere.dgmt >= 0 ? '+' : ''}${planisphere.dgmt})`;
            const tzNameText = planisphere.tzName ? ` [${planisphere.tzName}]` : '';
            $locText.textContent = `${dmsText} ${gmtOffset}${tzNameText}`;
        }
    };

    const locationModal = new LocationModal({
        modalId: 'ps-map-modal',
        canvasId: 'ps-map-canvas',
        wrapperId: 'ps-map-wrapper',
        infoId: 'ps-selected-location-text',
        dgmtInputId: 'ps-map-dgmt',
        tzInfoId: 'ps-map-tz-name',
        applyBtnId: 'ps-map-apply',
        cancelBtnId: 'ps-map-cancel',
        closeBtnId: 'ps-map-modal-close',
        restrictedZoneId: 'ps-map-restricted-zone',
        imageSrc: 'images/world_map.jpg',
        onApply: async (lon, lat, dgmt, tzName) => {
            await planisphere.setLocation(lon, lat, dgmt, tzName);
            updateLocationDisplay();

            localStorage.setItem(STORAGE_KEYS.LOCATION, JSON.stringify({
                lon: planisphere.lon,
                lat: planisphere.lat,
                dgmt: planisphere.dgmt,
                tzName: planisphere.tzName
            }));
        }
    });

    updateLocationDisplay();

    if ($locEdit) {
        $locEdit.onclick = () => {
            locationModal.open(planisphere.lon, planisphere.lat, planisphere.dgmt, planisphere.tzName);
        };
    }
})();
