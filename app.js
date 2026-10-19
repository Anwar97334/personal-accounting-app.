// PUT YOUR REAL GOOGLE APPS SCRIPT WEB APP URL HERE (Ending in /exec)
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyXtucWSlm4kBxpCLN3xefz0MYM-EuccvdaRas8d2mqqNd-Q5hCPJh3H5rjdpqp4QNB/exec';

const ACCOUNTS = [
    "My Purse", "Home Cash Bag", "My Sbi", "My Cbi", 
    "Binita's Sbi", "Punni's Sbi", "Maa Bank", 
    "Binita's Cash", "Punni's Cash"
];

const SAVINGS_FUNDS = [
    "Bolero Car", "Bonku's Education", "Dream House", 
    "Survival Fund", "Thunderbird Bike", "Urgent Medical Fund", 
    "Yearly Travelling Fund"
];

let cachedTransactions = [];

document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const dateInput = document.getElementById('tx-date');
    if (dateInput) dateInput.value = today;

    renderAccountGrid();
    renderOpeningBalanceInputs();

    if (SCRIPT_URL && !SCRIPT_URL.includes('PASTE_YOUR_COPIED_URL_HERE')) {
        fetchDashboardMetrics();
    }
});

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
    
    const target = document.getElementById(tabId);
    if (target) target.classList.add('active');
    if (window.event && window.event.currentTarget) {
        window.event.currentTarget.classList.add('active');
    }

    if (tabId === 'transaction-history') {
        loadTransactionHistory();
    }
}

function formatINR(val) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
    }).format(val || 0);
}

function renderAccountGrid() {
    const grid = document.getElementById('balance-grid');
    if (!grid) return;
    grid.innerHTML = ACCOUNTS.map(acc => `
        <div class="account-card">
            <h4>${acc}</h4>
            <p id="bal-${acc.replace(/[^a-zA-Z0-9]/g, '')}">₹0.00</p>
        </div>
    `).join('');
}

function renderOpeningBalanceInputs() {
    const container = document.getElementById('ob-inputs-container');
    if (!container) return;
    container.innerHTML = ACCOUNTS.map(acc => `
        <div class="form-group">
            <label>${acc} (₹)</label>
            <input type="number" step="0.01" class="ob-amount-input" data-account="${acc}" placeholder="0.00" value="0">
        </div>
    `).join('');
}

function nextStep() {
    const date = document.getElementById('tx-date').value;
    const type = document.getElementById('tx-type').value;

    if (!date || !type) {
        alert("Please select both Date and Transaction Type.");
        return;
    }

    buildDynamicFields(type);
    document.getElementById('step-1').classList.remove('active');
    document.getElementById('step-2').classList.add('active');
}

function prevStep() {
    document.getElementById('step-2').classList.remove('active');
    document.getElementById('step-1').classList.add('active');
}

function handleCategoryChange() {
    const cat = document.getElementById('tx-category').value;
    const customWrapper = document.getElementById('custom-cat-wrapper');
    if (customWrapper) {
        customWrapper.style.display = (cat === 'OTHERS' || cat === 'Others') ? 'block' : 'none';
    }
}

