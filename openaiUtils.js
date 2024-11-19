// openaiUtils.js
const { OpenAI } = require("openai");

// Função para analisar o código
async function analyzeUpdatedCode(files, openaiInstance, config) {
  const prompt = files
    .map(
      (file) => `Analise o seguinte arquivo:
Nome do arquivo: ${file.filename}
Código:
${file.content}

Responda:
1. O código segue boas práticas? Justifique.
2. Existem problemas de legibilidade, eficiência ou estilo? Sugira melhorias.
3. Há algo que pode ser otimizado ou reestruturado? Explique.`
    )
    .join("\n");

  try {
    const response = await openaiInstance.chat.completions.create({
      model: config.OPENAI_API_MODEL,
      messages: [{ role: "user", content: prompt }]
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error(
      "Erro ao analisar código:",
      error.response?.data || error.message
    );
    throw error;
  }
}

module.exports = {
  analyzeUpdatedCode,
};
