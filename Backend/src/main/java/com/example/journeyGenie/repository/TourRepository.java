package com.example.journeyGenie.repository;

import com.example.journeyGenie.entity.Tour;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TourRepository extends JpaRepository<Tour, Long> {
}
