/**
 * diagrams.js - Motor de diagramas acessíveis do OrigamiECJ.
 *
 * Gera diagramas SVG a partir de dados estruturados, sem depender de
 * imagens externas. Cada diagrama:
 *  - representa a silhueta do papel no estado atual da dobra;
 *  - usa linhas tracejadas (vale) e pontilhadas-tracejadas (montanha);
 *  - desenha setas indicando a direção do movimento;
 *  - indica frente/verso e orientação do papel;
 *  - possui <title> e <desc> acessíveis;
 *  - usa alto contraste e não depende apenas de cores (as dobras
 *    diferem também pelo padrão da linha e por símbolos).
 *
 * O formato dos dados é documentado no README ("Como criar ou editar
 * diagramas"). O mesmo motor é usado pela página de tutoriais e pelo
 * script de exportação (scripts/export-diagrams.mjs).
 */

/* ------------------------------------------------------------------ */
/* Constantes visuais                                                  */
/* ------------------------------------------------------------------ */

const COLORS = {
  paperFront: '#ffffff',
  paperBack: '#ffffff',
  stroke: '#1c1c1c',
  valley: '#0b5394',
  mountain: '#9d1c1c',
  arrow: '#1c1c1c',
  arrowAction: '#0b5394',
  label: '#1c1c1c',
  hatch: '#b9b9b9',
  badgeText: '#ffffff',
};

const VALLEY_DASH = '7 4'; // tracejado
const MOUNTAIN_DASH = '10 3 2 3'; // pontilhado-tracejado

/* ------------------------------------------------------------------ */
/* Formas base do papel (coordenadas em "unidades de papel")           */
/* ------------------------------------------------------------------ */

export const BASE_SHAPES = {
  /** Quadrado 1x1. */
  square: [[0, 0], [1, 0], [1, 1], [0, 1]],
  /** Retângulo A4 em retrato (1 x 1,4142). */
  a4: [[0, 0], [1, 0], [1, 1.4142], [0, 1.4142]],
  /** Retângulo A4 em paisagem (1,4142 x 1). */
  'a4-landscape': [[0, 0], [1.4142, 0], [1.4142, 1], [0, 1]],
};

const EPS = 1e-6;

/* ------------------------------------------------------------------ */
/* Geometria de dobras (reflexão de uma cadeia de vértices)            */
/* ------------------------------------------------------------------ */

function reflectPoint(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  if (len2 < EPS) return [p[0], p[1]];
  const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2;
  const px = a[0] + t * dx;
  const py = a[1] + t * dy;
  return [2 * px - p[0], 2 * py - p[1]];
}

function dist(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

function onSegment(p, a, b) {
  const d = dist(a, b);
  if (d < EPS) return false;
  return Math.abs(dist(a, p) + dist(b, p) - d) < 1e-4;
}

/**
 * Encontra o ponto do polígono mais próximo de P.
 * Pode ser um vértice existente ou um ponto sobre uma aresta.
 */
function nearestPointOnPoly(poly, P) {
  let best = null;
  let bestD = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const d = dist(a, P);
    if (d < bestD) {
      bestD = d;
      best = { type: 'vertex', i, point: a };
    }
  }
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const d = distToSegment(P, a, b);
    if (d < bestD - EPS) {
      bestD = d;
      const proj = projectOnSegment(P, a, b);
      best = { type: 'edge', i, point: proj };
    }
  }
  return best;
}

function distToSegment(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  if (len2 < EPS) return dist(p, a);
  let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return dist(p, [a[0] + t * dx, a[1] + t * dy]);
}

function projectOnSegment(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  if (len2 < EPS) return [a[0], a[1]];
  let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return [a[0] + t * dx, a[1] + t * dy];
}

/** Insere um ponto no polígono se ele cair no meio de uma aresta. */
function insertPoint(poly, ref) {
  const out = poly.slice();
  for (let i = 0; i < out.length; i++) {
    const a = out[i];
    const b = out[(i + 1) % out.length];
    if (onSegment(ref.point, a, b) && dist(a, ref.point) > EPS && dist(b, ref.point) > EPS) {
      out.splice(i + 1, 0, ref.point);
      return out;
    }
  }
  return out;
}

