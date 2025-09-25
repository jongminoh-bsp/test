export interface Airport {
  airportCode: string
  airportName: string
  city: string
  country: string
}

export interface Flight {
  flightId: number
  flightNumber: string
  departureAirport: Airport
  arrivalAirport: Airport
  departureTime: string
  arrivalTime: string
  aircraftType?: string
  totalSeats: number
  availableSeats: number
  price: number
}

export interface Reservation {
  reservationId: number
  flight: Flight
  passengerName: string
  passengerEmail: string
  passengerPhone?: string
  seatNumber?: string
  reservationDate: string
  status: 'CONFIRMED' | 'CANCELLED' | 'PENDING'
}

export interface CreateReservationRequest {
  flight: {
    flightId: number
  }
  passengerName: string
  passengerEmail: string
  passengerPhone?: string
  seatNumber?: string
}

export interface FlightSearchParams {
  from?: string
  to?: string
  date?: string
}

export interface SystemInfo {
  processors: number
  total_memory_mb: number
  free_memory_mb: number
  max_memory_mb: number
  used_memory_mb: number
}

export interface HealthStatus {
  status: string
  application: string
  version: string
  database: {
    status: string
    type: string
    url?: string
    error?: string
  }
}