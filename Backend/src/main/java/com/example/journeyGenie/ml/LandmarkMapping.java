package com.example.journeyGenie.ml;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.io.InputStreamReader;
import java.io.Reader;
import java.util.HashMap;
import java.util.Map;

@Component
public class LandmarkMapping {

    private Map<Integer, String> idToCategory = new HashMap<>();

    // CSV is stored at src/main/resources/datasets/train_label_to_category.csv
    private static final String CSV_RESOURCE = "datasets/train_label_to_category.csv";

    @PostConstruct
    public void init() throws Exception {
        try (Reader reader = new InputStreamReader(new ClassPathResource(CSV_RESOURCE).getInputStream())) {
            CSVParser csvParser = new CSVParser(reader, CSVFormat.DEFAULT
                    .withHeader("landmark_id", "category")
                    .withSkipHeaderRecord(true));
            for (CSVRecord record : csvParser) {
                int id = Integer.parseInt(record.get("landmark_id"));
                String category = record.get("category");
                idToCategory.put(id, category);
            }
        }
    }

    public String getCategory(int id) {
        return idToCategory.getOrDefault(id, "Unknown");
    }
}