/**
 * Aplica uma dobra: reflete a cadeia de vértices que contém o "probe"
 * (a região que se movimenta) através do eixo [a, b].
 * @param {number[][]} poly polígono CCW (fechado implicitamente)
 * @param {number[]} a ponto do eixo sobre a borda
 * @param {number[]} b ponto do eixo sobre a borda
 * @param {number[]} probe ponto dentro da região que se movimenta
 * @returns {number[][]} novo polígono
 */
export function applyFold(poly, a, b, probe) {
  const pa = nearestPointOnPoly(poly, a);
  const pb = nearestPointOnPoly(poly, b);
  let p = insertPoint(poly, pa);
  p = insertPoint(p, pb);

  let ia = -1;
  let ib = -1;
  for (let i = 0; i < p.length; i++) {
    if (ia === -1 && dist(p[i], pa.point) < EPS) ia = i;
    else if (ia !== -1 && dist(p[i], pb.point) < EPS) ib = i;
  }
  if (ia === -1) ia = 0;
  if (ib === -1) ib = p.length - 1;
  if (ia === ib) {
    // eixo degenerado: retorna o polígono sem alteração
    return dedupe(p);
  }

  // Gera as duas cadeias entre ia e ib.
  const chainA = [];
  for (let k = ia; ; k = (k + 1) % p.length) {
    chainA.push(k);
    if (k === ib) break;
  }
  const chainB = [];
  for (let k = ia; ; k = (k - 1 + p.length) % p.length) {
    chainB.push(k);
    if (k === ib) break;
  }

  // Escolhe a cadeia que contém o probe (menor distância média ao probe).
  let dA = 0;
  for (const k of chainA) dA += dist(p[k], probe);
  dA /= chainA.length;
  let dB = 0;
  for (const k of chainB) dB += dist(p[k], probe);
  dB /= chainB.length;

  const moving = dA <= dB ? chainA : chainB;

  // Reconstrói o polígono: cadeia que fica parada + cadeia refletida.
  const still = moving === chainA ? chainB : chainA;
  // Ordena a cadeia "still" na direção CCW (de pb de volta a pa).
  const stillOrdered = [];
  for (const k of still) stillOrdered.push(p[k]);
  if (still === chainB) {
    // chainB vai de ia a ib no sentido anti-horário; revertemos para
    // obter o trecho de ib a ia no sentido horário original do polígono.
    stillOrdered.reverse();
  }

  const reflected = [];
  for (let idx = 0; idx < moving.length; idx++) {
    const k = moving[idx];
    const v = p[k];
    const isEndpoint = idx === 0 || idx === moving.length - 1;
    reflected.push(isEndpoint ? v : reflectPoint(v, pa.point, pb.point));
  }

  const result = reflected.concat(stillOrdered);
  return dedupe(result);
}

