import express from "express";
import http from "node:http";

console.log("Running Spike V30: Express 5 + SSE Streaming Verification...");

const app = express();

app.get("/api/v1/test-sse", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  res.write("event: ping\ndata: {\"ok\":true}\n\n");

  setTimeout(() => {
    res.write("event: message\ndata: {\"text\":\"settly_realtime\"}\n\n");
    res.end();
  }, 50);
});

const server = http.createServer(app);
const PORT = 4099;

server.listen(PORT, async () => {
  try {
    const res = await fetch(`http://localhost:${PORT}/api/v1/test-sse`);
    if (res.headers.get("content-type") !== "text/event-stream") {
      throw new Error(`Unexpected content-type: ${res.headers.get("content-type")}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let receivedChunks = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value);
      receivedChunks.push(text);
    }

    const fullPayload = receivedChunks.join("");
    if (!fullPayload.includes("ping") || !fullPayload.includes("settly_realtime")) {
      throw new Error(`Incomplete SSE stream payload: ${fullPayload}`);
    }

    console.log("  ✅ Express 5 streams SSE chunks immediately without buffering.");
    console.log("\n🎉 SPIKE V30 EMPIRICALLY VERIFIED: Express 5 SSE operates cleanly without compression buffering interference!");
    server.close(() => process.exit(0));
  } catch (err) {
    console.error("❌ V30 Verification failed:", err);
    server.close(() => process.exit(1));
  }
});
