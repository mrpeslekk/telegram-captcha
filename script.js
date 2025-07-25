document.addEventListener('DOMContentLoaded', () => {
    const holdBtn = document.getElementById('hold-btn');
    const holdBtnText = holdBtn.querySelector('span');
    const messageEl = document.getElementById('message');

    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

    const urlParams = new URLSearchParams(window.location.search);
    const chatId = urlParams.get('chat_id');

    if (!chatId) {
        messageEl.textContent = 'Error: Invalid or expired link.';
        holdBtn.style.display = 'none';
        return;
    }

    let holdTimer = null;
    const HOLD_DURATION = 5000; // 5 seconds

    function onVerificationSuccess() {
        clearTimeout(holdTimer);
        holdTimer = null;

        holdBtnText.textContent = 'Verified!';
        messageEl.textContent = 'Success! Closing window...';
        messageEl.className = 'success';
        holdBtn.style.pointerEvents = 'none';

        const dataToSend = JSON.stringify({
            status: "verified",
            chat_id: chatId
        });
        
        tg.sendData(dataToSend);
    }

    function startHold() {
        if (holdTimer) return;
        holdBtnText.textContent = 'Holding...';
        holdBtn.classList.add('is-holding');
        holdTimer = setTimeout(onVerificationSuccess, HOLD_DURATION);
    }

    function cancelHold() {
        holdBtnText.textContent = 'Press and Hold';
        holdBtn.classList.remove('is-holding');
        if (holdTimer) {
            clearTimeout(holdTimer);
            holdTimer = null;
        }
    }

    holdBtn.addEventListener('mousedown', startHold);
    holdBtn.addEventListener('mouseup', cancelHold);
    holdBtn.addEventListener('mouseleave', cancelHold);
    holdBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startHold(); });
    holdBtn.addEventListener('touchend', cancelHold);
});
