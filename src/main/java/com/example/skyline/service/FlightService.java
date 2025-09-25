package com.example.skyline.service;

import com.example.skyline.entity.Flight;
import com.example.skyline.repository.FlightRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class FlightService {
    
    private final FlightRepository flightRepository;
    
    @Autowired
    public FlightService(FlightRepository flightRepository) {
        this.flightRepository = flightRepository;
    }
    
    public List<Flight> getAllFlights() {
        return flightRepository.findAll();
    }
    
    public Optional<Flight> getFlightById(Long id) {
        return flightRepository.findById(id);
    }
    
    public List<Flight> getFlightsByNumber(String flightNumber) {
        return flightRepository.findByFlightNumber(flightNumber);
    }
    
    public List<Flight> searchFlights(String departureAirport, String arrivalAirport, LocalDate date) {
        return flightRepository.findFlightsByRoute(departureAirport, arrivalAirport, date);
    }
    
    public List<Flight> getAvailableFlights() {
        return flightRepository.findAvailableFlights();
    }
    
    public List<Flight> getFlightsByDepartureAirport(String airportCode) {
        return flightRepository.findByDepartureAirport_AirportCode(airportCode);
    }
    
    public List<Flight> getFlightsByArrivalAirport(String airportCode) {
        return flightRepository.findByArrivalAirport_AirportCode(airportCode);
    }
    
    @Transactional
    public Flight saveFlight(Flight flight) {
        return flightRepository.save(flight);
    }
    
    @Transactional
    public boolean decreaseAvailableSeats(Long flightId) {
        Optional<Flight> flightOpt = flightRepository.findById(flightId);
        if (flightOpt.isPresent()) {
            Flight flight = flightOpt.get();
            if (flight.getAvailableSeats() > 0) {
                flight.setAvailableSeats(flight.getAvailableSeats() - 1);
                flightRepository.save(flight);
                return true;
            }
        }
        return false;
    }
    
    @Transactional
    public boolean increaseAvailableSeats(Long flightId) {
        Optional<Flight> flightOpt = flightRepository.findById(flightId);
        if (flightOpt.isPresent()) {
            Flight flight = flightOpt.get();
            if (flight.getAvailableSeats() < flight.getTotalSeats()) {
                flight.setAvailableSeats(flight.getAvailableSeats() + 1);
                flightRepository.save(flight);
                return true;
            }
        }
        return false;
    }
}