<template>
  <div>
    <ai-plugin-component-editor />
  </div>
</template>

<script lang="jsx">
import Component, {Trigger} from "./ComponentEditor.tsx";
import { getCustomElement } from "../custom-element";

customElements.define("ai-plugin-component-editor", getCustomElement(Component, Trigger));
export default {};
</script>
