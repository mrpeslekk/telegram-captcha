// script.js — improved, supports pointer events and robust flow
document.addEventListener('DOMContentLoaded', () => {
    const holdBtn = document.getElementById('hold-btn');
    const holdBtnText = holdBtn.querySelector('span');
    const messageEl = document.getElementById('message');

    const tg = window.Telegram && window.Telegram.WebApp;
    if (!tg) {
        messageEl.textContent = 'Telegram Web App API not found. Open this link from Telegram.';
        messageEl.className = 'error';
        holdBtn.style.display = 'none';
        return;
    }

    tg.ready();
    try { tg.expand(); } catch (e) { /* ignore if not allowed */ }

    const urlParams = new URLSearchParams(window.location.search);
    const chatId = urlParams.get('chat_id');
    const userId = urlParams.get('user_id');

    if (!chatId || !userId) {
        messageEl.textContent = 'Error: Invalid or expired link. (Code: 3)';
        messageEl.className = 'error';
        holdBtn.style.display = 'none';
        return;
    }

    let holdTimer = null;
    let isVerified = false;
    const HOLD_DURATION = 5000; // 5s hold

    function onVerificationSuccess() {
        if (isVerified) return;
        isVerified = true;

        clearTimeout(holdTimer);
        holdTimer = null;

        holdBtnText.textContent = 'Verified!';
        messageEl.textContent = 'Confirmation sent — closing shortly.';
        messageEl.className = 'success';
        holdBtn.setAttribute('aria-pressed', 'true');
        holdBtn.style.pointerEvents = 'none';
        holdBtn.classList.remove('is-holding');

        // Send data to bot (must be string)
        const payload = JSON.stringify({ status: 'verified', chat_id: chatId, user_id: userId });
        try {
            tg.sendData(payload);
        } catch (e) {
            console.error('sendData failed', e);
        }

        // 5-second visual countdown then close
        let countdown = 5;
        holdBtnText.textContent = `Closing in ${countdown}...`;
        const interval = setInterval(() => {
            countdown -= 1;
            if (countdown > 0) {
                holdBtnText.textContent = `Closing in ${countdown}...`;
            } else {
                clearInterval(interval);
                try { tg.close(); } catch (e) { console.error('close failed', e); }
            }
        }, 1000);
    }

    function startHold() {
        if (holdTimer || isVerified) return;
        holdBtnText.textContent = 'Holding...';
        holdBtn.classList.add('is-holding');
        holdTimer = setTimeout(onVerificationSuccess, HOLD_DURATION);
    }

    function cancelHold() {
        if (isVerified) return;
        holdBtnText.textContent = 'Press and Hold';
        holdBtn.classList.remove('is-holding');
        if (holdTimer) {
            clearTimeout(holdTimer);
            holdTimer = null;
        }
    }

    // Use pointer events for wide device support
    holdBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); startHold(); });
    holdBtn.addEventListener('pointerup', (e) => { e.preventDefault(); cancelHold(); });
    holdBtn.addEventListener('pointerleave', cancelHold);
    // keyboard support
    holdBtn.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); startHold(); }
    });
    holdBtn.addEventListener('keyup', (e) => {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); cancelHold(); }
    });
});
