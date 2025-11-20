import { parse as ee } from "@vue/compiler-sfc";
import { parse as re } from "@vue/compiler-dom";
import { parse as $t } from "@babel/parser";
import Wt from "@babel/traverse";
import * as G from "@babel/types";
const it = {};
function Ht(b) {
  const { descriptor: h, errors: e } = ee(b);
  e && e.length > 0 && console.warn("SFC parsing warnings:", e);
  const a = {};
  return h.template && (a.template = h.template.content, a.templateLang = h.template.lang || "html"), h.scriptSetup && (a.scriptSetup = h.scriptSetup.content, a.scriptSetupLang = h.scriptSetup.lang || "js"), h.script && (a.script = h.script.content, a.scriptLang = h.script.lang || "js"), h.styles && h.styles.length > 0 && (a.style = h.styles.map((c) => c.content).join(`

`), a.styleBlocks = h.styles.map((c) => ({
    content: c.content,
    lang: c.lang || "css",
    scoped: c.scoped || !1,
    module: c.module || !1
  }))), h.customBlocks && h.customBlocks.length > 0 && (a.customBlocks = h.customBlocks.map((c) => ({
    type: c.type,
    content: c.content,
    attrs: c.attrs
  }))), a;
}
async function $e(b) {
  const h = await it.readFile(b, "utf-8");
  return Ht(h);
}
function Ct(b) {
  const h = String(b || "").trim();
  return !h || h.startsWith("this.") ? h : /^[A-Za-z_$]/.test(h) && !/^(function|async|new)\b/.test(h) ? `this.${h}` : h;
}
function Bt(b) {
  return b.split(/[-_\s]+/).filter(Boolean).map((h) => h.charAt(0).toUpperCase() + h.slice(1)).join("");
}
function ne(b, h) {
  if (h.componentMap && h.componentMap[b]) return h.componentMap[b];
  const e = b.toLowerCase();
  if (e.startsWith("tiny-")) {
    const c = e.replace(/^tiny-/, "");
    return `Tiny${Bt(c)}`;
  }
  return [
    "div",
    "span",
    "p",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ul",
    "ol",
    "li",
    "a",
    "img",
    "button",
    "input",
    "form",
    "table",
    "tr",
    "td",
    "th",
    "thead",
    "tbody",
    "section",
    "article",
    "header",
    "footer",
    "nav",
    "aside",
    "main"
  ].includes(e) ? e : Bt(b);
}
function ie(b, h) {
  const e = {};
  return b.forEach((a) => {
    if (a.type === 6) {
      const c = a.name === "class" ? "className" : a.name;
      e[c] = a.value ? a.value.content : !0;
    }
  }), e;
}
function Pt(b) {
  var e;
  const h = { __UNSUPPORTED__: !0 };
  if (!b) return h;
  switch (b.type) {
    case "StringLiteral":
    case "NumericLiteral":
    case "BooleanLiteral":
      return b.value;
    case "NullLiteral":
      return null;
    case "TemplateLiteral":
      return (((e = b.expressions) == null ? void 0 : e.length) ?? 0) === 0 ? b.quasis.map((a) => a.value.cooked).join("") : h;
    case "ArrayExpression": {
      const a = [];
      for (const c of b.elements) {
        if (!c) return h;
        const n = Pt(c);
        if (n != null && n.__UNSUPPORTED__) return h;
        a.push(n);
      }
      return a;
    }
    case "ObjectExpression": {
      const a = {};
      for (const c of b.properties) {
        if (c.type !== "ObjectProperty" || c.computed) return h;
        const n = c.key.type === "Identifier" ? c.key.name : c.key.type === "StringLiteral" ? c.key.value : c.key.type === "NumericLiteral" ? String(c.key.value) : null;
        if (n === null) return h;
        const o = Pt(c.value);
        if (o != null && o.__UNSUPPORTED__) return h;
        a[n] = o;
      }
      return a;
    }
    default:
      return h;
  }
}
function se(b) {
  var a, c, n;
  const h = (b || "").trim();
  if (h === "true") return { ok: !0, value: !0 };
  if (h === "false") return { ok: !0, value: !1 };
  if (/^-?\d+(?:\.\d+)?$/.test(h)) return { ok: !0, value: Number(h) };
  if (!(h.startsWith("[") && h.endsWith("]") || h.startsWith("{") && h.endsWith("}"))) return { ok: !1 };
  try {
    const s = (n = (c = (a = $t(`(${h})`, { sourceType: "module", plugins: ["typescript", "jsx"] }).program) == null ? void 0 : a.body) == null ? void 0 : c[0]) == null ? void 0 : n.expression, d = Pt(s);
    return d && d.__UNSUPPORTED__ ? { ok: !1 } : { ok: !0, value: d };
  } catch {
    return { ok: !1 };
  }
}
function ae(b, h, e) {
  b.props && b.props.forEach((a) => {
    if (a.type !== 7) return;
    const c = a.name;
    switch (c) {
      case "if":
        h.condition = a.exp ? a.exp.content : "true";
        break;
      case "for":
        if (a.exp) {
          const n = a.exp.content || "", o = n.match(/^[^]*?(?:\)|\S)\s+(?:in|of)\s+([^]+)$/) || n.match(/^(?:[^]+?)\s+(?:in|of)\s+([^]+)$/), s = (o ? o[1] : n).trim();
          h.loop = { type: "JSExpression", value: Ct(s) };
        }
        break;
      case "show":
        h.props["v-show"] = a.exp ? a.exp.content : "true";
        break;
      case "model":
        h.props.modelValue = {
          type: "JSExpression",
          value: Ct(String(a.exp.content)),
          model: !0
        };
        break;
      case "on": {
        const n = a.arg ? a.arg.content : "click", o = `on${Bt(n)}`, s = a.exp ? String(a.exp.content || "") : "";
        h.props[o] = { type: "JSExpression", value: Ct(s) };
        break;
      }
      case "bind": {
        let n = a.arg ? a.arg.content : "value";
        if (n === "class" && (n = "className"), a.exp && a.exp.content !== null) {
          const o = String(a.exp.content), s = se(o);
          s.ok ? h.props[`${n}`] = s.value : h.props[`${n}`] = { type: "JSExpression", value: Ct(o) };
        } else
          h.props[`${n}`] = "";
        break;
      }
      case "slot": {
        const n = a.arg ? a.arg.content : "default";
        h.slot = n;
        break;
      }
      default:
        h.props[`v-${c}`] = a.exp ? a.exp.content : "true";
    }
  });
}
function oe(b, h) {
  return !b.content || !b.content.trim() ? null : { componentName: "Text", props: { text: b.content.trim() } };
}
function ce(b, h) {
  return {
    componentName: "Text",
    props: {
      text: {
        type: "JSExpression",
        value: Ct(b.content ? b.content.content : "")
      }
    }
  };
}
function ue(b, h) {
  const e = typeof h.tag == "string" ? h.tag.toLowerCase() : "";
  if (!e.startsWith("tiny-icon-")) return;
  const a = (s) => s.split(/[-_\s]+/).filter(Boolean).map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(""), c = e.replace(/^tiny-icon-/, ""), n = `Icon${a(c)}`, o = b.props && typeof b.props.style == "string" ? b.props.style : void 0;
  b.componentName = "Icon", b.props = {}, o && (b.props.style = o), b.props.name = n;
}
function Gt(b, h) {
  if (b.type !== 1) return null;
  const e = { componentName: ne(b.tag, h), props: {}, children: [] };
  return b.props && b.props.length > 0 && (e.props = ie(b.props)), ae(b, e), ue(e, b), b.children && b.children.length > 0 && (e.children = b.children.map((a) => a.type === 1 ? Gt(a, h) : a.type === 2 ? oe(a) : a.type === 5 ? ce(a) : null).filter(Boolean)), e;
}
function le(b, h = {}) {
  const e = re(b);
  return !e || !e.children ? [] : e.children.filter((a) => a.type === 1).map((a) => Gt(a, h)).filter(Boolean);
}
var Zt;
const jt = ((Zt = Wt) == null ? void 0 : Zt.default) ?? Wt, fe = [
  "onMounted",
  "onUpdated",
  "onUnmounted",
  "onBeforeMount",
  "onBeforeUpdate",
  "onBeforeUnmount",
  "onActivated",
  "onDeactivated",
  "mounted",
  "updated",
  "unmounted",
  "beforeMount",
  "beforeUpdate",
  "beforeUnmount",
  "activated",
  "deactivated",
  "created",
  "beforeCreate",
  "destroyed",
  "beforeDestroy",
  "setup"
];
function Rt(b, h) {
  if (!G.isCallExpression(b)) return !1;
  if (G.isIdentifier(b.callee) && b.callee.name === h) return !0;
  if (G.isMemberExpression(b.callee)) {
    const a = b.callee.property;
    if (G.isIdentifier(a) && a.name === h) return !0;
  }
  return !1;
}
function It(b) {
  return fe.includes(b);
}
function kt(b) {
  if (G.isStringLiteral(b) || G.isNumericLiteral(b) || G.isBooleanLiteral(b)) return b.value;
  if (G.isNullLiteral(b)) return null;
  if (G.isUnaryExpression(b) && b.operator === "-" && G.isNumericLiteral(b.argument))
    return -b.argument.value;
  if (G.isCallExpression(b)) {
    let h = "";
    if (G.isIdentifier(b.callee))
      h = b.callee.name;
    else if (G.isMemberExpression(b.callee)) {
      const a = b.callee.object, c = b.callee.property, n = G.isIdentifier(a) ? a.name : "", o = G.isIdentifier(c) ? c.name : "";
      n && o && (h = `${n}.${o}`);
    }
    const e = b.arguments.map((a) => kt(a));
    return h ? `${h}(${e.map((a) => typeof a == "string" ? `'${a}'` : String(a)).join(", ")})` : "undefined";
  }
  if (G.isObjectExpression(b)) {
    const h = {};
    return b.properties.forEach((e) => {
      if (G.isObjectProperty(e)) {
        let a = null;
        G.isIdentifier(e.key) ? a = e.key.name : G.isStringLiteral(e.key) ? a = e.key.value : G.isNumericLiteral(e.key) && (a = String(e.key.value)), a && (h[a] = kt(e.value));
      }
    }), h;
  }
  return G.isArrayExpression(b) ? b.elements.map((h) => h ? kt(h) : null) : "undefined";
}
function dt(b, h) {
  if (!b) return "";
  const e = b.start, a = b.end;
  return typeof e == "number" && typeof a == "number" ? h.slice(e, a) : "";
}
function bt(b, h, e) {
  const a = h.async ? "async " : "", c = h.params.map((o) => dt(o, e)).join(", ");
  if (G.isBlockStatement(h.body)) {
    const o = dt(h.body, e);
    return `${a}function ${b}(${c}) ${o}`;
  }
  const n = dt(h.body, e);
  return `${a}function ${b}(${c}) { return ${n}; }`;
}
function vt(b, h, e) {
  const a = h.async ? "async " : "", c = h.params.map((o) => dt(o, e)).join(", "), n = dt(h.body, e);
  return `${a}function ${b}(${c}) ${n}`;
}
const he = (b) => b === "setup";
function mt(b, h, e, a = {}) {
  a.noOverride && b.lifeCycles[h] || (b.lifeCycles[h] = { type: "lifecycle", value: e || (h ? `function ${h}(){}` : "function() {}") });
}
function de(b, h, e) {
  b.methods[h] = { type: "function", value: e || `function ${h}(){}` };
}
function wt(b, h, e) {
  he(h) ? mt(b, h, e) : de(b, h, e);
}
function pe(b, h, e, a) {
  if (G.isArrowFunctionExpression(h)) {
    const c = bt(b, h, a);
    return wt(e, b, c), !0;
  }
  if (G.isFunctionExpression(h)) {
    const c = dt(h, a);
    return wt(e, b, c), !0;
  }
  if (G.isCallExpression(h) && G.isIdentifier(h.callee) && h.callee.name === "wrap") {
    const c = h.arguments.find(
      (n) => G.isArrowFunctionExpression(n) || G.isFunctionExpression(n)
    );
    if (c) {
      if (G.isArrowFunctionExpression(c)) {
        const n = bt(b, c, a);
        return wt(e, b, n), !0;
      }
      if (G.isFunctionExpression(c)) {
        const n = vt(b, c, a);
        return wt(e, b, n), !0;
      }
    }
  }
  return !1;
}
function me(b, h, e) {
  if (b !== "state") return !1;
  const a = kt(h);
  if (Rt(h, "reactive")) {
    const c = h.arguments && h.arguments[0];
    return G.isObjectExpression(c) ? c.properties.forEach((n) => {
      if (G.isObjectProperty(n) && G.isIdentifier(n.key)) {
        const o = n.key.name, s = n.value ? kt(n.value) : void 0;
        e.state[o] = { type: "reactive", value: s };
      }
    }) : e.state[b] = { type: "reactive", value: a }, !0;
  }
  return Rt(h, "ref") ? (e.state[b] = { type: "ref", value: a }, !0) : (e.state[b] = { type: "normal", value: a }, !0);
}
function ge(b, h, e, a) {
  if (!Rt(h, "computed")) return !1;
  const c = h.arguments && h.arguments[0];
  let n = c ? dt(c, a) : kt(h);
  return c && (G.isArrowFunctionExpression(c) ? n = bt(b, c, a) : G.isFunctionExpression(c) && (n = vt(b, c, a))), e.computed[b] = { type: "computed", value: n }, !0;
}
function Jt(b, h, e, a) {
  pe(b, h, e, a) || me(b, h, e) || ge(b, h, e, a);
}
function Vt(b, h, e) {
  if (!G.isBlockStatement(b)) return;
  const a = /* @__PURE__ */ new Set(), c = {};
  b.body.forEach((n) => {
    G.isFunctionDeclaration(n) && n.id && a.add(n.id.name);
  }), b.body.forEach((n) => {
    if (G.isVariableDeclaration(n))
      n.declarations.forEach((o) => {
        if (G.isIdentifier(o.id) && o.init) {
          const s = o.id.name;
          Jt(s, o.init, h, e);
        }
      });
    else if (G.isFunctionDeclaration(n)) {
      const o = n.id.name, s = dt(n, e);
      c[o] = s, wt(h, o, s);
    } else if (G.isExpressionStatement(n) && G.isCallExpression(n.expression)) {
      const o = n.expression;
      if (G.isIdentifier(o.callee) && It(o.callee.name)) {
        const s = o.arguments && o.arguments[0];
        let d = "function() { /* lifecycle hook */ }";
        s && (G.isArrowFunctionExpression(s) ? d = bt(o.callee.name, s, e) : G.isFunctionExpression(s) && (d = vt(o.callee.name, s, e))), mt(h, o.callee.name, d);
      }
    }
    G.isReturnStatement(n) && G.isObjectExpression(n.argument) && n.argument.properties.forEach((o) => {
      if (G.isObjectProperty(o) && G.isIdentifier(o.key)) {
        const s = o.key.name;
        if (!h.state[s] && !h.computed[s] && a.has(s)) {
          const d = c[s] || `function ${s}(){}`;
          h.methods[s] = { type: "function", value: d };
        } else !h.state[s] && !h.methods[s] && !h.computed[s] && (h.methods[s] = { type: "function", value: `function ${s}(){}` });
      }
    });
  });
}
function ye(b, h, e) {
  G.isFunction(b.value) && Vt(b.value.body, h, e);
}
function _e(b, h, e) {
  Vt(b.body, h, e);
}
function ve(b) {
  return G.isArrayExpression(b) ? b.elements.map((h) => G.isStringLiteral(h) ? { name: h.value, type: "any" } : null).filter(Boolean) : [];
}
function be(b, h) {
  if (!G.isObjectExpression(b)) return {};
  const e = {};
  return b.properties.forEach((a) => {
    if (G.isObjectMethod(a) && G.isIdentifier(a.key)) {
      const c = a.key.name, n = dt(a, h);
      e[c] = { type: "function", value: n || `function ${c}(){}` };
    } else if (G.isObjectProperty(a) && G.isIdentifier(a.key)) {
      const c = a.key.name;
      if (G.isFunctionExpression(a.value)) {
        const n = dt(a.value, h);
        e[c] = { type: "function", value: n || `function ${c}(){}` };
      } else if (G.isArrowFunctionExpression(a.value)) {
        const n = bt(c, a.value, h);
        e[c] = { type: "function", value: n };
      } else
        e[c] = { type: "function", value: "function() {}" };
    }
  }), e;
}
function we(b, h) {
  if (!G.isObjectExpression(b)) return {};
  const e = {};
  return b.properties.forEach((a) => {
    if (G.isObjectMethod(a) && G.isIdentifier(a.key)) {
      const c = a.key.name, n = vt(c, a, h);
      e[c] = { type: "computed", value: n || "function() {}" };
    } else if (G.isObjectProperty(a) && G.isIdentifier(a.key)) {
      const c = a.key.name;
      if (G.isFunctionExpression(a.value)) {
        const n = dt(a.value, h);
        e[c] = { type: "computed", value: n || "function() {}" };
      } else if (G.isArrowFunctionExpression(a.value)) {
        const n = bt(c, a.value, h);
        e[c] = { type: "computed", value: n };
      } else
        e[c] = { type: "computed", value: "function() {}" };
    }
  }), e;
}
function ke(b, h, e) {
  b.properties.forEach((a) => {
    if (G.isObjectProperty(a) && G.isIdentifier(a.key)) {
      const c = a.key.name;
      switch (c) {
        case "props":
          h.props = ve(a.value);
          break;
        case "data":
          h.state = { data: "function() { return {} }" };
          break;
        case "methods":
          h.methods = be(a.value, e);
          break;
        case "computed":
          h.computed = we(a.value, e);
          break;
        case "setup":
          ye(a, h, e);
          {
            const n = a.value;
            if (G.isFunctionExpression(n)) {
              const o = vt("setup", n, e);
              mt(h, "setup", o);
            } else if (G.isArrowFunctionExpression(n)) {
              const o = bt("setup", n, e);
              mt(h, "setup", o);
            }
          }
          break;
        default:
          if (It(c)) {
            const n = a.value;
            if (G.isFunctionExpression(n)) {
              const o = vt(c, n, e);
              mt(h, c, o || "function() {}");
            } else if (G.isArrowFunctionExpression(n)) {
              const o = bt(c, n, e);
              mt(h, c, o);
            } else
              mt(h, c, "function() { /* lifecycle hook */ }");
          }
      }
    } else if (G.isObjectMethod(a) && G.isIdentifier(a.key)) {
      const c = a.key.name;
      if (c === "setup") {
        const n = vt("setup", a, e);
        mt(h, "setup", n), _e(a, h, e);
      } else if (It(c)) {
        const n = vt(c, a, e);
        mt(h, c, n);
      }
    }
  });
}
function xe(b, h) {
  jt(b, {
    ImportDeclaration(e) {
      h.imports.push({
        source: e.node.source.value,
        specifiers: e.node.specifiers.map((a) => ({
          local: a.local.name,
          imported: a.imported ? a.imported.name : "default"
        }))
      });
    }
  });
}
function Se(b, h, e) {
  jt(b, {
    VariableDeclaration(a) {
      a.node.declarations.forEach((c) => {
        if (G.isIdentifier(c.id) && c.init) {
          const n = c.id.name;
          Jt(n, c.init, h, e);
        }
      });
    },
    FunctionDeclaration(a) {
      const c = a.node.id.name, n = dt(a.node, e);
      wt(h, c, n);
    },
    CallExpression(a) {
      const c = a.node.callee;
      let n = null;
      if (G.isIdentifier(c) ? n = c.name : G.isMemberExpression(c) && G.isIdentifier(c.property) && (n = c.property.name), n && It(n)) {
        if (n === "setup" && !G.isIdentifier(c)) return;
        const o = a.node.arguments && a.node.arguments[0];
        let s = "function() { /* lifecycle hook */ }";
        o && (G.isArrowFunctionExpression(o) ? s = bt(n, o, e) : G.isFunctionExpression(o) && (s = vt(n, o, e))), n === "setup" ? mt(h, n, s, { noOverride: !0 }) : mt(h, n, s);
      }
    }
  });
}
function Ee(b, h, e) {
  jt(b, {
    ExportDefaultDeclaration(a) {
      G.isObjectExpression(a.node.declaration) && ke(a.node.declaration, h, e);
    }
  });
}
function Ce(b, h = {}) {
  try {
    const e = $t(b, { sourceType: "module", plugins: ["typescript", "jsx"] }), a = {
      imports: [],
      props: [],
      emits: [],
      state: {},
      methods: {},
      computed: {},
      lifeCycles: {}
    };
    return xe(e, a), h.isSetup ? Se(e, a, b) : Ee(e, a, b), a;
  } catch (e) {
    return {
      imports: [],
      props: [],
      emits: [],
      state: {},
      methods: {},
      computed: {},
      lifeCycles: {},
      error: e.message
    };
  }
}
function Ne(b, h = {}) {
  return !b || !b.trim() ? { css: "", scoped: !1, lang: "css" } : { css: b.trim(), scoped: h.scoped || !1, lang: h.lang || "css" };
}
const ze = {
  "tiny-form": "TinyForm",
  "tiny-form-item": "TinyFormItem",
  "tiny-button": "TinyButton",
  "tiny-button-group": "TinyButtonGroup",
  "tiny-switch": "TinySwitch",
  "tiny-select": "TinySelect",
  "tiny-search": "TinySearch",
  "tiny-input": "TinyInput",
  "tiny-grid": "TinyGrid",
  "tiny-grid-item": "TinyGridItem",
  "tiny-col": "TinyCol",
  "tiny-row": "TinyRow",
  "tiny-time-line": "TinyTimeLine",
  "tiny-card": "TinyCard"
}, Ae = [
  {
    componentName: "TinyCarouselItem",
    package: "@opentiny/vue",
    exportName: "CarouselItem",
    destructuring: !0,
    version: "3.24.0"
  },
  {
    componentName: "TinyCheckboxButton",
    package: "@opentiny/vue",
    exportName: "CheckboxButton",
    destructuring: !0,
    version: "3.24.0"
  },
  { componentName: "TinyTree", package: "@opentiny/vue", exportName: "Tree", destructuring: !0, version: "3.24.0" },
  {
    componentName: "TinyPopover",
    package: "@opentiny/vue",
    exportName: "Popover",
    destructuring: !0,
    version: "3.24.0"
  },
  {
    componentName: "TinyTooltip",
    package: "@opentiny/vue",
    exportName: "Tooltip",
    destructuring: !0,
    version: "3.2.0"
  },
  { componentName: "TinyCol", package: "@opentiny/vue", exportName: "Col", destructuring: !0, version: "3.24.0" },
  {
    componentName: "TinyDropdownItem",
    package: "@opentiny/vue",
    exportName: "DropdownItem",
    destructuring: !0,
    version: "3.24.0"
  },
  { componentName: "TinyPager", package: "@opentiny/vue", exportName: "Pager", destructuring: !0, version: "3.24.0" },
  {
    componentName: "TinyPlusAccessdeclined",
    package: "@opentiny/vue",
    exportName: "AccessDeclined",
    destructuring: !0,
    version: "3.4.1"
  },
  {
    componentName: "TinyPlusFrozenPage",
    package: "@opentiny/vue",
    exportName: "FrozenPage",
    destructuring: !0,
    version: "3.4.1"
  },
  {
    componentName: "TinyPlusNonSupportRegion",
    package: "@opentiny/vue",
    exportName: "NonSupportRegion",
    destructuring: !0,
    version: "3.4.1"
  },
  {
    componentName: "TinyPlusBeta",
    package: "@opentiny/vue",
    exportName: "Beta",
    destructuring: !0,
    version: "3.4.1"
  },
  {
    componentName: "TinySearch",
    package: "@opentiny/vue",
    exportName: "Search",
    destructuring: !0,
    version: "3.24.0"
  },
  { componentName: "TinyRow", package: "@opentiny/vue", exportName: "Row", destructuring: !0, version: "3.24.0" },
  {
    componentName: "TinyFormItem",
    package: "@opentiny/vue",
    exportName: "FormItem",
    destructuring: !0,
    version: "3.24.0"
  },
  { componentName: "TinyAlert", package: "@opentiny/vue", exportName: "Alert", destructuring: !0, version: "3.2.0" },
  { componentName: "TinyInput", package: "@opentiny/vue", exportName: "Input", destructuring: !0, version: "3.24.0" },
  { componentName: "TinyTabs", package: "@opentiny/vue", exportName: "Tabs", destructuring: !0, version: "3.24.0" },
  {
    componentName: "TinyDropdownMenu",
    package: "@opentiny/vue",
    exportName: "DropdownMenu",
    destructuring: !0,
    version: "3.24.0"
  },
  {
    componentName: "TinyDialogBox",
    package: "@opentiny/vue",
    exportName: "DialogBox",
    destructuring: !0,
    version: "3.2.0"
  },
  {
    componentName: "TinySwitch",
    package: "@opentiny/vue",
    exportName: "Switch",
    destructuring: !0,
    version: "3.24.0"
  },
  {
    componentName: "TinyTimeLine",
    package: "@opentiny/vue",
    exportName: "TimeLine",
    destructuring: !0,
    version: "3.24.0"
  },
  {
    componentName: "TinyTabItem",
    package: "@opentiny/vue",
    exportName: "TabItem",
    destructuring: !0,
    version: "3.24.0"
  },
  { componentName: "TinyRadio", package: "@opentiny/vue", exportName: "Radio", destructuring: !0, version: "3.24.0" },
  { componentName: "TinyForm", package: "@opentiny/vue", exportName: "Form", destructuring: !0, version: "3.24.0" },
  { componentName: "TinyGrid", package: "@opentiny/vue", exportName: "Grid", destructuring: !0, version: "3.24.0" },
  {
    componentName: "TinyNumeric",
    package: "@opentiny/vue",
    exportName: "Numeric",
    destructuring: !0,
    version: "3.24.0"
  },
  {
    componentName: "TinyCheckboxGroup",
    package: "@opentiny/vue",
    exportName: "CheckboxGroup",
    destructuring: !0,
    version: "3.24.0"
  },
  {
    componentName: "TinySelect",
    package: "@opentiny/vue",
    exportName: "Select",
    destructuring: !0,
    version: "3.24.0"
  },
  {
    componentName: "TinyButtonGroup",
    package: "@opentiny/vue",
    exportName: "ButtonGroup",
    destructuring: !0,
    version: "3.24.0"
  },
  {
    componentName: "TinyButton",
    package: "@opentiny/vue",
    exportName: "Button",
    destructuring: !0,
    version: "3.24.0"
  },
  {
    componentName: "TinyCarousel",
    package: "@opentiny/vue",
    exportName: "Carousel",
    destructuring: !0,
    version: "3.24.0"
  },
  {
    componentName: "TinyPopeditor",
    package: "@opentiny/vue",
    exportName: "Popeditor",
    destructuring: !0,
    version: "3.24.0"
  },
  {
    componentName: "TinyDatePicker",
    package: "@opentiny/vue",
    exportName: "DatePicker",
    destructuring: !0,
    version: "3.24.0"
  },
  {
    componentName: "TinyDropdown",
    package: "@opentiny/vue",
    exportName: "Dropdown",
    destructuring: !0,
    version: "0.1.20"
  },
  {
    componentName: "TinyChartHistogram",
    package: "@opentiny/vue",
    exportName: "ChartHistogram",
    destructuring: !0,
    version: "3.24.0"
  },
  { componentName: "PortalHome", main: "common/components/home", destructuring: !1, version: "1.0.0" },
  { componentName: "PreviewBlock1", main: "preview", destructuring: !1, version: "1.0.0" },
  { componentName: "PortalHeader", main: "common", destructuring: !1, version: "1.0.0" },
  { componentName: "PortalBlock", main: "portal", destructuring: !1, version: "1.0.0" },
  { componentName: "PortalPermissionBlock", main: "", destructuring: !1, version: "1.0.0" },
  { componentName: "TinyCard", exportName: "Card", package: "@opentiny/vue", version: "^3.10.0", destructuring: !0 }
];
function Kt(b) {
  if (typeof b != "string") return b;
  const h = b.trim();
  return /^['"].*['"]$/.test(h) ? h.slice(1, -1) : /^-?\d+(\.\d+)?$/.test(h) ? Number(h) : h === "true" ? !0 : h === "false" ? !1 : h === "null" ? null : h;
}
function Te(b) {
  if (typeof b != "string") return b;
  const h = b.match(/^ref\((.*)\)$/);
  if (!h) return b;
  const e = h[1].trim();
  return Kt(e);
}
function Ie(b) {
  const h = {};
  return Object.keys(b).forEach((e) => {
    const a = b[e];
    if (typeof a == "object" && a.type)
      switch (a.type) {
        case "reactive":
          h[e] = Kt(a.value);
          break;
        case "ref":
          h[e] = Te(a.value);
          break;
        default:
          h[e] = a.value || a;
      }
    else
      h[e] = a;
  }), h;
}
function Fe(b) {
  const h = {};
  return Object.keys(b).forEach((e) => {
    const a = b[e];
    typeof a == "object" && a.value ? h[e] = { type: "JSFunction", value: a.value } : typeof a == "string" ? h[e] = { type: "JSFunction", value: a } : h[e] = { type: "JSFunction", value: "function() { /* method implementation */ }" };
  }), h;
}
function Oe(b) {
  const h = {};
  return Object.keys(b).forEach((e) => {
    const a = b[e];
    typeof a == "object" && a.value ? h[e] = { type: "JSFunction", value: a.value } : typeof a == "string" ? h[e] = { type: "JSFunction", value: a } : h[e] = { type: "JSFunction", value: "function() { /* computed getter */ }" };
  }), h;
}
function Be(b) {
  const h = {};
  return Object.keys(b).forEach((e) => {
    const a = b[e];
    typeof a == "object" && a.value ? h[e] = { type: "JSFunction", value: a.value } : typeof a == "string" ? h[e] = { type: "JSFunction", value: a } : h[e] = { type: "JSFunction", value: "function() { /* lifecycle hook */ }" };
  }), h;
}
function Pe(b) {
  return b.map((h) => typeof h == "string" ? { name: h, type: "any", default: void 0 } : typeof h == "object" ? {
    name: h.name || "unknownProp",
    type: h.type || "any",
    default: h.default,
    required: h.required || !1
  } : h);
}
function Re() {
  let b = "";
  for (; b.length < 8; ) b += Math.random().toString(36).slice(2);
  return b.slice(0, 8);
}
function Yt(b) {
  !b || typeof b != "object" || (typeof b.componentName == "string" && (b.id || (b.id = Re())), Array.isArray(b.children) && b.children.forEach(Yt));
}
function Dt(b) {
  if (b == null || typeof b == "string") return b;
  if (Array.isArray(b)) return b.map((h) => Dt(h));
  if (typeof b == "object") {
    const h = Array.isArray(b) ? [] : {};
    return Object.keys(b).forEach((e) => {
      h[e] = Dt(b[e]);
    }), h;
  }
  return b;
}
async function De(b, h, e, a = {}) {
  const c = {
    componentName: "Page",
    fileName: a.fileName || "UnnamedPage",
    meta: {
      name: a.fileName || "UnnamedPage"
    }
  };
  h && (h.state && (c.state = Ie(h.state)), h.methods && (c.methods = Fe(h.methods)), a.computed_flag === !0 && h.computed && (c.computed = Oe(h.computed)), h.lifeCycles && (c.lifeCycles = Be(h.lifeCycles)), h.props && h.props.length > 0 && (c.props = Pe(h.props))), e && e.css && (c.css = e.css), b && b.length > 0 && (c.children = b);
  const n = Dt(c);
  return Yt(n), n;
}
function Ot(b, h = {}) {
  return {
    meta: {
      name: h.name || "Generated App",
      description: h.description || "App generated from Vue SFC files"
    },
    i18n: h.i18n || { en_US: {}, zh_CN: {} },
    utils: h.utils || [],
    dataSource: h.dataSource || { list: [] },
    globalState: h.globalState || [],
    pageSchema: b || [],
    componentsMap: h.componentsMap || Ae
  };
}
var At = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function je(b) {
  return b && b.__esModule && Object.prototype.hasOwnProperty.call(b, "default") ? b.default : b;
}
function Tt(b) {
  throw new Error('Could not dynamically require "' + b + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
}
var Xt = { exports: {} };
/*!

JSZip v3.10.1 - A JavaScript class for generating and reading zip files
<http://stuartk.com/jszip>

(c) 2009-2016 Stuart Knightley <stuart [at] stuartk.com>
Dual licenced under the MIT license or GPLv3. See https://raw.github.com/Stuk/jszip/main/LICENSE.markdown.

JSZip uses the library pako released under the MIT license :
https://github.com/nodeca/pako/blob/main/LICENSE
*/
(function(b, h) {
  (function(e) {
    b.exports = e();
  })(function() {
    return function e(a, c, n) {
      function o(_, S) {
        if (!c[_]) {
          if (!a[_]) {
            var w = typeof Tt == "function" && Tt;
            if (!S && w) return w(_, !0);
            if (s) return s(_, !0);
            var k = new Error("Cannot find module '" + _ + "'");
            throw k.code = "MODULE_NOT_FOUND", k;
          }
          var u = c[_] = { exports: {} };
          a[_][0].call(u.exports, function(g) {
            var i = a[_][1][g];
            return o(i || g);
          }, u, u.exports, e, a, c, n);
        }
        return c[_].exports;
      }
      for (var s = typeof Tt == "function" && Tt, d = 0; d < n.length; d++) o(n[d]);
      return o;
    }({ 1: [function(e, a, c) {
      var n = e("./utils"), o = e("./support"), s = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
      c.encode = function(d) {
        for (var _, S, w, k, u, g, i, f = [], l = 0, p = d.length, v = p, C = n.getTypeOf(d) !== "string"; l < d.length; ) v = p - l, w = C ? (_ = d[l++], S = l < p ? d[l++] : 0, l < p ? d[l++] : 0) : (_ = d.charCodeAt(l++), S = l < p ? d.charCodeAt(l++) : 0, l < p ? d.charCodeAt(l++) : 0), k = _ >> 2, u = (3 & _) << 4 | S >> 4, g = 1 < v ? (15 & S) << 2 | w >> 6 : 64, i = 2 < v ? 63 & w : 64, f.push(s.charAt(k) + s.charAt(u) + s.charAt(g) + s.charAt(i));
        return f.join("");
      }, c.decode = function(d) {
        var _, S, w, k, u, g, i = 0, f = 0, l = "data:";
        if (d.substr(0, l.length) === l) throw new Error("Invalid base64 input, it looks like a data url.");
        var p, v = 3 * (d = d.replace(/[^A-Za-z0-9+/=]/g, "")).length / 4;
        if (d.charAt(d.length - 1) === s.charAt(64) && v--, d.charAt(d.length - 2) === s.charAt(64) && v--, v % 1 != 0) throw new Error("Invalid base64 input, bad content length.");
        for (p = o.uint8array ? new Uint8Array(0 | v) : new Array(0 | v); i < d.length; ) _ = s.indexOf(d.charAt(i++)) << 2 | (k = s.indexOf(d.charAt(i++))) >> 4, S = (15 & k) << 4 | (u = s.indexOf(d.charAt(i++))) >> 2, w = (3 & u) << 6 | (g = s.indexOf(d.charAt(i++))), p[f++] = _, u !== 64 && (p[f++] = S), g !== 64 && (p[f++] = w);
        return p;
      };
    }, { "./support": 30, "./utils": 32 }], 2: [function(e, a, c) {
      var n = e("./external"), o = e("./stream/DataWorker"), s = e("./stream/Crc32Probe"), d = e("./stream/DataLengthProbe");
      function _(S, w, k, u, g) {
        this.compressedSize = S, this.uncompressedSize = w, this.crc32 = k, this.compression = u, this.compressedContent = g;
      }
      _.prototype = { getContentWorker: function() {
        var S = new o(n.Promise.resolve(this.compressedContent)).pipe(this.compression.uncompressWorker()).pipe(new d("data_length")), w = this;
        return S.on("end", function() {
          if (this.streamInfo.data_length !== w.uncompressedSize) throw new Error("Bug : uncompressed data size mismatch");
        }), S;
      }, getCompressedWorker: function() {
        return new o(n.Promise.resolve(this.compressedContent)).withStreamInfo("compressedSize", this.compressedSize).withStreamInfo("uncompressedSize", this.uncompressedSize).withStreamInfo("crc32", this.crc32).withStreamInfo("compression", this.compression);
      } }, _.createWorkerFrom = function(S, w, k) {
        return S.pipe(new s()).pipe(new d("uncompressedSize")).pipe(w.compressWorker(k)).pipe(new d("compressedSize")).withStreamInfo("compression", w);
      }, a.exports = _;
    }, { "./external": 6, "./stream/Crc32Probe": 25, "./stream/DataLengthProbe": 26, "./stream/DataWorker": 27 }], 3: [function(e, a, c) {
      var n = e("./stream/GenericWorker");
      c.STORE = { magic: "\0\0", compressWorker: function() {
        return new n("STORE compression");
      }, uncompressWorker: function() {
        return new n("STORE decompression");
      } }, c.DEFLATE = e("./flate");
    }, { "./flate": 7, "./stream/GenericWorker": 28 }], 4: [function(e, a, c) {
      var n = e("./utils"), o = function() {
        for (var s, d = [], _ = 0; _ < 256; _++) {
          s = _;
          for (var S = 0; S < 8; S++) s = 1 & s ? 3988292384 ^ s >>> 1 : s >>> 1;
          d[_] = s;
        }
        return d;
      }();
      a.exports = function(s, d) {
        return s !== void 0 && s.length ? n.getTypeOf(s) !== "string" ? function(_, S, w, k) {
          var u = o, g = k + w;
          _ ^= -1;
          for (var i = k; i < g; i++) _ = _ >>> 8 ^ u[255 & (_ ^ S[i])];
          return -1 ^ _;
        }(0 | d, s, s.length, 0) : function(_, S, w, k) {
          var u = o, g = k + w;
          _ ^= -1;
          for (var i = k; i < g; i++) _ = _ >>> 8 ^ u[255 & (_ ^ S.charCodeAt(i))];
          return -1 ^ _;
        }(0 | d, s, s.length, 0) : 0;
      };
    }, { "./utils": 32 }], 5: [function(e, a, c) {
      c.base64 = !1, c.binary = !1, c.dir = !1, c.createFolders = !0, c.date = null, c.compression = null, c.compressionOptions = null, c.comment = null, c.unixPermissions = null, c.dosPermissions = null;
    }, {}], 6: [function(e, a, c) {
      var n = null;
      n = typeof Promise < "u" ? Promise : e("lie"), a.exports = { Promise: n };
    }, { lie: 37 }], 7: [function(e, a, c) {
      var n = typeof Uint8Array < "u" && typeof Uint16Array < "u" && typeof Uint32Array < "u", o = e("pako"), s = e("./utils"), d = e("./stream/GenericWorker"), _ = n ? "uint8array" : "array";
      function S(w, k) {
        d.call(this, "FlateWorker/" + w), this._pako = null, this._pakoAction = w, this._pakoOptions = k, this.meta = {};
      }
      c.magic = "\b\0", s.inherits(S, d), S.prototype.processChunk = function(w) {
        this.meta = w.meta, this._pako === null && this._createPako(), this._pako.push(s.transformTo(_, w.data), !1);
      }, S.prototype.flush = function() {
        d.prototype.flush.call(this), this._pako === null && this._createPako(), this._pako.push([], !0);
      }, S.prototype.cleanUp = function() {
        d.prototype.cleanUp.call(this), this._pako = null;
      }, S.prototype._createPako = function() {
        this._pako = new o[this._pakoAction]({ raw: !0, level: this._pakoOptions.level || -1 });
        var w = this;
        this._pako.onData = function(k) {
          w.push({ data: k, meta: w.meta });
        };
      }, c.compressWorker = function(w) {
        return new S("Deflate", w);
      }, c.uncompressWorker = function() {
        return new S("Inflate", {});
      };
    }, { "./stream/GenericWorker": 28, "./utils": 32, pako: 38 }], 8: [function(e, a, c) {
      function n(u, g) {
        var i, f = "";
        for (i = 0; i < g; i++) f += String.fromCharCode(255 & u), u >>>= 8;
        return f;
      }
      function o(u, g, i, f, l, p) {
        var v, C, E = u.file, P = u.compression, T = p !== _.utf8encode, L = s.transformTo("string", p(E.name)), z = s.transformTo("string", _.utf8encode(E.name)), D = E.comment, Y = s.transformTo("string", p(D)), x = s.transformTo("string", _.utf8encode(D)), O = z.length !== E.name.length, r = x.length !== D.length, R = "", X = "", j = "", tt = E.dir, Z = E.date, et = { crc32: 0, compressedSize: 0, uncompressedSize: 0 };
        g && !i || (et.crc32 = u.crc32, et.compressedSize = u.compressedSize, et.uncompressedSize = u.uncompressedSize);
        var F = 0;
        g && (F |= 8), T || !O && !r || (F |= 2048);
        var I = 0, Q = 0;
        tt && (I |= 16), l === "UNIX" ? (Q = 798, I |= function(J, ot) {
          var ft = J;
          return J || (ft = ot ? 16893 : 33204), (65535 & ft) << 16;
        }(E.unixPermissions, tt)) : (Q = 20, I |= function(J) {
          return 63 & (J || 0);
        }(E.dosPermissions)), v = Z.getUTCHours(), v <<= 6, v |= Z.getUTCMinutes(), v <<= 5, v |= Z.getUTCSeconds() / 2, C = Z.getUTCFullYear() - 1980, C <<= 4, C |= Z.getUTCMonth() + 1, C <<= 5, C |= Z.getUTCDate(), O && (X = n(1, 1) + n(S(L), 4) + z, R += "up" + n(X.length, 2) + X), r && (j = n(1, 1) + n(S(Y), 4) + x, R += "uc" + n(j.length, 2) + j);
        var V = "";
        return V += `
\0`, V += n(F, 2), V += P.magic, V += n(v, 2), V += n(C, 2), V += n(et.crc32, 4), V += n(et.compressedSize, 4), V += n(et.uncompressedSize, 4), V += n(L.length, 2), V += n(R.length, 2), { fileRecord: w.LOCAL_FILE_HEADER + V + L + R, dirRecord: w.CENTRAL_FILE_HEADER + n(Q, 2) + V + n(Y.length, 2) + "\0\0\0\0" + n(I, 4) + n(f, 4) + L + R + Y };
      }
      var s = e("../utils"), d = e("../stream/GenericWorker"), _ = e("../utf8"), S = e("../crc32"), w = e("../signature");
      function k(u, g, i, f) {
        d.call(this, "ZipFileWorker"), this.bytesWritten = 0, this.zipComment = g, this.zipPlatform = i, this.encodeFileName = f, this.streamFiles = u, this.accumulate = !1, this.contentBuffer = [], this.dirRecords = [], this.currentSourceOffset = 0, this.entriesCount = 0, this.currentFile = null, this._sources = [];
      }
      s.inherits(k, d), k.prototype.push = function(u) {
        var g = u.meta.percent || 0, i = this.entriesCount, f = this._sources.length;
        this.accumulate ? this.contentBuffer.push(u) : (this.bytesWritten += u.data.length, d.prototype.push.call(this, { data: u.data, meta: { currentFile: this.currentFile, percent: i ? (g + 100 * (i - f - 1)) / i : 100 } }));
      }, k.prototype.openedSource = function(u) {
        this.currentSourceOffset = this.bytesWritten, this.currentFile = u.file.name;
        var g = this.streamFiles && !u.file.dir;
        if (g) {
          var i = o(u, g, !1, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
          this.push({ data: i.fileRecord, meta: { percent: 0 } });
        } else this.accumulate = !0;
      }, k.prototype.closedSource = function(u) {
        this.accumulate = !1;
        var g = this.streamFiles && !u.file.dir, i = o(u, g, !0, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
        if (this.dirRecords.push(i.dirRecord), g) this.push({ data: function(f) {
          return w.DATA_DESCRIPTOR + n(f.crc32, 4) + n(f.compressedSize, 4) + n(f.uncompressedSize, 4);
        }(u), meta: { percent: 100 } });
        else for (this.push({ data: i.fileRecord, meta: { percent: 0 } }); this.contentBuffer.length; ) this.push(this.contentBuffer.shift());
        this.currentFile = null;
      }, k.prototype.flush = function() {
        for (var u = this.bytesWritten, g = 0; g < this.dirRecords.length; g++) this.push({ data: this.dirRecords[g], meta: { percent: 100 } });
        var i = this.bytesWritten - u, f = function(l, p, v, C, E) {
          var P = s.transformTo("string", E(C));
          return w.CENTRAL_DIRECTORY_END + "\0\0\0\0" + n(l, 2) + n(l, 2) + n(p, 4) + n(v, 4) + n(P.length, 2) + P;
        }(this.dirRecords.length, i, u, this.zipComment, this.encodeFileName);
        this.push({ data: f, meta: { percent: 100 } });
      }, k.prototype.prepareNextSource = function() {
        this.previous = this._sources.shift(), this.openedSource(this.previous.streamInfo), this.isPaused ? this.previous.pause() : this.previous.resume();
      }, k.prototype.registerPrevious = function(u) {
        this._sources.push(u);
        var g = this;
        return u.on("data", function(i) {
          g.processChunk(i);
        }), u.on("end", function() {
          g.closedSource(g.previous.streamInfo), g._sources.length ? g.prepareNextSource() : g.end();
        }), u.on("error", function(i) {
          g.error(i);
        }), this;
      }, k.prototype.resume = function() {
        return !!d.prototype.resume.call(this) && (!this.previous && this._sources.length ? (this.prepareNextSource(), !0) : this.previous || this._sources.length || this.generatedError ? void 0 : (this.end(), !0));
      }, k.prototype.error = function(u) {
        var g = this._sources;
        if (!d.prototype.error.call(this, u)) return !1;
        for (var i = 0; i < g.length; i++) try {
          g[i].error(u);
        } catch {
        }
        return !0;
      }, k.prototype.lock = function() {
        d.prototype.lock.call(this);
        for (var u = this._sources, g = 0; g < u.length; g++) u[g].lock();
      }, a.exports = k;
    }, { "../crc32": 4, "../signature": 23, "../stream/GenericWorker": 28, "../utf8": 31, "../utils": 32 }], 9: [function(e, a, c) {
      var n = e("../compressions"), o = e("./ZipFileWorker");
      c.generateWorker = function(s, d, _) {
        var S = new o(d.streamFiles, _, d.platform, d.encodeFileName), w = 0;
        try {
          s.forEach(function(k, u) {
            w++;
            var g = function(p, v) {
              var C = p || v, E = n[C];
              if (!E) throw new Error(C + " is not a valid compression method !");
              return E;
            }(u.options.compression, d.compression), i = u.options.compressionOptions || d.compressionOptions || {}, f = u.dir, l = u.date;
            u._compressWorker(g, i).withStreamInfo("file", { name: k, dir: f, date: l, comment: u.comment || "", unixPermissions: u.unixPermissions, dosPermissions: u.dosPermissions }).pipe(S);
          }), S.entriesCount = w;
        } catch (k) {
          S.error(k);
        }
        return S;
      };
    }, { "../compressions": 3, "./ZipFileWorker": 8 }], 10: [function(e, a, c) {
      function n() {
        if (!(this instanceof n)) return new n();
        if (arguments.length) throw new Error("The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.");
        this.files = /* @__PURE__ */ Object.create(null), this.comment = null, this.root = "", this.clone = function() {
          var o = new n();
          for (var s in this) typeof this[s] != "function" && (o[s] = this[s]);
          return o;
        };
      }
      (n.prototype = e("./object")).loadAsync = e("./load"), n.support = e("./support"), n.defaults = e("./defaults"), n.version = "3.10.1", n.loadAsync = function(o, s) {
        return new n().loadAsync(o, s);
      }, n.external = e("./external"), a.exports = n;
    }, { "./defaults": 5, "./external": 6, "./load": 11, "./object": 15, "./support": 30 }], 11: [function(e, a, c) {
      var n = e("./utils"), o = e("./external"), s = e("./utf8"), d = e("./zipEntries"), _ = e("./stream/Crc32Probe"), S = e("./nodejsUtils");
      function w(k) {
        return new o.Promise(function(u, g) {
          var i = k.decompressed.getContentWorker().pipe(new _());
          i.on("error", function(f) {
            g(f);
          }).on("end", function() {
            i.streamInfo.crc32 !== k.decompressed.crc32 ? g(new Error("Corrupted zip : CRC32 mismatch")) : u();
          }).resume();
        });
      }
      a.exports = function(k, u) {
        var g = this;
        return u = n.extend(u || {}, { base64: !1, checkCRC32: !1, optimizedBinaryString: !1, createFolders: !1, decodeFileName: s.utf8decode }), S.isNode && S.isStream(k) ? o.Promise.reject(new Error("JSZip can't accept a stream when loading a zip file.")) : n.prepareContent("the loaded zip file", k, !0, u.optimizedBinaryString, u.base64).then(function(i) {
          var f = new d(u);
          return f.load(i), f;
        }).then(function(i) {
          var f = [o.Promise.resolve(i)], l = i.files;
          if (u.checkCRC32) for (var p = 0; p < l.length; p++) f.push(w(l[p]));
          return o.Promise.all(f);
        }).then(function(i) {
          for (var f = i.shift(), l = f.files, p = 0; p < l.length; p++) {
            var v = l[p], C = v.fileNameStr, E = n.resolve(v.fileNameStr);
            g.file(E, v.decompressed, { binary: !0, optimizedBinaryString: !0, date: v.date, dir: v.dir, comment: v.fileCommentStr.length ? v.fileCommentStr : null, unixPermissions: v.unixPermissions, dosPermissions: v.dosPermissions, createFolders: u.createFolders }), v.dir || (g.file(E).unsafeOriginalName = C);
          }
          return f.zipComment.length && (g.comment = f.zipComment), g;
        });
      };
    }, { "./external": 6, "./nodejsUtils": 14, "./stream/Crc32Probe": 25, "./utf8": 31, "./utils": 32, "./zipEntries": 33 }], 12: [function(e, a, c) {
      var n = e("../utils"), o = e("../stream/GenericWorker");
      function s(d, _) {
        o.call(this, "Nodejs stream input adapter for " + d), this._upstreamEnded = !1, this._bindStream(_);
      }
      n.inherits(s, o), s.prototype._bindStream = function(d) {
        var _ = this;
        (this._stream = d).pause(), d.on("data", function(S) {
          _.push({ data: S, meta: { percent: 0 } });
        }).on("error", function(S) {
          _.isPaused ? this.generatedError = S : _.error(S);
        }).on("end", function() {
          _.isPaused ? _._upstreamEnded = !0 : _.end();
        });
      }, s.prototype.pause = function() {
        return !!o.prototype.pause.call(this) && (this._stream.pause(), !0);
      }, s.prototype.resume = function() {
        return !!o.prototype.resume.call(this) && (this._upstreamEnded ? this.end() : this._stream.resume(), !0);
      }, a.exports = s;
    }, { "../stream/GenericWorker": 28, "../utils": 32 }], 13: [function(e, a, c) {
      var n = e("readable-stream").Readable;
      function o(s, d, _) {
        n.call(this, d), this._helper = s;
        var S = this;
        s.on("data", function(w, k) {
          S.push(w) || S._helper.pause(), _ && _(k);
        }).on("error", function(w) {
          S.emit("error", w);
        }).on("end", function() {
          S.push(null);
        });
      }
      e("../utils").inherits(o, n), o.prototype._read = function() {
        this._helper.resume();
      }, a.exports = o;
    }, { "../utils": 32, "readable-stream": 16 }], 14: [function(e, a, c) {
      a.exports = { isNode: typeof Buffer < "u", newBufferFrom: function(n, o) {
        if (Buffer.from && Buffer.from !== Uint8Array.from) return Buffer.from(n, o);
        if (typeof n == "number") throw new Error('The "data" argument must not be a number');
        return new Buffer(n, o);
      }, allocBuffer: function(n) {
        if (Buffer.alloc) return Buffer.alloc(n);
        var o = new Buffer(n);
        return o.fill(0), o;
      }, isBuffer: function(n) {
        return Buffer.isBuffer(n);
      }, isStream: function(n) {
        return n && typeof n.on == "function" && typeof n.pause == "function" && typeof n.resume == "function";
      } };
    }, {}], 15: [function(e, a, c) {
      function n(E, P, T) {
        var L, z = s.getTypeOf(P), D = s.extend(T || {}, S);
        D.date = D.date || /* @__PURE__ */ new Date(), D.compression !== null && (D.compression = D.compression.toUpperCase()), typeof D.unixPermissions == "string" && (D.unixPermissions = parseInt(D.unixPermissions, 8)), D.unixPermissions && 16384 & D.unixPermissions && (D.dir = !0), D.dosPermissions && 16 & D.dosPermissions && (D.dir = !0), D.dir && (E = l(E)), D.createFolders && (L = f(E)) && p.call(this, L, !0);
        var Y = z === "string" && D.binary === !1 && D.base64 === !1;
        T && T.binary !== void 0 || (D.binary = !Y), (P instanceof w && P.uncompressedSize === 0 || D.dir || !P || P.length === 0) && (D.base64 = !1, D.binary = !0, P = "", D.compression = "STORE", z = "string");
        var x = null;
        x = P instanceof w || P instanceof d ? P : g.isNode && g.isStream(P) ? new i(E, P) : s.prepareContent(E, P, D.binary, D.optimizedBinaryString, D.base64);
        var O = new k(E, x, D);
        this.files[E] = O;
      }
      var o = e("./utf8"), s = e("./utils"), d = e("./stream/GenericWorker"), _ = e("./stream/StreamHelper"), S = e("./defaults"), w = e("./compressedObject"), k = e("./zipObject"), u = e("./generate"), g = e("./nodejsUtils"), i = e("./nodejs/NodejsStreamInputAdapter"), f = function(E) {
        E.slice(-1) === "/" && (E = E.substring(0, E.length - 1));
        var P = E.lastIndexOf("/");
        return 0 < P ? E.substring(0, P) : "";
      }, l = function(E) {
        return E.slice(-1) !== "/" && (E += "/"), E;
      }, p = function(E, P) {
        return P = P !== void 0 ? P : S.createFolders, E = l(E), this.files[E] || n.call(this, E, null, { dir: !0, createFolders: P }), this.files[E];
      };
      function v(E) {
        return Object.prototype.toString.call(E) === "[object RegExp]";
      }
      var C = { load: function() {
        throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
      }, forEach: function(E) {
        var P, T, L;
        for (P in this.files) L = this.files[P], (T = P.slice(this.root.length, P.length)) && P.slice(0, this.root.length) === this.root && E(T, L);
      }, filter: function(E) {
        var P = [];
        return this.forEach(function(T, L) {
          E(T, L) && P.push(L);
        }), P;
      }, file: function(E, P, T) {
        if (arguments.length !== 1) return E = this.root + E, n.call(this, E, P, T), this;
        if (v(E)) {
          var L = E;
          return this.filter(function(D, Y) {
            return !Y.dir && L.test(D);
          });
        }
        var z = this.files[this.root + E];
        return z && !z.dir ? z : null;
      }, folder: function(E) {
        if (!E) return this;
        if (v(E)) return this.filter(function(z, D) {
          return D.dir && E.test(z);
        });
        var P = this.root + E, T = p.call(this, P), L = this.clone();
        return L.root = T.name, L;
      }, remove: function(E) {
        E = this.root + E;
        var P = this.files[E];
        if (P || (E.slice(-1) !== "/" && (E += "/"), P = this.files[E]), P && !P.dir) delete this.files[E];
        else for (var T = this.filter(function(z, D) {
          return D.name.slice(0, E.length) === E;
        }), L = 0; L < T.length; L++) delete this.files[T[L].name];
        return this;
      }, generate: function() {
        throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
      }, generateInternalStream: function(E) {
        var P, T = {};
        try {
          if ((T = s.extend(E || {}, { streamFiles: !1, compression: "STORE", compressionOptions: null, type: "", platform: "DOS", comment: null, mimeType: "application/zip", encodeFileName: o.utf8encode })).type = T.type.toLowerCase(), T.compression = T.compression.toUpperCase(), T.type === "binarystring" && (T.type = "string"), !T.type) throw new Error("No output type specified.");
          s.checkSupport(T.type), T.platform !== "darwin" && T.platform !== "freebsd" && T.platform !== "linux" && T.platform !== "sunos" || (T.platform = "UNIX"), T.platform === "win32" && (T.platform = "DOS");
          var L = T.comment || this.comment || "";
          P = u.generateWorker(this, T, L);
        } catch (z) {
          (P = new d("error")).error(z);
        }
        return new _(P, T.type || "string", T.mimeType);
      }, generateAsync: function(E, P) {
        return this.generateInternalStream(E).accumulate(P);
      }, generateNodeStream: function(E, P) {
        return (E = E || {}).type || (E.type = "nodebuffer"), this.generateInternalStream(E).toNodejsStream(P);
      } };
      a.exports = C;
    }, { "./compressedObject": 2, "./defaults": 5, "./generate": 9, "./nodejs/NodejsStreamInputAdapter": 12, "./nodejsUtils": 14, "./stream/GenericWorker": 28, "./stream/StreamHelper": 29, "./utf8": 31, "./utils": 32, "./zipObject": 35 }], 16: [function(e, a, c) {
      a.exports = e("stream");
    }, { stream: void 0 }], 17: [function(e, a, c) {
      var n = e("./DataReader");
      function o(s) {
        n.call(this, s);
        for (var d = 0; d < this.data.length; d++) s[d] = 255 & s[d];
      }
      e("../utils").inherits(o, n), o.prototype.byteAt = function(s) {
        return this.data[this.zero + s];
      }, o.prototype.lastIndexOfSignature = function(s) {
        for (var d = s.charCodeAt(0), _ = s.charCodeAt(1), S = s.charCodeAt(2), w = s.charCodeAt(3), k = this.length - 4; 0 <= k; --k) if (this.data[k] === d && this.data[k + 1] === _ && this.data[k + 2] === S && this.data[k + 3] === w) return k - this.zero;
        return -1;
      }, o.prototype.readAndCheckSignature = function(s) {
        var d = s.charCodeAt(0), _ = s.charCodeAt(1), S = s.charCodeAt(2), w = s.charCodeAt(3), k = this.readData(4);
        return d === k[0] && _ === k[1] && S === k[2] && w === k[3];
      }, o.prototype.readData = function(s) {
        if (this.checkOffset(s), s === 0) return [];
        var d = this.data.slice(this.zero + this.index, this.zero + this.index + s);
        return this.index += s, d;
      }, a.exports = o;
    }, { "../utils": 32, "./DataReader": 18 }], 18: [function(e, a, c) {
      var n = e("../utils");
      function o(s) {
        this.data = s, this.length = s.length, this.index = 0, this.zero = 0;
      }
      o.prototype = { checkOffset: function(s) {
        this.checkIndex(this.index + s);
      }, checkIndex: function(s) {
        if (this.length < this.zero + s || s < 0) throw new Error("End of data reached (data length = " + this.length + ", asked index = " + s + "). Corrupted zip ?");
      }, setIndex: function(s) {
        this.checkIndex(s), this.index = s;
      }, skip: function(s) {
        this.setIndex(this.index + s);
      }, byteAt: function() {
      }, readInt: function(s) {
        var d, _ = 0;
        for (this.checkOffset(s), d = this.index + s - 1; d >= this.index; d--) _ = (_ << 8) + this.byteAt(d);
        return this.index += s, _;
      }, readString: function(s) {
        return n.transformTo("string", this.readData(s));
      }, readData: function() {
      }, lastIndexOfSignature: function() {
      }, readAndCheckSignature: function() {
      }, readDate: function() {
        var s = this.readInt(4);
        return new Date(Date.UTC(1980 + (s >> 25 & 127), (s >> 21 & 15) - 1, s >> 16 & 31, s >> 11 & 31, s >> 5 & 63, (31 & s) << 1));
      } }, a.exports = o;
    }, { "../utils": 32 }], 19: [function(e, a, c) {
      var n = e("./Uint8ArrayReader");
      function o(s) {
        n.call(this, s);
      }
      e("../utils").inherits(o, n), o.prototype.readData = function(s) {
        this.checkOffset(s);
        var d = this.data.slice(this.zero + this.index, this.zero + this.index + s);
        return this.index += s, d;
      }, a.exports = o;
    }, { "../utils": 32, "./Uint8ArrayReader": 21 }], 20: [function(e, a, c) {
      var n = e("./DataReader");
      function o(s) {
        n.call(this, s);
      }
      e("../utils").inherits(o, n), o.prototype.byteAt = function(s) {
        return this.data.charCodeAt(this.zero + s);
      }, o.prototype.lastIndexOfSignature = function(s) {
        return this.data.lastIndexOf(s) - this.zero;
      }, o.prototype.readAndCheckSignature = function(s) {
        return s === this.readData(4);
      }, o.prototype.readData = function(s) {
        this.checkOffset(s);
        var d = this.data.slice(this.zero + this.index, this.zero + this.index + s);
        return this.index += s, d;
      }, a.exports = o;
    }, { "../utils": 32, "./DataReader": 18 }], 21: [function(e, a, c) {
      var n = e("./ArrayReader");
      function o(s) {
        n.call(this, s);
      }
      e("../utils").inherits(o, n), o.prototype.readData = function(s) {
        if (this.checkOffset(s), s === 0) return new Uint8Array(0);
        var d = this.data.subarray(this.zero + this.index, this.zero + this.index + s);
        return this.index += s, d;
      }, a.exports = o;
    }, { "../utils": 32, "./ArrayReader": 17 }], 22: [function(e, a, c) {
      var n = e("../utils"), o = e("../support"), s = e("./ArrayReader"), d = e("./StringReader"), _ = e("./NodeBufferReader"), S = e("./Uint8ArrayReader");
      a.exports = function(w) {
        var k = n.getTypeOf(w);
        return n.checkSupport(k), k !== "string" || o.uint8array ? k === "nodebuffer" ? new _(w) : o.uint8array ? new S(n.transformTo("uint8array", w)) : new s(n.transformTo("array", w)) : new d(w);
      };
    }, { "../support": 30, "../utils": 32, "./ArrayReader": 17, "./NodeBufferReader": 19, "./StringReader": 20, "./Uint8ArrayReader": 21 }], 23: [function(e, a, c) {
      c.LOCAL_FILE_HEADER = "PK", c.CENTRAL_FILE_HEADER = "PK", c.CENTRAL_DIRECTORY_END = "PK", c.ZIP64_CENTRAL_DIRECTORY_LOCATOR = "PK\x07", c.ZIP64_CENTRAL_DIRECTORY_END = "PK", c.DATA_DESCRIPTOR = "PK\x07\b";
    }, {}], 24: [function(e, a, c) {
      var n = e("./GenericWorker"), o = e("../utils");
      function s(d) {
        n.call(this, "ConvertWorker to " + d), this.destType = d;
      }
      o.inherits(s, n), s.prototype.processChunk = function(d) {
        this.push({ data: o.transformTo(this.destType, d.data), meta: d.meta });
      }, a.exports = s;
    }, { "../utils": 32, "./GenericWorker": 28 }], 25: [function(e, a, c) {
      var n = e("./GenericWorker"), o = e("../crc32");
      function s() {
        n.call(this, "Crc32Probe"), this.withStreamInfo("crc32", 0);
      }
      e("../utils").inherits(s, n), s.prototype.processChunk = function(d) {
        this.streamInfo.crc32 = o(d.data, this.streamInfo.crc32 || 0), this.push(d);
      }, a.exports = s;
    }, { "../crc32": 4, "../utils": 32, "./GenericWorker": 28 }], 26: [function(e, a, c) {
      var n = e("../utils"), o = e("./GenericWorker");
      function s(d) {
        o.call(this, "DataLengthProbe for " + d), this.propName = d, this.withStreamInfo(d, 0);
      }
      n.inherits(s, o), s.prototype.processChunk = function(d) {
        if (d) {
          var _ = this.streamInfo[this.propName] || 0;
          this.streamInfo[this.propName] = _ + d.data.length;
        }
        o.prototype.processChunk.call(this, d);
      }, a.exports = s;
    }, { "../utils": 32, "./GenericWorker": 28 }], 27: [function(e, a, c) {
      var n = e("../utils"), o = e("./GenericWorker");
      function s(d) {
        o.call(this, "DataWorker");
        var _ = this;
        this.dataIsReady = !1, this.index = 0, this.max = 0, this.data = null, this.type = "", this._tickScheduled = !1, d.then(function(S) {
          _.dataIsReady = !0, _.data = S, _.max = S && S.length || 0, _.type = n.getTypeOf(S), _.isPaused || _._tickAndRepeat();
        }, function(S) {
          _.error(S);
        });
      }
      n.inherits(s, o), s.prototype.cleanUp = function() {
        o.prototype.cleanUp.call(this), this.data = null;
      }, s.prototype.resume = function() {
        return !!o.prototype.resume.call(this) && (!this._tickScheduled && this.dataIsReady && (this._tickScheduled = !0, n.delay(this._tickAndRepeat, [], this)), !0);
      }, s.prototype._tickAndRepeat = function() {
        this._tickScheduled = !1, this.isPaused || this.isFinished || (this._tick(), this.isFinished || (n.delay(this._tickAndRepeat, [], this), this._tickScheduled = !0));
      }, s.prototype._tick = function() {
        if (this.isPaused || this.isFinished) return !1;
        var d = null, _ = Math.min(this.max, this.index + 16384);
        if (this.index >= this.max) return this.end();
        switch (this.type) {
          case "string":
            d = this.data.substring(this.index, _);
            break;
          case "uint8array":
            d = this.data.subarray(this.index, _);
            break;
          case "array":
          case "nodebuffer":
            d = this.data.slice(this.index, _);
        }
        return this.index = _, this.push({ data: d, meta: { percent: this.max ? this.index / this.max * 100 : 0 } });
      }, a.exports = s;
    }, { "../utils": 32, "./GenericWorker": 28 }], 28: [function(e, a, c) {
      function n(o) {
        this.name = o || "default", this.streamInfo = {}, this.generatedError = null, this.extraStreamInfo = {}, this.isPaused = !0, this.isFinished = !1, this.isLocked = !1, this._listeners = { data: [], end: [], error: [] }, this.previous = null;
      }
      n.prototype = { push: function(o) {
        this.emit("data", o);
      }, end: function() {
        if (this.isFinished) return !1;
        this.flush();
        try {
          this.emit("end"), this.cleanUp(), this.isFinished = !0;
        } catch (o) {
          this.emit("error", o);
        }
        return !0;
      }, error: function(o) {
        return !this.isFinished && (this.isPaused ? this.generatedError = o : (this.isFinished = !0, this.emit("error", o), this.previous && this.previous.error(o), this.cleanUp()), !0);
      }, on: function(o, s) {
        return this._listeners[o].push(s), this;
      }, cleanUp: function() {
        this.streamInfo = this.generatedError = this.extraStreamInfo = null, this._listeners = [];
      }, emit: function(o, s) {
        if (this._listeners[o]) for (var d = 0; d < this._listeners[o].length; d++) this._listeners[o][d].call(this, s);
      }, pipe: function(o) {
        return o.registerPrevious(this);
      }, registerPrevious: function(o) {
        if (this.isLocked) throw new Error("The stream '" + this + "' has already been used.");
        this.streamInfo = o.streamInfo, this.mergeStreamInfo(), this.previous = o;
        var s = this;
        return o.on("data", function(d) {
          s.processChunk(d);
        }), o.on("end", function() {
          s.end();
        }), o.on("error", function(d) {
          s.error(d);
        }), this;
      }, pause: function() {
        return !this.isPaused && !this.isFinished && (this.isPaused = !0, this.previous && this.previous.pause(), !0);
      }, resume: function() {
        if (!this.isPaused || this.isFinished) return !1;
        var o = this.isPaused = !1;
        return this.generatedError && (this.error(this.generatedError), o = !0), this.previous && this.previous.resume(), !o;
      }, flush: function() {
      }, processChunk: function(o) {
        this.push(o);
      }, withStreamInfo: function(o, s) {
        return this.extraStreamInfo[o] = s, this.mergeStreamInfo(), this;
      }, mergeStreamInfo: function() {
        for (var o in this.extraStreamInfo) Object.prototype.hasOwnProperty.call(this.extraStreamInfo, o) && (this.streamInfo[o] = this.extraStreamInfo[o]);
      }, lock: function() {
        if (this.isLocked) throw new Error("The stream '" + this + "' has already been used.");
        this.isLocked = !0, this.previous && this.previous.lock();
      }, toString: function() {
        var o = "Worker " + this.name;
        return this.previous ? this.previous + " -> " + o : o;
      } }, a.exports = n;
    }, {}], 29: [function(e, a, c) {
      var n = e("../utils"), o = e("./ConvertWorker"), s = e("./GenericWorker"), d = e("../base64"), _ = e("../support"), S = e("../external"), w = null;
      if (_.nodestream) try {
        w = e("../nodejs/NodejsStreamOutputAdapter");
      } catch {
      }
      function k(g, i) {
        return new S.Promise(function(f, l) {
          var p = [], v = g._internalType, C = g._outputType, E = g._mimeType;
          g.on("data", function(P, T) {
            p.push(P), i && i(T);
          }).on("error", function(P) {
            p = [], l(P);
          }).on("end", function() {
            try {
              var P = function(T, L, z) {
                switch (T) {
                  case "blob":
                    return n.newBlob(n.transformTo("arraybuffer", L), z);
                  case "base64":
                    return d.encode(L);
                  default:
                    return n.transformTo(T, L);
                }
              }(C, function(T, L) {
                var z, D = 0, Y = null, x = 0;
                for (z = 0; z < L.length; z++) x += L[z].length;
                switch (T) {
                  case "string":
                    return L.join("");
                  case "array":
                    return Array.prototype.concat.apply([], L);
                  case "uint8array":
                    for (Y = new Uint8Array(x), z = 0; z < L.length; z++) Y.set(L[z], D), D += L[z].length;
                    return Y;
                  case "nodebuffer":
                    return Buffer.concat(L);
                  default:
                    throw new Error("concat : unsupported type '" + T + "'");
                }
              }(v, p), E);
              f(P);
            } catch (T) {
              l(T);
            }
            p = [];
          }).resume();
        });
      }
      function u(g, i, f) {
        var l = i;
        switch (i) {
          case "blob":
          case "arraybuffer":
            l = "uint8array";
            break;
          case "base64":
            l = "string";
        }
        try {
          this._internalType = l, this._outputType = i, this._mimeType = f, n.checkSupport(l), this._worker = g.pipe(new o(l)), g.lock();
        } catch (p) {
          this._worker = new s("error"), this._worker.error(p);
        }
      }
      u.prototype = { accumulate: function(g) {
        return k(this, g);
      }, on: function(g, i) {
        var f = this;
        return g === "data" ? this._worker.on(g, function(l) {
          i.call(f, l.data, l.meta);
        }) : this._worker.on(g, function() {
          n.delay(i, arguments, f);
        }), this;
      }, resume: function() {
        return n.delay(this._worker.resume, [], this._worker), this;
      }, pause: function() {
        return this._worker.pause(), this;
      }, toNodejsStream: function(g) {
        if (n.checkSupport("nodestream"), this._outputType !== "nodebuffer") throw new Error(this._outputType + " is not supported by this method");
        return new w(this, { objectMode: this._outputType !== "nodebuffer" }, g);
      } }, a.exports = u;
    }, { "../base64": 1, "../external": 6, "../nodejs/NodejsStreamOutputAdapter": 13, "../support": 30, "../utils": 32, "./ConvertWorker": 24, "./GenericWorker": 28 }], 30: [function(e, a, c) {
      if (c.base64 = !0, c.array = !0, c.string = !0, c.arraybuffer = typeof ArrayBuffer < "u" && typeof Uint8Array < "u", c.nodebuffer = typeof Buffer < "u", c.uint8array = typeof Uint8Array < "u", typeof ArrayBuffer > "u") c.blob = !1;
      else {
        var n = new ArrayBuffer(0);
        try {
          c.blob = new Blob([n], { type: "application/zip" }).size === 0;
        } catch {
          try {
            var o = new (self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder)();
            o.append(n), c.blob = o.getBlob("application/zip").size === 0;
          } catch {
            c.blob = !1;
          }
        }
      }
      try {
        c.nodestream = !!e("readable-stream").Readable;
      } catch {
        c.nodestream = !1;
      }
    }, { "readable-stream": 16 }], 31: [function(e, a, c) {
      for (var n = e("./utils"), o = e("./support"), s = e("./nodejsUtils"), d = e("./stream/GenericWorker"), _ = new Array(256), S = 0; S < 256; S++) _[S] = 252 <= S ? 6 : 248 <= S ? 5 : 240 <= S ? 4 : 224 <= S ? 3 : 192 <= S ? 2 : 1;
      _[254] = _[254] = 1;
      function w() {
        d.call(this, "utf-8 decode"), this.leftOver = null;
      }
      function k() {
        d.call(this, "utf-8 encode");
      }
      c.utf8encode = function(u) {
        return o.nodebuffer ? s.newBufferFrom(u, "utf-8") : function(g) {
          var i, f, l, p, v, C = g.length, E = 0;
          for (p = 0; p < C; p++) (64512 & (f = g.charCodeAt(p))) == 55296 && p + 1 < C && (64512 & (l = g.charCodeAt(p + 1))) == 56320 && (f = 65536 + (f - 55296 << 10) + (l - 56320), p++), E += f < 128 ? 1 : f < 2048 ? 2 : f < 65536 ? 3 : 4;
          for (i = o.uint8array ? new Uint8Array(E) : new Array(E), p = v = 0; v < E; p++) (64512 & (f = g.charCodeAt(p))) == 55296 && p + 1 < C && (64512 & (l = g.charCodeAt(p + 1))) == 56320 && (f = 65536 + (f - 55296 << 10) + (l - 56320), p++), f < 128 ? i[v++] = f : (f < 2048 ? i[v++] = 192 | f >>> 6 : (f < 65536 ? i[v++] = 224 | f >>> 12 : (i[v++] = 240 | f >>> 18, i[v++] = 128 | f >>> 12 & 63), i[v++] = 128 | f >>> 6 & 63), i[v++] = 128 | 63 & f);
          return i;
        }(u);
      }, c.utf8decode = function(u) {
        return o.nodebuffer ? n.transformTo("nodebuffer", u).toString("utf-8") : function(g) {
          var i, f, l, p, v = g.length, C = new Array(2 * v);
          for (i = f = 0; i < v; ) if ((l = g[i++]) < 128) C[f++] = l;
          else if (4 < (p = _[l])) C[f++] = 65533, i += p - 1;
          else {
            for (l &= p === 2 ? 31 : p === 3 ? 15 : 7; 1 < p && i < v; ) l = l << 6 | 63 & g[i++], p--;
            1 < p ? C[f++] = 65533 : l < 65536 ? C[f++] = l : (l -= 65536, C[f++] = 55296 | l >> 10 & 1023, C[f++] = 56320 | 1023 & l);
          }
          return C.length !== f && (C.subarray ? C = C.subarray(0, f) : C.length = f), n.applyFromCharCode(C);
        }(u = n.transformTo(o.uint8array ? "uint8array" : "array", u));
      }, n.inherits(w, d), w.prototype.processChunk = function(u) {
        var g = n.transformTo(o.uint8array ? "uint8array" : "array", u.data);
        if (this.leftOver && this.leftOver.length) {
          if (o.uint8array) {
            var i = g;
            (g = new Uint8Array(i.length + this.leftOver.length)).set(this.leftOver, 0), g.set(i, this.leftOver.length);
          } else g = this.leftOver.concat(g);
          this.leftOver = null;
        }
        var f = function(p, v) {
          var C;
          for ((v = v || p.length) > p.length && (v = p.length), C = v - 1; 0 <= C && (192 & p[C]) == 128; ) C--;
          return C < 0 || C === 0 ? v : C + _[p[C]] > v ? C : v;
        }(g), l = g;
        f !== g.length && (o.uint8array ? (l = g.subarray(0, f), this.leftOver = g.subarray(f, g.length)) : (l = g.slice(0, f), this.leftOver = g.slice(f, g.length))), this.push({ data: c.utf8decode(l), meta: u.meta });
      }, w.prototype.flush = function() {
        this.leftOver && this.leftOver.length && (this.push({ data: c.utf8decode(this.leftOver), meta: {} }), this.leftOver = null);
      }, c.Utf8DecodeWorker = w, n.inherits(k, d), k.prototype.processChunk = function(u) {
        this.push({ data: c.utf8encode(u.data), meta: u.meta });
      }, c.Utf8EncodeWorker = k;
    }, { "./nodejsUtils": 14, "./stream/GenericWorker": 28, "./support": 30, "./utils": 32 }], 32: [function(e, a, c) {
      var n = e("./support"), o = e("./base64"), s = e("./nodejsUtils"), d = e("./external");
      function _(i) {
        return i;
      }
      function S(i, f) {
        for (var l = 0; l < i.length; ++l) f[l] = 255 & i.charCodeAt(l);
        return f;
      }
      e("setimmediate"), c.newBlob = function(i, f) {
        c.checkSupport("blob");
        try {
          return new Blob([i], { type: f });
        } catch {
          try {
            var l = new (self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder)();
            return l.append(i), l.getBlob(f);
          } catch {
            throw new Error("Bug : can't construct the Blob.");
          }
        }
      };
      var w = { stringifyByChunk: function(i, f, l) {
        var p = [], v = 0, C = i.length;
        if (C <= l) return String.fromCharCode.apply(null, i);
        for (; v < C; ) f === "array" || f === "nodebuffer" ? p.push(String.fromCharCode.apply(null, i.slice(v, Math.min(v + l, C)))) : p.push(String.fromCharCode.apply(null, i.subarray(v, Math.min(v + l, C)))), v += l;
        return p.join("");
      }, stringifyByChar: function(i) {
        for (var f = "", l = 0; l < i.length; l++) f += String.fromCharCode(i[l]);
        return f;
      }, applyCanBeUsed: { uint8array: function() {
        try {
          return n.uint8array && String.fromCharCode.apply(null, new Uint8Array(1)).length === 1;
        } catch {
          return !1;
        }
      }(), nodebuffer: function() {
        try {
          return n.nodebuffer && String.fromCharCode.apply(null, s.allocBuffer(1)).length === 1;
        } catch {
          return !1;
        }
      }() } };
      function k(i) {
        var f = 65536, l = c.getTypeOf(i), p = !0;
        if (l === "uint8array" ? p = w.applyCanBeUsed.uint8array : l === "nodebuffer" && (p = w.applyCanBeUsed.nodebuffer), p) for (; 1 < f; ) try {
          return w.stringifyByChunk(i, l, f);
        } catch {
          f = Math.floor(f / 2);
        }
        return w.stringifyByChar(i);
      }
      function u(i, f) {
        for (var l = 0; l < i.length; l++) f[l] = i[l];
        return f;
      }
      c.applyFromCharCode = k;
      var g = {};
      g.string = { string: _, array: function(i) {
        return S(i, new Array(i.length));
      }, arraybuffer: function(i) {
        return g.string.uint8array(i).buffer;
      }, uint8array: function(i) {
        return S(i, new Uint8Array(i.length));
      }, nodebuffer: function(i) {
        return S(i, s.allocBuffer(i.length));
      } }, g.array = { string: k, array: _, arraybuffer: function(i) {
        return new Uint8Array(i).buffer;
      }, uint8array: function(i) {
        return new Uint8Array(i);
      }, nodebuffer: function(i) {
        return s.newBufferFrom(i);
      } }, g.arraybuffer = { string: function(i) {
        return k(new Uint8Array(i));
      }, array: function(i) {
        return u(new Uint8Array(i), new Array(i.byteLength));
      }, arraybuffer: _, uint8array: function(i) {
        return new Uint8Array(i);
      }, nodebuffer: function(i) {
        return s.newBufferFrom(new Uint8Array(i));
      } }, g.uint8array = { string: k, array: function(i) {
        return u(i, new Array(i.length));
      }, arraybuffer: function(i) {
        return i.buffer;
      }, uint8array: _, nodebuffer: function(i) {
        return s.newBufferFrom(i);
      } }, g.nodebuffer = { string: k, array: function(i) {
        return u(i, new Array(i.length));
      }, arraybuffer: function(i) {
        return g.nodebuffer.uint8array(i).buffer;
      }, uint8array: function(i) {
        return u(i, new Uint8Array(i.length));
      }, nodebuffer: _ }, c.transformTo = function(i, f) {
        if (f = f || "", !i) return f;
        c.checkSupport(i);
        var l = c.getTypeOf(f);
        return g[l][i](f);
      }, c.resolve = function(i) {
        for (var f = i.split("/"), l = [], p = 0; p < f.length; p++) {
          var v = f[p];
          v === "." || v === "" && p !== 0 && p !== f.length - 1 || (v === ".." ? l.pop() : l.push(v));
        }
        return l.join("/");
      }, c.getTypeOf = function(i) {
        return typeof i == "string" ? "string" : Object.prototype.toString.call(i) === "[object Array]" ? "array" : n.nodebuffer && s.isBuffer(i) ? "nodebuffer" : n.uint8array && i instanceof Uint8Array ? "uint8array" : n.arraybuffer && i instanceof ArrayBuffer ? "arraybuffer" : void 0;
      }, c.checkSupport = function(i) {
        if (!n[i.toLowerCase()]) throw new Error(i + " is not supported by this platform");
      }, c.MAX_VALUE_16BITS = 65535, c.MAX_VALUE_32BITS = -1, c.pretty = function(i) {
        var f, l, p = "";
        for (l = 0; l < (i || "").length; l++) p += "\\x" + ((f = i.charCodeAt(l)) < 16 ? "0" : "") + f.toString(16).toUpperCase();
        return p;
      }, c.delay = function(i, f, l) {
        setImmediate(function() {
          i.apply(l || null, f || []);
        });
      }, c.inherits = function(i, f) {
        function l() {
        }
        l.prototype = f.prototype, i.prototype = new l();
      }, c.extend = function() {
        var i, f, l = {};
        for (i = 0; i < arguments.length; i++) for (f in arguments[i]) Object.prototype.hasOwnProperty.call(arguments[i], f) && l[f] === void 0 && (l[f] = arguments[i][f]);
        return l;
      }, c.prepareContent = function(i, f, l, p, v) {
        return d.Promise.resolve(f).then(function(C) {
          return n.blob && (C instanceof Blob || ["[object File]", "[object Blob]"].indexOf(Object.prototype.toString.call(C)) !== -1) && typeof FileReader < "u" ? new d.Promise(function(E, P) {
            var T = new FileReader();
            T.onload = function(L) {
              E(L.target.result);
            }, T.onerror = function(L) {
              P(L.target.error);
            }, T.readAsArrayBuffer(C);
          }) : C;
        }).then(function(C) {
          var E = c.getTypeOf(C);
          return E ? (E === "arraybuffer" ? C = c.transformTo("uint8array", C) : E === "string" && (v ? C = o.decode(C) : l && p !== !0 && (C = function(P) {
            return S(P, n.uint8array ? new Uint8Array(P.length) : new Array(P.length));
          }(C))), C) : d.Promise.reject(new Error("Can't read the data of '" + i + "'. Is it in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?"));
        });
      };
    }, { "./base64": 1, "./external": 6, "./nodejsUtils": 14, "./support": 30, setimmediate: 54 }], 33: [function(e, a, c) {
      var n = e("./reader/readerFor"), o = e("./utils"), s = e("./signature"), d = e("./zipEntry"), _ = e("./support");
      function S(w) {
        this.files = [], this.loadOptions = w;
      }
      S.prototype = { checkSignature: function(w) {
        if (!this.reader.readAndCheckSignature(w)) {
          this.reader.index -= 4;
          var k = this.reader.readString(4);
          throw new Error("Corrupted zip or bug: unexpected signature (" + o.pretty(k) + ", expected " + o.pretty(w) + ")");
        }
      }, isSignature: function(w, k) {
        var u = this.reader.index;
        this.reader.setIndex(w);
        var g = this.reader.readString(4) === k;
        return this.reader.setIndex(u), g;
      }, readBlockEndOfCentral: function() {
        this.diskNumber = this.reader.readInt(2), this.diskWithCentralDirStart = this.reader.readInt(2), this.centralDirRecordsOnThisDisk = this.reader.readInt(2), this.centralDirRecords = this.reader.readInt(2), this.centralDirSize = this.reader.readInt(4), this.centralDirOffset = this.reader.readInt(4), this.zipCommentLength = this.reader.readInt(2);
        var w = this.reader.readData(this.zipCommentLength), k = _.uint8array ? "uint8array" : "array", u = o.transformTo(k, w);
        this.zipComment = this.loadOptions.decodeFileName(u);
      }, readBlockZip64EndOfCentral: function() {
        this.zip64EndOfCentralSize = this.reader.readInt(8), this.reader.skip(4), this.diskNumber = this.reader.readInt(4), this.diskWithCentralDirStart = this.reader.readInt(4), this.centralDirRecordsOnThisDisk = this.reader.readInt(8), this.centralDirRecords = this.reader.readInt(8), this.centralDirSize = this.reader.readInt(8), this.centralDirOffset = this.reader.readInt(8), this.zip64ExtensibleData = {};
        for (var w, k, u, g = this.zip64EndOfCentralSize - 44; 0 < g; ) w = this.reader.readInt(2), k = this.reader.readInt(4), u = this.reader.readData(k), this.zip64ExtensibleData[w] = { id: w, length: k, value: u };
      }, readBlockZip64EndOfCentralLocator: function() {
        if (this.diskWithZip64CentralDirStart = this.reader.readInt(4), this.relativeOffsetEndOfZip64CentralDir = this.reader.readInt(8), this.disksCount = this.reader.readInt(4), 1 < this.disksCount) throw new Error("Multi-volumes zip are not supported");
      }, readLocalFiles: function() {
        var w, k;
        for (w = 0; w < this.files.length; w++) k = this.files[w], this.reader.setIndex(k.localHeaderOffset), this.checkSignature(s.LOCAL_FILE_HEADER), k.readLocalPart(this.reader), k.handleUTF8(), k.processAttributes();
      }, readCentralDir: function() {
        var w;
        for (this.reader.setIndex(this.centralDirOffset); this.reader.readAndCheckSignature(s.CENTRAL_FILE_HEADER); ) (w = new d({ zip64: this.zip64 }, this.loadOptions)).readCentralPart(this.reader), this.files.push(w);
        if (this.centralDirRecords !== this.files.length && this.centralDirRecords !== 0 && this.files.length === 0) throw new Error("Corrupted zip or bug: expected " + this.centralDirRecords + " records in central dir, got " + this.files.length);
      }, readEndOfCentral: function() {
        var w = this.reader.lastIndexOfSignature(s.CENTRAL_DIRECTORY_END);
        if (w < 0) throw this.isSignature(0, s.LOCAL_FILE_HEADER) ? new Error("Corrupted zip: can't find end of central directory") : new Error("Can't find end of central directory : is this a zip file ? If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html");
        this.reader.setIndex(w);
        var k = w;
        if (this.checkSignature(s.CENTRAL_DIRECTORY_END), this.readBlockEndOfCentral(), this.diskNumber === o.MAX_VALUE_16BITS || this.diskWithCentralDirStart === o.MAX_VALUE_16BITS || this.centralDirRecordsOnThisDisk === o.MAX_VALUE_16BITS || this.centralDirRecords === o.MAX_VALUE_16BITS || this.centralDirSize === o.MAX_VALUE_32BITS || this.centralDirOffset === o.MAX_VALUE_32BITS) {
          if (this.zip64 = !0, (w = this.reader.lastIndexOfSignature(s.ZIP64_CENTRAL_DIRECTORY_LOCATOR)) < 0) throw new Error("Corrupted zip: can't find the ZIP64 end of central directory locator");
          if (this.reader.setIndex(w), this.checkSignature(s.ZIP64_CENTRAL_DIRECTORY_LOCATOR), this.readBlockZip64EndOfCentralLocator(), !this.isSignature(this.relativeOffsetEndOfZip64CentralDir, s.ZIP64_CENTRAL_DIRECTORY_END) && (this.relativeOffsetEndOfZip64CentralDir = this.reader.lastIndexOfSignature(s.ZIP64_CENTRAL_DIRECTORY_END), this.relativeOffsetEndOfZip64CentralDir < 0)) throw new Error("Corrupted zip: can't find the ZIP64 end of central directory");
          this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir), this.checkSignature(s.ZIP64_CENTRAL_DIRECTORY_END), this.readBlockZip64EndOfCentral();
        }
        var u = this.centralDirOffset + this.centralDirSize;
        this.zip64 && (u += 20, u += 12 + this.zip64EndOfCentralSize);
        var g = k - u;
        if (0 < g) this.isSignature(k, s.CENTRAL_FILE_HEADER) || (this.reader.zero = g);
        else if (g < 0) throw new Error("Corrupted zip: missing " + Math.abs(g) + " bytes.");
      }, prepareReader: function(w) {
        this.reader = n(w);
      }, load: function(w) {
        this.prepareReader(w), this.readEndOfCentral(), this.readCentralDir(), this.readLocalFiles();
      } }, a.exports = S;
    }, { "./reader/readerFor": 22, "./signature": 23, "./support": 30, "./utils": 32, "./zipEntry": 34 }], 34: [function(e, a, c) {
      var n = e("./reader/readerFor"), o = e("./utils"), s = e("./compressedObject"), d = e("./crc32"), _ = e("./utf8"), S = e("./compressions"), w = e("./support");
      function k(u, g) {
        this.options = u, this.loadOptions = g;
      }
      k.prototype = { isEncrypted: function() {
        return (1 & this.bitFlag) == 1;
      }, useUTF8: function() {
        return (2048 & this.bitFlag) == 2048;
      }, readLocalPart: function(u) {
        var g, i;
        if (u.skip(22), this.fileNameLength = u.readInt(2), i = u.readInt(2), this.fileName = u.readData(this.fileNameLength), u.skip(i), this.compressedSize === -1 || this.uncompressedSize === -1) throw new Error("Bug or corrupted zip : didn't get enough information from the central directory (compressedSize === -1 || uncompressedSize === -1)");
        if ((g = function(f) {
          for (var l in S) if (Object.prototype.hasOwnProperty.call(S, l) && S[l].magic === f) return S[l];
          return null;
        }(this.compressionMethod)) === null) throw new Error("Corrupted zip : compression " + o.pretty(this.compressionMethod) + " unknown (inner file : " + o.transformTo("string", this.fileName) + ")");
        this.decompressed = new s(this.compressedSize, this.uncompressedSize, this.crc32, g, u.readData(this.compressedSize));
      }, readCentralPart: function(u) {
        this.versionMadeBy = u.readInt(2), u.skip(2), this.bitFlag = u.readInt(2), this.compressionMethod = u.readString(2), this.date = u.readDate(), this.crc32 = u.readInt(4), this.compressedSize = u.readInt(4), this.uncompressedSize = u.readInt(4);
        var g = u.readInt(2);
        if (this.extraFieldsLength = u.readInt(2), this.fileCommentLength = u.readInt(2), this.diskNumberStart = u.readInt(2), this.internalFileAttributes = u.readInt(2), this.externalFileAttributes = u.readInt(4), this.localHeaderOffset = u.readInt(4), this.isEncrypted()) throw new Error("Encrypted zip are not supported");
        u.skip(g), this.readExtraFields(u), this.parseZIP64ExtraField(u), this.fileComment = u.readData(this.fileCommentLength);
      }, processAttributes: function() {
        this.unixPermissions = null, this.dosPermissions = null;
        var u = this.versionMadeBy >> 8;
        this.dir = !!(16 & this.externalFileAttributes), u == 0 && (this.dosPermissions = 63 & this.externalFileAttributes), u == 3 && (this.unixPermissions = this.externalFileAttributes >> 16 & 65535), this.dir || this.fileNameStr.slice(-1) !== "/" || (this.dir = !0);
      }, parseZIP64ExtraField: function() {
        if (this.extraFields[1]) {
          var u = n(this.extraFields[1].value);
          this.uncompressedSize === o.MAX_VALUE_32BITS && (this.uncompressedSize = u.readInt(8)), this.compressedSize === o.MAX_VALUE_32BITS && (this.compressedSize = u.readInt(8)), this.localHeaderOffset === o.MAX_VALUE_32BITS && (this.localHeaderOffset = u.readInt(8)), this.diskNumberStart === o.MAX_VALUE_32BITS && (this.diskNumberStart = u.readInt(4));
        }
      }, readExtraFields: function(u) {
        var g, i, f, l = u.index + this.extraFieldsLength;
        for (this.extraFields || (this.extraFields = {}); u.index + 4 < l; ) g = u.readInt(2), i = u.readInt(2), f = u.readData(i), this.extraFields[g] = { id: g, length: i, value: f };
        u.setIndex(l);
      }, handleUTF8: function() {
        var u = w.uint8array ? "uint8array" : "array";
        if (this.useUTF8()) this.fileNameStr = _.utf8decode(this.fileName), this.fileCommentStr = _.utf8decode(this.fileComment);
        else {
          var g = this.findExtraFieldUnicodePath();
          if (g !== null) this.fileNameStr = g;
          else {
            var i = o.transformTo(u, this.fileName);
            this.fileNameStr = this.loadOptions.decodeFileName(i);
          }
          var f = this.findExtraFieldUnicodeComment();
          if (f !== null) this.fileCommentStr = f;
          else {
            var l = o.transformTo(u, this.fileComment);
            this.fileCommentStr = this.loadOptions.decodeFileName(l);
          }
        }
      }, findExtraFieldUnicodePath: function() {
        var u = this.extraFields[28789];
        if (u) {
          var g = n(u.value);
          return g.readInt(1) !== 1 || d(this.fileName) !== g.readInt(4) ? null : _.utf8decode(g.readData(u.length - 5));
        }
        return null;
      }, findExtraFieldUnicodeComment: function() {
        var u = this.extraFields[25461];
        if (u) {
          var g = n(u.value);
          return g.readInt(1) !== 1 || d(this.fileComment) !== g.readInt(4) ? null : _.utf8decode(g.readData(u.length - 5));
        }
        return null;
      } }, a.exports = k;
    }, { "./compressedObject": 2, "./compressions": 3, "./crc32": 4, "./reader/readerFor": 22, "./support": 30, "./utf8": 31, "./utils": 32 }], 35: [function(e, a, c) {
      function n(g, i, f) {
        this.name = g, this.dir = f.dir, this.date = f.date, this.comment = f.comment, this.unixPermissions = f.unixPermissions, this.dosPermissions = f.dosPermissions, this._data = i, this._dataBinary = f.binary, this.options = { compression: f.compression, compressionOptions: f.compressionOptions };
      }
      var o = e("./stream/StreamHelper"), s = e("./stream/DataWorker"), d = e("./utf8"), _ = e("./compressedObject"), S = e("./stream/GenericWorker");
      n.prototype = { internalStream: function(g) {
        var i = null, f = "string";
        try {
          if (!g) throw new Error("No output type specified.");
          var l = (f = g.toLowerCase()) === "string" || f === "text";
          f !== "binarystring" && f !== "text" || (f = "string"), i = this._decompressWorker();
          var p = !this._dataBinary;
          p && !l && (i = i.pipe(new d.Utf8EncodeWorker())), !p && l && (i = i.pipe(new d.Utf8DecodeWorker()));
        } catch (v) {
          (i = new S("error")).error(v);
        }
        return new o(i, f, "");
      }, async: function(g, i) {
        return this.internalStream(g).accumulate(i);
      }, nodeStream: function(g, i) {
        return this.internalStream(g || "nodebuffer").toNodejsStream(i);
      }, _compressWorker: function(g, i) {
        if (this._data instanceof _ && this._data.compression.magic === g.magic) return this._data.getCompressedWorker();
        var f = this._decompressWorker();
        return this._dataBinary || (f = f.pipe(new d.Utf8EncodeWorker())), _.createWorkerFrom(f, g, i);
      }, _decompressWorker: function() {
        return this._data instanceof _ ? this._data.getContentWorker() : this._data instanceof S ? this._data : new s(this._data);
      } };
      for (var w = ["asText", "asBinary", "asNodeBuffer", "asUint8Array", "asArrayBuffer"], k = function() {
        throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
      }, u = 0; u < w.length; u++) n.prototype[w[u]] = k;
      a.exports = n;
    }, { "./compressedObject": 2, "./stream/DataWorker": 27, "./stream/GenericWorker": 28, "./stream/StreamHelper": 29, "./utf8": 31 }], 36: [function(e, a, c) {
      (function(n) {
        var o, s, d = n.MutationObserver || n.WebKitMutationObserver;
        if (d) {
          var _ = 0, S = new d(g), w = n.document.createTextNode("");
          S.observe(w, { characterData: !0 }), o = function() {
            w.data = _ = ++_ % 2;
          };
        } else if (n.setImmediate || n.MessageChannel === void 0) o = "document" in n && "onreadystatechange" in n.document.createElement("script") ? function() {
          var i = n.document.createElement("script");
          i.onreadystatechange = function() {
            g(), i.onreadystatechange = null, i.parentNode.removeChild(i), i = null;
          }, n.document.documentElement.appendChild(i);
        } : function() {
          setTimeout(g, 0);
        };
        else {
          var k = new n.MessageChannel();
          k.port1.onmessage = g, o = function() {
            k.port2.postMessage(0);
          };
        }
        var u = [];
        function g() {
          var i, f;
          s = !0;
          for (var l = u.length; l; ) {
            for (f = u, u = [], i = -1; ++i < l; ) f[i]();
            l = u.length;
          }
          s = !1;
        }
        a.exports = function(i) {
          u.push(i) !== 1 || s || o();
        };
      }).call(this, typeof At < "u" ? At : typeof self < "u" ? self : typeof window < "u" ? window : {});
    }, {}], 37: [function(e, a, c) {
      var n = e("immediate");
      function o() {
      }
      var s = {}, d = ["REJECTED"], _ = ["FULFILLED"], S = ["PENDING"];
      function w(l) {
        if (typeof l != "function") throw new TypeError("resolver must be a function");
        this.state = S, this.queue = [], this.outcome = void 0, l !== o && i(this, l);
      }
      function k(l, p, v) {
        this.promise = l, typeof p == "function" && (this.onFulfilled = p, this.callFulfilled = this.otherCallFulfilled), typeof v == "function" && (this.onRejected = v, this.callRejected = this.otherCallRejected);
      }
      function u(l, p, v) {
        n(function() {
          var C;
          try {
            C = p(v);
          } catch (E) {
            return s.reject(l, E);
          }
          C === l ? s.reject(l, new TypeError("Cannot resolve promise with itself")) : s.resolve(l, C);
        });
      }
      function g(l) {
        var p = l && l.then;
        if (l && (typeof l == "object" || typeof l == "function") && typeof p == "function") return function() {
          p.apply(l, arguments);
        };
      }
      function i(l, p) {
        var v = !1;
        function C(T) {
          v || (v = !0, s.reject(l, T));
        }
        function E(T) {
          v || (v = !0, s.resolve(l, T));
        }
        var P = f(function() {
          p(E, C);
        });
        P.status === "error" && C(P.value);
      }
      function f(l, p) {
        var v = {};
        try {
          v.value = l(p), v.status = "success";
        } catch (C) {
          v.status = "error", v.value = C;
        }
        return v;
      }
      (a.exports = w).prototype.finally = function(l) {
        if (typeof l != "function") return this;
        var p = this.constructor;
        return this.then(function(v) {
          return p.resolve(l()).then(function() {
            return v;
          });
        }, function(v) {
          return p.resolve(l()).then(function() {
            throw v;
          });
        });
      }, w.prototype.catch = function(l) {
        return this.then(null, l);
      }, w.prototype.then = function(l, p) {
        if (typeof l != "function" && this.state === _ || typeof p != "function" && this.state === d) return this;
        var v = new this.constructor(o);
        return this.state !== S ? u(v, this.state === _ ? l : p, this.outcome) : this.queue.push(new k(v, l, p)), v;
      }, k.prototype.callFulfilled = function(l) {
        s.resolve(this.promise, l);
      }, k.prototype.otherCallFulfilled = function(l) {
        u(this.promise, this.onFulfilled, l);
      }, k.prototype.callRejected = function(l) {
        s.reject(this.promise, l);
      }, k.prototype.otherCallRejected = function(l) {
        u(this.promise, this.onRejected, l);
      }, s.resolve = function(l, p) {
        var v = f(g, p);
        if (v.status === "error") return s.reject(l, v.value);
        var C = v.value;
        if (C) i(l, C);
        else {
          l.state = _, l.outcome = p;
          for (var E = -1, P = l.queue.length; ++E < P; ) l.queue[E].callFulfilled(p);
        }
        return l;
      }, s.reject = function(l, p) {
        l.state = d, l.outcome = p;
        for (var v = -1, C = l.queue.length; ++v < C; ) l.queue[v].callRejected(p);
        return l;
      }, w.resolve = function(l) {
        return l instanceof this ? l : s.resolve(new this(o), l);
      }, w.reject = function(l) {
        var p = new this(o);
        return s.reject(p, l);
      }, w.all = function(l) {
        var p = this;
        if (Object.prototype.toString.call(l) !== "[object Array]") return this.reject(new TypeError("must be an array"));
        var v = l.length, C = !1;
        if (!v) return this.resolve([]);
        for (var E = new Array(v), P = 0, T = -1, L = new this(o); ++T < v; ) z(l[T], T);
        return L;
        function z(D, Y) {
          p.resolve(D).then(function(x) {
            E[Y] = x, ++P !== v || C || (C = !0, s.resolve(L, E));
          }, function(x) {
            C || (C = !0, s.reject(L, x));
          });
        }
      }, w.race = function(l) {
        var p = this;
        if (Object.prototype.toString.call(l) !== "[object Array]") return this.reject(new TypeError("must be an array"));
        var v = l.length, C = !1;
        if (!v) return this.resolve([]);
        for (var E = -1, P = new this(o); ++E < v; ) T = l[E], p.resolve(T).then(function(L) {
          C || (C = !0, s.resolve(P, L));
        }, function(L) {
          C || (C = !0, s.reject(P, L));
        });
        var T;
        return P;
      };
    }, { immediate: 36 }], 38: [function(e, a, c) {
      var n = {};
      (0, e("./lib/utils/common").assign)(n, e("./lib/deflate"), e("./lib/inflate"), e("./lib/zlib/constants")), a.exports = n;
    }, { "./lib/deflate": 39, "./lib/inflate": 40, "./lib/utils/common": 41, "./lib/zlib/constants": 44 }], 39: [function(e, a, c) {
      var n = e("./zlib/deflate"), o = e("./utils/common"), s = e("./utils/strings"), d = e("./zlib/messages"), _ = e("./zlib/zstream"), S = Object.prototype.toString, w = 0, k = -1, u = 0, g = 8;
      function i(l) {
        if (!(this instanceof i)) return new i(l);
        this.options = o.assign({ level: k, method: g, chunkSize: 16384, windowBits: 15, memLevel: 8, strategy: u, to: "" }, l || {});
        var p = this.options;
        p.raw && 0 < p.windowBits ? p.windowBits = -p.windowBits : p.gzip && 0 < p.windowBits && p.windowBits < 16 && (p.windowBits += 16), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new _(), this.strm.avail_out = 0;
        var v = n.deflateInit2(this.strm, p.level, p.method, p.windowBits, p.memLevel, p.strategy);
        if (v !== w) throw new Error(d[v]);
        if (p.header && n.deflateSetHeader(this.strm, p.header), p.dictionary) {
          var C;
          if (C = typeof p.dictionary == "string" ? s.string2buf(p.dictionary) : S.call(p.dictionary) === "[object ArrayBuffer]" ? new Uint8Array(p.dictionary) : p.dictionary, (v = n.deflateSetDictionary(this.strm, C)) !== w) throw new Error(d[v]);
          this._dict_set = !0;
        }
      }
      function f(l, p) {
        var v = new i(p);
        if (v.push(l, !0), v.err) throw v.msg || d[v.err];
        return v.result;
      }
      i.prototype.push = function(l, p) {
        var v, C, E = this.strm, P = this.options.chunkSize;
        if (this.ended) return !1;
        C = p === ~~p ? p : p === !0 ? 4 : 0, typeof l == "string" ? E.input = s.string2buf(l) : S.call(l) === "[object ArrayBuffer]" ? E.input = new Uint8Array(l) : E.input = l, E.next_in = 0, E.avail_in = E.input.length;
        do {
          if (E.avail_out === 0 && (E.output = new o.Buf8(P), E.next_out = 0, E.avail_out = P), (v = n.deflate(E, C)) !== 1 && v !== w) return this.onEnd(v), !(this.ended = !0);
          E.avail_out !== 0 && (E.avail_in !== 0 || C !== 4 && C !== 2) || (this.options.to === "string" ? this.onData(s.buf2binstring(o.shrinkBuf(E.output, E.next_out))) : this.onData(o.shrinkBuf(E.output, E.next_out)));
        } while ((0 < E.avail_in || E.avail_out === 0) && v !== 1);
        return C === 4 ? (v = n.deflateEnd(this.strm), this.onEnd(v), this.ended = !0, v === w) : C !== 2 || (this.onEnd(w), !(E.avail_out = 0));
      }, i.prototype.onData = function(l) {
        this.chunks.push(l);
      }, i.prototype.onEnd = function(l) {
        l === w && (this.options.to === "string" ? this.result = this.chunks.join("") : this.result = o.flattenChunks(this.chunks)), this.chunks = [], this.err = l, this.msg = this.strm.msg;
      }, c.Deflate = i, c.deflate = f, c.deflateRaw = function(l, p) {
        return (p = p || {}).raw = !0, f(l, p);
      }, c.gzip = function(l, p) {
        return (p = p || {}).gzip = !0, f(l, p);
      };
    }, { "./utils/common": 41, "./utils/strings": 42, "./zlib/deflate": 46, "./zlib/messages": 51, "./zlib/zstream": 53 }], 40: [function(e, a, c) {
      var n = e("./zlib/inflate"), o = e("./utils/common"), s = e("./utils/strings"), d = e("./zlib/constants"), _ = e("./zlib/messages"), S = e("./zlib/zstream"), w = e("./zlib/gzheader"), k = Object.prototype.toString;
      function u(i) {
        if (!(this instanceof u)) return new u(i);
        this.options = o.assign({ chunkSize: 16384, windowBits: 0, to: "" }, i || {});
        var f = this.options;
        f.raw && 0 <= f.windowBits && f.windowBits < 16 && (f.windowBits = -f.windowBits, f.windowBits === 0 && (f.windowBits = -15)), !(0 <= f.windowBits && f.windowBits < 16) || i && i.windowBits || (f.windowBits += 32), 15 < f.windowBits && f.windowBits < 48 && !(15 & f.windowBits) && (f.windowBits |= 15), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new S(), this.strm.avail_out = 0;
        var l = n.inflateInit2(this.strm, f.windowBits);
        if (l !== d.Z_OK) throw new Error(_[l]);
        this.header = new w(), n.inflateGetHeader(this.strm, this.header);
      }
      function g(i, f) {
        var l = new u(f);
        if (l.push(i, !0), l.err) throw l.msg || _[l.err];
        return l.result;
      }
      u.prototype.push = function(i, f) {
        var l, p, v, C, E, P, T = this.strm, L = this.options.chunkSize, z = this.options.dictionary, D = !1;
        if (this.ended) return !1;
        p = f === ~~f ? f : f === !0 ? d.Z_FINISH : d.Z_NO_FLUSH, typeof i == "string" ? T.input = s.binstring2buf(i) : k.call(i) === "[object ArrayBuffer]" ? T.input = new Uint8Array(i) : T.input = i, T.next_in = 0, T.avail_in = T.input.length;
        do {
          if (T.avail_out === 0 && (T.output = new o.Buf8(L), T.next_out = 0, T.avail_out = L), (l = n.inflate(T, d.Z_NO_FLUSH)) === d.Z_NEED_DICT && z && (P = typeof z == "string" ? s.string2buf(z) : k.call(z) === "[object ArrayBuffer]" ? new Uint8Array(z) : z, l = n.inflateSetDictionary(this.strm, P)), l === d.Z_BUF_ERROR && D === !0 && (l = d.Z_OK, D = !1), l !== d.Z_STREAM_END && l !== d.Z_OK) return this.onEnd(l), !(this.ended = !0);
          T.next_out && (T.avail_out !== 0 && l !== d.Z_STREAM_END && (T.avail_in !== 0 || p !== d.Z_FINISH && p !== d.Z_SYNC_FLUSH) || (this.options.to === "string" ? (v = s.utf8border(T.output, T.next_out), C = T.next_out - v, E = s.buf2string(T.output, v), T.next_out = C, T.avail_out = L - C, C && o.arraySet(T.output, T.output, v, C, 0), this.onData(E)) : this.onData(o.shrinkBuf(T.output, T.next_out)))), T.avail_in === 0 && T.avail_out === 0 && (D = !0);
        } while ((0 < T.avail_in || T.avail_out === 0) && l !== d.Z_STREAM_END);
        return l === d.Z_STREAM_END && (p = d.Z_FINISH), p === d.Z_FINISH ? (l = n.inflateEnd(this.strm), this.onEnd(l), this.ended = !0, l === d.Z_OK) : p !== d.Z_SYNC_FLUSH || (this.onEnd(d.Z_OK), !(T.avail_out = 0));
      }, u.prototype.onData = function(i) {
        this.chunks.push(i);
      }, u.prototype.onEnd = function(i) {
        i === d.Z_OK && (this.options.to === "string" ? this.result = this.chunks.join("") : this.result = o.flattenChunks(this.chunks)), this.chunks = [], this.err = i, this.msg = this.strm.msg;
      }, c.Inflate = u, c.inflate = g, c.inflateRaw = function(i, f) {
        return (f = f || {}).raw = !0, g(i, f);
      }, c.ungzip = g;
    }, { "./utils/common": 41, "./utils/strings": 42, "./zlib/constants": 44, "./zlib/gzheader": 47, "./zlib/inflate": 49, "./zlib/messages": 51, "./zlib/zstream": 53 }], 41: [function(e, a, c) {
      var n = typeof Uint8Array < "u" && typeof Uint16Array < "u" && typeof Int32Array < "u";
      c.assign = function(d) {
        for (var _ = Array.prototype.slice.call(arguments, 1); _.length; ) {
          var S = _.shift();
          if (S) {
            if (typeof S != "object") throw new TypeError(S + "must be non-object");
            for (var w in S) S.hasOwnProperty(w) && (d[w] = S[w]);
          }
        }
        return d;
      }, c.shrinkBuf = function(d, _) {
        return d.length === _ ? d : d.subarray ? d.subarray(0, _) : (d.length = _, d);
      };
      var o = { arraySet: function(d, _, S, w, k) {
        if (_.subarray && d.subarray) d.set(_.subarray(S, S + w), k);
        else for (var u = 0; u < w; u++) d[k + u] = _[S + u];
      }, flattenChunks: function(d) {
        var _, S, w, k, u, g;
        for (_ = w = 0, S = d.length; _ < S; _++) w += d[_].length;
        for (g = new Uint8Array(w), _ = k = 0, S = d.length; _ < S; _++) u = d[_], g.set(u, k), k += u.length;
        return g;
      } }, s = { arraySet: function(d, _, S, w, k) {
        for (var u = 0; u < w; u++) d[k + u] = _[S + u];
      }, flattenChunks: function(d) {
        return [].concat.apply([], d);
      } };
      c.setTyped = function(d) {
        d ? (c.Buf8 = Uint8Array, c.Buf16 = Uint16Array, c.Buf32 = Int32Array, c.assign(c, o)) : (c.Buf8 = Array, c.Buf16 = Array, c.Buf32 = Array, c.assign(c, s));
      }, c.setTyped(n);
    }, {}], 42: [function(e, a, c) {
      var n = e("./common"), o = !0, s = !0;
      try {
        String.fromCharCode.apply(null, [0]);
      } catch {
        o = !1;
      }
      try {
        String.fromCharCode.apply(null, new Uint8Array(1));
      } catch {
        s = !1;
      }
      for (var d = new n.Buf8(256), _ = 0; _ < 256; _++) d[_] = 252 <= _ ? 6 : 248 <= _ ? 5 : 240 <= _ ? 4 : 224 <= _ ? 3 : 192 <= _ ? 2 : 1;
      function S(w, k) {
        if (k < 65537 && (w.subarray && s || !w.subarray && o)) return String.fromCharCode.apply(null, n.shrinkBuf(w, k));
        for (var u = "", g = 0; g < k; g++) u += String.fromCharCode(w[g]);
        return u;
      }
      d[254] = d[254] = 1, c.string2buf = function(w) {
        var k, u, g, i, f, l = w.length, p = 0;
        for (i = 0; i < l; i++) (64512 & (u = w.charCodeAt(i))) == 55296 && i + 1 < l && (64512 & (g = w.charCodeAt(i + 1))) == 56320 && (u = 65536 + (u - 55296 << 10) + (g - 56320), i++), p += u < 128 ? 1 : u < 2048 ? 2 : u < 65536 ? 3 : 4;
        for (k = new n.Buf8(p), i = f = 0; f < p; i++) (64512 & (u = w.charCodeAt(i))) == 55296 && i + 1 < l && (64512 & (g = w.charCodeAt(i + 1))) == 56320 && (u = 65536 + (u - 55296 << 10) + (g - 56320), i++), u < 128 ? k[f++] = u : (u < 2048 ? k[f++] = 192 | u >>> 6 : (u < 65536 ? k[f++] = 224 | u >>> 12 : (k[f++] = 240 | u >>> 18, k[f++] = 128 | u >>> 12 & 63), k[f++] = 128 | u >>> 6 & 63), k[f++] = 128 | 63 & u);
        return k;
      }, c.buf2binstring = function(w) {
        return S(w, w.length);
      }, c.binstring2buf = function(w) {
        for (var k = new n.Buf8(w.length), u = 0, g = k.length; u < g; u++) k[u] = w.charCodeAt(u);
        return k;
      }, c.buf2string = function(w, k) {
        var u, g, i, f, l = k || w.length, p = new Array(2 * l);
        for (u = g = 0; u < l; ) if ((i = w[u++]) < 128) p[g++] = i;
        else if (4 < (f = d[i])) p[g++] = 65533, u += f - 1;
        else {
          for (i &= f === 2 ? 31 : f === 3 ? 15 : 7; 1 < f && u < l; ) i = i << 6 | 63 & w[u++], f--;
          1 < f ? p[g++] = 65533 : i < 65536 ? p[g++] = i : (i -= 65536, p[g++] = 55296 | i >> 10 & 1023, p[g++] = 56320 | 1023 & i);
        }
        return S(p, g);
      }, c.utf8border = function(w, k) {
        var u;
        for ((k = k || w.length) > w.length && (k = w.length), u = k - 1; 0 <= u && (192 & w[u]) == 128; ) u--;
        return u < 0 || u === 0 ? k : u + d[w[u]] > k ? u : k;
      };
    }, { "./common": 41 }], 43: [function(e, a, c) {
      a.exports = function(n, o, s, d) {
        for (var _ = 65535 & n | 0, S = n >>> 16 & 65535 | 0, w = 0; s !== 0; ) {
          for (s -= w = 2e3 < s ? 2e3 : s; S = S + (_ = _ + o[d++] | 0) | 0, --w; ) ;
          _ %= 65521, S %= 65521;
        }
        return _ | S << 16 | 0;
      };
    }, {}], 44: [function(e, a, c) {
      a.exports = { Z_NO_FLUSH: 0, Z_PARTIAL_FLUSH: 1, Z_SYNC_FLUSH: 2, Z_FULL_FLUSH: 3, Z_FINISH: 4, Z_BLOCK: 5, Z_TREES: 6, Z_OK: 0, Z_STREAM_END: 1, Z_NEED_DICT: 2, Z_ERRNO: -1, Z_STREAM_ERROR: -2, Z_DATA_ERROR: -3, Z_BUF_ERROR: -5, Z_NO_COMPRESSION: 0, Z_BEST_SPEED: 1, Z_BEST_COMPRESSION: 9, Z_DEFAULT_COMPRESSION: -1, Z_FILTERED: 1, Z_HUFFMAN_ONLY: 2, Z_RLE: 3, Z_FIXED: 4, Z_DEFAULT_STRATEGY: 0, Z_BINARY: 0, Z_TEXT: 1, Z_UNKNOWN: 2, Z_DEFLATED: 8 };
    }, {}], 45: [function(e, a, c) {
      var n = function() {
        for (var o, s = [], d = 0; d < 256; d++) {
          o = d;
          for (var _ = 0; _ < 8; _++) o = 1 & o ? 3988292384 ^ o >>> 1 : o >>> 1;
          s[d] = o;
        }
        return s;
      }();
      a.exports = function(o, s, d, _) {
        var S = n, w = _ + d;
        o ^= -1;
        for (var k = _; k < w; k++) o = o >>> 8 ^ S[255 & (o ^ s[k])];
        return -1 ^ o;
      };
    }, {}], 46: [function(e, a, c) {
      var n, o = e("../utils/common"), s = e("./trees"), d = e("./adler32"), _ = e("./crc32"), S = e("./messages"), w = 0, k = 4, u = 0, g = -2, i = -1, f = 4, l = 2, p = 8, v = 9, C = 286, E = 30, P = 19, T = 2 * C + 1, L = 15, z = 3, D = 258, Y = D + z + 1, x = 42, O = 113, r = 1, R = 2, X = 3, j = 4;
      function tt(t, U) {
        return t.msg = S[U], U;
      }
      function Z(t) {
        return (t << 1) - (4 < t ? 9 : 0);
      }
      function et(t) {
        for (var U = t.length; 0 <= --U; ) t[U] = 0;
      }
      function F(t) {
        var U = t.state, B = U.pending;
        B > t.avail_out && (B = t.avail_out), B !== 0 && (o.arraySet(t.output, U.pending_buf, U.pending_out, B, t.next_out), t.next_out += B, U.pending_out += B, t.total_out += B, t.avail_out -= B, U.pending -= B, U.pending === 0 && (U.pending_out = 0));
      }
      function I(t, U) {
        s._tr_flush_block(t, 0 <= t.block_start ? t.block_start : -1, t.strstart - t.block_start, U), t.block_start = t.strstart, F(t.strm);
      }
      function Q(t, U) {
        t.pending_buf[t.pending++] = U;
      }
      function V(t, U) {
        t.pending_buf[t.pending++] = U >>> 8 & 255, t.pending_buf[t.pending++] = 255 & U;
      }
      function J(t, U) {
        var B, y, m = t.max_chain_length, N = t.strstart, W = t.prev_length, M = t.nice_match, A = t.strstart > t.w_size - Y ? t.strstart - (t.w_size - Y) : 0, $ = t.window, K = t.w_mask, H = t.prev, q = t.strstart + D, at = $[N + W - 1], nt = $[N + W];
        t.prev_length >= t.good_match && (m >>= 2), M > t.lookahead && (M = t.lookahead);
        do
          if ($[(B = U) + W] === nt && $[B + W - 1] === at && $[B] === $[N] && $[++B] === $[N + 1]) {
            N += 2, B++;
            do
              ;
            while ($[++N] === $[++B] && $[++N] === $[++B] && $[++N] === $[++B] && $[++N] === $[++B] && $[++N] === $[++B] && $[++N] === $[++B] && $[++N] === $[++B] && $[++N] === $[++B] && N < q);
            if (y = D - (q - N), N = q - D, W < y) {
              if (t.match_start = U, M <= (W = y)) break;
              at = $[N + W - 1], nt = $[N + W];
            }
          }
        while ((U = H[U & K]) > A && --m != 0);
        return W <= t.lookahead ? W : t.lookahead;
      }
      function ot(t) {
        var U, B, y, m, N, W, M, A, $, K, H = t.w_size;
        do {
          if (m = t.window_size - t.lookahead - t.strstart, t.strstart >= H + (H - Y)) {
            for (o.arraySet(t.window, t.window, H, H, 0), t.match_start -= H, t.strstart -= H, t.block_start -= H, U = B = t.hash_size; y = t.head[--U], t.head[U] = H <= y ? y - H : 0, --B; ) ;
            for (U = B = H; y = t.prev[--U], t.prev[U] = H <= y ? y - H : 0, --B; ) ;
            m += H;
          }
          if (t.strm.avail_in === 0) break;
          if (W = t.strm, M = t.window, A = t.strstart + t.lookahead, $ = m, K = void 0, K = W.avail_in, $ < K && (K = $), B = K === 0 ? 0 : (W.avail_in -= K, o.arraySet(M, W.input, W.next_in, K, A), W.state.wrap === 1 ? W.adler = d(W.adler, M, K, A) : W.state.wrap === 2 && (W.adler = _(W.adler, M, K, A)), W.next_in += K, W.total_in += K, K), t.lookahead += B, t.lookahead + t.insert >= z) for (N = t.strstart - t.insert, t.ins_h = t.window[N], t.ins_h = (t.ins_h << t.hash_shift ^ t.window[N + 1]) & t.hash_mask; t.insert && (t.ins_h = (t.ins_h << t.hash_shift ^ t.window[N + z - 1]) & t.hash_mask, t.prev[N & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = N, N++, t.insert--, !(t.lookahead + t.insert < z)); ) ;
        } while (t.lookahead < Y && t.strm.avail_in !== 0);
      }
      function ft(t, U) {
        for (var B, y; ; ) {
          if (t.lookahead < Y) {
            if (ot(t), t.lookahead < Y && U === w) return r;
            if (t.lookahead === 0) break;
          }
          if (B = 0, t.lookahead >= z && (t.ins_h = (t.ins_h << t.hash_shift ^ t.window[t.strstart + z - 1]) & t.hash_mask, B = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart), B !== 0 && t.strstart - B <= t.w_size - Y && (t.match_length = J(t, B)), t.match_length >= z) if (y = s._tr_tally(t, t.strstart - t.match_start, t.match_length - z), t.lookahead -= t.match_length, t.match_length <= t.max_lazy_match && t.lookahead >= z) {
            for (t.match_length--; t.strstart++, t.ins_h = (t.ins_h << t.hash_shift ^ t.window[t.strstart + z - 1]) & t.hash_mask, B = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart, --t.match_length != 0; ) ;
            t.strstart++;
          } else t.strstart += t.match_length, t.match_length = 0, t.ins_h = t.window[t.strstart], t.ins_h = (t.ins_h << t.hash_shift ^ t.window[t.strstart + 1]) & t.hash_mask;
          else y = s._tr_tally(t, 0, t.window[t.strstart]), t.lookahead--, t.strstart++;
          if (y && (I(t, !1), t.strm.avail_out === 0)) return r;
        }
        return t.insert = t.strstart < z - 1 ? t.strstart : z - 1, U === k ? (I(t, !0), t.strm.avail_out === 0 ? X : j) : t.last_lit && (I(t, !1), t.strm.avail_out === 0) ? r : R;
      }
      function rt(t, U) {
        for (var B, y, m; ; ) {
          if (t.lookahead < Y) {
            if (ot(t), t.lookahead < Y && U === w) return r;
            if (t.lookahead === 0) break;
          }
          if (B = 0, t.lookahead >= z && (t.ins_h = (t.ins_h << t.hash_shift ^ t.window[t.strstart + z - 1]) & t.hash_mask, B = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart), t.prev_length = t.match_length, t.prev_match = t.match_start, t.match_length = z - 1, B !== 0 && t.prev_length < t.max_lazy_match && t.strstart - B <= t.w_size - Y && (t.match_length = J(t, B), t.match_length <= 5 && (t.strategy === 1 || t.match_length === z && 4096 < t.strstart - t.match_start) && (t.match_length = z - 1)), t.prev_length >= z && t.match_length <= t.prev_length) {
            for (m = t.strstart + t.lookahead - z, y = s._tr_tally(t, t.strstart - 1 - t.prev_match, t.prev_length - z), t.lookahead -= t.prev_length - 1, t.prev_length -= 2; ++t.strstart <= m && (t.ins_h = (t.ins_h << t.hash_shift ^ t.window[t.strstart + z - 1]) & t.hash_mask, B = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart), --t.prev_length != 0; ) ;
            if (t.match_available = 0, t.match_length = z - 1, t.strstart++, y && (I(t, !1), t.strm.avail_out === 0)) return r;
          } else if (t.match_available) {
            if ((y = s._tr_tally(t, 0, t.window[t.strstart - 1])) && I(t, !1), t.strstart++, t.lookahead--, t.strm.avail_out === 0) return r;
          } else t.match_available = 1, t.strstart++, t.lookahead--;
        }
        return t.match_available && (y = s._tr_tally(t, 0, t.window[t.strstart - 1]), t.match_available = 0), t.insert = t.strstart < z - 1 ? t.strstart : z - 1, U === k ? (I(t, !0), t.strm.avail_out === 0 ? X : j) : t.last_lit && (I(t, !1), t.strm.avail_out === 0) ? r : R;
      }
      function st(t, U, B, y, m) {
        this.good_length = t, this.max_lazy = U, this.nice_length = B, this.max_chain = y, this.func = m;
      }
      function lt() {
        this.strm = null, this.status = 0, this.pending_buf = null, this.pending_buf_size = 0, this.pending_out = 0, this.pending = 0, this.wrap = 0, this.gzhead = null, this.gzindex = 0, this.method = p, this.last_flush = -1, this.w_size = 0, this.w_bits = 0, this.w_mask = 0, this.window = null, this.window_size = 0, this.prev = null, this.head = null, this.ins_h = 0, this.hash_size = 0, this.hash_bits = 0, this.hash_mask = 0, this.hash_shift = 0, this.block_start = 0, this.match_length = 0, this.prev_match = 0, this.match_available = 0, this.strstart = 0, this.match_start = 0, this.lookahead = 0, this.prev_length = 0, this.max_chain_length = 0, this.max_lazy_match = 0, this.level = 0, this.strategy = 0, this.good_match = 0, this.nice_match = 0, this.dyn_ltree = new o.Buf16(2 * T), this.dyn_dtree = new o.Buf16(2 * (2 * E + 1)), this.bl_tree = new o.Buf16(2 * (2 * P + 1)), et(this.dyn_ltree), et(this.dyn_dtree), et(this.bl_tree), this.l_desc = null, this.d_desc = null, this.bl_desc = null, this.bl_count = new o.Buf16(L + 1), this.heap = new o.Buf16(2 * C + 1), et(this.heap), this.heap_len = 0, this.heap_max = 0, this.depth = new o.Buf16(2 * C + 1), et(this.depth), this.l_buf = 0, this.lit_bufsize = 0, this.last_lit = 0, this.d_buf = 0, this.opt_len = 0, this.static_len = 0, this.matches = 0, this.insert = 0, this.bi_buf = 0, this.bi_valid = 0;
      }
      function ct(t) {
        var U;
        return t && t.state ? (t.total_in = t.total_out = 0, t.data_type = l, (U = t.state).pending = 0, U.pending_out = 0, U.wrap < 0 && (U.wrap = -U.wrap), U.status = U.wrap ? x : O, t.adler = U.wrap === 2 ? 0 : 1, U.last_flush = w, s._tr_init(U), u) : tt(t, g);
      }
      function gt(t) {
        var U = ct(t);
        return U === u && function(B) {
          B.window_size = 2 * B.w_size, et(B.head), B.max_lazy_match = n[B.level].max_lazy, B.good_match = n[B.level].good_length, B.nice_match = n[B.level].nice_length, B.max_chain_length = n[B.level].max_chain, B.strstart = 0, B.block_start = 0, B.lookahead = 0, B.insert = 0, B.match_length = B.prev_length = z - 1, B.match_available = 0, B.ins_h = 0;
        }(t.state), U;
      }
      function pt(t, U, B, y, m, N) {
        if (!t) return g;
        var W = 1;
        if (U === i && (U = 6), y < 0 ? (W = 0, y = -y) : 15 < y && (W = 2, y -= 16), m < 1 || v < m || B !== p || y < 8 || 15 < y || U < 0 || 9 < U || N < 0 || f < N) return tt(t, g);
        y === 8 && (y = 9);
        var M = new lt();
        return (t.state = M).strm = t, M.wrap = W, M.gzhead = null, M.w_bits = y, M.w_size = 1 << M.w_bits, M.w_mask = M.w_size - 1, M.hash_bits = m + 7, M.hash_size = 1 << M.hash_bits, M.hash_mask = M.hash_size - 1, M.hash_shift = ~~((M.hash_bits + z - 1) / z), M.window = new o.Buf8(2 * M.w_size), M.head = new o.Buf16(M.hash_size), M.prev = new o.Buf16(M.w_size), M.lit_bufsize = 1 << m + 6, M.pending_buf_size = 4 * M.lit_bufsize, M.pending_buf = new o.Buf8(M.pending_buf_size), M.d_buf = 1 * M.lit_bufsize, M.l_buf = 3 * M.lit_bufsize, M.level = U, M.strategy = N, M.method = B, gt(t);
      }
      n = [new st(0, 0, 0, 0, function(t, U) {
        var B = 65535;
        for (B > t.pending_buf_size - 5 && (B = t.pending_buf_size - 5); ; ) {
          if (t.lookahead <= 1) {
            if (ot(t), t.lookahead === 0 && U === w) return r;
            if (t.lookahead === 0) break;
          }
          t.strstart += t.lookahead, t.lookahead = 0;
          var y = t.block_start + B;
          if ((t.strstart === 0 || t.strstart >= y) && (t.lookahead = t.strstart - y, t.strstart = y, I(t, !1), t.strm.avail_out === 0) || t.strstart - t.block_start >= t.w_size - Y && (I(t, !1), t.strm.avail_out === 0)) return r;
        }
        return t.insert = 0, U === k ? (I(t, !0), t.strm.avail_out === 0 ? X : j) : (t.strstart > t.block_start && (I(t, !1), t.strm.avail_out), r);
      }), new st(4, 4, 8, 4, ft), new st(4, 5, 16, 8, ft), new st(4, 6, 32, 32, ft), new st(4, 4, 16, 16, rt), new st(8, 16, 32, 32, rt), new st(8, 16, 128, 128, rt), new st(8, 32, 128, 256, rt), new st(32, 128, 258, 1024, rt), new st(32, 258, 258, 4096, rt)], c.deflateInit = function(t, U) {
        return pt(t, U, p, 15, 8, 0);
      }, c.deflateInit2 = pt, c.deflateReset = gt, c.deflateResetKeep = ct, c.deflateSetHeader = function(t, U) {
        return t && t.state ? t.state.wrap !== 2 ? g : (t.state.gzhead = U, u) : g;
      }, c.deflate = function(t, U) {
        var B, y, m, N;
        if (!t || !t.state || 5 < U || U < 0) return t ? tt(t, g) : g;
        if (y = t.state, !t.output || !t.input && t.avail_in !== 0 || y.status === 666 && U !== k) return tt(t, t.avail_out === 0 ? -5 : g);
        if (y.strm = t, B = y.last_flush, y.last_flush = U, y.status === x) if (y.wrap === 2) t.adler = 0, Q(y, 31), Q(y, 139), Q(y, 8), y.gzhead ? (Q(y, (y.gzhead.text ? 1 : 0) + (y.gzhead.hcrc ? 2 : 0) + (y.gzhead.extra ? 4 : 0) + (y.gzhead.name ? 8 : 0) + (y.gzhead.comment ? 16 : 0)), Q(y, 255 & y.gzhead.time), Q(y, y.gzhead.time >> 8 & 255), Q(y, y.gzhead.time >> 16 & 255), Q(y, y.gzhead.time >> 24 & 255), Q(y, y.level === 9 ? 2 : 2 <= y.strategy || y.level < 2 ? 4 : 0), Q(y, 255 & y.gzhead.os), y.gzhead.extra && y.gzhead.extra.length && (Q(y, 255 & y.gzhead.extra.length), Q(y, y.gzhead.extra.length >> 8 & 255)), y.gzhead.hcrc && (t.adler = _(t.adler, y.pending_buf, y.pending, 0)), y.gzindex = 0, y.status = 69) : (Q(y, 0), Q(y, 0), Q(y, 0), Q(y, 0), Q(y, 0), Q(y, y.level === 9 ? 2 : 2 <= y.strategy || y.level < 2 ? 4 : 0), Q(y, 3), y.status = O);
        else {
          var W = p + (y.w_bits - 8 << 4) << 8;
          W |= (2 <= y.strategy || y.level < 2 ? 0 : y.level < 6 ? 1 : y.level === 6 ? 2 : 3) << 6, y.strstart !== 0 && (W |= 32), W += 31 - W % 31, y.status = O, V(y, W), y.strstart !== 0 && (V(y, t.adler >>> 16), V(y, 65535 & t.adler)), t.adler = 1;
        }
        if (y.status === 69) if (y.gzhead.extra) {
          for (m = y.pending; y.gzindex < (65535 & y.gzhead.extra.length) && (y.pending !== y.pending_buf_size || (y.gzhead.hcrc && y.pending > m && (t.adler = _(t.adler, y.pending_buf, y.pending - m, m)), F(t), m = y.pending, y.pending !== y.pending_buf_size)); ) Q(y, 255 & y.gzhead.extra[y.gzindex]), y.gzindex++;
          y.gzhead.hcrc && y.pending > m && (t.adler = _(t.adler, y.pending_buf, y.pending - m, m)), y.gzindex === y.gzhead.extra.length && (y.gzindex = 0, y.status = 73);
        } else y.status = 73;
        if (y.status === 73) if (y.gzhead.name) {
          m = y.pending;
          do {
            if (y.pending === y.pending_buf_size && (y.gzhead.hcrc && y.pending > m && (t.adler = _(t.adler, y.pending_buf, y.pending - m, m)), F(t), m = y.pending, y.pending === y.pending_buf_size)) {
              N = 1;
              break;
            }
            N = y.gzindex < y.gzhead.name.length ? 255 & y.gzhead.name.charCodeAt(y.gzindex++) : 0, Q(y, N);
          } while (N !== 0);
          y.gzhead.hcrc && y.pending > m && (t.adler = _(t.adler, y.pending_buf, y.pending - m, m)), N === 0 && (y.gzindex = 0, y.status = 91);
        } else y.status = 91;
        if (y.status === 91) if (y.gzhead.comment) {
          m = y.pending;
          do {
            if (y.pending === y.pending_buf_size && (y.gzhead.hcrc && y.pending > m && (t.adler = _(t.adler, y.pending_buf, y.pending - m, m)), F(t), m = y.pending, y.pending === y.pending_buf_size)) {
              N = 1;
              break;
            }
            N = y.gzindex < y.gzhead.comment.length ? 255 & y.gzhead.comment.charCodeAt(y.gzindex++) : 0, Q(y, N);
          } while (N !== 0);
          y.gzhead.hcrc && y.pending > m && (t.adler = _(t.adler, y.pending_buf, y.pending - m, m)), N === 0 && (y.status = 103);
        } else y.status = 103;
        if (y.status === 103 && (y.gzhead.hcrc ? (y.pending + 2 > y.pending_buf_size && F(t), y.pending + 2 <= y.pending_buf_size && (Q(y, 255 & t.adler), Q(y, t.adler >> 8 & 255), t.adler = 0, y.status = O)) : y.status = O), y.pending !== 0) {
          if (F(t), t.avail_out === 0) return y.last_flush = -1, u;
        } else if (t.avail_in === 0 && Z(U) <= Z(B) && U !== k) return tt(t, -5);
        if (y.status === 666 && t.avail_in !== 0) return tt(t, -5);
        if (t.avail_in !== 0 || y.lookahead !== 0 || U !== w && y.status !== 666) {
          var M = y.strategy === 2 ? function(A, $) {
            for (var K; ; ) {
              if (A.lookahead === 0 && (ot(A), A.lookahead === 0)) {
                if ($ === w) return r;
                break;
              }
              if (A.match_length = 0, K = s._tr_tally(A, 0, A.window[A.strstart]), A.lookahead--, A.strstart++, K && (I(A, !1), A.strm.avail_out === 0)) return r;
            }
            return A.insert = 0, $ === k ? (I(A, !0), A.strm.avail_out === 0 ? X : j) : A.last_lit && (I(A, !1), A.strm.avail_out === 0) ? r : R;
          }(y, U) : y.strategy === 3 ? function(A, $) {
            for (var K, H, q, at, nt = A.window; ; ) {
              if (A.lookahead <= D) {
                if (ot(A), A.lookahead <= D && $ === w) return r;
                if (A.lookahead === 0) break;
              }
              if (A.match_length = 0, A.lookahead >= z && 0 < A.strstart && (H = nt[q = A.strstart - 1]) === nt[++q] && H === nt[++q] && H === nt[++q]) {
                at = A.strstart + D;
                do
                  ;
                while (H === nt[++q] && H === nt[++q] && H === nt[++q] && H === nt[++q] && H === nt[++q] && H === nt[++q] && H === nt[++q] && H === nt[++q] && q < at);
                A.match_length = D - (at - q), A.match_length > A.lookahead && (A.match_length = A.lookahead);
              }
              if (A.match_length >= z ? (K = s._tr_tally(A, 1, A.match_length - z), A.lookahead -= A.match_length, A.strstart += A.match_length, A.match_length = 0) : (K = s._tr_tally(A, 0, A.window[A.strstart]), A.lookahead--, A.strstart++), K && (I(A, !1), A.strm.avail_out === 0)) return r;
            }
            return A.insert = 0, $ === k ? (I(A, !0), A.strm.avail_out === 0 ? X : j) : A.last_lit && (I(A, !1), A.strm.avail_out === 0) ? r : R;
          }(y, U) : n[y.level].func(y, U);
          if (M !== X && M !== j || (y.status = 666), M === r || M === X) return t.avail_out === 0 && (y.last_flush = -1), u;
          if (M === R && (U === 1 ? s._tr_align(y) : U !== 5 && (s._tr_stored_block(y, 0, 0, !1), U === 3 && (et(y.head), y.lookahead === 0 && (y.strstart = 0, y.block_start = 0, y.insert = 0))), F(t), t.avail_out === 0)) return y.last_flush = -1, u;
        }
        return U !== k ? u : y.wrap <= 0 ? 1 : (y.wrap === 2 ? (Q(y, 255 & t.adler), Q(y, t.adler >> 8 & 255), Q(y, t.adler >> 16 & 255), Q(y, t.adler >> 24 & 255), Q(y, 255 & t.total_in), Q(y, t.total_in >> 8 & 255), Q(y, t.total_in >> 16 & 255), Q(y, t.total_in >> 24 & 255)) : (V(y, t.adler >>> 16), V(y, 65535 & t.adler)), F(t), 0 < y.wrap && (y.wrap = -y.wrap), y.pending !== 0 ? u : 1);
      }, c.deflateEnd = function(t) {
        var U;
        return t && t.state ? (U = t.state.status) !== x && U !== 69 && U !== 73 && U !== 91 && U !== 103 && U !== O && U !== 666 ? tt(t, g) : (t.state = null, U === O ? tt(t, -3) : u) : g;
      }, c.deflateSetDictionary = function(t, U) {
        var B, y, m, N, W, M, A, $, K = U.length;
        if (!t || !t.state || (N = (B = t.state).wrap) === 2 || N === 1 && B.status !== x || B.lookahead) return g;
        for (N === 1 && (t.adler = d(t.adler, U, K, 0)), B.wrap = 0, K >= B.w_size && (N === 0 && (et(B.head), B.strstart = 0, B.block_start = 0, B.insert = 0), $ = new o.Buf8(B.w_size), o.arraySet($, U, K - B.w_size, B.w_size, 0), U = $, K = B.w_size), W = t.avail_in, M = t.next_in, A = t.input, t.avail_in = K, t.next_in = 0, t.input = U, ot(B); B.lookahead >= z; ) {
          for (y = B.strstart, m = B.lookahead - (z - 1); B.ins_h = (B.ins_h << B.hash_shift ^ B.window[y + z - 1]) & B.hash_mask, B.prev[y & B.w_mask] = B.head[B.ins_h], B.head[B.ins_h] = y, y++, --m; ) ;
          B.strstart = y, B.lookahead = z - 1, ot(B);
        }
        return B.strstart += B.lookahead, B.block_start = B.strstart, B.insert = B.lookahead, B.lookahead = 0, B.match_length = B.prev_length = z - 1, B.match_available = 0, t.next_in = M, t.input = A, t.avail_in = W, B.wrap = N, u;
      }, c.deflateInfo = "pako deflate (from Nodeca project)";
    }, { "../utils/common": 41, "./adler32": 43, "./crc32": 45, "./messages": 51, "./trees": 52 }], 47: [function(e, a, c) {
      a.exports = function() {
        this.text = 0, this.time = 0, this.xflags = 0, this.os = 0, this.extra = null, this.extra_len = 0, this.name = "", this.comment = "", this.hcrc = 0, this.done = !1;
      };
    }, {}], 48: [function(e, a, c) {
      a.exports = function(n, o) {
        var s, d, _, S, w, k, u, g, i, f, l, p, v, C, E, P, T, L, z, D, Y, x, O, r, R;
        s = n.state, d = n.next_in, r = n.input, _ = d + (n.avail_in - 5), S = n.next_out, R = n.output, w = S - (o - n.avail_out), k = S + (n.avail_out - 257), u = s.dmax, g = s.wsize, i = s.whave, f = s.wnext, l = s.window, p = s.hold, v = s.bits, C = s.lencode, E = s.distcode, P = (1 << s.lenbits) - 1, T = (1 << s.distbits) - 1;
        t: do {
          v < 15 && (p += r[d++] << v, v += 8, p += r[d++] << v, v += 8), L = C[p & P];
          e: for (; ; ) {
            if (p >>>= z = L >>> 24, v -= z, (z = L >>> 16 & 255) === 0) R[S++] = 65535 & L;
            else {
              if (!(16 & z)) {
                if (!(64 & z)) {
                  L = C[(65535 & L) + (p & (1 << z) - 1)];
                  continue e;
                }
                if (32 & z) {
                  s.mode = 12;
                  break t;
                }
                n.msg = "invalid literal/length code", s.mode = 30;
                break t;
              }
              D = 65535 & L, (z &= 15) && (v < z && (p += r[d++] << v, v += 8), D += p & (1 << z) - 1, p >>>= z, v -= z), v < 15 && (p += r[d++] << v, v += 8, p += r[d++] << v, v += 8), L = E[p & T];
              r: for (; ; ) {
                if (p >>>= z = L >>> 24, v -= z, !(16 & (z = L >>> 16 & 255))) {
                  if (!(64 & z)) {
                    L = E[(65535 & L) + (p & (1 << z) - 1)];
                    continue r;
                  }
                  n.msg = "invalid distance code", s.mode = 30;
                  break t;
                }
                if (Y = 65535 & L, v < (z &= 15) && (p += r[d++] << v, (v += 8) < z && (p += r[d++] << v, v += 8)), u < (Y += p & (1 << z) - 1)) {
                  n.msg = "invalid distance too far back", s.mode = 30;
                  break t;
                }
                if (p >>>= z, v -= z, (z = S - w) < Y) {
                  if (i < (z = Y - z) && s.sane) {
                    n.msg = "invalid distance too far back", s.mode = 30;
                    break t;
                  }
                  if (O = l, (x = 0) === f) {
                    if (x += g - z, z < D) {
                      for (D -= z; R[S++] = l[x++], --z; ) ;
                      x = S - Y, O = R;
                    }
                  } else if (f < z) {
                    if (x += g + f - z, (z -= f) < D) {
                      for (D -= z; R[S++] = l[x++], --z; ) ;
                      if (x = 0, f < D) {
                        for (D -= z = f; R[S++] = l[x++], --z; ) ;
                        x = S - Y, O = R;
                      }
                    }
                  } else if (x += f - z, z < D) {
                    for (D -= z; R[S++] = l[x++], --z; ) ;
                    x = S - Y, O = R;
                  }
                  for (; 2 < D; ) R[S++] = O[x++], R[S++] = O[x++], R[S++] = O[x++], D -= 3;
                  D && (R[S++] = O[x++], 1 < D && (R[S++] = O[x++]));
                } else {
                  for (x = S - Y; R[S++] = R[x++], R[S++] = R[x++], R[S++] = R[x++], 2 < (D -= 3); ) ;
                  D && (R[S++] = R[x++], 1 < D && (R[S++] = R[x++]));
                }
                break;
              }
            }
            break;
          }
        } while (d < _ && S < k);
        d -= D = v >> 3, p &= (1 << (v -= D << 3)) - 1, n.next_in = d, n.next_out = S, n.avail_in = d < _ ? _ - d + 5 : 5 - (d - _), n.avail_out = S < k ? k - S + 257 : 257 - (S - k), s.hold = p, s.bits = v;
      };
    }, {}], 49: [function(e, a, c) {
      var n = e("../utils/common"), o = e("./adler32"), s = e("./crc32"), d = e("./inffast"), _ = e("./inftrees"), S = 1, w = 2, k = 0, u = -2, g = 1, i = 852, f = 592;
      function l(x) {
        return (x >>> 24 & 255) + (x >>> 8 & 65280) + ((65280 & x) << 8) + ((255 & x) << 24);
      }
      function p() {
        this.mode = 0, this.last = !1, this.wrap = 0, this.havedict = !1, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = new n.Buf16(320), this.work = new n.Buf16(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0;
      }
      function v(x) {
        var O;
        return x && x.state ? (O = x.state, x.total_in = x.total_out = O.total = 0, x.msg = "", O.wrap && (x.adler = 1 & O.wrap), O.mode = g, O.last = 0, O.havedict = 0, O.dmax = 32768, O.head = null, O.hold = 0, O.bits = 0, O.lencode = O.lendyn = new n.Buf32(i), O.distcode = O.distdyn = new n.Buf32(f), O.sane = 1, O.back = -1, k) : u;
      }
      function C(x) {
        var O;
        return x && x.state ? ((O = x.state).wsize = 0, O.whave = 0, O.wnext = 0, v(x)) : u;
      }
      function E(x, O) {
        var r, R;
        return x && x.state ? (R = x.state, O < 0 ? (r = 0, O = -O) : (r = 1 + (O >> 4), O < 48 && (O &= 15)), O && (O < 8 || 15 < O) ? u : (R.window !== null && R.wbits !== O && (R.window = null), R.wrap = r, R.wbits = O, C(x))) : u;
      }
      function P(x, O) {
        var r, R;
        return x ? (R = new p(), (x.state = R).window = null, (r = E(x, O)) !== k && (x.state = null), r) : u;
      }
      var T, L, z = !0;
      function D(x) {
        if (z) {
          var O;
          for (T = new n.Buf32(512), L = new n.Buf32(32), O = 0; O < 144; ) x.lens[O++] = 8;
          for (; O < 256; ) x.lens[O++] = 9;
          for (; O < 280; ) x.lens[O++] = 7;
          for (; O < 288; ) x.lens[O++] = 8;
          for (_(S, x.lens, 0, 288, T, 0, x.work, { bits: 9 }), O = 0; O < 32; ) x.lens[O++] = 5;
          _(w, x.lens, 0, 32, L, 0, x.work, { bits: 5 }), z = !1;
        }
        x.lencode = T, x.lenbits = 9, x.distcode = L, x.distbits = 5;
      }
      function Y(x, O, r, R) {
        var X, j = x.state;
        return j.window === null && (j.wsize = 1 << j.wbits, j.wnext = 0, j.whave = 0, j.window = new n.Buf8(j.wsize)), R >= j.wsize ? (n.arraySet(j.window, O, r - j.wsize, j.wsize, 0), j.wnext = 0, j.whave = j.wsize) : (R < (X = j.wsize - j.wnext) && (X = R), n.arraySet(j.window, O, r - R, X, j.wnext), (R -= X) ? (n.arraySet(j.window, O, r - R, R, 0), j.wnext = R, j.whave = j.wsize) : (j.wnext += X, j.wnext === j.wsize && (j.wnext = 0), j.whave < j.wsize && (j.whave += X))), 0;
      }
      c.inflateReset = C, c.inflateReset2 = E, c.inflateResetKeep = v, c.inflateInit = function(x) {
        return P(x, 15);
      }, c.inflateInit2 = P, c.inflate = function(x, O) {
        var r, R, X, j, tt, Z, et, F, I, Q, V, J, ot, ft, rt, st, lt, ct, gt, pt, t, U, B, y, m = 0, N = new n.Buf8(4), W = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
        if (!x || !x.state || !x.output || !x.input && x.avail_in !== 0) return u;
        (r = x.state).mode === 12 && (r.mode = 13), tt = x.next_out, X = x.output, et = x.avail_out, j = x.next_in, R = x.input, Z = x.avail_in, F = r.hold, I = r.bits, Q = Z, V = et, U = k;
        t: for (; ; ) switch (r.mode) {
          case g:
            if (r.wrap === 0) {
              r.mode = 13;
              break;
            }
            for (; I < 16; ) {
              if (Z === 0) break t;
              Z--, F += R[j++] << I, I += 8;
            }
            if (2 & r.wrap && F === 35615) {
              N[r.check = 0] = 255 & F, N[1] = F >>> 8 & 255, r.check = s(r.check, N, 2, 0), I = F = 0, r.mode = 2;
              break;
            }
            if (r.flags = 0, r.head && (r.head.done = !1), !(1 & r.wrap) || (((255 & F) << 8) + (F >> 8)) % 31) {
              x.msg = "incorrect header check", r.mode = 30;
              break;
            }
            if ((15 & F) != 8) {
              x.msg = "unknown compression method", r.mode = 30;
              break;
            }
            if (I -= 4, t = 8 + (15 & (F >>>= 4)), r.wbits === 0) r.wbits = t;
            else if (t > r.wbits) {
              x.msg = "invalid window size", r.mode = 30;
              break;
            }
            r.dmax = 1 << t, x.adler = r.check = 1, r.mode = 512 & F ? 10 : 12, I = F = 0;
            break;
          case 2:
            for (; I < 16; ) {
              if (Z === 0) break t;
              Z--, F += R[j++] << I, I += 8;
            }
            if (r.flags = F, (255 & r.flags) != 8) {
              x.msg = "unknown compression method", r.mode = 30;
              break;
            }
            if (57344 & r.flags) {
              x.msg = "unknown header flags set", r.mode = 30;
              break;
            }
            r.head && (r.head.text = F >> 8 & 1), 512 & r.flags && (N[0] = 255 & F, N[1] = F >>> 8 & 255, r.check = s(r.check, N, 2, 0)), I = F = 0, r.mode = 3;
          case 3:
            for (; I < 32; ) {
              if (Z === 0) break t;
              Z--, F += R[j++] << I, I += 8;
            }
            r.head && (r.head.time = F), 512 & r.flags && (N[0] = 255 & F, N[1] = F >>> 8 & 255, N[2] = F >>> 16 & 255, N[3] = F >>> 24 & 255, r.check = s(r.check, N, 4, 0)), I = F = 0, r.mode = 4;
          case 4:
            for (; I < 16; ) {
              if (Z === 0) break t;
              Z--, F += R[j++] << I, I += 8;
            }
            r.head && (r.head.xflags = 255 & F, r.head.os = F >> 8), 512 & r.flags && (N[0] = 255 & F, N[1] = F >>> 8 & 255, r.check = s(r.check, N, 2, 0)), I = F = 0, r.mode = 5;
          case 5:
            if (1024 & r.flags) {
              for (; I < 16; ) {
                if (Z === 0) break t;
                Z--, F += R[j++] << I, I += 8;
              }
              r.length = F, r.head && (r.head.extra_len = F), 512 & r.flags && (N[0] = 255 & F, N[1] = F >>> 8 & 255, r.check = s(r.check, N, 2, 0)), I = F = 0;
            } else r.head && (r.head.extra = null);
            r.mode = 6;
          case 6:
            if (1024 & r.flags && (Z < (J = r.length) && (J = Z), J && (r.head && (t = r.head.extra_len - r.length, r.head.extra || (r.head.extra = new Array(r.head.extra_len)), n.arraySet(r.head.extra, R, j, J, t)), 512 & r.flags && (r.check = s(r.check, R, J, j)), Z -= J, j += J, r.length -= J), r.length)) break t;
            r.length = 0, r.mode = 7;
          case 7:
            if (2048 & r.flags) {
              if (Z === 0) break t;
              for (J = 0; t = R[j + J++], r.head && t && r.length < 65536 && (r.head.name += String.fromCharCode(t)), t && J < Z; ) ;
              if (512 & r.flags && (r.check = s(r.check, R, J, j)), Z -= J, j += J, t) break t;
            } else r.head && (r.head.name = null);
            r.length = 0, r.mode = 8;
          case 8:
            if (4096 & r.flags) {
              if (Z === 0) break t;
              for (J = 0; t = R[j + J++], r.head && t && r.length < 65536 && (r.head.comment += String.fromCharCode(t)), t && J < Z; ) ;
              if (512 & r.flags && (r.check = s(r.check, R, J, j)), Z -= J, j += J, t) break t;
            } else r.head && (r.head.comment = null);
            r.mode = 9;
          case 9:
            if (512 & r.flags) {
              for (; I < 16; ) {
                if (Z === 0) break t;
                Z--, F += R[j++] << I, I += 8;
              }
              if (F !== (65535 & r.check)) {
                x.msg = "header crc mismatch", r.mode = 30;
                break;
              }
              I = F = 0;
            }
            r.head && (r.head.hcrc = r.flags >> 9 & 1, r.head.done = !0), x.adler = r.check = 0, r.mode = 12;
            break;
          case 10:
            for (; I < 32; ) {
              if (Z === 0) break t;
              Z--, F += R[j++] << I, I += 8;
            }
            x.adler = r.check = l(F), I = F = 0, r.mode = 11;
          case 11:
            if (r.havedict === 0) return x.next_out = tt, x.avail_out = et, x.next_in = j, x.avail_in = Z, r.hold = F, r.bits = I, 2;
            x.adler = r.check = 1, r.mode = 12;
          case 12:
            if (O === 5 || O === 6) break t;
          case 13:
            if (r.last) {
              F >>>= 7 & I, I -= 7 & I, r.mode = 27;
              break;
            }
            for (; I < 3; ) {
              if (Z === 0) break t;
              Z--, F += R[j++] << I, I += 8;
            }
            switch (r.last = 1 & F, I -= 1, 3 & (F >>>= 1)) {
              case 0:
                r.mode = 14;
                break;
              case 1:
                if (D(r), r.mode = 20, O !== 6) break;
                F >>>= 2, I -= 2;
                break t;
              case 2:
                r.mode = 17;
                break;
              case 3:
                x.msg = "invalid block type", r.mode = 30;
            }
            F >>>= 2, I -= 2;
            break;
          case 14:
            for (F >>>= 7 & I, I -= 7 & I; I < 32; ) {
              if (Z === 0) break t;
              Z--, F += R[j++] << I, I += 8;
            }
            if ((65535 & F) != (F >>> 16 ^ 65535)) {
              x.msg = "invalid stored block lengths", r.mode = 30;
              break;
            }
            if (r.length = 65535 & F, I = F = 0, r.mode = 15, O === 6) break t;
          case 15:
            r.mode = 16;
          case 16:
            if (J = r.length) {
              if (Z < J && (J = Z), et < J && (J = et), J === 0) break t;
              n.arraySet(X, R, j, J, tt), Z -= J, j += J, et -= J, tt += J, r.length -= J;
              break;
            }
            r.mode = 12;
            break;
          case 17:
            for (; I < 14; ) {
              if (Z === 0) break t;
              Z--, F += R[j++] << I, I += 8;
            }
            if (r.nlen = 257 + (31 & F), F >>>= 5, I -= 5, r.ndist = 1 + (31 & F), F >>>= 5, I -= 5, r.ncode = 4 + (15 & F), F >>>= 4, I -= 4, 286 < r.nlen || 30 < r.ndist) {
              x.msg = "too many length or distance symbols", r.mode = 30;
              break;
            }
            r.have = 0, r.mode = 18;
          case 18:
            for (; r.have < r.ncode; ) {
              for (; I < 3; ) {
                if (Z === 0) break t;
                Z--, F += R[j++] << I, I += 8;
              }
              r.lens[W[r.have++]] = 7 & F, F >>>= 3, I -= 3;
            }
            for (; r.have < 19; ) r.lens[W[r.have++]] = 0;
            if (r.lencode = r.lendyn, r.lenbits = 7, B = { bits: r.lenbits }, U = _(0, r.lens, 0, 19, r.lencode, 0, r.work, B), r.lenbits = B.bits, U) {
              x.msg = "invalid code lengths set", r.mode = 30;
              break;
            }
            r.have = 0, r.mode = 19;
          case 19:
            for (; r.have < r.nlen + r.ndist; ) {
              for (; st = (m = r.lencode[F & (1 << r.lenbits) - 1]) >>> 16 & 255, lt = 65535 & m, !((rt = m >>> 24) <= I); ) {
                if (Z === 0) break t;
                Z--, F += R[j++] << I, I += 8;
              }
              if (lt < 16) F >>>= rt, I -= rt, r.lens[r.have++] = lt;
              else {
                if (lt === 16) {
                  for (y = rt + 2; I < y; ) {
                    if (Z === 0) break t;
                    Z--, F += R[j++] << I, I += 8;
                  }
                  if (F >>>= rt, I -= rt, r.have === 0) {
                    x.msg = "invalid bit length repeat", r.mode = 30;
                    break;
                  }
                  t = r.lens[r.have - 1], J = 3 + (3 & F), F >>>= 2, I -= 2;
                } else if (lt === 17) {
                  for (y = rt + 3; I < y; ) {
                    if (Z === 0) break t;
                    Z--, F += R[j++] << I, I += 8;
                  }
                  I -= rt, t = 0, J = 3 + (7 & (F >>>= rt)), F >>>= 3, I -= 3;
                } else {
                  for (y = rt + 7; I < y; ) {
                    if (Z === 0) break t;
                    Z--, F += R[j++] << I, I += 8;
                  }
                  I -= rt, t = 0, J = 11 + (127 & (F >>>= rt)), F >>>= 7, I -= 7;
                }
                if (r.have + J > r.nlen + r.ndist) {
                  x.msg = "invalid bit length repeat", r.mode = 30;
                  break;
                }
                for (; J--; ) r.lens[r.have++] = t;
              }
            }
            if (r.mode === 30) break;
            if (r.lens[256] === 0) {
              x.msg = "invalid code -- missing end-of-block", r.mode = 30;
              break;
            }
            if (r.lenbits = 9, B = { bits: r.lenbits }, U = _(S, r.lens, 0, r.nlen, r.lencode, 0, r.work, B), r.lenbits = B.bits, U) {
              x.msg = "invalid literal/lengths set", r.mode = 30;
              break;
            }
            if (r.distbits = 6, r.distcode = r.distdyn, B = { bits: r.distbits }, U = _(w, r.lens, r.nlen, r.ndist, r.distcode, 0, r.work, B), r.distbits = B.bits, U) {
              x.msg = "invalid distances set", r.mode = 30;
              break;
            }
            if (r.mode = 20, O === 6) break t;
          case 20:
            r.mode = 21;
          case 21:
            if (6 <= Z && 258 <= et) {
              x.next_out = tt, x.avail_out = et, x.next_in = j, x.avail_in = Z, r.hold = F, r.bits = I, d(x, V), tt = x.next_out, X = x.output, et = x.avail_out, j = x.next_in, R = x.input, Z = x.avail_in, F = r.hold, I = r.bits, r.mode === 12 && (r.back = -1);
              break;
            }
            for (r.back = 0; st = (m = r.lencode[F & (1 << r.lenbits) - 1]) >>> 16 & 255, lt = 65535 & m, !((rt = m >>> 24) <= I); ) {
              if (Z === 0) break t;
              Z--, F += R[j++] << I, I += 8;
            }
            if (st && !(240 & st)) {
              for (ct = rt, gt = st, pt = lt; st = (m = r.lencode[pt + ((F & (1 << ct + gt) - 1) >> ct)]) >>> 16 & 255, lt = 65535 & m, !(ct + (rt = m >>> 24) <= I); ) {
                if (Z === 0) break t;
                Z--, F += R[j++] << I, I += 8;
              }
              F >>>= ct, I -= ct, r.back += ct;
            }
            if (F >>>= rt, I -= rt, r.back += rt, r.length = lt, st === 0) {
              r.mode = 26;
              break;
            }
            if (32 & st) {
              r.back = -1, r.mode = 12;
              break;
            }
            if (64 & st) {
              x.msg = "invalid literal/length code", r.mode = 30;
              break;
            }
            r.extra = 15 & st, r.mode = 22;
          case 22:
            if (r.extra) {
              for (y = r.extra; I < y; ) {
                if (Z === 0) break t;
                Z--, F += R[j++] << I, I += 8;
              }
              r.length += F & (1 << r.extra) - 1, F >>>= r.extra, I -= r.extra, r.back += r.extra;
            }
            r.was = r.length, r.mode = 23;
          case 23:
            for (; st = (m = r.distcode[F & (1 << r.distbits) - 1]) >>> 16 & 255, lt = 65535 & m, !((rt = m >>> 24) <= I); ) {
              if (Z === 0) break t;
              Z--, F += R[j++] << I, I += 8;
            }
            if (!(240 & st)) {
              for (ct = rt, gt = st, pt = lt; st = (m = r.distcode[pt + ((F & (1 << ct + gt) - 1) >> ct)]) >>> 16 & 255, lt = 65535 & m, !(ct + (rt = m >>> 24) <= I); ) {
                if (Z === 0) break t;
                Z--, F += R[j++] << I, I += 8;
              }
              F >>>= ct, I -= ct, r.back += ct;
            }
            if (F >>>= rt, I -= rt, r.back += rt, 64 & st) {
              x.msg = "invalid distance code", r.mode = 30;
              break;
            }
            r.offset = lt, r.extra = 15 & st, r.mode = 24;
          case 24:
            if (r.extra) {
              for (y = r.extra; I < y; ) {
                if (Z === 0) break t;
                Z--, F += R[j++] << I, I += 8;
              }
              r.offset += F & (1 << r.extra) - 1, F >>>= r.extra, I -= r.extra, r.back += r.extra;
            }
            if (r.offset > r.dmax) {
              x.msg = "invalid distance too far back", r.mode = 30;
              break;
            }
            r.mode = 25;
          case 25:
            if (et === 0) break t;
            if (J = V - et, r.offset > J) {
              if ((J = r.offset - J) > r.whave && r.sane) {
                x.msg = "invalid distance too far back", r.mode = 30;
                break;
              }
              ot = J > r.wnext ? (J -= r.wnext, r.wsize - J) : r.wnext - J, J > r.length && (J = r.length), ft = r.window;
            } else ft = X, ot = tt - r.offset, J = r.length;
            for (et < J && (J = et), et -= J, r.length -= J; X[tt++] = ft[ot++], --J; ) ;
            r.length === 0 && (r.mode = 21);
            break;
          case 26:
            if (et === 0) break t;
            X[tt++] = r.length, et--, r.mode = 21;
            break;
          case 27:
            if (r.wrap) {
              for (; I < 32; ) {
                if (Z === 0) break t;
                Z--, F |= R[j++] << I, I += 8;
              }
              if (V -= et, x.total_out += V, r.total += V, V && (x.adler = r.check = r.flags ? s(r.check, X, V, tt - V) : o(r.check, X, V, tt - V)), V = et, (r.flags ? F : l(F)) !== r.check) {
                x.msg = "incorrect data check", r.mode = 30;
                break;
              }
              I = F = 0;
            }
            r.mode = 28;
          case 28:
            if (r.wrap && r.flags) {
              for (; I < 32; ) {
                if (Z === 0) break t;
                Z--, F += R[j++] << I, I += 8;
              }
              if (F !== (4294967295 & r.total)) {
                x.msg = "incorrect length check", r.mode = 30;
                break;
              }
              I = F = 0;
            }
            r.mode = 29;
          case 29:
            U = 1;
            break t;
          case 30:
            U = -3;
            break t;
          case 31:
            return -4;
          case 32:
          default:
            return u;
        }
        return x.next_out = tt, x.avail_out = et, x.next_in = j, x.avail_in = Z, r.hold = F, r.bits = I, (r.wsize || V !== x.avail_out && r.mode < 30 && (r.mode < 27 || O !== 4)) && Y(x, x.output, x.next_out, V - x.avail_out) ? (r.mode = 31, -4) : (Q -= x.avail_in, V -= x.avail_out, x.total_in += Q, x.total_out += V, r.total += V, r.wrap && V && (x.adler = r.check = r.flags ? s(r.check, X, V, x.next_out - V) : o(r.check, X, V, x.next_out - V)), x.data_type = r.bits + (r.last ? 64 : 0) + (r.mode === 12 ? 128 : 0) + (r.mode === 20 || r.mode === 15 ? 256 : 0), (Q == 0 && V === 0 || O === 4) && U === k && (U = -5), U);
      }, c.inflateEnd = function(x) {
        if (!x || !x.state) return u;
        var O = x.state;
        return O.window && (O.window = null), x.state = null, k;
      }, c.inflateGetHeader = function(x, O) {
        var r;
        return x && x.state && 2 & (r = x.state).wrap ? ((r.head = O).done = !1, k) : u;
      }, c.inflateSetDictionary = function(x, O) {
        var r, R = O.length;
        return x && x.state ? (r = x.state).wrap !== 0 && r.mode !== 11 ? u : r.mode === 11 && o(1, O, R, 0) !== r.check ? -3 : Y(x, O, R, R) ? (r.mode = 31, -4) : (r.havedict = 1, k) : u;
      }, c.inflateInfo = "pako inflate (from Nodeca project)";
    }, { "../utils/common": 41, "./adler32": 43, "./crc32": 45, "./inffast": 48, "./inftrees": 50 }], 50: [function(e, a, c) {
      var n = e("../utils/common"), o = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0], s = [16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18, 19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 72, 78], d = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577, 0, 0], _ = [16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22, 23, 23, 24, 24, 25, 25, 26, 26, 27, 27, 28, 28, 29, 29, 64, 64];
      a.exports = function(S, w, k, u, g, i, f, l) {
        var p, v, C, E, P, T, L, z, D, Y = l.bits, x = 0, O = 0, r = 0, R = 0, X = 0, j = 0, tt = 0, Z = 0, et = 0, F = 0, I = null, Q = 0, V = new n.Buf16(16), J = new n.Buf16(16), ot = null, ft = 0;
        for (x = 0; x <= 15; x++) V[x] = 0;
        for (O = 0; O < u; O++) V[w[k + O]]++;
        for (X = Y, R = 15; 1 <= R && V[R] === 0; R--) ;
        if (R < X && (X = R), R === 0) return g[i++] = 20971520, g[i++] = 20971520, l.bits = 1, 0;
        for (r = 1; r < R && V[r] === 0; r++) ;
        for (X < r && (X = r), x = Z = 1; x <= 15; x++) if (Z <<= 1, (Z -= V[x]) < 0) return -1;
        if (0 < Z && (S === 0 || R !== 1)) return -1;
        for (J[1] = 0, x = 1; x < 15; x++) J[x + 1] = J[x] + V[x];
        for (O = 0; O < u; O++) w[k + O] !== 0 && (f[J[w[k + O]]++] = O);
        if (T = S === 0 ? (I = ot = f, 19) : S === 1 ? (I = o, Q -= 257, ot = s, ft -= 257, 256) : (I = d, ot = _, -1), x = r, P = i, tt = O = F = 0, C = -1, E = (et = 1 << (j = X)) - 1, S === 1 && 852 < et || S === 2 && 592 < et) return 1;
        for (; ; ) {
          for (L = x - tt, D = f[O] < T ? (z = 0, f[O]) : f[O] > T ? (z = ot[ft + f[O]], I[Q + f[O]]) : (z = 96, 0), p = 1 << x - tt, r = v = 1 << j; g[P + (F >> tt) + (v -= p)] = L << 24 | z << 16 | D | 0, v !== 0; ) ;
          for (p = 1 << x - 1; F & p; ) p >>= 1;
          if (p !== 0 ? (F &= p - 1, F += p) : F = 0, O++, --V[x] == 0) {
            if (x === R) break;
            x = w[k + f[O]];
          }
          if (X < x && (F & E) !== C) {
            for (tt === 0 && (tt = X), P += r, Z = 1 << (j = x - tt); j + tt < R && !((Z -= V[j + tt]) <= 0); ) j++, Z <<= 1;
            if (et += 1 << j, S === 1 && 852 < et || S === 2 && 592 < et) return 1;
            g[C = F & E] = X << 24 | j << 16 | P - i | 0;
          }
        }
        return F !== 0 && (g[P + F] = x - tt << 24 | 64 << 16 | 0), l.bits = X, 0;
      };
    }, { "../utils/common": 41 }], 51: [function(e, a, c) {
      a.exports = { 2: "need dictionary", 1: "stream end", 0: "", "-1": "file error", "-2": "stream error", "-3": "data error", "-4": "insufficient memory", "-5": "buffer error", "-6": "incompatible version" };
    }, {}], 52: [function(e, a, c) {
      var n = e("../utils/common"), o = 0, s = 1;
      function d(m) {
        for (var N = m.length; 0 <= --N; ) m[N] = 0;
      }
      var _ = 0, S = 29, w = 256, k = w + 1 + S, u = 30, g = 19, i = 2 * k + 1, f = 15, l = 16, p = 7, v = 256, C = 16, E = 17, P = 18, T = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0], L = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13], z = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7], D = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15], Y = new Array(2 * (k + 2));
      d(Y);
      var x = new Array(2 * u);
      d(x);
      var O = new Array(512);
      d(O);
      var r = new Array(256);
      d(r);
      var R = new Array(S);
      d(R);
      var X, j, tt, Z = new Array(u);
      function et(m, N, W, M, A) {
        this.static_tree = m, this.extra_bits = N, this.extra_base = W, this.elems = M, this.max_length = A, this.has_stree = m && m.length;
      }
      function F(m, N) {
        this.dyn_tree = m, this.max_code = 0, this.stat_desc = N;
      }
      function I(m) {
        return m < 256 ? O[m] : O[256 + (m >>> 7)];
      }
      function Q(m, N) {
        m.pending_buf[m.pending++] = 255 & N, m.pending_buf[m.pending++] = N >>> 8 & 255;
      }
      function V(m, N, W) {
        m.bi_valid > l - W ? (m.bi_buf |= N << m.bi_valid & 65535, Q(m, m.bi_buf), m.bi_buf = N >> l - m.bi_valid, m.bi_valid += W - l) : (m.bi_buf |= N << m.bi_valid & 65535, m.bi_valid += W);
      }
      function J(m, N, W) {
        V(m, W[2 * N], W[2 * N + 1]);
      }
      function ot(m, N) {
        for (var W = 0; W |= 1 & m, m >>>= 1, W <<= 1, 0 < --N; ) ;
        return W >>> 1;
      }
      function ft(m, N, W) {
        var M, A, $ = new Array(f + 1), K = 0;
        for (M = 1; M <= f; M++) $[M] = K = K + W[M - 1] << 1;
        for (A = 0; A <= N; A++) {
          var H = m[2 * A + 1];
          H !== 0 && (m[2 * A] = ot($[H]++, H));
        }
      }
      function rt(m) {
        var N;
        for (N = 0; N < k; N++) m.dyn_ltree[2 * N] = 0;
        for (N = 0; N < u; N++) m.dyn_dtree[2 * N] = 0;
        for (N = 0; N < g; N++) m.bl_tree[2 * N] = 0;
        m.dyn_ltree[2 * v] = 1, m.opt_len = m.static_len = 0, m.last_lit = m.matches = 0;
      }
      function st(m) {
        8 < m.bi_valid ? Q(m, m.bi_buf) : 0 < m.bi_valid && (m.pending_buf[m.pending++] = m.bi_buf), m.bi_buf = 0, m.bi_valid = 0;
      }
      function lt(m, N, W, M) {
        var A = 2 * N, $ = 2 * W;
        return m[A] < m[$] || m[A] === m[$] && M[N] <= M[W];
      }
      function ct(m, N, W) {
        for (var M = m.heap[W], A = W << 1; A <= m.heap_len && (A < m.heap_len && lt(N, m.heap[A + 1], m.heap[A], m.depth) && A++, !lt(N, M, m.heap[A], m.depth)); ) m.heap[W] = m.heap[A], W = A, A <<= 1;
        m.heap[W] = M;
      }
      function gt(m, N, W) {
        var M, A, $, K, H = 0;
        if (m.last_lit !== 0) for (; M = m.pending_buf[m.d_buf + 2 * H] << 8 | m.pending_buf[m.d_buf + 2 * H + 1], A = m.pending_buf[m.l_buf + H], H++, M === 0 ? J(m, A, N) : (J(m, ($ = r[A]) + w + 1, N), (K = T[$]) !== 0 && V(m, A -= R[$], K), J(m, $ = I(--M), W), (K = L[$]) !== 0 && V(m, M -= Z[$], K)), H < m.last_lit; ) ;
        J(m, v, N);
      }
      function pt(m, N) {
        var W, M, A, $ = N.dyn_tree, K = N.stat_desc.static_tree, H = N.stat_desc.has_stree, q = N.stat_desc.elems, at = -1;
        for (m.heap_len = 0, m.heap_max = i, W = 0; W < q; W++) $[2 * W] !== 0 ? (m.heap[++m.heap_len] = at = W, m.depth[W] = 0) : $[2 * W + 1] = 0;
        for (; m.heap_len < 2; ) $[2 * (A = m.heap[++m.heap_len] = at < 2 ? ++at : 0)] = 1, m.depth[A] = 0, m.opt_len--, H && (m.static_len -= K[2 * A + 1]);
        for (N.max_code = at, W = m.heap_len >> 1; 1 <= W; W--) ct(m, $, W);
        for (A = q; W = m.heap[1], m.heap[1] = m.heap[m.heap_len--], ct(m, $, 1), M = m.heap[1], m.heap[--m.heap_max] = W, m.heap[--m.heap_max] = M, $[2 * A] = $[2 * W] + $[2 * M], m.depth[A] = (m.depth[W] >= m.depth[M] ? m.depth[W] : m.depth[M]) + 1, $[2 * W + 1] = $[2 * M + 1] = A, m.heap[1] = A++, ct(m, $, 1), 2 <= m.heap_len; ) ;
        m.heap[--m.heap_max] = m.heap[1], function(nt, ht) {
          var xt, yt, St, ut, Nt, Ft, _t = ht.dyn_tree, Ut = ht.max_code, qt = ht.stat_desc.static_tree, Qt = ht.stat_desc.has_stree, te = ht.stat_desc.extra_bits, Lt = ht.stat_desc.extra_base, Et = ht.stat_desc.max_length, zt = 0;
          for (ut = 0; ut <= f; ut++) nt.bl_count[ut] = 0;
          for (_t[2 * nt.heap[nt.heap_max] + 1] = 0, xt = nt.heap_max + 1; xt < i; xt++) Et < (ut = _t[2 * _t[2 * (yt = nt.heap[xt]) + 1] + 1] + 1) && (ut = Et, zt++), _t[2 * yt + 1] = ut, Ut < yt || (nt.bl_count[ut]++, Nt = 0, Lt <= yt && (Nt = te[yt - Lt]), Ft = _t[2 * yt], nt.opt_len += Ft * (ut + Nt), Qt && (nt.static_len += Ft * (qt[2 * yt + 1] + Nt)));
          if (zt !== 0) {
            do {
              for (ut = Et - 1; nt.bl_count[ut] === 0; ) ut--;
              nt.bl_count[ut]--, nt.bl_count[ut + 1] += 2, nt.bl_count[Et]--, zt -= 2;
            } while (0 < zt);
            for (ut = Et; ut !== 0; ut--) for (yt = nt.bl_count[ut]; yt !== 0; ) Ut < (St = nt.heap[--xt]) || (_t[2 * St + 1] !== ut && (nt.opt_len += (ut - _t[2 * St + 1]) * _t[2 * St], _t[2 * St + 1] = ut), yt--);
          }
        }(m, N), ft($, at, m.bl_count);
      }
      function t(m, N, W) {
        var M, A, $ = -1, K = N[1], H = 0, q = 7, at = 4;
        for (K === 0 && (q = 138, at = 3), N[2 * (W + 1) + 1] = 65535, M = 0; M <= W; M++) A = K, K = N[2 * (M + 1) + 1], ++H < q && A === K || (H < at ? m.bl_tree[2 * A] += H : A !== 0 ? (A !== $ && m.bl_tree[2 * A]++, m.bl_tree[2 * C]++) : H <= 10 ? m.bl_tree[2 * E]++ : m.bl_tree[2 * P]++, $ = A, at = (H = 0) === K ? (q = 138, 3) : A === K ? (q = 6, 3) : (q = 7, 4));
      }
      function U(m, N, W) {
        var M, A, $ = -1, K = N[1], H = 0, q = 7, at = 4;
        for (K === 0 && (q = 138, at = 3), M = 0; M <= W; M++) if (A = K, K = N[2 * (M + 1) + 1], !(++H < q && A === K)) {
          if (H < at) for (; J(m, A, m.bl_tree), --H != 0; ) ;
          else A !== 0 ? (A !== $ && (J(m, A, m.bl_tree), H--), J(m, C, m.bl_tree), V(m, H - 3, 2)) : H <= 10 ? (J(m, E, m.bl_tree), V(m, H - 3, 3)) : (J(m, P, m.bl_tree), V(m, H - 11, 7));
          $ = A, at = (H = 0) === K ? (q = 138, 3) : A === K ? (q = 6, 3) : (q = 7, 4);
        }
      }
      d(Z);
      var B = !1;
      function y(m, N, W, M) {
        V(m, (_ << 1) + (M ? 1 : 0), 3), function(A, $, K, H) {
          st(A), Q(A, K), Q(A, ~K), n.arraySet(A.pending_buf, A.window, $, K, A.pending), A.pending += K;
        }(m, N, W);
      }
      c._tr_init = function(m) {
        B || (function() {
          var N, W, M, A, $, K = new Array(f + 1);
          for (A = M = 0; A < S - 1; A++) for (R[A] = M, N = 0; N < 1 << T[A]; N++) r[M++] = A;
          for (r[M - 1] = A, A = $ = 0; A < 16; A++) for (Z[A] = $, N = 0; N < 1 << L[A]; N++) O[$++] = A;
          for ($ >>= 7; A < u; A++) for (Z[A] = $ << 7, N = 0; N < 1 << L[A] - 7; N++) O[256 + $++] = A;
          for (W = 0; W <= f; W++) K[W] = 0;
          for (N = 0; N <= 143; ) Y[2 * N + 1] = 8, N++, K[8]++;
          for (; N <= 255; ) Y[2 * N + 1] = 9, N++, K[9]++;
          for (; N <= 279; ) Y[2 * N + 1] = 7, N++, K[7]++;
          for (; N <= 287; ) Y[2 * N + 1] = 8, N++, K[8]++;
          for (ft(Y, k + 1, K), N = 0; N < u; N++) x[2 * N + 1] = 5, x[2 * N] = ot(N, 5);
          X = new et(Y, T, w + 1, k, f), j = new et(x, L, 0, u, f), tt = new et(new Array(0), z, 0, g, p);
        }(), B = !0), m.l_desc = new F(m.dyn_ltree, X), m.d_desc = new F(m.dyn_dtree, j), m.bl_desc = new F(m.bl_tree, tt), m.bi_buf = 0, m.bi_valid = 0, rt(m);
      }, c._tr_stored_block = y, c._tr_flush_block = function(m, N, W, M) {
        var A, $, K = 0;
        0 < m.level ? (m.strm.data_type === 2 && (m.strm.data_type = function(H) {
          var q, at = 4093624447;
          for (q = 0; q <= 31; q++, at >>>= 1) if (1 & at && H.dyn_ltree[2 * q] !== 0) return o;
          if (H.dyn_ltree[18] !== 0 || H.dyn_ltree[20] !== 0 || H.dyn_ltree[26] !== 0) return s;
          for (q = 32; q < w; q++) if (H.dyn_ltree[2 * q] !== 0) return s;
          return o;
        }(m)), pt(m, m.l_desc), pt(m, m.d_desc), K = function(H) {
          var q;
          for (t(H, H.dyn_ltree, H.l_desc.max_code), t(H, H.dyn_dtree, H.d_desc.max_code), pt(H, H.bl_desc), q = g - 1; 3 <= q && H.bl_tree[2 * D[q] + 1] === 0; q--) ;
          return H.opt_len += 3 * (q + 1) + 5 + 5 + 4, q;
        }(m), A = m.opt_len + 3 + 7 >>> 3, ($ = m.static_len + 3 + 7 >>> 3) <= A && (A = $)) : A = $ = W + 5, W + 4 <= A && N !== -1 ? y(m, N, W, M) : m.strategy === 4 || $ === A ? (V(m, 2 + (M ? 1 : 0), 3), gt(m, Y, x)) : (V(m, 4 + (M ? 1 : 0), 3), function(H, q, at, nt) {
          var ht;
          for (V(H, q - 257, 5), V(H, at - 1, 5), V(H, nt - 4, 4), ht = 0; ht < nt; ht++) V(H, H.bl_tree[2 * D[ht] + 1], 3);
          U(H, H.dyn_ltree, q - 1), U(H, H.dyn_dtree, at - 1);
        }(m, m.l_desc.max_code + 1, m.d_desc.max_code + 1, K + 1), gt(m, m.dyn_ltree, m.dyn_dtree)), rt(m), M && st(m);
      }, c._tr_tally = function(m, N, W) {
        return m.pending_buf[m.d_buf + 2 * m.last_lit] = N >>> 8 & 255, m.pending_buf[m.d_buf + 2 * m.last_lit + 1] = 255 & N, m.pending_buf[m.l_buf + m.last_lit] = 255 & W, m.last_lit++, N === 0 ? m.dyn_ltree[2 * W]++ : (m.matches++, N--, m.dyn_ltree[2 * (r[W] + w + 1)]++, m.dyn_dtree[2 * I(N)]++), m.last_lit === m.lit_bufsize - 1;
      }, c._tr_align = function(m) {
        V(m, 2, 3), J(m, v, Y), function(N) {
          N.bi_valid === 16 ? (Q(N, N.bi_buf), N.bi_buf = 0, N.bi_valid = 0) : 8 <= N.bi_valid && (N.pending_buf[N.pending++] = 255 & N.bi_buf, N.bi_buf >>= 8, N.bi_valid -= 8);
        }(m);
      };
    }, { "../utils/common": 41 }], 53: [function(e, a, c) {
      a.exports = function() {
        this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0, this.avail_out = 0, this.total_out = 0, this.msg = "", this.state = null, this.data_type = 2, this.adler = 0;
      };
    }, {}], 54: [function(e, a, c) {
      (function(n) {
        (function(o, s) {
          if (!o.setImmediate) {
            var d, _, S, w, k = 1, u = {}, g = !1, i = o.document, f = Object.getPrototypeOf && Object.getPrototypeOf(o);
            f = f && f.setTimeout ? f : o, d = {}.toString.call(o.process) === "[object process]" ? function(C) {
              process.nextTick(function() {
                p(C);
              });
            } : function() {
              if (o.postMessage && !o.importScripts) {
                var C = !0, E = o.onmessage;
                return o.onmessage = function() {
                  C = !1;
                }, o.postMessage("", "*"), o.onmessage = E, C;
              }
            }() ? (w = "setImmediate$" + Math.random() + "$", o.addEventListener ? o.addEventListener("message", v, !1) : o.attachEvent("onmessage", v), function(C) {
              o.postMessage(w + C, "*");
            }) : o.MessageChannel ? ((S = new MessageChannel()).port1.onmessage = function(C) {
              p(C.data);
            }, function(C) {
              S.port2.postMessage(C);
            }) : i && "onreadystatechange" in i.createElement("script") ? (_ = i.documentElement, function(C) {
              var E = i.createElement("script");
              E.onreadystatechange = function() {
                p(C), E.onreadystatechange = null, _.removeChild(E), E = null;
              }, _.appendChild(E);
            }) : function(C) {
              setTimeout(p, 0, C);
            }, f.setImmediate = function(C) {
              typeof C != "function" && (C = new Function("" + C));
              for (var E = new Array(arguments.length - 1), P = 0; P < E.length; P++) E[P] = arguments[P + 1];
              var T = { callback: C, args: E };
              return u[k] = T, d(k), k++;
            }, f.clearImmediate = l;
          }
          function l(C) {
            delete u[C];
          }
          function p(C) {
            if (g) setTimeout(p, 0, C);
            else {
              var E = u[C];
              if (E) {
                g = !0;
                try {
                  (function(P) {
                    var T = P.callback, L = P.args;
                    switch (L.length) {
                      case 0:
                        T();
                        break;
                      case 1:
                        T(L[0]);
                        break;
                      case 2:
                        T(L[0], L[1]);
                        break;
                      case 3:
                        T(L[0], L[1], L[2]);
                        break;
                      default:
                        T.apply(s, L);
                    }
                  })(E);
                } finally {
                  l(C), g = !1;
                }
              }
            }
          }
          function v(C) {
            C.source === o && typeof C.data == "string" && C.data.indexOf(w) === 0 && p(+C.data.slice(w.length));
          }
        })(typeof self > "u" ? n === void 0 ? this : n : self);
      }).call(this, typeof At < "u" ? At : typeof self < "u" ? self : typeof window < "u" ? window : {});
    }, {}] }, {}, [10])(10);
  });
})(Xt);
var Ue = Xt.exports;
const Mt = /* @__PURE__ */ je(Ue);
class He {
  constructor(h = {}) {
    this.options = {
      componentMap: ze,
      preserveComments: !1,
      strictMode: !1,
      computed_flag: !1,
      customParsers: {},
      ...h
    };
  }
  async convertFromString(h, e) {
    var o, s, d;
    const a = [], c = [], n = [];
    try {
      const _ = Ht(h);
      if (!_.template && !_.scriptSetup && !_.script)
        throw new Error("Invalid Vue SFC: no template or script found");
      let S = [], w = {}, k = {};
      if (_.template)
        try {
          S = (o = this.options.customParsers) != null && o.template ? this.options.customParsers.template.parse(_.template) : le(_.template, this.options);
        } catch (i) {
          if (a.push(`Template parsing error: ${i.message}`), this.options.strictMode) throw i;
        }
      const u = _.scriptSetup || _.script;
      if (u)
        try {
          if (w = (s = this.options.customParsers) != null && s.script ? this.options.customParsers.script.parse(u) : Ce(u, {
            isSetup: !!_.scriptSetup,
            ...this.options
          }), w.imports && n.push(...w.imports.map((i) => i.source)), w.error) {
            const i = w.error;
            if (a.push(`Script parsing error: ${i}`), this.options.strictMode) throw new Error(i);
          }
        } catch (i) {
          if (a.push(`Script parsing error: ${i.message}`), this.options.strictMode) throw i;
        }
      if (_.style)
        try {
          k = (d = this.options.customParsers) != null && d.style ? this.options.customParsers.style.parse(_.style) : Ne(_.style, this.options);
        } catch (i) {
          if (a.push(`Style parsing error: ${i.message}`), this.options.strictMode) throw i;
        }
      return e && (this.options.fileName = e.replace(/\.vue$/i, "")), {
        schema: await De(S, w, k, this.options),
        dependencies: [...new Set(n)],
        errors: a,
        warnings: c
      };
    } catch (_) {
      return a.push(`Conversion error: ${_.message}`), { schema: null, dependencies: [], errors: a, warnings: c };
    }
  }
  async convertFromFile(h) {
    try {
      const e = await it.readFile(h, "utf-8"), a = it.basename(h, ".vue");
      return await this.convertFromString(e, a);
    } catch (e) {
      return { schema: null, dependencies: [], errors: [`File reading error: ${e.message}`], warnings: [] };
    }
  }
  async convertMultipleFiles(h) {
    const e = [];
    for (const a of h)
      try {
        const c = await this.convertFromFile(a);
        e.push(c);
      } catch (c) {
        e.push({
          schema: null,
          dependencies: [],
          errors: [`Failed to convert ${a}: ${c.message}`],
          warnings: []
        });
      }
    return e;
  }
  // Recursively walk a directory and collect files that match a predicate
  async walk(h, e, a = []) {
    try {
      const c = await it.readdir(h, { withFileTypes: !0 });
      for (const n of c) {
        const o = it.join(h, n.name);
        n.isDirectory() ? await this.walk(o, e, a) : n.isFile() && e(o, n) && a.push(o);
      }
    } catch {
    }
    return a;
  }
  // Convert a full app directory (e.g., test/full/input/appdemo01) into an aggregated schema.json
  async convertAppDirectory(h) {
    const e = it.join(h, "src"), a = it.join(e, "views"), c = await this.walk(a, (k) => k.endsWith(".vue")), o = (await this.convertMultipleFiles(c)).map((k) => k.schema).filter(Boolean);
    let s = { en_US: {}, zh_CN: {} };
    try {
      const k = it.join(e, "i18n", "en_US.json"), u = it.join(e, "i18n", "zh_CN.json"), [g, i] = await Promise.all([
        it.readFile(k, "utf-8").catch(() => "{}"),
        it.readFile(u, "utf-8").catch(() => "{}")
      ]);
      s = { en_US: JSON.parse(g), zh_CN: JSON.parse(i) };
    } catch {
    }
    const d = [];
    try {
      const k = it.join(e, "utils.js"), u = await it.readFile(k, "utf-8"), g = /import\s+(?:{\s*([\w,\s]+)\s*}|([\w$]+))\s+from\s+['"]([^'"]+)['"]/g, i = [];
      let f;
      for (; f = g.exec(u); ) {
        const C = f[1], E = f[2], P = f[3];
        C ? C.split(",").map((T) => T.trim()).filter(Boolean).forEach((T) => i.push({ local: T, source: P, destructuring: !0 })) : E && i.push({ local: E, source: P, destructuring: !1 });
      }
      const l = /export\s*{([^}]+)}/, p = u.match(l), v = p ? p[1].split(",").map((C) => C.trim()).filter(Boolean) : [];
      for (const C of v) {
        const E = i.find((P) => P.local === C);
        E ? d.push({
          name: C,
          type: "npm",
          content: {
            type: "JSFunction",
            value: "",
            package: E.source,
            destructuring: E.destructuring,
            exportName: C
          }
        }) : d.push({ name: C, type: "function", content: { type: "JSFunction", value: "" } });
      }
    } catch {
    }
    const _ = { list: [] };
    try {
      const k = it.join(e, "lowcodeConfig", "dataSource.json"), u = await it.readFile(k, "utf-8"), g = JSON.parse(u);
      Array.isArray(g.list) && (_.list = g.list);
    } catch {
    }
    const S = [];
    try {
      const k = it.join(e, "stores"), u = await this.walk(k, (g) => g.endsWith(".js"));
      for (const g of u) {
        const i = await it.readFile(g, "utf-8");
        if (!/defineStore\s*\(/.test(i)) continue;
        const f = i.match(/id:\s*['"]([^'"]+)['"]/), l = i.match(/state:\s*\(\)\s*=>\s*\((\{[\s\S]*?\})\)/), p = { id: f ? f[1] : it.basename(g, it.extname(g)) };
        if (l)
          try {
            const v = l[1], C = Function(`return (${v})`)();
            p.state = C;
          } catch {
            p.state = {};
          }
        else
          continue;
        p.state && typeof p.state == "object" && Object.keys(p.state).length > 0 && S.push(p);
      }
    } catch {
    }
    try {
      const k = it.join(e, "router", "index.js"), u = await it.readFile(k, "utf-8"), g = u.match(/redirect:\s*\{\s*name:\s*['"]([^'"]+)['"]/), i = g ? g[1] : "", f = u.replace(/redirect\s*:\s*\{[\s\S]*?\}/, ""), l = [], p = /name:\s*['"]([^'"]+)['"][\s\S]*?path:\s*['"]([^'"]+)['"][\s\S]*?component:\s*\(\)\s*=>\s*import\(\s*['"]([^'"]+)['"]\s*\)/g;
      let v;
      for (; v = p.exec(f); )
        l.push({ routeName: v[1], routePath: v[2], importPath: v[3] });
      const C = {};
      for (const E of l) {
        const P = it.basename(E.importPath).replace(/\.vue$/i, "");
        C[P] = { routeName: E.routeName, routePath: E.routePath, isHome: E.routeName === i };
      }
      for (const E of o) {
        const P = E == null ? void 0 : E.fileName;
        if (!P) continue;
        const T = C[P];
        T && (E.meta = E.meta || {}, E.meta.router = T.routePath.startsWith("/") ? T.routePath.slice(1) : T.routePath, E.meta.isPage = !0, E.meta.isHome = !!T.isHome);
      }
    } catch {
    }
    return Ot(o, {
      i18n: s,
      utils: d,
      dataSource: _,
      globalState: S
    });
  }
  setOptions(h) {
    this.options = { ...this.options, ...h };
  }
  getOptions() {
    return { ...this.options };
  }
  // Convert an app from a zip buffer (in-memory). The buffer should be the content of the zip file (not a path).
  async convertAppFromZip(h) {
    if (typeof window < "u" && typeof window.document < "u") {
      const _ = await Mt.loadAsync(h), S = Object.keys(_.files || {}).filter((z) => !_.files[z].dir).filter((z) => !z.startsWith("__MACOSX/")), w = new Set(
        S.map((z) => z.split("/")[0]).filter((z) => !!z && z !== "." && z !== "..")
      );
      let k = "";
      w.size === 1 && (k = [...w][0] + "/");
      const u = (z) => k ? k + z.replace(/^\/+/, "") : z.replace(/^\/+/, ""), g = async (z) => {
        const D = _.file(z);
        return D ? await D.async("string") : null;
      }, i = u("src/views/"), f = S.filter((z) => z.startsWith(i) && z.endsWith(".vue")), l = [];
      for (const z of f) {
        const D = await g(z);
        if (!D) continue;
        const x = (z.split("/").pop() || "Page.vue").replace(/\.vue$/i, ""), O = await this.convertFromString(D, x);
        O.schema && l.push(O.schema);
      }
      let p = { en_US: {}, zh_CN: {} };
      try {
        const z = await g(u("src/i18n/en_US.json")) || "{}", D = await g(u("src/i18n/zh_CN.json")) || "{}";
        p = { en_US: JSON.parse(z), zh_CN: JSON.parse(D) };
      } catch {
      }
      const v = [];
      try {
        const z = await g(u("src/utils.js"));
        if (z) {
          const D = /import\s+(?:{\s*([\w,\s]+)\s*}|([\w$]+))\s+from\s+['"]([^'"]+)['"]/g, Y = [];
          let x;
          for (; x = D.exec(z); ) {
            const X = x[1], j = x[2], tt = x[3];
            X ? X.split(",").map((Z) => Z.trim()).filter(Boolean).forEach((Z) => Y.push({ local: Z, source: tt, destructuring: !0 })) : j && Y.push({ local: j, source: tt, destructuring: !1 });
          }
          const O = /export\s*{([^}]+)}/, r = z.match(O), R = r ? r[1].split(",").map((X) => X.trim()).filter(Boolean) : [];
          for (const X of R) {
            const j = Y.find((tt) => tt.local === X);
            j ? v.push({
              name: X,
              type: "npm",
              content: {
                type: "JSFunction",
                value: "",
                package: j.source,
                destructuring: j.destructuring,
                exportName: X
              }
            }) : v.push({ name: X, type: "function", content: { type: "JSFunction", value: "" } });
          }
        }
      } catch {
      }
      const C = { list: [] };
      try {
        const z = await g(u("src/lowcodeConfig/dataSource.json"));
        if (z) {
          const D = JSON.parse(z);
          Array.isArray(D.list) && (C.list = D.list);
        }
      } catch {
      }
      const E = u("src/stores/"), P = S.filter((z) => z.startsWith(E) && z.endsWith(".js")), T = [];
      for (const z of P)
        try {
          const D = await g(z);
          if (!D || !/defineStore\s*\(/.test(D)) continue;
          const Y = D.match(/id:\s*['"]([^'"]+)['"]/), x = D.match(/state:\s*\(\)\s*=>\s*\((\{[\s\S]*?\})\)/), O = { id: Y ? Y[1] : (z.split("/").pop() || "store").replace(/\.[^.]+$/, "") };
          if (x)
            try {
              const r = x[1], R = Function(`return (${r})`)();
              O.state = R;
            } catch {
              O.state = {};
            }
          else
            continue;
          O.state && typeof O.state == "object" && Object.keys(O.state).length > 0 && T.push(O);
        } catch {
        }
      try {
        const z = await g(u("src/router/index.js"));
        if (z) {
          const D = z.match(/redirect:\s*\{\s*name:\s*['"]([^'"]+)['"]/), Y = D ? D[1] : "", x = z.replace(/redirect\s*:\s*\{[\s\S]*?\}/, ""), O = [], r = /name:\s*['"]([^'"]+)['"][\s\S]*?path:\s*['"]([^'"]+)['"][\s\S]*?component:\s*\(\)\s*=>\s*import\(\s*['"]([^'"]+)['"]\s*\)/g;
          let R;
          for (; R = r.exec(x); )
            O.push({ routeName: R[1], routePath: R[2], importPath: R[3] });
          const X = {};
          for (const j of O) {
            const tt = (j.importPath.split("/").pop() || "").replace(/\.vue$/i, "");
            X[tt] = { routeName: j.routeName, routePath: j.routePath, isHome: j.routeName === Y };
          }
          for (const j of l) {
            const tt = j == null ? void 0 : j.fileName;
            if (!tt) continue;
            const Z = X[tt];
            Z && (j.meta = j.meta || {}, j.meta.router = Z.routePath.startsWith("/") ? Z.routePath.slice(1) : Z.routePath, j.meta.isPage = !0, j.meta.isHome = !!Z.isHome);
          }
        }
      } catch {
      }
      return Ot(l, {
        i18n: p,
        utils: v,
        dataSource: C,
        globalState: T
      });
    }
    const e = await it.mkdtemp(it.join(it.tmpdir(), "vue-to-dsl-")), a = await Mt.loadAsync(h), c = [], n = [];
    a.forEach((_, S) => {
      if (_.startsWith("__MACOSX/")) return;
      const w = it.join(e, _);
      S.dir ? n.push(it.mkdir(w, { recursive: !0 })) : (c.push(_), n.push(
        (async () => {
          await it.mkdir(it.dirname(w), { recursive: !0 });
          const k = await S.async("nodebuffer");
          await it.writeFile(w, k);
        })()
      ));
    }), await Promise.all(n);
    const o = new Set(
      c.map((_) => _.split("/")[0]).filter((_) => !!_ && _ !== "." && _ !== "..")
    );
    let s = e;
    if (o.size === 1) {
      const _ = [...o][0];
      s = it.join(e, _);
    }
    return await this.convertAppDirectory(s);
  }
  async convertAppFromDirectory(h) {
    const e = Array.from(h);
    let a = [];
    const c = async (i) => new Promise((f, l) => {
      const p = new FileReader();
      p.onload = () => f(p.result), p.onerror = () => l(p.error), p.readAsText(i);
    }), n = (i) => {
      const l = i.split(`
`).map((p) => p.trim()).filter((p) => p && !p.startsWith("#")).map((p) => {
        const v = p.startsWith("!"), E = (v ? p.slice(1) : p).replace(/([.+?^${}()|[\]\\])/g, "\\$1").replace(/\/\*\*$/, "/.*").replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*").replace(/\?/g, "[^/]");
        return E.endsWith("/") ? { regex: new RegExp(`^${E}`), isNegative: v } : { regex: new RegExp(`^${E}(/.*)?$`), isNegative: v };
      });
      return (p) => {
        let v = !1;
        for (const { regex: C, isNegative: E } of l)
          C.test(p) && (v = !E);
        return !v;
      };
    }, o = e.find((i) => i.webkitRelativePath.endsWith("/.gitignore"));
    if (o) {
      const i = await c(o), f = o.webkitRelativePath.split("/")[0], l = n(i);
      a = e.filter((p) => {
        const v = p.webkitRelativePath.slice(f.length + 1);
        return v && l(v);
      });
    } else
      a = e.filter((i) => !i.webkitRelativePath.includes("node_modules"));
    const s = a.filter(
      (i) => i.webkitRelativePath.includes("src/views/") && i.name.endsWith(".vue")
    ), d = [];
    for (const i of s) {
      const f = await c(i);
      if (!f) continue;
      const p = (i.name || "Page.vue").replace(/\.vue$/i, ""), v = await this.convertFromString(f, p);
      v.schema && d.push(v.schema);
    }
    let _ = { en_US: {}, zh_CN: {} };
    try {
      const i = a.find((v) => v.webkitRelativePath.endsWith("src/i18n/en_US.json")), f = a.find((v) => v.webkitRelativePath.endsWith("src/i18n/zh_CN.json")), l = i ? await c(i) : "{}", p = f ? await c(f) : "{}";
      _ = { en_US: JSON.parse(l), zh_CN: JSON.parse(p) };
    } catch {
    }
    const S = [];
    try {
      const i = a.find((f) => f.webkitRelativePath.endsWith("src/utils.js"));
      if (i) {
        const f = await c(i), l = /import\s+(?:{\s*([\w,\s]+)\s*}|([\w$]+))\s+from\s+['"]([^'"]+)['"]/g, p = [];
        let v;
        for (; v = l.exec(f); ) {
          const T = v[1], L = v[2], z = v[3];
          T ? T.split(",").map((D) => D.trim()).filter(Boolean).forEach((D) => p.push({ local: D, source: z, destructuring: !0 })) : L && p.push({ local: L, source: z, destructuring: !1 });
        }
        const C = /export\s*{([^}]+)}/, E = f.match(C), P = E ? E[1].split(",").map((T) => T.trim()).filter(Boolean) : [];
        for (const T of P) {
          const L = p.find((z) => z.local === T);
          L ? S.push({
            name: T,
            type: "npm",
            content: {
              type: "JSFunction",
              value: "",
              package: L.source,
              destructuring: L.destructuring,
              exportName: T
            }
          }) : S.push({ name: T, type: "function", content: { type: "JSFunction", value: "" } });
        }
      }
    } catch {
    }
    const w = { list: [] };
    try {
      const i = a.find((f) => f.webkitRelativePath.endsWith("src/lowcodeConfig/dataSource.json"));
      if (i) {
        const f = await c(i), l = JSON.parse(f);
        Array.isArray(l.list) && (w.list = l.list);
      }
    } catch {
    }
    const k = a.filter(
      (i) => i.webkitRelativePath.includes("src/stores/") && i.name.endsWith(".js")
    ), u = [];
    for (const i of k)
      try {
        const f = await c(i);
        if (!f || !/defineStore\s*\(/.test(f)) continue;
        const l = f.match(/id:\s*['"]([^'"]+)['"]/), p = f.match(/state:\s*\(\)\s*=>\s*\((\{[\s\S]*?\})\)/), v = { id: l ? l[1] : i.name.replace(/\.[^.]+$/, "") };
        if (p)
          try {
            const C = p[1], E = Function(`return (${C})`)();
            v.state = E;
          } catch {
            v.state = {};
          }
        else
          continue;
        v.state && typeof v.state == "object" && Object.keys(v.state).length > 0 && u.push(v);
      } catch {
      }
    try {
      const i = a.find((f) => f.webkitRelativePath.endsWith("src/router/index.js"));
      if (i) {
        const f = await c(i), l = f.match(/redirect:\s*\{\s*name:\s*['"]([^'"]+)['"]/), p = l ? l[1] : "", v = f.replace(/redirect\s*:\s*\{[\s\S]*?\}/, ""), C = [], E = /name:\s*['"]([^'"]+)['"][\s\S]*?path:\s*['"]([^'"]+)['"][\s\S]*?component:\s*\(\)\s*=>\s*import\(\s*['"]([^'"]+)['"]\s*\)/g;
        let P;
        for (; P = E.exec(v); ) C.push({ routeName: P[1], routePath: P[2], importPath: P[3] });
        const T = {};
        for (const L of C) {
          const z = (L.importPath.split("/").pop() || "").replace(/\.vue$/i, "");
          T[z] = { routeName: L.routeName, routePath: L.routePath, isHome: L.routeName === p };
        }
        for (const L of d) {
          const z = L == null ? void 0 : L.fileName;
          if (!z) continue;
          const D = T[z];
          D && (L.meta = L.meta || {}, L.meta.router = D.routePath.startsWith("/") ? D.routePath.slice(1) : D.routePath, L.meta.isPage = !0, L.meta.isHome = !!D.isHome);
        }
      }
    } catch {
    }
    return Ot(d, {
      i18n: _,
      utils: S,
      dataSource: w,
      globalState: u
    });
  }
}
export {
  He as VueToDslConverter,
  Ot as generateAppSchema,
  De as generateSchema,
  Ht as parseSFC,
  Ce as parseScript,
  Ne as parseStyle,
  le as parseTemplate,
  $e as parseVueFile
};
