import * as THREE from "three";
import { DEG } from "./math";

/* =====================================================================
   Modelo (unidades propias; frente = +X, arriba = +Z, envergadura ≈ 300)
   ===================================================================== */
export const SPAN = 300, A_LEN = 74, B_LEN = 84, TIP = 66, HIP_Z = 26;
export const HIP_A = [30, 62, 104, 140], FOOT_A = [24, 58, 118, 156], FOOT_R = [150, 140, 140, 150];

export type Leg = {
  side: number; group: number;
  hip: THREE.Vector3; ra: number; rr: number;
  femur: THREE.Group; tibia: THREE.Group; tip: THREE.Group;
  fx: number; fy: number; sx: number; sy: number; k: number; lift: number; servo: number;
  knee: THREE.Vector3; point: THREE.Vector3;
};

/** Entorno de estudio en blanco y negro: es lo que refleja el cromo (bandas de alto contraste). */
export function studioEnvironment(renderer: THREE.WebGLRenderer) {
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 512;
  const x = c.getContext("2d")!;
  const g = x.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, "#f2f4f8"); g.addColorStop(0.2, "#9aa0aa"); g.addColorStop(0.42, "#06070a");
  g.addColorStop(0.5, "#f5f6f8"); g.addColorStop(0.58, "#0b0c10"); g.addColorStop(0.8, "#26282d"); g.addColorStop(1, "#030305");
  x.fillStyle = g; x.fillRect(0, 0, 1024, 512);
  const box = (px: number, py: number, w: number, h: number, col: string, blur: number) => {
    x.save(); x.filter = `blur(${blur}px)`; x.fillStyle = col; x.fillRect(px, py, w, h); x.restore();
  };
  // cajas de luz blancas y paneles negros: dan los reflejos nítidos del cromo
  box(40, 30, 300, 170, "#ffffff", 6); box(400, 10, 170, 200, "#ffffff", 8); box(640, 40, 330, 150, "#ffffff", 5);
  box(350, 60, 36, 190, "#020203", 3); box(585, 30, 40, 200, "#020203", 3); box(0, 215, 1024, 10, "#020203", 2);
  box(120, 300, 260, 90, "#d4d7dd", 12); box(520, 290, 200, 110, "#ffffff", 10); box(800, 310, 200, 80, "#c9ccd2", 14);
  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  const pm = new THREE.PMREMGenerator(renderer);
  const env = pm.fromEquirectangular(tex).texture;
  tex.dispose(); pm.dispose();
  return env;
}

/** Halo aditivo (nucleo claro -> rojo -> transparente), como un LED real. */
export function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const x = c.getContext("2d")!;
  const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, "rgba(255,70,50,1)");
  g.addColorStop(0.3, "rgba(200,20,10,0.95)");
  g.addColorStop(0.5, "rgba(120,5,5,0.45)");
  g.addColorStop(1, "rgba(90,0,0,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

/** Textura de destello en estrella para los brillos de las rótulas y las puntas. */
export function starTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const x = c.getContext("2d")!;
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 20);
  g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  x.globalCompositeOperation = "lighter";
  for (const vertical of [true, false]) {
    const lg = vertical ? x.createLinearGradient(64, 0, 64, 128) : x.createLinearGradient(0, 64, 128, 64);
    lg.addColorStop(0, "rgba(255,255,255,0)"); lg.addColorStop(0.5, "rgba(255,255,255,1)"); lg.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = lg;
    if (vertical) x.fillRect(62.5, 0, 3, 128); else x.fillRect(0, 62.5, 128, 3);
  }
  return new THREE.CanvasTexture(c);
}

