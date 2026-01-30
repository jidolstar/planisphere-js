# 사용 예시

이 폴더에는 Planisphere JS의 다양한 사용 예시가 포함되어 있습니다.

## 온라인 데모

- 🌟 [아빠별 별자리판 사용 예시](https://jidolstar.github.io/planisphere-js/examples/basic-usage.html)
- 🔭 [천문 라이브러리 사용 예시](https://jidolstar.github.io/planisphere-js/examples/astronomy-standalone.html)

## 별자리판 기본 사용

### 최소 설정

```javascript
import Planisphere from 'planisphere-js';

(async () => {
  const ps = new Planisphere({
    wrapperDomId: '#planisphere',
    lon: 126.98,  // 경도
    lat: 37.57    // 위도
  });
  await ps.initialize();
})();
```

### 전체 옵션

```javascript
import Planisphere from './js/core/planisphere.js';

(async () => {
  // 별자리판 생성 (서울 기준)
  const planisphere = new Planisphere({
      wrapperDomId: '#planisphere',
      currentDate: new Date(),
      lon: 126.98,   // 경도 (동경)
      lat: 37.57,    // 위도 (북위)
      dgmt: 9,       // UTC+9 (한국 표준시, 선택사항)
      tzName: 'Asia/Seoul',  // IANA 타임존 이름 (선택사항)
      styles: Planisphere.darkStyles  // 테마 (선택사항)
  });

  // 비동기 초기화 (필수)
  await planisphere.initialize();

  // API 사용
  planisphere.setDateTime(new Date(2024, 5, 21, 21, 0, 0));  // 날짜/시간 변경
  await planisphere.setLocation(129.08, 35.18);              // 위치 변경 (부산)
  planisphere.setTheme('dark');                              // 테마: 'default', 'dark', 'light'
})();
```

### Public API

```javascript
// 날짜/시간 설정
planisphere.setDateTime(new Date(2024, 5, 21, 21, 0, 0));

// 위치 변경 (비동기)
await planisphere.setLocation(lon, lat, dgmt, tzName);

// 테마 변경
planisphere.setTheme('dark');  // 'default', 'dark', 'light'

// 명시적 렌더링
planisphere.render();

// Getters
const currentDate = planisphere.currentDate;
const lon = planisphere.lon;
const lat = planisphere.lat;
const dgmt = planisphere.dgmt;
const tzName = planisphere.tzName;
```

## 천문학 라이브러리 독립 사용

`astronomy.js`는 별자리판과 독립적으로 사용 가능한 순수 천문학 계산 라이브러리입니다.

### 시간 변환

```javascript
import { AstroTime, AstroMath } from './js/core/astronomy.js';

// 율리우스일 계산
const jd = AstroTime.jd(2024, 6, 21, 12, 0, 0);  // 2460482.0

// 진정오 계산 (서울)
const astroTime = new AstroTime(9, 126.98, 37.57);
const solarNoon = astroTime.lasn(2024, 6, 21);   // 약 12.5시

// 시간 변환
const lct = 12.5;  // 지방시
const ut = astroTime.LCT2UT(lct);   // 세계시
const gst = AstroTime.UT2GST(ut);   // 그리니치 항성시
const lst = astroTime.LCT2LST(lct); // 지방 항성시
```

### 좌표 변환

```javascript
import { AstroVector, AstroMath } from './js/core/astronomy.js';

// 북극성 좌표
const polaris = new AstroVector(0, 0, 0);
polaris.setSphe(2.5 * AstroMath.H2R, 89.26 * AstroMath.D2R);

// 적도 좌표계 → 지평 좌표계
const lat = 37.57 * AstroMath.D2R;
const lst = 12.5 * AstroMath.H2R;
polaris.equ2hor(lat, lst);

console.log('방위각:', polaris.azi * AstroMath.R2D);
console.log('고도:', polaris.alt * AstroMath.R2D);
```

### 투영 계산

```javascript
import { EquiDistanceProjection, AstroMath } from './js/core/astronomy.js';

// 등거리 방위 투영 (서울 기준)
const radius = 300;  // 픽셀
const lat = 37.57 * AstroMath.D2R;
const proj = new EquiDistanceProjection(radius, lat);

// 3D → 2D 투영
const ra = 2.5 * AstroMath.H2R;   // 적경
const dec = 89.26 * AstroMath.D2R; // 적위
const result = proj.project(ra, dec, lst);

if (result.visible) {
    console.log('x:', result.x, 'y:', result.y);
}
```

## 파일 설명

- `basic-usage.html` - 별자리판 기본 사용 예시 (인터랙티브)
- `astronomy-standalone.html` - 천문학 라이브러리 독립 사용 예시
