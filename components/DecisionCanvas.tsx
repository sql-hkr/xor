"use client";
import React, { useEffect, useRef } from "react";
import { rampColorFromP } from "./color";

type Dataset = { x: number[][]; y: number[][] };

export default function DecisionCanvas({
    predict,
    dataset,
    width = 360,
    height = 360,
    domain = [-2, 2, -2, 2] as number[],
    resolution = 200,
    tick = 0,
}: {
    predict: (x: number[]) => number[] | number;
    dataset: Dataset;
    width?: number;
    height?: number;
    domain?: number[]; // [xmin,xmax,ymin,ymax]
    resolution?: number;
    tick?: number | string | null;
}) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const [xmin, xmax, ymin, ymax] = domain;
        const cols = resolution;
        const rows = Math.round((resolution * height) / width);

        const img = ctx.createImageData(cols, rows);
        const data = img.data;

        for (let j = 0; j < rows; j++) {
            for (let i = 0; i < cols; i++) {
                const x = xmin + (i / (cols - 1)) * (xmax - xmin);
                const y = ymin + (j / (rows - 1)) * (ymax - ymin);
                let out = predict([x, y]);
                if (Array.isArray(out)) out = out[0];
                // normalize: if model outputs in [-1,1], map to [0,1]; otherwise just clamp
                let p = Number(out);
                if (p >= -1 && p <= 1) {
                    p = (p + 1) / 2;
                }
                p = Math.max(0, Math.min(1, p));

                const col = rampColorFromP(p, 1);
                // parse rgb/rgba
                const m = col.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/);
                if (m) {
                    const idx = (j * cols + i) * 4;
                    data[idx] = Number(m[1]);
                    data[idx + 1] = Number(m[2]);
                    data[idx + 2] = Number(m[3]);
                    data[idx + 3] = Math.round((Number(m[4] ?? "1") || 1) * 255 * 0.86);
                }
            }
        }

        // scale the small image to canvas size
        const tmp = document.createElement("canvas");
        tmp.width = cols;
        tmp.height = rows;
        const tctx = tmp.getContext("2d");
        if (!tctx) return;
        tctx.putImageData(img, 0, 0);
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(tmp, 0, 0, width, height);

        // overlay dataset points
        for (let i = 0; i < dataset.x.length; i++) {
            const px = dataset.x[i][0];
            const py = dataset.x[i][1];
            const label = dataset.y[i][0];
            const sx = ((px - xmin) / (xmax - xmin)) * width;
            const sy = ((py - ymin) / (ymax - ymin)) * height;
            ctx.beginPath();
            ctx.arc(sx, sy, 6, 0, Math.PI * 2);
            ctx.fillStyle = label ? "rgba(0,0,0,0.95)" : "rgba(0,0,0,0.95)";
            ctx.fill();
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = label ? "#ef4444" : "#60a5fa";
            ctx.stroke();
        }
    }, [predict, dataset, width, height, domain, resolution, tick]);

    return <canvas ref={canvasRef} className="w-full rounded border border-gray-800" />;
}
