document.addEventListener('DOMContentLoaded', function () {
    const STORAGE_KEY = 'rentAgreements';
    const form = document.getElementById('agreementForm');
    const tableBody = document.getElementById('agreementTableBody');
    const overview = document.getElementById('agreementOverview');
    const resetButton = document.getElementById('resetAgreementForm');

    function getAgreements() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch (error) {
            return [];
        }
    }

    function saveAgreements(list) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }

    function formatDate(value) {
        if (!value) return '—';
        const date = new Date(value + 'T00:00:00');
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    function formatCurrency(value) {
        const amount = Number(value) || 0;
        return '₹' + amount.toLocaleString('en-IN');
    }

    function getAgreementStatus(agreement) {
        const status = String(agreement.status || '').trim();
        if (status) return status;

        const now = new Date();
        const endDate = agreement.endDate ? new Date(agreement.endDate + 'T00:00:00') : null;

        if (endDate && endDate < now) {
            return 'Expired';
        }

        return 'Active';
    }

    function calculateStatusClass(status) {
        if (status === 'Expired') return 'expired';
        if (status === 'Expiring Soon') return 'expiring';
        return 'active';
    }

    function renderOverview(list) {
        if (!list.length) {
            overview.innerHTML = '<p class="empty-state" style="margin:0; padding:20px; color:#64748b;">No agreement selected.</p>';
            return;
        }

        const latest = list[list.length - 1];
        const status = getAgreementStatus(latest);

        overview.innerHTML = `
            <div style="display:grid; gap:14px;">
                <div>
                    <small style="display:block; color:#64748b; margin-bottom:4px;">Tenant</small>
                    <strong style="font-size:20px; color:#0f172a;">${latest.tenantName || 'Unknown tenant'}</strong>
                </div>
                <div style="display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:12px;">
                    <div class="detail-item" style="background:#f8fafc; border-radius:10px; padding:12px;">
                        <span style="display:block; color:#64748b; font-size:11px; margin-bottom:4px;">Property</span>
                        <strong>${latest.propertyName || '-'}</strong>
                    </div>
                    <div class="detail-item" style="background:#f8fafc; border-radius:10px; padding:12px;">
                        <span style="display:block; color:#64748b; font-size:11px; margin-bottom:4px;">Unit</span>
                        <strong>${latest.unit || '-'}</strong>
                    </div>
                    <div class="detail-item" style="background:#f8fafc; border-radius:10px; padding:12px;">
                        <span style="display:block; color:#64748b; font-size:11px; margin-bottom:4px;">Monthly Rent</span>
                        <strong>${formatCurrency(latest.monthlyRent)}</strong>
                    </div>
                    <div class="detail-item" style="background:#f8fafc; border-radius:10px; padding:12px;">
                        <span style="display:block; color:#64748b; font-size:11px; margin-bottom:4px;">Security Deposit</span>
                        <strong>${formatCurrency(latest.securityDeposit)}</strong>
                    </div>
                </div>
                <div>
                    <span class="agreement-status ${calculateStatusClass(status)}">${status}</span>
                </div>
                <div>
                    <small style="display:block; color:#64748b; margin-bottom:4px;">Lease Period</small>
                    <strong>${formatDate(latest.startDate)} - ${formatDate(latest.endDate)}</strong>
                </div>
                <div>
                    <small style="display:block; color:#64748b; margin-bottom:4px;">Terms</small>
                    <p style="color:#475569; line-height:1.5; margin:0;">${latest.terms ? latest.terms : 'No additional notes added.'}</p>
                </div>
            </div>
        `;
    }

    function renderSummary(list) {
        const totalAgreements = list.length;
        const active = list.filter(item => getAgreementStatus(item) === 'Active').length;
        const expiring = list.filter(item => getAgreementStatus(item) === 'Expiring Soon').length;
        const rentTotal = list.reduce((sum, item) => sum + (Number(item.monthlyRent) || 0), 0);

        document.getElementById('totalAgreements').textContent = totalAgreements;
        document.getElementById('activeAgreements').textContent = active;
        document.getElementById('expiringAgreements').textContent = expiring;
        document.getElementById('monthlyRentTotal').textContent = formatCurrency(rentTotal);
    }

    function renderTable(list) {
        if (!list.length) {
            tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:30px; color:#64748b;">No rent agreements found.</td></tr>';
            return;
        }

        tableBody.innerHTML = list.map(function (agreement) {
            const status = getAgreementStatus(agreement);
            const title = agreement.tenantName || 'Unknown tenant';
            return `
                <tr>
                    <td><strong>${title}</strong></td>
                    <td>${agreement.propertyName || '-'}</td>
                    <td>${agreement.unit || '-'}</td>
                    <td>${formatCurrency(agreement.monthlyRent)}</td>
                    <td>${formatDate(agreement.startDate)}<br><small>${formatDate(agreement.endDate)}</small></td>
                    <td>${formatCurrency(agreement.securityDeposit)}</td>
                    <td><span class="agreement-status ${calculateStatusClass(status)}">${status}</span></td>
                    <td>
                        <div class="agreement-actions-cell">
                            <button type="button" class="mini-btn view" data-view-id="${agreement.id}">View</button>
                            <button type="button" class="mini-btn delete" data-delete-id="${agreement.id}">Delete</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function render() {
        const list = getAgreements();
        renderSummary(list);
        renderTable(list);
        renderOverview(list);
    }

    form.addEventListener('submit', function (event) {
        event.preventDefault();

        const payload = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
            tenantName: document.getElementById('tenantName').value.trim(),
            propertyName: document.getElementById('propertyName').value.trim(),
            unit: document.getElementById('unit').value.trim(),
            monthlyRent: document.getElementById('monthlyRent').value,
            securityDeposit: document.getElementById('securityDeposit').value,
            status: document.getElementById('agreementStatus').value,
            startDate: document.getElementById('startDate').value,
            endDate: document.getElementById('endDate').value,
            terms: document.getElementById('terms').value.trim()
        };

        if (!payload.tenantName || !payload.propertyName || !payload.unit || !payload.startDate || !payload.monthlyRent || !payload.securityDeposit) {
            alert('Please fill in all required fields before saving the agreement.');
            return;
        }

        const list = getAgreements();
        list.push(payload);
        saveAgreements(list);
        form.reset();
        render();
    });

    resetButton.addEventListener('click', function () {
        form.reset();
    });

    tableBody.addEventListener('click', function (event) {
        const deleteButton = event.target.closest('[data-delete-id]');
        if (deleteButton) {
            const id = deleteButton.getAttribute('data-delete-id');
            const list = getAgreements().filter(item => String(item.id) !== String(id));
            saveAgreements(list);
            render();
            return;
        }

        const viewButton = event.target.closest('[data-view-id]');
        if (viewButton) {
            const id = viewButton.getAttribute('data-view-id');
            const list = getAgreements();
            const target = list.find(item => String(item.id) === String(id));
            if (target) {
                localStorage.setItem('selectedRentAgreement', JSON.stringify(target));
                renderOverview([target]);
            }
        }
    });

    render();
});
