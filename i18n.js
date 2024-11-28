import i18n from "i18n";
import path from "path";
import fs from "fs";
import { loadConfig } from "./config.js";
import { ConfigKeys } from "./models.js";
import { fileURLToPath } from "url";

// Resolver __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Diretório 'locales' no mesmo local do script
const localesDir = path.resolve(__dirname, "locales");

// Obter idiomas disponíveis na pasta locales
const getAvailableLocales = () => {
  try {
    console.log("Diretório de idiomas:", localesDir);
    const files = fs.readdirSync(localesDir); // Listar arquivos na pasta
    return files.map((file) => path.parse(file).name); // Extrair nomes sem extensão
  } catch (error) {
    console.error(
      `Erro ao acessar o diretório de idiomas: ${localesDir}`,
      error
    );
    return []; // Retorna array vazio em caso de erro
  }
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
