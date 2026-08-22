document.addEventListener('DOMContentLoaded', function () {
    const STORAGE_KEY = 'rentBrokers';
    const form = document.getElementById('brokerForm');
    const tableBody = document.getElementById('brokerTableBody');
    const overview = document.getElementById('brokerOverview');
    const resetButton = document.getElementById('resetBrokerForm');
    let selectedBrokerId = null;

    function getDefaultBrokers() {
        return [
            {
                id: 'broker-1',
                brokerName: 'Arvind Mehta',
                companyName: 'Urban Nest Realty',
                brokerPhone: '+91 98765 43210',
                brokerEmail: 'arvind@urbannest.com',
                propertyType: 'Residential',
                region: 'North City',
                propertiesManaged: 12,
                commissionType: 'Percentage',
                commissionRate: 2.5,
                status: 'Active',
                rating: 4.8,
                notes: 'Strong residential network and quick closure record.'
            },
            {
                id: 'broker-2',
                brokerName: 'Priya Shah',
                companyName: 'Skyline Property Group',
                brokerPhone: '+91 99888 22334',
                brokerEmail: 'priya@skylinepg.com',
                propertyType: 'Commercial',
                region: 'West Avenue',
                propertiesManaged: 6,
                commissionType: 'Percentage',
                commissionRate: 3.0,
                status: 'Pending',
                rating: 4.4,
                notes: 'Good for office and retail lead generation.'
            }
        ];
    }

    function getBrokers() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (Array.isArray(saved) && saved.length) {
                return saved;
            }
        } catch (error) {
            return getDefaultBrokers();
        }

        return getDefaultBrokers();
    }

    function saveBrokers(list) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }

    function formatCurrency(value) {
        const amount = Number(value) || 0;
        return '₹' + amount.toLocaleString('en-IN');
    }

    function getLicensees() {
        try {
            const stored = JSON.parse(localStorage.getItem('rentlicensees') || localStorage.getItem('rentTenants') || '[]');
            return Array.isArray(stored) ? stored : [];
        } catch (error) {
            return [];
        }
    }

    function getRentPayments() {
        try {
            const stored = JSON.parse(localStorage.getItem('rentPayments') || '[]');
            return Array.isArray(stored) ? stored : [];
        } catch (error) {
            return [];
        }
    }

    function getPaymentPaidAmount(payment) {
        return Number(
            payment.paidAmount ??
            payment.paid ??
            payment.amountPaid ??
            payment.amount ??
            0
        ) || 0;
    }

    function getPaymentsForLicensee(licensee, payments) {
        return payments.filter(function (payment) {
            const paymentLicenseeId = payment.licenseeId ?? payment.tenantId ?? '';
            if (
                paymentLicenseeId !== '' &&
                String(paymentLicenseeId) === String(licensee.id)
            ) {
                return true;
            }

            const paymentName = String(
                payment.licenseeName ||
                payment.tenantName ||
                payment.name ||
                ''
            ).trim().toLowerCase();

            const licenseeName = String(
                licensee.name || ''
            ).trim().toLowerCase();

            if (
                paymentName &&
                licenseeName &&
                paymentName === licenseeName
            ) {
                return true;
            }

            const paymentProperty = String(
                payment.propertyName || ''
            ).trim().toLowerCase();

            const licenseeProperty = String(
                licensee.propertyName || ''
            ).trim().toLowerCase();

            const paymentUnit = String(
                payment.unit || ''
            ).trim().toLowerCase();

            const licenseeUnit = String(
                licensee.unit || ''
            ).trim().toLowerCase();

            return (
                paymentProperty &&
                licenseeProperty &&
                paymentProperty === licenseeProperty &&
                paymentUnit &&
                licenseeUnit &&
                paymentUnit === licenseeUnit
            );
        });
    }

    function getLicenseeCollection(licensee, payments) {
        return getPaymentsForLicensee(licensee, payments).reduce(
            function (total, payment) {
                return total + getPaymentPaidAmount(payment);
            },
            0
        );
    }

    function calculateLicenseeCommission(rent, broker) {
        const type = broker.commissionType || 'Percentage';
        const rate = Number(broker.commissionRate) || 0;
        if (type === 'Fixed') {
            return rate;
        } else if (type === 'One Month') {
            return rent;
        } else {
            return (rent * rate) / 100;
        }
    }

    function formatCommissionText(broker) {
        const type = broker.commissionType || 'Percentage';
        const rate = Number(broker.commissionRate) || 0;
        if (type === 'Fixed') {
            return '₹' + rate.toLocaleString('en-IN') + ' Fixed';
        } else if (type === 'One Month') {
            return '1 Month Fee';
        } else {
            return rate.toFixed(1) + '%';
        }
    }

    function populateBrokerDropdown() {
        const brokerSelect = document.getElementById('licenseeBrokers');
        const datalist = document.getElementById('brokerOptions');
        const list = getBrokers();

        if (brokerSelect && brokerSelect.tagName === 'SELECT') {
            const currentVal = brokerSelect.value;
            brokerSelect.innerHTML = '<option value="" disabled selected>Select or enter broker\'s name</option>';

            list.forEach(broker => {
                const name = typeof broker === 'object' ? broker.brokerName : broker;
                if (name && name.trim()) {
                    const option = document.createElement('option');
                    option.value = name.trim();
                    option.textContent = name.trim();
                    brokerSelect.appendChild(option);
                }
            });

            const manualOpt = document.createElement('option');
            manualOpt.value = '__MANUAL__';
            manualOpt.textContent = '+ Add Manual Broker Name';
            manualOpt.style.fontWeight = 'bold';
            brokerSelect.appendChild(manualOpt);

            if (currentVal && Array.from(brokerSelect.options).some(o => o.value === currentVal)) {
                brokerSelect.value = currentVal;
            }
            return;
        }

        if (datalist) {
            datalist.innerHTML = '';
            list.forEach(broker => {
                const name = typeof broker === 'object' ? broker.brokerName : broker;
                if (name && name.trim()) {
                    const option = document.createElement('option');
                    option.value = name.trim();
                    option.textContent = name.trim();
                    datalist.appendChild(option);
                }
            });
        }
    }

    function renderOverview(list) {
        if (!overview) return;
        if (!list.length) {
            overview.innerHTML = '<p class="empty-state" style="margin:0; padding:20px; color:#64748b;">No brokers available.</p>';
            return;
        }

        let broker = list.find(b => String(b.id) === String(selectedBrokerId));
        if (!broker) {
            broker = list[0];
            selectedBrokerId = broker.id;
        }

        const statusClass = broker.status === 'Active' ? 'active' : broker.status === 'Pending' ? 'pending' : 'inactive';
        const licensees = getLicensees();
        const payments = getRentPayments();

        const linkedLicensees = licensees.filter(function (licensee) {
            const lBroker = String(licensee.brokerName || licensee.broker || '').trim().toLowerCase();
            const bName = String(broker.brokerName || '').trim().toLowerCase();
            return lBroker && bName && lBroker === bName;
        });

        const totalMonthlyRent = linkedLicensees.reduce(function (sum, licensee) {
            return sum + (Number(licensee.rent) || 0);
        }, 0);

        const totalCommission = linkedLicensees.reduce(function (sum, licensee) {
            const rent = Number(licensee.rent) || 0;
            return sum + calculateLicenseeCommission(rent, broker);
        }, 0);

        const totalCollection = linkedLicensees.reduce(function (sum, licensee) {
            return sum + getLicenseeCollection(licensee, payments);
        }, 0);

        let licenseeListHtml = '';

        if (!linkedLicensees.length) {
            licenseeListHtml = `
                <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;color:#64748b;text-align:center;">
                    No licensees are currently linked to this broker. Select this broker when registering or editing a licensee.
                </div>
            `;
        } else {
            licenseeListHtml = `
                <div style="display:grid;gap:10px;">
                    ${linkedLicensees.map(function (licensee) {
                        const rent = Number(licensee.rent) || 0;
                        const commission = calculateLicenseeCommission(rent, broker);
                        const collection = getLicenseeCollection(licensee, payments);

                        return `
                            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:13px;">
                                <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:10px;">
                                    <div>
                                        <strong style="display:block;font-size:15px;color:#0f172a;">
                                            ${licensee.name || 'Unnamed Licensee'}
                                        </strong>
                                        <small style="color:#64748b;">
                                            ${licensee.propertyName || 'Property not set'}
                                            ${licensee.unit ? ' • Unit ' + licensee.unit : ''}
                                        </small>
                                    </div>
                                    <span style="display:inline-block;padding:3px 8px;border-radius:6px;font-size:11px;font-weight:600;background:${licensee.status === 'Active' ? '#dcfce7' : '#f1f5f9'};color:${licensee.status === 'Active' ? '#15803d' : '#475569'};">
                                        ${licensee.status || 'Active'}
                                    </span>
                                </div>

                                <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;">
                                    <div style="background:#fff;border-radius:8px;padding:9px;border:1px solid #edf2f7;">
                                        <small style="display:block;color:#64748b;font-size:10px;margin-bottom:3px;">Monthly Rent</small>
                                        <strong>${formatCurrency(rent)}</strong>
                                    </div>
                                    <div style="background:#fff;border-radius:8px;padding:9px;border:1px solid #edf2f7;">
                                        <small style="display:block;color:#64748b;font-size:10px;margin-bottom:3px;">Collection</small>
                                        <strong>${formatCurrency(collection)}</strong>
                                    </div>
                                    <div style="background:#fff;border-radius:8px;padding:9px;border:1px solid #edf2f7;">
                                        <small style="display:block;color:#64748b;font-size:10px;margin-bottom:3px;">Commission Rate</small>
                                        <strong>${formatCommissionText(broker)}</strong>
                                    </div>
                                    <div style="background:#fff;border-radius:8px;padding:9px;border:1px solid #dbeafe;background:#eff6ff;">
                                        <small style="display:block;color:#1e40af;font-size:10px;margin-bottom:3px;">Calculated Commission</small>
                                        <strong style="color:#1d4ed8;">${formatCurrency(commission)}</strong>
                                    </div>
                                </div>
                                <div style="margin-top:8px;font-size:11px;color:#64748b;display:flex;gap:14px;flex-wrap:wrap;">
                                    <span>Mobile: <strong>${licensee.mobile || '-'}</strong></span>
                                    <span>Agreement Start: <strong>${licensee.leaseDate || '-'}</strong></span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }

        overview.innerHTML = `
            <div style="display:grid;gap:16px;">
                <div>
                    <small style="display:block;color:#64748b;margin-bottom:4px;">Broker Profile</small>
                    <strong style="font-size:20px;color:#0f172a;">${broker.brokerName || 'Unnamed broker'}</strong>
                </div>

                <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;">
                    <div style="background:#f8fafc;border-radius:10px;padding:12px;"><span style="display:block;color:#64748b;font-size:11px;margin-bottom:4px;">Agency</span><strong>${broker.companyName || 'Direct Partner'}</strong></div>
                    <div style="background:#f8fafc;border-radius:10px;padding:12px;"><span style="display:block;color:#64748b;font-size:11px;margin-bottom:4px;">Phone</span><strong>${broker.brokerPhone || 'Not provided'}</strong></div>
                    <div style="background:#f8fafc;border-radius:10px;padding:12px;"><span style="display:block;color:#64748b;font-size:11px;margin-bottom:4px;">Email</span><strong>${broker.brokerEmail || 'Not provided'}</strong></div>
                    <div style="background:#f8fafc;border-radius:10px;padding:12px;"><span style="display:block;color:#64748b;font-size:11px;margin-bottom:4px;">Property Type</span><strong>${broker.propertyType || 'Residential'}</strong></div>
                    <div style="background:#f8fafc;border-radius:10px;padding:12px;"><span style="display:block;color:#64748b;font-size:11px;margin-bottom:4px;">Region</span><strong>${broker.region || 'Not provided'}</strong></div>
                    <div style="background:#f8fafc;border-radius:10px;padding:12px;"><span style="display:block;color:#64748b;font-size:11px;margin-bottom:4px;">Commission Setup</span><strong>${formatCommissionText(broker)}</strong></div>
                    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:12px;"><span style="display:block;color:#1e40af;font-size:11px;margin-bottom:4px;">Linked Licensees</span><strong style="color:#1d4ed8;font-size:16px;">${linkedLicensees.length}</strong></div>
                    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:12px;"><span style="display:block;color:#1e40af;font-size:11px;margin-bottom:4px;">Total Monthly Rent</span><strong style="color:#1d4ed8;font-size:16px;">${formatCurrency(totalMonthlyRent)}</strong></div>
                    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:12px;"><span style="display:block;color:#1e40af;font-size:11px;margin-bottom:4px;">Total Collection</span><strong style="color:#1d4ed8;font-size:16px;">${formatCurrency(totalCollection)}</strong></div>
                    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:12px;"><span style="display:block;color:#166534;font-size:11px;margin-bottom:4px;">Total Broker Commission</span><strong style="color:#15803d;font-size:16px;">${formatCurrency(totalCommission)}</strong></div>
                </div>

                <div><span class="broker-status ${statusClass}">${broker.status || 'Active'}</span></div>

                <div>
                    <small style="display:block;color:#64748b;margin-bottom:8px;font-weight:700;">Associated Licensees (${linkedLicensees.length})</small>
                    ${licenseeListHtml}
                </div>

                <div>
                    <small style="display:block;color:#64748b;margin-bottom:4px;">Notes</small>
                    <p style="margin:0;color:#475569;line-height:1.5;">${broker.notes ? broker.notes : 'No notes added.'}</p>
                </div>
            </div>
        `;
    }

    function renderSummary(list) {
        const total = list.length;
        const active = list.filter(item => String(item.status || '').toLowerCase() === 'active').length;
        const licensees = getLicensees();

        let totalLinkedLicensees = 0;
        let totalCommissionAllBrokers = 0;

        list.forEach(broker => {
            const bName = String(broker.brokerName || '').trim().toLowerCase();
            const linked = licensees.filter(l => String(l.brokerName || l.broker || '').trim().toLowerCase() === bName);
            totalLinkedLicensees += linked.length;
            linked.forEach(l => {
                totalCommissionAllBrokers += calculateLicenseeCommission(Number(l.rent) || 0, broker);
            });
        });

        const totalBrokersEl = document.getElementById('totalBrokers');
        const activeBrokersEl = document.getElementById('activeBrokers');
        const propertiesLinkedEl = document.getElementById('propertiesLinked');
        const commissionValueEl = document.getElementById('commissionValue');

        if (totalBrokersEl) totalBrokersEl.textContent = total;
        if (activeBrokersEl) activeBrokersEl.textContent = active;
        if (propertiesLinkedEl) propertiesLinkedEl.textContent = totalLinkedLicensees;
        if (commissionValueEl) commissionValueEl.textContent = formatCurrency(totalCommissionAllBrokers);
    }

    function renderTable(list) {
        if (!tableBody) return;

        if (!list.length) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:30px; color:#64748b;">No brokers found.</td></tr>';
            return;
        }

        const licensees = getLicensees();

        tableBody.innerHTML = list.map(function (broker) {
            const statusClass = broker.status === 'Active' ? 'active' : broker.status === 'Pending' ? 'pending' : 'inactive';
            const bName = String(broker.brokerName || '').trim().toLowerCase();
            const linked = licensees.filter(l => String(l.brokerName || l.broker || '').trim().toLowerCase() === bName);
            const totalCommission = linked.reduce((sum, l) => sum + calculateLicenseeCommission(Number(l.rent) || 0, broker), 0);
            const isSelected = String(broker.id) === String(selectedBrokerId);

            return `
                <tr style="${isSelected ? 'background-color:#eff6ff;' : ''}">
                    <td>
                        <strong>${broker.brokerName || 'Unnamed broker'}</strong><br>
                        <small style="color:#64748b;">${broker.brokerPhone || 'No phone'}</small>
                    </td>
                    <td>${broker.companyName || '—'}<br><small style="color:#64748b;">${broker.brokerEmail || 'No email'}</small></td>
                    <td>${broker.region || '—'}</td>
                    <td><strong>${linked.length} Licensees</strong></td>
                    <td>${formatCommissionText(broker)}<br><small style="color:#15803d;font-weight:600;">Total: ${formatCurrency(totalCommission)}</small></td>
                    <td><span class="broker-status ${statusClass}">${broker.status || 'Active'}</span></td>
                    <td>
                        <div class="broker-actions-cell">
                            <button type="button" class="mini-btn view" data-view-id="${broker.id}">${isSelected ? 'Viewing' : 'View'}</button>
                            <button type="button" class="mini-btn delete" data-delete-id="${broker.id}">Delete</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function render() {
        const list = getBrokers();
        renderSummary(list);
        renderTable(list);
        renderOverview(list);
        populateBrokerDropdown();
    }

    if (form) {
        form.addEventListener('submit', function (event) {
            event.preventDefault();

            const payload = {
                id: 'broker-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
                brokerName: document.getElementById('brokerName').value.trim(),
                companyName: document.getElementById('companyName').value.trim(),
                brokerPhone: document.getElementById('brokerPhone').value.trim(),
                brokerEmail: document.getElementById('brokerEmail').value.trim(),
                propertyType: document.getElementById('propertyType').value,
                region: document.getElementById('region').value.trim(),
                propertiesManaged: document.getElementById('propertiesManaged').value || 0,
                commissionType: document.getElementById('commissionType').value || 'Percentage',
                commissionRate: document.getElementById('commissionRate').value || 0,
                status: document.getElementById('status').value,
                rating: document.getElementById('rating').value || 0,
                notes: document.getElementById('notes').value.trim()
            };

            if (!payload.brokerName) {
                alert('Please enter a broker name before saving.');
                return;
            }

            const list = getBrokers();
            list.push(payload);
            saveBrokers(list);
            selectedBrokerId = payload.id;
            form.reset();
            render();
            alert('Broker added successfully!');
        });
    }

    if (resetButton) {
        resetButton.addEventListener('click', function () {
            if (form) form.reset();
        });
    }

    if (tableBody) {
        tableBody.addEventListener('click', function (event) {
            const deleteButton = event.target.closest('[data-delete-id]');
            if (deleteButton) {
                const id = deleteButton.getAttribute('data-delete-id');
                const list = getBrokers().filter(item => String(item.id) !== String(id));
                saveBrokers(list);
                if (String(selectedBrokerId) === String(id)) selectedBrokerId = null;
                render();
                return;
            }

            const viewButton = event.target.closest('[data-view-id]');
            if (viewButton) {
                const id = viewButton.getAttribute('data-view-id');
                selectedBrokerId = id;
                render();
            }
        });
    }

    const brokerInput = document.getElementById('licenseeBrokers');
    if (brokerInput) {
        brokerInput.addEventListener('focus', populateBrokerDropdown);
        brokerInput.addEventListener('click', populateBrokerDropdown);
    }

    render();

    window.addEventListener('storage', function (event) {
        if (event.key === 'rentlicensees' || event.key === 'rentPayments' || event.key === 'rentBrokers' || event.key === 'rentTenants') {
            render();
        }
    });
});