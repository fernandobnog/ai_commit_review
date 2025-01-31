// models.js

// Enum for OpenAI models
export const OpenAIModels = Object.freeze({
  GPT_4O_MINI: "gpt-4o-mini",
  LLAMA_LOCAL: "meta-llama-3.1-8b-instruct@q4_k_m",
  DEEPSEEK_LOCAL: "deepseek-r1-distill-qwen-7b",
});

// Enum for configuration keys
export const ConfigKeys = Object.freeze({
  OPENAI_API_BASEURL: "OPENAI_API_BASEURL",
  OPENAI_API_KEY: "OPENAI_API_KEY",
  OPENAI_API_MODEL: "OPENAI_API_MODEL",
  OPENAI_RESPONSE_LANGUAGE: "OPENAI_RESPONSE_LANGUAGE",
});

// Enum for supported languages with popular variations
export const SupportedLanguages = Object.freeze({
  EN_US: { code: "en-US", name: "English (US)" },
  EN_GB: { code: "en-GB", name: "English (UK)" },
  ES: { code: "es", name: "Spanish" },
  ZH: { code: "zh", name: "Mandarin" },
  HI: { code: "hi", name: "Hindi" },
  AR: { code: "ar", name: "Arabic" },
  FR: { code: "fr", name: "French" },
  RU: { code: "ru", name: "Russian" },
  PT_BR: { code: "pt-BR", name: "Portuguese (Brazil)" },
  PT_PT: { code: "pt-PT", name: "Portuguese (Portugal)" },
});

export const PromptType = Object.freeze({
  ANALYZE: "analyze",
  CREATE: "create",
});