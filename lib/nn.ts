export type NNOptions = {
    layers: number[];
    activation: "tanh" | "relu";
    learningRate: number;
    batchSize: number;
    optimizer?: "sgd" | "adam";
    beta1?: number; // for adam
    beta2?: number; // for adam
    eps?: number; // for adam
};

export type NNState = {
    layers: number[];
    activations: number[][];
    params: number[][][]; // weights [layer][out][in]
    lossHistory: number[];
    stepHistory: number[];
    testLoss?: number;
    testAcc?: number;
};

function randn() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function zeros(rows: number, cols: number) {
    return Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));
}

export class SimpleNN {
    opts: NNOptions;
    params: number[][][] = [];
    bias: number[][] = [];
    lossHistory: number[] = [];
    stepHistory: number[] = [];
    // Adam state
    adam_m: number[][][] = [];
    adam_v: number[][][] = [];
    adam_mbias: number[][] = [];
    adam_vbias: number[][] = [];
    stepCounter = 0;

    constructor(opts: NNOptions) {
        this.opts = opts;
        this.reset(opts);
    }

    reset(opts: NNOptions) {
        this.opts = opts;
        this.params = [];
        this.bias = [];
        this.adam_m = [];
        this.adam_v = [];
        this.adam_mbias = [];
        this.adam_vbias = [];
        this.stepCounter = 0;
        for (let l = 0; l < opts.layers.length - 1; l++) {
            const inN = opts.layers[l];
            const outN = opts.layers[l + 1];
            const w = zeros(outN, inN).map((row) => row.map(() => randn() * Math.sqrt(2 / inN)));
            const b = Array.from({ length: outN }, () => 0);
            this.params.push(w);
            this.bias.push(b);
            this.adam_m.push(zeros(outN, inN));
            this.adam_v.push(zeros(outN, inN));
            this.adam_mbias.push(Array.from({ length: outN }, () => 0));
            this.adam_vbias.push(Array.from({ length: outN }, () => 0));
        }
        this.lossHistory = [];
        this.stepHistory = [];
    }

    activate(x: number, fn: string) {
        if (fn === "tanh") return Math.tanh(x);
        if (fn === "relu") return Math.max(0, x);
        // default to tanh if unknown
        return Math.tanh(x);
    }

    activateDeriv(y: number, fn: string) {
        if (fn === "tanh") return 1 - y * y;
        if (fn === "relu") return y > 0 ? 1 : 0;
        // default to tanh derivative
        return 1 - y * y;
    }

    forward(x: number[]) {
        const acts: number[][] = [x];
        let cur = x;
        for (let l = 0; l < this.params.length; l++) {
            const w = this.params[l];
            const b = this.bias[l];
            const out = w.map((row, i) => {
                const s = row.reduce((acc, wi, j) => acc + wi * cur[j], b[i]);
                const a = this.activate(s, this.opts.activation);
                return a;
            });
            acts.push(out);
            cur = out;
        }
        return acts;
    }

    predict(x: number[]) {
        const acts = this.forward(x);
        const out = acts[acts.length - 1];
        return out;
    }

