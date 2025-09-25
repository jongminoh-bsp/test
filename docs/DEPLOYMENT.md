# Skyline 배포 가이드

## 개요
이 문서는 Skyline 항공예약시스템을 다양한 환경에 배포하는 방법을 안내합니다.

## 사전 요구사항

### 로컬 개발 환경
- Docker Desktop
- Java 17+
- Maven 3.6+
- MySQL 8.0+ (선택사항)

### AWS EKS 환경
- AWS CLI 설정
- kubectl 설치
- eksctl 설치 (선택사항)
- Helm 3.0+ (고급 배포용)

## 1. 로컬 환경 배포

### Docker Compose 사용
```bash
# 1. 프로젝트 클론
git clone https://github.com/jaehyukryu/skyline_system_demo.git
cd skyline_system_demo

# 2. 애플리케이션 빌드 및 실행
docker-compose up -d

# 3. 접속 확인
curl http://localhost:8080/health
```

### 개별 컨테이너 실행
```bash
# 1. MySQL 컨테이너 실행
docker run -d --name skyline-mysql \
  -e MYSQL_ROOT_PASSWORD=root_password \
  -e MYSQL_DATABASE=skyline \
  -e MYSQL_USER=skyline_user \
  -e MYSQL_PASSWORD=skyline_pass \
  -p 3306:3306 \
  -v $(pwd)/sql:/docker-entrypoint-initdb.d \
  mysql:8.0

# 2. 애플리케이션 이미지 빌드
./scripts/build.sh

# 3. 애플리케이션 컨테이너 실행
docker run -d --name skyline-app \
  --link skyline-mysql:mysql \
  -e DB_HOST=mysql \
  -e DB_USER=skyline_user \
  -e DB_PASSWORD=skyline_pass \
  -p 8080:8080 \
  your-registry/skyline:latest
```

## 2. AWS RDS 설정

### RDS 인스턴스 생성
```bash
# 자동 설정 스크립트 사용
./scripts/setup-rds.sh skyline-demo-db

# 또는 AWS CLI 직접 사용
aws rds create-db-instance \
  --db-instance-identifier skyline-demo-db \
  --db-instance-class db.t3.micro \
  --engine mysql \
  --engine-version 8.0 \
  --allocated-storage 20 \
  --db-name skyline \
  --master-username admin \
  --master-user-password YourSecurePassword123! \
  --vpc-security-group-ids sg-xxxxxxxxx \
  --no-publicly-accessible
```

### 데이터베이스 초기화
```bash
# RDS 엔드포인트 확인 후 초기화
./scripts/init-database.sh your-rds-endpoint.amazonaws.com
```

## 3. EKS 클러스터 배포

### 클러스터 준비
```bash
# 1. EKS 클러스터 생성 (eksctl 사용)
eksctl create cluster \
  --name skyline-cluster \
  --region ap-northeast-2 \
  --node-type t3.medium \
  --nodes 2 \
  --nodes-min 1 \
  --nodes-max 4

# 2. kubectl 컨텍스트 설정
aws eks update-kubeconfig --region ap-northeast-2 --name skyline-cluster
```

### 기본 배포
```bash
# 1. Secret 생성 (RDS 정보)
kubectl create secret generic skyline-db-secret \
  --from-literal=DB_HOST=your-rds-endpoint.amazonaws.com \
  --from-literal=DB_USER=admin \
  --from-literal=DB_PASSWORD=your-password \
  --from-literal=DB_NAME=skyline

# 2. 애플리케이션 배포
kubectl apply -f k8s-examples/basic/

# 3. 서비스 확인
kubectl get services skyline-service
kubectl get pods -l app=skyline
```

### Helm을 사용한 배포
```bash
# 1. Helm 차트 배포
cd k8s-examples/advanced/helm-chart

# 2. values.yaml 수정 (필요시)
# 데이터베이스 정보, 이미지 레지스트리 등

# 3. Helm 설치
helm install skyline . \
  --set database.host=your-rds-endpoint.amazonaws.com \
  --set database.password=your-password \
  --set image.repository=your-registry/skyline

# 4. 설치 확인
helm status skyline
```

## 4. 고급 배포 옵션

### Ingress Controller 설정
```bash
# 1. AWS Load Balancer Controller 설치
kubectl apply -k "github.com/aws/eks-charts/stable/aws-load-balancer-controller//crds?ref=master"

helm repo add eks https://aws.github.io/eks-charts
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=skyline-cluster \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller

# 2. Ingress 리소스 배포
kubectl apply -f k8s-examples/advanced/ingress.yaml
```