function buildDynamicFields(type) {
    const container = document.getElementById('dynamic-fields');
    let html = '';
    const accountOpts = ACCOUNTS.map(a => `<option value="${a}">${a}</option>`).join('');

    if (type === "Direct Income") {
        html = `
            <div class="form-group">
                <label>Direct Income Category *</label>
                <select id="tx-category" onchange="handleCategoryChange()">
                    <option value="JIO TOWER">JIO TOWER</option>
                    <option value="PLOTS & LAND">PLOTS & LAND</option>
                    <option value="PROJECT ROAD">PROJECT ROAD</option>
                    <option value="RAYATI ROYALTY">RAYATI ROYALTY</option>
                    <option value="SECURITY GUARD">SECURITY GUARD</option>
                    <option value="OTHERS">OTHERS</option>
                </select>
            </div>
            <div class="form-group" id="custom-cat-wrapper" style="display:none;">
                <label>Custom Category Name</label>
                <input type="text" id="tx-custom-category" placeholder="Enter custom category">
            </div>
            <div class="form-group">
                <label>Account Type</label>
                <select id="tx-account-type">
                    <option value="Bank">Bank</option>
                    <option value="Cash">Cash</option>
                </select>
            </div>
            <div class="form-group">
                <label>Receiving Account *</label>
                <select id="tx-account">${accountOpts}</select>
            </div>
        `;
    } else if (type === "Indirect Inflow") {
        html = `
            <div class="form-group">
                <label>Indirect Inflow Category *</label>
                <select id="tx-category" onchange="handleCategoryChange()">
                    <option value="Taken Loan">Taken Loan</option>
                    <option value="By Loan Returns">By Loan Returns</option>
                    <option value="OTHERS">OTHERS</option>
                </select>
            </div>
            <div class="form-group" id="custom-cat-wrapper" style="display:none;">
                <label>Custom Category Name</label>
                <input type="text" id="tx-custom-category" placeholder="Enter custom category">
            </div>
            <div class="form-group">
                <label>Person / Party Name</label>
                <input type="text" id="tx-person" placeholder="Person name">
            </div>
            <div class="form-group">
                <label>Receiving Account *</label>
                <select id="tx-account">${accountOpts}</select>
            </div>
        `;
    } else if (type === "Direct Expenditure") {
        html = `
            <div class="form-group">
                <label>Direct Expenditure Category *</label>
                <select id="tx-category" onchange="handleCategoryChange()">
                    <option value="Dress & Fashion">Dress & Fashion</option>
                    <option value="Electric Bill">Electric Bill</option>
                    <option value="Family">Family</option>
                    <option value="Festive">Festive</option>
                    <option value="Gas">Gas</option>
                    <option value="Groceries">Groceries</option>
                    <option value="Home Décor">Home Décor</option>
                    <option value="Home Others">Home Others</option>
                    <option value="Medical Purpose">Medical Purpose</option>
                    <option value="Milk">Milk</option>
                    <option value="Mobile">Mobile</option>
                    <option value="Personal">Personal</option>
                    <option value="Social">Social</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Bonku's Education">Bonku's Education</option>
                    <option value="Suspense">Suspense</option>
                    <option value="Others">Others</option>
                </select>
            </div>
            <div class="form-group" id="custom-cat-wrapper" style="display:none;">
                <label>Custom Category Name</label>
                <input type="text" id="tx-custom-category" placeholder="Enter custom category">
            </div>
            <div class="form-group">
                <label>Account Deducted *</label>
                <select id="tx-account">${accountOpts}</select>
            </div>
        `;
    } else if (type === "Indirect Outflow") {
        html = `
            <div class="form-group">
                <label>Indirect Outflow Category *</label>
                <select id="tx-category" onchange="handleCategoryChange()">
                    <option value="Given Loan">Given Loan</option>
                    <option value="To Loan Return">To Loan Return</option>
                    <option value="Plots & Lands">Plots & Lands</option>
                    <option value="Project Road">Project Road</option>
                    <option value="Rayati Royalty">Rayati Royalty</option>
                    <option value="Security Guard">Security Guard</option>
                    <option value="Share of God">Share of God</option>
                    <option value="Others">Others</option>
                </select>
            </div>
            <div class="form-group" id="custom-cat-wrapper" style="display:none;">
                <label>Custom Category Name</label>
                <input type="text" id="tx-custom-category" placeholder="Enter custom category">
            </div>
            <div class="form-group">
                <label>Person / Party Name</label>
                <input type="text" id="tx-person" placeholder="Person name">
            </div>
            <div class="form-group">
                <label>Account Deducted *</label>
                <select id="tx-account">${accountOpts}</select>
            </div>
        `;
    } else if (type === "Savings Funds") {
        const fundsOpts = SAVINGS_FUNDS.map(f => `<option value="${f}">${f}</option>`).join('');
        html = `
            <div class="form-group">
                <label>Savings Fund *</label>
                <select id="tx-savings-fund">${fundsOpts}</select>
            </div>
            <div class="form-group">
                <label>Source Account *</label>
                <select id="tx-account">${accountOpts}</select>
            </div>
        `;
    } else if (type === "Transfer") {
        html = `
            <div class="form-group">
                <label>Transfer Type *</label>
                <select id="tx-transfer-type">
                    <option value="ATM Withdraw">ATM Withdraw</option>
                    <option value="Bank Deposit">Bank Deposit</option>
                    <option value="Bank to Bank">Bank to Bank</option>
                    <option value="Cash to Cash">Cash to Cash</option>
                </select>
            </div>
            <div class="form-group">
                <label>From Account (Subtraction) *</label>
                <select id="tx-source">${accountOpts}</select>
            </div>
            <div class="form-group">
                <label>To Account (Addition) *</label>
                <select id="tx-dest">${accountOpts}</select>
            </div>
        `;
    }

    container.innerHTML = html;
}

