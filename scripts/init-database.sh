#!/bin/bash

# Skyline 데이터베이스 초기화 스크립트
# Usage: ./init-database.sh <RDS_ENDPOINT> [DB_USER] [DB_PASSWORD] [DB_NAME]

set -e

# 파라미터 확인
if [ $# -lt 1 ]; then
    echo "Usage: $0 <RDS_ENDPOINT> [DB_USER] [DB_PASSWORD] [DB_NAME]"
    echo "Example: $0 skyline-demo-db.cluster-xxx.ap-northeast-2.rds.amazonaws.com"
    exit 1
fi

# 기본값 설정
RDS_ENDPOINT=$1
DB_USER=${2:-admin}
DB_PASSWORD=${3}
DB_NAME=${4:-skyline}

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Skyline 데이터베이스 초기화 ===${NC}"
echo -e "${YELLOW}RDS 엔드포인트: $RDS_ENDPOINT${NC}"

# 패스워드 입력 (제공되지 않은 경우)
if [ -z "$DB_PASSWORD" ]; then
    echo -n "데이터베이스 패스워드를 입력하세요: "
    read -s DB_PASSWORD
    echo
fi

# MySQL 클라이언트 설치 확인
if ! command -v mysql &> /dev/null; then
    echo -e "${YELLOW}MySQL 클라이언트가 설치되어 있지 않습니다.${NC}"
    echo -e "${YELLOW}설치 방법:${NC}"
    echo "  Ubuntu/Debian: sudo apt-get install mysql-client"
    echo "  CentOS/RHEL: sudo yum install mysql"
    echo "  macOS: brew install mysql-client"
    exit 1
fi

# 데이터베이스 연결 테스트
echo -e "${YELLOW}데이터베이스 연결 테스트 중...${NC}"
if ! mysql -h "$RDS_ENDPOINT" -u "$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${RED}데이터베이스 연결 실패!${NC}"
    echo -e "${RED}RDS 엔드포인트, 사용자명, 패스워드를 확인하세요.${NC}"
    exit 1
fi

echo -e "${GREEN}데이터베이스 연결 성공!${NC}"

# 스키마 파일 경로 확인
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_DIR="$(dirname "$SCRIPT_DIR")/sql"
SCHEMA_FILE="$SQL_DIR/schema.sql"
SEED_FILE="$SQL_DIR/seed-data.sql"

if [ ! -f "$SCHEMA_FILE" ]; then
    echo -e "${RED}스키마 파일을 찾을 수 없습니다: $SCHEMA_FILE${NC}"
    exit 1
fi

if [ ! -f "$SEED_FILE" ]; then
    echo -e "${RED}시드 데이터 파일을 찾을 수 없습니다: $SEED_FILE${NC}"
    exit 1
fi

# 스키마 생성
echo -e "${YELLOW}데이터베이스 스키마 생성 중...${NC}"
mysql -h "$RDS_ENDPOINT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$SCHEMA_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}스키마 생성 완료!${NC}"
else
    echo -e "${RED}스키마 생성 실패!${NC}"
    exit 1
fi

# 시드 데이터 삽입
echo -e "${YELLOW}시드 데이터 삽입 중...${NC}"
mysql -h "$RDS_ENDPOINT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$SEED_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}시드 데이터 삽입 완료!${NC}"
else
    echo -e "${RED}시드 데이터 삽입 실패!${NC}"
    exit 1
fi

# 데이터 확인
echo -e "${YELLOW}데이터 확인 중...${NC}"
AIRPORT_COUNT=$(mysql -h "$RDS_ENDPOINT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -se "SELECT COUNT(*) FROM airports;")
FLIGHT_COUNT=$(mysql -h "$RDS_ENDPOINT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -se "SELECT COUNT(*) FROM flights;")
RESERVATION_COUNT=$(mysql -h "$RDS_ENDPOINT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -se "SELECT COUNT(*) FROM reservations;")

echo -e "${GREEN}=== 초기화 완료! ===${NC}"
echo -e "${GREEN}공항 수: $AIRPORT_COUNT${NC}"
echo -e "${GREEN}항공편 수: $FLIGHT_COUNT${NC}"
echo -e "${GREEN}예약 수: $RESERVATION_COUNT${NC}"
echo ""
echo -e "${YELLOW}테스트 쿼리:${NC}"
echo "mysql -h $RDS_ENDPOINT -u $DB_USER -p$DB_PASSWORD $DB_NAME -e \"SELECT * FROM airports LIMIT 5;\""
echo ""
echo -e "${YELLOW}애플리케이션 실행을 위한 환경변수:${NC}"
echo "export DB_HOST=$RDS_ENDPOINT"
echo "export DB_USER=$DB_USER"
echo "export DB_PASSWORD=$DB_PASSWORD"
echo "export DB_NAME=$DB_NAME"