/**
 * PERSONAL ACCOUNTING WEB APP - FRONTEND ENGINE
 * Connects UI to Google Apps Script Web API
 */

// ========================================================
// 1. CONFIGURATION: PASTE YOUR DEPLOYED WEB APP URL HERE
// ========================================================
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbztAt2EsTrGp8tcngD9E6QeYStUKce16nVVJ22NXaJGpk9Bd9K7GB4tBicueQmiFhNz/exec'; // Must end in /exec

// Nine Master Accounts
const ACCOUNTS = [
    "My Purse", "Home Cash Bag", "My Sbi", "My Cbi", 
    "Binita's Sbi", "Punni's Sbi", "Maa Bank", 
    "Binita's Cash", "Punni's Cash"
];

// Savings Funds with Target Amounts
const SAVINGS_TARGETS = {
    "Bolero Car": 1000000,
    "Bonku's Education": 1000000,
    "Dream House": 6000000,
    "Survival Fund": 500000,
    "Thunderbird Bike": 300000,
    "Urgent Medical Fund": 500000,
    "Yearly Travelling Fund": 100000
};

// ========================================================
// 2. INITIALIZATION & NAVIGATION
// ========================================================

document.addEventListener('DOMContentLoaded', () => {
    // Default transaction date to today in Indian Standard Time (Asia/Kolkata)
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const dateInput = document.getElementById('tx-date');
    if (dateInput) dateInput.value = today;

    // Render placeholder cards for 9 accounts
    renderAccountPlaceholders();
    
    // Initial fetch of metrics if endpoint configured
    if (SCRIPT_URL && !SCRIPT_URL.includes('YOUR_WEB_APP_URL_HERE')) {
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
}

function formatINR(val) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
    }).format(val || 0);
}

function renderAccountPlaceholders() {
    const grid = document.getElementById('balance-grid');
    if (!grid) return;
    grid.innerHTML = ACCOUNTS.map(acc => `
        <div class="account-card" id="card-${acc.replace(/[^a-zA-Z0-9]/g, '')}">
            <h4>${acc}</h4>
            <p id="bal-${acc.replace(/[^a-zA-Z0-9]/g, '')}">₹0.00</p>
        </div>
    `).join('');
}

// ========================================================
// 3. MULTI-STEP FORM BUILDER
// ========================================================

