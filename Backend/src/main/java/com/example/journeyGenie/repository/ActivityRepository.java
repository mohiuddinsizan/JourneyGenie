package com.example.journeyGenie.repository;

import com.example.journeyGenie.entity.Activity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ActivityRepository extends JpaRepository<Activity, Long> {
}