async function saveTransaction() {
    const btn = document.getElementById('save-btn');
    const loader = document.getElementById('loader');
    const notif = document.getElementById('notification');

    const amountVal = document.getElementById('tx-amount').value;
    const amount = parseFloat(amountVal);

    if (!amountVal || isNaN(amount) || amount <= 0) {
        alert("Please enter a valid positive number for Amount.");
        return;
    }

    const type = document.getElementById('tx-type').value;
    const sourceAcc = document.getElementById('tx-source') ? document.getElementById('tx-source').value : null;
    const destAcc = document.getElementById('tx-dest') ? document.getElementById('tx-dest').value : null;

    if (type === "Transfer" && sourceAcc === destAcc) {
        alert("From and To accounts cannot be identical.");
        return;
    }

    btn.disabled = true;
    loader.classList.remove('hidden');
    notif.classList.add('hidden');

    const payload = {
        action: "saveTransaction",
        data: {
            transactionId: 'TX-' + Date.now(),
            date: document.getElementById('tx-date').value,
            transactionType: type,
            description: document.getElementById('tx-desc').value || "",
            amount: amount,
            category: document.getElementById('tx-category') ? document.getElementById('tx-category').value : "",
            customCategory: document.getElementById('tx-custom-category') ? document.getElementById('tx-custom-category').value : "",
            accountType: document.getElementById('tx-account-type') ? document.getElementById('tx-account-type').value : "",
            accountName: document.getElementById('tx-account') ? document.getElementById('tx-account').value : "",
            personName: document.getElementById('tx-person') ? document.getElementById('tx-person').value : "",
            transferType: document.getElementById('tx-transfer-type') ? document.getElementById('tx-transfer-type').value : "",
            sourceAccount: sourceAcc,
            destAccount: destAcc,
            savingsFundName: document.getElementById('tx-savings-fund') ? document.getElementById('tx-savings-fund').value : ""
        }
    };

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.status === "success") {
            notif.textContent = "Transaction saved successfully! (ID: " + result.transactionId + ")";
            notif.className = 'notif-success';
            notif.classList.remove('hidden');

            document.getElementById('tx-amount').value = '';
            document.getElementById('tx-desc').value = '';
            prevStep();
            fetchDashboardMetrics();
        } else {
            throw new Error(result.message || "Failed to save record.");
        }
    } catch (error) {
        notif.textContent = "Error: " + error.message;
        notif.className = 'notif-error';
        notif.classList.remove('hidden');
    } finally {
        btn.disabled = false;
        loader.classList.add('hidden');
    }
}