export function buildSpider() {
  const chrome = new THREE.MeshStandardMaterial({ color: 0xf2f3f5, metalness: 1, roughness: 0.04 });
  const facet = new THREE.MeshStandardMaterial({ color: 0xf2f3f5, metalness: 1, roughness: 0.06, flatShading: true });
  const seamMat = new THREE.MeshStandardMaterial({ color: 0x050608, metalness: 1, roughness: 0.4 });
  const materials: THREE.Material[] = [chrome, facet, seamMat];
  const geometries: THREE.BufferGeometry[] = [];
  const keep = <T extends THREE.BufferGeometry>(g: T) => (geometries.push(g), g);

  const head = new THREE.Group(); // marco local de la araña
  const body = new THREE.Group();
  head.add(body);

  // Sombra de contacto, suave
  const sc = document.createElement("canvas");
  sc.width = sc.height = 128;
  const sx = sc.getContext("2d")!, sg = sx.createRadialGradient(64, 64, 4, 64, 64, 64);
  sg.addColorStop(0, "rgba(0,0,10,.28)"); sg.addColorStop(1, "rgba(0,0,10,0)");
  sx.fillStyle = sg; sx.fillRect(0, 0, 128, 128);
  const shadowTex = new THREE.CanvasTexture(sc);
  const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false });
  materials.push(shadowMat);
  const shadow = new THREE.Mesh(keep(new THREE.PlaneGeometry(190, 150)), shadowMat);
  shadow.position.set(-14, 0, 0.5);
  head.add(shadow);

  // Abdomen esférico y cabeza en gota, cada uno con su costura longitudinal
  const sph = keep(new THREE.SphereGeometry(1, 64, 40));
  const seamGeo = keep(new THREE.TorusGeometry(1.003, 0.014, 6, 96));
  const shell = (x: number, z: number, sx: number, sy: number, sz: number) => {
    const m = new THREE.Mesh(sph, chrome);
    m.position.set(x, 0, z);
    m.scale.set(sx, sy, sz);
    const seam = new THREE.Mesh(seamGeo, seamMat);
    seam.rotation.x = Math.PI / 2;
    m.add(seam);
    body.add(m);
  };
  shell(-46, HIP_Z + 10, 40, 37, 37); // abdomen
  shell(6, HIP_Z, 17, 14, 12); // cefalotórax…
  const nose = new THREE.Mesh(keep(new THREE.ConeGeometry(10.5, 22, 48)), chrome); // …que acaba en punta
  nose.rotation.z = -Math.PI / 2;
  nose.position.set(26, 0, HIP_Z - 1);
  nose.scale.set(1, 1, 0.82);
  body.add(nose);
  const waist = new THREE.Mesh(sph, chrome);
  waist.position.set(-9, 0, HIP_Z + 2);
  waist.scale.set(6, 7, 6);
  body.add(waist);
  // Quelíceros curvos hacia delante
  // Colmillos: un solo tubo curvo y liso por lado (nada de picos geometricos
  // apilados), con la raiz enterrada en una esfera que nunca deja ver costura.
  const maskRootGeo = keep(new THREE.SphereGeometry(1, 32, 24));
  for (const sd of [1, -1]) {
    const g = new THREE.Group();
    g.position.set(21, 3.2 * sd, HIP_Z - 5);

    const root = new THREE.Mesh(maskRootGeo, chrome);
    root.scale.setScalar(5.4);
    g.add(root);

    const p0 = new THREE.Vector3(-2, -0.3 * sd, 0.8);
    const p1 = new THREE.Vector3(2.5, 0.5 * sd, -1.2);
    const p2 = new THREE.Vector3(6, 1.5 * sd, -4);
    const p3 = new THREE.Vector3(8, 2.6 * sd, -6.4);
    const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3]);
    const fangGeo = keep(new THREE.TubeGeometry(curve, 24, 1.7, 10, false));
    const fang = new THREE.Mesh(fangGeo, chrome);
    g.add(fang);

    const tipDir = p3.clone().sub(p2).normalize();
    const tip = new THREE.Mesh(keep(new THREE.ConeGeometry(1.7, 5, 10)), chrome);
    tip.position.copy(p3);
    tip.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tipDir);
    g.add(tip);

    body.add(g);
  }

  // Ojos: lentes rojas hundidas en la cabeza, con halo aditivo (billboard,
  // siempre visible aunque una pata pase por delante) para el look de LED encendido.
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0x200002, emissive: 0xb30c0c, emissiveIntensity: 6, metalness: 0.3, roughness: 0.2,
  });
  materials.push(eyeMat);
  const eyeGeo = keep(new THREE.SphereGeometry(1, 24, 18));
  const glowTex = glowTexture();
  const halos: THREE.SpriteMaterial[] = [], glows: THREE.PointLight[] = []; // para apagarlos al dormir
  const eyeLayout = [
    { ox: 4.6, oy: 0.9, oz: 2.2, r: 1.9 },
    { ox: 4.1, oy: 0.2, oz: 3.3, r: 1.1 },
  ];
  for (const sd of [1, -1]) {
    const maskCenter = new THREE.Vector3(21, 3.2 * sd, HIP_Z - 5);
    for (const e of eyeLayout) {
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(maskCenter.x + e.ox, maskCenter.y + e.oy * sd, maskCenter.z + e.oz);
      eye.scale.setScalar(e.r);
      body.add(eye);
      const haloMat = new THREE.SpriteMaterial({
        map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: true, transparent: true, opacity: 1,
      });
      materials.push(haloMat);
      halos.push(haloMat);
      const halo = new THREE.Sprite(haloMat);
      halo.position.copy(eye.position);
      halo.scale.setScalar(e.r * 6);
      body.add(halo);
      const glow = new THREE.PointLight(0xff2a20, 1.6, 55, 2);
      glow.position.copy(eye.position);
      body.add(glow);
      glows.push(glow);
    }
  }

  // Tramo de pata: huso facetado de 0 a len en +Y, con rótula de diamante en el origen
  const jointGeo = keep(new THREE.OctahedronGeometry(1, 0));
  const spindle = (len: number, r: number) =>
    keep(new THREE.LatheGeometry([
      new THREE.Vector2(0.001, 0), new THREE.Vector2(r * 0.55, len * 0.04), new THREE.Vector2(r, len * 0.3),
      new THREE.Vector2(r * 0.62, len * 0.94), new THREE.Vector2(0.001, len),
    ], 6));
  const needle = (len: number, r: number) =>
    keep(new THREE.LatheGeometry([
      new THREE.Vector2(0.001, 0), new THREE.Vector2(r, len * 0.1), new THREE.Vector2(r * 0.5, len * 0.45), new THREE.Vector2(0.001, len),
    ], 6));
  const femurGeo = spindle(A_LEN, 4.2), tibiaGeo = spindle(B_LEN, 3.7), tipGeo = needle(TIP, 3);
  const segment = (geo: THREE.BufferGeometry, r: number) => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(geo, facet));
    const j = new THREE.Mesh(jointGeo, facet);
    j.scale.set(r * 1.25, r * 1.9, r * 1.25);
    g.add(j);
    return g;
  };

  const legs: Leg[] = [];
  HIP_A.forEach((ha, i) => [1, -1].forEach((side) => {
    const l: Leg = {
      side, group: (i + (side > 0 ? 0 : 1)) % 2,
      hip: new THREE.Vector3(6 + Math.cos(ha * DEG) * 13, Math.sin(ha * DEG) * 11 * side, HIP_Z),
      ra: FOOT_A[i] * DEG * side, rr: FOOT_R[i],
      femur: segment(femurGeo, 4.2), tibia: segment(tibiaGeo, 3.7), tip: segment(tipGeo, 3),
      fx: 0, fy: 0, sx: 0, sy: 0, k: 1, lift: 0, servo: 0,
      knee: new THREE.Vector3(), point: new THREE.Vector3(),
    };
    head.add(l.femur, l.tibia, l.tip);
    legs.push(l);
  }));

  return { head, body, legs, materials, geometries, textures: [shadowTex, glowTex], eyes: { mat: eyeMat, halos, glows } };
}
