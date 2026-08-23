(function () {
    'use strict';

    function initMobileMenu() {
        const sidebar = document.getElementById('sharedSidebar') || document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');

        if (!sidebar || !mainContent) return;
        if (document.querySelector('.mobile-menu-button')) return;

        let overlay = document.querySelector('.mobile-menu-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'mobile-menu-overlay';
            overlay.setAttribute('aria-hidden', 'true');
            document.body.appendChild(overlay);
        }

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'mobile-menu-button';
        button.setAttribute('aria-label', 'Open navigation menu');
        button.setAttribute('aria-expanded', 'false');
        button.setAttribute('aria-controls', 'sharedSidebar');
        button.innerHTML = '☰';

        const topbar = document.querySelector('.topbar');
        if (topbar) {
            topbar.insertBefore(button, topbar.firstChild);
        } else {
            mainContent.insertBefore(button, mainContent.firstChild);
        }

        function openMenu() {
            document.body.classList.add('mobile-menu-open');
            overlay.setAttribute('aria-hidden', 'false');
            sidebar.setAttribute('aria-hidden', 'false');
            button.setAttribute('aria-expanded', 'true');
            button.setAttribute('aria-label', 'Close navigation menu');
            button.innerHTML = '✕';
        }

        function closeMenu() {
            document.body.classList.remove('mobile-menu-open');
            overlay.setAttribute('aria-hidden', 'true');
            sidebar.setAttribute('aria-hidden', 'true');
            button.setAttribute('aria-expanded', 'false');
            button.setAttribute('aria-label', 'Open navigation menu');
            button.innerHTML = '☰';
        }

        button.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            if (document.body.classList.contains('mobile-menu-open')) {
                closeMenu();
            } else {
                openMenu();
            }
        });

        overlay.addEventListener('click', function (event) {
            event.preventDefault();
            closeMenu();
        });

        // Event delegation keeps navigation working even if the sidebar is re-rendered.
        sidebar.addEventListener('click', function (event) {
            const link = event.target.closest('a.nav-item');
            if (!link) return;
            closeMenu();
            // Do not preventDefault: normal navigation must continue.
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                closeMenu();
            }
        });

        window.addEventListener('resize', function () {
            if (window.innerWidth > 768) {
                closeMenu();
            }
        });

        sidebar.setAttribute('aria-hidden', 'true');
    }

    function start() {
        if (document.getElementById('sharedSidebar') || document.querySelector('.sidebar')) {
            initMobileMenu();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
        start();
    }

    document.addEventListener('sidebarLoaded', initMobileMenu, { once: true });
})();
