import { genSFCWithDefaultPlugin } from '@opentiny/tiny-engine-dsl-vue'

const dslSchema = {
  "state": {
    "dataDisk": [
      1,
      2,
      3
    ]
  },
  "methods": {},
  "componentName": "Page",
  "css": "body {\r\n  background-color:#eef0f5 ;\r\n  margin-bottom: 80px;\r\n}",
  "props": {},
  "children": [
    {
      "componentName": "div",
      "props": {
        "style": "border-width: 1px; border-style: solid; border-radius: 4px; border-color: #fff; padding-top: 10px; padding-bottom: 10px; padding-left: 10px; padding-right: 10px; box-shadow: rgba(0, 0, 0, 0.1) 0px 1px 3px 0px; background-color: #fff; margin-bottom: 10px;"
      },
      "id": "30c94cc8",
      "children": [
        {
          "componentName": "TinyForm",
          "props": {
            "labelWidth": "80px",
            "labelPosition": "top",
            "inline": false,
            "label-position": "left ",
            "label-width": "150px",
            "style": "border-radius: 0px;"
          },
          "children": [
            {
              "componentName": "TinyFormItem",
              "props": {
                "label": "计费模式"
              },
              "children": [
                {
                  "componentName": "TinyButtonGroup",
                  "props": {
                    "data": [
                      {
                        "text": "包年/包月",
                        "value": "1"
                      },
                      {
                        "text": "按需计费",
                        "value": "2"
                      }
                    ],
                    "modelValue": "1"
                  },
                  "id": "a8d84361"
                }
              ],
              "id": "9f39f3e7"
            },
            {
              "componentName": "TinyFormItem",
              "props": {
                "label": "区域"
              },
              "children": [
                {
                  "componentName": "TinyButtonGroup",
                  "props": {
                    "data": [
                      {
                        "text": "乌兰察布二零一",
                        "value": "1"
                      }
                    ],
                    "modelValue": "1",
                    "style": "border-radius: 0px; margin-right: 10px;"
                  },
                  "id": "c97ccd99"
                },
                {
                  "componentName": "Text",
                  "props": {
                    "text": "温馨提示：页面左上角切换区域",
                    "style": "background-color: [object Event]; color: #8a8e99; font-size: 12px;"
                  },
                  "id": "20923497"
                },
                {
                  "componentName": "Text",
                  "props": {
                    "text": "不同区域的云服务产品之间内网互不相通；请就近选择靠近您业务的区域，可减少网络时延，提高访问速度",
                    "style": "display: block; color: #8a8e99; border-radius: 0px; font-size: 12px;"
                  },
                  "id": "54780a26"
                }
              ],
              "id": "4966384d"
            },
            {
              "componentName": "TinyFormItem",
              "props": {
                "label": "可用区",
                "style": "border-radius: 0px;"
              },
              "children": [
                {
                  "componentName": "TinyButtonGroup",
                  "props": {
                    "data": [
                      {
                        "text": "可用区1",
                        "value": "1"
                      },
                      {
                        "text": "可用区2",
                        "value": "2"
                      },
                      {
                        "text": "可用区3",
                        "value": "3"
                      }
                    ],
                    "modelValue": "1"
                  },
                  "id": "6184481b"
                }
              ],
              "id": "690837bf"
            }
          ],
          "id": "b6a425d4"
        }
      ]
    }
  ],
  "fileName": "CreateVM",
  "id": "body"
}

const componentsMap = []

const result = genSFCWithDefaultPlugin(dslSchema, componentsMap, {
  blockRelativePath: './'
})

console.log(result)  // Vue代码字符串（未格式化），可以直接粘贴到.vue文件中
