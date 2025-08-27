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
import java.nio.file.Path;
import java.util.Map;

import org.springframework.core.io.ClassPathResource;

@Service
public class LandmarkInferenceService {

    private final ZooModel<Image, float[]> model;

    public LandmarkInferenceService() {
        ZooModel<Image, float[]> tempModel = null;
        try {
            // Load ONNX model from classpath
            File modelFile = new ClassPathResource("models/landmark_resnet18.onnx").getFile();
            Path modelPath = modelFile.toPath();

            Criteria<Image, float[]> criteria = Criteria.builder()
                    .setTypes(Image.class, float[].class)
                    .optEngine("OnnxRuntime") // explicit engine for .onnx
                    .optModelPath(modelPath)
                    .optTranslator(new PreprocessTranslator(224, 224,
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
