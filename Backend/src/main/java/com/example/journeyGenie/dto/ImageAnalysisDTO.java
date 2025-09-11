package com.example.journeyGenie.dto;

import java.time.LocalDateTime;
import java.util.List;

public class ImageAnalysisDTO {
    private String imageUrl;
    private String prompt;
    private String query;
    private String description;
    private Double relevance;
    private String source;
    private LocalDateTime analyzedAt;

    // Photo info for search results
    private Long photoId;
    private Long dayId;
    private Long tourId;
    private String tourTitle;
    private String destination;
    private String startLocation;
    private String date;

    // Additional search fields
    private List<String> tags;
    private String category;
    private String mood;
    private String timeOfDay;

    public ImageAnalysisDTO() {}

    public ImageAnalysisDTO(String imageUrl, String prompt) {
        this.imageUrl = imageUrl;
        this.prompt = prompt;
    }

    public ImageAnalysisDTO(String query) {
        this.query = query;
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

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getMood() {
        return mood;
    }

    public void setMood(String mood) {
        this.mood = mood;
    }

    public String getTimeOfDay() {
        return timeOfDay;
    }

    public void setTimeOfDay(String timeOfDay) {
        this.timeOfDay = timeOfDay;
    }

    @Override
    public String toString() {
        return "ImageAnalysisDTO{" +
                "imageUrl='" + imageUrl + '\'' +
                ", query='" + query + '\'' +
                ", description='" + description + '\'' +
                ", relevance=" + relevance +
                ", source='" + source + '\'' +
                ", tourTitle='" + tourTitle + '\'' +
                '}';
    }
}