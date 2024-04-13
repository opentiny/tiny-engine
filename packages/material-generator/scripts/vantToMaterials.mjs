import VantUI from 'vant';

import GenerateMaterial from './common/GenerateMaterial-components.mjs';
async function main() {
  const genMaterial = new GenerateMaterial({
    version: "4.8.10",
    Module: VantUI,
    framework: "Vue",
    script: "https://unpkg.com/vant@4.8.10/es/index.mjs",
    css: "https://unpkg.com/vant@4.8.10/lib/index.css",
    exportNamePrefix: "Van",
    repo: "vant",
  })
  genMaterial.add((data) => {
    data.snippets = data.snippets.map((item) => {
      item.children = item.children.map((children_item) => {
        const changeProps = {}
        if (String(children_item.icon).startsWith("van-")) {
          changeProps.icon = children_item.icon.slice(4)
        }
        return {
          ...children_item,
          ...changeProps
        }
      }).filter(({ snippetName }) => {
        return String(snippetName).startsWith("van-")
      })
      return item
    })
    return data;
  })
  genMaterial.add((data) => {
    data.snippets = [
      {
        "group": "vant",
        "children": [
          {
            "name": {
              "zh_CN": "van-button"
            },
            "icon": "button",
            "screenshot": "",
            "snippetName": "VanButton",
            "schema": {
              "children": [
                {
                  "componentName": "Template",
                  "children": [
                    {
                      "componentName": "Text",
                      "props": {
                        "text": "van-button"
                      }
                    }
                  ],
                  "props": {
                    "slot": {
                      "name": "default"
                    }
                  }
                }
              ]
            }
          }
        ]
      }
    ]
    return data;
  })
  genMaterial.start()
}

main()