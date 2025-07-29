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

        // --- THIS IS THE NEW, CORRECT LOGIC ---
        // 1. Immediately show "Verified!" and disable the button.
        holdBtnText.textContent = 'Verified!';
        holdBtn.style.pointerEvents = 'none';
        messageEl.textContent = 'Success!';
        messageEl.className = 'success';

        // 2. Wait for 1 second before starting the countdown.
        setTimeout(() => {
            let countdown = 3;
            // The countdown now appears inside the main button
            holdBtnText.textContent = `Closing in ${countdown}...`;

            const countdownInterval = setInterval(() => {
                countdown--;
                if (countdown > 0) {
                    holdBtnText.textContent = `Closing in ${countdown}...`;
                } else {
                    // 3. When countdown finishes, stop the timer.
                    clearInterval(countdownInterval);
                    holdBtnText.textContent = 'Closing...';

                    // 4. Prepare and send the data to the bot.
                    const dataToSend = JSON.stringify({
                        status: "verified",
                        chat_id: chatId
                    });
                    
                    // 5. This command sends the data and closes the window.
                    tg.sendData(dataToSend);
                }
            }, 1000); // Run every second
        }, 1000); // 1-second delay
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
