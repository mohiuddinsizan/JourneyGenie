//package com.example.journeyGenie.ml;
//
//import ai.djl.MalformedModelException;
//import ai.djl.inference.Predictor;
//import ai.djl.modality.Classifications;
//import ai.djl.modality.cv.Image;
//import ai.djl.modality.cv.ImageFactory;
//import ai.djl.repository.zoo.Criteria;
//import ai.djl.repository.zoo.ModelNotFoundException;
//import ai.djl.repository.zoo.ZooModel;
//import ai.djl.translate.TranslateException;
//import org.springframework.stereotype.Service;
//import org.springframework.web.multipart.MultipartFile;
//
//import java.io.IOException;
//import java.nio.file.Files;
//import java.nio.file.Paths;
//import java.util.List;
//
//@Service
//public class LandmarkService {
//
//    private final ZooModel<Image, Classifications> model;
//
//    public LandmarkService() throws IOException, ModelNotFoundException, MalformedModelException {
//        // Path to the SavedModel folder (contains saved_model.pb)
//        String modelDir = "src/main/resources/models/my_landmark_model";
//
//        // Labels file
//        List<String> labels = Files.readAllLines(Paths.get("src/main/resources/models/labels.txt"));
//
//        Criteria<Image, Classifications> criteria = Criteria.builder()
//                .setTypes(Image.class, Classifications.class)
//                .optModelPath(Paths.get(modelDir)) // point to the folder, not a .pb file
//                .optTranslator(new LandmarkTranslator(labels))
//                .build();
//
//        model = criteria.loadModel();
//    }
//
//    public String detectLandmark(MultipartFile file) throws IOException, TranslateException {
//        Image img = ImageFactory.getInstance().fromInputStream(file.getInputStream());
//
//        try (Predictor<Image, Classifications> predictor = model.newPredictor()) {
//            Classifications result = predictor.predict(img);
//            return result.topK(3).toString(); // return top 3 guesses
//        }
//    }
//}
