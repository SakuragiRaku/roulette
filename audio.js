// ============================================================
// ルーレット - audio.js
// 効果音エンジン (Web Audio API)
// ============================================================

const Audio = {
    ctx: null,
    enabled: true,
    volume: 0.5,

    init() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    },

    ensure() {
        if (!this.ctx) this.init();
        if (this.ctx.state === 'suspended') this.ctx.resume();
    },

    // ティック音 (ルーレット回転中)
    tick() {
        if (!this.enabled) return;
        this.ensure();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.frequency.value = 1200;
        osc.type = 'sine';
        gain.gain.setValueAtTime(this.volume * 0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.05);
    },

    // ドラムロール (回転開始)
    drumroll(duration = 2) {
        if (!this.enabled) return;
        this.ensure();
        const interval = 50;
        let count = 0;
        const maxCount = (duration * 1000) / interval;
        const id = setInterval(() => {
            if (count++ > maxCount) { clearInterval(id); return; }
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.frequency.value = 200 + Math.random() * 100;
            osc.type = 'triangle';
            gain.gain.setValueAtTime(this.volume * 0.08, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
            osc.start(this.ctx.currentTime);
            osc.stop(this.ctx.currentTime + 0.04);
        }, interval);
        return id;
    },

    // ファンファーレ (結果発表)
    fanfare() {
        if (!this.enabled) return;
        this.ensure();
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.frequency.value = freq;
            osc.type = 'square';
            const t = this.ctx.currentTime + i * 0.15;
            gain.gain.setValueAtTime(this.volume * 0.12, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
            osc.start(t);
            osc.stop(t + 0.4);
        });
    },

    // ハートビート (じらし演出)
    heartbeat() {
        if (!this.enabled) return;
        this.ensure();
        [0, 0.15].forEach(delay => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.frequency.value = 60;
            osc.type = 'sine';
            const t = this.ctx.currentTime + delay;
            gain.gain.setValueAtTime(this.volume * 0.25, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
            osc.start(t);
            osc.stop(t + 0.2);
        });
    },

    // 逆回転音 (一個戻る演出)
    reverseSound() {
        if (!this.enabled) return;
        this.ensure();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.5);
        osc.type = 'sawtooth';
        gain.gain.setValueAtTime(this.volume * 0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.6);
    },

    // 確変ファンファーレ (スペシャル演出)
    kakuhenFanfare() {
        if (!this.enabled) return;
        this.ensure();
        const notes = [523.25, 659.25, 783.99, 880, 1046.50, 1318.51, 1567.98];
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.frequency.value = freq;
            osc.type = 'square';
            const t = this.ctx.currentTime + i * 0.12;
            gain.gain.setValueAtTime(this.volume * 0.15, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
            osc.start(t);
            osc.stop(t + 0.5);
        });
        // 最後にシンバル的な音
        setTimeout(() => {
            if (!this.ctx) return;
            const noise = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            noise.connect(g);
            g.connect(this.ctx.destination);
            noise.type = 'sawtooth';
            noise.frequency.value = 3000;
            g.gain.setValueAtTime(this.volume * 0.08, this.ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);
            noise.start(this.ctx.currentTime);
            noise.stop(this.ctx.currentTime + 0.8);
        }, notes.length * 120);
    },

    // 驚き音 (一個戻る時の「えっ?!」)
    surpriseSound() {
        if (!this.enabled) return;
        this.ensure();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.15);
        osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.3);
        osc.type = 'sine';
        gain.gain.setValueAtTime(this.volume * 0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.4);
    }
};
