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

        // --- THIS IS THE NEW, RELIABLE FLOW ---

        // 1. Give immediate visual feedback
        holdBtnText.textContent = 'Verified!';
        messageEl.textContent = 'Sending confirmation...';
        messageEl.className = 'success';
        
        // 2. Disable the button to prevent multiple clicks
        holdBtn.style.pointerEvents = 'none';
        holdBtn.classList.remove('is-holding'); // Ensure visual state is reset

        // 3. Prepare the data payload
        const dataToSend = JSON.stringify({
            status: "verified",
            chat_id: chatId,
            user_id: userId
        });

        // 4. Send the data to the bot. This is the most critical step.
        tg.sendData(dataToSend);

        // 5. Update the UI to inform the user what to do next.
        // We DO NOT close the window automatically anymore.
        setTimeout(() => {
             holdBtnText.textContent = 'Success!';
             messageEl.textContent = 'Check your private messages with the bot to join the group.';
        }, 1000); // Short delay for better UX
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
