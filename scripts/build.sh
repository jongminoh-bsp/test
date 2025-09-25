#!/bin/bash

# Skyline 애플리케이션 빌드 스크립트
# Usage: ./build.sh [tag]

set -e

# 기본값 설정
TAG=${1:-latest}
IMAGE_NAME="skyline"
REGISTRY=${REGISTRY:-"your-registry"}  # 환경변수로 설정 가능

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Skyline 애플리케이션 빌드 ===${NC}"

# 스크립트 디렉토리 기준으로 프로젝트 루트 찾기
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# 필요한 파일들 확인
echo -e "${YELLOW}필수 파일 확인 중...${NC}"
REQUIRED_FILES=("Dockerfile" "pom.xml" "src/main/java/com/example/skyline/SkylineApplication.java")

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}필수 파일이 없습니다: $file${NC}"
        exit 1
    fi
done

echo -e "${GREEN}필수 파일 확인 완료!${NC}"

# 프론트엔드 디렉토리 확인 및 생성
if [ ! -d "frontend" ]; then
    echo -e "${YELLOW}프론트엔드 디렉토리가 없습니다. 기본 구조를 생성합니다...${NC}"
    mkdir -p frontend/src
    
    # 기본 package.json 생성
    cat > frontend/package.json << 'EOF'
{
  "name": "skyline-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "mkdir -p dist && echo 'Frontend build completed' > dist/index.html && cp -r src/* dist/ 2>/dev/null || true"
  }
}
EOF

    # 기본 index.html 생성
    cat > frontend/src/index.html << 'EOF'
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Skyline 항공예약시스템</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #333; text-align: center; }
        .api-section { margin: 20px 0; }
        .endpoint { background: #f8f9fa; padding: 10px; margin: 5px 0; border-left: 4px solid #007bff; }
        .method { display: inline-block; padding: 2px 8px; margin-right: 10px; color: white; font-size: 12px; border-radius: 3px; }
        .get { background-color: #28a745; }
        .post { background-color: #007bff; }
        .put { background-color: #ffc107; color: black; }
        .delete { background-color: #dc3545; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🛫 Skyline 항공예약시스템</h1>
        <p>EKS 인턴십 교육용 데모 애플리케이션에 오신 것을 환영합니다!</p>
        
        <div class="api-section">
            <h2>📡 API 엔드포인트</h2>
            
            <h3>항공편 관리</h3>
            <div class="endpoint">
                <span class="method get">GET</span>
                <code>/api/flights</code> - 모든 항공편 조회
            </div>
            <div class="endpoint">
                <span class="method get">GET</span>
                <code>/api/flights/{id}</code> - 특정 항공편 조회
            </div>
            <div class="endpoint">
                <span class="method get">GET</span>
                <code>/api/flights/search?from={departure}&to={arrival}&date={date}</code> - 항공편 검색
            </div>
            
            <h3>예약 관리</h3>
            <div class="endpoint">
                <span class="method get">GET</span>
                <code>/api/reservations</code> - 모든 예약 조회
            </div>
            <div class="endpoint">
                <span class="method post">POST</span>
                <code>/api/reservations</code> - 새 예약 생성
            </div>
            <div class="endpoint">
                <span class="method get">GET</span>
                <code>/api/reservations/{id}</code> - 특정 예약 조회
            </div>
            
            <h3>시스템 모니터링</h3>
            <div class="endpoint">
                <span class="method get">GET</span>
                <code>/health</code> - 헬스체크
            </div>
            <div class="endpoint">
                <span class="method get">GET</span>
                <code>/metrics</code> - Prometheus 메트릭
            </div>
            <div class="endpoint">
                <span class="method get">GET</span>
                <code>/stress/cpu</code> - CPU 부하 테스트
            </div>
            <div class="endpoint">
                <span class="method get">GET</span>
                <code>/stress/memory</code> - 메모리 부하 테스트
            </div>
        </div>
        
        <div class="api-section">
            <h2>🎯 실습 아이디어</h2>
            <ul>
                <li>HPA(Horizontal Pod Autoscaler) 구성해보기</li>
                <li>Ingress Controller 설정해보기</li>
                <li>모니터링 대시보드 구축해보기</li>
                <li>Blue-Green 배포 구현해보기</li>
                <li>Service Mesh 적용해보기</li>
            </ul>
        </div>
        
        <footer style="text-align: center; margin-top: 40px; color: #666;">
            <p>🎓 인턴십 교육생 여러분, 자유롭게 실험하고 창의적으로 구성해보세요!</p>
        </footer>
    </div>
</body>
</html>
EOF

    echo -e "${GREEN}기본 프론트엔드 구조 생성 완료!${NC}"
fi

# Docker 빌드
echo -e "${YELLOW}Docker 이미지 빌드 중...${NC}"
echo "이미지: $REGISTRY/$IMAGE_NAME:$TAG"

docker build -t "$REGISTRY/$IMAGE_NAME:$TAG" .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Docker 빌드 성공!${NC}"
else
    echo -e "${RED}Docker 빌드 실패!${NC}"
    exit 1
fi

# 이미지 정보 출력
echo -e "${GREEN}=== 빌드 완료! ===${NC}"
echo -e "${GREEN}이미지 이름: $REGISTRY/$IMAGE_NAME:$TAG${NC}"

# 이미지 크기 확인
IMAGE_SIZE=$(docker images "$REGISTRY/$IMAGE_NAME:$TAG" --format "table {{.Size}}" | tail -n 1)
echo -e "${GREEN}이미지 크기: $IMAGE_SIZE${NC}"

echo ""
echo -e "${YELLOW}다음 단계:${NC}"
echo -e "${YELLOW}1. 로컬 테스트:${NC}"
echo "   docker run -p 8080:8080 $REGISTRY/$IMAGE_NAME:$TAG"
echo ""
echo -e "${YELLOW}2. 레지스트리에 푸시:${NC}"
echo "   docker push $REGISTRY/$IMAGE_NAME:$TAG"
echo ""
echo -e "${YELLOW}3. Kubernetes 배포:${NC}"
echo "   kubectl apply -f k8s-examples/basic/"