document.addEventListener('DOMContentLoaded', () => {
    // Ensure the Telegram Web App is ready before executing any code
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
    }

    const holdButton = document.getElementById('hold-btn');
    const messageElement = document.getElementById('message');
    
    let holdTimeout = null;
    const holdDuration = 5000; // 5 seconds
    let isVerified = false;

    // --- Event Handlers ---

    const startHold = (event) => {
        // Prevent default actions like text selection or context menu
        event.preventDefault();
        
        // Do nothing if already verified
        if (isVerified) return;

        // Add class to start the CSS animation and set the timer
        holdButton.classList.add('is-holding');
        messageElement.textContent = 'Keep holding...';
        messageElement.className = 'message-area';

        // Set a timeout to trigger verification success
        holdTimeout = setTimeout(verificationSuccess, holdDuration);
    };

    const cancelHold = () => {
        // Do nothing if already verified
        if (isVerified) return;

        // Clear the timer and reset the button's visual state
        clearTimeout(holdTimeout);
        holdButton.classList.remove('is-holding');
        
        // Provide feedback if the user released too early
        if (messageElement.textContent === 'Keep holding...') {
            messageElement.textContent = 'Released too soon. Try again.';
            messageElement.className = 'message-area error';
        }
    };

    const verificationSuccess = () => {
        if (isVerified) return;
        isVerified = true;

        // Provide success feedback to the user
        messageElement.textContent = '✅ Verified!';
        messageElement.className = 'message-area success';
        holdButton.setAttribute('disabled', 'true'); // Disable the button
        holdButton.querySelector('span').textContent = 'Completed';

        // Send data to the Telegram bot
        try {
            const dataToSend = JSON.stringify({ status: 'verified' });
            window.Telegram.WebApp.sendData(dataToSend);
            
            // Close the web app after a short delay
            setTimeout(() => {
                window.Telegram.WebApp.close();
            }, 1500);

        } catch (error) {
            console.error('Error sending data to Telegram:', error);
            messageElement.textContent = 'Error sending data. Please try again.';
            messageElement.className = 'message-area error';
            isVerified = false; // Allow retry
            holdButton.removeAttribute('disabled');
        }
    };

    // --- Attach Event Listeners ---

    // For mouse users
    holdButton.addEventListener('mousedown', startHold);
    holdButton.addEventListener('mouseup', cancelHold);
    holdButton.addEventListener('mouseleave', cancelHold); // Cancel if mouse leaves the button

    // For touch screen users
    holdButton.addEventListener('touchstart', startHold, { passive: false });
    holdButton.addEventListener('touchend', cancelHold);
    holdButton.addEventListener('touchcancel', cancelHold);

    // Prevent context menu on long press (mobile)
    holdButton.addEventListener('contextmenu', (e) => e.preventDefault());
});
