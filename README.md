# Dorama Studio AI v1.3

Aplicativo mobile-first para criação de doramas com IA.

## Incluído nesta versão
- criação de universo, personagens e temporada
- roteirista por episódio com memória narrativa
- login/cadastro por e-mail via Supabase Auth
- sincronização em nuvem de doramas, personagens, episódios e memória
- salvamento local para modo offline
- backend separado para geração de roteiro e imagem
- estrutura Capacitor para Android

## Segurança
O aplicativo usa apenas a chave **publishable** do Supabase no cliente. As tabelas usam RLS por usuário. Nunca coloque `service_role`, secret key ou credenciais do provedor de IA dentro do APK.

## Backend
Configure `backendUrl` em `www/config.js` ou, no app, via `window.setDoramaBackend('https://SEU-BACKEND')`.
O backend precisa expor:
- `POST /api/generate`
- `POST /api/image`

## IA
O backend lê `DORAMA_AI_MODEL` do ambiente. Credenciais de IA ficam exclusivamente no servidor.

## v1.3
- roteirista conectado à Supabase Edge Function `generate-dorama`
- chamada autenticada pela sessão Supabase
- roteiro demo não mascara mais falhas da IA
- memória narrativa retornada pela IA é incorporada ao projeto
