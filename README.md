# NEXUS · Última Linha

Tower defense neon feito para o Thomas explorar o que o Cursor consegue montar em um único projeto: motor de jogo, mapa com duas pistas, sete torres, ondas com chefes, áudio sintético, partículas e uma interface em português.

## Como jogar

1. Clique em **Iniciar defesa**.
2. Escolha uma torre na barra de baixo (teclas `1` a `7`) e clique num quadrado livre.
3. O caminho brilhante é a pista dos invasores: ali ninguém constrói.
4. Clique numa torre já construída para melhorar (`U`), vender (`X`) ou trocar o alvo (`T`).
5. Sobreviva 30 ondas para vencer a campanha. Depois dá para continuar no modo infinito.

Ouro começa em 280. Pulso é barato e explode em área. Crio atrasa. Arco salta entre alvos. Lança perfora armadura. Míssil persegue. Prisma queima. Farol não atira: ele fortalece as torres vizinhas.

Espectros voam. Pulso quase não os acerta — use Lança, Arco, Crio, Míssil ou Prisma.

## Atalhos

| Tecla | Ação |
| --- | --- |
| `1–7` | Escolher torre |
| `U` | Upgrade |
| `X` | Vender |
| `T` | Trocar alvo (primeiro, último, mais forte, mais perto) |
| `N` | Antecipar a próxima onda (ganha ouro extra) |
| `Espaço` | Pausar |
| `G` | Grade |
| `C` | Cobertura de alcance |
| `M` | Som |
| `H` | Ajuda |
| `Esc` | Cancelar / desselecionar |

## Como rodar

```bash
npm install
npm run dev
```

O servidor sobe em `http://localhost:47331`.

```bash
npm run build
npm run preview
```

Não precisa de conta, banco de dados nem chave de API. O recorde fica salvo no navegador (`localStorage`).

## O que tem no código

- `src/game/data.ts` — torres, inimigos e geração de ondas
- `src/game/map.ts` — duas pistas que se encontram no núcleo
- `src/game/sim.ts` — combate, upgrades, chefes, combo
- `src/game/render.ts` — desenho em canvas (trilha, brilho, minimapa)
- `src/game/audio.ts` — som gerado na hora, sem arquivos de música
- `src/game/hud.ts` — menus e painel em português
- `src/game/game.ts` — mouse, teclado e loop do jogo

Stack: Vite + TypeScript + Canvas 2D. Sem engine pronta — o jogo inteiro está neste repositório.
