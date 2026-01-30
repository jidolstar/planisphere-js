# 아빠별 별자리판

![ogimage](./ogimage.png "별자리판 이미지")

이 **별자리판(플라니스피어)** 은 웹브라우저에서 바로 실행되는 프로그램입니다.

누구나 시간과 장소에 따라 보이는 하늘을 쉽게 확인할 수 있도록 만든 도구로, **과학 선생님과 학생들이 우주와 천문학에 조금 더 흥미를 가지길 바라는 마음**에서 제작했습니다.

- 상업적 목적이 아니라면 개인이나 단체에서 자유롭게, 무료로 활용할 수 있습니다.
  - [라이선스 확인하기](LICENSE.md)

- **사용하기**: [아빠별 별자리판](https://jidolstar.github.io/planisphere-js/)
    - 회전: 마우스 왼쪽 버튼 누르고 드래그
    - 확대/축소: 마우스 휠
    - 이동: 마우스 오른쪽 버튼 드래그 또는 Ctrl + 마우스 왼쪽 버튼 누르고 드래그
    - 날짜/시간 조정: 특정 날짜와 시간, 자정, 밤 9시 설정 가능
    - 테마: 기본 테마외에 다크, 라이트 지원

참고로 이 프로젝트는 예전에 천문노트(astronote.org, 현재는 닫힘)에서 제공하던 Flash 버전을, 요즘 웹 환경에서 동작하도록 새롭게 구현한 것입니다.

추가 문의는 제작자 **지용호(jidolstar@지메일)** 로 연락 주시면 됩니다.


---


## 빠른 시작

### 웹에서 바로 사용
[https://jidolstar.github.io/planisphere-js/](https://jidolstar.github.io/planisphere-js/)

### 로컬에서 실행
```bash
# Docker 사용 (권장)
docker-compose up -d
# http://localhost:8080 접속

# 또는 Python
python -m http.server 8080
```

> 자세한 개발 환경 설정은 [DEV.md](DEV.md)를 참조하세요.
> 기술적인 상세 API 명세는 [API.md](API.md)에서 확인하실 수 있습니다.


---


## 사용 예제

`examples/` 폴더에 인터랙티브 예제가 포함되어 있습니다.

### 별자리판 기본 사용

```javascript
import Planisphere from './js/core/planisphere.js';

// 별자리판 생성 (서울 기준)
const planisphere = new Planisphere({
    wrapperDomId: '#planisphere',
    currentDate: new Date(),
    lon: 126.98,   // 경도 (동경)
    lat: 37.57,    // 위도 (북위)
    dgmt: 9        // UTC+9 (한국 표준시)
});

// API
planisphere.setDateTime(new Date(2024, 5, 21, 21, 0, 0));  // 날짜/시간 변경
planisphere.setLocation(129.08, 35.18);                    // 위치 변경 (부산)
planisphere.setTheme('dark');                              // 테마: 'default', 'dark', 'light'
```

### 천문학 라이브러리 독립 사용

`astronomy.js`는 별자리판과 독립적으로 사용 가능한 순수 천문학 계산 라이브러리입니다.

```javascript
import { AstroTime, AstroMath, AstroVector } from './js/core/astronomy.js';

// 율리우스일 계산
const jd = AstroTime.jd(2024, 6, 21, 12, 0, 0);  // 2460482.0

// 진정오 계산 (서울)
const astroTime = new AstroTime(9, 126.98, 37.57);
const solarNoon = astroTime.lasn(2024, 6, 21);   // 약 12.5시

// 좌표 변환 (북극성)
const star = new AstroVector(0, 0, 0);
star.setSphe(2.5 * AstroMath.H2R, 89.26 * AstroMath.D2R);
```

> 예제 실행: `examples/basic-usage.html`, `examples/astronomy-standalone.html`


---


## 프로젝트 구조

```
planisphere-js/
├── index.html              # 메인 페이지
├── js/
│   ├── core/               # 핵심 엔진 라이브러리 (ES6 모듈)
│   │   ├── astronomy.js    # 천문학 계산 (재사용 가능)
│   │   ├── models.js       # 별/별자리 데이터
│   │   ├── renderers.js    # SVG 렌더링
│   │   ├── constants.js    # 설정 상수
│   │   ├── util.js         # 유틸리티 (환경 감지 등)
│   │   └── planisphere.js  # 메인 컨트롤러 엔진
│   ├── app/                # 애플리케이션 UI 및 제어 로직
│   │   ├── main.js         # 앱 진입점 (Orchestrator)
│   │   ├── control-panel.js # 날짜/시간 제어
│   │   ├── settings-modal.js # 설정 및 테마 관리
│   │   └── location-modal.js # 위치 및 지도 관리
│   └── __tests__/          # 단위 테스트 (104개)
├── examples/               # 사용 예제
├── css/                    # 스타일
├── images/                 # 리소스
├── DEV.md                  # 개발 가이드
├── CLAUDE.md               # 코드베이스 가이드
└── package.json            # 테스트 설정
```


---


## 모듈 설명

### astronomy.js (천문학 계산)

다른 프로젝트에서 재사용 가능한 순수 천문학 계산 모듈입니다.

| 클래스/객체 | 설명 |
|------------|------|
| `AstroMath` | 상수 (π, J2000) 및 유틸리티 (mod, normalize, 단위 변환) |
| `AstroTime` | 시간 변환 (LCT↔UT↔GST↔LST), 율리우스일, 진정오 계산 |
| `AstroVector` | 3D 벡터, 좌표계 변환 (적도↔지평↔황도↔은하) |
| `AstroMatrix` | 3×3 행렬 연산, 좌표 변환 행렬 생성 |
| `EquiDistanceProjection` | 등거리 방위 투영 (3D → 2D) |

### models.js (데이터)

| 상수 | 설명 |
|-----|------|
| `STARS_DATA` | 5000+ 별 데이터 (이름, 적경, 적위, 등급, 분광형) |
| `CONSTELLATION_LINES` | 별자리선 좌표 (4개 숫자 = 1개 선분) |
| `CONSTELLATION_NAMES` | 별자리명 및 표시 위치 |

### renderers.js (렌더링)

| 클래스 | 설명 |
|-------|------|
| `THEMES` | 테마 설정 (default, dark, light) |
| `SkyPanelRenderer` | 날짜환, 별, 별자리선, 좌표선 렌더링 |
| `TimeRingRenderer` | 시간환, 지평선, 방위 렌더링 |
| `InfoPanelRenderer` | 범례 및 정보 패널 |

### util.js (유틸리티)

| 클래스/객체 | 설명 |
|------------|------|
| `Env` | 환경 감지 (Mobile, Safari, Mac, Windows 등) |
| `TimezoneService` | 외부 라이브러리(`tz-lookup`) 동적 로드 및 타임존 오프셋 계산 |

### planisphere.js (컨트롤러)

| 클래스 | 설명 |
|-------|------|
| `InputHandler` | 마우스/터치/휠/제스처 입력 처리 |
| `Planisphere` | 메인 컨트롤러, Public API 제공 |

**Public API:**
- `setDateTime(date)` - 날짜/시간 설정
- `setLocation(lon, lat, dgmt, tzName)` - 관측 위치 및 타임존 설정
- `setTheme(themeName)` - 테마 변경
- `render()` - 명시적 렌더링


---


## 단위 테스트

```bash
# 의존성 설치 (최초 1회)
npm install

# 테스트 실행
npm test

# 감시 모드
npm run test:watch
```

**테스트 현황: 104개 테스트**

| 파일 | 테스트 수 | 내용 |
|-----|----------|------|
| `astromath.test.js` | 19 | 상수 검증, mod/normalize |
| `astrotime.test.js` | 45 | 윤년, 율리우스일, 시간 변환 |
| `astrovector.test.js` | 21 | 벡터 연산, 좌표 변환 |
| `projection.test.js` | 19 | 등거리 투영 |


---


## 버전

- **1.2.0 / 2026-01** : 타임존 시스템 고도화 및 프로젝트 리팩토링
  - **고급 타임존 자동 검색**: `tz-lookup` 라이브러리를 동적으로 로드하여 전 세계 정치적 타임존(IANA)을 자동으로 감지
  - **하이브리드 전략**: 네트워크/데이터 부재 시 경도 기반 지표 계산(Geographic Fallback) 및 사용자 수동 오프셋 설정 지원
  - **데이터 유지(Persistence)**: 선택한 위치와 타임존 이름(`Asia/Seoul` 등)을 `localStorage`에 저장 및 복구
  - **구조 리팩토링**: `js/core`(엔진)와 `js/app`(UI 로직)으로 모듈 분리 및 UI 컴포넌트(`ControlPanel`, `LocationModal` 등) 모듈화
  - **지도 매핑 개선**: 태평양 중심의 새로운 세계 지도(`world_map.jpg`) 도입 및 30도 오프셋 보정 수식 정밀화
  - **최적화**: 디버그 로그 제거, 모달 레이아웃 최적화, 스크롤바 제거

- **1.1.1 / 2026-01** : 플랫폼별 최적화 및 리팩토링

- **1.1.0 / 2026-01** : 사파리 브라우저 적용 및 ES6 모듈 리팩토링
  - 맥OS 사파리에서 SVG.js가 제대로 작동하지 않는 버그 수정
  - SVG 폰트가 제대로 적용되지 않는 버그 수정
  - 5개 모듈로 분리 (astronomy, models, renderers, constants, planisphere)
  - JSDoc 문서화
  - 단위 테스트 104개 추가
  - 사용 예제 추가

- 1.0.3 / 2025-09-20 : 최신 SVG 라이브러리로 교체
  - SVG 라이브러리 교체에 따른 글자 위치 틀어짐 교정

- 1.0.2 / 2025-09-15 : 지금/밤9시/자정 버튼 버그 fix
  - [issue/1](https://github.com/jidolstar/planisphere-js/issues/1)

- 1.0.1 / 2025-09-13 : 최초 버전
  - 적경, 적위, 6등성까지 주요 별, 별자리선 렌더링
  - 진정오 기반 적경-날짜 정렬
  - 이동, 회전, 확대/축소 기능
  - 3종류 테마 지원


---


## 기술 스택

- **프론트엔드**: Vanilla JavaScript (ES6 모듈)
- **렌더링**: [SVG.js](https://svgjs.dev/) 3.2
- **외부 데이터**: [tz-lookup](https://github.com/darkskyapp/tz-lookup) (타임존 검색용, UNPKG를 통한 동적 로드)
- **테스트**: [Vitest](https://vitest.dev/)
- **배포**: GitHub Pages
- **빌드 도구**: 없음 (브라우저 직접 실행)


---


## 라이선스

비상업적 목적으로 자유롭게 사용 가능합니다. 자세한 내용은 [LICENSE.md](LICENSE.md)를 참조하세요.
