package com.example.skyline.service;

import com.example.skyline.entity.Flight;
import com.example.skyline.entity.Reservation;
import com.example.skyline.repository.ReservationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class ReservationService {
    
    private final ReservationRepository reservationRepository;
    private final FlightService flightService;
    
    @Autowired
    public ReservationService(ReservationRepository reservationRepository, 
                            FlightService flightService) {
        this.reservationRepository = reservationRepository;
        this.flightService = flightService;
    }
    
    public List<Reservation> getAllReservations() {
        return reservationRepository.findAll();
    }
    
    public Optional<Reservation> getReservationById(Long id) {
        return reservationRepository.findById(id);
    }
    
    public List<Reservation> getReservationsByEmail(String email) {
        return reservationRepository.findByPassengerEmail(email);
    }
    
    public List<Reservation> getReservationsByFlightId(Long flightId) {
        return reservationRepository.findByFlight_FlightId(flightId);
    }
    
    @Transactional
    public Optional<Reservation> createReservation(Reservation reservation) {
        // 항공편 존재 여부 확인
        Optional<Flight> flightOpt = flightService.getFlightById(reservation.getFlight().getFlightId());
        if (flightOpt.isEmpty()) {
            return Optional.empty();
        }
        
        Flight flight = flightOpt.get();
        reservation.setFlight(flight);
        
        // 좌석 감소
        if (flightService.decreaseAvailableSeats(flight.getFlightId())) {
            reservation.setStatus(Reservation.ReservationStatus.CONFIRMED);
            Reservation savedReservation = reservationRepository.save(reservation);
            return Optional.of(savedReservation);
        }
        
        return Optional.empty(); // 좌석이 없는 경우
    }
    
    @Transactional
    public Optional<Reservation> updateReservation(Long id, Reservation updatedReservation) {
        Optional<Reservation> existingReservation = reservationRepository.findById(id);
        if (existingReservation.isPresent()) {
            Reservation reservation = existingReservation.get();
            reservation.setPassengerName(updatedReservation.getPassengerName());
            reservation.setPassengerEmail(updatedReservation.getPassengerEmail());
            reservation.setPassengerPhone(updatedReservation.getPassengerPhone());
            reservation.setSeatNumber(updatedReservation.getSeatNumber());
            return Optional.of(reservationRepository.save(reservation));
        }
        return Optional.empty();
    }
    
    @Transactional
    public boolean cancelReservation(Long id) {
        Optional<Reservation> reservationOpt = reservationRepository.findById(id);
        if (reservationOpt.isPresent()) {
            Reservation reservation = reservationOpt.get();
            
            // 좌석 증가
            flightService.increaseAvailableSeats(reservation.getFlight().getFlightId());
            
            // 예약 상태를 취소로 변경
            reservation.setStatus(Reservation.ReservationStatus.CANCELLED);
            reservationRepository.save(reservation);
            
            return true;
        }
        return false;
    }
    
    @Transactional
    public void deleteReservation(Long id) {
        Optional<Reservation> reservationOpt = reservationRepository.findById(id);
        if (reservationOpt.isPresent()) {
            Reservation reservation = reservationOpt.get();
            
            // 예약이 확정상태인 경우에만 좌석 증가
            if (reservation.getStatus() == Reservation.ReservationStatus.CONFIRMED) {
                flightService.increaseAvailableSeats(reservation.getFlight().getFlightId());
            }
            
            reservationRepository.deleteById(id);
        }
    }
}