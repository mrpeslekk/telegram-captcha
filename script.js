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
        holdBtn.style.pointerEvents = 'none'; // Disable the button

        // --- THIS IS THE NEW COUNTDOWN LOGIC ---
        let countdown = 3;
        messageEl.textContent = `Success! Closing in ${countdown}...`;
        messageEl.className = 'success';

        const countdownInterval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                messageEl.textContent = `Success! Closing in ${countdown}...`;
            } else {
                // When countdown is over, stop the timer and send data
                messageEl.textContent = 'Success! Closing now...';
                clearInterval(countdownInterval);

                const dataToSend = JSON.stringify({
                    status: "verified",
                    chat_id: chatId
                });
                
                // This command sends the data to your bot and closes the window
                tg.sendData(dataToSend);
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

    holdBtn.addEventListener('mousedown', startHold);
    holdBtn.addEventListener('mouseup', cancelHold);
    holdBtn.addEventListener('mouseleave', cancelHold);
    holdBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startHold(); });
    holdBtn.addEventListener('touchend', cancelHold);
});
