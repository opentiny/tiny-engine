import ApiConfigSteps from "@/components/business/ApiConfigSteps";
import ReactDOM, { Root } from "react-dom/client";

export function getCustomElement(Component: React.FC, Trigger: React.FC) {
  class CustomElement extends HTMLElement {
    root: null | Root;

    constructor() {
      super();
      this.root = null;
    }

    connectedCallback() {
      this.root = ReactDOM.createRoot(this);
      this.root.render(
        <ApiConfigSteps Component={Component} Trigger={Trigger} />
      );
    }

    disconnectedCallback() {
      if (this.root) {
        this.root.unmount();
      }
    }
  }

  return CustomElement;
}
