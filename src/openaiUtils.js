import chalk from "chalk";
import { validateConfiguration, updateValidApiKey } from "./configManager.js";
import { OpenAI } from "openai";
import { PromptType, SupportedLanguages } from "./models.js";

/**
 * Generates the language instruction for OpenAI prompts.
 */
function generateLanguageInstruction(langcode) {
  const languageMap = Object.values(SupportedLanguages).reduce((map, lang) => {
    map[lang.code] = lang.name;
    return map;
  }, {});
  const language = languageMap[langcode];
  return `Please respond entirely in ${language}.`;
}

/**
 * Generates the prompt for analyzing code changes.
 */
function generatePrompt(files, promptType, config) {
  const diffs = files
    .map(
      (file) => `
          **${file.filename}:**
          \`\`\`
          ${file.diff}
          \`\`\``
    )
    .join("\n");

  const languageInstruction = generateLanguageInstruction(
    config.OPENAI_RESPONSE_LANGUAGE
  );

  if (promptType === PromptType.ANALYZE) {
    return `Assuma o papel de um revisor de código sênior.

            Analise detalhadamente as seguintes alterações de código (commits) fornecidas:
            
            ${diffs}
            
            Para cada arquivo modificado, organize sua análise da seguinte forma:

            **Arquivo: [Nome do Arquivo]**

            1.  **Resumo Detalhado das Modificações:**
                * Qual foi o objetivo principal e o impacto esperado das alterações neste arquivo?
                * Descreva as principais funcionalidades ou lógicas que foram adicionadas, removidas ou significativamente alteradas.

            2.  **Identificação de Erros, Bugs Potenciais e Vulnerabilidades:**
                * Existem erros de lógica, falhas no tratamento de exceções, condições de corrida (race conditions), vazamentos de memória, ou outros bugs?
                * Foram introduzidas ou negligenciadas vulnerabilidades de segurança (ex: SQL Injection, XSS, manipulação insegura de entradas)?
                * Para cada item identificado:
                    * Cite o trecho de código relevante (ou a linha aproximada).
                    * Explique detalhadamente a natureza do problema.
                    * Descreva o impacto potencial (ex: comportamento incorreto, falha no sistema, brecha de segurança).

            3.  **Sugestões de Melhoria e Otimização (com justificativas):**
                * O código pode ser refatorado para aumentar a clareza, legibilidade ou manutenibilidade? (Ex: simplificar lógica complexa, extrair métodos/funções, aplicar princípios de design como DRY - Don't Repeat Yourself).
                * Existem oportunidades para otimizar o desempenho? (Ex: algoritmos mais eficientes, redução de operações custosas, otimização de queries de banco de dados).
                * A testabilidade do código pode ser aprimorada? Como?
                * Para cada sugestão, forneça uma justificativa clara e, se possível, um pequeno exemplo de como poderia ser implementada.

            4.  **Recomendações de Boas Práticas e Qualidade de Código:**
                * Avalie a aderência a princípios de código limpo (Clean Code): nomes significativos para variáveis e funções, funções curtas e com responsabilidade única, baixo acoplamento e alta coesão.
                * O código segue as convenções de estilo da linguagem ou do projeto (se conhecidas)?
                * Os comentários são adequados? Eles explicam o "porquê" e as intenções, e não apenas "o quê" o código faz?
                * A modularidade e a reutilização de código foram bem aplicadas ou há oportunidades para tal?

            **Considerações Gerais sobre o Commit (se aplicável):**
            * Há alguma observação sobre a mensagem do commit (clareza, completude)?
            * As alterações parecem coesas e alinhadas com um único objetivo, ou misturam diferentes preocupações?
            * Existem implicações mais amplas na arquitetura do sistema ou em outros módulos?

            Sua análise deve ser:
            * **Completa e Específica:** Forneça detalhes suficientes e baseie suas observações diretamente nos trechos de código do diff. Evite afirmações genéricas.
            * **Precisa e Justificada:** Certifique-se de que suas observações sobre erros ou melhorias são tecnicamente corretas e bem fundamentadas.
            * **Construtiva:** O objetivo é auxiliar na melhoria da qualidade do código.
            * **Objetiva:** Mantenha um tom neutro e profissional, focado nos aspectos técnicos.

            ${languageInstruction}`;
  }

  if (promptType === PromptType.CREATE) {
    return `Sua tarefa é gerar um título de commit e uma mensagem de commit (corpo) que sejam precisos, informativos e sigam as melhores práticas de controle de versão. A resposta deve respeitar o idioma predominante no conteúdo dos arquivos fornecidos nos diffs.

            **Contexto:**
            Você está analisando as seguintes alterações de código (diffs). Seu objetivo é resumir essas alterações de forma clara para que outros desenvolvedores (e seu eu futuro) possam entender facilmente o propósito e o impacto de cada commit.
            
            **Diffs:**
            ${diffs}

            **Processo de Análise Interna (Passos que você deve seguir antes de formular a resposta):**
            1.  **Compreensão Geral:** Analise o conjunto de diffs para identificar o tema central ou o objetivo principal das modificações. Pergunte-se: "Qual problema principal estas mudanças resolvem?" ou "Qual funcionalidade chave está sendo implementada, corrigida ou alterada?".
            2.  **Identificação do "O Quê":** Para cada alteração significativa nos diffs, determine exatamente *o que* foi modificado (ex: quais funções, classes, variáveis, lógica de controle de fluxo, arquivos de configuração, etc.).
            3.  **Inferência Cautelosa do "O Porquê" (Motivação):**
                * Tente deduzir *por que* cada mudança significativa foi feita. Baseie essa dedução estritamente nas evidências presentes nos diffs (ex: código que simplifica uma lógica complexa, corrige um comportamento inconsistente, adiciona tratamento para um novo caso de uso visível no código, remove código obsoleto/comentado).
                * **Importante:** Se o "porquê" não for claramente evidente a partir das alterações de código, NÃO INVENTE uma motivação. Neste caso, foque em descrever o "quê" e o impacto observável da mudança. É preferível uma descrição factual do que foi feito a uma especulação incorreta sobre o motivo.
            4.  **Avaliação do Impacto:** Considere como as mudanças afetam o comportamento, a performance, a segurança ou a manutenibilidade do projeto.

            **Instruções para a Saída (Título e Mensagem do Commit):**

            -   **Título do Commit:**
                -   ${languageInstruction} 
                -   Inicie com um emoji relevante que represente a natureza da mudança (sugestões: 🚀 para novas funcionalidades, ✨ para melhorias, 🐛 para correção de bugs, 🔧 para refatoração/ferramentas, 📝 para documentação, ♻️ para refatoração, 🔒 para segurança, 📈 para performance).
                -   Use um verbo no imperativo no início da frase (ex: "Adiciona", "Corrige", "Refatora", "Remove", "Atualiza", "Melhora").
                -   Seja específico, conciso e direto sobre a alteração principal.
                -   Máximo de 50 caracteres.

            -   **Mensagem do Commit (Corpo):**
                -   ${languageInstruction}
                -   **Descrição Detalhada das Mudanças (O Quê Foi Feito):**
                    * Descreva as principais alterações realizadas de forma clara.
                    * Use listas (bullet points) ou parágrafos curtos para organizar a explicação.
                    * Mencione as partes mais importantes do código que foram afetadas (ex: "Modificada a função X para lidar com Y", "Removida a classe Z por ser obsoleta"), mas evite colar grandes trechos dos diffs.
                -   **Motivação e Contexto (O Porquê da Mudança):**
                    * Explique a razão por trás das alterações. Qual problema foi resolvido? Qual objetivo foi alcançado?
                    * Se baseou sua inferência do "porquê" em heurísticas (e não em comentários explícitos no diff), seja objetivo ao descrever o cenário que a mudança parece endereçar.
                    * Se a razão exata não for clara, descreva o benefício ou o resultado esperado da mudança (ex: "Esta alteração melhora a legibilidade do módulo X", "Com isso, o processamento de Y torna-se mais eficiente").
                -   **Impacto no Projeto (Como Afeta):**
                    * Se aplicável e inferível, explique brevemente como as mudanças impactam o projeto (ex: "Isso corrige o bug reportado em #123", "Permite que os usuários agora façam Z", "Reduz o tempo de carregamento da página X").

            -   **Restrições Importantes:**
                -   **Fidelidade aos Diffs:** Baseie TODA a sua resposta estritamente na informação contida nos diffs.
                -   **Não Invente:** Não adicione informações, funcionalidades, razões ou contextos que não possam ser razoavelmente e diretamente inferidos a partir das alterações de código fornecidas.
                -   **Concisão:** Evite copiar e colar porções extensas dos diffs. O objetivo é resumir e explicar.
                -   **Privacidade:** Não inclua nenhuma informação pessoal ou sensível.

            **Formato da Resposta (Exatamente como no exemplo):**
            Título
            Mensagem (corpo)`;
  }

  throw new Error(`Invalid prompt type: ${promptType}`);
}

/**
 * Analyzes updated code using OpenAI.
 */
export async function analyzeUpdatedCode(
  files,
  promptType = PromptType.ANALYZE
) {
  const config = await validateConfiguration();
  let openai = null;
  //TODO logica para acesso local ou remoto
  if(config.OPENAI_API_BASEURL){
    openai = new OpenAI({baseURL:config.OPENAI_API_BASEURL, apiKey: config.OPENAI_API_KEY });
  }else{
    openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });
  }
  const prompt = generatePrompt(files, promptType, config);
  try {
    console.log(chalk.blue("📤 Sending request to AI..."));
    const response = await openai.chat.completions.create({
      model: config.OPENAI_API_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
    });
    console.log(chalk.green("✅ Response received."));

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error(chalk.red("❌ Error analyzing updated code:", error.message));
    if(error.message.includes("401")) {
      await updateValidApiKey()
      return analyzeUpdatedCode(files, promptType);
    } else{
      throw error;
    }
  }
}
