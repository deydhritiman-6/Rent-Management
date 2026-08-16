document.addEventListener('DOMContentLoaded', function () {
    const STORAGE_KEY = 'rentBrokers';
    const form = document.getElementById('brokerForm');
    const tableBody = document.getElementById('brokerTableBody');
    const overview = document.getElementById('brokerOverview');
    const resetButton = document.getElementById('resetBrokerForm');

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
                commissionRate: 3,
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

    function renderOverview(list) {
        if (!list.length) {
            overview.innerHTML = '<p class="empty-state" style="margin:0; padding:20px; color:#64748b;">No broker selected.</p>';
            return;
        }

        const latest = list[list.length - 1];
        const statusClass = latest.status === 'Active' ? 'active' : latest.status === 'Pending' ? 'pending' : 'inactive';

        overview.innerHTML = `
            <div style="display:grid; gap:16px;">
                <div>
                    <small style="display:block; color:#64748b; margin-bottom:4px;">Broker</small>
                    <strong style="font-size:20px; color:#0f172a;">${latest.brokerName || 'Unnamed broker'}</strong>
                </div>

                <div style="display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:12px;">
                    <div style="background:#f8fafc; border-radius:10px; padding:12px;">
                        <span style="display:block; color:#64748b; font-size:11px; margin-bottom:4px;">Agency</span>
                        <strong>${latest.companyName || 'Not provided'}</strong>
                    </div>
                    <div style="background:#f8fafc; border-radius:10px; padding:12px;">
                        <span style="display:block; color:#64748b; font-size:11px; margin-bottom:4px;">Phone</span>
                        <strong>${latest.brokerPhone || 'Not provided'}</strong>
                    </div>
                    <div style="background:#f8fafc; border-radius:10px; padding:12px;">
                        <span style="display:block; color:#64748b; font-size:11px; margin-bottom:4px;">Email</span>
                        <strong>${latest.brokerEmail || 'Not provided'}</strong>
                    </div>
                    <div style="background:#f8fafc; border-radius:10px; padding:12px;">
                        <span style="display:block; color:#64748b; font-size:11px; margin-bottom:4px;">Property Type</span>
                        <strong>${latest.propertyType || 'Residential'}</strong>
                    </div>
                    <div style="background:#f8fafc; border-radius:10px; padding:12px;">
                        <span style="display:block; color:#64748b; font-size:11px; margin-bottom:4px;">Region</span>
                        <strong>${latest.region || 'Not provided'}</strong>
                    </div>
                    <div style="background:#f8fafc; border-radius:10px; padding:12px;">
                        <span style="display:block; color:#64748b; font-size:11px; margin-bottom:4px;">Properties Managed</span>
                        <strong>${latest.propertiesManaged || 0}</strong>
                    </div>
                    <div style="background:#f8fafc; border-radius:10px; padding:12px;">
                        <span style="display:block; color:#64748b; font-size:11px; margin-bottom:4px;">Commission</span>
                        <strong>${Number(latest.commissionRate || 0).toFixed(1)}%</strong>
                    </div>
                    <div style="background:#f8fafc; border-radius:10px; padding:12px;">
                        <span style="display:block; color:#64748b; font-size:11px; margin-bottom:4px;">Rating</span>
                        <strong>${Number(latest.rating || 0).toFixed(1)} / 5</strong>
                    </div>
                </div>

                <div>
                    <span class="broker-status ${statusClass}">${latest.status || 'Active'}</span>
                </div>

                <div>
                    <small style="display:block; color:#64748b; margin-bottom:4px;">Notes</small>
                    <p style="margin:0; color:#475569; line-height:1.5;">${latest.notes ? latest.notes : 'No notes added.'}</p>
                </div>
            </div>
        `;
    }

    function renderSummary(list) {
        const total = list.length;
        const active = list.filter(item => String(item.status || '').toLowerCase() === 'active').length;
        const linked = list.reduce((sum, item) => sum + (Number(item.propertiesManaged) || 0), 0);
        const commission = list.reduce((sum, item) => sum + ((Number(item.propertiesManaged) || 0) * (Number(item.commissionRate) || 0) * 1000), 0);

        document.getElementById('totalBrokers').textContent = total;
        document.getElementById('activeBrokers').textContent = active;
        document.getElementById('propertiesLinked').textContent = linked;
        document.getElementById('commissionValue').textContent = formatCurrency(commission);
    }

    function renderTable(list) {
        if (!list.length) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:30px; color:#64748b;">No brokers found.</td></tr>';
            return;
        }

        tableBody.innerHTML = list.map(function (broker) {
            const statusClass = broker.status === 'Active' ? 'active' : broker.status === 'Pending' ? 'pending' : 'inactive';
            return `
                <tr>
                    <td>
                        <strong>${broker.brokerName || 'Unnamed broker'}</strong><br>
                        <small>${broker.brokerPhone || 'No phone'}</small>
                    </td>
                    <td>${broker.companyName || '—'}<br><small>${broker.brokerEmail || 'No email'}</small></td>
                    <td>${broker.region || '—'}</td>
                    <td>${broker.propertiesManaged || 0}</td>
                    <td>${Number(broker.commissionRate || 0).toFixed(1)}%</td>
                    <td><span class="broker-status ${statusClass}">${broker.status || 'Active'}</span></td>
                    <td>
                        <div class="broker-actions-cell">
                            <button type="button" class="mini-btn view" data-view-id="${broker.id}">View</button>
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
    }

    form.addEventListener('submit', function (event) {
        event.preventDefault();

        const payload = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
            brokerName: document.getElementById('brokerName').value.trim(),
            companyName: document.getElementById('companyName').value.trim(),
            brokerPhone: document.getElementById('brokerPhone').value.trim(),
            brokerEmail: document.getElementById('brokerEmail').value.trim(),
            propertyType: document.getElementById('propertyType').value,
            region: document.getElementById('region').value.trim(),
            propertiesManaged: document.getElementById('propertiesManaged').value || 0,
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
            const list = getBrokers().filter(item => String(item.id) !== String(id));
            saveBrokers(list);
            render();
            return;
        }

        const viewButton = event.target.closest('[data-view-id]');
        if (viewButton) {
            const id = viewButton.getAttribute('data-view-id');
            const target = getBrokers().find(item => String(item.id) === String(id));
            if (target) {
                localStorage.setItem('selectedBroker', JSON.stringify(target));
                renderOverview([target]);
            }
        }
    });

    render();
});
