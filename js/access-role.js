const ACCESS_PERMISSION_LIBRARY = {
    'dashboard.view': 'Dashboard → View Dashboard',
    'dashboard.manage': 'Dashboard → Manage Dashboard',
    'properties.view': 'Properties → View Properties',
    'properties.add': 'Properties → Add Property',
    'properties.edit': 'Properties → Edit Property',
    'properties.delete': 'Properties → Delete Property',
    'properties.details': 'Properties → View Property Details',
    'licensees.view': 'licensees → View licensees',
    'licensees.add': 'licensees → Add licensee',
    'licensees.edit': 'licensees → Edit licensee',
    'licensees.delete': 'licensees → Delete licensee',
    'payments.view': 'Payments → View Payments',
    'payments.add': 'Payments → Add Payment',
    'payments.edit': 'Payments → Edit Payment',
    'payments.delete': 'Payments → Delete Payment',
    'payments.reports': 'Payments → View Payment Reports',
    'rent.view': 'Rent → View Rent',
    'rent.record': 'Rent → Record Rent',
    'rent.edit': 'Rent → Edit Rent',
    'rent.delete': 'Rent → Delete Rent',
    'reminders.view': 'Reminders → View Reminders',
    'reminders.create': 'Reminders → Create Reminder',
    'reminders.edit': 'Reminders → Edit Reminder',
    'reminders.delete': 'Reminders → Delete Reminder',
    'reports.view': 'Reports → View Reports',
    'reports.export': 'Reports → Export Reports',
    'access_roles.view': 'Access Role → View Users',
    'access_roles.create_user': 'Access Role → Create User',
    'access_roles.edit_user': 'Access Role → Edit User',
    'access_roles.disable_user': 'Access Role → Disable User',
    'access_roles.create_role': 'Access Role → Create Role',
    'access_roles.edit_role': 'Access Role → Edit Role',
    'access_roles.delete_role': 'Access Role → Delete Role',
    'access_roles.assign_permissions': 'Access Role → Assign Permissions',
    'settings.view': 'Settings → View Settings',
    'settings.edit': 'Settings → Edit Settings'
};

function getPermissionList() {
    return Object.keys(ACCESS_PERMISSION_LIBRARY).sort();
}

function getCurrentUserName() {
    const current = window.RentAuth && window.RentAuth.getCurrentUser ? window.RentAuth.getCurrentUser() : null;
    return current ? current.name : 'Administrator';
}

function renderSummary() {
    const users = window.RentAuth.getUsers();
    const roles = window.RentAuth.getRoles();
    const audit = JSON.parse(localStorage.getItem('rentAuditLogs') || '[]');
    const activeSuperAdmins = users.filter(function (user) {
        return user.role === 'Super Admin' && user.status === 'Active';
    });

    document.getElementById('userCountValue').textContent = users.length;
    document.getElementById('roleCountValue').textContent = roles.length;
    document.getElementById('permissionCountValue').textContent = getPermissionList().length;
    document.getElementById('superAdminCountValue').textContent = activeSuperAdmins.length;
    document.getElementById('auditCountValue').textContent = audit.length;
    document.getElementById('sessionRoleValue').textContent = (window.RentAuth.getCurrentUser() || {}).role || '-';
}

function renderUsers() {
    const users = window.RentAuth.getUsers();
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    tbody.innerHTML = users.map(function (user) {
        const currentSession = window.RentAuth.getCurrentUser();
        const canEdit = currentSession && (currentSession.role === 'Super Admin' || currentSession.id === user.id);
        return `
            <tr>
                <td><strong>${user.name}</strong></td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td><span class="access-tag">${user.status}</span></td>
                <td>${user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</td>
                <td>
                    <button type="button" class="inline-action-btn view" data-user-action="view" data-user-id="${user.id}">View</button>
                    ${canEdit ? `<button type="button" class="inline-action-btn edit" data-user-action="edit" data-user-id="${user.id}">Edit</button>` : ''}
                    <button type="button" class="inline-action-btn disable" data-user-action="toggle-status" data-user-id="${user.id}">${user.status === 'Disabled' ? 'Enable' : 'Disable'}</button>
                </td>
            </tr>
        `;
    }).join('');

    tbody.querySelectorAll('[data-user-action]').forEach(function (button) {
        button.addEventListener('click', function () {
            const action = button.getAttribute('data-user-action');
            const userId = button.getAttribute('data-user-id');
            if (action === 'view') {
                const user = window.RentAuth.getUsers().find(function (entry) {
                    return entry.id === userId;
                });
                if (user) {
                    alert(`${user.name}\n${user.email}\nRole: ${user.role}\nStatus: ${user.status}`);
                }
                return;
            }
            if (action === 'edit') {
                openUserModal(userId);
                return;
            }
            if (action === 'toggle-status') {
                toggleUserStatus(userId);
            }
        });
    });
}

