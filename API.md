# API Documentation - Planisphere JS

별자리판 JS 프로젝트의 주요 모듈과 클래스에 대한 상세 API 문서입니다. 모든 모듈은 ES6 모듈 형식을 따릅니다.

## 목차
- [astronomy.js (천문학 계산)](core/astronomy.js)
- [planisphere.js (메인 컨트롤러)](core/planisphere.js)
- [app/ (애플리케이션 UI)](app/)
- [renderers.js (렌더링)](core/renderers.js)
- [util.js (유틸리티)](core/util.js)
- [models.js (데이터)](core/models.js)
- [constants.js (상수)](core/constants.js)

---

## astronomy.js (천문학 계산)

순수 천문학 계산 로직을 포함하며, 다른 프로젝트에서도 재사용 가능합니다.

### AstroMath (Namespace)
천문학 수학 상수 및 유틸리티 함수 모음입니다.

- `R2D`: 라디안 -> 도 변환 계수 (180/π)
- `D2R`: 도 -> 라디안 변환 계수 (π/180)
- `H2R`: 시간 -> 라디안 변환 계수 (π/12)
- `J2000`: J2000.0 기원 율리우스일 (2451545.0)
- `mod(dividend, divisor)`: 나머지 연산 (0 ~ divisor 범위)
- `normalize(x, from, to)`: 값을 지정된 범위 [from, to)로 정규화

### AstroTime (Class)
다양한 천문학 시간 체계(LCT, UT, GST, LST, JD) 간의 변환을 담당합니다.

- `constructor(dgmt, lon, lat)`: 시간대 오프셋, 경도, 위도로 인스턴스 생성
- `static jd(y, m, d, h, min, s)`: 율리우스일 계산
- `LCT2LST(jd)`: 지방 표준시를 지방 항성시로 변환
- `lasn(y, m, d)`: 진정오(Local Apparent Solar Noon) 시각 계산
- `hourForDateRing(y, m, d, mode)`: 날짜환 정렬을 위한 기준 시각 계산

### AstroVector (Class)
3D 벡터 및 천문 좌표계(적도, 지평, 황도, 은하) 변환을 지원합니다.

- `constructor(x, y, z)`: 3D 벡터 생성
- `setSphe(lon, lat)`: 구면 좌표로 벡터 설정
- `equ2hor(equ, lst, lat)`: 적도 좌표를 지평 좌표로 변환
- `lon() / lat()`: 구면 좌표의 경도/위도 반환

### AstroMatrix (Class)
3×3 변환 행렬을 처리합니다.

- `hor2equ(lst, lat)` / `equ2hor(lst, lat)`: 좌표 변환 행렬 생성

### Planisphere (Class)
메인 컨트롤러입니다.

- `constructor(options)`: 별자리판 초기화
- `setDateTime(date)`: 날짜/시간 설정
- `setLocation(lon, lat, dgmt, tzName)`: 장소 및 타임존 설정
- `setTheme(themeName)`: 테마 설정
- `render()`: 별자리판 강제 업데이트

## app/ (애플리케이션 UI)

사용자 인터페이스와 상호작용을 담당하는 모듈입니다.

### main.js (Orchestrator)
애플리케이션의 엔트리 포인트입니다. 모든 컴포넌트를 초기화하고 조율합니다.

### ControlPanel (Class)
날짜와 시간 조절 UI를 관리합니다.
- `constructor(planisphere)`: 플라니스피어 인스턴스를 받아 초기화
- `initNow()`: 현재 시각으로 설정
- `adjust(unit, delta)`: 년/월/일/시/분 단위 증감 조절

### SettingsModal (Class)
테마 설정과 도움말 모달을 관리합니다.
- `open(showWelcome)`: 모달 열기 (환영 메시지 포함 여부 선택)
- `close()`: 모달 닫기

### LocationModal (Class)
지도를 통한 관측 위치 선택 모달을 관리합니다.
- `open(lon, lat, dgmt, tzName)`: 현재 정보를 초기값으로 지도 열기
- `onApply(lon, lat, dgmt, tzName)`: 위치 적용 시 실행될 콜백 설정

---

## renderers.js (렌더링)

SVG.js를 사용하여 모든 시각적 요소를 그립니다.

- `THEMES`: 테마별 색상 및 스타일 정의 객체
- `SkyPanelRenderer`: 움직이지 않는 하늘 부분(별, 별자리, 날짜환) 담당
- `TimeRingRenderer`: 시각에 따라 회전하는 부분(시간환, 지평선) 담당
- `InfoPanelRenderer`: 범례 및 타이틀 담당

---

## util.js (유틸리티)

### Env (Object)
실행 환경 및 플랫폼을 감지합니다.

- `isMobile()`: 모바일 기기 여부
- `isSafari()`: Safari 브라우저 여부
- `isMac()`: macOS 플랫폼 여부
- `isWindows()`: Windows 플랫폼 여부

### TimezoneService (Object)
타임존 데이터 로드 및 변환 기능을 제공합니다.

- `async loadLibrary()`: `tz-lookup` 라이브러리를 UNPKG에서 동적으로 로드
- `getTimezoneName(lat, lon)`: 특정 좌표의 IANA 타임존 이름 반환
- `getOffsetFromTimezone(tzName, date)`: 타임존 이름 기준 현재 오프셋 계산
- `getGeographicOffset(lon)`: 경도 기준 물리적 오프셋(fallback) 계산

---

## models.js (데이터)

- `STARS_DATA`: 약 5000개의 별 데이터 (CSV 형식)
- `CONSTELLATION_LINES`: 별자리 선 연결 정보
- `CONSTELLATION_NAMES`: 별자리 이름 및 위치 정보

---

## constants.js (상수)

- `DEFAULT_LOCATION`: 기본 위치 (서울)
- `DEFAULT_TIMEZONE`: 기본 시간대 (UTC+9)
- `DEFAULT_TIMEZONE_NAME`: 기본 타임존 이름 (`Asia/Seoul`)
- `MAGNITUDE_LIMIT`: 표시 등급 제한 (기본 6등급)
- `SPECTRAL_COLORS`: 별의 분광형별 색상 매핑
- `STORAGE_KEYS`: 로컬 스토리지 키 정의
