package com.example.skyline.repository;

import com.example.skyline.entity.Flight;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FlightRepository extends JpaRepository<Flight, Long> {
    
    List<Flight> findByFlightNumber(String flightNumber);
    
    @Query("SELECT f FROM Flight f WHERE " +
           "f.departureAirport.airportCode = :departure AND " +
           "f.arrivalAirport.airportCode = :arrival AND " +
           "DATE(f.departureTime) = :date")
    List<Flight> findFlightsByRoute(@Param("departure") String departureAirport,
                                   @Param("arrival") String arrivalAirport,
                                   @Param("date") LocalDate date);
    
    @Query("SELECT f FROM Flight f WHERE " +
           "f.departureTime BETWEEN :startDate AND :endDate")
    List<Flight> findFlightsByDateRange(@Param("startDate") LocalDateTime startDate,
                                       @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT f FROM Flight f WHERE f.availableSeats > 0")
    List<Flight> findAvailableFlights();
    
    List<Flight> findByDepartureAirport_AirportCode(String airportCode);
    
    List<Flight> findByArrivalAirport_AirportCode(String airportCode);
}