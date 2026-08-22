document.addEventListener('DOMContentLoaded', function () {
    const STORAGE_KEY = 'rentAgreements';
    const form = document.getElementById('leaveLicenseForm');
    const preview = document.getElementById('agreementPreview');
    const durationSchedule = document.getElementById('durationSchedule');
    const savedDraftsBody = document.getElementById('savedDraftsBody');
    const draftCount = document.getElementById('draftCount');
    const licenceeLookup = document.getElementById('licenseeLookup');
    const propertyLookup = document.getElementById('propertyLookup');
    const resetButton = document.getElementById('resetAgreementForm');
    const previewButton = document.getElementById('previewAgreementBtn');
    const printButton = document.getElementById('printAgreementBtn');

    function safeGetLocalStorage(key) {
        try {
            return JSON.parse(localStorage.getItem(key) || '[]');
        } catch (error) {
            return [];
        }
    }

    function getAgreements() {
        return safeGetLocalStorage(STORAGE_KEY);
    }

    function saveAgreements(list) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }

    function formatDate(value) {
        if (!value) return '—';
        const date = new Date(value + 'T00:00:00');
        if (Number.isNaN(date.getTime())) return value;
        return new Intl.DateTimeFormat('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).format(date);
    }

    function formatCurrency(value) {
        const amount = Number(value) || 0;
        return '₹' + amount.toLocaleString('en-IN');
    }

    function addMonths(dateValue, monthsToAdd) {
        const date = new Date(dateValue + 'T00:00:00');
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();
        const newDate = new Date(year, month + monthsToAdd, day);
        return newDate;
    }

    function formatDateISO(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function getDurationPeriods(startDate, durationMonths) {
        const normalizedInput = String(startDate || '').trim();
        if (!normalizedInput) {
            return [];
        }

        const baseStart = new Date(normalizedInput + 'T00:00:00');
        if (Number.isNaN(baseStart.getTime())) {
            return [];
        }

        const totalPeriods = durationMonths === 22 ? 2 : durationMonths === 33 ? 3 : 1;
        const periods = [];

        for (let index = 0; index < totalPeriods; index += 1) {
            const start = addMonths(formatDateISO(baseStart), index * 12);
            const end = addMonths(formatDateISO(start), 11);
            const endDate = new Date(end);
            endDate.setDate(endDate.getDate() - 1);
            periods.push({
                label: `Agreement ${index + 1}`,
                start: formatDateISO(start),
                end: formatDateISO(endDate),
                gapAfter: index < totalPeriods - 1 ? 'Gap: 1 Month' : ''
            });
        }

        return periods;
    }

    function renderDurationSchedule() {
        const startDate = document.getElementById('agreementStartDate').value;
        const duration = Number(document.getElementById('selectedDuration').value || 11);
        const periods = getDurationPeriods(startDate, duration);

        if (!periods.length) {
            durationSchedule.innerHTML = '<div class="legal-note">Choose the agreement start date to automatically calculate the license periods.</div>';
            return;
        }

        durationSchedule.innerHTML = periods.map((period, index) => `
            <div class="period-card">
                <h4>${period.label}</h4>
                <div class="period-row">
                    <div class="form-group">
                        <label>Start Date</label>
                        <input type="text" value="${formatDate(period.start)}" readonly>
                    </div>
                    <div class="form-group">
                        <label>End Date</label>
                        <input type="text" value="${formatDate(period.end)}" readonly>
                    </div>
                </div>
                ${index < periods.length - 1 ? '<span class="gap-tag">Gap Period: 1 Month</span>' : ''}
            </div>
        `).join('');
    }

    function populatelicenseeSelection() {
        const licensees = safeGetLocalStorage('rentlicensees');
        licenceeLookup.innerHTML = '<option value="">Create manual licensee entry</option>' + licensees.map(function (licensee) {
            return `<option value="${licensee.id}">${licensee.name || 'Unnamed Licensee'} (${licensee.mobile || 'No mobile'})</option>`;
        }).join('');
    }

    function populatePropertySelection() {
        const properties = safeGetLocalStorage('rentProperties');
        propertyLookup.innerHTML = '<option value="">Manually enter property details</option>' + properties.map(function (property) {
            return `<option value="${property.id}">${property.name || property.propertyName || 'Property'} - ${property.location || property.address || property.unit || ''}</option>`;
        }).join('');
    }

    function populateFromlicensee(licenseeId) {
        const licensees = safeGetLocalStorage('rentlicensees');
        const selectedlicensee = licensees.find(item => String(item.id) === String(licenseeId));
        if (!selectedlicensee) return;

        document.getElementById('licenseeName').value = selectedlicensee.name || '';
        document.getElementById('licenseeMobile').value = selectedlicensee.mobile || '';
        document.getElementById('licenseeEmail').value = selectedlicensee.email || '';
        document.getElementById('licenseeAadhaar').value = selectedlicensee.aadhaar || '';
        document.getElementById('licenseePan').value = selectedlicensee.pan || '';
        document.getElementById('licenseeCurrentAddress').value = selectedlicensee.address || '';
        document.getElementById('licenseeAddress').value = selectedlicensee.permanentAddress || selectedlicensee.address || '';
    }

    function populateFromProperty(propertyId) {
        const properties = safeGetLocalStorage('rentProperties');
        const selectedProperty = properties.find(item => String(item.id) === String(propertyId));
        if (!selectedProperty) return;

        document.getElementById('propertyLookup').value = propertyId;
        document.getElementById('propertyAddress').value = selectedProperty.address || selectedProperty.location || '';
        document.getElementById('propertyFlatNo').value = selectedProperty.unit || selectedProperty.flatNo || '';
        document.getElementById('propertyBuildingName').value = selectedProperty.buildingName || selectedProperty.name || '';
        document.getElementById('propertyFloor').value = selectedProperty.floor || '';
        document.getElementById('propertyArea').value = selectedProperty.area || '';
        document.getElementById('propertyPinCode').value = selectedProperty.pinCode || selectedProperty.pincode || '';
        document.getElementById('propertyParking').value = selectedProperty.parking || 'Not specified';
        document.getElementById('propertyType').value = /commercial|office|shop|warehouse|retail/i.test(String(selectedProperty.type || '')) ? 'Commercial' : 'Residential';
    }

    function generateAgreementHtml() {
        const licensorName = document.getElementById('licensorName').value.trim() || 'Licensor Name';
        const licensorFatherName = document.getElementById('licensorFatherName').value.trim() || '—';
        const licensorAge = document.getElementById('licensorAge').value.trim() || '—';
        const licensorPan = document.getElementById('licensorPan').value.trim() || '—';
        const licensorAadhaar = document.getElementById('licensorAadhaar').value.trim() || '—';
        const licensorAddress = document.getElementById('licensorAddress').value.trim() || '—';
        const licensorMobile = document.getElementById('licensorMobile').value.trim() || '—';
        const licensorEmail = document.getElementById('licensorEmail').value.trim() || '—';

        const licenseeName = document.getElementById('licenseeName').value.trim() || 'Licensee Name';
        const licenseeFatherName = document.getElementById('licenseeFatherName').value.trim() || '—';
        const licenseeAge = document.getElementById('licenseeAge').value.trim() || '—';
        const licenseePan = document.getElementById('licenseePan').value.trim() || '—';
        const licenseeAadhaar = document.getElementById('licenseeAadhaar').value.trim() || '—';
        const licenseePermanentAddress = document.getElementById('licenseeAddress').value.trim() || '—';
        const licenseeCurrentAddress = document.getElementById('licenseeCurrentAddress').value.trim() || '—';
        const licenseeMobile = document.getElementById('licenseeMobile').value.trim() || '—';
        const licenseeEmail = document.getElementById('licenseeEmail').value.trim() || '—';

        const propertyAddress = document.getElementById('propertyAddress').value.trim() || '—';
        const propertyFlatNo = document.getElementById('propertyFlatNo').value.trim() || '—';
        const propertyBuildingName = document.getElementById('propertyBuildingName').value.trim() || '—';
        const propertyFloor = document.getElementById('propertyFloor').value.trim() || '—';
        const propertyArea = document.getElementById('propertyArea').value.trim() || '—';
        const propertyPinCode = document.getElementById('propertyPinCode').value.trim() || '—';
        const propertyParking = document.getElementById('propertyParking').value.trim() || '—';
        const propertyType = document.getElementById('propertyType').value || 'Residential';
        const agreementStartDate = document.getElementById('agreementStartDate').value;
        const duration = Number(document.getElementById('selectedDuration').value || 11);
        const periods = getDurationPeriods(agreementStartDate, duration);
        const noticePeriodDays = Number(document.getElementById('noticePeriodDays').value || 30);
        const noticePeriodUnit = document.getElementById('noticePeriodUnit').value || 'days';
        const monthlyLicenseFee = document.getElementById('monthlyLicenseFee').value || '0';
        const securityDepositAmount = document.getElementById('securityDepositAmount').value || '0';
        const maintenanceUtilities = document.getElementById('maintenanceUtilities').value.trim() || 'To be specified by the parties and reviewed by legal counsel.';
        const specialNotes = document.getElementById('specialNotes').value.trim() || 'No additional special notes provided.';

        const periodText = periods.map((period) => `
            <li><strong>${period.label}</strong>: ${formatDate(period.start)} to ${formatDate(period.end)}</li>
        `).join('');

        const noticeLabel = `${noticePeriodDays} ${noticePeriodUnit}`;

        return `
            <h2>LEAVE AND LICENSE AGREEMENT</h2>
            <p>This Leave and License Agreement is made between <strong>LICENSOR</strong> (${licensorName}) and <strong>LICENSEE</strong> (${licenseeName}) for the Licensed Premises described below.</p>
            <p><strong>For clarity:</strong> LICENSOR = Property Owner and LICENSEE = Occupant.</p>

            <h3>1. Parties</h3>
            <p><strong>LICENSOR:</strong> ${licensorName}, Son/Wife/Daughter of ${licensorFatherName}, Age ${licensorAge}, PAN ${licensorPan}, Aadhaar / ID ${licensorAadhaar}, resident of ${licensorAddress}, Mobile ${licensorMobile}, Email ${licensorEmail}.</p>
            <p><strong>LICENSEE:</strong> ${licenseeName}, Son/Wife/Daughter of ${licenseeFatherName}, Age ${licenseeAge}, PAN ${licenseePan}, Aadhaar / ID ${licenseeAadhaar}, resident of ${licenseePermanentAddress}. Current address: ${licenseeCurrentAddress}. Mobile ${licenseeMobile}, Email ${licenseeEmail}.</p>

            <h3>2. Licensed Premises</h3>
            <p>The Licensed Premises is the ${propertyType} property at ${propertyAddress}, Flat / House No. ${propertyFlatNo}, Building Name ${propertyBuildingName}, Floor ${propertyFloor}, Area ${propertyArea}, PIN Code ${propertyPinCode}, Parking ${propertyParking}.</p>

            <h3>3. Purpose of License</h3>
            <p>The Licensor hereby grants to the Licensee a non-exclusive, revocable license to occupy and use the Licensed Premises for residential / commercial use as permitted by the applicable society/municipal rules and the terms of this Agreement.</p>

            <h3>4. License Period</h3>
            <ul>${periodText}</ul>
            <p>The parties acknowledge that the total arrangement is structured as separate 11-month License Periods with a one-month gap between consecutive periods, and no consecutive license periods overlap.</p>

            <h3>5. License Fee</h3>
            <p>The Licensee shall pay a monthly License Fee / Compensation of <strong>${formatCurrency(monthlyLicenseFee)}</strong> payable on or before the due date as agreed between the parties.</p>

            <h3>6. Security Deposit</h3>
            <p>The Licensee shall pay a Security Deposit of <strong>${formatCurrency(securityDepositAmount)}</strong>. The Security Deposit shall be refundable subject to settlement of dues, condition of the Licensed Premises and compliance with the terms of this Agreement, subject to applicable law and any lawful deductions. If the Licensee voluntarily vacates before completion of the minimum stay period, the Security Deposit may be subject to forfeiture in accordance with this Agreement and applicable law.</p>

            <h3>7. Minimum Stay / Lock-in Period</h3>
            <p>Minimum Stay / Lock-in Period: The Licensee agrees to remain in occupation of the Licensed Premises for a minimum period of seven (7) months from the commencement of the relevant License Period. If the Licensee voluntarily vacates the Licensed Premises before completion of the said minimum period, the Security Deposit shall be liable to forfeiture, subject to the terms of this Agreement and applicable law.</p>

            <h3>8. Notice Period</h3>
            <p>Notice Period: ${noticeLabel}. This notice period is separate from the minimum stay / lock-in requirement.</p>

            <h3>9. Maintenance and Utilities</h3>
            <p>${maintenanceUtilities}</p>

            <h3>10. Use of Premises</h3>
            <p>The Licensee shall use the Licensed Premises in a lawful and responsible manner and shall comply with the applicable society, municipal and other local rules, subject to the terms of this Agreement.</p>

            <h3>11. Default / Breach</h3>
            <p>If the Licensee violates any of the terms and conditions of this Agreement, the Licensor shall have the right to terminate or revoke the License and require vacant possession of the Licensed Premises without waiting for the normal notice period, subject to applicable law and due process.</p>

            <h3>12. Termination / Revocation</h3>
            <p>On termination or revocation of this Leave and License Arrangement, the Licensee shall promptly vacate the Licensed Premises and hand over possession to the Licensor in a clean and licenseeable condition, subject to normal wear and tear and lawful deduction of amounts due.</p>

            <h3>13. One-Month Gap Between Separate License Periods</h3>
            <p>Each successive 11-month license period shall be separated by a one-month gap. No overlapping or back-to-back license periods are permitted without the required interregnum gap.</p>

            <h3>14. Renewal / Subsequent 11-Month Agreement</h3>
            <p>Any renewal or subsequent 11-month license arrangement shall be subject to mutual written agreement, review of the then-applicable legal requirements, and the terms approved by the parties.</p>

            <h3>15. Dispute Resolution</h3>
            <p>Any dispute arising under this Agreement shall, as far as practicable, be resolved amicably between the parties. In the event of any unresolved dispute, the parties may take appropriate legal action in the competent jurisdiction and in accordance with applicable law.</p>

            <h3>16. Governing Law / Jurisdiction</h3>
            <p>This Agreement shall be governed by and interpreted in accordance with the applicable law and jurisdiction relevant to the Licensed Premises. The parties acknowledge that legal requirements may vary by state and should be reviewed by a qualified legal professional before final execution.</p>

            <h3>17. Additional Notes</h3>
            <p>${specialNotes}</p>

            <p class="tiny-note">Draft generated for review. Agreement terms, stamp duty, registration requirements, notice provisions and enforceability should be verified according to the applicable state law and reviewed by a qualified legal professional before execution.</p>
        `;
    }

    function renderPreview() {
        preview.innerHTML = generateAgreementHtml();
    }

    function renderSavedDrafts() {
        const drafts = getAgreements();
        draftCount.textContent = drafts.length;

        if (!drafts.length) {
            savedDraftsBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:24px; color:#64748b;">No saved drafts yet.</td></tr>';
            return;
        }

        savedDraftsBody.innerHTML = drafts.map(function (draft) {
            return `
                <tr>
                    <td>${draft.licenseeName || '—'}</td>
                    <td>${draft.propertyAddress || '—'}</td>
                    <td>${draft.durationLabel || '11 months'}</td>
                    <td>${formatCurrency(draft.monthlyLicenseFee || 0)}</td>
                    <td>${formatCurrency(draft.securityDepositAmount || 0)}</td>
                    <td>
                        <button type="button" class="mini-btn view" data-draft-view="${draft.id}">View</button>
                        <button type="button" class="mini-btn delete" data-draft-delete="${draft.id}">Delete</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function resetForm() {
        form.reset();
        document.getElementById('selectedDuration').value = '11';
        document.querySelectorAll('.duration-option').forEach(function (button) {
            button.classList.toggle('active', Number(button.dataset.duration) === 11);
        });
        document.getElementById('noticePeriodDays').value = '30';
        document.getElementById('lockInPeriod').value = '7 months';
        document.getElementById('agreementStartDate').value = '';
        renderDurationSchedule();
        renderPreview();
    }

    function loadDraftForView(draftId) {
        const drafts = getAgreements();
        const draft = drafts.find(item => String(item.id) === String(draftId));
        if (!draft) return;

        const fields = [
            ['licensorName', 'licensorName'],
            ['licensorFatherName', 'licensorFatherName'],
            ['licensorAge', 'licensorAge'],
            ['licensorPan', 'licensorPan'],
            ['licensorAadhaar', 'licensorAadhaar'],
            ['licensorAddress', 'licensorAddress'],
            ['licensorMobile', 'licensorMobile'],
            ['licensorEmail', 'licensorEmail'],
            ['licenseeName', 'licenseeName'],
            ['licenseeFatherName', 'licenseeFatherName'],
            ['licenseeAge', 'licenseeAge'],
            ['licenseePan', 'licenseePan'],
            ['licenseeAadhaar', 'licenseeAadhaar'],
            ['licenseeAddress', 'licenseeAddress'],
            ['licenseeCurrentAddress', 'licenseeCurrentAddress'],
            ['licenseeMobile', 'licenseeMobile'],
            ['licenseeEmail', 'licenseeEmail'],
            ['propertyAddress', 'propertyAddress'],
            ['propertyFlatNo', 'propertyFlatNo'],
            ['propertyBuildingName', 'propertyBuildingName'],
            ['propertyFloor', 'propertyFloor'],
            ['propertyArea', 'propertyArea'],
            ['propertyPinCode', 'propertyPinCode'],
            ['propertyParking', 'propertyParking'],
            ['propertyType', 'propertyType'],
            ['agreementStartDate', 'agreementStartDate'],
            ['selectedDuration', 'selectedDuration'],
            ['monthlyLicenseFee', 'monthlyLicenseFee'],
            ['securityDepositAmount', 'securityDepositAmount'],
            ['noticePeriodDays', 'noticePeriodDays'],
            ['noticePeriodUnit', 'noticePeriodUnit'],
            ['maintenanceUtilities', 'maintenanceUtilities'],
            ['specialNotes', 'specialNotes']
        ];

        fields.forEach(function ([sourceKey, targetKey]) {
            const field = document.getElementById(targetKey);
            if (field && draft[sourceKey] !== undefined) {
                field.value = draft[sourceKey];
            }
        });

        document.querySelectorAll('.duration-option').forEach(function (button) {
            const value = Number(button.dataset.duration);
            button.classList.toggle('active', value === Number(draft.selectedDuration || 11));
        });

        renderDurationSchedule();
        renderPreview();
    }

    form.addEventListener('submit', function (event) {
        event.preventDefault();

        const payload = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
            licensorName: document.getElementById('licensorName').value.trim(),
            licensorFatherName: document.getElementById('licensorFatherName').value.trim(),
            licensorAge: document.getElementById('licensorAge').value,
            licensorPan: document.getElementById('licensorPan').value.trim(),
            licensorAadhaar: document.getElementById('licensorAadhaar').value.trim(),
            licensorAddress: document.getElementById('licensorAddress').value.trim(),
            licensorMobile: document.getElementById('licensorMobile').value.trim(),
            licensorEmail: document.getElementById('licensorEmail').value.trim(),
            licenseeName: document.getElementById('licenseeName').value.trim(),
            licenseeFatherName: document.getElementById('licenseeFatherName').value.trim(),
            licenseeAge: document.getElementById('licenseeAge').value,
            licenseePan: document.getElementById('licenseePan').value.trim(),
            licenseeAadhaar: document.getElementById('licenseeAadhaar').value.trim(),
            licenseeAddress: document.getElementById('licenseeAddress').value.trim(),
            licenseeCurrentAddress: document.getElementById('licenseeCurrentAddress').value.trim(),
            licenseeMobile: document.getElementById('licenseeMobile').value.trim(),
            licenseeEmail: document.getElementById('licenseeEmail').value.trim(),
            propertyAddress: document.getElementById('propertyAddress').value.trim(),
            propertyFlatNo: document.getElementById('propertyFlatNo').value.trim(),
            propertyBuildingName: document.getElementById('propertyBuildingName').value.trim(),
            propertyFloor: document.getElementById('propertyFloor').value.trim(),
            propertyArea: document.getElementById('propertyArea').value.trim(),
            propertyPinCode: document.getElementById('propertyPinCode').value.trim(),
            propertyParking: document.getElementById('propertyParking').value.trim(),
            propertyType: document.getElementById('propertyType').value,
            agreementStartDate: document.getElementById('agreementStartDate').value,
            selectedDuration: document.getElementById('selectedDuration').value,
            durationLabel: `${document.getElementById('selectedDuration').value} months`,
            monthlyLicenseFee: document.getElementById('monthlyLicenseFee').value,
            securityDepositAmount: document.getElementById('securityDepositAmount').value,
            noticePeriodDays: document.getElementById('noticePeriodDays').value,
            noticePeriodUnit: document.getElementById('noticePeriodUnit').value,
            maintenanceUtilities: document.getElementById('maintenanceUtilities').value.trim(),
            specialNotes: document.getElementById('specialNotes').value.trim(),
            createdAt: new Date().toISOString()
        };

        if (!payload.licensorName || !payload.licenseeName || !payload.propertyAddress || !payload.agreementStartDate || !payload.monthlyLicenseFee || !payload.securityDepositAmount) {
            alert('Please fill in the required licensor, licensee, property, duration, fee and deposit details before saving the draft.');
            return;
        }

        const drafts = getAgreements();
        drafts.push(payload);
        saveAgreements(drafts);
        renderSavedDrafts();
        renderPreview();
        alert('Leave and License Agreement draft saved successfully.');
    });

    resetButton.addEventListener('click', function () {
        resetForm();
    });

    previewButton.addEventListener('click', function () {
        renderPreview();
    });

    printButton.addEventListener('click', function () {
        window.print();
    });

    document.querySelectorAll('.duration-option').forEach(function (button) {
        button.addEventListener('click', function () {
            const value = Number(button.dataset.duration || 11);
            document.getElementById('selectedDuration').value = String(value);
            document.querySelectorAll('.duration-option').forEach(function (item) {
                item.classList.toggle('active', item === button);
            });
            renderDurationSchedule();
            renderPreview();
        });
    });

    document.getElementById('agreementStartDate').addEventListener('change', function () {
        renderDurationSchedule();
        renderPreview();
    });

    licenceeLookup.addEventListener('change', function () {
        populateFromlicensee(this.value);
    });

    propertyLookup.addEventListener('change', function () {
        populateFromProperty(this.value);
    });

    savedDraftsBody.addEventListener('click', function (event) {
        const deleteButton = event.target.closest('[data-draft-delete]');
        if (deleteButton) {
            const id = deleteButton.getAttribute('data-draft-delete');
            const nextDrafts = getAgreements().filter(item => String(item.id) !== String(id));
            saveAgreements(nextDrafts);
            renderSavedDrafts();
            return;
        }

        const viewButton = event.target.closest('[data-draft-view]');
        if (viewButton) {
            loadDraftForView(viewButton.getAttribute('data-draft-view'));
        }
    });

    populatelicenseeSelection();
    populatePropertySelection();
    renderDurationSchedule();
    renderPreview();
    renderSavedDrafts();
    resetForm();
});
