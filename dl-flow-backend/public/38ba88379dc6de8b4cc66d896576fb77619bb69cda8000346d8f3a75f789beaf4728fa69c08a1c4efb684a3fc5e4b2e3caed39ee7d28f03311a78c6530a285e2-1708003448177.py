import paddle
from paddle import *
true = True
false = False
node445943b3dcc4443c99a04efcf871ecb9 = paddle.nn.Conv1D(in_channels = 255,out_channels = 255,kernal_size = 3,stride = 1,padding_mode = 'zeros',weight_attr = ParamAttr(learning_rate = 1,regularizer = 'L1Decay',trainable = true,do_model_average = true,need_clip = true),bias_attr = ParamAttr(learning_rate = 1,regularizer = 'L1Decay',trainable = true,do_model_average = true,need_clip = true))
node0e4fe0e59fe64ea988c16fd2250fd36e = paddle.nn.Conv1D(in_channels = 255,out_channels = 255,kernal_size = 3,stride = 1,padding_mode = 'zeros',weight_attr = ParamAttr(learning_rate = 1,regularizer = 'L1Decay',trainable = true,do_model_average = true,need_clip = true),bias_attr = ParamAttr(learning_rate = 1,regularizer = 'L1Decay',trainable = true,do_model_average = true,need_clip = true))