async function loadTransactionHistory() {
    const month = document.getElementById('dash-month').value;
    const year = document.getElementById('dash-year').value;
    const tbody = document.getElementById('history-table-body');
    const loader = document.getElementById('history-loader');

    loader.classList.remove('hidden');

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: "getTransactions",
                month: month,
                year: year
            })
        });

        const res = await response.json();
        if (res.status === "success") {
            cachedTransactions = res.data;
            if (cachedTransactions.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" style="text-align: center;">No transactions found for ${month} ${year}.</td></tr>`;
            } else {
                tbody.innerHTML = cachedTransactions.map(tx => {
                    const accDisplay = tx.accountName || (tx.sourceAccount + " → " + tx.destAccount) || '-';
                    const formattedDate = new Date(tx.date).toLocaleDateString('en-GB');
                    return `
                        <tr>
                            <td>${formattedDate}</td>
                            <td>${tx.transactionType}</td>
                            <td>${tx.category || tx.customCategory || '-'}</td>
                            <td>${accDisplay}</td>
                            <td>${tx.description || '-'}</td>
                            <td><strong>${formatINR(tx.amount)}</strong></td>
                            <td style="text-align: center;">
                                <div class="btn-action-group">
                                    <button class="btn-edit" onclick="openEditModal('${tx.transactionId}')">Edit</button>
                                    <button class="btn-delete" onclick="deleteRecord('${tx.transactionId}')">Delete</button>
                                </div>
                            </td>
                        </tr>
                    `;
                }).join('');
            }
        }
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7" style="color:red; text-align:center;">Failed to load records: ${err.message}</td></tr>`;
    } finally {
        loader.classList.add('hidden');
    }
}

function openEditModal(transactionId) {
    const tx = cachedTransactions.find(t => String(t.transactionId) === String(transactionId));
    if (!tx) return;

    document.getElementById('edit-tx-id').value = tx.transactionId;
    
    const formattedDate = new Date(tx.date).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    document.getElementById('edit-tx-date').value = formattedDate;
    document.getElementById('edit-tx-amount').value = tx.amount;
    document.getElementById('edit-tx-desc').value = tx.description || '';

    const dynamicContainer = document.getElementById('edit-dynamic-fields');
    const accountOpts = ACCOUNTS.map(a => `<option value="${a}" ${a === (tx.accountName || tx.sourceAccount) ? 'selected' : ''}>${a}</option>`).join('');

    let extraHtml = '';
    if (tx.transactionType === "Transfer") {
        const destOpts = ACCOUNTS.map(a => `<option value="${a}" ${a === tx.destAccount ? 'selected' : ''}>${a}</option>`).join('');
        extraHtml = `
            <div class="form-group">
                <label>From Account</label>
                <select id="edit-tx-source">${accountOpts}</select>
            </div>
            <div class="form-group">
                <label>To Account</label>
                <select id="edit-tx-dest">${destOpts}</select>
            </div>
        `;
    } else {
        extraHtml = `
            <div class="form-group">
                <label>Account</label>
                <select id="edit-tx-account">${accountOpts}</select>
            </div>
        `;
    }

    dynamicContainer.innerHTML = extraHtml;
    document.getElementById('edit-modal').classList.remove('hidden');
}

function closeEditModal() {
    document.getElementById('edit-modal').classList.add('hidden');
}

