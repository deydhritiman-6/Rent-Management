const NotificationService = {
    STORAGE_KEY: 'rentManagementNotifications',
    typeMeta: {
        EMERGENCY: { label: 'Emergency', icon: '🔴', priority: 'critical', actionUrl: 'properties.html' },
        RENT_OVERDUE: { label: 'Rent Overdue', icon: '🟠', priority: 'high', actionUrl: 'payments.html' },
        RENT_DUE: { label: 'Rent Due', icon: '🟡', priority: 'medium', actionUrl: 'rent-collection.html' },
        REMINDER: { label: 'Reminder', icon: '🔵', priority: 'medium', actionUrl: 'reminders.html' },
        MAINTENANCE: { label: 'Maintenance', icon: '🟣', priority: 'medium', actionUrl: 'properties.html' },
        PAYMENT: { label: 'Payment', icon: '🟢', priority: 'low', actionUrl: 'payments.html' },
        INFORMATION: { label: 'Information', icon: '⚪', priority: 'low', actionUrl: 'index.html' }
    },

    getAll: function () {
        try {
            const value = localStorage.getItem(this.STORAGE_KEY);
            return value ? JSON.parse(value) : [];
        } catch (error) {
            return [];
        }
    },

    saveAll: function (items) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    },

    create: function (notification) {
        return {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            propertyId: notification.propertyId || '',
            licenseeId: notification.licenseeId || '',
            paymentId: notification.paymentId || '',
            reminderId: notification.reminderId || '',
            priority: notification.priority || 'medium',
            isRead: Boolean(notification.isRead),
            createdAt: notification.createdAt || new Date().toISOString(),
            dueDate: notification.dueDate || '',
            actionUrl: notification.actionUrl || this.typeMeta[notification.type]?.actionUrl || 'index.html'
        };
    },

    replaceExisting: function (items) {
        const normalized = items.map((item) => this.create(item));
        this.saveAll(normalized);
        return normalized;
    },

    ensureUnique: function (candidate) {
        const items = this.getAll();
        const exists = items.some((item) => item.id === candidate.id || item.id === candidate.notificationId);
        if (exists) {
            return false;
        }
        items.unshift(candidate);
        this.saveAll(items);
        return true;
    },

    markAllRead: function () {
        const items = this.getAll().map((item) => ({ ...item, isRead: true }));
        this.saveAll(items);
    },

    markRead: function (id) {
        const items = this.getAll();
        const updated = items.map((item) => item.id === id ? { ...item, isRead: true } : item);
        this.saveAll(updated);
    },

    getUnreadCount: function () {
        return this.getAll().filter((item) => !item.isRead).length;
    },

    getSummaryCounts: function () {
        const counts = {
            EMERGENCY: 0,
            RENT_OVERDUE: 0,
            RENT_DUE: 0,
            REMINDER: 0,
            MAINTENANCE: 0,
            PAYMENT: 0,
            INFORMATION: 0
        };

        this.getAll().forEach((item) => {
            if (counts[item.type] !== undefined) {
                counts[item.type] += 1;
            }
        });

        return counts;
    },

    getPriorityRank: function (type) {
        const order = ['EMERGENCY', 'RENT_OVERDUE', 'RENT_DUE', 'MAINTENANCE', 'REMINDER', 'PAYMENT', 'INFORMATION'];
        return order.indexOf(type);
    },

    sort: function (items) {
        return [...items].sort((a, b) => {
            const rankDiff = this.getPriorityRank(a.type) - this.getPriorityRank(b.type);
            if (rankDiff !== 0) {
                return rankDiff;
            }
            const aDate = new Date(a.createdAt).getTime();
            const bDate = new Date(b.createdAt).getTime();
            return bDate - aDate;
        });
    },

    generateCandidates: function () {
        const now = new Date();
        const candidates = [];

        const paymentList = JSON.parse(localStorage.getItem('rentPayments') || '[]');
        const propertyList = JSON.parse(localStorage.getItem('rentProperties') || '[]');
        const licenseeList = JSON.parse(localStorage.getItem('rentlicensees') || '[]');

        paymentList.forEach((payment) => {
            if (!payment || !payment.property || !payment.licensee) {
                return;
            }

            const dueDate = payment.dueDate ? new Date(payment.dueDate) : null;
            const status = String(payment.status || '').toLowerCase();
            const overdue = payment.amountDue && Number(payment.amountDue) > 0 && dueDate && dueDate < now && status !== 'paid';
            const dueSoon = dueDate && payment.amountDue && Number(payment.amountDue) > 0 && status !== 'paid' && !overdue;
            const dueDays = dueDate ? Math.ceil((dueDate.getTime() - now.getTime()) / 86400000) : null;

            if (overdue) {
                candidates.push(this.create({
                    id: `RENT_OVERDUE_${payment.property}_${payment.licensee}_${payment.dueDate || 'unknown'}`,
                    type: 'RENT_OVERDUE',
                    title: 'Rent overdue',
                    message: `${payment.property} rent is overdue for ${payment.licensee}.`,
                    propertyId: payment.propertyId || payment.property,
                    licenseeId: payment.licenseeId || payment.licensee,
                    paymentId: payment.id || payment.paymentId || '',
                    priority: 'high',
                    isRead: false,
                    createdAt: new Date().toISOString(),
                    dueDate: payment.dueDate || '',
                    actionUrl: 'payments.html'
                }));
            } else if (dueSoon && dueDays !== null && dueDays <= 3) {
                candidates.push(this.create({
                    id: `RENT_DUE_${payment.property}_${payment.licensee}_${payment.dueDate || 'unknown'}`,
                    type: 'RENT_DUE',
                    title: dueDays === 0 ? 'Rent due today' : 'Rent due soon',
                    message: `${payment.property} rent is due ${dueDays === 0 ? 'today' : 'in ' + dueDays + ' days'} for ${payment.licensee}.`,
                    propertyId: payment.propertyId || payment.property,
                    licenseeId: payment.licenseeId || payment.licensee,
                    paymentId: payment.id || payment.paymentId || '',
                    priority: 'medium',
                    isRead: false,
                    createdAt: new Date().toISOString(),
                    dueDate: payment.dueDate || '',
                    actionUrl: 'rent-collection.html'
                }));
            }

            if (status === 'paid' && payment.amount) {
                candidates.push(this.create({
                    id: `PAYMENT_${payment.property}_${payment.licensee}_${payment.date || 'unknown'}`,
                    type: 'PAYMENT',
                    title: 'Payment received',
                    message: `${payment.licensee} paid ${payment.amount} for ${payment.property}.`,
                    propertyId: payment.propertyId || payment.property,
                    licenseeId: payment.licenseeId || payment.licensee,
                    paymentId: payment.id || payment.paymentId || '',
                    priority: 'low',
                    isRead: false,
                    createdAt: payment.date || new Date().toISOString(),
                    dueDate: payment.dueDate || '',
                    actionUrl: 'payments.html'
                }));
            }
        });

        propertyList.forEach((property) => {
            const maintenance = property.propertyDetails && property.propertyDetails.maintenance;
            if (maintenance && maintenance.status && ['Routine Maintenance Due', 'Under Maintenance', 'Major Repair Required'].includes(maintenance.status)) {
                candidates.push(this.create({
                    id: `MAINTENANCE_${property.id || property.name || 'property'}_${maintenance.nextMaintenanceDate || 'details'}`,
                    type: 'MAINTENANCE',
                    title: 'Maintenance reminder',
                    message: `${property.name || 'Property'} requires attention: ${maintenance.status}.`,
                    propertyId: property.id || property.name || '',
                    priority: 'medium',
                    isRead: false,
                    createdAt: maintenance.nextMaintenanceDate || new Date().toISOString(),
                    actionUrl: 'properties.html'
                }));
            }
        });

        const reminderData = JSON.parse(localStorage.getItem('rentReminders') || '[]');
        reminderData.forEach((reminder) => {
            if (!reminder || !reminder.title) {
                return;
            }
            candidates.push(this.create({
                id: `REMINDER_${reminder.id || reminder.title}_${reminder.date || 'unknown'}`,
                type: 'REMINDER',
                title: reminder.title,
                message: reminder.description || 'Reminder needs attention.',
                propertyId: reminder.propertyId || '',
                licenseeId: reminder.licenseeId || '',
                reminderId: reminder.id || '',
                priority: 'medium',
                isRead: false,
                createdAt: reminder.date || new Date().toISOString(),
                dueDate: reminder.date || '',
                actionUrl: 'reminders.html'
            }));
        });

        const emergencyValues = JSON.parse(localStorage.getItem('rentEmergencyAlerts') || '[]');
        emergencyValues.forEach((alert) => {
            if (!alert || !alert.message) {
                return;
            }
            candidates.push(this.create({
                id: `EMERGENCY_${alert.id || alert.title || alert.message}`,
                type: 'EMERGENCY',
                title: alert.title || 'Emergency alert',
                message: alert.message,
                propertyId: alert.propertyId || '',
                licenseeId: alert.licenseeId || '',
                priority: 'critical',
                isRead: false,
                createdAt: alert.createdAt || new Date().toISOString(),
                actionUrl: 'properties.html'
            }));
        });

        const existing = this.getAll();
        const result = [];
        const seen = new Set(existing.map((item) => item.id));

        candidates.forEach((candidate) => {
            if (!seen.has(candidate.id)) {
                result.push(candidate);
                seen.add(candidate.id);
            }
        });

        return result;
    },

    syncGeneratedNotifications: function () {
        const current = this.getAll();
        const generated = this.generateCandidates();
        const merged = [...generated, ...current];
        const uniqueMap = new Map();

        merged.forEach((item) => {
            const key = item.id || `${item.type}-${item.title}-${item.createdAt}`;
            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, item);
            }
        });

        const deduped = Array.from(uniqueMap.values());
        this.saveAll(this.sort(deduped));
        return this.getAll();
    }
};

