# OrigamiECJ

Site acessível, responsivo e bilíngue (português e inglês) para o ensino de
origami a **pessoas cegas, com baixa visão e videntes**, com uma única
interface para todos os públicos.

> OrigamiECJ é um projeto da equipe **Eu Concego Jogar (ECJ)**.
> Contato: <euconcego@gmail.com>

---

## Objetivo

Ensinar origami por meio de **tutoriais que não dependem da visão**: cada
passo traz uma descrição textual completa (posição inicial, orientação
espacial, elemento movido, direção da dobra, estado esperado, erro comum e
correção), acompanhada de **diagramas SVG** acessíveis como apoio extra.

Os diagramas também são gerados de forma acessível:

- título e descrição associados via `aria-labelledby`;
- legenda traduzida para as linhas de dobra;
- selo **F** (frente) e **V** (verso) do papel;
- seta de orientação;
- distinção além da cor: vale é linha tracejada azul, montanha é linha
  pontilhada-tracejada vermelha;
- zoom por diagrama.

## Páginas

| Página          | Arquivo             | Conteúdo                                   |
| --------------- | ------------------- | ------------------------------------------ |
| Início          | `index.html`        | Apresentação, recursos e modelos           |
| Catálogo        | `catalogo.html`     | Modelos com filtros (dificuldade, tipo, tempo, etapas, idioma) |
| Tutorial        | `tutorial.html`     | Passo a passo acessível de um modelo       |
| Sobre           | `sobre.html`        | Sobre o projeto e a equipe ECJ             |
| Créditos        | `creditos.html`     | Créditos do projeto e da fonte consultada  |
| Acessibilidade  | `acessibilidade.html` | Como o site é acessível e como foi testado |
| Contato         | `contato.html`      | E-mail da ECJ e formulário `mailto:` local |
| Ajuda           | `ajuda.html`        | Perguntas frequentes                       |

## Tecnologias

- **Zero dependências externas**: HTML semântico, CSS e JavaScript (ES
  modules). Não há build, framework nem bibliotecas de terceiros.
- **Node.js >= 18** somente para o servidor de desenvolvimento e os scripts
  de validação/exportação.
- **Dados separados da interface**: modelos em `data/models/` e traduções em
  `data/i18n/`, todos em JSON.
- **Progresso e preferências locais**: armazenados apenas no `localStorage`
  do navegador da pessoa. Sem conta, sem rastreamento, sem envio a
  servidores.
- **Bilinguismo**: pt-BR e en, com detecção do idioma do navegador, fallback
  para pt-BR e troca em tempo real sem misturar idiomas.

## Execução local

```bash
# Servir localmente (abre em http://localhost:3000)
npm run serve

# Porta personalizada
PORT=8080 npm start
```

Basta servir a pasta raiz como estática — não é preciso build.

## Scripts

```bash
npm test                 # valida JSON, dicionários e modelos (scripts/validate.mjs)
npm run export:diagrams  # gera SVG estático por passo em diagrams/ (scripts/export-diagrams.mjs)
npm run serve            # servidor estático de desenvolvimento (scripts/serve.mjs)
```

## Estrutura do projeto

```
index.html, catalogo.html, tutorial.html, sobre.html,
creditos.html, acessibilidade.html, contato.html, ajuda.html

css/styles.css        # estilos acessíveis (foco, contraste, responsivo)
js/
  config.js           # constantes centrais (fonte, créditos, contato, chaves)
  i18n.js             # traduções, detecção e troca de idioma
  components.js       # cabeçalho/rodapé compartilhados, controles
  diagrams.js         # motor de diagramas SVG (dobras por reflexão)
  models.js           # carregamento dos modelos
  tutorial.js         # página de tutorial (passos, zoom, progresso)
  catalog.js          # catálogo com filtros
  home.js             # página inicial
  content-page.js     # páginas de conteúdo (sobre, acessibilidade, ajuda)
  contact.js          # formulário mailto local (sem envio)
  progress.js         # progresso no localStorage
  format.js           # formatação de duração
  site.js             # inicialização comum
data/
  models/*.json       # modelos (steps com descrições pt/en e diagramas)
  i18n/{pt-BR,en}.json  # dicionários de tradução
scripts/              # servidor, validação e exportação de diagramas
diagrams/             # SVGs exportados (gerados por export:diagrams)
tests/ACESSIBILIDADE.md  # lista de testes e pontos de revisão
```

