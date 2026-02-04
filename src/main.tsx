import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Immediately render the app - auth state is handled in UserMenu via onAuthStateChange
createRoot(document.getElementById("root")!).render(<App />);
