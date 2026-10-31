"use client";

import { useRef, useState, useEffect } from "react";
import type { SignatureType } from "@/lib/types";

interface SignaturePadProps {
  defaultTypedName?: string;
  onCapture: (type: SignatureType, value: string) => void;
}

export function SignaturePad({ defaultTypedName = "", onCapture }: SignaturePadProps) {
  const [mode, setMode] = useState<SignatureType>("typed");
  const [typedName, setTypedName] = useState(defaultTypedName);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const hasInk = useRef(false);

  useEffect(() => {
    if (mode === "typed") {
      onCapture("typed", typedName.trim());
    } else if (!hasInk.current) {
      onCapture("drawn", "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, typedName]);

  function getCanvasContext(): CanvasRenderingContext2D | null {
    const canvas = canvasRef.current;
    return canvas ? canvas.getContext("2d") : null;
  }

  function pointerPos(canvas: HTMLCanvasElement, e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const ctx = getCanvasContext();
    if (!canvas || !ctx) return;
    drawing.current = true;
    const { x, y } = pointerPos(canvas, e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const ctx = getCanvasContext();
    if (!canvas || !ctx || !drawing.current) return;
    const { x, y } = pointerPos(canvas, e);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#111827";
    ctx.lineTo(x, y);
    ctx.stroke();
    hasInk.current = true;
  }

  function stopDrawing() {
    if (!drawing.current) return;
    drawing.current = false;
    const canvas = canvasRef.current;
    if (canvas && hasInk.current) {
      onCapture("drawn", canvas.toDataURL("image/png"));
    }
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const ctx = getCanvasContext();
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasInk.current = false;
    onCapture("drawn", "");
  }

  return (
    <div>
      <div className="mb-3 flex gap-2 text-sm">
        <button
          type="button"
          onClick={() => setMode("typed")}
          className={`rounded-full px-4 py-1.5 font-medium transition ${
            mode === "typed" ? "btn-primary" : "btn-glass text-slate-700 dark:text-slate-200"
          }`}
        >
          Type signature
        </button>
        <button
          type="button"
          onClick={() => setMode("drawn")}
          className={`rounded-full px-4 py-1.5 font-medium transition ${
            mode === "drawn" ? "btn-primary" : "btn-glass text-slate-700 dark:text-slate-200"
          }`}
        >
          Draw signature
        </button>
      </div>

      {mode === "typed" ? (
        <input
          type="text"
          value={typedName}
          onChange={(e) => setTypedName(e.target.value)}
          placeholder="Type your full name"
          className="glass-input w-full rounded-2xl px-4 py-3 font-signature text-2xl italic text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:text-white"
        />
      ) : (
        <div>
          <canvas
            ref={canvasRef}
            width={500}
            height={150}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={stopDrawing}
            onPointerLeave={stopDrawing}
            className="w-full touch-none rounded-2xl border border-white/70 bg-white/90 shadow-inner"
            style={{ height: 150 }}
          />
          <button
            type="button"
            onClick={clearCanvas}
            className="mt-2 text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
