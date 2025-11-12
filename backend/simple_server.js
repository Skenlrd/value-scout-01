#!/usr/bin/env node
console.log("✅ Script started");

import("express").then(({ default: express }) => {
  console.log("✅ Express imported");
  
  const app = express();
  const PORT = 8000;
  
  app.get("/", (req, res) => {
    res.send("Server is running");
  });
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error("❌ Error:", err.message);
});
