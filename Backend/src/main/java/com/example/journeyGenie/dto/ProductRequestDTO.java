package com.example.journeyGenie.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProductRequestDTO {
    private Long quantity; // number of tokens
    private Long price; // final price in cents (after discount)
    private Long originalPrice; // original price before discount
    private Double discount; // discount percentage applied
    private Boolean discountApplied; // whether discount was applied
}