function renderRoles() {
    const roles = window.RentAuth.getRoles();
    const container = document.getElementById('rolesList');
    if (!container) return;

    container.innerHTML = roles.map(function (role) {
        const permissions = Object.keys(role.permissions || {}).filter(function (key) {
            return role.permissions[key];
        });
        const label = permissions.length ? permissions.slice(0, 4).join(', ') : 'No explicit permissions';
        return `
            <div class="role-pill">
                <div>
                    <strong>${role.name}</strong>
                    <small>${role.description || 'Role access profile'}</small>
                </div>
                <div>
                    <button type="button" class="inline-action-btn edit" data-role-action="edit" data-role-id="${role.id}">Edit</button>
                </div>
            </div>
        `;
    }).join('');

    container.querySelectorAll('[data-role-action]').forEach(function (button) {
        button.addEventListener('click', function () {
            openRoleModal(button.getAttribute('data-role-id'));
        });
    });
}

function renderPermissions() {
    const list = document.getElementById('permissionsList');
    if (!list) return;

    const permissions = getPermissionList();
    const currentUser = window.RentAuth.getCurrentUser();
    const userPermissions = currentUser ? window.RentAuth.getEffectivePermissions(currentUser) : {};

    list.innerHTML = permissions.map(function (key) {
        const checked = !!userPermissions[key];
        return `
            <label class="permission-item">
                <span>${ACCESS_PERMISSION_LIBRARY[key]}</span>
                <input type="checkbox" ${checked ? 'checked' : ''} disabled>
            </label>
        `;
    }).join('');
}

function renderAccessMatrix() {
    const table = document.getElementById('accessMatrixTable');
    if (!table) return;

    const roles = window.RentAuth.getRoles();
    const modules = [
        { label: 'Dashboard', permissions: ['dashboard.view'], key: 'dashboard' },
        { label: 'Properties', permissions: ['properties.view'], key: 'properties' },
        { label: 'licensees', permissions: ['licensees.view'], key: 'licensees' },
        { label: 'Payments', permissions: ['payments.view'], key: 'payments' },
        { label: 'Reports', permissions: ['reports.view'], key: 'reports' },
        { label: 'Reminders', permissions: ['reminders.view'], key: 'reminders' },
        { label: 'Access Role', permissions: ['access_roles.view'], key: 'access_roles' },
        { label: 'Settings', permissions: ['settings.view'], key: 'settings' }
    ];

    const headers = ['Module', ...roles.map(function (role) { return role.name; })];
    const rows = modules.map(function (module) {
        const values = roles.map(function (role) {
            const perms = role.permissions || {};
            const permissionAllowed = module.permissions.some(function (key) {
                return !!perms[key];
            });
            return permissionAllowed ? '✓' : '—';
        });
        return `<tr><td>${module.label}</td>${values.map(function (value) { return '<td>' + value + '</td>'; }).join('')}</tr>`;
    }).join('');

    table.innerHTML = '<thead><tr>' + headers.map(function (header) { return '<th>' + header + '</th>'; }).join('') + '</tr></thead><tbody>' + rows + '</tbody>';
}

function populateRoleSelects() {
    const roles = window.RentAuth.getRoles();
    const roleSelects = document.querySelectorAll('#userRole');
    roleSelects.forEach(function (select) {
        select.innerHTML = roles.map(function (role) {
            return `<option value="${role.name}">${role.name}</option>`;
        }).join('');
    });
}

function getAllPermissionCheckboxes(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return {};
    const values = {};
    container.querySelectorAll('input[type="checkbox"]').forEach(function (input) {
        values[input.name] = input.checked;
    });
    return values;
}

function createPermissionSelector(targetId, selectedPermissions) {
    const container = document.getElementById(targetId);
    if (!container) return;

    const permissionKeys = getPermissionList();
    container.innerHTML = permissionKeys.map(function (key) {
        const isChecked = !!(selectedPermissions && selectedPermissions[key]);
        return `
            <label class="permission-item">
                <span>${ACCESS_PERMISSION_LIBRARY[key]}</span>
                <input type="checkbox" name="${key}" ${isChecked ? 'checked' : ''}>
            </label>
        `;
    }).join('');
}

