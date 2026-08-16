(function () {
    const STORAGE_KEYS = {
        users: 'rentUsers',
        roles: 'rentRoles',
        session: 'rentSession',
        audit: 'rentAuditLogs'
    };

    const PAGE_PERMISSION_MAP = {
        'index.html': 'dashboard.view',
        'properties.html': 'properties.view',
        'tenants.html': 'tenants.view',
        'rent-collection.html': 'rent.view',
        'payments.html': 'payments.view',
        'reports.html': 'reports.view',
        'reminders.html': 'reminders.view',
        'settings.html': 'settings.view',
        'access-role.html': 'access_roles.view',
        'brokers.html': 'properties.view',
        'maintenance.html': 'properties.view',
        'rent-agreement.html': 'rent.view'
    };

    const DEFAULT_ROLES = {
        'Super Admin': {
            description: 'Full system access.',
            permissions: {
                'dashboard.view': true,
                'dashboard.manage': true,
                'properties.view': true,
                'properties.add': true,
                'properties.edit': true,
                'properties.delete': true,
                'properties.details': true,
                'tenants.view': true,
                'tenants.add': true,
                'tenants.edit': true,
                'tenants.delete': true,
                'payments.view': true,
                'payments.add': true,
                'payments.edit': true,
                'payments.delete': true,
                'payments.reports': true,
                'rent.view': true,
                'rent.record': true,
                'rent.edit': true,
                'rent.delete': true,
                'reminders.view': true,
                'reminders.create': true,
                'reminders.edit': true,
                'reminders.delete': true,
                'reports.view': true,
                'reports.export': true,
                'access_roles.view': true,
                'access_roles.create_user': true,
                'access_roles.edit_user': true,
                'access_roles.disable_user': true,
                'access_roles.create_role': true,
                'access_roles.edit_role': true,
                'access_roles.delete_role': true,
                'access_roles.assign_permissions': true,
                'settings.view': true,
                'settings.edit': true
            }
        },
        Admin: {
            description: 'Administrative access according to assigned permissions.',
            permissions: {
                'dashboard.view': true,
                'properties.view': true,
                'properties.add': true,
                'properties.edit': true,
                'tenants.view': true,
                'tenants.add': true,
                'tenants.edit': true,
                'payments.view': true,
                'payments.add': true,
                'payments.edit': true,
                'payments.reports': true,
                'rent.view': true,
                'rent.record': true,
                'rent.edit': true,
                'reminders.view': true,
                'reminders.create': true,
                'reminders.edit': true,
                'reports.view': true,
                'reports.export': true,
                'settings.view': true,
                'settings.edit': true
            }
        },
        Manager: {
            description: 'Access to operational modules.',
            permissions: {
                'dashboard.view': true,
                'properties.view': true,
                'properties.add': true,
                'properties.edit': true,
                'tenants.view': true,
                'tenants.add': true,
                'tenants.edit': true,
                'payments.view': true,
                'payments.add': true,
                'payments.edit': true,
                'rent.view': true,
                'rent.record': true,
                'reminders.view': true,
                'reminders.create': true,
                'reports.view': true,
                'reports.export': false,
                'settings.view': false
            }
        },
        Staff: {
            description: 'Limited operational access.',
            permissions: {
                'dashboard.view': true,
                'properties.view': true,
                'tenants.view': true,
                'payments.view': true,
                'rent.view': true,
                'reminders.view': true,
                'reports.view': false,
                'settings.view': false,
                'properties.add': false,
                'tenants.add': false,
                'payments.add': false,
                'rent.record': false,
                'reminders.create': false
            }
        }
    };

    function clone(data) {
        return JSON.parse(JSON.stringify(data));
    }

    function ensureDefaultSeedData() {
        const roles = JSON.parse(localStorage.getItem(STORAGE_KEYS.roles) || 'null');
        if (!roles || !roles.length) {
            const builtRoles = Object.keys(DEFAULT_ROLES).map(function (name) {
                return {
                    id: createId('role'),
                    name: name,
                    description: DEFAULT_ROLES[name].description,
                    permissions: clone(DEFAULT_ROLES[name].permissions),
                    createdAt: new Date().toISOString()
                };
            });
            localStorage.setItem(STORAGE_KEYS.roles, JSON.stringify(builtRoles));
        }

        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || 'null');
        if (!users || !users.length) {
            const seededUsers = [
                {
                    id: createId('user'),
                    name: 'Super Admin',
                    email: 'admin@example.com',
                    phone: '+91 98765 43210',
                    role: 'Super Admin',
                    status: 'Active',
                    password: 'admin123',
                    createdAt: new Date().toISOString(),
                    lastLogin: '',
                    permissions: {}
                },
                {
                    id: createId('user'),
                    name: 'Manager User',
                    email: 'manager@example.com',
                    phone: '+91 91234 56789',
                    role: 'Manager',
                    status: 'Active',
                    password: 'manager123',
                    createdAt: new Date().toISOString(),
                    lastLogin: '',
                    permissions: {}
                },
                {
                    id: createId('user'),
                    name: 'Staff User',
                    email: 'staff@example.com',
                    phone: '+91 99887 76543',
                    role: 'Staff',
                    status: 'Active',
                    password: 'staff123',
                    createdAt: new Date().toISOString(),
                    lastLogin: '',
                    permissions: {}
                }
            ];
            localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(seededUsers));
        }
    }

    function createId(prefix) {
        return prefix + '-' + Date.now() + '-' + Math.random().toString(16).slice(2, 9);
    }

    function getUsers() {
        ensureDefaultSeedData();
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || '[]');
    }

    function setUsers(users) {
        localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
    }

    function getRoles() {
        ensureDefaultSeedData();
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.roles) || '[]');
    }

    function setRoles(roles) {
        localStorage.setItem(STORAGE_KEYS.roles, JSON.stringify(roles));
    }

    function getCurrentUser() {
        ensureDefaultSeedData();
        const session = JSON.parse(localStorage.getItem(STORAGE_KEYS.session) || 'null');
        if (!session || !session.email) {
            return null;
        }
        const users = getUsers();
        const current = users.find(function (user) {
            return user.email.toLowerCase() === session.email.toLowerCase();
        });
        if (!current) {
            return null;
        }
        return current;
    }

    function getCurrentUserPermissionMap() {
        const user = getCurrentUser();
        if (!user) {
            return {};
        }
        return getEffectivePermissions(user);
    }

    function getRolePermissions(roleName) {
        const roles = getRoles();
        const role = roles.find(function (candidate) {
            return candidate.name === roleName;
        });
        return role ? clone(role.permissions || {}) : {};
    }

    function getEffectivePermissions(user) {
        const merged = {};
        const rolePermissions = getRolePermissions(user.role || 'Staff');
        Object.keys(rolePermissions).forEach(function (key) {
            merged[key] = !!rolePermissions[key];
        });

        if (user.permissions && typeof user.permissions === 'object') {
            Object.keys(user.permissions).forEach(function (key) {
                merged[key] = !!user.permissions[key];
            });
        }

        return merged;
    }

    function normalizeDisplayName(value) {
        return value || 'User';
    }

    function isSuperAdmin(user) {
        return (user && user.role === 'Super Admin');
    }

    function hasPermission(permissionKey) {
        const user = getCurrentUser();
        if (!user) {
            return false;
        }
        if (isSuperAdmin(user)) {
            return true;
        }
        return !!getEffectivePermissions(user)[permissionKey];
    }

    function canAccessPage(pageName) {
        const permissionKey = PAGE_PERMISSION_MAP[pageName];
        if (!permissionKey) {
            return true;
        }
        return hasPermission(permissionKey);
    }

    function getPageFilename() {
        const page = window.location.pathname.split('/').pop() || 'index.html';
        return page;
    }

    function determineLoginRedirect() {
        const user = getCurrentUser();
        if (!user) {
            if (window.location.pathname.split('/').pop() !== 'login.html') {
                window.location.href = 'login.html';
            }
            return false;
        }
        return true;
    }

    function buildAccessDeniedContent() {
        return '<div class="access-denied-card">' +
            '<h2>Access Denied</h2>' +
            '<p>You do not have permission to access this page.</p>' +
            '<button type="button" class="btn primary-btn" onclick="window.location.href=\'index.html\'">Go to Dashboard</button>' +
            '</div>';
    }

    function injectAccessDeniedState() {
        const existing = document.getElementById('accessDeniedWrap');
        if (existing) {
            existing.remove();
        }
        const wrapper = document.createElement('div');
        wrapper.id = 'accessDeniedWrap';
        wrapper.className = 'access-denied-wrap';
        wrapper.innerHTML = buildAccessDeniedContent();
        document.body.appendChild(wrapper);
    }

    function protectPage() {
        const currentPage = getPageFilename();
        const permitted = canAccessPage(currentPage);

        if (currentPage === 'login.html') {
            if (getCurrentUser()) {
                window.location.href = 'index.html';
            }
            return;
        }

        if (!getCurrentUser()) {
            window.location.href = 'login.html';
            return;
        }

        if (!permitted) {
            document.body.classList.add('access-denied');
            injectAccessDeniedState();
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.style.display = 'none';
            }
            const appWrapper = document.querySelector('.app');
            if (appWrapper) {
                appWrapper.style.filter = 'grayscale(0.1)';
            }
        }
    }

    function setSession(user) {
        localStorage.setItem(STORAGE_KEYS.session, JSON.stringify({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            lastLogin: new Date().toISOString()
        }));
    }

    function signOut() {
        localStorage.removeItem(STORAGE_KEYS.session);
        window.location.href = 'login.html';
    }

    function logAudit(action, module, details, targetId) {
        const current = getCurrentUser();
        const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.audit) || '[]');
        logs.unshift({
            userId: current ? current.id : 'system',
            userName: current ? current.name : 'System',
            action: action,
            module: module,
            targetId: targetId || '',
            timestamp: new Date().toISOString(),
            details: details || ''
        });
        localStorage.setItem(STORAGE_KEYS.audit, JSON.stringify(logs.slice(0, 200)));
    }

    function updateUserLastLogin(userId) {
        const users = getUsers();
        const target = users.find(function (user) {
            return user.id === userId;
        });
        if (!target) {
            return;
        }
        target.lastLogin = new Date().toISOString();
        setUsers(users);
    }

    function loginUser(email, password) {
        const users = getUsers();
        const found = users.find(function (user) {
            return user.email.toLowerCase() === String(email).trim().toLowerCase();
        });

        if (!found) {
            return { success: false, message: 'Invalid email or password.' };
        }

        if (found.status !== 'Active') {
            return { success: false, message: 'This account is not active.' };
        }

        if (String(found.password) !== String(password)) {
            return { success: false, message: 'Invalid email or password.' };
        }

        setSession(found);
        updateUserLastLogin(found.id);
        logAudit('Login', 'Authentication', 'User logged in successfully.', found.id);
        return { success: true, user: found };
    }

    function getPageAccessItems() {
        const items = [
            { label: 'Dashboard', page: 'index.html', permission: 'dashboard.view' },
            { label: 'Properties', page: 'properties.html', permission: 'properties.view' },
            { label: 'Tenants', page: 'tenants.html', permission: 'tenants.view' },
            { label: 'Rent Collection', page: 'rent-collection.html', permission: 'rent.view' },
            { label: 'Payments', page: 'payments.html', permission: 'payments.view' },
            { label: 'Reports', page: 'reports.html', permission: 'reports.view' },
            { label: 'Reminders', page: 'reminders.html', permission: 'reminders.view' },
            { label: 'Access Role', page: 'access-role.html', permission: 'access_roles.view' },
            { label: 'Settings', page: 'settings.html', permission: 'settings.view' },
            { label: 'Brokers', page: 'brokers.html', permission: 'properties.view' },
            { label: 'Maintenance', page: 'maintenance.html', permission: 'properties.view' },
            { label: 'Rent Agreement', page: 'rent-agreement.html', permission: 'rent.view' }
        ];

        return items.map(function (item) {
            item.visible = hasPermission(item.permission);
            return item;
        });
    }

    function applyNavigationVisibility() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(function (item) {
            const page = item.dataset && item.dataset.page;
            if (!page) {
                return;
            }
            const shouldShow = canAccessPage(page);
            item.style.display = shouldShow ? '' : 'none';
        });

        const currentUser = getCurrentUser();
        const userName = document.querySelector('.admin-profile strong');
        if (userName && currentUser) {
            userName.textContent = currentUser.name || 'Administrator';
        }
    }

    function getUserRoleOptions() {
        return getRoles().map(function (role) {
            return role.name;
        });
    }

    function initAuthUi() {
        const logoutButtons = document.querySelectorAll('[data-action="logout"]');
        logoutButtons.forEach(function (button) {
            button.addEventListener('click', function () {
                logAudit('Logout', 'Authentication', 'User logged out.', getCurrentUser() ? getCurrentUser().id : '');
                signOut();
            });
        });
    }

    const RentAuth = {
        STORAGE_KEYS: STORAGE_KEYS,
        DEFAULT_ROLES: DEFAULT_ROLES,
        getUsers: getUsers,
        getRoles: getRoles,
        setUsers: setUsers,
        setRoles: setRoles,
        getCurrentUser: getCurrentUser,
        loginUser: loginUser,
        signOut: signOut,
        hasPermission: hasPermission,
        canAccessPage: canAccessPage,
        applyNavigationVisibility: applyNavigationVisibility,
        getEffectivePermissions: getEffectivePermissions,
        getUserRoleOptions: getUserRoleOptions,
        logAudit: logAudit,
        ensureDefaultSeedData: ensureDefaultSeedData,
        protectPage: protectPage,
        initAuthUi: initAuthUi,
        getCurrentUserPermissionMap: getCurrentUserPermissionMap,
        getPageAccessItems: getPageAccessItems
    };

    window.RentAuth = RentAuth;

    document.addEventListener('DOMContentLoaded', function () {
        ensureDefaultSeedData();
        initAuthUi();
        const currentPage = getPageFilename();
        if (currentPage === 'login.html') {
            if (getCurrentUser()) {
                window.location.href = 'index.html';
            }
            return;
        }
        protectPage();
        applyNavigationVisibility();
    });
})();
