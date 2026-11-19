// Ajustes de la araña: toda la configuración vive aquí.

/* ---------- Ajustes ---------- */
export const SPAN_PX = { desktop: 84, mobile: 60 }; // de punta a punta de las patas (px)
export const WALK_SPEED = 2.6; // velocidad al caminar, en "envergaduras" por segundo
export const TURN_SPEED = 9; // lerp del giro
export const STEP_TIME = 0.09; // s que dura el paso de una pata (golpe de servo)
export const BAND = { top: 0.2, bottom: 0.82 }; // zona de pantalla por la que se mueve
export const DROP_TIME = 1.1; // s que tarda en bajar colgada del hilo
export const CELL = 12; // celda de la cuadrícula de obstáculos (px)
export const GRID_EVERY = 200; // ms entre reconstrucciones de la cuadrícula
export const COLLECT_EVERY = 1500; // ms entre lecturas de qué elementos son obstáculo
export const OUT_OF_VIEW = 0.6; // fuera de la vista: el cuerpo pasó el borde más de esta fracción de envergadura
export const SCROLL_SETTLE = 350; // ms sin scroll antes de volver a reaccionar a lo que tiene alrededor

/* Hero: persigue el cursor */
export const CHASE_REPLAN = 220; // ms mínimos entre rutas nuevas hacia el cursor
export const CHASE_STOP = 10; // px: a esta distancia del destino se considera que llegó

/* Telaraña (solo mientras persigue el cursor) */
export const WEB_STEP = 42; // px recorridos entre ancla y ancla: el rastro sigue fielmente su camino
export const WEB_LINK_RADIUS = 150; // px: distancia máxima de los radios hacia anclas viejas (solo por donde ya pasó)
export const WEB_LIFE = 10; // s que dura un hilo
export const WEB_FADE = 3; // s finales en los que se desvanece
export const WEB_MAX_ANCHORS = 90;
export const WEB_COLOR = "255, 255, 255"; // seda blanca
export const WEB_SHADE = "22, 36, 29"; // sombra mínima (tinta de la paleta) para que el blanco se lea sobre el fondo claro

/* Telaraña atada a los .anchor-point (el nombre del hero): no caduca, se borra con Suprimir */
export const ANCHOR_SELECTOR = ".anchor-point";
export const ATTACH_REACH = 70; // px más allá del margen de las patas a los que aún suelta un hilo al ancla
export const ATTACH_STEP = 30; // px recorridos entre tanda y tanda de hilos sobre las letras
export const KEEP_MAX = 1400; // hilos permanentes como máximo (los más viejos se van)
export const FUZZ_RADIUS = 30; // px: solo teje sobre los bordes de letra que tiene justo debajo (por donde camina)
export const FUZZ_PER_STEP = 4; // hebras cortas de maraña por tanda
export const FUZZ_LEN = 46; // px: largo máximo de esas hebras

/* Dormir: ratón quieto en el hero */
// "wander": con el ratón quieto deja de perseguirlo y hace su propia ruta;
// "sleep": se duerme; "head": se convierte en la cabecita que parpadea
export const IDLE_STYLE: "sleep" | "head" | "wander" = "wander";
export const SLEEP_AFTER = 2000; // ms con el ratón quieto antes de dormirse / irse de paseo
export const EDGE_WRAP = 56; // px: con el cursor así de pegado a un lateral, sale por él y reaparece por el contrario
export const SLEEP_SPEED = 2.2; // lo rápido que se duerme / despierta

/* Cabecita */
export const HEAD_DELAY = 0.35; // s quieta antes de transformarse
export const HEAD_FADE_SPEED = 9; // velocidad del crossfade
export const HEAD_SIZE = 0.75; // tamaño relativo a la envergadura