function openUserModal(userId) {
    const modal = document.getElementById('userFormModal');
    const form = document.getElementById('userForm');
    const userRole = document.getElementById('userRole');
    const currentUser = window.RentAuth.getCurrentUser();
    const users = window.RentAuth.getUsers();
    const user = users.find(function (entry) {
        return entry.id === userId;
    });
    populateRoleSelects();

    if (user) {
        document.getElementById('userFormTitle').textContent = 'Edit User';
        document.getElementById('userName').value = user.name;
        document.getElementById('userEmail').value = user.email;
        document.getElementById('userPhone').value = user.phone || '';
        document.getElementById('userStatus').value = user.status || 'Active';
        userRole.value = user.role;
        document.getElementById('userPassword').value = '';
        document.getElementById('userPassword').placeholder = 'Leave blank to keep current password';
        createPermissionSelector('userPermissionList', user.permissions || window.RentAuth.getEffectivePermissions(user));
        form.dataset.mode = 'edit';
        form.dataset.userId = user.id;
    } else {
        document.getElementById('userFormTitle').textContent = 'Create User';
        document.getElementById('userForm').reset();
        document.getElementById('userPassword').placeholder = 'Set a password';
        document.getElementById('userStatus').value = 'Active';
        const defaultRole = window.RentAuth.getRoles()[0] ? window.RentAuth.getRoles()[0].name : 'Manager';
        userRole.value = defaultRole;
        createPermissionSelector('userPermissionList', window.RentAuth.getRoles().find(function (role) {
            return role.name === defaultRole;
        })?.permissions || {});
        form.dataset.mode = 'create';
        form.dataset.userId = '';
    }

    if (currentUser && currentUser.role !== 'Super Admin') {
        document.getElementById('userRole').value = currentUser.role;
        document.getElementById('userRole').disabled = true;
    } else {
        document.getElementById('userRole').disabled = false;
    }

    modal.style.display = 'flex';
}

