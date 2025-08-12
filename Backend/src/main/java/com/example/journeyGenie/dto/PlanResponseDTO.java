package com.example.journeyGenie.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PlanResponseDTO {
    private String destination;
    private String startDate;
    private String endDate;
    private String budget;
    private List<DayDTO> days;
}
