import i18n from "i18n";
import path from "path";
import fs from "fs";
import { loadConfig } from "./config.js";
import { ConfigKeys } from "./models.js";

// Caminho para a pasta locales
const localesDir = path.join(process.cwd(), "locales");

// Obter idiomas disponíveis na pasta locales
const getAvailableLocales = () => {
  const files = fs.readdirSync(localesDir); // Listar arquivos na pasta
  return files.map((file) => path.parse(file).name); // Extrair nomes sem extensão
};

const config = loadConfig();

// Configure o i18n
i18n.configure({
  locales: getAvailableLocales(), // Adicione mais idiomas, se necessário
  directory: localesDir, // Diretório onde estão os arquivos de tradução
  defaultLocale: config[ConfigKeys.OPENAI_RESPONSE_LANGUAGE] || "en",
  objectNotation: true,
});

// Exportar a instância configurada
export default i18n;
