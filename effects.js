// ============================================================
// ルーレット - effects.js
// 演出エフェクト (紙吹雪 / 花火 / 爆発 / スポットライト / シンプル)
// ============================================================

const Effects = {
    _animId: null,
    _canvas: null,
    _ctx: null,

    init(canvas) {
        this._canvas = canvas;
        this._ctx = canvas.getContext('2d');
        this._resize();
        window.addEventListener('resize', () => this._resize());
    },

    _resize() {
        if (!this._canvas) return;
        this._canvas.width = window.innerWidth;
        this._canvas.height = window.innerHeight;
    },

    stop() {
        if (this._animId) cancelAnimationFrame(this._animId);
        this._animId = null;
        if (this._ctx) this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    },

    play(type, duration = 3000) {
        this.stop();
        this._resize();
        const start = performance.now();
        const fn = this[`_${type}`];
        if (!fn) return;

        const particles = fn.call(this);
        const animate = (now) => {
            const elapsed = now - start;
            if (elapsed > duration) { this.stop(); return; }
            this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
            particles.forEach(p => p.update(elapsed, this._ctx, this._canvas));
            this._animId = requestAnimationFrame(animate);
        };
        this._animId = requestAnimationFrame(animate);
    },

    // ---- 紙吹雪 ----
    _confetti() {
        const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6bcb', '#ff9f43', '#a55eea'];
        const W = this._canvas.width, H = this._canvas.height;
        return Array.from({ length: 200 }, () => {
            const x = Math.random() * W;
            const y = Math.random() * H - H;
            const size = Math.random() * 8 + 4;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const speed = Math.random() * 3 + 2;
            const wobble = Math.random() * 10;
            const rotation = Math.random() * 360;
            const rotSpeed = (Math.random() - 0.5) * 8;
            return {
                update(elapsed, ctx) {
                    const progress = elapsed / 3000;
                    const cy = y + speed * elapsed * 0.15;
                    const cx = x + Math.sin(elapsed * 0.003 + wobble) * 30;
                    const rot = rotation + rotSpeed * elapsed * 0.05;
                    ctx.save();
                    ctx.translate(cx, cy);
                    ctx.rotate(rot * Math.PI / 180);
                    ctx.globalAlpha = Math.max(0, 1 - progress * 0.5);
                    ctx.fillStyle = color;
                    ctx.fillRect(-size / 2, -size / 4, size, size / 2);
                    ctx.restore();
                }
            };
        });
    },

    // ---- 花火 ----
    _firework() {
        const W = this._canvas.width, H = this._canvas.height;
        const bursts = [
            { cx: W * 0.3, cy: H * 0.3, delay: 0 },
            { cx: W * 0.7, cy: H * 0.25, delay: 300 },
            { cx: W * 0.5, cy: H * 0.4, delay: 600 },
        ];
        const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6bcb', '#a55eea'];
        const particles = [];
        bursts.forEach(b => {
            for (let i = 0; i < 80; i++) {
                const angle = (Math.PI * 2 * i) / 80 + Math.random() * 0.3;
                const speed = Math.random() * 4 + 2;
                const color = colors[Math.floor(Math.random() * colors.length)];
                const size = Math.random() * 3 + 1.5;
                particles.push({
                    update(elapsed, ctx) {
                        const t = Math.max(0, elapsed - b.delay) / 1000;
                        if (t <= 0) return;
                        const gravity = 0.5;
                        const vx = Math.cos(angle) * speed * 60;
                        const vy = Math.sin(angle) * speed * 60;
                        const px = b.cx + vx * t;
                        const py = b.cy + vy * t + 0.5 * gravity * 60 * t * t;
                        ctx.globalAlpha = Math.max(0, 1 - t * 0.6);
                        ctx.fillStyle = color;
                        ctx.beginPath();
                        ctx.arc(px, py, size, 0, Math.PI * 2);
                        ctx.fill();
                    }
                });
            }
        });
        return particles;
    },

    // ---- 爆発 ----
    _explosion() {
        const W = this._canvas.width, H = this._canvas.height;
        const cx = W / 2, cy = H / 2;
        return [{
            update(elapsed, ctx, canvas) {
                const t = elapsed / 3000;
                // 放射光
                const radius = t * Math.max(W, H) * 0.8;
                const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
                gradient.addColorStop(0, `rgba(255, 215, 0, ${0.6 * (1 - t)})`);
                gradient.addColorStop(0.3, `rgba(255, 107, 107, ${0.4 * (1 - t)})`);
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                // 波紋
                for (let i = 0; i < 3; i++) {
                    const r = radius * (0.3 + i * 0.25);
                    ctx.strokeStyle = `rgba(255, 215, 0, ${0.3 * (1 - t)})`;
                    ctx.lineWidth = 3 - i;
                    ctx.beginPath();
                    ctx.arc(cx, cy, r, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }
        }];
    },

    // ---- スポットライト ----
    _spotlight() {
        const W = this._canvas.width, H = this._canvas.height;
        return [{
            update(elapsed, ctx, canvas) {
                const t = Math.min(elapsed / 500, 1);
                ctx.fillStyle = `rgba(0, 0, 0, ${0.7 * t})`;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                const gradient = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 200 * t);
                gradient.addColorStop(0, `rgba(255, 215, 0, ${0.3 * t})`);
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        }];
    },

    // ---- シンプル ----
    _simple() {
        return [{
            update(elapsed, ctx, canvas) {
                // 何も描画しない(結果テキストのアニメーションのみ)
            }
        }];
    },

    // ---- 確変演出 (スペシャル) ----
    _kakuhen() {
        const W = this._canvas.width, H = this._canvas.height;
        const cx = W / 2, cy = H / 2;
        const colors = ['#ff0000','#ff7700','#ffff00','#00ff00','#00ffff','#0077ff','#ff00ff'];
        const particles = [];
        // 虹色パーティクル大量放出
        for (let i = 0; i < 300; i++) {
            const angle = (Math.PI * 2 * i) / 300 + Math.random() * 0.2;
            const speed = Math.random() * 5 + 3;
            const color = colors[i % colors.length];
            const size = Math.random() * 4 + 2;
            const delay = Math.random() * 500;
            particles.push({
                update(elapsed, ctx, canvas) {
                    const t = Math.max(0, elapsed - delay) / 1000;
                    if (t <= 0) return;
                    const vx = Math.cos(angle) * speed * 50;
                    const vy = Math.sin(angle) * speed * 50;
                    const px = cx + vx * t;
                    const py = cy + vy * t + 0.3 * 60 * t * t;
                    ctx.globalAlpha = Math.max(0, 1 - t * 0.4);
                    ctx.shadowColor = color;
                    ctx.shadowBlur = 15;
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.arc(px, py, size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            });
        }
        // 虹色放射グラデーション
        particles.push({
            update(elapsed, ctx, canvas) {
                const t = elapsed / 4000;
                const hue = (elapsed * 0.3) % 360;
                const radius = t * Math.max(W, H) * 0.6;
                const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
                gradient.addColorStop(0, `hsla(${hue}, 100%, 60%, ${0.5 * (1 - t)})`);
                gradient.addColorStop(0.5, `hsla(${(hue + 120) % 360}, 100%, 50%, ${0.3 * (1 - t)})`);
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                // 画面振動
                if (elapsed < 2000) {
                    const shakeX = (Math.random() - 0.5) * 8 * (1 - t);
                    const shakeY = (Math.random() - 0.5) * 8 * (1 - t);
                    canvas.style.transform = `translate(${shakeX}px, ${shakeY}px)`;
                } else {
                    canvas.style.transform = '';
                }
            }
        });
        return particles;
    }
};
