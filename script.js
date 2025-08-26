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
    const inviteLink = urlParams.get('invite_link');

    // Validate that we have ALL the necessary parameters
    if (!chatId || !userId || !inviteLink) {
        messageEl.textContent = 'Error: Invalid or expired link. (Code: 2)';
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

        // --- THE RELIABLE REDIRECT FLOW ---

        // 1. Give immediate visual feedback and disable the button
        holdBtnText.textContent = 'Verified!';
        messageEl.textContent = 'Redirecting you to the group...';
        messageEl.className = 'success';
        holdBtn.style.pointerEvents = 'none';
        holdBtn.classList.remove('is-holding');

        // 2. Send the data to the bot.
        const dataToSend = JSON.stringify({
            status: "verified",
            chat_id: chatId,
            user_id: userId
        });
        tg.sendData(dataToSend);

        // 3. Redirect the browser to the invite link after a short delay.
        setTimeout(() => {
            window.location.href = inviteLink;
        }, 750); // 0.75-second delay
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
