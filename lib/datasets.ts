export type DatasetName = "xor" | "spiral" | "circles" | "gaussians";

export const DATASET_NAMES: DatasetName[] = ["xor", "spiral", "circles", "gaussians"];

export function makeDataset(name: DatasetName, n = 200) {
    switch (name) {
        case "xor":
            return makeXOR(n);
        case "spiral":
            return makeSpiral(n);
        case "circles":
            return makeCircles(n);
        case "gaussians":
            return makeConcentricGaussians(n);
    }
}



export function makeXOR(n = 200, spread = 0.18) {
    // generate noisy clusters around the four XOR corners so the dataset
    // includes the canonical points and surrounding areas for learning
    const centers = [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
    ];
    const labels = [0, 1, 1, 0];
    const x: number[][] = [];
    const y: number[][] = [];

    function randn() {
        let u = 0,
            v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }

    const per = Math.floor(n / 4);
    for (let ci = 0; ci < centers.length; ci++) {
        for (let i = 0; i < per; i++) {
            const sx = centers[ci][0] + randn() * spread;
            const sy = centers[ci][1] + randn() * spread;
            x.push([sx, sy]);
            y.push([labels[ci]]);
        }
    }
    // add remainder samples
    let rem = n - x.length;
    while (rem > 0) {
        const ci = Math.floor(Math.random() * centers.length);
        const sx = centers[ci][0] + randn() * spread;
        const sy = centers[ci][1] + randn() * spread;
        x.push([sx, sy]);
        y.push([labels[ci]]);
        rem--;
    }

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

