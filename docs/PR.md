# Título

Corrigir preservação de cenas e adicionar estúdio de produção móvel

# Descrição

Episódios sem roteiro não permitiam adicionar cenas; a seleção por índice podia editar o episódio errado, e salvar uma edição removia metadados e vínculos de vídeo. Agora todos os episódios permitem criar, editar, reordenar e excluir/restaurar cenas manualmente, selecionadas pelo número. Edições preservam diálogos, clipes e campos existentes; falha local reverte a alteração.

A biblioteca preserva projetos anteriores e dados legados. A sincronização Supabase é serializada e deixa de excluir/recriar o elenco. Metadados completos e temporadas são mantidos; não há migração de banco, exclusão de dados remotos ou inclusão de chaves secretas.

O Estúdio de Produção inclui duração, elenco, cenário, diálogos, prompts, status, importação local, prévia em sequência e exportação JSON/TXT/arquivos. A montagem final fica em editor externo; geração de vídeo por IA e montagem interna MP4 não são anunciadas como operacionais. O modelo local de criação é identificado como modelo, sem fingir geração por IA.

Versão 2.4.0, SDK Supabase empacotado e workflow Android com testes, lint, verificação do APK e artefatos. Bridge nativa usa o seletor de documentos Android para exportar arquivos.

## Validação

31 testes locais aprovados: armazenamento/modelo (14), fluxo do app com DOM/Supabase de teste (12), integridade do código (4), preparação Android (1). Incluem contagens exatas, temporadas, preservação de campos/clipes, quota, reabertura, seleção fora de ordem, exclusão/restauração, exportação e concorrência da nuvem.

## Antes de aprovar

- Gerar e revisar `package-lock.json` em ambiente com rede, commitar e usar `npm ci` no workflow.
- Executar o Actions e conferir build/lint/APK e hash. Nenhum APK foi gerado nesta sessão.
- Validar interface, IndexedDB, importação MP4/WebM/MOV, exportação nativa e animação experimental em dispositivo Android.
- Validar Auth/RLS/Edge Functions com conta de teste. O banco real e roteiros de usuários não foram acessados.

A causa específica de “só o capítulo 1 tem duas cenas” depende dos dados/Edge Function indisponíveis. Os bloqueios do cliente foram corrigidos; não são inventadas cenas nem alteradas contagens silenciosamente.

## Publicação

Base remota auditada: main, `043d1203c360522b9b99b8a7aa2cd077f66355fd`. Branch proposta: `fix/scenes-production-android`.

A criação da branch remota foi bloqueada pelo conector com HTTP 403 `Resource not accessible by integration`. A CLI reportou token inválido. O pacote local permite aplicar as alterações em checkout de main, criar a branch, publicar e abrir PR usando esta descrição. Não habilitar merge automático.
