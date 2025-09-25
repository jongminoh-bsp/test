import axios from 'axios'
import type { Flight, Reservation, CreateReservationRequest, FlightSearchParams, SystemInfo, HealthStatus } from '../types'

const API_BASE_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8080'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url)
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url)
    return response
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data)
    return Promise.reject(error)
  }
)

// Flight API
export const flightAPI = {
  getAllFlights: (): Promise<Flight[]> =>
    api.get('/api/flights').then(res => res.data),
    
  getFlightById: (id: number): Promise<Flight> =>
    api.get(`/api/flights/${id}`).then(res => res.data),
    
  searchFlights: (params: FlightSearchParams): Promise<Flight[]> =>
    api.get('/api/flights/search', { params }).then(res => res.data),
    
  getAvailableFlights: (): Promise<Flight[]> =>
    api.get('/api/flights/available').then(res => res.data),
    
  getFlightsByDeparture: (airportCode: string): Promise<Flight[]> =>
    api.get(`/api/flights/departure/${airportCode}`).then(res => res.data),
    
  getFlightsByArrival: (airportCode: string): Promise<Flight[]> =>
    api.get(`/api/flights/arrival/${airportCode}`).then(res => res.data),
}

// Reservation API
export const reservationAPI = {
  getAllReservations: (): Promise<Reservation[]> =>
    api.get('/api/reservations').then(res => res.data),
    
  getReservationById: (id: number): Promise<Reservation> =>
    api.get(`/api/reservations/${id}`).then(res => res.data),
    
  createReservation: (data: CreateReservationRequest): Promise<Reservation> =>
    api.post('/api/reservations', data).then(res => res.data),
    
  updateReservation: (id: number, data: Partial<CreateReservationRequest>): Promise<Reservation> =>
    api.put(`/api/reservations/${id}`, data).then(res => res.data),
    
  cancelReservation: (id: number): Promise<void> =>
    api.patch(`/api/reservations/${id}/cancel`).then(res => res.data),
    
  deleteReservation: (id: number): Promise<void> =>
    api.delete(`/api/reservations/${id}`).then(res => res.data),
    
  getReservationsByEmail: (email: string): Promise<Reservation[]> =>
    api.get(`/api/reservations/email/${email}`).then(res => res.data),
    
  getReservationsByFlightId: (flightId: number): Promise<Reservation[]> =>
    api.get(`/api/reservations/flight/${flightId}`).then(res => res.data),
}

// System API
export const systemAPI = {
  getHealth: (): Promise<HealthStatus> =>
    api.get('/health').then(res => res.data),
    
  getReady: (): Promise<{ status: string; message: string }> =>
    api.get('/ready').then(res => res.data),
    
  getSystemInfo: (): Promise<SystemInfo> =>
    api.get('/stress/info').then(res => res.data),
    
  stressCPU: (seconds: number = 5): Promise<any> =>
    api.get(`/stress/cpu?seconds=${seconds}`).then(res => res.data),
    
  stressMemory: (sizeMB: number = 100): Promise<any> =>
    api.get(`/stress/memory?sizeMB=${sizeMB}`).then(res => res.data),
    
  getMetrics: (): Promise<string> =>
    api.get('/metrics', { 
      headers: { 'Accept': 'text/plain' } 
    }).then(res => res.data),
}

export default api