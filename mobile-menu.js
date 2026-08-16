(function () {
    function initMobileMenu() {
        const sidebar = document.querySelector(".sidebar");
        const mainContent = document.querySelector(".main-content");

        if (!sidebar || !mainContent) return;
        if (document.querySelector(".mobile-menu-button")) return;

        const overlay = document.createElement("div");
        overlay.className = "mobile-menu-overlay";
        overlay.setAttribute("aria-hidden", "true");
        document.body.appendChild(overlay);

        const button = document.createElement("button");
        button.type = "button";
        button.className = "mobile-menu-button";
        button.setAttribute("aria-label", "Open navigation menu");
        button.setAttribute("aria-expanded", "false");
        button.innerHTML = "☰";

        const topbar = document.querySelector(".topbar");

        if (topbar) {
            topbar.insertBefore(button, topbar.firstChild);
        } else {
            mainContent.insertBefore(button, mainContent.firstChild);
        }

        function openMenu() {
            document.body.classList.add("mobile-menu-open");
            button.setAttribute("aria-expanded", "true");
            button.setAttribute("aria-label", "Close navigation menu");
            button.innerHTML = "✕";
        }

        function closeMenu() {
            document.body.classList.remove("mobile-menu-open");
            button.setAttribute("aria-expanded", "false");
            button.setAttribute("aria-label", "Open navigation menu");
            button.innerHTML = "☰";
        }

        button.addEventListener("click", function () {
            if (document.body.classList.contains("mobile-menu-open")) {
                closeMenu();
            } else {
                openMenu();
            }
        });

        overlay.addEventListener("click", closeMenu);

        sidebar.querySelectorAll("a.nav-item").forEach(function (link) {
            link.addEventListener("click", closeMenu);
        });

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape") {
                closeMenu();
            }
        });

        window.addEventListener("resize", function () {
            if (window.innerWidth > 768) {
                closeMenu();
            }
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initMobileMenu);
    } else {
        initMobileMenu();
    }
})();
