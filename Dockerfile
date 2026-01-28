# 별자리판 개발 서버
# nginx 기반으로 정적 파일 서빙
FROM nginx:alpine

# 현재 디렉토리의 모든 파일을 nginx 서빙 디렉토리로 복사
COPY . /usr/share/nginx/html

# nginx 설정 (MIME 타입 설정 - ES6 모듈 지원)
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    # CORS 허용 (개발 환경) \
    add_header Access-Control-Allow-Origin *; \
    \
    # ES6 모듈을 위한 MIME 타입 \
    location ~* \.js$ { \
        add_header Content-Type application/javascript; \
    } \
    \
    # 캐시 비활성화 (개발 환경) \
    add_header Cache-Control "no-store, no-cache, must-revalidate"; \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
