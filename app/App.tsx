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
};

export default function XOR() {
    const [datasetName, setDatasetName] = useState<DatasetName>("xor");
    const dataset = useMemo(() => makeDataset(datasetName, 200), [datasetName]);

    const [opts, setOpts] = useState<NNOptions>(defaultOpts);
    const [nn] = useState(() => new SimpleNN(defaultOpts));
    const [state, setState] = useState<NNState | null>(null);
    const [running, setRunning] = useState(false);
    const [maxStepsPerSec, setMaxStepsPerSec] = useState(30);

    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        // initialize
        nn.reset(opts);
        setState(nn.getState(dataset));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Reset the network when the selected dataset changes
    useEffect(() => {
        nn.reset(opts);
        setState(nn.getState(dataset));
        // pause training when switching datasets
        setRunning(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dataset]);

    useEffect(() => {
        if (!running) return;
        let last = performance.now();
        const step = (t: number) => {
            const elapsed = t - last;
            const minMs = 1000 / maxStepsPerSec;
            if (elapsed >= minMs) {
                nn.trainStep(dataset);
                setState(nn.getState(dataset));
                last = t;
            }
            rafRef.current = requestAnimationFrame(step);
        };
        rafRef.current = requestAnimationFrame(step);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [running, maxStepsPerSec, dataset, nn]);

    function runOneStep() {
        nn.trainStep(dataset);
        setState(nn.getState(dataset));
    }

    function reset() {
        nn.reset(opts);
        setState(nn.getState(dataset));
    }

    function applyOptions(newOpts: Partial<NNOptions>) {
        const merged = { ...opts, ...newOpts } as NNOptions;
        setOpts(merged);
        nn.reset(merged);
        setState(nn.getState(dataset));
    }

    return (
        <div className="space-y-4">
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Neural Network Visualizer</h1>
                    <p className="text-sm text-gray-300">Interactive realtime training on XOR, spiral, and more.</p>
                </div>
                <div className="flex gap-2 items-center">
                    <label className="text-sm">Dataset</label>
                    <select
                        value={datasetName}
                        onChange={(e) => setDatasetName(e.target.value as DatasetName)}
                        className="bg-[#111111] border border-gray-700 text-gray-100 p-1 rounded"
                    >
                        {DATASET_NAMES.map((n) => (
                            <option key={n} value={n}>
                                {n.replace(/_/g, " ").replace(/\b\w/g, (s) => s.toUpperCase())}
                            </option>
                        ))}
                    </select>
                </div>
            </header>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="col-span-2 space-y-3">
                    <div className="bg-[#070707] p-3 rounded border border-gray-800">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            <NetworkVis state={state} onUpdate={() => setState(nn.getState(dataset))} />
                            <DecisionCanvas
                                predict={(xy) => nn.predict(xy)}
                                dataset={dataset}
                                width={420}
                                height={300}
                                domain={(() => {
                                    const xs = dataset.x.map((p) => p[0]);
                                    const ys = dataset.x.map((p) => p[1]);
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

                    <div className="bg-[#070707] p-3 rounded border border-gray-800">
                        <Loss state={state} />
                    </div>
                </div>

                <aside className="space-y-3">
                    <div className="bg-[#070707] p-3 rounded border border-gray-800">
                        <h3 className="font-semibold">Controls</h3>
                        <div className="mt-2 space-y-2">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setRunning((s) => !s)}
                                    className="px-3 py-1 bg-indigo-700 rounded disabled:opacity-60"
                                >
                                    {running ? "Pause" : "Run"}
                                </button>
                                <button onClick={runOneStep} className="px-3 py-1 bg-gray-700 rounded">
                                    Run One Step
                                </button>
                                <button onClick={reset} className="px-3 py-1 bg-red-700 rounded">
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
                                    className="w-full"
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
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <label className="text-sm">Batch size: {opts.batchSize}</label>
                                <input
                                    type="range"
                                    min={1}
                                    max={dataset.x.length}
                                    value={opts.batchSize}
                                    onChange={(e) => applyOptions({ batchSize: Number(e.target.value) })}
                                    className="w-full bg-[#111111] border border-gray-700 text-gray-100 p-1 rounded"
                                />
                            </div>

                            <div>
                                <label className="text-sm">Activation</label>
                                <select
                                    value={opts.activation}
                                    onChange={(e) => applyOptions({ activation: e.target.value as NNOptions["activation"] })}
                                    className="w-full bg-[#111111] border border-gray-700 text-gray-100 p-1 rounded"
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
                                    className="w-full bg-[#111111] border border-gray-700 text-gray-100 p-1 rounded"
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
                                            className="w-full bg-[#111111] border border-gray-700 text-gray-100 p-1 rounded"
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
                                            className="w-full bg-[#111111] border border-gray-700 text-gray-100 p-1 rounded"
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
                                            className="w-full bg-[#111111] border border-gray-700 text-gray-100 p-1 rounded"
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
                                    className="w-full bg-[#111111] border border-gray-700 text-gray-100 p-1 rounded"
                                />
                                <div className="text-xs text-gray-400">Example: 2,8,8,1</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#070707] p-3 rounded border border-gray-800">
                        <h3 className="font-semibold">Weights & Biases</h3>
                        <div className="mt-2 space-y-2">
                            {state?.params.map((m: number[][], i: number) => (
                                <div key={i}>
                                    <div className="text-sm">Layer {i}</div>
                                    <Heatmap matrix={m} />
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
