package com.example.skyline.repository;

import com.example.skyline.entity.Airport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AirportRepository extends JpaRepository<Airport, String> {
    
    List<Airport> findByCountry(String country);
    
    List<Airport> findByCity(String city);
    
    List<Airport> findByAirportNameContainingIgnoreCase(String airportName);
}