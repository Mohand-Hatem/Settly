process.env.NODE_ENV = "test";
import { server } from "../dist/settly-api.js";

console.log("Testing backend health check...");

const PORT = 4001;

server.listen(PORT, async () => {
  try {
    const res = await fetch(`http://localhost:${PORT}/health`);
    const data = await res.json();
    console.log("Response status:", res.status);
    console.log("Response data:", data);

    if (res.status === 200 && data.status === "ok" && data.service === "settly-api") {
      console.log("✅ Backend healthcheck verification passed!");
    } else {
      console.error("❌ Unexpected response:", data);
      process.exit(1);
    }
  } catch (err) {
    console.error("❌ Healthcheck test failed:", err);
    process.exit(1);
  } finally {
    server.close(() => {
      console.log("Test server closed cleanly.");
      process.exit(0);
    });
  }
});
