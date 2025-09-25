# Skyline API 문서

## 개요
Skyline 항공예약시스템은 RESTful API를 제공하여 항공편 조회, 예약 관리 등의 기능을 제공합니다.

**Base URL**: `http://localhost:8080` (또는 배포된 서비스 URL)

## 인증
현재 버전에서는 인증이 필요하지 않습니다. (데모 목적)

## 공통 응답 형식

### 성공 응답
```json
{
  "data": { ... },
  "message": "Success"
}
```

### 오류 응답
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-12-01T10:00:00Z"
}
```

## 항공편 API

### 1. 모든 항공편 조회
```http
GET /api/flights
```

**응답 예시:**
```json
[
  {
    "flightId": 1,
    "flightNumber": "SK101",
    "departureAirport": {
      "airportCode": "ICN",
      "airportName": "인천국제공항",
      "city": "서울",
      "country": "대한민국"
    },
    "arrivalAirport": {
      "airportCode": "NRT",
      "airportName": "나리타국제공항", 
      "city": "도쿄",
      "country": "일본"
    },
    "departureTime": "2024-12-01T09:00:00",
    "arrivalTime": "2024-12-01T11:30:00",
    "aircraftType": "Boeing 737",
    "totalSeats": 180,
    "availableSeats": 150,
    "price": 350000.00
  }
]
```

### 2. 특정 항공편 조회
```http
GET /api/flights/{id}
```

**파라미터:**
- `id` (Long): 항공편 ID

### 3. 항공편 검색
```http
GET /api/flights/search?from={departure}&to={arrival}&date={date}
```

**쿼리 파라미터:**
- `from` (String): 출발공항 코드 (예: ICN)
- `to` (String): 도착공항 코드 (예: NRT)  
- `date` (Date): 출발날짜 (YYYY-MM-DD 형식)

**예시:**
```http
GET /api/flights/search?from=ICN&to=NRT&date=2024-12-01
```

### 4. 이용 가능한 항공편 조회
```http
GET /api/flights/available
```
좌석이 남아있는 항공편만 반환합니다.

### 5. 출발공항별 항공편 조회
```http
GET /api/flights/departure/{airportCode}
```

### 6. 도착공항별 항공편 조회  
```http
GET /api/flights/arrival/{airportCode}
```

## 예약 API

### 1. 모든 예약 조회
```http
GET /api/reservations
```

### 2. 특정 예약 조회
```http
GET /api/reservations/{id}
```

### 3. 새 예약 생성
```http
POST /api/reservations
Content-Type: application/json

{
  "flight": {
    "flightId": 1
  },
  "passengerName": "김철수",
  "passengerEmail": "kim@example.com", 
  "passengerPhone": "010-1234-5678",
  "seatNumber": "1A"
}
```

**응답 예시:**
```json
{
  "reservationId": 1,
  "flight": {
    "flightId": 1,
    "flightNumber": "SK101"
  },
  "passengerName": "김철수",
  "passengerEmail": "kim@example.com",
  "passengerPhone": "010-1234-5678", 
  "seatNumber": "1A",
  "reservationDate": "2024-12-01T10:00:00",
  "status": "CONFIRMED"
}
```

### 4. 예약 수정
```http
PUT /api/reservations/{id}
Content-Type: application/json

{
  "passengerName": "김철수",
  "passengerEmail": "kim@example.com",
  "passengerPhone": "010-1234-5678",
  "seatNumber": "2A"
}
```

### 5. 예약 취소
```http
PATCH /api/reservations/{id}/cancel
```

### 6. 예약 삭제
```http
DELETE /api/reservations/{id}
```

### 7. 이메일별 예약 조회
```http
GET /api/reservations/email/{email}
```

### 8. 항공편별 예약 조회
```http
GET /api/reservations/flight/{flightId}
```

## 시스템 모니터링 API

### 1. 헬스체크
```http
GET /health
```

**응답 예시:**
```json
{
  "status": "UP",
  "application": "Skyline",
  "version": "1.0.0",
  "database": {
    "status": "UP",
    "type": "MySQL",
    "url": "jdbc:mysql://localhost:3306/skyline"
  }
}
```

### 2. 레디니스 체크
```http
GET /ready
```

### 3. Prometheus 메트릭
```http
GET /metrics
```

### 4. CPU 부하 테스트
```http
GET /stress/cpu?seconds=5
```

**쿼리 파라미터:**
- `seconds` (Integer): 부하 테스트 지속 시간 (기본값: 5)

### 5. 메모리 부하 테스트
```http
GET /stress/memory?sizeMB=100
```

**쿼리 파라미터:**
- `sizeMB` (Integer): 할당할 메모리 크기 (MB, 기본값: 100)

### 6. 시스템 정보
```http
GET /stress/info
```

## 오류 코드

| HTTP 상태 | 설명 |
|-----------|------|
| 200 | 성공 |
| 201 | 생성됨 |
| 400 | 잘못된 요청 |
| 404 | 리소스를 찾을 수 없음 |
| 500 | 서버 내부 오류 |
| 503 | 서비스 사용 불가 |
| 507 | 메모리 부족 |

## 예제 시나리오

### 시나리오 1: 항공편 검색 및 예약
```bash
# 1. ICN에서 NRT로 가는 2024-12-01 항공편 검색
curl "http://localhost:8080/api/flights/search?from=ICN&to=NRT&date=2024-12-01"

# 2. 선택한 항공편으로 예약 생성
curl -X POST http://localhost:8080/api/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "flight": {"flightId": 1},
    "passengerName": "홍길동",
    "passengerEmail": "hong@example.com",
    "passengerPhone": "010-1234-5678",
    "seatNumber": "1A"
  }'
```

### 시나리오 2: 부하 테스트
```bash
# CPU 부하 테스트 (10초간)
curl "http://localhost:8080/stress/cpu?seconds=10"

# 메모리 부하 테스트 (200MB)  
curl "http://localhost:8080/stress/memory?sizeMB=200"
```

## 개발 및 테스트 팁

1. **API 테스트 도구**: Postman, Insomnia, 또는 curl 사용
2. **부하 테스트**: Apache Bench (ab) 또는 K6 사용
3. **모니터링**: /metrics 엔드포인트를 Prometheus와 연동
4. **로그 확인**: 애플리케이션 로그에서 SQL 쿼리 확인 가능