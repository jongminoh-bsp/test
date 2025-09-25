# Skyline 문제 해결 가이드

## 개요
이 문서는 Skyline 항공예약시스템 운영 중 발생할 수 있는 일반적인 문제들과 해결 방법을 제공합니다.

## 1. 애플리케이션 시작 문제

### 문제: 애플리케이션이 시작되지 않음

#### 증상
```
org.springframework.boot.context.config.ConfigDataLocationNotFoundException: 
Config data location 'classpath:/application.yml' does not exist
```

#### 해결 방법
```bash
# application.yml 파일이 올바른 위치에 있는지 확인
ls -la src/main/resources/application.yml

# Docker 컨테이너 내부 확인
docker exec -it skyline-app ls -la /app/
```

### 문제: 포트 충돌

#### 증상
```
Port 8080 was already in use
```

#### 해결 방법
```bash
# 1. 사용 중인 포트 확인
lsof -i :8080
netstat -tulpn | grep :8080

# 2. 다른 포트 사용 또는 기존 프로세스 종료
kill -9 <PID>

# 3. Docker에서 다른 포트 사용
docker run -p 8081:8080 your-registry/skyline:latest
```

## 2. 데이터베이스 연결 문제

### 문제: MySQL 연결 실패

#### 증상
```
Communications link failure
The last packet sent successfully to the server was 0 milliseconds ago.
```

#### 해결 방법
```bash
# 1. 데이터베이스 연결 정보 확인
echo $DB_HOST
echo $DB_USER

# 2. 네트워크 연결 테스트
telnet $DB_HOST 3306
nc -zv $DB_HOST 3306

# 3. MySQL 클라이언트로 직접 연결 테스트
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME

# 4. RDS 보안 그룹 확인 (AWS)
aws ec2 describe-security-groups --group-ids sg-xxxxxxxxx
```

### 문제: 권한 문제

#### 증상
```
Access denied for user 'skyline_user'@'%' to database 'skyline'
```

#### 해결 방법
```sql
-- MySQL 관리자로 접속하여 권한 부여
GRANT ALL PRIVILEGES ON skyline.* TO 'skyline_user'@'%';
FLUSH PRIVILEGES;

-- 사용자 존재 여부 확인
SELECT User, Host FROM mysql.user WHERE User = 'skyline_user';
```

### 문제: 커넥션 풀 고갈

#### 증상
```
HikariPool-1 - Connection is not available, request timed out after 30000ms.
```

#### 해결 방법
```yaml
# application.yml에서 커넥션 풀 설정 조정
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 60000
      idle-timeout: 300000
      max-lifetime: 900000
```

## 3. Kubernetes 배포 문제

### 문제: Pod가 Pending 상태

#### 증상
```bash
kubectl get pods
NAME                           READY   STATUS    RESTARTS   AGE
skyline-app-xxx                0/1     Pending   0          5m
```

#### 해결 방법
```bash
# 1. Pod 상세 정보 확인
kubectl describe pod skyline-app-xxx

# 2. 노드 리소스 확인
kubectl describe nodes
kubectl top nodes

# 3. 리소스 제한 조정
# deployment.yaml에서
resources:
  requests:
    memory: "256Mi"  # 더 작게 설정
    cpu: "100m"
```

### 문제: Pod가 CrashLoopBackOff 상태

#### 증상
```bash
NAME                           READY   STATUS             RESTARTS   AGE
skyline-app-xxx                0/1     CrashLoopBackOff   5          5m
```

#### 해결 방법
```bash
# 1. 로그 확인
kubectl logs skyline-app-xxx
kubectl logs skyline-app-xxx --previous

# 2. 이벤트 확인  
kubectl describe pod skyline-app-xxx

# 3. 헬스체크 설정 조정
livenessProbe:
  initialDelaySeconds: 120  # 더 길게 설정
  periodSeconds: 30
  timeoutSeconds: 10
  failureThreshold: 5
```

### 문제: Secret을 찾을 수 없음

#### 증상
```
Error: couldn't find key DB_HOST in Secret default/skyline-db-secret
```

#### 해결 방법
```bash
# 1. Secret 존재 확인
kubectl get secrets
kubectl describe secret skyline-db-secret

# 2. Secret 재생성
kubectl delete secret skyline-db-secret
kubectl create secret generic skyline-db-secret \
  --from-literal=DB_HOST=your-rds-endpoint \
  --from-literal=DB_USER=admin \
  --from-literal=DB_PASSWORD=your-password \
  --from-literal=DB_NAME=skyline

# 3. Secret 내용 확인
kubectl get secret skyline-db-secret -o yaml
```

## 4. 네트워킹 문제

### 문제: 서비스에 접근할 수 없음

#### 증상
```bash
curl: (7) Failed to connect to service-url port 80: Connection refused
```

#### 해결 방법
```bash
# 1. 서비스 확인
kubectl get svc skyline-service
kubectl describe svc skyline-service

# 2. 엔드포인트 확인
kubectl get endpoints skyline-service

# 3. Pod 상태 확인
kubectl get pods -l app=skyline -o wide

# 4. 포트 포워딩으로 직접 테스트
kubectl port-forward deployment/skyline-app 8080:8080
curl localhost:8080/health
```