function nextStep() {
    const date = document.getElementById('tx-date').value;
    const type = document.getElementById('tx-type').value;

    if (!date || !type) {
        alert("Please select both a Transaction Date and Transaction Type.");
        return;
    }

    buildStepTwoFields(type);
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

function buildStepTwoFields(type) {
    const container = document.getElementById('dynamic-fields');
    let html = '';
    const accountOpts = ACCOUNTS.map(a => `<option value="${a}">${a}</option>`).join('');

    if (type === "Direct Income") {
        html = `
            <div class="form-group">
                <label>Direct Income Category *</label>
                <select id="tx-category" onchange="handleCategoryChange()" required>
                    <option value="JIO TOWER">JIO TOWER</option>
                    <option value="PLOTS & LAND">PLOTS & LAND</option>
                    <option value="PROJECT ROAD">PROJECT ROAD</option>
                    <option value="RAYATI ROYALTY">RAYATI ROYALTY</option>
                    <option value="SECURITY GUARD">SECURITY GUARD</option>
                    <option value="OTHERS">OTHERS</option>
                </select>
            </div>
            <div class="form-group" id="custom-cat-wrapper" style="display:none;">
                <label>Custom Category Name *</label>
                <input type="text" id="tx-custom-category" placeholder="Specify income stream">
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
                <select id="tx-category" onchange="handleCategoryChange()" required>
                    <option value="Taken Loan">Taken Loan (Borrowing)</option>
                    <option value="By Loan Returns">By Loan Returns (Receivable repayment)</option>
                    <option value="OTHERS">OTHERS</option>
                </select>
            </div>
            <div class="form-group" id="custom-cat-wrapper" style="display:none;">
                <label>Custom Category Name *</label>
                <input type="text" id="tx-custom-category" placeholder="Specify inflow category">
            </div>
            <div class="form-group">
                <label>Person or Party Name</label>
                <input type="text" id="tx-person" placeholder="Name of lender or party">
            </div>
            <div class="form-group">
                <label>Account Name *</label>
                <select id="tx-account">${accountOpts}</select>
            </div>
        `;
    } else if (type === "Direct Expenditure") {
        html = `
            <div class="form-group">
                <label>Direct Expenditure Category *</label>
                <select id="tx-category" onchange="handleCategoryChange()" required>
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
                <label>Custom Category Name *</label>
                <input type="text" id="tx-custom-category" placeholder="Enter expenditure purpose">
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
                <select id="tx-category" onchange="handleCategoryChange()" required>
                    <option value="Given Loan">Given Loan (Lending)</option>
                    <option value="To Loan Return">To Loan Return (Debt repayment)</option>
                    <option value="Plots & Lands">Plots & Lands (Project)</option>
                    <option value="Project Road">Project Road (Project)</option>
                    <option value="Rayati Royalty">Rayati Royalty (Project)</option>
                    <option value="Security Guard">Security Guard (Project)</option>
                    <option value="Share of God">Share of God (Payout)</option>
                    <option value="Others">Others</option>
                </select>
            </div>
            <div class="form-group" id="custom-cat-wrapper" style="display:none;">
                <label>Custom Category Name *</label>
                <input type="text" id="tx-custom-category" placeholder="Enter custom outflow description">
            </div>
            <div class="form-group">
                <label>Person / Party Name (For Loans)</label>
                <input type="text" id="tx-person" placeholder="Party Name">
            </div>
            <div class="form-group">
                <label>Account Deducted *</label>
                <select id="tx-account">${accountOpts}</select>
            </div>
        `;
    } else if (type === "Savings Funds") {
        const fundsOpts = Object.keys(SAVINGS_TARGETS).map(f => `<option value="${f}">${f}</option>`).join('');
        html = `
            <div class="form-group">
                <label>Target Savings Fund *</label>
                <select id="tx-savings-fund">${fundsOpts}</select>
            </div>
            <div class="form-group">
                <label>Source Account (Deducted From) *</label>
                <select id="tx-account">${accountOpts}</select>
            </div>
        `;
    } else if (type === "Transfer") {
        html = `
            <div class="form-group">
                <label>Transfer Type *</label>
                <select id="tx-transfer-type">
                    <option value="ATM Withdraw">ATM Withdraw (Bank to Cash)</option>
                    <option value="Bank Deposit">Bank Deposit (Cash to Bank)</option>
                    <option value="Bank to Bank">Bank to Bank</option>
                    <option value="Cash to Cash">Cash to Cash</option>
                </select>
            </div>
            <div class="form-group">
                <label>Subtraction Account (From) *</label>
                <select id="tx-source">${accountOpts}</select>
            </div>
            <div class="form-group">
                <label>Addition Account (To) *</label>
                <select id="tx-dest">${accountOpts}</select>
            </div>
        `;
    }

    container.innerHTML = html;
}

// ========================================================
// 4. API DISPATCH: SAVE TRANSACTION (CORS SAFE)
// ========================================================

async function saveTransaction() {
    const btn = document.getElementById('save-btn');
    const loader = document.getElementById('loader');
    const notif = document.getElementById('notification');

    const amountVal = document.getElementById('tx-amount').value;
    const amount = parseFloat(amountVal);

    if (!amountVal || isNaN(amount) || amount <= 0) {
        alert("Please enter a valid positive numerical amount.");
        return;
    }

    const type = document.getElementById('tx-type').value;
    const sourceAcc = document.getElementById('tx-source') ? document.getElementById('tx-source').value : null;
    const destAcc = document.getElementById('tx-dest') ? document.getElementById('tx-dest').value : null;

    if (type === "Transfer" && sourceAcc === destAcc) {
        alert("Subtraction and Addition accounts cannot be identical.");
        return;
    }

    // Lock UI against double submissions
    btn.disabled = true;
    loader.classList.remove('hidden');
    notif.classList.add('hidden');

    const payload = {
        action: "saveTransaction",
        data: {
            transactionId: 'TX-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
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
        // text/plain bypasses OPTIONS preflight check in browser
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.status === "success") {
            notif.textContent = `Transaction saved successfully! ID: ${result.transactionId}`;
            notif.className = 'notif-success';
            notif.classList.remove('hidden');

            // Reset inputs
            document.getElementById('tx-amount').value = '';
            document.getElementById('tx-desc').value = '';
            prevStep();
            fetchDashboardMetrics();
        } else {
            throw new Error(result.message || "Failed to commit record.");
        }
    } catch (error) {
        notif.textContent = "Submission Error: " + error.message;
        notif.className = 'notif-error';
        notif.classList.remove('hidden');
    } finally {
        btn.disabled = false;
        loader.classList.add('hidden');
    }
}

// ========================================================
// 5. METRICS AND DATA SYNC ENGINE
// ========================================================

async function fetchDashboardMetrics() {
    if (!SCRIPT_URL || SCRIPT_URL.includes('YOUR_WEB_APP_URL_HERE')) return;

    const month = document.getElementById('dash-month').value;
    const year = document.getElementById('dash-year').value;

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify({
                action: "getDashboard",
                month: month,
                year: year
            })
        });

        const res = await response.json();
        if (res.status === "success") {
            const d = res.data;

            // Update Cash Flow Cards
            document.getElementById('dash-total-income').textContent = formatINR(d.totalIncome);
            document.getElementById('dash-direct-income').textContent = formatINR(d.totalDirectIncome);
            document.getElementById('dash-indirect-income').textContent = formatINR(d.totalIndirectInflow);

            document.getElementById('dash-total-expense').textContent = formatINR(d.totalExpenditure);
            document.getElementById('dash-direct-expense').textContent = formatINR(d.totalDirectExpenditure);
            document.getElementById('dash-indirect-expense').textContent = formatINR(d.totalIndirectOutflow);

            const net = d.totalIncome - d.totalExpenditure;
            document.getElementById('dash-net-flow').textContent = formatINR(net);

            // Update 9 Accounts
            let combinedBalance = 0;
            if (d.balances) {
                ACCOUNTS.forEach(acc => {
                    const cleanKey = acc.replace(/[^a-zA-Z0-9]/g, '');
                    const el = document.getElementById(`bal-${cleanKey}`);
                    const b = d.balances[acc] || 0;
                    combinedBalance += b;
                    if (el) el.textContent = formatINR(b);
                });
            }
            document.getElementById('dash-total-combined').textContent = `Total In Hand: ${formatINR(combinedBalance)}`;

            // Update Savings Tab
            if (d.savings && d.savings.length > 0) {
                const tbody = document.getElementById('savings-table-body');
                if (tbody) {
                    tbody.innerHTML = d.savings.map(s => {
                        const target = parseFloat(s.target) || 1;
                        const acc = parseFloat(s.accumulated) || 0;
                        const pct = Math.min(100, Math.round((acc / target) * 100));
                        return `
                            <tr>
                                <td><strong>${s.fundName}</strong></td>
                                <td>${formatINR(target)}</td>
                                <td>${formatINR(acc)}</td>
                                <td>${pct}%</td>
                            </tr>
                        `;
                    }).join('');
                }
            }
        }
    } catch (err) {
        console.warn("Dashboard sync failed (check connection/endpoint):", err);
    }
}