## Como adicionar um modelo

1. Crie `data/models/<slug>.json` seguindo o formato de um modelo existente
   (ex.: `aviao-dardo.json`).
2. Adicione o `<slug>` na lista `models` de `data/models/index.json`.
3. Rode `npm test` e `npm run export:diagrams`.

Cada passo precisa dos campos:

- `title` — título do passo (pt/en);
- `diagram` — `base` ou `outline` + dobras/vincos + `action` (o motor
  `diagrams.js` aplica as dobras por reflexão);
- `aspects` — `position`, `orientation`, `moving`, `direction`, `expected`,
  `commonError` e, quando houver, `correction` e `followUp` (pt/en);
- `diagramDescription` — descrição acessível do diagrama (pt/en).

## Como adicionar ou alterar traduções

Edite `data/i18n/pt-BR.json` e `data/i18n/en.json` mantendo as **mesmas
chaves** nos dois arquivos (o `npm test` confere isso). As páginas traduzem
automaticamente elementos com `data-i18n` e `data-i18n-attr`.

## Fonte de referência

O projeto consultou o repositório **origami-db**
(<https://github.com/dozingpip/origami-db>, autor *dozingpip*, licença
GPL-3.0) apenas como **referência técnica** para padrões de vincos e modelos
dobrados em 3D.

**O OrigamiECJ não copia dados, imagens, instruções ou modelos do
origami-db.** Os modelos atuais são dobras tradicionais (domínio público); as
instruções, os textos e os diagramas são criação original da equipe ECJ.

## Limitações e pontos a revisar

1. **Revisão por pessoa cega (obrigatória)**: a usabilidade real dos
   tutoriais, o vocabulário espacial e a navegabilidade com leitores de tela
   (NVDA/VoiceOver/TalkBack) precisam ser validados por pessoas cegas antes
   de qualquer divulgação. Ver `tests/ACESSIBILIDADE.md`, seção 10.
2. **Diagramas não são 3D**: o motor mostra o papel e as linhas de dobra em
   vista plana. A sobreposição de camadas em modelos complexos não é
   representada; para esses casos a descrição textual é a fonte primária.
3. **Formulário de contato**: abre apenas um `mailto:` no dispositivo da
   pessoa — depende de haver um programa de e-mail configurado.
4. **Idiomas**: apenas pt-BR e en no momento.
5. **Sem sons, voz sintética ou braille**: o projeto não gera áudio. Para
   voz/braille, depende dos recursos do próprio sistema operacional e do
   leitor de tela.
6. **Progresso por navegador**: o progresso fica no `localStorage` do
   dispositivo e não é sincronizado entre aparelhos.

## Testes

Veja a lista completa em `tests/ACESSIBILIDADE.md` (teclado, leitores de
tela, idioma, diagramas, responsividade, zoom 200%, `prefers-reduced-motion`,
contraste, privacidade e revisão por pessoa cega).

```bash
npm test                 # validação automatizada de dados
npm run export:diagrams  # conferência visual dos diagramas
npm run serve            # execução local para os testes manuais
```

## Créditos e licenças

- **Projeto**: OrigamiECJ, equipe Eu Concego Jogar (ECJ) —
  euconcego@gmail.com.
- **Modelos**: dobras tradicionais de origami (domínio público); instruções,
  textos e diagramas: criação original da equipe ECJ.
- **Fonte consultada (referência apenas)**: origami-db, autor dozingpip,
  licença GPL-3.0 (<https://github.com/dozingpip/origami-db>).
- **Código do OrigamiECJ**: licença MIT (ver `LICENSE`).