### 문제: Ingress 연결 실패

#### 증상
- 외부에서 도메인으로 접근이 안됨
- 502 Bad Gateway 오류

#### 해결 방법
```bash
# 1. Ingress Controller 설치 확인
kubectl get pods -n kube-system | grep alb

# 2. Ingress 리소스 확인
kubectl describe ingress skyline-ingress

# 3. ALB 생성 확인 (AWS)
aws elbv2 describe-load-balancers

# 4. DNS 설정 확인
nslookup your-domain.com
```

## 5. 성능 문제

### 문제: 응답 시간이 느림

#### 진단
```bash
# 1. 애플리케이션 메트릭 확인
curl http://your-service/metrics | grep http_request

# 2. 데이터베이스 쿼리 성능 확인
# application.yml에서 SQL 로깅 활성화
logging:
  level:
    org.hibernate.SQL: DEBUG
    
# 3. JVM 메트릭 확인
curl http://your-service/metrics | grep jvm
```

#### 해결 방법
```yaml
# 1. JVM 튜닝
ENV JAVA_OPTS="-Xms512m -Xmx1g -XX:+UseG1GC"

# 2. 데이터베이스 커넥션 풀 튜닝
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      
# 3. 인덱스 추가 (필요시)
CREATE INDEX idx_flights_route_date ON flights(departure_airport, arrival_airport, departure_time);
```

### 문제: 메모리 사용량 증가

#### 진단
```bash
# 1. 메모리 사용량 모니터링
kubectl top pods
docker stats

# 2. 힙 덤프 생성 (필요시)
kubectl exec skyline-app-xxx -- jmap -dump:live,format=b,file=/tmp/heap.hprof 1
```

#### 해결 방법
```yaml
# 리소스 제한 조정
resources:
  limits:
    memory: "2Gi"
  requests:
    memory: "1Gi"
```

## 6. 모니터링 문제

### 문제: 메트릭이 수집되지 않음

#### 해결 방법
```bash
# 1. 메트릭 엔드포인트 확인
curl http://your-service/metrics

# 2. Prometheus 설정 확인
kubectl get configmap prometheus-config -o yaml

# 3. 서비스 디스커버리 확인
kubectl get servicemonitor
```

### 문제: 헬스체크 실패

#### 증상
```json
{
  "status": "DOWN",
  "database": {
    "status": "DOWN",
    "error": "Connection refused"
  }
}
```

#### 해결 방법
```bash
# 1. 데이터베이스 연결 확인
kubectl exec skyline-app-xxx -- curl localhost:8080/health

# 2. 헬스체크 로직 확인
kubectl logs skyline-app-xxx | grep -i health

# 3. 프로브 설정 조정
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 60
  periodSeconds: 30
  failureThreshold: 3
```

## 7. 스케일링 문제

### 문제: HPA가 스케일링하지 않음

#### 진단
```bash
# 1. HPA 상태 확인
kubectl describe hpa skyline-hpa

# 2. 메트릭 서버 확인
kubectl get pods -n kube-system | grep metrics-server

# 3. 리소스 사용량 확인
kubectl top pods
```

#### 해결 방법
```bash
# 1. 메트릭 서버 재시작
kubectl rollout restart deployment metrics-server -n kube-system

# 2. 리소스 요청값 설정 확인
# HPA는 requests 기준으로 동작
resources:
  requests:
    cpu: "200m"
    memory: "256Mi"
```

## 8. 일반적인 디버깅 명령어

### 기본 정보 수집
```bash
# 전체 리소스 상태
kubectl get all

# 이벤트 확인
kubectl get events --sort-by=.metadata.creationTimestamp

# 리소스 사용량
kubectl top nodes
kubectl top pods

# 네트워크 정책
kubectl get networkpolicy
```

### 로그 수집
```bash
# 애플리케이션 로그
kubectl logs -l app=skyline --tail=100 -f

# 이전 컨테이너 로그
kubectl logs pod-name --previous

# 여러 Pod 로그 수집
kubectl logs -l app=skyline --prefix=true
```

### 상세 디버깅
```bash
# Pod 내부 접속
kubectl exec -it skyline-app-xxx -- /bin/bash

# 임시 디버그 Pod 생성
kubectl run debug --image=busybox -it --rm -- sh

# 네트워크 연결 테스트
kubectl run netshoot --image=nicolaka/netshoot -it --rm -- bash
```

## 9. 긴급 복구 절차

### 서비스 중단 시
```bash
# 1. 빠른 롤백
kubectl rollout undo deployment/skyline-app

# 2. 스케일 조정
kubectl scale deployment skyline-app --replicas=0
kubectl scale deployment skyline-app --replicas=3

# 3. 설정 초기화
kubectl delete configmap skyline-config
kubectl apply -f k8s-examples/basic/
```

### 데이터베이스 문제 시
```bash
# 1. 연결 풀 리셋
kubectl rollout restart deployment skyline-app

# 2. 읽기 전용 모드로 전환 (필요시)
# application.yml에서
spring:
  jpa:
    hibernate:
      ddl-auto: none
```

이 가이드를 통해 대부분의 문제를 해결할 수 있습니다. 추가적인 문제가 발생하면 로그와 메트릭을 자세히 분석하여 근본 원인을 파악하세요.