export type DatasetName = "xor" | "spiral" | "circles" | "gaussians";

export const DATASET_NAMES: DatasetName[] = ["xor", "spiral", "circles", "gaussians"];

export function makeDataset(name: DatasetName, n = 200) {
    switch (name) {
        case "xor":
            return makeXOR();
        case "spiral":
            return makeSpiral(n);
        case "circles":
            return makeCircles(n);
        case "gaussians":
            return makeConcentricGaussians(n);
    }
}

export function makeXOR() {
    const x = [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
    ];
    const y = [[0], [1], [1], [0]];
    return { x, y };
}

export function makeSpiral(n = 200) {
    const x: number[][] = [];
    const y: number[][] = [];
    for (let j = 0; j < 2; j++) {
        for (let i = 0; i < n / 2; i++) {
            const r = i / (n / 2) * 5;
            const t = 1.75 * i / (n / 2) * Math.PI + (j === 0 ? 0 : Math.PI);
            x.push([Math.sin(t) * r, Math.cos(t) * r]);
            y.push([j]);
        }
    }
    return { x, y };
}

export function makeCircles(n = 200) {
    const x: number[][] = [];
    const y: number[][] = [];
    for (let i = 0; i < n; i++) {
        const t = Math.random() * Math.PI * 2;
        const r = i < n / 2 ? 0.5 + Math.random() * 0.1 : 1.2 + Math.random() * 0.1;
        x.push([Math.cos(t) * r, Math.sin(t) * r]);
        y.push([i < n / 2 ? 0 : 1]);
    }
    return { x, y };
}

export function makeConcentricGaussians(n = 300) {
    const x: number[][] = [];
    const y: number[][] = [];
    const centers = [0.0, 0.8, 1.6];
    for (let i = 0; i < n; i++) {
        const ring = i % centers.length;
        const r = centers[ring] + (Math.random() - 0.5) * 0.2;
        const t = Math.random() * Math.PI * 2;
        x.push([Math.cos(t) * r, Math.sin(t) * r]);
        y.push([ring % 2]);
    }
    return { x, y };
}

