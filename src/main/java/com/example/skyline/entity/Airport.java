package com.example.skyline.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "airports")
public class Airport {
    
    @Id
    @Column(name = "airport_code", length = 3)
    @Size(min = 3, max = 3, message = "공항 코드는 3자리여야 합니다")
    private String airportCode;
    
    @Column(name = "airport_name", nullable = false, length = 100)
    @NotBlank(message = "공항명은 필수입니다")
    private String airportName;
    
    @Column(name = "city", nullable = false, length = 50)
    @NotBlank(message = "도시명은 필수입니다")
    private String city;
    
    @Column(name = "country", nullable = false, length = 50)
    @NotBlank(message = "국가명은 필수입니다")
    private String country;

    public Airport() {}

    public Airport(String airportCode, String airportName, String city, String country) {
        this.airportCode = airportCode;
        this.airportName = airportName;
        this.city = city;
        this.country = country;
    }

    // Getters and Setters
    public String getAirportCode() {
        return airportCode;
    }

    public void setAirportCode(String airportCode) {
        this.airportCode = airportCode;
    }

    public String getAirportName() {
        return airportName;
    }

    public void setAirportName(String airportName) {
        this.airportName = airportName;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }
}