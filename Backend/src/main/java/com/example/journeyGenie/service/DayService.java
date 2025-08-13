package com.example.journeyGenie.service;

import com.example.journeyGenie.entity.Day;
import com.example.journeyGenie.entity.Tour;
import com.example.journeyGenie.repository.DayRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class DayService {
    @Autowired
    private DayRepository dayRepository;
}
