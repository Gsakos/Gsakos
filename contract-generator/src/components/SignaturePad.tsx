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
          className={`rounded-md px-3 py-1.5 font-medium ${
            mode === "typed" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
          }`}
        >
          Type signature
        </button>
        <button
          type="button"
          onClick={() => setMode("drawn")}
          className={`rounded-md px-3 py-1.5 font-medium ${
            mode === "drawn" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
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
          className="w-full rounded-md border border-slate-300 px-3 py-3 font-signature text-2xl italic focus:outline-none focus:ring-2 focus:ring-slate-400"
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
            className="w-full touch-none rounded-md border border-slate-300 bg-white"
            style={{ height: 150 }}
          />
          <button
            type="button"
            onClick={clearCanvas}
            className="mt-2 text-sm font-medium text-slate-500 hover:text-slate-800"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
