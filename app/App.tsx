"use client";
import React, { useEffect, useMemo, useState, useRef } from "react";
import { makeDataset, DatasetName, DATASET_NAMES } from "../lib/datasets";
import { SimpleNN, NNOptions, NNState } from "../lib/nn";
import Heatmap from "../components/Heatmap";
import Loss from "../components/Loss";
import NetworkVis from "../components/NetworkVis";
import DecisionCanvas from "../components/DecisionCanvas";

const defaultOpts: NNOptions = {
    layers: [2, 8, 8, 1],
    activation: "tanh",
    learningRate: 0.1,
    batchSize: 4,
    optimizer: "adam",
};

export default function XOR() {
    const [datasetName, setDatasetName] = useState<DatasetName>("xor");
    // create dataset and split into train/test (80/20)
    const { fullDataset, trainDataset, testDataset } = useMemo(() => {
        const full = makeDataset(datasetName, 200);
        const n = full.x.length;
        const idx = Array.from({ length: n }, (_, i) => i).sort(() => Math.random() - 0.5);
        const split = Math.max(1, Math.floor(n * 0.8));
        const trainIdx = idx.slice(0, split);
        const testIdx = idx.slice(split);
        const tX = trainIdx.map((i) => full.x[i]);
        const tY = trainIdx.map((i) => full.y[i]);
        const vX = testIdx.map((i) => full.x[i]);
        const vY = testIdx.map((i) => full.y[i]);
        return { fullDataset: full, trainDataset: { x: tX, y: tY }, testDataset: { x: vX, y: vY } };
    }, [datasetName]);

    const [opts, setOpts] = useState<NNOptions>(defaultOpts);
    const [nn] = useState(() => new SimpleNN(defaultOpts));
    const [state, setState] = useState<NNState | null>(null);
    const [running, setRunning] = useState(false);
    const [maxStepsPerSec, setMaxStepsPerSec] = useState(30);

    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        // initialize
        nn.reset(opts);
        setState(nn.getState(testDataset));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Reset the network when the selected dataset changes
    useEffect(() => {
        // set batch size to dataset max and reset network
        const merged = { ...opts, batchSize: trainDataset.x.length } as NNOptions;
        setOpts(merged);
        nn.reset(merged);
        setState(nn.getState(testDataset));
        // pause training when switching datasets
        setRunning(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trainDataset, testDataset]);

    useEffect(() => {
        if (!running) return;
        let last = performance.now();
        const step = (t: number) => {
            const elapsed = t - last;
            const minMs = 1000 / maxStepsPerSec;
            if (elapsed >= minMs) {
                nn.trainStep(trainDataset, testDataset);
                setState(nn.getState(testDataset));
                last = t;
            }
            rafRef.current = requestAnimationFrame(step);
        };
        rafRef.current = requestAnimationFrame(step);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [running, maxStepsPerSec, trainDataset, testDataset, nn]);

    function runOneStep() {
        nn.trainStep(trainDataset, testDataset);
        setState(nn.getState(testDataset));
    }

    function reset() {
        nn.reset(opts);
        setState(nn.getState(testDataset));
    }

    function applyOptions(newOpts: Partial<NNOptions>) {
        const merged = { ...opts, ...newOpts } as NNOptions;
        setOpts(merged);
        nn.reset(merged);
        setState(nn.getState(testDataset));
    }

    return (
        <div className="min-h-screen p-6 space-y-6 bg-gradient-to-br from-[#050509] via-[#07070a] to-[#040406]">
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-indigo-900/20 via-transparent to-transparent p-6 rounded-2xl shadow-xl border border-gray-800">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Neural Network Visualizer</h1>
                    <p className="text-sm text-gray-300 mt-1">Interactive realtime training on XOR, spiral, and more.</p>
                    <div className="text-sm text-gray-400 mt-3 max-w-xl">
                        Usage: select a dataset, click <span className="px-2 py-0.5 bg-indigo-700 rounded text-white text-xs">Run</span> to train continuously or <span className="px-2 py-0.5 bg-gray-700 rounded text-white text-xs">Run One Step</span> to step manually. Inspect the Network, Decision Canvas and Loss panels to explore weights, biases, decision boundary and performance.
                    </div>
                </div>
                <div className="flex gap-2 items-center">
                    <label className="text-sm">Dataset</label>
                    <select
                        value={datasetName}
                        onChange={(e) => setDatasetName(e.target.value as DatasetName)}
                        className="bg-[#0f1113] border border-gray-700 text-gray-100 p-2 rounded-md transition duration-150 hover:border-gray-600"
                    >
                        {DATASET_NAMES.map((n) => (
                            <option key={n} value={n}>
                                {n.replace(/_/g, " ").replace(/\b\w/g, (s) => s.toUpperCase())}
                            </option>
                        ))}
                    </select>
                </div>
            </header>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="col-span-2 space-y-4">
                    <div className="bg-gradient-to-b from-[#071018] to-[#06060a] p-4 rounded-2xl shadow-md border border-gray-800">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <NetworkVis state={state} onUpdate={() => setState(nn.getState(testDataset))} />
                            <DecisionCanvas
                                predict={(xy) => nn.predict(xy)}
                                dataset={fullDataset}
                                width={420}
                                height={300}
                                domain={(() => {
                                    const xs = fullDataset.x.map((p) => p[0]);
                                    const ys = fullDataset.x.map((p) => p[1]);
                                    const xmin = Math.min(...xs);
                                    const xmax = Math.max(...xs);
                                    const ymin = Math.min(...ys);
                                    const ymax = Math.max(...ys);
                                    const padX = (xmax - xmin || 1) * 0.5;
                                    const padY = (ymax - ymin || 1) * 0.5;
                                    return [xmin - padX, xmax + padX, ymin - padY, ymax + padY];
                                })()}
                                resolution={200}
                                tick={state?.lossHistory.length ?? 0}
                            />
                        </div>
                    </div>

                    <div className="bg-gradient-to-b from-[#071018] to-[#06060a] p-4 rounded-2xl shadow-md border border-gray-800">
                        <Loss state={state} />
                    </div>
                </div>

                <aside className="space-y-4">
                    <div className="bg-gradient-to-b from-[#071018] to-[#06060a] p-4 rounded-2xl shadow-md border border-gray-800">
                        <h3 className="font-semibold">Controls</h3>
                        <div className="mt-3 space-y-3">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setRunning((s) => !s)}
                                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 rounded-md text-white shadow-sm transition"
                                >
                                    {running ? "Pause" : "Run"}
                                </button>
                                <button onClick={runOneStep} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-md text-white transition shadow-sm">
                                    Run One Step
                                </button>
                                <button onClick={reset} className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded-md text-white transition shadow-sm">
                                    Reset
                                </button>
                            </div>

                            <div>
                                <label className="text-sm">Max steps / sec: {maxStepsPerSec}</label>
                                <input
                                    type="range"
                                    min={1}
                                    max={120}
                                    value={maxStepsPerSec}
                                    onChange={(e) => setMaxStepsPerSec(Number(e.target.value))}
                                    className="w-full accent-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="text-sm">Learning rate: {opts.learningRate.toFixed(4)}</label>
                                <input
                                    type="range"
                                    min={0.0001}
                                    max={1}
                                    step={0.0001}
                                    value={opts.learningRate}
                                    onChange={(e) => applyOptions({ learningRate: Number(e.target.value) })}
                                    className="w-full accent-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="text-sm">Batch size: {opts.batchSize}</label>
                                <input
                                    type="range"
                                    min={1}
                                    max={trainDataset.x.length}
                                    value={opts.batchSize}
                                    onChange={(e) => applyOptions({ batchSize: Number(e.target.value) })}
                                    className="w-full accent-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="text-sm">Activation</label>
                                <select
                                    value={opts.activation}
                                    onChange={(e) => applyOptions({ activation: e.target.value as NNOptions["activation"] })}
                                    className="w-full bg-[#0f1113] border border-gray-700 text-gray-100 p-2 rounded-md transition"
                                >
                                    <option value="tanh">tanh</option>
                                    <option value="relu">relu</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-sm">Optimizer</label>
                                <select
                                    value={opts.optimizer ?? "sgd"}
                                    onChange={(e) => applyOptions({ optimizer: e.target.value as NNOptions["optimizer"] })}
                                    className="w-full bg-[#0f1113] border border-gray-700 text-gray-100 p-2 rounded-md transition"
                                >
                                    <option value="sgd">SGD</option>
                                    <option value="adam">Adam</option>
                                </select>
                            </div>

                            {opts.optimizer === "adam" && (
                                <div className="space-y-2">
                                    <div>
                                        <label className="text-sm">Beta1</label>
                                        <input
                                            type="number"
                                            step={0.001}
                                            min={0}
                                            max={0.999}
                                            value={opts.beta1 ?? 0.9}
                                            onChange={(e) => applyOptions({ beta1: Number(e.target.value) })}
                                            className="w-full bg-[#0f1113] border border-gray-700 text-gray-100 p-2 rounded-md"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm">Beta2</label>
                                        <input
                                            type="number"
                                            step={0.0001}
                                            min={0}
                                            max={0.9999}
                                            value={opts.beta2 ?? 0.999}
                                            onChange={(e) => applyOptions({ beta2: Number(e.target.value) })}
                                            className="w-full bg-[#0f1113] border border-gray-700 text-gray-100 p-2 rounded-md"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm">Eps</label>
                                        <input
                                            type="number"
                                            step={1e-8}
                                            min={1e-12}
                                            value={opts.eps ?? 1e-8}
                                            onChange={(e) => applyOptions({ eps: Number(e.target.value) })}
                                            className="w-full bg-[#0f1113] border border-gray-700 text-gray-100 p-2 rounded-md"
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="text-sm">Network size (comma separated)</label>
                                <input
                                    type="text"
                                    defaultValue={opts.layers.join(",")}
                                    onBlur={(e) => {
                                        const arr = e.target.value.split(",").map((s) => Number(s.trim())).filter(Boolean);
                                        if (arr.length >= 2) applyOptions({ layers: arr });
                                    }}
                                    className="w-full bg-[#0f1113] border border-gray-700 text-gray-100 p-2 rounded-md"
                                />
                                <div className="text-xs text-gray-400">Example: 2,8,8,1</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-b from-[#071018] to-[#06060a] p-4 rounded-2xl shadow-md border border-gray-800">
                        <h3 className="font-semibold">Weights & Biases</h3>
                        <div className="mt-3 space-y-3">
                            {state?.params.map((m: number[][], i: number) => (
                                <div key={i}>
                                    <div className="text-sm">Layer {i}</div>
                                    <div className="flex gap-2 items-start">
                                        <div className="flex-1">
                                            <div className="text-xs text-gray-400">Weights</div>
                                            <Heatmap matrix={m} />
                                        </div>
                                        {state?.bias && state.bias[i] && (
                                            <div className="w-12">
                                                <div className="text-xs text-gray-400">Biases</div>
                                                <Heatmap matrix={state.bias[i].map((v) => [v])} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>
            </section>

            <footer className="flex items-center justify-center text-xs text-gray-500 mt-4">
                <div className="flex items-center gap-2">
                    <span>© {new Date().getFullYear()} sql-hkr. All Rights Reserved.</span>
                    <a href="https://github.com/sql-hkr" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-gray-300 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-gray-300">
                            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.726-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.757-1.333-1.757-1.089-.744.084-.729.084-.729 1.205.084 1.84 1.236 1.84 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.418-1.305.762-1.605-2.665-.305-5.466-1.334-5.466-5.93 0-1.31.47-2.381 1.235-3.221-.123-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.119 3.176.77.84 1.233 1.911 1.233 3.221 0 4.61-2.807 5.624-5.479 5.921.43.372.815 1.102.815 2.222 0 1.605-.015 2.898-.015 3.293 0 .319.216.694.825.576C20.565 22.092 24 17.592 24 12.297 24 5.67 18.627.297 12 .297z" />
                        </svg>
                        <span className="sr-only">GitHub</span>
                        <span className="hidden sm:inline">sql-hkr</span>
                    </a>
                </div>
            </footer>
        </div>
    );
}
