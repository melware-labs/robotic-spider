import * as THREE from "three";
import { CELL } from "./config";

/* =====================================================================
   Obstáculos: qué zonas de la pantalla ocupa el contenido
   ===================================================================== */
export const HERO_TEXT_FREE = true;
export const OBSTACLE_SELECTOR =
  "h1,h2,h3,h4,h5,h6,p,li,dt,dd,blockquote,figure,img,picture,video,svg,iframe,table,button,a,input,textarea,select,label,[role=button]";
export const TEXT_TAGS = new Set(["H1", "H2", "H3", "H4", "H5", "H6", "P", "LI", "DT", "DD", "BLOCKQUOTE", "LABEL"]);
export const FREE = 1, NEAR = 3, BLOCK = 255;
export const range = document.createRange();

export function collectObstacles(canvas: HTMLCanvasElement) {
  const found = new Set<Element>();
  // Contenedores fijos o pegajosos: lo que llevan dentro se mueve respecto a la página al hacer scroll
  const fixedRoots: Element[] = [];
  document.body.querySelectorAll("*").forEach((el) => {
    if (el === canvas) return;
    const p = getComputedStyle(el).position;
    if (p === "fixed" || p === "sticky") fixedRoots.push(el);
  });
  // Sin mirar la opacidad: el contenido que aún está invisible (animaciones de entrada)
  // también cuenta, para que nunca aparezca texto debajo de la araña
  const visible = (cs: CSSStyleDeclaration) => cs.visibility !== "hidden" && cs.display !== "none";
  document.querySelectorAll(OBSTACLE_SELECTOR).forEach((el) => {
    if (el === canvas) return;
    if (el.closest("[data-spider-ignore]")) return; // fondo decorativo: puede caminar por encima
    // Solo en el hero puede pasar por encima de las letras (y tejer sobre ellas); botones y enlaces siguen bloqueando
    if (HERO_TEXT_FREE && el.closest(".hero") && !el.closest("a,button,input,textarea,select,[role=button]")) return;
    const svg = el.closest("svg");
    if (svg && svg !== el) return; // solo el <svg> raíz
    if (visible(getComputedStyle(el))) found.add(el);
  });
  // Cards y paneles: cajas con fondo, borde o sombra (los fondos de sección o de pantalla
  // entera se descartan por tamaño: si no, el hero fijo bloquearía toda la pantalla)
  document.body.querySelectorAll("div,article,aside,section,li,form,header,nav,footer").forEach((el) => {
    if (found.has(el)) return;
    const cs = getComputedStyle(el);
    if (!visible(cs)) return;
    const b = el.getBoundingClientRect();
    if (b.width > window.innerWidth * 0.9 || b.width * b.height > window.innerWidth * window.innerHeight * 0.5) return;
    const bg = cs.backgroundColor;
    if (
      (bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") ||
      cs.backgroundImage !== "none" ||
      cs.boxShadow !== "none" ||
      parseFloat(cs.borderTopWidth) > 0 ||
      parseFloat(cs.borderLeftWidth) > 0
    ) found.add(el);
  });
  const all = [...found];
  const fixed = all.filter((el) => fixedRoots.some((root) => root.contains(el)));
  return { all, fixed };
}

export class Grid {
  cols = 0;
  rows = 0;
  cost = new Uint8Array(0);

  /** pad: margen prohibido alrededor del contenido (el alcance de las patas). */
  build(elements: Element[], W: number, H: number, pad: number) {
    this.cols = Math.ceil(W / CELL);
    this.rows = Math.ceil(H / CELL);
    this.cost = new Uint8Array(this.cols * this.rows).fill(FREE);
    const mark = (x0: number, y0: number, x1: number, y1: number, v: number) => {
      const c0 = Math.max(0, Math.floor(x0 / CELL)), c1 = Math.min(this.cols - 1, Math.floor(x1 / CELL));
      const r0 = Math.max(0, Math.floor(y0 / CELL)), r1 = Math.min(this.rows - 1, Math.floor(y1 / CELL));
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
        const i = r * this.cols + c;
        if (this.cost[i] < v) this.cost[i] = v;
      }
    };
    const add = (b: DOMRect | DOMRectReadOnly) => {
      if (b.width < 2 || b.height < 2) return;
      if (b.right < -pad || b.bottom < -pad || b.left > W + pad || b.top > H + pad) return;
      if (b.width > W * 0.9) return; // franja o fondo de sección: su contenido ya cuenta por separado
      if (b.width * b.height > W * H * 0.5) return; // contenedor enorme
      const near = pad + CELL * 1.5;
      mark(b.left - near, b.top - near, b.right + near, b.bottom + near, NEAR);
      mark(b.left - pad, b.top - pad, b.right + pad, b.bottom + pad, BLOCK);
    };
    for (const el of elements) {
      const b = el.getBoundingClientRect();
      if (b.bottom < -pad * 2 || b.top > H + pad * 2) continue;
      if (TEXT_TAGS.has(el.tagName)) {
        range.selectNodeContents(el); // texto: solo las líneas reales
        for (const r of range.getClientRects()) add(r);
      } else add(b);
    }
    // Bordes de arriba y abajo cerrados; los laterales quedan abiertos: por ahí sale y entra (túnel)
    mark(0, 0, W, pad, BLOCK); mark(0, H - pad, W, H, BLOCK);
  }

  cellOf(x: number, y: number) {
    const c = THREE.MathUtils.clamp(Math.floor(x / CELL), 0, this.cols - 1);
    const r = THREE.MathUtils.clamp(Math.floor(y / CELL), 0, this.rows - 1);
    return r * this.cols + c;
  }
  center(i: number) {
    return { x: (i % this.cols) * CELL + CELL / 2, y: Math.floor(i / this.cols) * CELL + CELL / 2 };
  }
  open(i: number) {
    return i >= 0 && i < this.cost.length && this.cost[i] !== BLOCK;
  }

  /** Celda transitable más cercana (BFS); con rows, solo dentro de ese rango de filas. */
  nearestOpen(i: number, rows?: [number, number], extra?: (n: number) => boolean) {
    const ok = (n: number) => {
      const r = Math.floor(n / this.cols);
      return this.open(n) && (!rows || (r >= rows[0] && r <= rows[1])) && (!extra || extra(n));
    };
    if (ok(i)) return i;
    const seen = new Uint8Array(this.cost.length);
    const queue = [i];
    seen[i] = 1;
    for (let q = 0; q < queue.length; q++) {
      const cur = queue[q];
      if (ok(cur)) return cur;
      const c = cur % this.cols, r = (cur - c) / this.cols;
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nc = c + dc, nr = r + dr;
        if (nc < 0 || nr < 0 || nc >= this.cols || nr >= this.rows) continue;
        const n = nr * this.cols + nc;
        if (!seen[n]) { seen[n] = 1; queue.push(n); }
      }
    }
    return -1;
  }

  /** Celdas prohibidas que pisa una recta entre dos celdas. */
  blockedOnLine(a: number, b: number) {
    let x0 = a % this.cols, y0 = Math.floor(a / this.cols);
    const x1 = b % this.cols, y1 = Math.floor(b / this.cols);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy, count = 0;
    for (;;) {
      if (this.cost[y0 * this.cols + x0] === BLOCK) count++;
      if (x0 === x1 && y0 === y1) return count;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }

  /** A* por celdas transitables (8 vecinos, sin cortar esquinas); devuelve la ruta suavizada. */
  path(start: number, goal: number): number[] | null {
    const n = this.cost.length, cols = this.cols;
    const g = new Float32Array(n).fill(Infinity), f = new Float32Array(n);
    const from = new Int32Array(n).fill(-1), closed = new Uint8Array(n);
    const gc = goal % cols, gr = Math.floor(goal / cols);
    const h = (i: number) => {
      const dx = Math.abs((i % cols) - gc), dy = Math.abs(Math.floor(i / cols) - gr);
      return dx + dy + (Math.SQRT2 - 2) * Math.min(dx, dy);
    };
    const heap: number[] = [];
    const push = (i: number) => {
      heap.push(i);
      let k = heap.length - 1;
      while (k > 0) { const p = (k - 1) >> 1; if (f[heap[p]] <= f[heap[k]]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; }
    };
    const pop = () => {
      const top = heap[0], last = heap.pop()!;
      if (heap.length) {
        heap[0] = last;
        let k = 0;
        for (;;) {
          const l = 2 * k + 1, r = l + 1;
          let m = k;
          if (l < heap.length && f[heap[l]] < f[heap[m]]) m = l;
          if (r < heap.length && f[heap[r]] < f[heap[m]]) m = r;
          if (m === k) break;
          [heap[m], heap[k]] = [heap[k], heap[m]];
          k = m;
        }
      }
      return top;
    };
    g[start] = 0; f[start] = h(start); push(start);
    while (heap.length) {
      const cur = pop();
      if (cur === goal) break;
      if (closed[cur]) continue;
      closed[cur] = 1;
      const c = cur % cols, r = (cur - c) / cols;
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const nc = c + dc, nr = r + dr;
        if (nc < 0 || nr < 0 || nc >= cols || nr >= this.rows) continue;
        const nb = nr * cols + nc;
        if (closed[nb] || this.cost[nb] === BLOCK) continue;
        if (dr && dc && (this.cost[r * cols + nc] === BLOCK || this.cost[nr * cols + c] === BLOCK)) continue;
        const cost = g[cur] + (dr && dc ? Math.SQRT2 : 1) * this.cost[nb];
        if (cost < g[nb]) { g[nb] = cost; from[nb] = cur; f[nb] = cost + h(nb); push(nb); }
      }
    }
    if (goal !== start && from[goal] === -1) return null;
    const raw: number[] = [];
    for (let i = goal; i !== -1; i = from[i]) raw.push(i);
    raw.reverse();
    const out = [raw[0]];
    let k = 0;
    while (k < raw.length - 1) {
      let j = raw.length - 1;
      while (j > k + 1 && this.blockedOnLine(raw[k], raw[j]) > 0) j--;
      out.push(raw[j]);
      k = j;
    }
    return out;
  }
}
