# Dorama Studio Mobile

Aplicativo Android em React Native + Expo Router + TypeScript. Esta pasta é **independente** da implementação anterior em Capacitor, que continua preservada na raiz.

## Começar pelo GitHub Codespaces

Abra um terminal na raiz do repositório e execute:

```bash
cd dorama-mobile
npm install
npx expo install --fix
npx tsc --noEmit
npx expo start --tunnel
```

Se o túnel solicitar o ngrok, instale com `npm install --save-dev @expo/ngrok` e tente novamente. Abra o endereço gerado no Expo Go do seu Android. No Codespaces, o túnel poderá sofrer limitações da rede. O APK de release é a alternativa para testes sem conexão ao servidor do Expo.

## Gerar APK instalável

```bash
npm install --global eas-cli
eas login
eas build:configure --platform android
eas build --platform android --profile preview
```

Na primeira compilação você precisará vincular o projeto à conta Expo e autorizar a geração de credenciais Android. O EAS informará o endereço do APK após um build bem-sucedido.

## Integrações

Copie `.env.example` para `.env` e preencha somente as **chaves públicas** de Supabase e TMDB, quando estiver pronto para as integrações. `.env` está no gitignore desta pasta.

A interface usa cinco séries demonstrativas e imagens ilustrativas de picsum.photos. Favoritos ficam somente em memória durante a sessão. O arquivo `src/lib/supabase.ts` já configura o cliente, mas login/banco/sincronização ainda precisam ser implementados. O serviço `src/services/tmdb.ts` fornece pesquisa de séries, mas a interface ainda não o consome. Trailers abrem uma pesquisa no YouTube até termos URLs verificadas.

Antes de publicar, substitua os dados fictícios por fontes licenciadas e verifique as condições de uso da API TMDB, atribuição de provedores e direitos sobre imagens.

## Telas

- `src/app/(tabs)/index.tsx`: destaque, Mais Populares, Lançamentos, Meus Favoritos
- `src/app/(tabs)/explorar.tsx`: busca local
- `src/app/(tabs)/favoritos.tsx`: favoritos em sessão
- `src/app/dorama/[id].tsx`: sinopse, pôster, estrelas e trailer
