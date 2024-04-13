import NaiveUI from 'naive-ui';

import GenerateMaterial from './common/GenerateMaterial-components.mjs';
async function main() {
  const NewNaiveUIModule = {}
  Object.keys(NaiveUI).forEach((key) => {
    if (String(key).startsWith("N")) {
      NewNaiveUIModule[key] = NaiveUI[key]
    }
  })
  const genMaterial = new GenerateMaterial({
    version: "2.38.1",
    Module: NewNaiveUIModule,
    framework: "Vue",
    script: "https://unpkg.com/naive-ui@2.38.1/dist/index.mjs",
    css: "",
    exportNamePrefix: "N",
    repo: "naive-ui",
  })
  genMaterial.add((data) => {
    // data.snippets = data.snippets.map((item) => {
    //   item.children = item.children.map((children_item) => {
    //     const changeProps = {}
    //     if (String(children_item.icon).startsWith("van-")) {
    //       changeProps.icon = children_item.icon.slice(4)
    //     }
    //     return {
    //       ...children_item,
    //       ...changeProps
    //     }
    //   }).filter(({ snippetName }) => {
    //     return String(snippetName).startsWith("van-")
    //   })
    //   return item
    // })
    data.components = data.components.map((item) => {
      return {
        ...item,
        component: `N${item.component}`
      }
    })
    return data;
  })
  // genMaterial.add((data) => {
  //   data.snippets = [
  //     {
  //       "group": "vant",
  //       "children": [
  //         {
  //           "name": {
  //             "zh_CN": "van-button"
  //           },
  //           "icon": "button",
  //           "screenshot": "",
  //           "snippetName": "VanButton",
  //           "schema": {
  //             "children": [
  //               {
  //                 "componentName": "Template",
  //                 "children": [
  //                   {
  //                     "componentName": "Text",
  //                     "props": {
  //                       "text": "van-button"
  //                     }
  //                   }
  //                 ],
  //                 "props": {
  //                   "slot": {
  //                     "name": "default"
  //                   }
  //                 }
  //               }
  //             ]
  //           }
  //         }
  //       ]
  //     }
  //   ]
  //   return data;
  // })
  genMaterial.start()
}

main()