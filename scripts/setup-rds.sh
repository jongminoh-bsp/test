#!/bin/bash

# Skyline RDS 설정 스크립트
# Usage: ./setup-rds.sh [instance-name]

set -e

# 기본값 설정
INSTANCE_NAME=${1:-skyline-demo-db}
DB_NAME="skyline"
MASTER_USERNAME="admin"
INSTANCE_CLASS="db.t3.micro"
ALLOCATED_STORAGE="20"
ENGINE_VERSION="8.0"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Skyline RDS 설정 시작 ===${NC}"

# 비밀번호 입력
echo -n "마스터 패스워드를 입력하세요: "
read -s MASTER_PASSWORD
echo

if [ -z "$MASTER_PASSWORD" ]; then
    echo -e "${RED}패스워드는 필수입니다!${NC}"
    exit 1
fi

# VPC와 서브넷 그룹 확인
echo -e "${YELLOW}기본 VPC 확인 중...${NC}"
DEFAULT_VPC=$(aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --query 'Vpcs[0].VpcId' --output text 2>/dev/null || echo "None")

if [ "$DEFAULT_VPC" = "None" ]; then
    echo -e "${RED}기본 VPC를 찾을 수 없습니다. VPC를 먼저 설정하세요.${NC}"
    exit 1
fi

echo -e "${GREEN}기본 VPC 발견: $DEFAULT_VPC${NC}"

# 서브넷 그룹 생성 (이미 존재하면 무시)
echo -e "${YELLOW}DB 서브넷 그룹 생성 중...${NC}"
SUBNET_GROUP_NAME="skyline-subnet-group"

# 가용 영역의 서브넷 가져오기
SUBNETS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$DEFAULT_VPC" --query 'Subnets[].SubnetId' --output text)
SUBNET_ARRAY=($SUBNETS)

if [ ${#SUBNET_ARRAY[@]} -lt 2 ]; then
    echo -e "${RED}최소 2개의 서브넷이 필요합니다. 현재: ${#SUBNET_ARRAY[@]}개${NC}"
    exit 1
fi

aws rds create-db-subnet-group \
    --db-subnet-group-name $SUBNET_GROUP_NAME \
    --db-subnet-group-description "Skyline demo subnet group" \
    --subnet-ids ${SUBNET_ARRAY[0]} ${SUBNET_ARRAY[1]} 2>/dev/null || echo -e "${YELLOW}서브넷 그룹이 이미 존재합니다.${NC}"

# 보안 그룹 생성
echo -e "${YELLOW}보안 그룹 생성 중...${NC}"
SECURITY_GROUP_NAME="skyline-db-sg"

SECURITY_GROUP_ID=$(aws ec2 create-security-group \
    --group-name $SECURITY_GROUP_NAME \
    --description "Skyline database security group" \
    --vpc-id $DEFAULT_VPC \
    --query 'GroupId' --output text 2>/dev/null || \
    aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=$SECURITY_GROUP_NAME" "Name=vpc-id,Values=$DEFAULT_VPC" \
    --query 'SecurityGroups[0].GroupId' --output text)

echo -e "${GREEN}보안 그룹 ID: $SECURITY_GROUP_ID${NC}"

# MySQL 포트 개방 (3306)
aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 3306 \
    --cidr 10.0.0.0/8 2>/dev/null || echo -e "${YELLOW}인바운드 규칙이 이미 존재합니다.${NC}"

# RDS 인스턴스 생성
echo -e "${YELLOW}RDS 인스턴스 생성 중... (약 5-10분 소요)${NC}"

aws rds create-db-instance \
    --db-instance-identifier $INSTANCE_NAME \
    --db-instance-class $INSTANCE_CLASS \
    --engine mysql \
    --engine-version $ENGINE_VERSION \
    --allocated-storage $ALLOCATED_STORAGE \
    --storage-type gp2 \
    --db-name $DB_NAME \
    --master-username $MASTER_USERNAME \
    --master-user-password "$MASTER_PASSWORD" \
    --vpc-security-group-ids $SECURITY_GROUP_ID \
    --db-subnet-group-name $SUBNET_GROUP_NAME \
    --backup-retention-period 0 \
    --no-deletion-protection \
    --no-publicly-accessible \
    --storage-encrypted

echo -e "${GREEN}RDS 인스턴스 생성 요청 완료!${NC}"
echo -e "${YELLOW}인스턴스가 사용 가능해질 때까지 기다리는 중...${NC}"

# 인스턴스 상태 확인
while true; do
    STATUS=$(aws rds describe-db-instances \
        --db-instance-identifier $INSTANCE_NAME \
        --query 'DBInstances[0].DBInstanceStatus' \
        --output text)
    
    if [ "$STATUS" = "available" ]; then
        break
    elif [ "$STATUS" = "failed" ]; then
        echo -e "${RED}RDS 인스턴스 생성 실패!${NC}"
        exit 1
    fi
    
    echo "현재 상태: $STATUS (30초 후 재확인...)"
    sleep 30
done

# 엔드포인트 정보 출력
ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier $INSTANCE_NAME \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text)

PORT=$(aws rds describe-db-instances \
    --db-instance-identifier $INSTANCE_NAME \
    --query 'DBInstances[0].Endpoint.Port' \
    --output text)

echo -e "${GREEN}=== RDS 설정 완료! ===${NC}"
echo -e "${GREEN}인스턴스 이름: $INSTANCE_NAME${NC}"
echo -e "${GREEN}엔드포인트: $ENDPOINT${NC}"
echo -e "${GREEN}포트: $PORT${NC}"
echo -e "${GREEN}데이터베이스 이름: $DB_NAME${NC}"
echo -e "${GREEN}마스터 사용자: $MASTER_USERNAME${NC}"
echo ""
echo -e "${YELLOW}다음 명령으로 데이터베이스를 초기화하세요:${NC}"
echo -e "${YELLOW}./init-database.sh $ENDPOINT${NC}"
echo ""
echo -e "${YELLOW}Kubernetes Secret 생성:${NC}"
echo "kubectl create secret generic skyline-db-secret \\"
echo "  --from-literal=DB_HOST=$ENDPOINT \\"
echo "  --from-literal=DB_USER=$MASTER_USERNAME \\"
echo "  --from-literal=DB_PASSWORD=your-password \\"
echo "  --from-literal=DB_NAME=$DB_NAME"