document.addEventListener('DOMContentLoaded', function () {
    const container = document.getElementById('sidebar-container');
    if (!container) return;

    const sidebarHTML = `
<aside class="sidebar" id="sharedSidebar">

    <div class="logo">

        <div class="logo-icon">
            RM
        </div>

        <div>
            <h2>Rent Management</h2>
            <span>Management System</span>
        </div>

    </div>

    <nav class="navigation">

        <a href="index.html"
           class="nav-item"
           data-page="index.html">
            <span>▦</span>
            Dashboard
        </a>

        <a href="properties.html"
           class="nav-item"
           data-page="properties.html">
            <span>🏢</span>
            Properties
        </a>

        <a href="tenants.html"
           class="nav-item"
           data-page="tenants.html">
            <span>👥</span>
            Tenants
        </a>

        <a href="rent-collection.html"
           class="nav-item"
           data-page="rent-collection.html">
            <span>₹</span>
            Rent Collection
        </a>

        <a href="payments.html"
           class="nav-item"
           data-page="payments.html">
            <span>▤</span>
            Payments
        </a>

        <a href="reports.html"
           class="nav-item"
           data-page="reports.html">
            <span>📊</span>
            Reports
        </a>

        <a href="reminders.html"
           class="nav-item"
           data-page="reminders.html">
            <span>🔔</span>
            Reminders
        </a>

        <a href="settings.html"
           class="nav-item"
           data-page="settings.html">
            <span>⚙️</span>
            Settings
        </a>

    </nav>

    <div class="sidebar-footer">
        <strong>Rent Management</strong>
        <span>Version 1.0</span>
    </div>

</aside>
`;

    container.innerHTML = sidebarHTML;

    // Determine current page file name
    let current = window.location.pathname.split('/').pop();
    if (!current) current = 'index.html';

    const navItems = container.querySelectorAll('.nav-item');
    navItems.forEach(function (item) {
        if (item.dataset && item.dataset.page === current) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Dispatch event so mobile-menu.js can initialize
    try {
        document.dispatchEvent(new CustomEvent('sidebarLoaded'));
    } catch (e) {
        // Fallback
        document.dispatchEvent(new Event('sidebarLoaded'));
    }
});
