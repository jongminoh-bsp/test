# 멀티스테이지 빌드: Frontend 빌드
FROM node:18-alpine as frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# 멀티스테이지 빌드: Backend 빌드
FROM maven:3.8.6-eclipse-temurin-17 as backend-build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests

# 최종 런타임 이미지
FROM eclipse-temurin:17-jre-alpine
RUN addgroup -S skyline && adduser -S skyline -G skyline

# 헬스체크를 위한 curl 설치
RUN apk add --no-cache curl

WORKDIR /app
COPY --from=backend-build /app/target/*.jar app.jar
COPY --from=frontend-build /app/frontend/dist ./static

# 설정 파일 복사
COPY src/main/resources/application.yml ./

# 권한 설정
RUN chown -R skyline:skyline /app
USER skyline

# 환경변수 설정
ENV DB_HOST=localhost
ENV DB_PORT=3306
ENV DB_NAME=skyline
ENV DB_USER=skyline_user
ENV DB_PASSWORD=changeme
ENV DB_CONNECTION_POOL_SIZE=10

# 포트 노출
EXPOSE 8080

# 헬스체크 설정
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# 애플리케이션 실행
CMD ["java", "-jar", "-Dspring.profiles.active=production", "app.jar"]
