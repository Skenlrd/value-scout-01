console.log("TEST: Node is working");
console.log("TEST: Loading dotenv...");
import("dotenv").then(({ default: dotenv }) => {
  console.log("TEST: dotenv loaded");
  dotenv.config();
  console.log("TEST: dotenv config called");
  console.log("TEST: MONGO_URI =", process.env.MONGO_URI ? "SET" : "NOT SET");
  console.log("TEST: PORT =", process.env.PORT || "8000");
  process.exit(0);
}).catch(err => {
  console.error("TEST ERROR:", err);
  process.exit(1);
});
