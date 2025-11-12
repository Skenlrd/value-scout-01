#!/usr/bin/env node
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import axios from "axios";

// Load and log immediately
dotenv.config();
console.log("✅ Environment loaded");
console.log("PORT:", process.env.PORT || 8000);
console.log("MONGO_URI:", process.env.MONGO_URI ? "SET" : "NOT SET");
console.log("AI_API_URL:", process.env.AI_API_URL || "not set");

const PORT = process.env.PORT || 8000;
const app = express();

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Backend is running" });
});

app.listen(PORT, () => {
  console.log(`✅ Server started on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
});
