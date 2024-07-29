import { ChatMistralAI } from "@langchain/mistralai";

const model = new ChatMistralAI({
  model: "mistral-large-latest",
  temperature: 0,
  apiKey: process.env.MISTRAL_API_KEY
});

export { model };
