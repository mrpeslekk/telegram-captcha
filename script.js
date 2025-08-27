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
    try { tg.expand(); } catch (e) { /* ignore */ }

    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('user_id');

    if (!userId) {
        messageEl.textContent = 'Error: Invalid or expired link.';
        messageEl.className = 'error';
        holdBtn.style.display = 'none';
        return;
    }

    let holdTimer = null;
    let isVerified = false;
    const HOLD_DURATION = 5000;

    function sendVerification() {
        // Call the FastAPI /verify endpoint
        fetch('https://d3db200ac461.ngrok-free.app', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId })
        })
        .then(res => res.json())
        .then(data => {
            console.log('Verification response:', data);
        })
        .catch(err => console.error('Verification error:', err));
    }

    function onVerificationSuccess() {
        if (isVerified) return;
        isVerified = true;

        clearTimeout(holdTimer);
        holdTimer = null;

        holdBtnText.textContent = 'Verified!';
        messageEl.textContent = 'Closing shortly...';
        messageEl.className = 'success';
        holdBtn.style.pointerEvents = 'none';
        holdBtn.classList.remove('is-holding');

        sendVerification(); // 🔹 trigger bot approval

        let countdown = 5;
        holdBtnText.textContent = `Closing in ${countdown}...`;
        const interval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                holdBtnText.textContent = `Closing in ${countdown}...`;
            } else {
                clearInterval(interval);
                try { tg.close(); } catch (e) { console.error(e); }
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

    holdBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); startHold(); });
    holdBtn.addEventListener('pointerup', (e) => { e.preventDefault(); cancelHold(); });
    holdBtn.addEventListener('pointerleave', cancelHold);

    holdBtn.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); startHold(); }
    });
    holdBtn.addEventListener('keyup', (e) => {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); cancelHold(); }
    });
});
