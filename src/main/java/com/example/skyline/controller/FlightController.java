package com.example.skyline.controller;

import com.example.skyline.entity.Flight;
import com.example.skyline.service.FlightService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/flights")
public class FlightController {
    
    private final FlightService flightService;
    
    @Autowired
    public FlightController(FlightService flightService) {
        this.flightService = flightService;
    }
    
    @GetMapping
    public ResponseEntity<List<Flight>> getAllFlights() {
        List<Flight> flights = flightService.getAllFlights();
        return ResponseEntity.ok(flights);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Flight> getFlightById(@PathVariable Long id) {
        Optional<Flight> flight = flightService.getFlightById(id);
        return flight.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/number/{flightNumber}")
    public ResponseEntity<List<Flight>> getFlightsByNumber(@PathVariable String flightNumber) {
        List<Flight> flights = flightService.getFlightsByNumber(flightNumber);
        return ResponseEntity.ok(flights);
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<Flight>> searchFlights(
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<Flight> flights = flightService.searchFlights(from, to, date);
        return ResponseEntity.ok(flights);
    }
    
    @GetMapping("/available")
    public ResponseEntity<List<Flight>> getAvailableFlights() {
        List<Flight> flights = flightService.getAvailableFlights();
        return ResponseEntity.ok(flights);
    }
    
    @GetMapping("/departure/{airportCode}")
    public ResponseEntity<List<Flight>> getFlightsByDeparture(@PathVariable String airportCode) {
        List<Flight> flights = flightService.getFlightsByDepartureAirport(airportCode);
        return ResponseEntity.ok(flights);
    }
    
    @GetMapping("/arrival/{airportCode}")
    public ResponseEntity<List<Flight>> getFlightsByArrival(@PathVariable String airportCode) {
        List<Flight> flights = flightService.getFlightsByArrivalAirport(airportCode);
        return ResponseEntity.ok(flights);
    }
}