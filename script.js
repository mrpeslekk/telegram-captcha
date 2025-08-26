document.addEventListener('DOMContentLoaded', () => {
    const holdBtn = document.getElementById('hold-btn');
    const holdBtnText = holdBtn.querySelector('span');
    const messageEl = document.getElementById('message');

    // Initialize the Telegram Web App interface
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

    // Get parameters from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const chatId = urlParams.get('chat_id');
    const userId = urlParams.get('user_id');

    // Validate that we have the necessary parameters
    if (!chatId || !userId) {
        messageEl.textContent = 'Error: Invalid or expired link. (Code: 1)';
        messageEl.className = 'error';
        holdBtn.style.display = 'none';
        return;
    }

    let holdTimer = null;
    let isVerified = false;
    const HOLD_DURATION = 5000; // 5 seconds

    function onVerificationSuccess() {
        // Prevent this from running more than once
        if (isVerified) return;
        isVerified = true;

        // Clean up the timer
        clearTimeout(holdTimer);
        holdTimer = null;

        // --- THE DEFINITIVE AUTO-CLOSE FLOW WITH COUNTDOWN ---

        // 1. Give immediate visual feedback and disable the button
        holdBtnText.textContent = 'Verified!';
        messageEl.textContent = 'Confirmation sent. You are being redirected...';
        messageEl.className = 'success';
        holdBtn.style.pointerEvents = 'none';
        holdBtn.classList.remove('is-holding');

        // 2. CRITICAL STEP: Send the data to the bot BEFORE starting the countdown.
        const dataToSend = JSON.stringify({
            status: "verified",
            chat_id: chatId,
            user_id: userId
        });
        tg.sendData(dataToSend);

        // 3. Start a 3-second countdown which acts as a reliable delay.
        let countdown = 3;
        holdBtnText.textContent = `Closing in ${countdown}...`;

        const countdownInterval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                holdBtnText.textContent = `Closing in ${countdown}...`;
            } else {
                // When the countdown is over, clear the interval and close the window.
                clearInterval(countdownInterval);
                tg.close();
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

    // Add event listeners for both mouse and touch interaction
    function addListeners() {
        holdBtn.addEventListener('mousedown', startHold);
        holdBtn.addEventListener('mouseup', cancelHold);
        holdBtn.addEventListener('mouseleave', cancelHold);
        holdBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startHold(); });
        holdBtn.addEventListener('touchend', cancelHold);
    }
    
    addListeners();
});
