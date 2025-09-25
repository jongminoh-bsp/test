-- Skyline 항공예약시스템 데이터베이스 스키마
-- MySQL 8.0 compatible

-- 데이터베이스 생성 (필요한 경우)
-- CREATE DATABASE IF NOT EXISTS skyline CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE skyline;

-- 공항 테이블
CREATE TABLE IF NOT EXISTS airports (
    airport_code VARCHAR(3) PRIMARY KEY COMMENT '공항 코드 (IATA)',
    airport_name VARCHAR(100) NOT NULL COMMENT '공항명',
    city VARCHAR(50) NOT NULL COMMENT '도시명',
    country VARCHAR(50) NOT NULL COMMENT '국가명',
    INDEX idx_country (country),
    INDEX idx_city (city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='공항 정보';

-- 항공편 테이블
CREATE TABLE IF NOT EXISTS flights (
    flight_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '항공편 ID',
    flight_number VARCHAR(10) NOT NULL COMMENT '항공편명',
    departure_airport VARCHAR(3) NOT NULL COMMENT '출발공항',
    arrival_airport VARCHAR(3) NOT NULL COMMENT '도착공항', 
    departure_time DATETIME NOT NULL COMMENT '출발시간',
    arrival_time DATETIME NOT NULL COMMENT '도착시간',
    aircraft_type VARCHAR(20) COMMENT '기종',
    total_seats INT NOT NULL COMMENT '총 좌석수',
    available_seats INT NOT NULL COMMENT '이용가능 좌석수',
    price DECIMAL(10,2) NOT NULL COMMENT '가격',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    
    CONSTRAINT fk_flights_departure FOREIGN KEY (departure_airport) REFERENCES airports(airport_code),
    CONSTRAINT fk_flights_arrival FOREIGN KEY (arrival_airport) REFERENCES airports(airport_code),
    CONSTRAINT chk_seats_positive CHECK (total_seats > 0),
    CONSTRAINT chk_available_seats CHECK (available_seats >= 0 AND available_seats <= total_seats),
    CONSTRAINT chk_price_positive CHECK (price > 0),
    CONSTRAINT chk_departure_before_arrival CHECK (departure_time < arrival_time),
    
    INDEX idx_flight_number (flight_number),
    INDEX idx_departure_airport (departure_airport),
    INDEX idx_arrival_airport (arrival_airport),
    INDEX idx_departure_time (departure_time),
    INDEX idx_route_date (departure_airport, arrival_airport, departure_time),
    INDEX idx_available_seats (available_seats)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='항공편 정보';

-- 예약 테이블
CREATE TABLE IF NOT EXISTS reservations (
    reservation_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '예약 ID',
    flight_id BIGINT NOT NULL COMMENT '항공편 ID',
    passenger_name VARCHAR(100) NOT NULL COMMENT '승객명',
    passenger_email VARCHAR(100) NOT NULL COMMENT '승객 이메일',
    passenger_phone VARCHAR(20) COMMENT '승객 전화번호',
    seat_number VARCHAR(10) COMMENT '좌석번호',
    reservation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '예약일시',
    status ENUM('CONFIRMED', 'CANCELLED', 'PENDING') DEFAULT 'CONFIRMED' COMMENT '예약상태',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    
    CONSTRAINT fk_reservations_flight FOREIGN KEY (flight_id) REFERENCES flights(flight_id),
    
    INDEX idx_passenger_email (passenger_email),
    INDEX idx_flight_id (flight_id),
    INDEX idx_status (status),
    INDEX idx_reservation_date (reservation_date),
    
    UNIQUE KEY uk_flight_seat (flight_id, seat_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='예약 정보';

-- 예약 통계 뷰 (선택사항)
CREATE OR REPLACE VIEW reservation_stats AS
SELECT 
    f.flight_id,
    f.flight_number,
    f.departure_airport,
    f.arrival_airport,
    f.departure_time,
    f.total_seats,
    f.available_seats,
    COUNT(r.reservation_id) as total_reservations,
    COUNT(CASE WHEN r.status = 'CONFIRMED' THEN 1 END) as confirmed_reservations,
    COUNT(CASE WHEN r.status = 'CANCELLED' THEN 1 END) as cancelled_reservations
FROM flights f
LEFT JOIN reservations r ON f.flight_id = r.flight_id
GROUP BY f.flight_id;

-- 트리거: 예약 생성 시 available_seats 감소
DELIMITER //
CREATE TRIGGER tr_reservation_insert 
AFTER INSERT ON reservations
FOR EACH ROW
BEGIN
    IF NEW.status = 'CONFIRMED' THEN
        UPDATE flights 
        SET available_seats = available_seats - 1 
        WHERE flight_id = NEW.flight_id;
    END IF;
END//

-- 트리거: 예약 상태 변경 시 available_seats 조정
CREATE TRIGGER tr_reservation_update
AFTER UPDATE ON reservations
FOR EACH ROW
BEGIN
    -- 확정 -> 취소
    IF OLD.status = 'CONFIRMED' AND NEW.status = 'CANCELLED' THEN
        UPDATE flights 
        SET available_seats = available_seats + 1 
        WHERE flight_id = NEW.flight_id;
    -- 취소 -> 확정
    ELSEIF OLD.status = 'CANCELLED' AND NEW.status = 'CONFIRMED' THEN
        UPDATE flights 
        SET available_seats = available_seats - 1 
        WHERE flight_id = NEW.flight_id;
    END IF;
END//

-- 트리거: 예약 삭제 시 available_seats 증가
CREATE TRIGGER tr_reservation_delete
AFTER DELETE ON reservations
FOR EACH ROW
BEGIN
    IF OLD.status = 'CONFIRMED' THEN
        UPDATE flights 
        SET available_seats = available_seats + 1 
        WHERE flight_id = OLD.flight_id;
    END IF;
END//
DELIMITER ;