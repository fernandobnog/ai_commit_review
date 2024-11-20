// models.js

// Enum for OpenAI models
export const OpenAIModels = Object.freeze({
  GPT_4O: "gpt-4o",
  GPT_4O_MINI: "gpt-4o-mini",
  GPT_4: "gpt-4",
  GPT_4_TURBO: "gpt-4-turbo",
  GPT_3_5_TURBO: "gpt-3.5-turbo",
  O1_PREVIEW: "o1-preview",
  O1_MINI: "o1-mini",
});

// Enum for configuration keys
export const ConfigKeys = Object.freeze({
  OPENAI_API_KEY: "OPENAI_API_KEY",
  OPENAI_API_MODEL: "OPENAI_API_MODEL",
});
