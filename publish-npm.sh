#!/usr/bin/env bash
set -e

# Função para verificar se o diretório Git está limpo.
check_git_clean() {
  if [ -n "$(git status --porcelain)" ]; then
    echo "Git working directory not clean. Please commit or stash your changes before updating the version."
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
# Utiliza Node.js para extrair os dados do package.json sem usar o jq
current_version=$(node -p "require('./package.json').version")
name=$(node -p "require('./package.json').name")
current_branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "Não em um repositório git")

# Exibe informações de depuração
echo "Versão atual no package.json: $current_version"
echo "Nome do pacote: $name"
echo "Branch atual: $current_branch"

# Verifica se o nome do pacote foi definido
if [ -z "$name" ]; then
    echo "Nome do pacote não definido no package.json."
    exit 1
fi

# Obtém a última versão disponível do pacote via npm
latest_version=$(npm show "$name" version 2>/dev/null)
if [ -z "$latest_version" ]; then
    echo "Não foi possível obter a última versão disponível do pacote $name via npm."
    exit 1
fi

echo "Última versão via npm: $latest_version"


# Se houver divergência entre a versão local e a versão do npm, atualiza a versão.
# Note que o comando npm version patch incrementa a versão conforme semver, assim, se a versão local for maior que a do npm,
# a nova versão resultante será superior à atual.
if [ "$current_version" == "$latest_version" ]; then
    echo "Versões identicas detectadas (local: $current_version, npm: $latest_version). Executando npm version patch..."
    #fazer o commit na branch atual e depois fazer o merge pra main e dar push, ficar na main (checkout main) e seguir com o script
    git add .
    git commit -m "Atualização da versão para $current_version"
    git push origin "$current_branch"
    git checkout main
    git merge "$current_branch"
    git push origin main

    # Verifica se o working directory do Git está limpo antes de prosseguir
    check_git_clean

    # Incrementa a versão (patch) no package.json e gera uma nova tag
    npm version patch
    # Atualiza o package-lock.json com a nova versão
    npm install
    # push da nova versão para o repositório remoto
    git push origin "$current_branch"
    #Publicar no npm
    npm publish --access public
else
    echo "A versão já está atualizada no package.json: $current_version"
fi