    trainStep(dataset: { x: number[][]; y: number[][] }) {
        const { x, y } = dataset;
        const bs = Math.min(this.opts.batchSize, x.length);
        const idx = Array.from({ length: x.length }, (_, i) => i).sort(() => Math.random() - 0.5).slice(0, bs);

        // accumulate gradients over batch
        const L = this.params.length;
        const gradW = this.params.map((mat) => zeros(mat.length, mat[0].length));
        const gradB = this.bias.map((b) => Array.from({ length: b.length }, () => 0));
        let totalLoss = 0;

        for (const ii of idx) {
            const xi = x[ii];
            const yi = y[ii];
            const acts = this.forward(xi);
            const out = acts[acts.length - 1];
            const deltas: number[][] = Array.from({ length: L }, () => []);
            const loss = out.reduce((acc, o, k) => acc + 0.5 * (o - yi[k]) ** 2, 0);
            totalLoss += loss;

            const last = L - 1;
            deltas[last] = Array.from({ length: this.params[last].length }, (_, j) => {
                const a = acts[last + 1][j];
                const err = a - yi[j];
                return err * this.activateDeriv(a, this.opts.activation);
            });

            for (let l = L - 2; l >= 0; l--) {
                const outN = this.params[l].length;
                const curA = acts[l + 1];
                deltas[l] = Array.from({ length: outN }, (_, j) => {
                    let s = 0;
                    for (let k = 0; k < this.params[l + 1].length; k++) {
                        s += this.params[l + 1][k][j] * deltas[l + 1][k];
                    }
                    return s * this.activateDeriv(curA[j], this.opts.activation);
                });
            }

            // accumulate grads
            for (let l = 0; l < L; l++) {
                const prev = acts[l];
                for (let j = 0; j < this.params[l].length; j++) {
                    for (let k = 0; k < this.params[l][j].length; k++) {
                        gradW[l][j][k] += deltas[l][j] * prev[k];
                    }
                    gradB[l][j] += deltas[l][j];
                }
            }
        }

        // average gradients
        for (let l = 0; l < L; l++) {
            for (let j = 0; j < gradW[l].length; j++) {
                for (let k = 0; k < gradW[l][j].length; k++) {
                    gradW[l][j][k] /= bs;
                }
                gradB[l][j] /= bs;
            }
        }

        // apply optimizer
        const opt = this.opts.optimizer || "sgd";
        const lr = this.opts.learningRate;
        if (opt === "sgd") {
            for (let l = 0; l < L; l++) {
                for (let j = 0; j < this.params[l].length; j++) {
                    for (let k = 0; k < this.params[l][j].length; k++) {
                        this.params[l][j][k] -= lr * gradW[l][j][k];
                    }
                    this.bias[l][j] -= lr * gradB[l][j];
                }
            }
        } else if (opt === "adam") {
            const b1 = this.opts.beta1 ?? 0.9;
            const b2 = this.opts.beta2 ?? 0.999;
            const eps = this.opts.eps ?? 1e-8;
            const t = this.stepCounter + 1;
            for (let l = 0; l < L; l++) {
                for (let j = 0; j < this.params[l].length; j++) {
                    for (let k = 0; k < this.params[l][j].length; k++) {
                        const g = gradW[l][j][k];
                        this.adam_m[l][j][k] = b1 * this.adam_m[l][j][k] + (1 - b1) * g;
                        this.adam_v[l][j][k] = b2 * this.adam_v[l][j][k] + (1 - b2) * g * g;
                        const mhat = this.adam_m[l][j][k] / (1 - Math.pow(b1, t));
                        const vhat = this.adam_v[l][j][k] / (1 - Math.pow(b2, t));
                        this.params[l][j][k] -= lr * (mhat / (Math.sqrt(vhat) + eps));
                    }
                    const gb = gradB[l][j];
                    this.adam_mbias[l][j] = b1 * this.adam_mbias[l][j] + (1 - b1) * gb;
                    this.adam_vbias[l][j] = b2 * this.adam_vbias[l][j] + (1 - b2) * gb * gb;
                    const mhatb = this.adam_mbias[l][j] / (1 - Math.pow(b1, t));
                    const vhatb = this.adam_vbias[l][j] / (1 - Math.pow(b2, t));
                    this.bias[l][j] -= lr * (mhatb / (Math.sqrt(vhatb) + eps));
                }
            }
            this.stepCounter = t;
        }

        const avgLoss = totalLoss / bs;
        this.lossHistory.push(avgLoss);
        this.stepHistory.push((this.stepHistory[this.stepHistory.length - 1] || 0) + 1);
    }

    getState(dataset?: { x: number[][]; y: number[][] } | null): NNState {
        const activations = dataset && dataset.x.length ? dataset.x.slice(0, 5).map((xi) => this.forward(xi).flat()) : [];
        const testLoss = dataset ? this.evaluate(dataset) : undefined;
        const testAcc = dataset ? this.evaluateAcc(dataset) : undefined;
        return {
            layers: this.opts.layers,
            activations: activations,
            params: this.params,
            lossHistory: this.lossHistory,
            stepHistory: this.stepHistory,
            testLoss,
            testAcc,
        };
    }

    evaluate(dataset: { x: number[][]; y: number[][] }) {
        let s = 0;
        for (let i = 0; i < dataset.x.length; i++) {
            const out = this.predict(dataset.x[i]);
            for (let j = 0; j < out.length; j++) s += 0.5 * (out[j] - dataset.y[i][j]) ** 2;
        }
        return s / dataset.x.length;
    }

    evaluateAcc(dataset: { x: number[][]; y: number[][] }) {
        let ok = 0;
        for (let i = 0; i < dataset.x.length; i++) {
            const out = this.predict(dataset.x[i]);
            const cls = out[0] > 0.5 ? 1 : 0;
            if (cls === dataset.y[i][0]) ok++;
        }
        return ok / dataset.x.length;
    }
}
