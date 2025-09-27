import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config(); // ensures .env is loaded

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export { groq }; // 👈 named export
