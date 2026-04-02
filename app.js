// ============================================================
// ルーレット - app.js
// ============================================================
(function () {
    'use strict';

    const COLORS = [
        '#ff6b6b', '#4d96ff', '#6bcb77', '#ffd93d', '#a55eea',
        '#ff9f43', '#00d2d3', '#ff6bcb', '#1dd1a1', '#5f27cd',
        '#ee5a24', '#0abde3', '#10ac84', '#f368e0', '#48dbfb',
        '#e056fd', '#30336b', '#6ab04c', '#eb4d4b', '#7ed6df'
    ];

    const PRESETS = {
        numbers: { name: '番号', items: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] },
        punishment: { name: '罰ゲーム', items: ['一気飲み', 'モノマネ', '奢る', '真実の告白', 'スキップ', '腕立て10回', '変顔', '一発芸'] },
        lunch: { name: 'ランチ', items: ['ラーメン', 'カレー', '寿司', 'パスタ', 'ハンバーガー', '定食', 'うどん', '中華'] },
        yesno: { name: 'YES/NO', items: ['YES!', 'NO!'] },
        lottery: { name: '当たりハズレ', items: ['🎉 当たり!', 'ハズレ', 'ハズレ', 'ハズレ', '大当たり!!', 'ハズレ'] },
        janken: { name: 'じゃんけん', items: ['✊ グー', '✌️ チョキ', '🖐️ パー'] },
        direction: { name: '方角', items: ['北', '北東', '東', '南東', '南', '南西', '西', '北西'] }
    };

    // ---- State ----
    let items = JSON.parse(localStorage.getItem('roulette-items') || 'null') || ['項目1', '項目2', '項目3', '項目4'];
    let history = JSON.parse(localStorage.getItem('roulette-history') || '[]');
    let settings = JSON.parse(localStorage.getItem('roulette-settings') || '{}');
    let effect = settings.effect || 'confetti';
    let soundEnabled = settings.soundEnabled !== false;
    let soundVolume = settings.soundVolume || 0.5;
    let theme = settings.theme || 'dark';
    let spinning = false;
    let angle = 0;
    let lastResult = null;

    const $ = id => document.getElementById(id);
    const canvas = $('wheel');
    const ctx = canvas.getContext('2d');
    const effectCanvas = $('effect-canvas');

    // ---- Init ----
    function init() {
        applyTheme();
        drawWheel();
        renderItems();
        Effects.init(effectCanvas);
        Audio.enabled = soundEnabled;
        Audio.volume = soundVolume;
        $('sound-enabled').checked = soundEnabled;
        $('sound-volume').value = soundVolume;
        document.querySelectorAll('.effect-opt').forEach(o => o.classList.toggle('active', o.dataset.effect === effect));
        bindEvents();
    }

    function saveSettings() {
        settings = { effect, soundEnabled, soundVolume, theme };
        localStorage.setItem('roulette-settings', JSON.stringify(settings));
    }

    function saveItems() { localStorage.setItem('roulette-items', JSON.stringify(items)); }
    function saveHistory() { localStorage.setItem('roulette-history', JSON.stringify(history)); }

    // ---- Theme ----
    function applyTheme() {
        document.body.setAttribute('data-theme', theme);
        $('btn-theme').textContent = theme === 'dark' ? '☀️' : '🌙';
    }

    // ---- Draw Wheel ----
    function drawWheel() {
        const size = canvas.width;
        const cx = size / 2, cy = size / 2, r = size / 2 - 8;
        ctx.clearRect(0, 0, size, size);

        if (items.length === 0) {
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#888';
            ctx.font = '14px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('項目を追加してね', cx, cy);
            return;
        }

        const sliceAngle = (Math.PI * 2) / items.length;

        items.forEach((item, i) => {
            const startAngle = angle + i * sliceAngle;
            const endAngle = startAngle + sliceAngle;
            const color = COLORS[i % COLORS.length];

            // 扇形
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, r, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();

            // 境界線
            ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // テキスト
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(startAngle + sliceAngle / 2);
            ctx.fillStyle = '#fff';
            ctx.font = `600 ${Math.min(14, 140 / items.length)}px Inter`;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            const maxWidth = r - 30;
            let text = item;
            if (ctx.measureText(text).width > maxWidth) {
                while (ctx.measureText(text + '…').width > maxWidth && text.length > 0) text = text.slice(0, -1);
                text += '…';
            }
            ctx.fillText(text, r - 16, 0);
            ctx.restore();
        });

        // 中心円
        ctx.beginPath();
        ctx.arc(cx, cy, 30, 0, Math.PI * 2);
        ctx.fillStyle = '#1a1a30';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 外枠
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 4;
        ctx.stroke();
    }

    // ---- Spin ----
    function spin() {
        if (spinning || items.length < 2) return;
        spinning = true;
        canvas.classList.add('spinning');
        $('btn-spin').disabled = true;

        Audio.drumroll(1.5);

        const totalRotation = Math.PI * 2 * (8 + Math.random() * 8); // 8〜16周
        const duration = 5000 + Math.random() * 2000; // 5〜7秒
        const startAngle = angle;
        const startTime = performance.now();

        let lastTickAngle = angle;
        const sliceAngle = (Math.PI * 2) / items.length;

        // 一個戻る演出フラグ (30%の確率で発動)
        const doReverse = Math.random() < 0.3;
        // 確変演出フラグ (20%の確率で発動)
        const doKakuhen = Math.random() < 0.2;

        function animate(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // イージング: 最後にじわじわ減速
            let eased;
            if (progress < 0.7) {
                eased = progress / 0.7 * 0.7;
            } else {
                const t = (progress - 0.7) / 0.3;
                eased = 0.7 + 0.3 * (1 - Math.pow(1 - t, 4)); // quartic ease-out for last 30%
            }

            angle = startAngle + totalRotation * eased;

            // ティック音
            const angleDiff = Math.abs(angle - lastTickAngle);
            if (angleDiff >= sliceAngle) {
                lastTickAngle = angle;
                Audio.tick();
            }

            // じらし演出のハートビート
            if (progress > 0.85 && progress < 0.95) {
                if (Math.random() < 0.03) Audio.heartbeat();
            }

            drawWheel();

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // 一個戻る演出の場合
                if (doReverse) {
                    performReverse(doKakuhen);
                } else {
                    finishSpin(doKakuhen);
                }
            }
        }

        requestAnimationFrame(animate);
    }

    // 一個戻る演出: 一度停止→驚き音→逆回転→確定
    function performReverse(doKakuhen) {
        const sliceAngle = (Math.PI * 2) / items.length;

        // まず一度「仮の結果」を見せるための短い停止
        Audio.surpriseSound();

        // 0.8秒待ってから逆回転開始
        setTimeout(() => {
            Audio.reverseSound();

            const reverseAmount = sliceAngle * (0.8 + Math.random() * 0.4); // 1項目分少し戻る
            const reverseStartAngle = angle;
            const reverseDuration = 800;
            const reverseStartTime = performance.now();

            // 画面を少し赤くフラッシュ
            const overlay = $('result-overlay');
            document.body.style.transition = 'background 0.2s';

            function reverseAnimate(now) {
                const elapsed = now - reverseStartTime;
                const progress = Math.min(elapsed / reverseDuration, 1);
                // ease-in-out
                const eased = progress < 0.5
                    ? 2 * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 2) / 2;

                angle = reverseStartAngle - reverseAmount * eased;
                drawWheel();

                if (progress < 1) {
                    requestAnimationFrame(reverseAnimate);
                } else {
                    finishSpin(doKakuhen);
                }
            }

            requestAnimationFrame(reverseAnimate);
        }, 800);
    }

    // スピン完了: 結果判定 + 演出再生
    function finishSpin(doKakuhen) {
        spinning = false;
        canvas.classList.remove('spinning');
        $('btn-spin').disabled = false;

        const sliceAngle = (Math.PI * 2) / items.length;

        // 結果判定
        const normalizedAngle = ((2 * Math.PI - (angle % (2 * Math.PI))) + 2 * Math.PI) % (2 * Math.PI);
        // ポインターは上部(270度 = -π/2)にある
        const pointerAngle = (normalizedAngle + Math.PI * 1.5) % (Math.PI * 2);
        const idx = Math.floor(pointerAngle / sliceAngle) % items.length;
        lastResult = items[idx];

        // 履歴に追加
        history.unshift({ text: lastResult, timestamp: new Date().toISOString() });
        if (history.length > 50) history = history.slice(0, 50);
        saveHistory();

        // 結果表示 (確変なら特別演出)
        if (doKakuhen) {
            showResultKakuhen(lastResult);
        } else {
            showResult(lastResult);
        }
    }

    function showResult(text) {
        $('result-text').textContent = text;
        $('result-overlay').classList.add('show');
        $('result-overlay').classList.remove('kakuhen');
        Effects.play(effect, 3500);
        Audio.fanfare();
    }

    function showResultKakuhen(text) {
        $('result-text').textContent = `✨ ${text} ✨`;
        $('result-overlay').classList.add('show', 'kakuhen');
        Effects.play('kakuhen', 4500);
        Audio.kakuhenFanfare();
    }

    function hideResult() {
        $('result-overlay').classList.remove('show', 'kakuhen');
        Effects.stop();
    }

    // ---- Items ----
    function renderItems() {
        const list = $('item-list');
        list.innerHTML = '';
        items.forEach((item, i) => {
            const li = document.createElement('li');
            li.className = 'item-row';
            li.innerHTML = `
                <span class="item-color" style="background:${COLORS[i % COLORS.length]}"></span>
                <span class="item-name">${escapeHtml(item)}</span>
                <button class="item-del" data-idx="${i}" title="削除">✕</button>
            `;
            list.appendChild(li);
        });
        list.querySelectorAll('.item-del').forEach(btn => {
            btn.addEventListener('click', () => {
                items.splice(parseInt(btn.dataset.idx), 1);
                saveItems();
                renderItems();
                drawWheel();
            });
        });
    }

    function addItem() {
        const input = $('item-input');
        const text = input.value.trim();
        if (!text) return;
        if (items.length >= 20) { showToast('最大20項目までです'); return; }
        items.push(text);
        input.value = '';
        saveItems();
        renderItems();
        drawWheel();
    }

    function loadPreset(key) {
        const preset = PRESETS[key];
        if (!preset) return;
        items = [...preset.items];
        saveItems();
        renderItems();
        drawWheel();
        closeModal('modal-presets');
        showToast(`📋 「${preset.name}」を読み込みました`);
    }

    // ---- History ----
    function renderHistory() {
        const list = $('history-list');
        list.innerHTML = '';
        if (history.length === 0) {
            list.innerHTML = '<p style="text-align:center;color:var(--text3);padding:20px">履歴はまだありません</p>';
            return;
        }
        history.forEach(h => {
            const d = new Date(h.timestamp);
            const time = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `<span class="h-text">${escapeHtml(h.text)}</span><span class="h-time">${time}</span>`;
            list.appendChild(div);
        });
    }

    // ---- Modals ----
    function openModal(id) {
        $(id).classList.add('show');
        if (id === 'modal-history') renderHistory();
    }

    function closeModal(id) { $(id).classList.remove('show'); }

    // ---- Utils ----
    function showToast(msg) {
        const t = $('toast');
        t.textContent = msg;
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 2000);
    }

    function escapeHtml(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

    // ---- Events ----
    function bindEvents() {
        $('btn-spin').addEventListener('click', spin);
        $('btn-add').addEventListener('click', addItem);
        $('item-input').addEventListener('keypress', e => { if (e.key === 'Enter') addItem(); });

        $('btn-settings').addEventListener('click', () => openModal('modal-settings'));
        $('btn-presets').addEventListener('click', () => openModal('modal-presets'));
        $('btn-history').addEventListener('click', () => openModal('modal-history'));

        $('btn-theme').addEventListener('click', () => {
            theme = theme === 'dark' ? 'light' : 'dark';
            applyTheme();
            saveSettings();
        });

        // Result overlay
        $('btn-respin').addEventListener('click', () => { hideResult(); setTimeout(spin, 300); });
        $('btn-respin-exclude').addEventListener('click', () => {
            if (lastResult) {
                const idx = items.indexOf(lastResult);
                if (idx !== -1) { items.splice(idx, 1); saveItems(); renderItems(); }
            }
            hideResult();
            drawWheel();
            if (items.length >= 2) setTimeout(spin, 300);
            else showToast('項目が足りません');
        });
        $('btn-close-result').addEventListener('click', hideResult);

        // Effect selection
        document.querySelectorAll('.effect-opt').forEach(opt => {
            opt.addEventListener('click', () => {
                effect = opt.dataset.effect;
                document.querySelectorAll('.effect-opt').forEach(o => o.classList.toggle('active', o.dataset.effect === effect));
                saveSettings();
            });
        });

        // Sound settings
        $('sound-enabled').addEventListener('change', e => {
            soundEnabled = e.target.checked;
            Audio.enabled = soundEnabled;
            saveSettings();
        });
        $('sound-volume').addEventListener('input', e => {
            soundVolume = parseFloat(e.target.value);
            Audio.volume = soundVolume;
            saveSettings();
        });

        // Modal close
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => closeModal(btn.dataset.close));
        });
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', e => { if (e.target === modal) closeModal(modal.id); });
        });

        // Presets
        document.querySelectorAll('.preset-item').forEach(btn => {
            btn.addEventListener('click', () => loadPreset(btn.dataset.preset));
        });

        // Clear history
        $('btn-clear-history').addEventListener('click', () => {
            history = [];
            saveHistory();
            renderHistory();
            showToast('履歴をクリアしました');
        });
    }

    init();
})();
