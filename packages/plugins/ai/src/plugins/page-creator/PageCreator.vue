<template>
  <div>
    <ai-plugin-page-creator />
  </div>
</template>

<script lang="jsx">
import Component, { Trigger } from "./PageCreator.tsx";
import { getCustomElement } from "../custom-element";

customElements.define("ai-plugin-page-creator", getCustomElement(Component, Trigger));
export default {};
</script>
