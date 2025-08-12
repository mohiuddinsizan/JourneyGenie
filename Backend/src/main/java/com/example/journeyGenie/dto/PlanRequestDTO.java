package com.example.journeyGenie.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PlanRequestDTO {
    private String destination;
    private String startDate;
    private String endDate;
    private String budget;
}
