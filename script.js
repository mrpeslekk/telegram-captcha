// script.js — Verified after countdown and closes safely
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
    const chatId = parseInt(urlParams.get('chat_id'));
    const userId = parseInt(urlParams.get('user_id'));

    if (!chatId || !userId) {
        messageEl.textContent = 'Error: Invalid or expired link. (Code: 3)';
        messageEl.className = 'error';
        holdBtn.style.display = 'none';
        return;
    }

    let holdTimer = null;
    let isVerified = false;
    const HOLD_DURATION = 5000; // 5 seconds hold

    function onVerificationSuccess() {
        if (isVerified) return;
        isVerified = true;

        clearTimeout(holdTimer);
        holdTimer = null;

        holdBtnText.textContent = 'Verified!';
        messageEl.textContent = 'Verification complete — closing shortly.';
        messageEl.className = 'success';
        holdBtn.setAttribute('aria-pressed', 'true');
        holdBtn.style.pointerEvents = 'none';
        holdBtn.classList.remove('is-holding');

        // Start 5-second visual countdown
        let countdown = 5;
        holdBtnText.textContent = `Closing in ${countdown}...`;

        const interval = setInterval(() => {
            countdown -= 1;
            if (countdown > 0) {
                holdBtnText.textContent = `Closing in ${countdown}...`;
            } else {
                clearInterval(interval);

                // Send verification payload to the bot **right before closing**
                const payload = JSON.stringify({
                    status: 'verified',
                    chat_id: chatId,
                    user_id: userId
                });
                try {
                    tg.sendData(payload);
                    console.log('Sent verification payload:', payload);
                } catch (e) {
                    console.error('sendData failed', e);
                }

                // Close the Web App
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

    // Pointer events (touch/mouse)
    holdBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); startHold(); });
    holdBtn.addEventListener('pointerup', (e) => { e.preventDefault(); cancelHold(); });
    holdBtn.addEventListener('pointerleave', cancelHold);

    // Keyboard accessibility
    holdBtn.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); startHold(); }
    });
    holdBtn.addEventListener('keyup', (e) => {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); cancelHold(); }
    });
});
