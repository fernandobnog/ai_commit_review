import i18n from "i18n";
import path from "path";
import { loadConfig } from "./config.js";
import { ConfigKeys } from "./models.js";

const config = loadConfig();

// Configure o i18n
i18n.configure({
  locales: ["en", "pt-BR"], // Adicione mais idiomas, se necessário
  directory: path.join(process.cwd(), "locales"), // Diretório onde estão os arquivos de tradução
  defaultLocale: config[ConfigKeys.OPENAI_RESPONSE_LANGUAGE] || "en",
  objectNotation: true,
});

// Exportar a instância configurada
export default i18n;