/** Remove vértices consecutivos (e o último==primeiro) duplicados. */
function dedupe(poly) {
  const out = [];
  for (const v of poly) {
    const last = out[out.length - 1];
    if (!last || dist(last, v) > EPS) {
      out.push([v[0], v[1]]);
    }
  }
  if (out.length > 1 && dist(out[0], out[out.length - 1]) < EPS) {
    out.pop();
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Estado de renderização de um passo                                  */
/* ------------------------------------------------------------------ */

/**
 * Constrói o estado de renderização de um passo.
 *
 * A silhueta (outline) representa o papel no INÍCIO da etapa: as dobras
 * dos passos anteriores já foram aplicadas, mas a dobra do passo atual
 * ainda não. A dobra atual aparece como linha de vinco + seta.
 *
 * Cada dobra pode ter `unfold: true`, o que registra o vinco sem alterar
 * a silhueta (caso de "dobrar e desdobrar").
 *
 * @param {object} model dados do modelo (com model.steps[])
 * @param {number} stepIndex índice do passo (0-based)
 * @returns {object} { outline, creases, action, view, corners }
 */
export function buildRenderState(model, stepIndex) {
  let poly = null;
  let creases = [];
  let view = 'front';
  let corners = null;

  for (let i = 0; i <= stepIndex; i++) {
    const d = model.steps[i].diagram || {};
    if (d.view) view = d.view;
    if (d.corners) corners = d.corners;
    if (d.outline) {
      poly = d.outline.map((pt) => [pt[0], pt[1]]);
      creases = (d.creases || []).map((c) => ({ axis: c.axis, kind: c.kind }));
    } else {
      if (poly === null) {
        poly = (BASE_SHAPES[d.base] || BASE_SHAPES.square).map((pt) => [pt[0], pt[1]]);
      }
      const folds = d.folds || [];
      for (const f of folds) {
        creases.push({ axis: f.axis, kind: f.kind || 'valley' });
        if (i < stepIndex && !f.unfold) {
          poly = applyFold(poly, f.axis[0], f.axis[1], f.probe);
        }
      }
    }
  }

  const current = model.steps[stepIndex].diagram || {};
  const action = current.action || { type: 'none' };
  if (action.type === 'fold') {
    const already = creases.some(
      (c) =>
        c.axis &&
        Math.hypot(c.axis[0][0] - action.axis[0][0], c.axis[0][1] - action.axis[0][1]) < EPS &&
        Math.hypot(c.axis[1][0] - action.axis[1][0], c.axis[1][1] - action.axis[1][1]) < EPS
    );
    if (!already) {
      creases.push({ axis: action.axis, kind: action.kind || 'valley' });
    }
  }

  return {
    outline: poly,
    creases,
    action,
    view: view || 'front',
    corners,
  };
}

/**
 * Estado de renderização do diagrama do RESULTADO final do modelo.
 * @param {object} model
 * @returns {object}
 */
export function buildResultState(model) {
  const d = model.result?.diagram || {};
  return {
    outline: d.outline ? d.outline.map((pt) => [pt[0], pt[1]]) : null,
    creases: (d.creases || []).map((c) => ({ axis: c.axis, kind: c.kind })),
    action: { type: 'none' },
    view: d.view || 'front',
    corners: null,
  };
}

/* ------------------------------------------------------------------ */
/* Geração do SVG                                                      */
/* ------------------------------------------------------------------ */

/**
 * Gera o SVG de um diagrama.
 * @param {object} state resultado de buildRenderState
 * @param {object} opts { title, desc, labels } textos acessíveis/traduzidos
 * @returns {string} marcação SVG
 */
export function renderDiagramSvg(state, opts = {}) {
  const outline = state.outline;
  if (!outline || outline.length < 3) {
    return `<svg role="img" xmlns="http://www.w3.org/2000/svg"></svg>`;
  }

  const { bbox, scale, ox, oy } = computeTransform(outline);
  const W = bbox.w * scale;
  const H = bbox.h * scale;

  const map = (p) => [ox + p[0] * scale, oy + p[1] * scale];

  const defs = buildDefs();
  const paper = renderPaper(outline, map, state.view);
  const creaseEls = state.creases.map((c) => renderCrease(c, map));
  const actionEls = renderAction(state.action, outline, map, state.view);
  const cornerEls = renderCorners(state.corners, outline, map);
  const badges = renderBadges(state.view, opts, W, H);

  const titleId = opts.uid ? `diag-title-${opts.uid}` : '';
  const descId = opts.uid ? `diag-desc-${opts.uid}` : '';
  const titleEl = titleId
    ? `<title id="${titleId}">${escapeXml(opts.title || '')}</title>`
    : '';
  const descEl = descId
    ? `<desc id="${descId}">${escapeXml(opts.desc || '')}</desc>`
    : '';
  const labelledBy = [titleId, descId].filter(Boolean).join(' ');
  const aria = labelledBy ? ` aria-labelledby="${labelledBy}"` : '';

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" role="img"${aria} ` +
    `viewBox="0 0 ${Math.ceil(W)} ${Math.ceil(H)}" class="origami-diagram">` +
    titleEl +
    descEl +
    defs +
    paper +
    creaseEls.join('') +
    actionEls.join('') +
    cornerEls.join('') +
    badges +
    `</svg>`
  );
}

function computeTransform(outline) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of outline) {
    minX = Math.min(minX, p[0]);
    minY = Math.min(minY, p[1]);
    maxX = Math.max(maxX, p[0]);
    maxY = Math.max(maxY, p[1]);
  }
  const bw = maxX - minX;
  const bh = maxY - minY;
  const pad = Math.max(0.18, Math.max(bw, bh) * 0.14);
  const targetW = 400;
  const scale = targetW / (bw + pad * 2);
  const ox = -minX + pad;
  const oy = -minY + pad;
  return {
    bbox: { w: bw + pad * 2, h: bh + pad * 2 },
    scale,
    ox: ox * scale,
    oy: oy * scale,
  };
}

