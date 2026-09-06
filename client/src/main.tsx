import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const analyticsEndpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT as string | undefined;
const analyticsWebsiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID as string | undefined;
if (analyticsEndpoint && analyticsWebsiteId) {
	try {
		const endpoint = new URL(analyticsEndpoint);
		const script = document.createElement("script");
		script.defer = true;
		script.src = new URL("/umami", endpoint).toString();
		script.dataset.websiteId = analyticsWebsiteId;
		document.head.appendChild(script);
	} catch {
		// Analytics stays disabled when the endpoint is not a valid absolute URL.
	}
}

createRoot(document.getElementById("root")!).render(<App />);
