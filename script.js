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
    let isVerified = false;
    const HOLD_DURATION = 5000; // 5 seconds

    function onVerificationSuccess() {
        if (isVerified) return;
        isVerified = true;

        clearTimeout(holdTimer);
        holdTimer = null;

        holdBtnText.textContent = 'Verified!';
        messageEl.textContent = 'Success! Processing...';
        messageEl.className = 'success';
        holdBtn.style.pointerEvents = 'none';

        // --- THIS IS THE CRITICAL FIX ---
        // 1. Prepare the data to send to the bot.
        const dataToSend = JSON.stringify({
            status: "verified",
            chat_id: chatId
        });
        
        // 2. Send the data to the bot so it can approve the request.
        tg.sendData(dataToSend);

        // 3. Immediately close the window after a tiny delay,
        //    just like in the code you provided. This guarantees it closes.
        setTimeout(() => {
            tg.close();
        }, 100); // 100ms delay
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

    holdBtn.addEventListener('mousedown', startHold);
    holdBtn.addEventListener('mouseup', cancelHold);
    holdBtn.addEventListener('mouseleave', cancelHold);
    holdBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startHold(); });
    holdBtn.addEventListener('touchend', cancelHold);
});
