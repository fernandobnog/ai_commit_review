# Define o comportamento de erro para parar a execução em caso de falha
$ErrorActionPreference = "Stop"

# Função para verificar se o diretório Git está limpo.
function Verificar-GitLimpo {
    $gitStatus = git status --porcelain
    if ($gitStatus) {
        Write-Host "Diretório de trabalho do Git não está limpo. Por favor, faça commit ou stash das suas alterações antes de atualizar a versão."
        exit 1
    }
}

# Função para verificar conflitos de merge.
function Verificar-ConflitosMerge {
    $mergeConflicts = git ls-files -u
    if ($mergeConflicts) {
        Write-Host "Erro: Conflito de merge detectado. Corrija os conflitos e tente novamente."
        exit 1
    }
}

# Verifica se o arquivo package.json existe
if (-not (Test-Path ".\package.json")) {
    Write-Host "Arquivo package.json não encontrado no diretório atual."
    exit 1
}

# Verifica se o usuário está logado no npm
try {
    npm whoami *>&1 | Out-Null # Redireciona stdout e stderr para Out-Null para suprimir a saída
    Write-Host "Usuário logado no npm."
}
catch {
    Write-Host "Você não está logado no npm. Por favor, faça login usando 'npm login'."
    exit 1
}

# Extrai dados do package.json
$packageJsonContent = Get-Content -Raw -Path ".\package.json" | ConvertFrom-Json
$versaoAtual = $packageJsonContent.version
$nomePacote = $packageJsonContent.name

# Obtém a branch atual
try {
    $branchAtual = git rev-parse --abbrev-ref HEAD
}
catch {
    $branchAtual = "Não em um repositório git"
    Write-Host "Aviso: Não foi possível determinar a branch git atual."
}


# Exibe informações de depuração
Write-Host "Versão atual no package.json: $versaoAtual"
Write-Host "Nome do pacote: $nomePacote"
Write-Host "Branch atual: $branchAtual"

# Verifica se o nome do pacote foi definido
if ([string]::IsNullOrEmpty($nomePacote)) {
    Write-Host "Nome do pacote não definido no package.json."
    exit 1
}

# Obtém a última versão disponível do pacote via npm
$versaoUltima = ""
try {
    # O comando npm show pode retornar múltiplas linhas se houver warnings, pegamos a última que deve ser a versão
    $npmShowOutput = npm show "$nomePacote" version
    if ($npmShowOutput -is [array]) {
        $versaoUltima = $npmShowOutput[-1]
    } else {
        $versaoUltima = $npmShowOutput
    }
}
catch {
    Write-Host "Não foi possível obter a última versão disponível do pacote $nomePacote via npm. Erro: $($_.Exception.Message)"
    # Considerar se deve sair ou permitir que o usuário decida se o pacote é novo
    # exit 1
}

if ([string]::IsNullOrEmpty($versaoUltima)) {
     Write-Host "Não foi possível obter a última versão via npm para o pacote $nomePacote. Isso pode ser normal se o pacote ainda não foi publicado."
     # Decide if you want to exit or continue. For a first publish, this is normal.
     # exit 1
} else {
    Write-Host "Última versão via npm: $versaoUltima"
}