async function saveEditedTransaction() {
    const txId = document.getElementById('edit-tx-id').value;
    const tx = cachedTransactions.find(t => String(t.transactionId) === String(txId));
    if (!tx) return;

    const amount = parseFloat(document.getElementById('edit-tx-amount').value);
    if (!amount || amount <= 0) {
        alert("Please enter a valid positive amount.");
        return;
    }

    const saveBtn = document.getElementById('edit-save-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = "Updating...";

    const updatedData = {
        ...tx,
        date: document.getElementById('edit-tx-date').value,
        amount: amount,
        description: document.getElementById('edit-tx-desc').value,
        accountName: document.getElementById('edit-tx-account') ? document.getElementById('edit-tx-account').value : tx.accountName,
        sourceAccount: document.getElementById('edit-tx-source') ? document.getElementById('edit-tx-source').value : tx.sourceAccount,
        destAccount: document.getElementById('edit-tx-dest') ? document.getElementById('edit-tx-dest').value : tx.destAccount
    };

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: "updateTransaction",
                data: updatedData
            })
        });

        const res = await response.json();
        if (res.status === "success") {
            alert(res.message);
            closeEditModal();
            loadTransactionHistory();
            fetchDashboardMetrics();
        } else {
            alert("Error: " + res.message);
        }
    } catch (err) {
        alert("Update failed: " + err.message);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = "Save Changes";
    }
}

async function deleteRecord(transactionId) {
    if (!confirm("Are you sure you want to delete this transaction? Balances will be recalculated.")) {
        return;
    }

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: "deleteTransaction",
                transactionId: transactionId
            })
        });

        const res = await response.json();
        if (res.status === "success") {
            alert(res.message);
            loadTransactionHistory();
            fetchDashboardMetrics();
        } else {
            alert("Error: " + res.message);
        }
    } catch (err) {
        alert("Delete failed: " + err.message);
    }
}

async function submitOpeningBalances() {
    const btn = document.getElementById('ob-save-btn');
    const loader = document.getElementById('ob-loader');
    const notif = document.getElementById('ob-notification');
    const year = document.getElementById('ob-year').value;
    const month = document.getElementById('ob-month').value;

    const balances = {};
    document.querySelectorAll('.ob-amount-input').forEach(input => {
        const acc = input.getAttribute('data-account');
        balances[acc] = parseFloat(input.value) || 0;
    });

    btn.disabled = true;
    loader.classList.remove('hidden');
    notif.classList.add('hidden');

    const payload = {
        action: "saveOpeningBalances",
        data: {
            year: year,
            month: month,
            balances: balances
        }
    };

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (result.status === "success") {
            notif.textContent = result.message;
            notif.className = 'notif-success';
            notif.classList.remove('hidden');

            fetchDashboardMetrics();
        } else {
            throw new Error(result.message || "Failed to save opening balances.");
        }
    } catch (err) {
        notif.textContent = "Error: " + err.message;
        notif.className = 'notif-error';
        notif.classList.remove('hidden');
    } finally {
        btn.disabled = false;
        loader.classList.add('hidden');
    }
}

async function fetchDashboardMetrics() {
    if (!SCRIPT_URL || SCRIPT_URL.includes('PASTE_YOUR_COPIED_URL_HERE')) return;

    const month = document.getElementById('dash-month').value;
    const year = document.getElementById('dash-year').value;

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: "getDashboard",
                month: month,
                year: year
            })
        });

        const res = await response.json();
        if (res.status === "success") {
            const d = res.data;

            document.getElementById('dash-total-income').textContent = formatINR(d.totalIncome);
            document.getElementById('dash-direct-income').textContent = formatINR(d.directIncome);
            document.getElementById('dash-indirect-income').textContent = formatINR(d.indirectInflow);

            document.getElementById('dash-total-expense').textContent = formatINR(d.totalExpense);
            document.getElementById('dash-direct-expense').textContent = formatINR(d.directExpense);
            document.getElementById('dash-indirect-expense').textContent = formatINR(d.indirectOutflow);

            const net = d.totalIncome - d.totalExpense;
            document.getElementById('dash-net-flow').textContent = formatINR(net);

            if (d.balances) {
                ACCOUNTS.forEach(acc => {
                    const cleanKey = acc.replace(/[^a-zA-Z0-9]/g, '');
                    const el = document.getElementById(`bal-${cleanKey}`);
                    const b = d.balances[acc] || 0;
                    if (el) el.textContent = formatINR(b);
                });
            }
        }
    } catch (err) {
        console.warn("Could not sync metrics:", err);
    }
}
