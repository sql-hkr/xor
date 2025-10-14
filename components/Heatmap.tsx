"use client";
import React from "react";
import { valueToRampColor } from "./color";

type Props = { matrix: number[][] };

export default function Heatmap({ matrix }: Props) {
    const cols = matrix[0]?.length || 0;
    const flat = matrix.flat();
    const maxAbs = Math.max(...flat.map(Math.abs), 1e-6);
    // color ramp provided by components/color

    return (
        <div className="w-full overflow-auto">
            <div className="grid gap-0" style={{ gridTemplateColumns: `repeat(${cols}, 12px)` }}>
                {matrix.flatMap((row, r) =>
                    row.map((v, c) => {
                        const color = valueToRampColor(v, maxAbs);
                        return (
                            <div
                                key={`${r}-${c}`}
                                title={v.toFixed(4)}
                                style={{ width: 12, height: 12, background: color }}
                            />
                        );
                    })
                )}
            </div>
        </div>
    );
}
