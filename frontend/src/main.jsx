import React    from "react";
import ReactDOM  from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster }       from "react-hot-toast";

import App           from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { Web3Provider } from "./context/Web3Context.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* Auth context wraps the whole app */}
      <AuthProvider>
        {/* Web3/MetaMask context */}
        <Web3Provider>
          <App />
          {/* Global toast notification container */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background:  "#0d1224",
                color:       "#e0e8ff",
                border:      "1px solid #1a2540",
                borderRadius: "10px",
                fontSize:    "14px",
                fontFamily:  "'DM Sans', sans-serif",
              },
              success: {
                iconTheme: { primary: "#00ff88", secondary: "#0d1224" },
              },
              error: {
                iconTheme: { primary: "#ff4466", secondary: "#0d1224" },
              },
            }}
          />
        </Web3Provider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);