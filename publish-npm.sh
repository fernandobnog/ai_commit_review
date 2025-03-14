#!/usr/bin/env bash
set -e

# Função para verificar se o diretório Git está limpo.
verificar_git_limpo() {
  if [ -n "$(git status --porcelain)" ]; then
    echo "Diretório de trabalho do Git não está limpo. Por favor, faça commit ou stash das suas alterações antes de atualizar a versão."
    exit 1
  fi
}

# Função para verificar conflitos de merge.
verificar_conflitos_merge() {
  if git ls-files -u | grep -q '^'; then
    echo "Erro: Conflito de merge detectado. Corrija os conflitos e tente novamente."
    exit 1
  fi
}

# Verifica se o arquivo package.json existe
if [ ! -f package.json ]; then
    echo "Arquivo package.json não encontrado no diretório atual."
    exit 1
fi

# Verifica se o usuário está logado no npm
if ! npm whoami &>/dev/null; then
    echo "Você não está logado no npm. Por favor, faça login usando 'npm login'."
    exit 1
fi

# Extrai dados do package.json utilizando Node.js (sem jq)
versao_atual=$(node -p "require('./package.json').version")
nome_pacote=$(node -p "require('./package.json').name")
branch_atual=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "Não em um repositório git")

# Exibe informações de depuração
echo "Versão atual no package.json: $versao_atual"
echo "Nome do pacote: $nome_pacote"
echo "Branch atual: $branch_atual"

# Verifica se o nome do pacote foi definido
if [ -z "$nome_pacote" ]; then
    echo "Nome do pacote não definido no package.json."
    exit 1
fi

# Obtém a última versão disponível do pacote via npm
versao_ultima=$(npm show "$nome_pacote" version 2>/dev/null)
if [ -z "$versao_ultima" ]; then
    echo "Não foi possível obter a última versão disponível do pacote $nome_pacote via npm."
    exit 1
fi

echo "Última versão via npm: $versao_ultima"

# Se a versão local for igual à versão do npm, procede com o processo de atualização
if [ "$versao_atual" == "$versao_ultima" ]; then
    echo "Versões idênticas detectadas (local: $versao_atual, npm: $versao_ultima). Executando npm version patch..."

    # Atualiza a branch atual
    git pull origin "$branch_atual"
    git add .
    git commit -m "Atualização da versão npm"
    git push origin "$branch_atual"

    # Muda para a branch master e atualiza
    git checkout master
    git pull origin master

    # Mescla a branch atual na master e verifica por conflitos
    if ! git merge --no-ff "$branch_atual" -m "Merge da branch $branch_atual"; then
        echo "Erro: Conflito de merge detectado ao mesclar a branch $branch_atual na master."
        exit 1
    fi
    verificar_conflitos_merge

    git push origin master

    # Verifica se o diretório Git está limpo antes de prosseguir
    verificar_git_limpo

    # Incrementa a versão (patch) no package.json e gera uma nova tag
    npm version patch
    # Atualiza o package-lock.json com a nova versão
    npm install
    # Envia a nova versão e as tags para o repositório remoto
    git push origin master --tags

    # Volta para a branch original, atualiza e mescla a master nela
    git checkout "$branch_atual"
    git pull origin "$branch_atual"
    if ! git merge --no-ff master -m "Merge da branch master"; then
        echo "Erro: Conflito de merge detectado ao mesclar a branch master na branch $branch_atual."
        exit 1
    fi
    verificar_conflitos_merge

    git push origin "$branch_atual"

    # Publica o pacote no npm
    npm publish --access public

else
    echo "A versão já está atualizada no package.json: $versao_atual"
fi
