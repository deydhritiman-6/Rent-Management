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

    <nav class="navigation" id="sidebarNavigation">

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

        <a href="brokers.html"
           class="nav-item"
           data-page="brokers.html">
            <span>🤝</span>
            Brokers
        </a>

        <a href="maintenance.html"
           class="nav-item"
           data-page="maintenance.html">
            <span>🛠️</span>
            Maintenance
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

        <a href="rent-agreement.html"
           class="nav-item"
           data-page="rent-agreement.html">
            <span>📄</span>
            Rent Agreement
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

        <a href="access-role.html"
           class="nav-item"
           data-page="access-role.html">
            <span>🔐</span>
            Access Role
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

    const navigation = container.querySelector('#sidebarNavigation');
    const navItems = container.querySelectorAll('.nav-item');

    function getCurrentPageName() {
        let current = window.location.pathname.split('/').pop();
        return current || 'index.html';
    }

    function centerActiveNavItem() {
        if (!navigation) return;
        const activeItem = navigation.querySelector('.nav-item.active');
        if (!activeItem) return;

        const navHeight = navigation.clientHeight;
        const itemTop = activeItem.offsetTop;
        const itemHeight = activeItem.offsetHeight;
        const targetTop = Math.max(0, itemTop - (navHeight / 2) + (itemHeight / 2));

        navigation.scrollTo({
            top: targetTop,
            behavior: 'smooth'
        });
    }

    function applyActiveState() {
        const currentPage = getCurrentPageName();
        let activeItem = null;

        navItems.forEach(function (item) {
            const isActive = item.dataset && item.dataset.page === currentPage;
            item.classList.toggle('active', isActive);
            item.setAttribute('aria-current', isActive ? 'page' : 'false');
            if (isActive) {
                activeItem = item;
            }
        });

        if (activeItem) {
            window.requestAnimationFrame(function () {
                centerActiveNavItem();
            });
        }
    }

    navItems.forEach(function (item) {
        item.addEventListener('click', function () {
            navItems.forEach(function (navItem) {
                navItem.classList.toggle('active', navItem === item);
                navItem.setAttribute('aria-current', navItem === item ? 'page' : 'false');
            });

            window.requestAnimationFrame(function () {
                centerActiveNavItem();
            });
        });
    });

    applyActiveState();

    if (window.RentAuth && typeof window.RentAuth.applyNavigationVisibility === 'function') {
        window.RentAuth.applyNavigationVisibility();
        window.requestAnimationFrame(function () {
            applyActiveState();
        });
    }

    // Dispatch event so mobile-menu.js can initialize
    try {
        document.dispatchEvent(new CustomEvent('sidebarLoaded'));
    } catch (e) {
        document.dispatchEvent(new Event('sidebarLoaded'));
    }
});
