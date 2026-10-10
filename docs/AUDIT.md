# Auditoria e validação — 2.4.0

Base consultada: `main`, commit `043d1203c360522b9b99b8a7aa2cd077f66355fd`.
Os arquivos foram obtidos pelo conector GitHub. Nenhuma alteração foi publicada no repositório remoto.

## Erros comprovados no cliente

| Problema | Correção |
| --- | --- |
| `renderScript` retornava antes de oferecer “Adicionar cena” em episódios sem roteiro. `saveSceneEdit` também recusava script nulo. | Todos os episódios permitem criação manual de várias cenas, começando por script vazio somente ao salvar a primeira cena. |
| Seleção por `episodes[n-1]` e `episodes[selectedEpisode-1]`. | Seleção pelo campo `number`, inclusive episódios fora de ordem ou não contíguos. |
| Editar substituía a cena por `{place,time,action,dialogue}`, perdendo URL do vídeo e qualquer metadado. | Atualização preserva campos existentes, identificador, clipe local, URL e campos desconhecidos. Diálogos mantêm quebras de linha e metadados. |
| Não havia exclusão e reordenação. | Mover a cena inteira, excluir com confirmação, manter arquivo de cenas removidas e restaurar a última exclusão. |
| Uma única chave local era substituída na criação de outro projeto. | Biblioteca de projetos, cópia dos bytes originais legados e compatibilidade com a chave antiga. |
| Falhas de gravação não eram tratadas no editor. | Edição, exclusão e reordenação revertem a alteração em memória se a gravação falhar; exibem erro. |
| Sincronização executava `characters.delete()` antes de inserir novamente. | Atualizações/inserções sem exclusão de linhas; relacionamentos e campos não editados não são zerados. |
| Memória legada era escrita com arrays vazios de conflitos, relações e segredos. | Atualização apenas dos campos representados pelo cliente, preservando os demais. |
| Requisições de salvamento concorrentes podiam inserir projetos duplicados ou concluir fora de ordem. | Fila de sincronização com snapshots, identificação da conta e reaproveitamento do ID obtido pelo salvamento anterior. |
| Carregar elenco da tabela sobrescrevia metadados completos. | Metadados completos são preferidos; tabelas continuam como fallback para projetos antigos. |
| Supabase JS era carregado por CDN sem versão fixada. | SDK fixado e empacotado no APK pelo build. Interface manual tem tratamento de indisponibilidade do SDK. |
| Projeto usava versão 1.3.0 e interface 2.3.0; README citava `www/config.js` e `setDoramaBackend`, inexistentes. | Versão 2.4.0, preparação da versão Android e documentação do backend realmente chamado. |
| Criação de universo era um modelo local anunciado como IA. | Botão informa criação por modelo editável. Chamadas de IA de roteiro/imagem continuam ligadas às Edge Functions existentes, sem fallback simulado. |
| Resposta da IA podia substituir roteiro por zero cenas. | Respostas vazias/inválidas são recusadas antes de alterar o roteiro. Regeneração confirmada preserva histórico do script anterior. |
| Downloads por `blob:` não são confiáveis em Android WebView. | Bridge de exportação pelo seletor de documentos Android, pendente de compilação e validação em dispositivo. |

## Por que só o capítulo 1 tem duas cenas?

O código não contém corte para duas cenas nem regra que restrinja o número por capítulo. Existem bloqueios comprovados para criação manual e seleção incorreta por índice, agora corrigidos. A geração mantém a quantidade retornada pela Edge Function; uma resposta com uma cena continuará tendo uma cena, sem conteúdo inventado.

Não houve acesso a sessão de usuário, roteiros reais, código das Edge Functions ou banco autenticado. Portanto, não é possível afirmar a causa específica da quantidade armazenada naquele projeto. Nenhum roteiro foi modificado para acrescentar cenas artificialmente. Os testes verificam contagens exatas e preservação do conteúdo.

## Testes executados

31 casos aprovados: 14 do armazenamento/modelo, 12 do fluxo do app com DOM e Supabase de teste, 4 de integridade do código e 1 de preparação Android. `npm test` também passou com os quatro arquivos.

Cobertura: seleção por número; múltiplas cenas; salvamento/reabertura; temporadas; preservação de clipes e campos desconhecidos; exclusão/restauração; reordenação; backups legados; biblioteca corrompida; quota; JSON/TXT; respostas vazias da IA; troca de episódio; concorrência da sincronização; troca de conta; erro de login e falha da nuvem. O teste Android verifica geração/idempotência dos arquivos, sem substituir um build real.

## Validações bloqueadas e limites

- O proxy local `proxy:8080` não respondeu. Clone e acesso ao npm falharam. Instalação offline retornou `ENOTCACHED`. Não foi possível gerar `package-lock.json`, instalar o SDK/bundler ou executar o build local. Dependências diretas estão fixadas; ainda é necessário gerar e revisar o lockfile em ambiente com rede antes de aprovar o PR.
- Playwright está instalado, mas seu Chromium não está. O Chromium do sistema também não iniciou devido à restrição de socket do sandbox. Testes de interface usam DOM de teste; layout, IndexedDB e codecs reais precisam de navegador/dispositivo.
- Criar a branch remota retornou HTTP 403 `Resource not accessible by integration`. `gh auth status` informa token inválido. Sem credencial de escrita válida, não foi possível abrir PR ou iniciar Actions; nenhum link de PR/APK é apresentado como existente.
- Capacitor 8.5.2 foi confirmado na release oficial do GitHub; as três dependências já eram consistentes e foram preservadas. SDK Supabase 2.57.4 foi confirmado na release oficial. A consulta do changelog Supabase em Markdown falhou no serviço web; referências atuais de Auth foram consultadas pelo MCP.
- Supabase real, RLS e Edge Functions não foram testados nem alterados. O cliente usa somente a chave publishable existente. Nenhuma chave privada ou credencial de provedor foi adicionada.
- Importação aceita MP4/WebM/MOV até 50 MB e só vincula após carregar um frame. Isso verifica suporte no aparelho atual; não equivale a teste de compatibilidade Android realizado nesta sessão. MP4 H.264/AAC é recomendado.
- Não há montagem interna de MP4, geração gratuita de vídeo por IA ou hospedagem automática. Prévia em sequência reproduz clipes disponíveis; não gera arquivo final. Use um editor gratuito externo.
- Animação local de imagem para WebM permanece experimental e depende de MediaRecorder. Não foi validada em Android. Exportação de arquivos pela bridge Android também aguarda build/teste.
- Clipes ficam no IndexedDB do aparelho. JSON/TXT não contêm bytes de mídia. Exporte os clipes separadamente; desinstalar/limpar dados do app remove armazenamento local. Não foi introduzida limpeza automática de mídia.
