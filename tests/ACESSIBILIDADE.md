# Lista de testes do OrigamiECJ

Esta lista cobre os pontos que devem ser verificados antes de cada lançamento.
Ela deve ser executada por **uma pessoa vidente** (testes automatizados e
manuais) e depois conferida por **uma pessoa cega** (testes de usabilidade
real).

> OrigamiECJ é um projeto da equipe Eu Concego Jogar (ECJ).

---

## 1. Testes automatizados

### 1.1 Dados e estrutura

- [ ] `npm test` passa sem erros (dicionários pt-BR/en com as mesmas chaves;
      modelos coerentes; steps com ids sequenciais; diagramas com `outline` ou
      `base`).
- [ ] `npm run export:diagrams` gera os SVGs de todos os passos e do resultado
      de cada modelo, sem erro de geometria.
- [ ] Todos os JSON em `data/` são válidos (sem vírgula sobrando, sem chaves
      repetidas).

### 1.2 Servidor

- [ ] `npm run serve` sobe o site em `http://localhost:3000`.
- [ ] Todas as páginas respondem `200` (índice, catálogo, tutorial, sobre,
      créditos, acessibilidade, contato, ajuda).
- [ ] Arquivos estáticos (CSS, JS, JSON, SVG exportado) respondem com o
      `Content-Type` correto.

---

## 2. Testes de teclado e foco

- [ ] Todas as ações do site são possíveis só com o teclado: navegação, troca
      de idioma, pausar animações, zoom do diagrama, navegação entre passos,
      filtros do catálogo, formulário de contato.
- [ ] A ordem de tabulação segue a ordem visual da página (sem saltos).
- [ ] O foco visível é sempre evidente (anéis de foco bem contrastados).
- [ ] O "pular para o conteúdo" (`skip-link`) leva o foco ao `<main>` e
      permite voltar com `Shift+Tab`.
- [ ] Ao trocar de idioma, o foco permanece no seletor de idioma.
- [ ] Ao navegar entre passos do tutorial, o foco vai para o título do passo
      (e não para o topo da página).
- [ ] O menu e o rodapé não "prendem" o foco (sem armadilha de teclado).
- [ ] `<main>` recebe `tabindex="-1"` e recebe foco ao pular o conteúdo.

---

## 3. Leitores de tela

### 3.1 NVDA (Windows, Firefox/Chrome)

- [ ] A página anuncia um título claro ao carregar.
- [ ] A navegação é anunciada como "navegação" com o rótulo correto.
- [ ] O formulário de contato anuncia rótulo, tipo e estado de cada campo.
- [ ] Erros de validação do formulário são anunciados e vinculados aos campos
      (`aria-describedby`).
- [ ] Ao pausar/reiniciar animações, a mudança é anunciada via `aria-live`.
- [ ] Os diagramas têm nome acessível (título) e descrição acessível (desc),
      anunciados de forma resumida, sem leitura automática longa.

### 3.2 VoiceOver (macOS, Safari)

- [ ] Mesmos itens da seção 3.1.
- [ ] O selo F/V do diagrama é compreensível no contexto.

### 3.3 TalkBack (Android, navegador)

- [ ] Mesmos itens da seção 3.1.
- [ ] Os controles de zoom do diagrama têm rótulos claros.

---

## 4. Idioma (bilinguismo)

- [ ] Com o idioma do navegador em pt-BR, o site abre em português.
- [ ] Com o idioma do navegador em en-US/en, o site abre em inglês.
- [ ] Com outro idioma (ex.: es), o site usa o padrão pt-BR.
- [ ] Ao trocar de idioma, **todos** os textos mudam juntos, sem misturar
      idiomas (cabeçalho, menu, títulos, descrições, formulário, rodapé,
      diagramas, data e hora de duração).
- [ ] A escolha do idioma se mantém ao navegar para outras páginas.
- [ ] A escolha do idioma se mantém ao fechar e reabrir o navegador
      (localStorage).
