import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { OrderFlowProvider } from "./context/OrderFlowContext";

createRoot(document.getElementById("root")!).render(
  <OrderFlowProvider>
    <App />
  </OrderFlowProvider>
);
