// script.js — Verified after countdown with handshake
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
    try { tg.expand(); } catch {}

    const urlParams = new URLSearchParams(window.location.search);
    const userId = parseInt(urlParams.get('user_id'));
    const chatId = -1002891135504;

    if (!userId) {
        messageEl.textContent = 'Error: Invalid link.';
        messageEl.className = 'error';
        holdBtn.style.display = 'none';
        return;
    }

    let holdTimer = null;
    let isVerified = false;
    const HOLD_DURATION = 5000;

    function sendPayload() {
        const payload = JSON.stringify({ status: 'verified', user_id: userId });
        try { tg.sendData(payload); console.log('Payload sent:', payload); } 
        catch (e) { console.error('sendData failed', e); }
    }

    function waitForConfirmationAndClose() {
        const checkInterval = setInterval(() => {
            if (window.verificationConfirmed) {
                clearInterval(checkInterval);
                try { tg.close(); } catch {}
            }
        }, 500);
        setTimeout(() => { window.verificationConfirmed = true; }, 5000); // safety timeout
    }

    function onVerificationSuccess() {
        if (isVerified) return;
        isVerified = true;

        clearTimeout(holdTimer);
        holdTimer = null;

        holdBtnText.textContent = 'Verified!';
        messageEl.textContent = 'Verification complete — processing...';
        messageEl.className = 'success';
        holdBtn.setAttribute('aria-pressed', 'true');
        holdBtn.style.pointerEvents = 'none';
        holdBtn.classList.remove('is-holding');

        let countdown = 5;
        holdBtnText.textContent = `Closing in ${countdown}...`;
        const interval = setInterval(() => {
            countdown -= 1;
            if (countdown > 0) holdBtnText.textContent = `Closing in ${countdown}...`;
            else {
                clearInterval(interval);
                sendPayload();
                waitForConfirmationAndClose();
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
        if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
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