- [ ] O atributo `lang` do `<html>` é atualizado na troca de idioma.

---

## 5. Diagramas e tutorial

- [ ] Cada passo do tutorial mostra a descrição textual completa, escrita para
      ser seguida sem ver o diagrama (posição, orientação, elemento movido,
      direção, estado esperado, erro comum e correção).
- [ ] O diagrama acompanha a descrição e mostra a dobra atual (linha + seta).
- [ ] As linhas são distinguíveis além da cor: tracejada azul (vale) e
      pontilhada-tracejada vermelha (montanha), com legenda.
- [ ] O selo F (frente) / V (verso) aparece e muda de forma ao virar o modelo.
- [ ] O zoom do diagrama funciona e não perde a descrição acessível.
- [ ] A navegação "anterior/próximo passo" funciona e atualiza o endereço
      (`#/passo/N`).
- [ ] O progresso é salvo ao concluir cada passo e continua ao reabrir o
      modelo.
- [ ] A conclusão do último passo mostra a mensagem de parabéns e o estado
      final.
- [ ] O "resultado" do modelo (na página inicial) mostra o diagrama final.

---

## 6. Responsividade e zoom

- [ ] O site funciona em telas de 360 px de largura (celular) sem cortar
      conteúdo nem exigir rolagem horizontal.
- [ ] Com zoom de 200% no navegador (apenas zoom, sem alterar a resolução),
      o conteúdo permanece legível e não há sobreposição de texto.
- [ ] Em 200%, os controles do cabeçalho (idioma, animações) continuam
      acessíveis.

---

## 7. Movimento e animação

- [ ] Com `prefers-reduced-motion: reduce` no sistema, nenhuma animação roda.
- [ ] O botão "Pausar animações" desliga e religa as animações e anuncia a
      mudança.
- [ ] A preferência de animações é lembrada ao recarregar a página.

---

## 8. Contraste e cores

- [ ] O texto tem contraste de pelo menos 4,5:1 sobre o fundo (WCAG AA).
- [ ] Nenhuma informação depende apenas de cor (diagramas usam padrões de
      linha + legenda).
- [ ] O foco visível tem contraste adequado em todos os fundos.

---

## 9. Privacidade

- [ ] O site não envia dados a nenhum servidor (confirmar na aba Network do
      DevTools que não há chamadas externas além dos arquivos do próprio site).
- [ ] O formulário de contato apenas monta um `mailto:` no dispositivo.
- [ ] O progresso fica apenas no localStorage do navegador.

---

## 10. Revisão por pessoa cega (obrigatória antes do lançamento)

Estes pontos **não podem** ser validados apenas por uma pessoa vidente:

- [ ] Os tutoriais podem ser seguidos do início ao fim **sem ver os
      diagramas**, usando apenas as descrições textuais.
- [ ] Cada passo termina com um estado que a pessoa consegue confirmar pelo
      tato (sem exigir comparação visual).
- [ ] As correções de erro comum são executáveis sem visão.
- [ ] O tamanho e a posição do papel (orientação espacial) descritos em cada
      passo correspondem ao que uma pessoa cega entende pela linguagem.
- [ ] A navegação entre passos, o zoom e o controle de animações são usáveis
      com leitor de tela.
- [ ] O formulário de contato pode ser preenchido e enviado com leitor de
      tela.
- [ ] Nenhuma mensagem do site assume que a pessoa vê (ex.: "veja a imagem",
      "como na figura", "observe o diagrama" sem alternativa textual).

---

## Como executar

```bash
# Validar dados
npm test

# Exportar diagramas para conferência visual
npm run export:diagrams

# Servir localmente
npm run serve
```

Depois, abra `http://localhost:3000` e percorra as seções 2 a 9. As seções
automatizadas (1) e a revisão por pessoa cega (10) devem ser repetidas a cada
mudança relevante.
