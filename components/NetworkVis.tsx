"use client";
import React from "react";
import { rampColorFromP, valueToRampColor } from "./color";

type State = {
    layers: number[];
    activations?: number[][];
    params: number[][][]; // weights per layer [layer][out][in]
    bias?: number[][];
};

export default function NetworkVis({ state, onUpdate }: { state?: State | null; onUpdate?: () => void }) {
    if (!state) return <div className="text-sm text-gray-400">No state yet</div>;

    const width = 600;
    const height = 240;
    const marginX = 20;
    const marginY = 20;
    const innerWidth = Math.max(0, width - marginX * 2);
    const innerHeight = Math.max(0, height - marginY * 2);

    return (
        <div className="w-full overflow-auto">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-60">
                {state.layers.map((n, li) => {
                    const x = marginX + (li / Math.max(1, state.layers.length - 1)) * innerWidth;
                    return (
                        <g key={li}>
                            {Array.from({ length: n }).map((_, ni) => {
                                const y = marginY + (ni / Math.max(1, n - 1)) * innerHeight;
                                return <circle key={ni} cx={x} cy={y} r={8} fill="#111827" stroke="#4b5563" />;
                            })}
                        </g>
                    );
                })}
                {/* connections */}
                {state.params.map((wmat, li) => {
                    const fromCount = state.layers[li];
                    const toCount = state.layers[li + 1];
                    return (
                        <g key={`conn-${li}`}>
                            {wmat.map((row, to) =>
                                row.map((w, from) => {
                                    const x1 = marginX + (li / Math.max(1, state.layers.length - 1)) * innerWidth;
                                    const x2 = marginX + ((li + 1) / Math.max(1, state.layers.length - 1)) * innerWidth;
                                    const y1 = marginY + (from / Math.max(1, fromCount - 1)) * innerHeight;
                                    const y2 = marginY + (to / Math.max(1, toCount - 1)) * innerHeight;
                                    const intensity = Math.min(1, Math.abs(w) / 2);
                                    const p = w >= 0 ? 0.5 + intensity * 0.5 : 0.5 - intensity * 0.5; // map sign+magnitude to p
                                    const color = rampColorFromP(p, intensity);
                                    return <line key={`${li}-${from}-${to}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={Math.max(0.5, intensity * 2)} />;
                                })
                            )}
                            {/* bias markers near destination layer neurons (drawn per connection group once) */}
                            {state.bias && state.bias[li] && state.bias[li].map((b: number, to: number) => {
                                const x2 = marginX + ((li + 1) / Math.max(1, state.layers.length - 1)) * innerWidth;
                                const y2 = marginY + (to / Math.max(1, toCount - 1)) * innerHeight;
                                const bx = x2 + 10;
                                const by = y2 - 6;
                                const color = valueToRampColor(b, 1, 1);
                                return (
                                    <g key={`bias-vis-${li}-${to}`}>
                                        <rect x={bx} y={by} width={8} height={12} rx={2} ry={2} fill={color} stroke="#222" />
                                        <title>{b.toFixed(4)}</title>
                                    </g>
                                );
                            })}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}
