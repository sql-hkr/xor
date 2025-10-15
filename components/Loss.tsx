"use client";
import React from "react";

type State = {
    stepHistory: number[];
    lossHistory: number[];
    testLossHistory?: number[];
    testAccHistory?: number[];
    testLoss?: number;
    testAcc?: number;
};

export default function Loss({ state }: { state?: State | null }) {
    const width = 600;
    const height = 120;
    const train = state?.lossHistory || [];
    const test = state?.testLossHistory || [];
    const acc = state?.testAccHistory || [];
    const max = Math.max(...train, ...test, 1e-6);

    const trainPoints = train.map((d, i) => `${(i / Math.max(1, train.length - 1)) * width},${height - (d / max) * height}`);
    const testPoints = test.map((d, i) => `${(i / Math.max(1, test.length - 1)) * width},${height - (d / max) * height}`);

    return (
        <div>
            <h3 className="font-semibold">Loss</h3>
            <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
                <div className="inline-flex items-center gap-2">
                    <span style={{ width: 12, height: 8, background: "#60a5fa", display: "inline-block", borderRadius: 2 }} />
                    <span>Train</span>
                </div>
                <div className="inline-flex items-center gap-2">
                    <span style={{ width: 12, height: 8, background: "#f97316", display: "inline-block", borderRadius: 2 }} />
                    <span>Test</span>
                </div>
                <div className="ml-auto text-xs text-gray-400">Test acc: {((state?.testAcc ?? 0) * 100).toFixed(1)}%</div>
            </div>
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-58 bg-[#050505] mt-2 rounded">
                <polyline>
                    <title>Training loss</title>
                </polyline>
                <polyline fill="none" stroke="#60a5fa" strokeWidth={2} points={trainPoints.join(" ")} />
                {test.length > 0 && (
                    <polyline fill="none" stroke="#f97316" strokeWidth={2} strokeDasharray="6 4" points={testPoints.join(" ")}>
                        <title>Test loss</title>
                    </polyline>
                )}
            </svg>
            <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
                <div>Final train loss: {train[train.length - 1]?.toFixed?.(4) ?? "-"}</div>
                <div>Final test loss: {test[test.length - 1]?.toFixed?.(4) ?? state?.testLoss?.toFixed?.(4) ?? "-"}</div>
            </div>
            <div className="mt-3">
                <h3 className="font-semibold">Test Accuracy</h3>
                <svg viewBox={`0 0 ${width} ${height / 2}`} className="w-full h-28 bg-[#050505] mt-2 rounded">
                    {acc.length > 0 && (
                        <polyline fill="none" stroke="#10b981" strokeWidth={2} points={acc.map((a, i) => `${(i / Math.max(1, acc.length - 1)) * width},${(height / 2) - (a * 100) / 100 * (height / 2)}`).join(" ")} />
                    )}
                </svg>
                <div className="text-xs text-gray-400 mt-2">Latest test acc: {((state?.testAcc ?? 0) * 100).toFixed(1)}%</div>
            </div>
        </div>
    );
}
