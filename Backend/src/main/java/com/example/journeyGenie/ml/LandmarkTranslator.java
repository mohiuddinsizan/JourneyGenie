//package com.example.journeyGenie.ml;
//
//import ai.djl.modality.Classifications;
//import ai.djl.modality.cv.Image;
//import ai.djl.ndarray.NDArray;
//import ai.djl.ndarray.NDList;
//import ai.djl.ndarray.types.DataType;
//import ai.djl.translate.*;
//import ai.djl.modality.cv.util.NDImageUtils;
//
//import java.util.List;
//
//public class LandmarkTranslator implements Translator<Image, Classifications> {
//
//    private List<String> classes;
//
//    public LandmarkTranslator(List<String> classes) {
//        this.classes = classes;
//    }
//
//    @Override
//    public NDList processInput(TranslatorContext ctx, Image input) {
//        NDArray array = input.toNDArray(ctx.getNDManager());
//        array = NDImageUtils.resize(array, 224, 224); // resize properly
//        array = array.transpose(2, 0, 1).toType(DataType.FLOAT32, false).div(255f);
//        return new NDList(array);
//
//    }
//
//    @Override
//    public Classifications processOutput(TranslatorContext ctx, NDList list) {
//        return new Classifications(classes, list.singletonOrThrow());
//    }
//}