function openRoleModal(roleId) {
    const modal = document.getElementById('roleFormModal');
    const roles = window.RentAuth.getRoles();
    const role = roles.find(function (entry) {
        return entry.id === roleId;
    });

    if (role) {
        document.getElementById('roleFormTitle').textContent = 'Edit Role';
        document.getElementById('roleName').value = role.name;
        document.getElementById('roleDescription').value = role.description || '';
        createPermissionSelector('rolePermissionList', role.permissions || {});
        document.getElementById('roleForm').dataset.mode = 'edit';
        document.getElementById('roleForm').dataset.roleId = role.id;
    } else {
        document.getElementById('roleFormTitle').textContent = 'Create New Role';
        document.getElementById('roleForm').reset();
        createPermissionSelector('rolePermissionList', {});
        document.getElementById('roleForm').dataset.mode = 'create';
        document.getElementById('roleForm').dataset.roleId = '';
    }

    modal.style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function toggleUserStatus(userId) {
    const users = window.RentAuth.getUsers();
    const user = users.find(function (entry) {
        return entry.id === userId;
    });
    if (!user) return;

    const currentUser = window.RentAuth.getCurrentUser();
    if (currentUser && user.id === currentUser.id && user.role === 'Super Admin') {
        alert('You cannot disable your own Super Admin account.');
        return;
    }

    user.status = user.status === 'Disabled' ? 'Active' : 'Disabled';
    window.RentAuth.setUsers(users);
    window.RentAuth.logAudit('User status updated', 'Access Role', `${user.name} status changed to ${user.status}.`, user.id);
    renderUsers();
    renderSummary();
}

function applyUserPermissionOverrides(user, permissionInputs) {
    const permissions = {};
    Object.keys(permissionInputs).forEach(function (key) {
        permissions[key] = !!permissionInputs[key];
    });
    user.permissions = permissions;
    return user;
}

function saveUserFromForm(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const currentUser = window.RentAuth.getCurrentUser();
    const users = window.RentAuth.getUsers();
    const name = document.getElementById('userName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const role = document.getElementById('userRole').value;
    const status = document.getElementById('userStatus').value;
    const phone = document.getElementById('userPhone').value.trim();
    const password = document.getElementById('userPassword').value.trim();
    const permissionInputs = getAllPermissionCheckboxes('userPermissionList');

    if (!name || !email) {
        alert('Name and email are required.');
        return;
    }

    if (currentUser && currentUser.role !== 'Super Admin' && role === 'Super Admin') {
        alert('Only a Super Admin can assign the Super Admin role.');
        return;
    }

    if (form.dataset.mode === 'edit') {
        const user = users.find(function (entry) {
            return entry.id === form.dataset.userId;
        });
        if (!user) return;
        user.name = name;
        user.email = email;
        user.phone = phone;
        user.role = role;
        user.status = status;
        if (password) {
            user.password = password;
        }
        applyUserPermissionOverrides(user, permissionInputs);
        window.RentAuth.setUsers(users);
        window.RentAuth.logAudit('User updated', 'Access Role', `${name} profile updated.`, user.id);
    } else {
        if (users.some(function (entry) {
            return entry.email.toLowerCase() === email.toLowerCase();
        })) {
            alert('A user with that email already exists.');
            return;
        }
        const newUser = {
            id: 'user-' + Date.now(),
            name: name,
            email: email,
            phone: phone,
            role: role,
            status: status,
            password: password || 'welcome123',
            createdAt: new Date().toISOString(),
            lastLogin: '',
            permissions: permissionInputs
        };
        users.push(newUser);
        window.RentAuth.setUsers(users);
        window.RentAuth.logAudit('User created', 'Access Role', `${name} was created with role ${role}.`, newUser.id);
    }

    closeModal('userFormModal');
    renderUsers();
    renderSummary();
    renderPermissions();
    renderRoles();
    renderAccessMatrix();
    form.reset();
}

function saveRoleFromForm(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const roles = window.RentAuth.getRoles();
    const name = document.getElementById('roleName').value.trim();
    const description = document.getElementById('roleDescription').value.trim();
    const permissionInputs = getAllPermissionCheckboxes('rolePermissionList');

    if (!name) {
        alert('Role name is required.');
        return;
    }

    if (form.dataset.mode === 'edit') {
        const role = roles.find(function (entry) {
            return entry.id === form.dataset.roleId;
        });
        if (!role) return;
        role.name = name;
        role.description = description;
        role.permissions = permissionInputs;
        window.RentAuth.setRoles(roles);
        window.RentAuth.logAudit('Role updated', 'Access Role', `Role ${name} was updated.`, role.id);
    } else {
        if (roles.some(function (entry) {
            return entry.name.toLowerCase() === name.toLowerCase();
        })) {
            alert('A role with that name already exists.');
            return;
        }
        const newRole = {
            id: 'role-' + Date.now(),
            name: name,
            description: description,
            permissions: permissionInputs,
            createdAt: new Date().toISOString()
        };
        roles.push(newRole);
        window.RentAuth.setRoles(roles);
        window.RentAuth.logAudit('Role created', 'Access Role', `Role ${name} was created.`, newRole.id);
    }

    closeModal('roleFormModal');
    renderRoles();
    renderAccessMatrix();
    renderSummary();
    populateRoleSelects();
    form.reset();
}

function bindPageActions() {
    document.getElementById('openUserFormBtn').addEventListener('click', function () {
        openUserModal('');
    });

    document.getElementById('openRoleFormBtn').addEventListener('click', function () {
        openRoleModal('');
    });

    document.getElementById('cancelUserBtn').addEventListener('click', function () {
        closeModal('userFormModal');
    });

    document.getElementById('cancelRoleBtn').addEventListener('click', function () {
        closeModal('roleFormModal');
    });

    document.getElementById('userForm').addEventListener('submit', saveUserFromForm);
    document.getElementById('roleForm').addEventListener('submit', saveRoleFromForm);
    document.getElementById('userRole').addEventListener('change', function () {
        const selectedRole = this.value;
        const roles = window.RentAuth.getRoles();
        const role = roles.find(function (entry) {
            return entry.name === selectedRole;
        });
        if (role) {
            createPermissionSelector('userPermissionList', role.permissions || {});
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    if (!window.RentAuth || !window.RentAuth.getCurrentUser) {
        return;
    }

    populateRoleSelects();
    createPermissionSelector('userPermissionList', {});
    createPermissionSelector('rolePermissionList', {});
    bindPageActions();
    renderSummary();
    renderUsers();
    renderRoles();
    renderPermissions();
    renderAccessMatrix();
});
