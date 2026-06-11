import { useEffect, useRef } from "react";

type HeatmapPoint = { x: number; y: number; intensity: number; radius: number };

interface HeatmapCanvasProps {
  imageFile: File | null;
  points: HeatmapPoint[];
  verdict: string;
  className?: string;
}

export function HeatmapCanvas({ imageFile, points, verdict, className = "" }: HeatmapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !imageFile || points.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    const url = URL.createObjectURL(imageFile);

    img.onload = () => {
      const W = 400;
      const H = Math.round((img.naturalHeight / img.naturalWidth) * W);
      canvas.width = W;
      canvas.height = H;

      // Draw the original image
      ctx.drawImage(img, 0, 0, W, H);

      // Build heatmap on an offscreen canvas
      const heatCanvas = document.createElement("canvas");
      heatCanvas.width = W;
      heatCanvas.height = H;
      const hCtx = heatCanvas.getContext("2d")!;

      // Darken the base image slightly so the heatmap pops
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(0, 0, W, H);

      // Draw radial gradients for each attention point
      for (const pt of points) {
        const cx = pt.x * W;
        const cy = pt.y * H;
        const r = pt.radius * W;

        const grad = hCtx.createRadialGradient(cx, cy, 0, cx, cy, r);

        if (verdict === "fake") {
          // Red-orange for fake — danger
          grad.addColorStop(0, `rgba(255, 30, 30, ${pt.intensity * 0.9})`);
          grad.addColorStop(0.4, `rgba(255, 120, 0, ${pt.intensity * 0.55})`);
          grad.addColorStop(1, `rgba(255, 220, 0, 0)`);
        } else if (verdict === "uncertain") {
          // Yellow-amber for uncertain
          grad.addColorStop(0, `rgba(255, 200, 0, ${pt.intensity * 0.85})`);
          grad.addColorStop(0.5, `rgba(200, 100, 0, ${pt.intensity * 0.4})`);
          grad.addColorStop(1, `rgba(180, 50, 0, 0)`);
        } else {
          // Cool cyan-blue for real — safe
          grad.addColorStop(0, `rgba(20, 184, 166, ${pt.intensity * 0.7})`);
          grad.addColorStop(0.5, `rgba(56, 189, 248, ${pt.intensity * 0.35})`);
          grad.addColorStop(1, `rgba(99, 102, 241, 0)`);
        }

        hCtx.fillStyle = grad;
        hCtx.fillRect(cx - r, cy - r, r * 2, r * 2);
      }

      // Composite the heatmap onto the main canvas
      ctx.globalCompositeOperation = "screen";
      ctx.drawImage(heatCanvas, 0, 0);
      ctx.globalCompositeOperation = "source-over";

      // Subtle scanline overlay for the forensic aesthetic
      ctx.globalAlpha = 0.04;
      for (let y = 0; y < H; y += 3) {
        ctx.fillStyle = "rgba(0,0,0,1)";
        ctx.fillRect(0, y, W, 1);
      }
      ctx.globalAlpha = 1;

      URL.revokeObjectURL(url);
    };

    img.src = url;
  }, [imageFile, points, verdict]);

  if (!imageFile) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`rounded-lg w-full object-contain ${className}`}
    />
  );
}
