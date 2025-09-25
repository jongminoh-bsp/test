package com.example.skyline.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaController {

    @RequestMapping(value = {"/search", "/reservations", "/dashboard", "/flights", "/booking/**"})
    public String spa() {
        return "forward:/";
    }
}
