import { memo, useEffect, useRef } from "react";

/** Floating golden lanterns + purple flower petals for the Tangled theme. */
export const FallingTangledOverlay = memo(function FallingTangledOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    type Particle = {
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      opacity: number;
      opacitySpeed: number;
      type: "lantern" | "petal" | "sparkle";
      rotation: number;
      rotSpeed: number;
      hue: number;
    };

    const particles: Particle[] = [];
    const COUNT = 30;

    const rand = (min: number, max: number) => Math.random() * (max - min) + min;

    for (let i = 0; i < COUNT; i++) {
      const type = Math.random() < 0.35 ? "lantern" : Math.random() < 0.5 ? "petal" : "sparkle";
      particles.push({
        x: rand(0, window.innerWidth),
        y: rand(0, window.innerHeight),
        size: type === "lantern" ? rand(12, 22) : type === "petal" ? rand(5, 10) : rand(2, 5),
        speedY: type === "lantern" ? rand(-0.6, -0.2) : type === "petal" ? rand(-0.4, 0.1) : rand(-1, -0.3),
        speedX: rand(-0.3, 0.3),
        opacity: rand(0.3, 0.8),
        opacitySpeed: rand(0.002, 0.006) * (Math.random() < 0.5 ? 1 : -1),
        type,
        rotation: rand(0, Math.PI * 2),
        rotSpeed: rand(-0.01, 0.01),
        hue: type === "petal" ? rand(270, 310) : rand(42, 55),
      });
    }

    function drawLantern(ctx: CanvasRenderingContext2D, p: Particle) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.opacity;

      // Lantern body
      const w = p.size;
      const h = p.size * 1.4;
      const grad = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
      grad.addColorStop(0, `hsla(${p.hue}, 90%, 75%, 1)`);
      grad.addColorStop(0.5, `hsla(${p.hue}, 95%, 85%, 1)`);
      grad.addColorStop(1, `hsla(${p.hue}, 80%, 60%, 1)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, w * 0.3);
      ctx.fill();

      // Inner glow
      ctx.globalAlpha = p.opacity * 0.5;
      const innerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 0.5);
      innerGrad.addColorStop(0, "rgba(255,240,180,0.9)");
      innerGrad.addColorStop(1, "rgba(255,200,80,0)");
      ctx.fillStyle = innerGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, w * 0.4, h * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();

      // Outer halo
      ctx.globalAlpha = p.opacity * 0.18;
      const halo = ctx.createRadialGradient(0, 0, w * 0.4, 0, 0, w * 1.6);
      halo.addColorStop(0, `hsla(${p.hue}, 90%, 70%, 0.8)`);
      halo.addColorStop(1, "transparent");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.ellipse(0, 0, w * 1.6, w * 1.4, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    function drawPetal(ctx: CanvasRenderingContext2D, p: Particle) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.opacity;
      const s = p.size;
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, s);
      grad.addColorStop(0, `hsla(${p.hue}, 80%, 85%, 1)`);
      grad.addColorStop(1, `hsla(${p.hue}, 70%, 70%, 0.4)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.4, s * 0.45, s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawSparkle(ctx: CanvasRenderingContext2D, p: Particle) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = `hsla(${p.hue}, 90%, 80%, 1)`;
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(p.size * 0.3, p.size);
        ctx.lineTo(0, p.size * 0.6);
        ctx.lineTo(-p.size * 0.3, p.size);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    let raf: number;
    const c = canvas as HTMLCanvasElement;
    const g = ctx as CanvasRenderingContext2D;
    function animate() {
      g.clearRect(0, 0, c.width, c.height);
      for (const p of particles) {
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotSpeed;
        p.opacity += p.opacitySpeed;
        if (p.opacity > 0.85 || p.opacity < 0.1) p.opacitySpeed *= -1;
        if (p.y < -40) { p.y = c.height + 20; p.x = rand(0, c.width); }
        if (p.x < -40) p.x = c.width + 20;
        if (p.x > c.width + 40) p.x = -20;

        if (p.type === "lantern") drawLantern(g, p);
        else if (p.type === "petal") drawPetal(g, p);
        else drawSparkle(g, p);
      }
      raf = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[1]"
      aria-hidden
    />
  );
});