### Horizontal Pod Autoscaler (HPA) 설정
```bash
# 1. Metrics Server 설치 (필요한 경우)
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# 2. HPA 배포
kubectl apply -f k8s-examples/advanced/hpa.yaml

# 3. HPA 상태 확인
kubectl get hpa skyline-hpa
```

### 모니터링 설정
```bash
# Prometheus와 Grafana 설치 (Helm 사용)
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Prometheus 설치
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace

# Skyline 메트릭 수집 확인
curl http://your-app-url/metrics
```

## 5. 배포 검증

### 기본 동작 확인
```bash
# 1. Pod 상태 확인
kubectl get pods -l app=skyline

# 2. 서비스 엔드포인트 확인
kubectl get svc skyline-service

# 3. 헬스체크
curl http://your-service-url/health

# 4. API 테스트
curl http://your-service-url/api/flights
```

### 부하 테스트
```bash
# Apache Bench 사용
ab -n 1000 -c 10 http://your-service-url/api/flights

# 또는 내장 스트레스 테스트
curl "http://your-service-url/stress/cpu?seconds=30"
```

### 스케일링 테스트
```bash
# 수동 스케일링
kubectl scale deployment skyline-app --replicas=5

# HPA 트리거 (CPU 부하)
for i in {1..10}; do
  curl "http://your-service-url/stress/cpu?seconds=60" &
done
```

## 6. 문제 해결

### 일반적인 문제들

#### Pod가 시작되지 않는 경우
```bash
# 로그 확인
kubectl logs -l app=skyline

# 이벤트 확인
kubectl describe pod <pod-name>

# Secret 확인
kubectl get secret skyline-db-secret -o yaml
```

#### 데이터베이스 연결 실패
```bash
# RDS 보안 그룹 확인
aws ec2 describe-security-groups --group-ids sg-xxxxxxxxx

# 네트워크 연결 테스트
kubectl run mysql-client --image=mysql:8.0 -it --rm --restart=Never -- \
  mysql -h your-rds-endpoint -u admin -p
```

#### 부하 분산 문제
```bash
# 서비스 엔드포인트 확인
kubectl get endpoints skyline-service

# Ingress 상태 확인
kubectl describe ingress skyline-ingress
```

## 7. 배포 자동화

### GitHub Actions 예시
```yaml
# .github/workflows/deploy.yml
name: Deploy to EKS
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ap-northeast-2
    
    - name: Build and push Docker image
      run: |
        ./scripts/build.sh ${{ github.sha }}
        docker push your-registry/skyline:${{ github.sha }}
    
    - name: Deploy to EKS
      run: |
        aws eks update-kubeconfig --name skyline-cluster
        kubectl set image deployment/skyline-app skyline=your-registry/skyline:${{ github.sha }}
```

## 8. 보안 고려사항

### Secret 관리
```bash
# AWS Secrets Manager 사용 (선택사항)
kubectl create secret generic skyline-db-secret \
  --from-literal=DB_HOST=$(aws secretsmanager get-secret-value --secret-id skyline/db/host --query SecretString --output text) \
  --from-literal=DB_PASSWORD=$(aws secretsmanager get-secret-value --secret-id skyline/db/password --query SecretString --output text)
```

### Network Policy
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: skyline-network-policy
spec:
  podSelector:
    matchLabels:
      app: skyline
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          role: frontend
    ports:
    - protocol: TCP
      port: 8080
```

## 9. 백업 및 복구

### 데이터베이스 백업
```bash
# RDS 자동 백업 설정
aws rds modify-db-instance \
  --db-instance-identifier skyline-demo-db \
  --backup-retention-period 7 \
  --apply-immediately
```

### Kubernetes 리소스 백업 (Velero 사용)
```bash
# Velero 설치
velero install --provider aws --plugins velero/velero-plugin-for-aws:v1.7.0 \
  --bucket skyline-backup-bucket \
  --backup-location-config region=ap-northeast-2 \
  --snapshot-location-config region=ap-northeast-2

# 백업 생성
velero backup create skyline-backup --include-namespaces default
```

이 가이드를 통해 Skyline 애플리케이션을 성공적으로 배포하고 운영할 수 있습니다.