document.addEventListener('DOMContentLoaded', function () {
    const btn = document.getElementById('setWhatsAppNumberBtn');
    if (!btn) return;

    function updateButtonTitle() {
        const stored = localStorage.getItem('whatsappNumber') || '';
        btn.title = stored ? ('WhatsApp number: ' + stored) : 'Set WhatsApp number';
        btn.textContent = stored ? '📱 WhatsApp: ' + stored : '📱 Set WhatsApp Number';
    }

    btn.addEventListener('click', function () {
        const existing = localStorage.getItem('whatsappNumber') || '';
        const promptMsg = 'Enter WhatsApp number (with country code, e.g. 919812345678)';
        const num = window.prompt(promptMsg, existing);
        if (!num) return;
        const cleaned = num.replace(/[^0-9]/g, '');
        if (!cleaned) {
            alert('Please enter a valid phone number containing digits.');
            return;
        }
        localStorage.setItem('whatsappNumber', cleaned);
        updateButtonTitle();
    });

    updateButtonTitle();
});
