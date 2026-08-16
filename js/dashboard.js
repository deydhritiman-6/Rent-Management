document.addEventListener('DOMContentLoaded', function () {
    // View All button -> Payments page
    const viewAll = document.querySelector('.view-button');
    if (viewAll) {
        viewAll.addEventListener('click', function () {
            window.location.href = 'payments.html';
        });
    }

    // Make recent payments rows clickable -> Payments page
    document.querySelectorAll('.panel table tbody tr').forEach(function (tr) {
        tr.style.cursor = 'pointer';
        tr.addEventListener('click', function () {
            window.location.href = 'payments.html';
        });
    });

    // Make due items clickable -> Rent Collection page
    document.querySelectorAll('.due-item').forEach(function (item) {
        item.style.cursor = 'pointer';
        item.addEventListener('click', function () {
            window.location.href = 'rent-collection.html';
        });
    });

    // WhatsApp number button
    const waBtn = document.getElementById('whatsappButton');
    if (!waBtn) return;

    waBtn.addEventListener('click', function () {
        // Try to get stored number
        let stored = localStorage.getItem('whatsappNumber') || '';
        const promptMsg = 'Enter WhatsApp number (with country code, e.g. 919812345678)';
        const num = window.prompt(promptMsg, stored);
        if (!num) return;
        // Normalize: remove spaces, dashes, parentheses, plus
        const cleaned = num.replace(/[^0-9]/g, '');
        if (!cleaned) {
            alert('Please enter a valid phone number containing digits.');
            return;
        }
        localStorage.setItem('whatsappNumber', cleaned);
        // Open WhatsApp Web to send a message
        const defaultMessage = 'Hello from Rent Management. I would like to discuss my rent.';
        const waUrl = 'https://wa.me/' + cleaned + '?text=' + encodeURIComponent(defaultMessage);
        window.open(waUrl, '_blank');
    });
});
