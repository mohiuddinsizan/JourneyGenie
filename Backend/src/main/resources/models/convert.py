import tf2onnx
import tensorflow as tf

# Load your TensorFlow model (might need the original SavedModel)
model = tf.saved_model.load("path_to_saved_model")
spec = (tf.TensorSpec((None, 224, 224, 3), tf.float32, name="input"),)
output_path = "classifier-asia-v1.onnx"

import tf2onnx
model_proto, _ = tf2onnx.convert.from_function(model, input_signature=spec, opset=13)
with open(output_path, "wb") as f:
    f.write(model_proto.SerializeToString())
