export const BLUE = [96, 165, 250];
export const BLACK = [0, 0, 0];
export const ORANGE = [239, 68, 68];

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);

/**
 * p in [0,1] where 0 -> BLUE, 0.5 -> BLACK, 1 -> ORANGE
 */
export function rampColorFromP(p: number, alpha = 1) {
    p = clamp(p, 0, 1);
    let r = 0, g = 0, b = 0;
    if (p <= 0.5) {
        const t = p / 0.5;
        r = lerp(BLUE[0], BLACK[0], t);
        g = lerp(BLUE[1], BLACK[1], t);
        b = lerp(BLUE[2], BLACK[2], t);
    } else {
        const t = (p - 0.5) / 0.5;
        r = lerp(BLACK[0], ORANGE[0], t);
        g = lerp(BLACK[1], ORANGE[1], t);
        b = lerp(BLACK[2], ORANGE[2], t);
    }
    if (alpha === 1) return `rgb(${r}, ${g}, ${b})`;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Convert a signed value in [-maxAbs, maxAbs] to a color string.
 */
export function valueToRampColor(v: number, maxAbs: number, alpha = 1) {
    const pRaw = Math.max(-1, Math.min(1, v / (maxAbs || 1e-6)));
    const p = (pRaw + 1) / 2;
    return rampColorFromP(p, alpha);
}
