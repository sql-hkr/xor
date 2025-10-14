"use client";
import React from "react";

type State = {
    stepHistory: number[];
    lossHistory: number[];
    testLoss?: number;
    testAcc?: number;
};

export default function Loss({ state }: { state?: State | null }) {
    const width = 600;
    const height = 120;
    const data = state?.lossHistory || [];
    const max = Math.max(...data, 1e-6);

    const points = data.map((d, i) => `${(i / Math.max(1, data.length - 1)) * width},${height - (d / max) * height}`);

    return (
        <div>
            <h3 className="font-semibold">Training Loss</h3>
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-58 bg-[#050505] mt-2 rounded">
                <polyline fill="none" stroke="#60a5fa" strokeWidth={2} points={points.join(" ")} />
            </svg>
            <div className="text-xs text-gray-400 mt-2">Test Loss: {state?.testLoss?.toFixed?.(4) ?? "-"} | Test Acc: {((state?.testAcc ?? 0) * 100).toFixed(1)}%</div>
        </div>
    );
}
