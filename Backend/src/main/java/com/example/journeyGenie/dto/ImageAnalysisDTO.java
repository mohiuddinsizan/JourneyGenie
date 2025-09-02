package com.example.journeyGenie.dto;

public class ImageAnalysisDTO {
    private String imageUrl;
    private String prompt;

    public ImageAnalysisDTO() {
    }

    public ImageAnalysisDTO(String imageUrl, String prompt) {
        this.imageUrl = imageUrl;
        this.prompt = prompt;
    }

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

    @Override
    public String toString() {
        return "ImageAnalysisDTO{" +
                "imageUrl='" + imageUrl + '\'' +
                ", prompt='" + prompt + '\'' +
                '}';
    }
}