function buildDefs() {
  return (
    `<defs>` +
    `<marker id="arrowValley" viewBox="0 0 10 10" refX="8" refY="5" ` +
    `markerWidth="7" markerHeight="7" orient="auto-start-reverse">` +
    `<path d="M 0 1 L 9 5 L 0 9 z" fill="${COLORS.arrowAction}"/></marker>` +
    `<marker id="arrowPlain" viewBox="0 0 10 10" refX="8" refY="5" ` +
    `markerWidth="7" markerHeight="7" orient="auto-start-reverse">` +
    `<path d="M 0 1 L 9 5 L 0 9 z" fill="${COLORS.arrow}"/></marker>` +
    `<pattern id="hatchBack" patternUnits="userSpaceOnUse" width="8" height="8">` +
    `<path d="M 0 8 L 8 0" stroke="${COLORS.hatch}" stroke-width="1"/></pattern>` +
    `</defs>`
  );
}

function renderPaper(outline, map, view) {
  const points = outline.map((p) => map(p).join(',')).join(' ');
  const fill = view === 'back' ? `url(#hatchBack)` : COLORS.paperFront;
  return (
    `<polygon points="${points}" fill="${fill}" stroke="${COLORS.stroke}" ` +
    `stroke-width="2.5" stroke-linejoin="round"/>`
  );
}

function renderCrease(crease, map) {
  const a = map(crease.axis[0]);
  const b = map(crease.axis[1]);
  const isValley = crease.kind !== 'mountain';
  const stroke = isValley ? COLORS.valley : COLORS.mountain;
  const dash = isValley ? VALLEY_DASH : MOUNTAIN_DASH;
  return (
    `<line x1="${fmt(a[0])}" y1="${fmt(a[1])}" x2="${fmt(b[0])}" y2="${fmt(b[1])}" ` +
    `stroke="${stroke}" stroke-width="3" stroke-dasharray="${dash}" stroke-linecap="round"/>`
  );
}

function renderAction(action, outline, map, view) {
  if (!action || action.type === 'none') return [];
  const els = [];
  if (action.type === 'fold') {
    const axis = action.axis;
    const probe = action.probe || midpointOfMovingRegion(outline, axis);
    const reflected = reflectPoint(probe, axis[0], axis[1]);
    const from = map(probe);
    const to = map(reflected);
    els.push(
      `<line x1="${fmt(from[0])}" y1="${fmt(from[1])}" x2="${fmt(to[0])}" y2="${fmt(to[1])}" ` +
        `stroke="${COLORS.arrowAction}" stroke-width="4" marker-end="url(#arrowValley)"/>`
    );
    const mid = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];
    els.push(
      `<circle cx="${fmt(mid[0])}" cy="${fmt(mid[1])}" r="2.5" fill="${COLORS.arrowAction}"/>`
    );
  } else if (action.type === 'flip' || action.type === 'turn') {
    els.push(renderFlipArrow(outline, map));
  } else if (action.type === 'open' || action.type === 'pull' || action.type === 'spread') {
    els.push(renderSpreadArrows(outline, map));
  }
  return els;
}

/** Ponto de referência padrão quando a ação não traz probe. */
function midpointOfMovingRegion(outline, axis) {
  // usa o ponto médio da região do polígono oposta ao eixo, aproximado
  // pelo centroide do polígono.
  const c = centroid(outline);
  return c;
}

function centroid(poly) {
  let x = 0;
  let y = 0;
  for (const p of poly) {
    x += p[0];
    y += p[1];
  }
  return [x / poly.length, y / poly.length];
}

