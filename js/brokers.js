document.addEventListener('DOMContentLoaded', function () {
    const STORAGE_KEY = 'rentBrokers';
    const form = document.getElementById('brokerForm');
    const tableBody = document.getElementById('brokerTableBody');
    const overview = document.getElementById('brokerOverview');
    const resetButton = document.getElementById('resetBrokerForm');
    const formTitle = document.getElementById('brokerFormTitle');
    const saveButton = document.getElementById('saveBrokerBtn');
    const editingBrokerIdInput = document.getElementById('editingBrokerId');
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
                historyLicenseeName: 'Vikram Rao',
                historyPropertyName: 'Greenwood Villa #12',
                historyAgreementDates: '01 Jan 2024 - 31 Dec 2024',
                notes: 'Strong residential network and quick closure record. Preferred agent for North City properties.',
                createdAt: new Date().toISOString()
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
                historyLicenseeName: 'Apex Logistics Ltd',
                historyPropertyName: 'West Hub Office #402',
                historyAgreementDates: '15 Mar 2024 - 14 Mar 2025',
                notes: 'Good for office and retail lead generation in West Avenue commercial zone.',
                createdAt: new Date().toISOString()
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

    function getInitials(name) {
        if (!name) return 'BK';
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    }

    function renderStars(rating) {
        const num = Number(rating) || 0;
        const fullStars = Math.floor(num);
        const halfStar = num % 1 >= 0.4 ? '½' : '';
        return '⭐'.repeat(fullStars) + (halfStar ? '⭐' : '') + ` (${num.toFixed(1)} / 5.0)`;
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

    function getRentAgreements() {
        try {
            const stored = JSON.parse(localStorage.getItem('rentAgreements') || '[]');
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
            return '1 Month Licensee Fee';
        } else {
            return rate.toFixed(1) + '% of Rent';
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

    function resetFormState() {
        if (form) form.reset();
        if (editingBrokerIdInput) editingBrokerIdInput.value = '';
        if (formTitle) formTitle.textContent = 'Add Broker';
        if (saveButton) saveButton.textContent = 'Save Broker';
    }

    function populateFormForEdit(brokerId) {
        const list = getBrokers();
        const broker = list.find(b => String(b.id) === String(brokerId));
        if (!broker) return;

        if (editingBrokerIdInput) editingBrokerIdInput.value = broker.id;
        document.getElementById('brokerName').value = broker.brokerName || '';
        document.getElementById('companyName').value = broker.companyName || '';
        document.getElementById('brokerPhone').value = broker.brokerPhone || '';
        document.getElementById('brokerEmail').value = broker.brokerEmail || '';
        document.getElementById('propertyType').value = broker.propertyType || 'Residential';
        document.getElementById('region').value = broker.region || '';
        document.getElementById('propertiesManaged').value = broker.propertiesManaged || 1;
        document.getElementById('commissionType').value = broker.commissionType || 'Percentage';
        document.getElementById('commissionRate').value = broker.commissionRate || 2;
        document.getElementById('status').value = broker.status || 'Active';
        document.getElementById('rating').value = broker.rating || 4.5;
        
        const historyNameEl = document.getElementById('historyLicenseeName');
        if (historyNameEl) historyNameEl.value = broker.historyLicenseeName || '';

        const historyPropEl = document.getElementById('historyPropertyName');
        if (historyPropEl) historyPropEl.value = broker.historyPropertyName || '';

        const historyDatesEl = document.getElementById('historyAgreementDates');
        if (historyDatesEl) historyDatesEl.value = broker.historyAgreementDates || '';

        document.getElementById('notes').value = broker.notes || '';

        if (formTitle) formTitle.textContent = 'Edit Broker Profile';
        if (saveButton) saveButton.textContent = 'Update Broker';

        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function escapeHtml(value) {
        const div = document.createElement('div');
        div.textContent = value == null ? '' : String(value);
        return div.innerHTML;
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

        // The Licensee record is the single source of truth for the broker relationship.
        // The associated Licensee's own propertyName and leaseDate are displayed,
        // rather than using legacy broker history fields that may belong to another deal.
        const brokerName = String(broker.brokerName || '').trim().toLowerCase();
        const linkedLicensees = licensees.filter(function (licensee) {
            const licenseeBrokerName = String(licensee.brokerName || licensee.broker || '').trim().toLowerCase();
            return Boolean(brokerName && licenseeBrokerName && licenseeBrokerName === brokerName);
        });

        const totalMonthlyRent = linkedLicensees.reduce(function (sum, licensee) {
            return sum + (Number(licensee.rent) || 0);
        }, 0);

        const totalCommission = linkedLicensees.reduce(function (sum, licensee) {
            return sum + calculateLicenseeCommission(Number(licensee.rent) || 0, broker);
        }, 0);

        const totalCollection = linkedLicensees.reduce(function (sum, licensee) {
            return sum + getLicenseeCollection(licensee, payments);
        }, 0);

        let licenseeListHtml = '';
        if (!linkedLicensees.length) {
            licenseeListHtml = `
                <div style="background:#f8fafc;border:1px dashed #cbd5e1;border-radius:12px;padding:18px;color:#64748b;text-align:center;font-size:13px;">
                    ℹ️ No licensees are currently linked to <strong>${escapeHtml(broker.brokerName)}</strong> in the system.
                </div>
            `;
        } else {
            licenseeListHtml = `
                <div style="display:grid;gap:12px;">
                    ${linkedLicensees.map(function (licensee) {
                        const rent = Number(licensee.rent) || 0;
                        const commission = calculateLicenseeCommission(rent, broker);
                        const collection = getLicenseeCollection(licensee, payments);
                        const licenseeName = escapeHtml(licensee.name || 'Unnamed Licensee');
                        const propertyName = escapeHtml(licensee.propertyName || 'Property not set');
                        const unit = licensee.unit ? ' • Unit ' + escapeHtml(licensee.unit) : '';
                        const leaseDate = escapeHtml(licensee.leaseDate || licensee.agreementDate || 'Not set');
                        const mobile = escapeHtml(licensee.mobile || 'Not set');
                        const aadhaar = escapeHtml(licensee.aadhaar || licensee.aadhaarNumber || 'Not set');
                        const status = escapeHtml(licensee.status || 'Active');
                        const isActive = String(licensee.status || '').toLowerCase() === 'active';

                        return `
                            <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:14px;box-shadow:0 2px 6px rgba(0,0,0,0.02);">
                                <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #f1f5f9;">
                                    <div style="min-width:0;">
                                        <strong style="display:block;font-size:15px;color:#0f172a;word-break:break-word;">
                                            👤 ${licenseeName}
                                        </strong>
                                        <small style="display:block;color:#475569;font-size:12px;margin-top:3px;word-break:break-word;">
                                            🏠 ${propertyName}${unit}
                                        </small>
                                        <small style="display:block;color:#64748b;font-size:12px;margin-top:3px;">
                                            📅 Agreement / Lease Start Date: <strong>${leaseDate}</strong>
                                        </small>
                                    </div>
                                    <span style="display:inline-block;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:700;background:${isActive ? '#dcfce7' : '#f1f5f9'};color:${isActive ? '#15803d' : '#475569'};white-space:nowrap;">
                                        ${status}
                                    </span>
                                </div>

                                <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));gap:8px;margin-bottom:10px;">
                                    <div style="background:#f8fafc;border-radius:8px;padding:8px 10px;border:1px solid #f1f5f9;">
                                        <small style="display:block;color:#64748b;font-size:11px;margin-bottom:2px;">Monthly Rent</small>
                                        <strong style="color:#0f172a;">${formatCurrency(rent)}</strong>
                                    </div>
                                    <div style="background:#f8fafc;border-radius:8px;padding:8px 10px;border:1px solid #f1f5f9;">
                                        <small style="display:block;color:#64748b;font-size:11px;margin-bottom:2px;">Rent Collected</small>
                                        <strong style="color:#166534;">${formatCurrency(collection)}</strong>
                                    </div>
                                    <div style="background:#f8fafc;border-radius:8px;padding:8px 10px;border:1px solid #f1f5f9;">
                                        <small style="display:block;color:#64748b;font-size:11px;margin-bottom:2px;">Deposit</small>
                                        <strong>${formatCurrency(licensee.deposit || 0)}</strong>
                                    </div>
                                    <div style="background:#eff6ff;border-radius:8px;padding:8px 10px;border:1px solid #bfdbfe;">
                                        <small style="display:block;color:#1e40af;font-size:11px;margin-bottom:2px;">Broker Commission</small>
                                        <strong style="color:#1d4ed8;">${formatCurrency(commission)}</strong>
                                    </div>
                                </div>

                                <div style="font-size:11px;color:#64748b;display:flex;gap:14px;flex-wrap:wrap;background:#f8fafc;padding:6px 10px;border-radius:6px;">
                                    <span>📞 <strong>${mobile}</strong></span>
                                    <span>🆔 Aadhaar: <strong>${aadhaar}</strong></span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }

        overview.innerHTML = `
            <div style="display:grid;gap:18px;">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:14px;background:linear-gradient(135deg, #1e293b, #0f172a);color:white;padding:18px;border-radius:14px;box-shadow:0 10px 25px rgba(15,23,42,0.15);">
                    <div style="display:flex;align-items:center;gap:14px;min-width:0;">
                        <div style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg, #3b82f6, #2563eb);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;color:white;box-shadow:0 4px 12px rgba(37,99,235,0.4);flex:0 0 auto;">
                            ${getInitials(broker.brokerName)}
                        </div>
                        <div style="min-width:0;">
                            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                                <strong style="font-size:20px;color:#ffffff;line-height:1.2;word-break:break-word;">${escapeHtml(broker.brokerName || 'Unnamed broker')}</strong>
                                <span class="broker-status ${statusClass}">${escapeHtml(broker.status || 'Active')}</span>
                            </div>
                            <small style="color:#94a3b8;font-size:13px;display:block;margin-top:2px;word-break:break-word;">
                                🏢 ${escapeHtml(broker.companyName || 'Independent Broker')} • 📍 ${escapeHtml(broker.region || 'All Regions')}
                            </small>
                            <div style="margin-top:4px;font-size:12px;color:#fbbf24;font-weight:700;">
                                ${renderStars(broker.rating || 4.5)}
                            </div>
                        </div>
                    </div>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;flex:0 0 auto;">
                        <button type="button" class="mini-btn view" style="background:#3b82f6;color:white;padding:8px 12px;font-size:12px;" data-edit-profile-id="${broker.id}">✏️ Edit</button>
                        <button type="button" class="mini-btn delete" style="background:rgba(239,68,68,0.2);color:#fca5a5;padding:8px 12px;font-size:12px;" data-delete-id="${broker.id}">🗑️ Delete</button>
                    </div>
                </div>

                <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(150px, 1fr));gap:10px;">
                    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px;">
                        <span style="display:block;color:#64748b;font-size:11px;margin-bottom:3px;">📞 Phone Number</span>
                        <strong>${broker.brokerPhone ? `<a href="tel:${escapeHtml(broker.brokerPhone)}" style="color:#2563eb;text-decoration:none;">${escapeHtml(broker.brokerPhone)}</a>` : 'Not provided'}</strong>
                    </div>
                    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px;">
                        <span style="display:block;color:#64748b;font-size:11px;margin-bottom:3px;">✉️ Email Address</span>
                        <strong style="word-break:break-all;">${broker.brokerEmail ? `<a href="mailto:${escapeHtml(broker.brokerEmail)}" style="color:#2563eb;text-decoration:none;">${escapeHtml(broker.brokerEmail)}</a>` : 'Not provided'}</strong>
                    </div>
                    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px;">
                        <span style="display:block;color:#64748b;font-size:11px;margin-bottom:3px;">🏙️ Type & Area</span>
                        <strong>${escapeHtml(broker.propertyType || 'Residential')} (${escapeHtml(broker.region || 'N/A')})</strong>
                    </div>
                    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px;">
                        <span style="display:block;color:#64748b;font-size:11px;margin-bottom:3px;">💼 Commission Model</span>
                        <strong style="color:#0f172a;">${escapeHtml(formatCommissionText(broker))}</strong>
                    </div>
                    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px;">
                        <span style="display:block;color:#64748b;font-size:11px;margin-bottom:3px;">🏠 Properties Managed</span>
                        <strong style="color:#0f172a;">${Number(broker.propertiesManaged) || 0} Units</strong>
                    </div>
                    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:12px;">
                        <span style="display:block;color:#1e40af;font-size:11px;margin-bottom:3px;">👥 Linked Licensees</span>
                        <strong style="color:#1d4ed8;font-size:16px;">${linkedLicensees.length}</strong>
                    </div>
                    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:12px;">
                        <span style="display:block;color:#1e40af;font-size:11px;margin-bottom:3px;">💰 Monthly Rent</span>
                        <strong style="color:#1d4ed8;font-size:16px;">${formatCurrency(totalMonthlyRent)}</strong>
                    </div>
                    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:12px;">
                        <span style="display:block;color:#166534;font-size:11px;margin-bottom:3px;">💵 Total Collection</span>
                        <strong style="color:#15803d;font-size:16px;">${formatCurrency(totalCollection)}</strong>
                    </div>
                    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:12px;">
                        <span style="display:block;color:#166534;font-size:11px;margin-bottom:3px;">🎯 Total Broker Commission</span>
                        <strong style="color:#15803d;font-size:16px;">${formatCurrency(totalCommission)}</strong>
                    </div>
                </div>

                <div>
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                        <small style="color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;font-size:11px;">
                            👥 Associated Licensees (${linkedLicensees.length})
                        </small>
                    </div>
                    ${licenseeListHtml}
                </div>

                <div style="background:#fff8f0;border:1px solid #fed7aa;border-radius:12px;padding:14px;">
                    <small style="display:block;color:#9a3412;font-weight:700;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;font-size:11px;">📝 Broker Notes & Special Remarks</small>
                    <p style="margin:0;color:#7c2d12;line-height:1.5;font-size:13px;">${broker.notes ? escapeHtml(broker.notes) : 'No additional notes or comments recorded for this broker.'}</p>
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
                    <td>${broker.region || '—'}<br><small style="color:#64748b;">${broker.propertyType || 'Residential'}</small></td>
                    <td><strong>${linked.length} Licensees</strong><br><small style="color:#64748b;">⭐ ${Number(broker.rating || 4.5).toFixed(1)}</small></td>
                    <td>${formatCommissionText(broker)}<br><small style="color:#15803d;font-weight:600;">Total: ${formatCurrency(totalCommission)}</small></td>
                    <td><span class="broker-status ${statusClass}">${broker.status || 'Active'}</span></td>
                    <td>
                        <div class="broker-actions-cell">
                            <button type="button" class="mini-btn view" data-view-id="${broker.id}">${isSelected ? 'Viewing' : 'View'}</button>
                            <button type="button" class="mini-btn view" style="background:#e0e7ff;color:#3730a3;" data-edit-id="${broker.id}">Edit</button>
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

            const editingId = editingBrokerIdInput ? editingBrokerIdInput.value.trim() : '';

            const payload = {
                id: editingId || ('broker-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)),
                brokerName: document.getElementById('brokerName').value.trim(),
                companyName: document.getElementById('companyName').value.trim(),
                brokerPhone: document.getElementById('brokerPhone').value.trim(),
                brokerEmail: document.getElementById('brokerEmail').value.trim(),
                propertyType: document.getElementById('propertyType').value,
                region: document.getElementById('region').value.trim(),
                propertiesManaged: Number(document.getElementById('propertiesManaged').value) || 0,
                commissionType: document.getElementById('commissionType').value || 'Percentage',
                commissionRate: Number(document.getElementById('commissionRate').value) || 0,
                status: document.getElementById('status').value,
                rating: Number(document.getElementById('rating').value) || 4.5,
                historyLicenseeName: document.getElementById('historyLicenseeName') ? document.getElementById('historyLicenseeName').value.trim() : '',
                historyPropertyName: document.getElementById('historyPropertyName') ? document.getElementById('historyPropertyName').value.trim() : '',
                historyAgreementDates: document.getElementById('historyAgreementDates') ? document.getElementById('historyAgreementDates').value.trim() : '',
                notes: document.getElementById('notes').value.trim(),
                updatedAt: new Date().toISOString()
            };

            if (!payload.brokerName) {
                alert('Please enter a broker name before saving.');
                return;
            }

            let list = getBrokers();
            if (editingId) {
                const index = list.findIndex(item => String(item.id) === String(editingId));
                if (index !== -1) {
                    list[index] = { ...list[index], ...payload };
                } else {
                    list.push(payload);
                }
            } else {
                payload.createdAt = new Date().toISOString();
                list.push(payload);
            }

            saveBrokers(list);
            selectedBrokerId = payload.id;
            resetFormState();
            render();
            alert(editingId ? 'Broker details updated successfully!' : 'Broker added successfully!');
        });
    }

    if (resetButton) {
        resetButton.addEventListener('click', function () {
            resetFormState();
        });
    }

    if (tableBody) {
        tableBody.addEventListener('click', function (event) {
            const deleteButton = event.target.closest('[data-delete-id]');
            if (deleteButton) {
                const id = deleteButton.getAttribute('data-delete-id');
                if (confirm('Are you sure you want to delete this broker profile?')) {
                    const list = getBrokers().filter(item => String(item.id) !== String(id));
                    saveBrokers(list);
                    if (String(selectedBrokerId) === String(id)) selectedBrokerId = null;
                    render();
                }
                return;
            }

            const editButton = event.target.closest('[data-edit-id]');
            if (editButton) {
                const id = editButton.getAttribute('data-edit-id');
                selectedBrokerId = id;
                populateFormForEdit(id);
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

    if (overview) {
        overview.addEventListener('click', function (event) {
            const editButton = event.target.closest('[data-edit-profile-id]');
            if (editButton) {
                const id = editButton.getAttribute('data-edit-profile-id');
                selectedBrokerId = id;
                populateFormForEdit(id);
                render();
                return;
            }

            const deleteButton = event.target.closest('[data-delete-id]');
            if (deleteButton) {
                const id = deleteButton.getAttribute('data-delete-id');
                if (confirm('Are you sure you want to delete this broker profile?')) {
                    const list = getBrokers().filter(item => String(item.id) !== String(id));
                    saveBrokers(list);
                    if (String(selectedBrokerId) === String(id)) selectedBrokerId = null;
                    render();
                }
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
        if (event.key === 'rentlicensees' || event.key === 'rentPayments' || event.key === 'rentBrokers' || event.key === 'rentTenants' || event.key === 'rentAgreements') {
            render();
        }
    });
});

