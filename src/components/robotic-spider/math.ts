// Constantes y funciones matemáticas pequeñas, sin dependencias.

export const TAU = Math.PI * 2, DEG = Math.PI / 180;

export const angleDiff = (a: number, b: number) => ((((b - a + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
export const lerpAngle = (a: number, b: number, t: number) => a + angleDiff(a, b) * t;
export const damp = (speed: number, dt: number) => 1 - Math.exp(-speed * dt);
export const ease = (t: number) => t * t * (3 - 2 * t);
export const easeOutBack = (t: number) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);
