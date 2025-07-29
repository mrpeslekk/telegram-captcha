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

    // This is a new, separate function to handle the countdown.
    function startCountdown() {
        let countdown = 3;
        
        // The countdown text will now appear in the main button for clarity.
        holdBtnText.textContent = `Closing in ${countdown}...`;

        const countdownInterval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                holdBtnText.textContent = `Closing in ${countdown}...`;
            } else {
                // When the countdown is over:
                clearInterval(countdownInterval);
                holdBtnText.textContent = 'Closing...';

                // Prepare and send the data to the bot.
                const dataToSend = JSON.stringify({
                    status: "verified",
                    chat_id: chatId
                });
                tg.sendData(dataToSend);
                
                // Force close the window after a very short delay.
                setTimeout(() => {
                    tg.close();
                }, 100);
            }
        }, 1000);
    }

    function onVerificationSuccess() {
        if (isVerified) return;
        isVerified = true;

        clearTimeout(holdTimer);
        holdTimer = null;

        // 1. Immediately show "Verified!" and disable the button.
        holdBtnText.textContent = 'Verified!';
        holdBtn.style.pointerEvents = 'none';
        messageEl.textContent = 'Success!';
        messageEl.className = 'success';

        // 2. After a 1-second delay, call the new countdown function.
        setTimeout(startCountdown, 1000);
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

    function addListeners() {
        holdBtn.addEventListener('mousedown', startHold);
        holdBtn.addEventListener('mouseup', cancelHold);
        holdBtn.addEventListener('mouseleave', cancelHold);
        holdBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startHold(); });
        holdBtn.addEventListener('touchend', cancelHold);
    }
    
    addListeners();
});
