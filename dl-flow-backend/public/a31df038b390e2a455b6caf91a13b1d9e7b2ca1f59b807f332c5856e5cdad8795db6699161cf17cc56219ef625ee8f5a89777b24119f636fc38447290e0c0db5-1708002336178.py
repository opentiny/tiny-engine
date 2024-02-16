import paddle
from paddle import *
true = True
false = False
node55ebf806306f43599c6aec33f8daf1ab = paddle.nn.Conv1D(in_channels = 255,out_channels = 255,kernal_size = 3,stride = 1,padding_mode = 'zeros',weight_attr = ParamAttr(learning_rate = 1,regularizer = 'L1Decay',trainable = true,do_model_average = true,need_clip = true),bias_attr = ParamAttr(learning_rate = 1,regularizer = 'L1Decay',trainable = true,do_model_average = true,need_clip = true))
nodea98e3e38a79147b8adb895ca7b992a70 = paddle.nn.Conv1D(in_channels = 255,out_channels = 255,kernal_size = 3,stride = 1,padding_mode = 'zeros',weight_attr = ParamAttr(learning_rate = 1,regularizer = 'L1Decay',trainable = true,do_model_average = true,need_clip = true),bias_attr = ParamAttr(learning_rate = 1,regularizer = 'L1Decay',trainable = true,do_model_average = true,need_clip = true))