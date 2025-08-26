document.addEventListener('DOMContentLoaded', () => {
    const holdBtn = document.getElementById('hold-btn');
    const holdBtnText = holdBtn.querySelector('span');
    const messageEl = document.getElementById('message');

    // Initialize the Telegram Web App interface
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

    // --- MODIFICATION 1: Get user_id as well ---
    // We need both parameters for the bot to approve the correct user for the correct chat.
    const urlParams = new URLSearchParams(window.location.search);
    const chatId = urlParams.get('chat_id');
    const userId = urlParams.get('user_id'); // Get the user_id from the URL

    // --- MODIFICATION 2: Check for both parameters ---
    if (!chatId || !userId) {
        messageEl.textContent = 'Error: Invalid or expired link. (Missing required info).';
        messageEl.className = 'error';
        holdBtn.style.display = 'none';
        return;
    }

    let holdTimer = null;
    let isVerified = false;
    const HOLD_DURATION = 5000; // 5 seconds

    function startCountdown() {
        let countdown = 3;
        holdBtnText.textContent = `Closing in ${countdown}...`;

        const countdownInterval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                holdBtnText.textContent = `Closing in ${countdown}...`;
            } else {
                clearInterval(countdownInterval);
                holdBtnText.textContent = 'Closing...';

                // --- MODIFICATION 3: Include user_id in the data payload ---
                const dataToSend = JSON.stringify({
                    status: "verified",
                    chat_id: chatId,
                    user_id: userId // Add user_id here
                });

                // Send the data to the bot.
                tg.sendData(dataToSend);

                // --- MODIFICATION 4 (THE FIX): Increase the delay before closing ---
                // Give the Telegram client more time to process sendData before closing.
                // 100ms was too short, 500ms is much safer.
                setTimeout(() => {
                    tg.close();
                }, 500);
            }
        }, 1000);
    }

    function onVerificationSuccess() {
        if (isVerified) return;
        isVerified = true;

        clearTimeout(holdTimer);
        holdTimer = null;

        holdBtnText.textContent = 'Verified!';
        holdBtn.style.pointerEvents = 'none'; // Disable the button
        messageEl.textContent = 'Success! You will be added to the group.';
        messageEl.className = 'success';

        // Wait a moment before starting the final countdown
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