# Se a versão local for igual à versão do npm (ou se a versão npm não foi encontrada, indicando um novo pacote), procede com o processo de atualização
if (($versaoAtual -eq $versaoUltima) -or ([string]::IsNullOrEmpty($versaoUltima) -and $versaoAtual)) {
    if ([string]::IsNullOrEmpty($versaoUltima)) {
        Write-Host "Nenhuma versão encontrada no NPM para '$nomePacote'. Prosseguindo com a publicação da versão inicial '$versaoAtual'."
    } else {
        Write-Host "Versões idênticas detectadas (local: $versaoAtual, npm: $versaoUltima). Executando o processo de atualização e publicação..."
    }

    # Atualiza a branch atual
    Write-Host "Atualizando branch '$branchAtual'..."
    git pull origin $branchAtual

    $gitStatusPorcelain = git status --porcelain
    if ($gitStatusPorcelain) {
        Write-Host "Commitando alterações locais na branch '$branchAtual'..."
        git add .
        git commit -m "Atualização da versão npm e outras alterações locais"
        git push origin $branchAtual
    }
    else {
        Write-Host "Nenhuma alteração não comitada encontrada na branch '$branchAtual'."
    }

    # Muda para a branch master e atualiza
    Write-Host "Mudando para a branch 'master' e atualizando..."
    git checkout master
    git pull origin master

    # Mescla a branch atual na master e verifica por conflitos
    Write-Host "Mesclando branch '$branchAtual' na 'master'..."
    try {
        git merge --no-ff "$branchAtual" -m "Merge da branch $branchAtual"
    }
    catch {
        Write-Host "Erro: Falha ao mesclar a branch '$branchAtual' na 'master'. Verifique conflitos ou outros problemas."
        Verificar-ConflitosMerge # Chama a função para uma verificação explícita, embora o catch já indique um problema
        exit 1
    }
    Verificar-ConflitosMerge

    Write-Host "Enviando alterações da 'master' para o repositório remoto..."
    git push origin master

    # Verifica se o diretório Git está limpo antes de prosseguir
    Verificar-GitLimpo

    # Incrementa a versão (patch) no package.json e gera uma nova tag
    # Somente incrementa se não for a publicação inicial de uma versão já definida
    if (-not ([string]::IsNullOrEmpty($versaoUltima))) {
        Write-Host "Incrementando a versão patch..."
        npm version patch
    } else {
        Write-Host "Publicando versão inicial '$versaoAtual' definida no package.json."
        # Se for uma primeira publicação e a versão já está definida, não precisa de 'npm version patch'
        # Mas precisamos garantir que as tags sejam criadas se 'npm version' não for chamado.
        # Normalmente, 'npm version' cria a tag. Se não for chamado, você pode precisar criar a tag manualmente:
        # $novaVersaoTag = (Get-Content -Raw -Path ".\package.json" | ConvertFrom-Json).version
        # git tag "v$novaVersaoTag"
        # Write-Host "Tag v$novaVersaoTag criada manualmente."
        # No entanto, 'npm publish' geralmente lida bem sem uma tag explícita se 'npm version' não foi usado.
    }

    # Atualiza o package-lock.json com a nova versão (e outras dependências)
    Write-Host "Atualizando package-lock.json e instalando dependências..."
    npm install

    # Adiciona o package.json e package-lock.json atualizados
    Write-Host "Adicionando package.json e package-lock.json atualizados ao commit..."
    git add .\package.json .\package-lock.json
    # É uma boa prática fazer um commit específico para a atualização da versão
    $commitMessage = "Bump version to $((Get-Content -Raw -Path ".\package.json" | ConvertFrom-Json).version)"
    if (-not ([string]::IsNullOrEmpty($versaoUltima))) { # Só faz commit de bump se 'npm version patch' foi chamado
         git commit -m $commitMessage
    }


    # Envia a nova versão e as tags para o repositório remoto
    Write-Host "Enviando nova versão e tags para 'master'..."
    git push origin master --tags

    # Volta para a branch original, atualiza e mescla a master nela
    Write-Host "Voltando para a branch '$branchAtual'..."
    git checkout "$branchAtual"
    Write-Host "Atualizando branch '$branchAtual' com as últimas alterações remotas..."
    git pull origin "$branchAtual"
    Write-Host "Mesclando 'master' na branch '$branchAtual'..."
    try {
        git merge --no-ff master -m "Merge da branch master"
    }
    catch {
        Write-Host "Erro: Falha ao mesclar a branch 'master' na branch '$branchAtual'. Verifique conflitos ou outros problemas."
        Verificar-ConflitosMerge
        exit 1
    }
    Verificar-ConflitosMerge

    Write-Host "Enviando alterações da branch '$branchAtual' para o repositório remoto..."
    git push origin "$branchAtual"

    # npm install novamente pode ser necessário se o merge trouxe mudanças que afetam dependências
    Write-Host "Executando npm install na branch '$branchAtual' após o merge..."
    npm install

    Write-Host "Executando o build do pacote..."
    npm run build

    Write-Host "Empacotando o projeto..."
        // ...existing code...
    Write-Host "Empacotando o projeto..."
    npm pack
    
    Write-Host "Publicando o pacote no npm..."
    npm publish --access public
    
    # Deprecar versões antigas automaticamente
    Write-Host "Deprecando versões antigas..."
    $versaoAtualObj = [Version]$versaoAtual
    $versaoMajorMinor = "$($versaoAtualObj.Major).$($versaoAtualObj.Minor)"
    npm deprecate "$nomePacote@<$versaoMajorMinor.0" "Versão obsoleta, use $versaoAtual ou superior"
    
    Write-Host "Processo de atualização e publicação concluído com sucesso!"

    Write-Host "Publicando o pacote no npm..."
    npm publish --access public

    Write-Host "Processo de atualização e publicação concluído com sucesso!"

}
else {
    Write-Host "A versão no package.json ($versaoAtual) é diferente da última versão no npm ($versaoUltima) e não é uma publicação inicial."
    Write-Host "Verifique as versões. Se a versão local for mais antiga, atualize-a. Se for mais nova e não publicada, o script pode precisar de ajustes ou você pode publicá-la manualmente."
    # Você pode querer adicionar lógica aqui para lidar com o caso de $versaoAtual > $versaoUltima
    # Por exemplo, perguntar ao usuário se deseja publicar essa versão mais nova.
}

Write-Host "Script finalizado."
