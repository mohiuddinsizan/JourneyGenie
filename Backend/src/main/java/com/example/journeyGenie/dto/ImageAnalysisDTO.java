package com.example.journeyGenie.dto;

import java.time.LocalDateTime;
import java.util.List;

public class ImageAnalysisDTO {
    private String imageUrl;
    private String prompt;

    // Search-related fields
    private String query;
    private List<String> tags;
    private String description;
    private Double relevance;
    private String source; // "cached" or "analyzed"
    private LocalDateTime analyzedAt;

    // Photo info for search results
    private Long photoId;
    private Long dayId;
    private Long tourId;
    private String tourTitle;
    private String destination;
    private String startLocation;
    private String date;

    public ImageAnalysisDTO() {
    }

    // Original constructor for backward compatibility
    public ImageAnalysisDTO(String imageUrl, String prompt) {
        this.imageUrl = imageUrl;
        this.prompt = prompt;
    }

    // Search constructor
    public ImageAnalysisDTO(String query) {
        this.query = query;
    }

    // Full constructor for search results
    public ImageAnalysisDTO(Long photoId, String imageUrl, String description, Double relevance,
                            String source, Long tourId, String tourTitle, String destination,
                            String startLocation, String date) {
        this.photoId = photoId;
        this.imageUrl = imageUrl;
        this.description = description;
        this.relevance = relevance;
        this.source = source;
        this.tourId = tourId;
        this.tourTitle = tourTitle;
        this.destination = destination;
        this.startLocation = startLocation;
        this.date = date;
    }

    // Getters and Setters
    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getPrompt() {
        return prompt;
    }

    public void setPrompt(String prompt) {
        this.prompt = prompt;
    }

    public String getQuery() {
        return query;
    }

    public void setQuery(String query) {
        this.query = query;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Double getRelevance() {
        return relevance;
    }

    public void setRelevance(Double relevance) {
        this.relevance = relevance;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public LocalDateTime getAnalyzedAt() {
        return analyzedAt;
    }

    public void setAnalyzedAt(LocalDateTime analyzedAt) {
        this.analyzedAt = analyzedAt;
    }

    public Long getPhotoId() {
        return photoId;
    }

    public void setPhotoId(Long photoId) {
        this.photoId = photoId;
    }

    public Long getDayId() {
        return dayId;
    }

    public void setDayId(Long dayId) {
        this.dayId = dayId;
    }

    public Long getTourId() {
        return tourId;
    }

    public void setTourId(Long tourId) {
        this.tourId = tourId;
    }

    public String getTourTitle() {
        return tourTitle;
    }

    public void setTourTitle(String tourTitle) {
        this.tourTitle = tourTitle;
    }

    public String getDestination() {
        return destination;
    }

    public void setDestination(String destination) {
        this.destination = destination;
    }

    public String getStartLocation() {
        return startLocation;
    }

    public void setStartLocation(String startLocation) {
        this.startLocation = startLocation;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    @Override
    public String toString() {
        return "ImageAnalysisDTO{" +
                "imageUrl='" + imageUrl + '\'' +
                ", prompt='" + prompt + '\'' +
                ", query='" + query + '\'' +
                ", description='" + description + '\'' +
                ", relevance=" + relevance +
                ", source='" + source + '\'' +
                ", tourTitle='" + tourTitle + '\'' +
                '}';
    }
}