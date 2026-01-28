# 개발 가이드

## Docker로 개발 환경 실행

### 요구사항
- Docker
- Docker Compose

### 실행 방법

```bash
# 1. Docker Compose로 개발 서버 시작
docker-compose up -d

# 2. 브라우저에서 접속
# http://localhost:8080

# 3. 로그 확인
docker-compose logs -f

# 4. 서버 중지
docker-compose down

# 5. 이미지 재빌드 (코드 변경 후)
docker-compose up -d --build
```

### 특징
- **실시간 반영**: 파일 변경 시 자동으로 반영 (새로고침만 하면 됨)
- **포트**: 8080 (변경 가능: docker-compose.yml의 ports 수정)
- **CORS 허용**: 개발 환경에서 ES6 모듈 로드 가능
- **캐시 비활성화**: 항상 최신 파일 로드

### WSL에서 실행

```bash
# WSL에서 Docker Desktop 실행 확인
docker --version

# 프로젝트 디렉토리로 이동
cd /mnt/d/planisphere-js

# Docker Compose 실행
docker-compose up -d

# 윈도우 브라우저에서 접속
# http://localhost:8080
```

### 트러블슈팅

#### 포트 8080이 이미 사용중인 경우
`docker-compose.yml`의 포트를 변경:
```yaml
ports:
  - "3000:80"  # 8080 대신 3000 사용
```

#### 파일 변경이 반영되지 않는 경우
1. 브라우저 캐시 삭제 (Ctrl+Shift+R)
2. 컨테이너 재시작
   ```bash
   docker-compose restart
   ```

#### ES6 모듈 로드 에러
- CORS 에러: Dockerfile의 CORS 설정 확인
- MIME 타입 에러: nginx 설정에서 `.js` 파일이 `application/javascript`로 서빙되는지 확인

## 전통적인 방법 (Docker 없이)

### Node.js http-server
```bash
npx http-server . -p 8080
```

### Python
```bash
python -m http.server 8080
```

### VS Code Live Server
VS Code 확장 프로그램 "Live Server" 설치 후 우클릭 → "Open with Live Server"

## 단위 테스트

### 요구사항
- Node.js 18+
- npm

### 테스트 실행

```bash
# 의존성 설치 (최초 1회)
npm install

# 테스트 실행
npm test

# 감시 모드 (파일 변경 시 자동 재실행)
npm run test:watch

# 커버리지 리포트
npm run test:coverage
```

### 테스트 구조

```
js/src/__tests__/
├── astromath.test.js      # 상수 및 유틸리티 함수 (19 tests)
├── astrotime.test.js      # 시간 변환 클래스 (45 tests)
├── astrovector.test.js    # 벡터/행렬 연산 (21 tests)
└── projection.test.js     # 등거리 투영 (19 tests)
```

### 테스트 범위

- **AstroMath**: 단위 변환 상수, mod(), normalize()
- **AstroTime**: 윤년 판단, 율리우스일 계산, 시간 변환 체인
- **AstroVector/AstroMatrix**: 좌표계 변환 (적도↔지평↔황도↔은하)
- **EquiDistanceProjection**: 등거리 방위 투영

### 검증 참고 사이트

- Julian Day: https://planetcalc.com/503/
- Sidereal Time: https://aa.usno.navy.mil/data/siderealtime
