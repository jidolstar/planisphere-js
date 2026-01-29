/**
 * @fileoverview 별자리판 JS - 메인 엔트리 포인트
 * @author 지용호 <jidolstar@gmail.com>
 * @version 1.1.2
 * @license MIT
 */

import Planisphere from '../core/planisphere.js';
import { formatDMS } from '../core/util.js';
import { STORAGE_KEYS, DEFAULT_LOCATION } from '../core/constants.js';
import LocationModal from './location-modal.js';
import ControlPanel from './control-panel.js';
import SettingsModal from './settings-modal.js';

const version = '1.1.2';

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
let initialLoc = DEFAULT_LOCATION;
if (savedLocStr) {
    try {
        initialLoc = JSON.parse(savedLocStr);
    } catch (e) {
        console.error("Failed to parse saved location", e);
    }
}

// 3. Planisphere 초기화
const planisphere = new Planisphere({
    wrapperDomId: '#planisphere',
    currentDate: new Date(),
    lon: initialLoc.lon,
    lat: initialLoc.lat,
    dgmt: 9,
    styles: initialStyles,
    version: version
});

// 4. 컴포넌트 초기화
const controlPanel = new ControlPanel(planisphere);
const settingsModal = new SettingsModal(planisphere, savedTheme);

// 5. 위치 관련 설정 및 모달
const $locText = document.getElementById('ps-location-text');
const $locEdit = document.getElementById('ps-location-edit');

let currentLon = initialLoc.lon;
let currentLat = initialLoc.lat;

const updateLocationDisplay = () => {
    if ($locText) {
        $locText.textContent = `${formatDMS(currentLat, true)} / ${formatDMS(currentLon, false)}`;
    }
};

const locationModal = new LocationModal({
    modalId: 'ps-map-modal',
    canvasId: 'ps-map-canvas',
    wrapperId: 'ps-map-wrapper',
    infoId: 'ps-selected-location-text',
    applyBtnId: 'ps-map-apply',
    cancelBtnId: 'ps-map-cancel',
    closeBtnId: 'ps-map-modal-close',
    restrictedZoneId: 'ps-map-restricted-zone',
    imageSrc: 'images/world_map.jpg',
    onApply: (lon, lat) => {
        currentLon = lon;
        currentLat = lat;
        updateLocationDisplay();
        planisphere.setLocation(currentLon, currentLat);
        localStorage.setItem(STORAGE_KEYS.LOCATION, JSON.stringify({ lon: currentLon, lat: currentLat }));
    }
});

updateLocationDisplay();

if ($locEdit) {
    $locEdit.onclick = () => {
        locationModal.open(currentLon, currentLat);
    };
}
