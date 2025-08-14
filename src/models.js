// models.js

// Enum for OpenAI models
export const OpenAIModels = Object.freeze({
  GPT_5_NANO: "gpt-5-nano",
  OSS_20B_LOCAL: "openai/gpt-oss-20b",
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
  PT_BR: { code: "pt-BR", name: "Portuguese (Brazil)" },
});

export const PromptType = Object.freeze({
  ANALYZE: "analyze",
  CREATE: "create",
});