function renderFlipArrow(outline, map) {
  const bbox = outlineBBox(outline);
  const cx = (bbox[0] + bbox[2]) / 2;
  const cy = (bbox[1] + bbox[3]) / 2;
  const r = (bbox[2] - bbox[0]) * 0.62;
  const p0 = map([cx - r * 0.7, cy]);
  const p1 = map([cx + r * 0.7, cy]);
  const mid = map([cx, cy - r * 0.85]);
  // Arco por cima do papel com seta.
  const d =
    `M ${fmt(p0[0])} ${fmt(p0[1])} ` +
    `Q ${fmt(mid[0])} ${fmt(mid[1])} ${fmt(p1[0])} ${fmt(p1[1])}`;
  return (
    `<path d="${d}" fill="none" stroke="${COLORS.arrowAction}" stroke-width="4" ` +
    `marker-end="url(#arrowValley)"/>`
  );
}

function renderSpreadArrows(outline, map) {
  const bbox = outlineBBox(outline);
  const cx = (bbox[0] + bbox[2]) / 2;
  const cy = (bbox[1] + bbox[3]) / 2;
  const h = (bbox[3] - bbox[1]) * 0.55;
  const left = map([cx - h, cy]);
  const right = map([cx + h, cy]);
  const center = map([cx, cy]);
  return [
    `<line x1="${fmt(center[0])}" y1="${fmt(center[1])}" x2="${fmt(left[0])}" y2="${fmt(left[1])}" ` +
      `stroke="${COLORS.arrowAction}" stroke-width="4" marker-end="url(#arrowValley)"/>`,
    `<line x1="${fmt(center[0])}" y1="${fmt(center[1])}" x2="${fmt(right[0])}" y2="${fmt(right[1])}" ` +
      `stroke="${COLORS.arrowAction}" stroke-width="4" marker-end="url(#arrowValley)"/>`,
  ];
}

function renderCorners(corners, outline, map) {
  if (!corners || !corners.length) return [];
  return corners.map((c) => {
    const pt = nearestPointOnPoly(outline, c.at).point;
    const m = map(pt);
    // desloca o rótulo levemente para fora do papel
    const center = centroid(outline);
    const dirX = m[0] - map(center)[0];
    const dirY = m[1] - map(center)[1];
    const len = Math.hypot(dirX, dirY) || 1;
    const lx = m[0] + (dirX / len) * 18;
    const ly = m[1] + (dirY / len) * 18;
    return (
      `<text x="${fmt(lx)}" y="${fmt(ly)}" text-anchor="middle" ` +
      `dominant-baseline="central" font-size="20" font-weight="700" ` +
      `fill="${COLORS.label}" paint-order="stroke" stroke="#ffffff" stroke-width="4">` +
      `${escapeXml(c.label)}</text>`
    );
  });
}

function renderBadges(view, opts, W, H) {
  const els = [];
  // Selo frente/verso (canto superior esquerdo)
  const bx = 20;
  const by = 20;
  if (view === 'back') {
    els.push(
      `<circle cx="${bx}" cy="${by}" r="13" fill="#ffffff" stroke="${COLORS.stroke}" stroke-width="2.5"/>` +
        `<circle cx="${bx}" cy="${by}" r="9" fill="url(#hatchBack)"/>` +
        `<text x="${bx}" y="${by + 1}" text-anchor="middle" dominant-baseline="central" ` +
        `font-size="11" font-weight="700" fill="${COLORS.stroke}">${escapeXml(opts.backBadge || 'V')}</text>`
    );
  } else {
    els.push(
      `<circle cx="${bx}" cy="${by}" r="13" fill="${COLORS.stroke}"/>` +
        `<text x="${bx}" y="${by + 1}" text-anchor="middle" dominant-baseline="central" ` +
        `font-size="11" font-weight="700" fill="${COLORS.badgeText}">${escapeXml(opts.frontBadge || 'F')}</text>`
    );
  }
  // Indicador de orientação (canto superior direito)
  const ox = W - 20;
  els.push(
    `<line x1="${fmt(ox)}" y1="${fmt(20)}" x2="${fmt(ox)}" y2="${fmt(6)}" stroke="${COLORS.stroke}" stroke-width="2.5" marker-end="url(#arrowPlain)"/>`
  );
  return els.join('');
}

function outlineBBox(outline) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of outline) {
    minX = Math.min(minX, p[0]);
    minY = Math.min(minY, p[1]);
    maxX = Math.max(maxX, p[0]);
    maxY = Math.max(maxY, p[1]);
  }
  return [minX, minY, maxX, maxY];
}

function fmt(n) {
  return Number(n.toFixed(1)).toString();
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
