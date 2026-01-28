# Planisphere-JS 개발 가이드

## 프로젝트 개요

**목적**: 과학 교육을 위한 인터랙티브 별자리판 웹 애플리케이션
**대상**: 과학 선생님, 학생들
**핵심 가치**: 정확한 천문학 계산 + 직관적인 사용성

## 프로젝트 철학

### 1. Vanilla JavaScript 원칙
- 프레임워크 없음 (React, Vue 등 사용 안 함)
- 빌드 도구 최소화 (브라우저 직접 실행)
- 이유: 교육용 코드, 장기 유지보수, 가벼운 배포

### 2. 라이브러리 독립성
`js/src/` 폴더는 완전히 독립적인 라이브러리:
- HTML/CSS와 무관하게 동작
- 다른 프로젝트에서 복사해서 재사용 가능
- SVG.js만 외부 의존성

## 현재 파일 구조

```
planisphere-js/
├── index.html                    # 앱 진입점 + UI 로직 (정리 필요)
├── js/src/                       # 핵심 라이브러리 ✅
│   ├── astronomy.js              # 천문학 계산 (재사용 가능)
│   ├── models.js                 # 별/별자리 데이터
│   ├── renderers.js              # SVG 렌더링
│   ├── constants.js              # 설정 상수
│   ├── planisphere.js            # 메인 컨트롤러
│   └── __tests__/                # 단위 테스트 (104개)
├── css/                          # 스타일 (정리 필요)
│   ├── common.css                # 기본 스타일 (3줄)
│   ├── control-panel.css         # 컨트롤 패널
│   └── modal.css                 # 설정 모달
├── examples/                     # 사용 예제
├── images/                       # 테마 썸네일 등
├── README.md
├── DEV.md                        # 개발 환경 가이드
├── CLAUDE.md                     # 이 문서
└── package.json                  # 테스트 설정
```

---

## 🔄 Phase 6: index.html & CSS 정리

### 발견된 문제점

#### 1. 경로 오류 (Critical)
```html
<!-- index.html:22 - 파일이 존재하지 않음! -->
<script type="module" src="js/planisphere.js"></script>

<!-- index.html:118 - 잘못된 경로 -->
import Planisphere from './js/planisphere.js';

<!-- 올바른 경로 -->
js/src/planisphere.js
```

#### 2. 인라인 스크립트 비대화 (~220줄)
```
index.html 내 <script> 블록:
├── 컨트롤 패널 로직 (60줄)
├── 모달 로직 (50줄)
├── 테마 관리 (30줄)
├── 날짜/시간 조정 (40줄)
└── 이벤트 바인딩 (40줄)
```

#### 3. CSS 문제
```css
/* modal.css:2 vs modal.css:7 - 충돌 */
.ps-modal {
  display: none;     /* 2번 줄 */
  ...
  display: flex;     /* 7번 줄 - 덮어씀 */
}
```

#### 4. 상수 불일치
```javascript
// index.html - 하드코딩
const version = '1.1.0';
localStorage.getItem("planisphereTheme")

// constants.js - 정의됨
STORAGE_KEYS.THEME = 'planisphere_theme'  // 키 이름 다름!
```

### 정리 계획

#### Option A: 최소 수정 (권장)
파일 구조 유지, 문제점만 수정

1. **경로 수정**
   - `js/planisphere.js` → `js/src/planisphere.js`

2. **modal.css 수정**
   - 중복 `display` 속성 제거

3. **상수 통일**
   - localStorage 키를 `constants.js`와 일치시키거나
   - index.html에서 constants.js import

4. **버전 중앙화**
   - `constants.js`에 VERSION 추가
   - index.html에서 import

#### Option B: UI 모듈 분리
인라인 스크립트를 별도 파일로 분리

```
js/src/
├── ...기존 파일...
└── ui/
    └── app-controller.js    # index.html의 UI 로직 이동
```

장점: 코드 분리, 테스트 가능
단점: 파일 증가, 복잡도 증가

#### Option C: CSS 변수 도입
테마 색상을 CSS 변수로 관리

```css
:root {
  --ps-bg-color: rgba(0,0,0,.35);
  --ps-text-color: #fff;
  --ps-accent-color: #ffcc00;
}
```

### 우선순위

| 순위 | 작업 | 이유 |
|-----|------|------|
| 1 | 경로 수정 | 현재 앱이 동작 안 할 수 있음 |
| 2 | modal.css 수정 | CSS 충돌 |
| 3 | 상수 통일 | 유지보수성 |
| 4 | UI 모듈 분리 | 선택사항 |

---

## 완료된 작업

### ✅ Phase 1-4: JS 모듈화
- ES6 모듈 시스템 도입
- 5개 모듈로 분리 (astronomy, models, renderers, constants, planisphere)
- InputHandler 클래스 분리

### ✅ Phase 5: 문서화
- JSDoc 주석 (모든 파일)
- 단위 테스트 104개
- 사용 예제 2개

---

## 코딩 컨벤션

```javascript
// 클래스: PascalCase
class StarRenderer { }

// 상수: UPPER_SNAKE_CASE
const DEFAULT_LATITUDE = 37.57;

// 함수/메서드: camelCase
function calculatePosition() { }

// Private: # 접두사
class Star { #magnitude; }

// Boolean: is/has/can
const isVisible = true;
```

## 개발 환경

```bash
# Docker (권장)
docker-compose up -d
# http://localhost:8080

# 테스트
npm install && npm test
```

자세한 내용: [DEV.md](DEV.md)

## 배포

```bash
git add . && git commit -m "Update" && git push origin master
```

URL: https://jidolstar.github.io/planisphere-js/

---

**최종 수정**: 2026-01-28
**버전**: 4.0.0 (Phase 5 완료, Phase 6 계획)
