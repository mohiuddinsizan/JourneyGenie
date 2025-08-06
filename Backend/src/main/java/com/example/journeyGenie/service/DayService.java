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

    public List<Day> createDays(Tour tour, String startDate, String endDate) {
        List<Day> days = new ArrayList<>();

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDate start = LocalDate.parse(startDate, formatter);
        LocalDate end = LocalDate.parse(endDate, formatter);

        while (!start.isAfter(end)) {
            Day day = new Day();
            day.setDate(start.format(formatter));
            day.setTour(tour);
            day.setActivities(new ArrayList<>());
            day.setPhotos(new ArrayList<>());

            days.add(day);
            start = start.plusDays(1);
        }

        return days;
    }
}
