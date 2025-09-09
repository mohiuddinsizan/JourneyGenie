package com.example.journeyGenie.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "photos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class Photo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String link;

    @ManyToOne(optional = false)
    @JoinColumn(name = "dayid", nullable = false)
    @JsonBackReference
    private Day day;

    // New fields for AI analysis
    @Column(columnDefinition = "TEXT")
    private String aiDescription;

    @Column(name = "analyzed_at")
    private LocalDateTime analyzedAt;

    @Column(name = "analysis_tags", columnDefinition = "TEXT")
    private String analysisTags; // Comma-separated tags

    // Custom setter to auto-update timestamp
    public void setAiDescription(String aiDescription) {
        this.aiDescription = aiDescription;
        this.analyzedAt = LocalDateTime.now();
    }
}
