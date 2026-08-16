document.addEventListener('DOMContentLoaded', function () {
    const STORAGE_KEY = 'rentMaintenanceVendors';
    const form = document.getElementById('maintenanceForm');
    const tableBody = document.getElementById('maintenanceTableBody');
    const overview = document.getElementById('vendorOverview');
    const resetButton = document.getElementById('resetMaintenanceForm');

    function getDefaultVendors() {
        return [
            {
                id: 'vendor-1',
                vendorName: 'Rajesh Electrician',
                vendorCategory: 'Electrician',
                companyName: 'Shree Power Works',
                vendorPhone: '+91 98111 33221',
                vendorEmail: 'rajesh@shreepower.com',
                serviceArea: 'North Sector',
                propertiesCovered: 12,
                dailyRate: 1500,
                status: 'Available',
                rating: 4.8,
                specialties: 'Wiring, fan installation, inverter repair, electrical troubleshooting.'
            },
            {
                id: 'vendor-2',
                vendorName: 'Sandeep Plumber',
                vendorCategory: 'Plumber',
                companyName: 'Quick Flow Plumbing',
                vendorPhone: '+91 99880 45021',
                vendorEmail: 'sandeep@quickflow.in',
                serviceArea: 'City Center',
                propertiesCovered: 8,
                dailyRate: 1400,
                status: 'Busy',
                rating: 4.5,
                specialties: 'Pipe repair, bathroom fittings, water pressure correction, leakage fixes.'
            }
        ];
    }

    function getVendors() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (Array.isArray(saved) && saved.length) {
                return saved;
            }
        } catch (error) {
            return getDefaultVendors();
        }

        return getDefaultVendors();
    }

    function saveVendors(list) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }

    function formatCurrency(value) {
        const amount = Number(value) || 0;
        return '₹' + amount.toLocaleString('en-IN');
    }

    function renderOverview(list) {
        if (!list.length) {
            overview.innerHTML = '<p class="empty-state" style="margin:0; padding:20px; color:#64748b;">No vendor selected.</p>';
            return;
        }

        const latest = list[list.length - 1];
        const statusClass = latest.status === 'Available' ? 'available' : latest.status === 'Busy' ? 'busy' : 'unavailable';

        overview.innerHTML = `
            <div style="display:grid; gap:16px;">
                <div>
                    <small style="display:block; color:#64748b; margin-bottom:4px;">Vendor</small>
                    <strong style="font-size:20px; color:#0f172a;">${latest.vendorName || 'Unnamed vendor'}</strong>
                </div>

                <div style="display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:12px;">
                    <div style="background:#f8fafc; border-radius:10px; padding:12px;">
                        <span style="display:block; color:#64748b; font-size:11px; margin-bottom:4px;">Category</span>
                        <strong>${latest.vendorCategory || 'Maintenance'}</strong>
                    </div>
                    <div style="background:#f8fafc; border-radius:10px; padding:12px;">
                        <span style="display:block; color:#64748b; font-size:11px; margin-bottom:4px;">Business</span>
                        <strong>${latest.companyName || 'Not provided'}</strong>
                    </div>
                    <div style="background:#f8fafc; border-radius:10px; padding:12px;">
                        <span style="display:block; color:#64748b; font-size:11px; margin-bottom:4px;">Phone</span>
                        <strong>${latest.vendorPhone || 'Not provided'}</strong>
                    </div>
                    <div style="background:#f8fafc; border-radius:10px; padding:12px;">
                        <span style="display:block; color:#64748b; font-size:11px; margin-bottom:4px;">Email</span>
                        <strong>${latest.vendorEmail || 'Not provided'}</strong>
                    </div>
                    <div style="background:#f8fafc; border-radius:10px; padding:12px;">
                        <span style="display:block; color:#64748b; font-size:11px; margin-bottom:4px;">Service Area</span>
                        <strong>${latest.serviceArea || 'Not provided'}</strong>
                    </div>
                    <div style="background:#f8fafc; border-radius:10px; padding:12px;">
                        <span style="display:block; color:#64748b; font-size:11px; margin-bottom:4px;">Daily Rate</span>
                        <strong>${formatCurrency(latest.dailyRate)}</strong>
                    </div>
                    <div style="background:#f8fafc; border-radius:10px; padding:12px;">
                        <span style="display:block; color:#64748b; font-size:11px; margin-bottom:4px;">Properties Covered</span>
                        <strong>${latest.propertiesCovered || 0}</strong>
                    </div>
                    <div style="background:#f8fafc; border-radius:10px; padding:12px;">
                        <span style="display:block; color:#64748b; font-size:11px; margin-bottom:4px;">Rating</span>
                        <strong>${Number(latest.rating || 0).toFixed(1)} / 5</strong>
                    </div>
                </div>

                <div>
                    <span class="vendor-status ${statusClass}">${latest.status || 'Available'}</span>
                </div>

                <div>
                    <small style="display:block; color:#64748b; margin-bottom:4px;">Specialties</small>
                    <p style="margin:0; color:#475569; line-height:1.5;">${latest.specialties ? latest.specialties : 'No specialties added.'}</p>
                </div>
            </div>
        `;
    }

    function renderSummary(list) {
        const total = list.length;
        const available = list.filter(item => String(item.status || '').toLowerCase() === 'available').length;
        const covered = list.reduce((sum, item) => sum + (Number(item.propertiesCovered) || 0), 0);
        const avgRate = list.length ? list.reduce((sum, item) => sum + (Number(item.dailyRate) || 0), 0) / list.length : 0;

        document.getElementById('totalVendors').textContent = total;
        document.getElementById('availableVendors').textContent = available;
        document.getElementById('propertiesCovered').textContent = covered;
        document.getElementById('avgRate').textContent = formatCurrency(avgRate);
    }

    function renderTable(list) {
        if (!list.length) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:30px; color:#64748b;">No maintenance vendors found.</td></tr>';
            return;
        }

        tableBody.innerHTML = list.map(function (vendor) {
            const statusClass = vendor.status === 'Available' ? 'available' : vendor.status === 'Busy' ? 'busy' : 'unavailable';
            return `
                <tr>
                    <td>
                        <strong>${vendor.vendorName || 'Unnamed vendor'}</strong><br>
                        <small>${vendor.vendorPhone || 'No phone'}</small>
                    </td>
                    <td>${vendor.vendorCategory || 'Maintenance'}<br><small>${vendor.companyName || 'No company'}</small></td>
                    <td>${vendor.serviceArea || '—'}</td>
                    <td>${vendor.propertiesCovered || 0}</td>
                    <td>${formatCurrency(vendor.dailyRate)}</td>
                    <td><span class="vendor-status ${statusClass}">${vendor.status || 'Available'}</span></td>
                    <td>
                        <div class="vendor-actions-cell">
                            <button type="button" class="mini-btn view" data-view-id="${vendor.id}">View</button>
                            <button type="button" class="mini-btn delete" data-delete-id="${vendor.id}">Delete</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function render() {
        const list = getVendors();
        renderSummary(list);
        renderTable(list);
        renderOverview(list);
    }

    form.addEventListener('submit', function (event) {
        event.preventDefault();

        const payload = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
            vendorName: document.getElementById('vendorName').value.trim(),
            vendorCategory: document.getElementById('vendorCategory').value,
            companyName: document.getElementById('companyName').value.trim(),
            vendorPhone: document.getElementById('vendorPhone').value.trim(),
            vendorEmail: document.getElementById('vendorEmail').value.trim(),
            serviceArea: document.getElementById('serviceArea').value.trim(),
            propertiesCovered: document.getElementById('propertiesCovered').value || 0,
            dailyRate: document.getElementById('dailyRate').value || 0,
            status: document.getElementById('status').value,
            rating: document.getElementById('rating').value || 0,
            specialties: document.getElementById('specialties').value.trim()
        };

        if (!payload.vendorName) {
            alert('Please enter a vendor name before saving.');
            return;
        }

        const list = getVendors();
        list.push(payload);
        saveVendors(list);
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
            const list = getVendors().filter(item => String(item.id) !== String(id));
            saveVendors(list);
            render();
            return;
        }

        const viewButton = event.target.closest('[data-view-id]');
        if (viewButton) {
            const id = viewButton.getAttribute('data-view-id');
            const target = getVendors().find(item => String(item.id) === String(id));
            if (target) {
                localStorage.setItem('selectedMaintenanceVendor', JSON.stringify(target));
                renderOverview([target]);
            }
        }
    });

    render();
});
