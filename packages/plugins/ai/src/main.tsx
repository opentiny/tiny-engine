import React from "react";
import ReactDOM from "react-dom/client";
import ComponentEditor, {
  Trigger,
} from "./plugins/component-editor/ComponentEditor";
import "./index.css";
import ApiConfigSteps from "./components/business/ApiConfigSteps";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ApiConfigSteps Component={ComponentEditor} Trigger={Trigger} />
  </React.StrictMode>
);