function initDashboardNotifications() {
    const bell = document.getElementById('notificationBellBtn');
    const badge = document.getElementById('notificationBadge');
    const panel = document.getElementById('notificationPanel');
    const notificationList = document.getElementById('notificationList');
    const notificationMeta = document.getElementById('notificationMeta');
    const notificationSummary = document.getElementById('notificationSummary');
    const markAllReadBtn = document.getElementById('markAllReadBtn');

    if (!bell || !badge || !panel || !notificationList || !notificationMeta || !notificationSummary) {
        return;
    }

    function renderSummary() {
        const counts = NotificationService.getSummaryCounts();
        const summaryEntries = [
            { label: 'Critical', key: 'EMERGENCY', className: 'emergency', count: counts.EMERGENCY },
            { label: 'Overdue', key: 'RENT_OVERDUE', className: 'overdue', count: counts.RENT_OVERDUE },
            { label: 'Due', key: 'RENT_DUE', className: 'due', count: counts.RENT_DUE },
            { label: 'Maintenance', key: 'MAINTENANCE', className: 'maintenance', count: counts.MAINTENANCE },
            { label: 'Reminder', key: 'REMINDER', className: 'reminder', count: counts.REMINDER },
            { label: 'Payment', key: 'PAYMENT', className: 'payment', count: counts.PAYMENT },
            { label: 'Info', key: 'INFORMATION', className: 'info', count: counts.INFORMATION }
        ];

        const total = summaryEntries.reduce((sum, item) => sum + item.count, 0);
        const unread = NotificationService.getAll().filter((item) => !item.isRead).length;
        notificationMeta.textContent = `${total} total • ${unread} unread`;

        notificationSummary.innerHTML = summaryEntries
            .filter((entry) => entry.count > 0)
            .map((entry) => `<span class="summary-pill ${entry.className}">${entry.label} ${entry.count}</span>`)
            .join('') || '<span class="summary-pill info">No alerts</span>';
    }

    function renderNotifications() {
        const notifications = NotificationService.sort(NotificationService.getAll());
        const unread = notifications.filter((item) => !item.isRead).length;
        badge.textContent = unread > 0 ? unread : '0';
        badge.classList.toggle('hidden', unread === 0);
        bell.classList.toggle('has-unread', unread > 0);
        bell.setAttribute('title', unread > 0 ? `${unread} unread notifications` : 'Notifications');

        if (notifications.length === 0) {
            notificationList.innerHTML = '<div class="empty-notifications">No notifications yet.</div>';
            renderSummary();
            return;
        }

        notificationList.innerHTML = notifications.map((item) => {
            const meta = NotificationService.typeMeta[item.type] || NotificationService.typeMeta.INFORMATION;
            const time = item.createdAt ? new Date(item.createdAt).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            }) : 'Just now';
            const itemClass = `${item.type.toLowerCase().replace(/_/g, ' ')} ${item.isRead ? 'read' : 'unread'}`;
            const isEmergency = item.type === 'EMERGENCY' ? 'emergency' : item.type === 'RENT_OVERDUE' ? 'overdue' : item.type === 'RENT_DUE' ? 'due' : item.type === 'REMINDER' ? 'reminder' : item.type === 'MAINTENANCE' ? 'maintenance' : item.type === 'PAYMENT' ? 'payment' : 'info';

            return `
                <button type="button" class="notification-item ${isEmergency} ${item.isRead ? 'read' : 'unread'}" data-notification-id="${item.id}" data-action-url="${item.actionUrl || 'index.html'}">
                    <div class="notification-icon" aria-hidden="true">${meta.icon}</div>
                    <div class="notification-content">
                        <div class="notification-title">${item.title}</div>
                        <div class="notification-message">${item.message}</div>
                        <div class="notification-meta">
                            <span>${time}</span>
                            <span class="notification-read-dot" aria-hidden="true"></span>
                        </div>
                    </div>
                </button>
            `;
        }).join('');

        renderSummary();
    }

    function togglePanel(forceOpen) {
        const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : panel.classList.contains('hidden');
        panel.classList.toggle('hidden', !shouldOpen);
        bell.setAttribute('aria-expanded', String(shouldOpen));
    }

    bell.addEventListener('click', function () {
        togglePanel();
    });

    bell.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            togglePanel();
        }
    });

    markAllReadBtn.addEventListener('click', function (event) {
        event.stopPropagation();
        NotificationService.markAllRead();
        renderNotifications();
    });

    document.addEventListener('click', function (event) {
        const withinBell = event.target.closest('.notification-wrapper');
        if (!withinBell && !event.target.closest('.notification-item')) {
            togglePanel(false);
        }
    });

    notificationList.addEventListener('click', function (event) {
        const item = event.target.closest('.notification-item');
        if (!item) {
            return;
        }

        const id = item.dataset.notificationId;
        const actionUrl = item.dataset.actionUrl || 'index.html';
        NotificationService.markRead(id);
        renderNotifications();
        setTimeout(() => {
            window.location.href = actionUrl;
        }, 80);
    });

    NotificationService.syncGeneratedNotifications();
    renderNotifications();
}

document.addEventListener('DOMContentLoaded', function () {
    const viewAll = document.querySelector('.view-button');
    if (viewAll) {
        viewAll.addEventListener('click', function () {
            window.location.href = 'payments.html';
        });
    }

    document.querySelectorAll('.quick-action-btn').forEach(function (button) {
        button.addEventListener('click', function () {
            const action = this.getAttribute('data-action');
            const destinations = {
                properties: 'properties.html',
                licensees: 'licensees.html',
                payments: 'payments.html',
                reports: 'reports.html'
            };

            const target = destinations[action];
            if (target) {
                window.location.href = target;
            }
        });
    });

    document.querySelectorAll('.panel table tbody tr').forEach(function (tr) {
        tr.style.cursor = 'pointer';
        tr.addEventListener('click', function () {
            window.location.href = 'payments.html';
        });
    });

    document.querySelectorAll('.due-item').forEach(function (item) {
        item.style.cursor = 'pointer';
        item.addEventListener('click', function () {
            window.location.href = 'rent-collection.html';
        });
    });

    initDashboardNotifications();
});
