/**
 * Rent Management / Wave Application - Global Real-Time Data Sync Utility
 * Intercepts storage mutations and coordinates instant real-time synchronization
 * across all pages and open tabs in the application.
 */
(function (window) {
    const SYNC_EVENT_NAME = 'appDataChanged';

    const KEY_ALIASES = {
        'rentProperties': ['properties', 'propertiesData', 'rentProperties'],
        'rentlicensees': ['rentTenants', 'licensees', 'rentlicensees'],
        'rentBrokers': ['brokers', 'rentBrokers'],
        'rentPayments': ['payments', 'rentPayments'],
        'rentAgreements': ['agreements', 'rentAgreements'],
        'rentMaintenance': ['maintenanceRequests', 'rentMaintenance'],
        'rentReminders': ['reminders', 'rentReminders'],
        'rentSettings': ['settings', 'rentSettings'],
        'rentUsers': ['users', 'rentUsers'],
        'rentRoles': ['roles', 'rentRoles'],
        'rentSession': ['session', 'rentSession']
    };

    function getRelatedKeys(key) {
        if (!key) return [];
        for (const primaryKey in KEY_ALIASES) {
            if (KEY_ALIASES[primaryKey].includes(key)) {
                return KEY_ALIASES[primaryKey];
            }
        }
        return [key];
    }

    // Wrap localStorage.setItem & removeItem to dispatch local CustomEvents + StorageEvent simulation
    const originalSetItem = localStorage.setItem;
    const originalRemoveItem = localStorage.removeItem;

    // Cross-tab synchronization: when another page/tab changes application data,
    // refresh the current page so its existing initialization logic reloads the
    // latest canonical localStorage data. Changes made in this same document do
    // not trigger a reload because the page already updates itself.
    const AUTO_REFRESH_KEYS = new Set(Object.keys(KEY_ALIASES));
    let refreshTimer = null;

    function isAppDataKey(key) {
        return Boolean(key && (AUTO_REFRESH_KEYS.has(key) || getRelatedKeys(key).some(k => AUTO_REFRESH_KEYS.has(k))));
    }

    function scheduleCrossTabRefresh() {
        if (refreshTimer) return;
        refreshTimer = setTimeout(function () {
            refreshTimer = null;
            try { window.location.reload(); } catch (e) {}
        }, 120);
    }

    localStorage.setItem = function (key, value) {
        const oldValue = localStorage.getItem(key);
        originalSetItem.call(localStorage, key, value);

        // Keep alias keys in sync if defined
        const related = getRelatedKeys(key);
        related.forEach(aliasKey => {
            if (aliasKey !== key) {
                try {
                    originalSetItem.call(localStorage, aliasKey, value);
                } catch (e) {}
            }
        });

        // Dispatch local event so current page updates immediately
        const eventDetail = { key, value, oldValue, relatedKeys: related };
        window.dispatchEvent(new CustomEvent(SYNC_EVENT_NAME, { detail: eventDetail }));
    };

    localStorage.removeItem = function (key) {
        const oldValue = localStorage.getItem(key);
        originalRemoveItem.call(localStorage, key);

        const related = getRelatedKeys(key);
        related.forEach(aliasKey => {
            if (aliasKey !== key) {
                try {
                    originalRemoveItem.call(localStorage, aliasKey);
                } catch (e) {}
            }
        });

        const eventDetail = { key, value: null, oldValue, relatedKeys: related };
        window.dispatchEvent(new CustomEvent(SYNC_EVENT_NAME, { detail: eventDetail }));
    };


    // Native storage events are delivered to OTHER documents/tabs only.
    // Therefore a storage event here is safe to treat as an external change.
    window.addEventListener('storage', function (event) {
        if (event && event.key && isAppDataKey(event.key)) {
            scheduleCrossTabRefresh();
        }
    });

    const RentAppSync = {
        eventName: SYNC_EVENT_NAME,
        getRelatedKeys: getRelatedKeys,

        get: function (key, defaultValue = null) {
            try {
                const keysToTry = getRelatedKeys(key);
                for (const k of keysToTry) {
                    const item = localStorage.getItem(k);
                    if (item !== null) {
                        return JSON.parse(item);
                    }
                }
            } catch (e) {}
            return defaultValue;
        },

        set: function (key, data) {
            try {
                const json = typeof data === 'string' ? data : JSON.stringify(data);
                localStorage.setItem(key, json);
            } catch (e) {
                console.error('RentAppSync set error:', e);
            }
        },

        onDataChange: function (targetKeys, callback) {
            if (typeof targetKeys === 'function') {
                callback = targetKeys;
                targetKeys = null;
            }

            function handler(event) {
                if (!targetKeys) {
                    callback(event);
                    return;
                }

                const keys = Array.isArray(targetKeys) ? targetKeys : [targetKeys];

                if (event.type === SYNC_EVENT_NAME && event.detail) {
                    const changedKey = event.detail.key;
                    const related = event.detail.relatedKeys || [];
                    if (keys.some(k => k === changedKey || related.includes(k))) {
                        callback(event);
                    }
                } else if (event.type === 'storage') {
                    const changedKey = event.key;
                    if (!changedKey || keys.some(k => k === changedKey || getRelatedKeys(k).includes(changedKey))) {
                        callback(event);
                    }
                }
            }

            window.addEventListener(SYNC_EVENT_NAME, handler);
            window.addEventListener('storage', handler);

            return function unsubscribe() {
                window.removeEventListener(SYNC_EVENT_NAME, handler);
                window.removeEventListener('storage', handler);
            };
        },

        broadcast: function (key) {
            window.dispatchEvent(new CustomEvent(SYNC_EVENT_NAME, { detail: { key, relatedKeys: getRelatedKeys(key) } }));
        }
    };

    window.RentAppSync = RentAppSync;
    window.RentManagementSyncReady = true;
})(window);
