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
`js/core/` 폴더는 완전히 독립적인 라이브러리:
- HTML/CSS와 무관하게 동작
- 다른 프로젝트에서 복사해서 재사용 가능
- SVG.js만 외부 의존성

## 현재 파일 구조

```planisphere-js/
├── index.html                    # 앱 진입점
├── js/
│   ├── core/                     # 핵심 도메인 엔진 (astronomy, models, etc.)
│   ├── app/                      # UI 모듈 (ControlPanel, Modals, main.js)
│   └── __tests__/                # Vitest 단위 테스트
├── css/                          # 스타일
│   ├── common.css                # 기본 스타일 (3줄)
│   ├── control-panel.css         # 컨트롤 패널
│   └── modal.css                 # 설정 모달
├── examples/                     # 사용 예제
├── images/                       # 테마 썸네일 등
├── README.md
├── DEV.md                        # 개발 환경 가이드
├── CLAUDE.md                     # 이 문서
└── package.json                  # 테스트 및 의존성 설정
```

---

### ✅ Phase 6: index.html & UI 모듈화 (완료)
- **main.js 도입**: index.html의 인라인 스크립트를 외부 모듈로 분리
- **컴포넌트 분리**: `ControlPanel`, `SettingsModal`, `LocationModal`로 UI 로직 분해
- **구조 최적화**: `js/core`와 `js/app`으로 디렉토리 구조 재편
- **지도 개선**: 새로운 세계 지도 이미지 적용 및 좌표 보정 로직 구현 (30도 오프셋)
- **타임존 통합**: `tz-lookup` 라이브러리 연동 및 하이브리드 타임존 전략(자동/수동/폴백) 구현

---

### ✅ Phase 7: 남반구 지원 및 레이아웃 최적화 (완료)
- **남반구 공식 지원**: 위도에 따른 회전 방향 및 투영 수식 보정
- **다이내믹 UI**: 위도(고위도/저위도)에 따라 한계 적위 및 UI 레이아웃 자동 조정
- **상태 유지**: 테마 전환 시 Zoom/Pan 상태 보존 로직 구현
- **상호작용 품질**: 지도 멀티터치 센서 고도화 및 입력 핸들러 안정화

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

**최종 수정**: 2026-01-31
**버전**: 1.3.0 (남반구 지원 및 레이아웃 최적화 완료)
