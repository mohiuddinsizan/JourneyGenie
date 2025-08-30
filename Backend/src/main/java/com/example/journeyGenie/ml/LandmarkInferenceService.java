package com.example.journeyGenie.ml;

import ai.djl.modality.cv.Image;
import ai.djl.modality.cv.ImageFactory;
import ai.djl.modality.cv.util.NDImageUtils;
import ai.djl.ndarray.NDArray;
import ai.djl.ndarray.NDList;
import ai.djl.ndarray.NDManager;
import ai.djl.repository.zoo.Criteria;
import ai.djl.repository.zoo.ZooModel;
import ai.djl.translate.Translator;
import ai.djl.translate.TranslatorContext;
import com.example.journeyGenie.util.Debug;
import jakarta.annotation.PreDestroy;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.awt.image.BufferedImage;
import java.io.File;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Map;

import org.springframework.core.io.ClassPathResource;

@Service
public class LandmarkInferenceService {

    private final ZooModel<Image, float[]> model;

    public LandmarkInferenceService() {
        ZooModel<Image, float[]> tempModel = null;
        try {
            // Load model from resources (inside JAR)
            ClassPathResource resource = new ClassPathResource("models/landmark_resnet18_v2.onnx");

            // Create a temp file because DJL's Criteria.optModelPath() expects a Path
            File tempFile = File.createTempFile("landmark_resnet18", ".onnx");
            try (InputStream is = resource.getInputStream()) {
                Files.copy(is, tempFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
            }

            Path modelPath = tempFile.toPath();

            Criteria<Image, float[]> criteria = Criteria.builder()
                    .setTypes(Image.class, float[].class)
                    .optEngine("OnnxRuntime")
                    .optModelPath(modelPath)  // now points to a real file
                    .optTranslator(new PreprocessTranslator(
                            224, 224,
                            new float[]{0.485f, 0.456f, 0.406f},
                            new float[]{0.229f, 0.224f, 0.225f},
                            true))
                    .build();

            tempModel = criteria.loadModel();
        } catch (Exception e) {
            System.err.println("Error loading model: " + e.getMessage());
            e.printStackTrace();
        }
        this.model = tempModel;
    }

    @PreDestroy
    public void close() {
        if (model != null) {
            model.close();
        }
    }

    /**
     * Predict landmark and send standardized JSON response
     */
    public ResponseEntity<?> predict(HttpServletRequest request, BufferedImage buffered, LandmarkMapping mapping) {
        if (model == null) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Model is not loaded"));
        }

        Debug.log("Model loaded successfully, starting prediction...");

        try {
            Image img = ImageFactory.getInstance().fromImage(buffered);
            Debug.log("Image converted to DJL format, running prediction...");

            try (var predictor = model.newPredictor()) {
                float[] probs = predictor.predict(img);

                Debug.log("Prediction completed, processing results...");
                int idx = argmax(probs);
                String fullLink = mapping.getCategory(idx);

                Debug.log("Predicted index: " + idx);
                Debug.log("Predicted category: " + fullLink);

                // Extract location name after "Category:"
                String location = fullLink.contains("Category:") ?
                        fullLink.substring(fullLink.indexOf("Category:") + 9) :
                        fullLink;

                return ResponseEntity.ok(Map.of(
                        "location", location,
                        "link", fullLink
                ));
            }

        } catch (Exception e) {
            System.err.println("Error during prediction: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    private static int argmax(float[] a) {
        int best = 0;
        float bestVal = Float.NEGATIVE_INFINITY;
        for (int i = 0; i < a.length; i++) {
            if (a[i] > bestVal) {
                bestVal = a[i];
                best = i;
            }
        }
        return best;
    }

    /** Minimal translator: Image -> float[] probabilities */
    static class PreprocessTranslator implements Translator<Image, float[]> {
        private final int width, height;
        private final float[] mean, std;
        private final boolean applySoftmax;

        PreprocessTranslator(int width, int height, float[] mean, float[] std, boolean applySoftmax) {
            this.width = width;
            this.height = height;
            this.mean = mean;
            this.std = std;
            this.applySoftmax = applySoftmax;
        }

        @Override
        public NDList processInput(TranslatorContext ctx, Image input) {
            NDManager manager = ctx.getNDManager();
            NDArray array = input.toNDArray(manager, Image.Flag.COLOR);
            array = NDImageUtils.resize(array, width, height);
            array = NDImageUtils.toTensor(array);   // returns (1, 3, H, W)
            array = NDImageUtils.normalize(array, mean, std);
            Debug.log("Final input shape: " + array.getShape());
            return new NDList(array);
        }

        @Override
        public float[] processOutput(TranslatorContext ctx, NDList list) {
            NDArray out = list.singletonOrThrow();
            if (out.getShape().dimension() == 2 && out.getShape().get(0) == 1) {
                out = out.squeeze(0);
            }
            if (applySoftmax) {
                out = out.softmax(0);
            }
            return out.toFloatArray();
        }
    }
}








//package com.example.journeyGenie.ml;
//
//import ai.djl.modality.cv.Image;
//import ai.djl.modality.cv.ImageFactory;
//import ai.djl.modality.cv.util.NDImageUtils;
//import ai.djl.ndarray.NDArray;
//import ai.djl.ndarray.NDList;
//import ai.djl.ndarray.NDManager;
//import ai.djl.repository.zoo.Criteria;
//import ai.djl.repository.zoo.ZooModel;
//import ai.djl.translate.Translator;
//import ai.djl.translate.TranslatorContext;
//import com.example.journeyGenie.util.Debug;
//import com.fasterxml.jackson.databind.JsonNode;
//import com.fasterxml.jackson.databind.ObjectMapper;
//import jakarta.annotation.PostConstruct;
//import jakarta.annotation.PreDestroy;
//import jakarta.servlet.http.HttpServletRequest;
//import org.springframework.http.HttpStatus;
//import org.springframework.http.ResponseEntity;
//import org.springframework.stereotype.Service;
//
//import java.awt.image.BufferedImage;
//import java.io.File;
//import java.io.InputStream;
//import java.nio.file.Files;
//import java.nio.file.Path;
//import java.nio.file.StandardCopyOption;
//import java.util.Arrays;
//import java.util.HashMap;
//import java.util.Map;
//
//import org.springframework.core.io.ClassPathResource;
//
//@Service
//public class LandmarkInferenceService {
//
//    private ZooModel<Image, float[]> model;
//    private ModelConfig modelConfig;
//    private File tempModelFile;
//
//    // Model configuration loaded from export info
//    private static class ModelConfig {
//        public int imgSize = 224;
//        public int numClasses = -1; // Will be detected
//        public String inputName = "input";
//        public String outputName = "output";
//        public String modelArchitecture = "unknown";
//
//        // Default preprocessing values (ImageNet standards)
//        public float[] mean = new float[]{0.485f, 0.456f, 0.406f};
//        public float[] std = new float[]{0.229f, 0.224f, 0.225f};
//    }
//
//    @PostConstruct
//    public void initializeModel() {
//        try {
//            // Load model configuration if available
//            loadModelConfig();
//
//            // Load the ONNX model
//            loadModel();
//
//            Debug.log("LandmarkInferenceService initialized successfully");
//            Debug.log("Model architecture: " + modelConfig.modelArchitecture);
//            Debug.log("Image size: " + modelConfig.imgSize);
//            Debug.log("Number of classes: " + modelConfig.numClasses);
//
//        } catch (Exception e) {
//            System.err.println("Failed to initialize LandmarkInferenceService: " + e.getMessage());
//            e.printStackTrace();
//        }
//    }
//
//    private void loadModelConfig() {
//        modelConfig = new ModelConfig();
//
//        try {
//            // Try to load export_info.json from resources
//            ClassPathResource configResource = new ClassPathResource("models/export_info.json");
//            if (configResource.exists()) {
//                ObjectMapper mapper = new ObjectMapper();
//                try (InputStream is = configResource.getInputStream()) {
//                    JsonNode config = mapper.readTree(is);
//
//                    if (config.has("img_size")) {
//                        modelConfig.imgSize = config.get("img_size").asInt();
//                    }
//                    if (config.has("num_classes")) {
//                        modelConfig.numClasses = config.get("num_classes").asInt();
//                    }
//                    if (config.has("model_architecture")) {
//                        modelConfig.modelArchitecture = config.get("model_architecture").asText();
//                    }
//
//                    Debug.log("Model configuration loaded from export_info.json");
//                }
//            } else {
//                Debug.log("export_info.json not found, using default configuration");
//            }
//        } catch (Exception e) {
//            Debug.log("Could not load model config, using defaults: " + e.getMessage());
//        }
//    }
//
//    private void loadModel() throws Exception {
//        // Load model from resources (inside JAR)
//        ClassPathResource resource = new ClassPathResource("models/landmark_resnet18.onnx");
//
//        if (!resource.exists()) {
//            throw new RuntimeException("Model file not found in resources/models/landmark_resnet18.onnx");
//        }
//
//        // Create a temp file because DJL's Criteria.optModelPath() expects a Path
//        tempModelFile = File.createTempFile("landmark_model", ".onnx");
//        tempModelFile.deleteOnExit(); // Ensure cleanup on JVM exit
//
//        try (InputStream is = resource.getInputStream()) {
//            Files.copy(is, tempModelFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
//        }
//
//        Path modelPath = tempModelFile.toPath();
//
//        // Create criteria with dynamic configuration
//        Criteria<Image, float[]> criteria = Criteria.builder()
//                .setTypes(Image.class, float[].class)
//                .optEngine("OnnxRuntime")
//                .optModelPath(modelPath)
//                .optTranslator(new EnhancedPreprocessTranslator(
//                        modelConfig.imgSize,
//                        modelConfig.imgSize,
//                        modelConfig.mean,
//                        modelConfig.std,
//                        true)) // Apply softmax for probability output
//                .build();
//
//        model = criteria.loadModel();
//
//        // Test the model to detect number of classes if not known
//        if (modelConfig.numClasses <= 0) {
//            detectNumClasses();
//        }
//    }
//
//    private void detectNumClasses() {
//        try {
//            Debug.log("Detecting number of classes from model output...");
//
//            // Create a dummy image for testing
//            BufferedImage dummyImg = new BufferedImage(modelConfig.imgSize, modelConfig.imgSize, BufferedImage.TYPE_INT_RGB);
//            Image testImg = ImageFactory.getInstance().fromImage(dummyImg);
//
//            try (var predictor = model.newPredictor()) {
//                float[] output = predictor.predict(testImg);
//                modelConfig.numClasses = output.length;
//                Debug.log("Detected " + modelConfig.numClasses + " classes from model output");
//            }
//        } catch (Exception e) {
//            Debug.log("Could not detect number of classes: " + e.getMessage());
//            modelConfig.numClasses = 3103; // Fallback to original value
//        }
//    }
//
//    @PreDestroy
//    public void close() {
//        if (model != null) {
//            model.close();
//        }
//
//        // Clean up temp file
//        if (tempModelFile != null && tempModelFile.exists()) {
//            try {
//                Files.deleteIfExists(tempModelFile.toPath());
//                Debug.log("Cleaned up temporary model file");
//            } catch (Exception e) {
//                Debug.log("Could not clean up temp file: " + e.getMessage());
//            }
//        }
//    }
//
//    /**
//     * Predict landmark and send standardized JSON response
//     * Enhanced with confidence scores and top-k predictions
//     */
//    public ResponseEntity<?> predict(HttpServletRequest request, BufferedImage buffered, LandmarkMapping mapping) {
//        if (model == null) {
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                    .body(Map.of("error", "Model is not loaded"));
//        }
//
//        Debug.log("Model loaded successfully, starting prediction...");
//        Debug.log("Input image size: " + buffered.getWidth() + "x" + buffered.getHeight());
//
//        try {
//            Image img = ImageFactory.getInstance().fromImage(buffered);
//            Debug.log("Image converted to DJL format, running prediction...");
//
//            try (var predictor = model.newPredictor()) {
//                float[] probs = predictor.predict(img);
//                Debug.log("Prediction completed, processing results...");
//                Debug.log("Output probabilities length: " + probs.length);
//
//                // Get top prediction
//                int topIdx = argmax(probs);
//                float topConfidence = probs[topIdx];
//
//                Debug.log("Predicted index: " + topIdx);
//                Debug.log("Confidence: " + topConfidence);
//
//                // Get top-3 predictions for better user experience
//                int[] topIndices = getTopK(probs, 3);
//
//                // Get prediction result
//                String fullLink = mapping.getCategory(topIdx);
//                Debug.log("Predicted category: " + fullLink);
//
//                // Extract location name after "Category:"
//                String location = fullLink.contains("Category:") ?
//                        fullLink.substring(fullLink.indexOf("Category:") + 9).trim() :
//                        fullLink;
//
//                // Build response with enhanced information
//                Map<String, Object> response = new HashMap<>();
//                response.put("location", location);
//                response.put("link", fullLink);
//                response.put("confidence", Math.round(topConfidence * 10000.0) / 100.0); // Round to 2 decimal places
//                response.put("predicted_class_id", topIdx);
//
//                // Add top-3 predictions if confidence is low
//                if (topConfidence < 0.8) {
//                    Map<String, Object>[] alternatives = new Map[Math.min(3, topIndices.length)];
//                    for (int i = 0; i < alternatives.length && i < topIndices.length; i++) {
//                        int idx = topIndices[i];
//                        String altLocation = mapping.getCategory(idx);
//                        if (altLocation.contains("Category:")) {
//                            altLocation = altLocation.substring(altLocation.indexOf("Category:") + 9).trim();
//                        }
//
//                        alternatives[i] = Map.of(
//                                "location", altLocation,
//                                "confidence", Math.round(probs[idx] * 10000.0) / 100.0,
//                                "class_id", idx
//                        );
//                    }
//                    response.put("alternatives", alternatives);
//                }
//
//                // Add model info for debugging
//                response.put("model_info", Map.of(
//                        "architecture", modelConfig.modelArchitecture,
//                        "total_classes", modelConfig.numClasses,
//                        "image_size", modelConfig.imgSize
//                ));
//
//                return ResponseEntity.ok(response);
//            }
//
//        } catch (Exception e) {
//            System.err.println("Error during prediction: " + e.getMessage());
//            e.printStackTrace();
//
//            Map<String, Object> errorResponse = new HashMap<>();
//            errorResponse.put("error", e.getMessage());
//            errorResponse.put("model_info", Map.of(
//                    "architecture", modelConfig.modelArchitecture,
//                    "loaded", model != null
//            ));
//
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                    .body(errorResponse);
//        }
//    }
//
//    private static int argmax(float[] a) {
//        int best = 0;
//        float bestVal = Float.NEGATIVE_INFINITY;
//        for (int i = 0; i < a.length; i++) {
//            if (a[i] > bestVal) {
//                bestVal = a[i];
//                best = i;
//            }
//        }
//        return best;
//    }
//
//    /**
//     * Get top-k indices sorted by probability (highest first)
//     */
//    private static int[] getTopK(float[] probs, int k) {
//        k = Math.min(k, probs.length);
//
//        // Create array of indices
//        Integer[] indices = new Integer[probs.length];
//        for (int i = 0; i < probs.length; i++) {
//            indices[i] = i;
//        }
//
//        // Sort by probability (descending)
//        Arrays.sort(indices, (i, j) -> Float.compare(probs[j], probs[i]));
//
//        // Return top-k as int array
//        int[] result = new int[k];
//        for (int i = 0; i < k; i++) {
//            result[i] = indices[i];
//        }
//
//        return result;
//    }
//
//    /**
//     * Enhanced translator with better error handling and logging
//     * Image -> float[] probabilities
//     */
//    static class EnhancedPreprocessTranslator implements Translator<Image, float[]> {
//        private final int width, height;
//        private final float[] mean, std;
//        private final boolean applySoftmax;
//
//        EnhancedPreprocessTranslator(int width, int height, float[] mean, float[] std, boolean applySoftmax) {
//            this.width = width;
//            this.height = height;
//            this.mean = mean;
//            this.std = std;
//            this.applySoftmax = applySoftmax;
//        }
//
//        @Override
//        public NDList processInput(TranslatorContext ctx, Image input) {
//            NDManager manager = ctx.getNDManager();
//
//            try {
//                NDArray array = input.toNDArray(manager, Image.Flag.COLOR);
//                Debug.log("Original image shape: " + array.getShape());
//
//                // Resize to model input size
//                array = NDImageUtils.resize(array, width, height);
//                Debug.log("After resize shape: " + array.getShape());
//
//                // Convert to tensor format (HWC -> CHW and normalize to [0,1])
//                array = NDImageUtils.toTensor(array);
//                Debug.log("After toTensor shape: " + array.getShape());
//
//                // Apply ImageNet normalization
//                array = NDImageUtils.normalize(array, mean, std);
//                Debug.log("Final input shape: " + array.getShape());
//
//                return new NDList(array);
//
//            } catch (Exception e) {
//                Debug.log("Error in input processing: " + e.getMessage());
//                throw new RuntimeException("Failed to preprocess input image", e);
//            }
//        }
//
//        @Override
//        public float[] processOutput(TranslatorContext ctx, NDList list) {
//            try {
//                NDArray out = list.singletonOrThrow();
//                Debug.log("Raw output shape: " + out.getShape());
//
//                // Handle batch dimension if present
//                if (out.getShape().dimension() == 2 && out.getShape().get(0) == 1) {
//                    out = out.squeeze(0);
//                    Debug.log("After squeeze shape: " + out.getShape());
//                }
//
//                // Apply softmax to get probabilities
//                if (applySoftmax) {
//                    out = out.softmax(0);
//                    Debug.log("Applied softmax for probability output");
//                }
//
//                float[] result = out.toFloatArray();
//                Debug.log("Output array length: " + result.length);
//
//                // Basic validation
//                if (result.length == 0) {
//                    throw new RuntimeException("Model output is empty");
//                }
//
//                return result;
//
//            } catch (Exception e) {
//                Debug.log("Error in output processing: " + e.getMessage());
//                throw new RuntimeException("Failed to process model output", e);
//            }
//        }
//    }
//}