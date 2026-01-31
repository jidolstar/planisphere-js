# 아빠별 별자리판 (Planisphere JS)

![ogimage](./ogimage.png "별자리판 이미지")

이 **별자리판(플라니스피어)**은 웹브라우저에서 바로 실행되는 프로그램입니다. 누구나 시간과 장소에 따라 보이는 하늘을 쉽게 확인할 수 있도록 만든 도구로, **과학 선생님과 학생들이 우주와 천문학에 조금 더 흥미를 가지길 바라는 마음**에서 제작했습니다.

- **사용하기**: [아빠별 별자리판](https://jidolstar.github.io/planisphere-js/)
    - 회전: 마우스 왼쪽 버튼 누르고 드래그
    - 확대/축소: 마우스 휠
    - 이동: 마우스 오른쪽 버튼 드래그 또는 Ctrl + 마우스 왼쪽 버튼 누르고 드래그
    - 날짜/시간 조정: 특정 날짜와 시간, 자정, 밤 9시 설정 가능
    - 테마: 기본 테마외에 다크, 라이트 지원

참고로 이 프로젝트는 예전에 천문노트(astronote.org, 현재는 닫힘)에서 제공하던 Flash 버전을, 요즘 웹 환경에서 동작하도록 새롭게 구현한 것입니다. 추가 문의는 제작자 **지용호(jidolstar@지메일)** 로 연락 주시면 됩니다.

---

## 설치 및 사용

### 1. CDN을 이용한 직접 사용 (가장 간단함)
별도의 설치 없이 HTML에서 바로 사용할 수 있습니다.

```html
<div id="planisphere" style="width:100%; height:600px;"></div>

<script type="module">
  import Planisphere from 'https://cdn.jsdelivr.net/npm/planisphere-js/index.js';

  (async () => {
    const ps = new Planisphere({
      wrapperDomId: '#planisphere',
      lon: 126.98,
      lat: 37.57
    });
    await ps.initialize();
  })();
</script>
```

### 2. NPM을 이용한 설치
현대적인 웹 개발 환경(Webpack, Vite 등)에서 사용하기 적합합니다. [NPM 페이지](https://www.npmjs.com/package/planisphere-js)

```bash
npm install planisphere-js
```

```javascript
import Planisphere from 'planisphere-js';

(async () => {
  const ps = new Planisphere({
    wrapperDomId: '#planisphere',
    lon: 126.98,
    lat: 37.57
  });
  await ps.initialize();
})();
```

---

## 사용 예제 및 데모

[examples 폴더](./examples/)에서 더 다양한 인터랙티브 예제와 상세 사용법을 확인할 수 있습니다.

- 🌟 [아빠별 별자리판 사용 예시 (Demo)](https://jidolstar.github.io/planisphere-js/examples/basic-usage.html)
- 🔭 [천문 라이브러리 독립 사용 예시 (Demo)](https://jidolstar.github.io/planisphere-js/examples/astronomy-standalone.html)

---

## API Reference

### Planisphere (Class) - 메인 컨트롤러
- `constructor(options)`: 별자리판 인스턴스 생성 (매개변수 검증 및 저장)
- `async initialize()`: **[필수]** 비동기 초기화 (타임존 로드, DOM 설정, SVG 패널 생성 및 최초 렌더링)
- `setDateTime(date)`: 날짜/시간 설정
- `async setLocation(lon, lat, dgmt, tzName)`: 관측지 및 타임존 설정 (비동기)
- `setTheme(themeName)`: 테마 설정 ('default', 'dark', 'light')
- `render()`: 별자리판 강제 업데이트

### astronomy.js (핵심 엔진)
- `AstroMath`: 천문 수학 상수(R2D, D2R, J2000) 및 유틸리티(mod, normalize)
- `AstroTime`: 시간 체계 변환(LCT, UT, GST, LST, JD), 진정오 계산
- `AstroVector`: 3D 벡터 및 천문 좌표계(적도, 지평, 황도, 은하) 변환
- `EquiDistanceProjection`: 등거리 방위 투영 (3D → 2D 화면 좌표)

### util.js (유틸리티)
- `TimezoneService`: `tz-lookup` 기반 타임존 이름 검색 및 오프셋 계산 (하이브리드 전략 적용)
- `Env`: 실행 환경 감지 (Mobile, Safari, OS 등)

---

## 개발 및 기여 가이드

### 개발 환경 실행 (Docker)
```bash
docker-compose up -d  # http://localhost:8080 접속
```

### 단위 테스트 (Vitest)
총 104개의 테스트 케이스를 통해 천문학 계산의 정확성을 검증합니다.
```bash
npm install
npm test            # 전체 테스트 실행
npm run test:watch  # 감시 모드
```

### 프로젝트 구조
- `js/core/`: 핵심 엔진 및 라이브러리 (순수 로직)
- `js/app/`: UI 컴포넌트 및 애플리케이션 로직
- `js/__tests__/`: 단위 테스트 파일
- `examples/`: 사용법 예제 HTML/JS

---

## 버전 기록

- **1.3.5 / 2026-01-31** : 문서 통합 및 NPM 접근성 강화
  - README, API, DEV 문서 하나로 통합 및 최적화
  - 가독성을 위한 프로젝트 구조 및 모듈 설명 재정리
  - UI 내 NPM 링크 추가 및 버전 업데이트

- **1.3.1 / 2026-01-31** : 초기화 아키텍처 개선
  - 생성자 부하 최소화 및 `async initialize()` 도입
  - 비동기 타임존 라이브러리 로드 방식 안정화
  - 상태 보존(Zoom/Pan) 기능 고도화

- **1.2.0 / 2026-01-30** : 타임존 시스템 및 프로젝트 리팩토링
- **1.1.0 / 2026-01-29** : 사파리 대응 및 ES6 모듈화
- **1.0.1 / 2025-09-13** : 최초 버전 출시

---

## 라이선스
비상업적 목적으로 자유롭게 사용 가능합니다. 자세한 내용은 [LICENSE.md](LICENSE.md)를 참조하세요.
