# Dorama Studio AI 2.4.0

Aplicativo Capacitor para escrever e preparar episódios no celular. Criação de projetos usa um modelo local editável; IA de roteiro/imagem depende das Edge Functions Supabase e da conta autenticada.

## Cenas e dados

- Abra qualquer episódio e adicione cenas manualmente, inclusive quando não existe roteiro.
- Edite local, horário, duração, personagens, ação, diálogos, prompts e status.
- Mova cenas com ↑/↓; clipes acompanham a cena. Exclusão exige confirmação e permite restaurar a última cena removida.
- A edição preserva campos existentes e metadados. A seleção usa o número do episódio, sem depender da posição no array.
- A biblioteca local mantém vários projetos. A chave `doramaProjectV13` continua compatível; a biblioteca usa `doramaLibraryV24` e conserva os bytes originais em `doramaOriginalV13`.
- Regeneração com IA exige confirmação e mantém o roteiro anterior em `scriptHistory`. Respostas vazias são rejeitadas. Não são acrescentadas cenas automaticamente.

## Produção gratuita

1. Escreva as cenas e defina duração, elenco, cenário e diálogos.
2. Abra o Estúdio de Produção e exporte materiais JSON ou prompts TXT.
3. Produza os clipes em ferramenta externa de sua escolha; disponibilidade, custos e limites pertencem a essa ferramenta.
4. Importe MP4, WebM ou MOV do celular, até 50 MB por arquivo, ou cadastre um link HTTPS. MP4 H.264/AAC é recomendado no Android. A importação verifica o carregamento de um frame no aparelho atual.
5. Revise os clipes na ordem das cenas e exporte cada arquivo para montar em editor gratuito externo.
6. Para o catálogo, cadastre o endereço HTTPS do episódio final já hospedado.

A prévia em sequência não cria um vídeo final. Montagem interna de MP4 e geração de vídeo por IA não estão integradas. A animação local de imagens para WebM permanece experimental e exige suporte a MediaRecorder. Nenhuma integração de IA é simulada.

Clipes ficam no IndexedDB local e não são enviados ao Supabase. Backups JSON não incluem arquivos de mídia: exporte os clipes separadamente. Limpar dados ou desinstalar o app remove o armazenamento local.

## Supabase e segurança

O cliente mantém o endpoint e a chave **publishable** existentes. Credenciais de provedores, `service_role` e chaves secretas devem ficar exclusivamente no servidor. O build inclui o SDK localmente, sem CDN em tempo de execução.

O aplicativo usa Supabase Auth (e-mail/senha) e as Edge Functions `generate-dorama` (`generate_episode` / `correct_episode`) e `generate-image`. Não existe `www/config.js` nem `setDoramaBackend` nesta implementação.

`doramas.metadata` conserva o projeto completo, temporadas, roteiros e referências de mídia. As tabelas legadas `characters`, `episodes` e `story_memory` continuam integradas; episódios dessas tabelas representam a temporada 1. O salvamento não exclui linhas de elenco nem zera relacionamentos/conflictos não editados pelo cliente. Falha da nuvem mantém a gravação local.

A segurança do banco depende de RLS e políticas de propriedade corretas. Elas não foram auditadas diretamente nesta sessão; o cliente também filtra gravações/leitura do projeto pelo usuário. Nenhuma alteração de schema ou de dados remotos foi executada.

## Desenvolvimento e testes

Node.js 22 e Java 21 são usados no workflow. Capacitor CLI/core/Android permanecem em 8.5.2.

```sh
npm install --no-audit --no-fund
npm test
npm run build
npm run android:add
npm run android:prepare
npm run android:sync
cd android
./gradlew assembleDebug lintDebug
```

O projeto Android é gerado; a preparação registra exportação nativa pelo seletor de documentos e aplica versão 2.4.0. `www/vendor.js` é gerado pelo build. Executar apenas o HTML sem build mantém a edição manual, mas não oferece o SDK de autenticação.

O workflow efetivo é `.github/workflows/android-apk.yml`; o arquivo em `github/workflows/` é histórico e não é executado pelo GitHub. O workflow cobre push em main/branches `fix/**`, PR para main e execução manual, roda testes, build, lint e verifica integridade do APK. O artefato inclui APK debug, hash SHA-256, lockfile gerado e relatório lint; expira em 14 dias. Não há merge automático.

Os 31 testes locais passaram. Build Android, codecs reais, IndexedDB em dispositivo, RLS e Edge Functions ainda precisam de validação. A instalação npm ficou bloqueada pela rede: não há lockfile revisado neste pacote. Gere e revise `package-lock.json`, inclua-o no PR e troque a instalação do workflow por `npm ci` antes de aprovar.

Veja [auditoria e evidências](docs/AUDIT.md) e [descrição preparada para o PR](docs/PR.md). O PR e o APK remoto não foram criados: o conector retornou 403 para escrita e o token CLI é inválido.
