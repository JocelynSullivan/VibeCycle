import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
// import App from "./App.tsx";
import AuthProvider from "./provider/AuthProvider.tsx";
import Routes from "./routes/index.tsx";
// import Login from "./pages/Login.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <Routes />
      {/* <Login /> */}
      {/* <App /> */}
    </AuthProvider>
  </StrictMode>
);
