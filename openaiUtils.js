// openaiUtils.js

const { OpenAI } = require("openai");

// Função para analisar o código
async function analyzeUpdatedCode(files, openaiInstance, config) {
  const prompt = files
    .map(
      (file) => `Analise as seguintes alterações no arquivo ${file.filename}:
\`\`\`diff
${file.content}
\`\`\`

Responda:
1. Descreva resumidamente o que foi alterado.
2. As mudanças seguem boas práticas? Justifique.
3. Existem problemas de legibilidade, eficiência ou estilo nas mudanças? Sugira melhorias.
4. Recomendações adicionais para melhorar o código.`
    )
    .join("\n\n");

  try {
    const response = await openaiInstance.chat.completions.create({
      model: config.OPENAI_API_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
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
