import paddle
from paddle import *
true = True
false = False
nodebd3ea921e76c4f09855fc65a50c02413 = paddle.nn.Conv1D(in_channels = 255,out_channels = 255,kernal_size = 3,stride = 1,padding_mode = 'zeros',weight_attr = ParamAttr(learning_rate = 1,regularizer = 'L1Decay',trainable = true,do_model_average = true,need_clip = true),bias_attr = ParamAttr(learning_rate = 1,regularizer = 'L1Decay',trainable = true,do_model_average = true,need_clip = true))
node9415acf5bb5144cebce9aa6b54a58d59 = paddle.nn.AdaptiveAvgPool1D()
node4efb497dd9f9473189ace9dcd5e73cad = paddle.nn.ReLU()