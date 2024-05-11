import fs from "node:fs";
import url from "node:url";
import path from "node:path";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const {
  data: {
    materials: { components, snippets },
  },
} = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "./bundle.json"), "utf8")
);

const whitelist = [
  "TinyCollapse",
  "TinyDialogBox",
  "Img",
  "TinyBreadcrumb",
  "TinyButton",
  "TinyCarousel",
  "TinyCheckbox",
  "table",
  "TinyInput",
  "TinyRadio",
  "TinySelect",
  "TinySwitch",
  "TinyGrid",
  "TinyTabs",
  "TinyTree",
  "TinyPager",
  "TinyRow",
  "TinyTimeLine"
];
const results = {};

for (const v of components) {
  if (whitelist.includes(v.component) && !results[v.component]) {
    let snippet;
    for (const subS of snippets) {
      for (const s of subS.children) {
        if (s.snippetName.toLowerCase() === v.component.toLowerCase()) {
          snippet = s;
        }
      }
    }
    results[v.component] = {
      schema: v.schema,
      snippet,
    };
  }
}

const schemaPromptHeader = fs.readFileSync(
  path.resolve(__dirname, "./schema.system.base.md"),
  "utf8"
);
await fs.writeFileSync(
  path.resolve(__dirname, "../src/prompts/schema.system.md"),
  schemaPromptHeader +
  Object.keys(results)
    .map((key) => {
      const { snippet } = results[key];
      return `
### 组件 ${key}

使用适例:

\`\`\`json
${JSON.stringify(snippet.schema, null, 2)}
\`\`\`
`;
    })
    .join("")
);

// console.log(whitelist.length, Object.keys(results).length)
