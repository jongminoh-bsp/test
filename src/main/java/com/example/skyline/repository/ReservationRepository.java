package com.example.skyline.repository;

import com.example.skyline.entity.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    
    List<Reservation> findByPassengerEmail(String passengerEmail);
    
    List<Reservation> findByStatus(Reservation.ReservationStatus status);
    
    List<Reservation> findByFlight_FlightId(Long flightId);
    
    Long countByFlight_FlightId(Long flightId);
}