// REPLACE WITH YOUR DEPLOYED GOOGLE APPS SCRIPT WEB APP URL
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbySFmRqGmcAco1GwNAu0wiCN1xii1fAu0xfqbi46boF4wcnFZFfCpJ1z1FgmCVFW7NC/exec';

// Account Master List
const ACCOUNTS = [
    "My Purse", "Home Cash Bag", "My Sbi", "My Cbi", 
    "Binita's Sbi", "Punni's Sbi", "Maa Bank", 
    "Binita's Cash", "Punni's Cash"
];

// Initialize Date to Asia/Kolkata
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    document.getElementById('tx-date').value = today;
});

// UI Navigation
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
}

// Form State Management
function nextStep() {
    const type = document.getElementById('tx-type').value;
    if (!document.getElementById('tx-date').value || !type) {
        alert("Date and Transaction Type are required.");
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

// Generate UUID for Idempotency
function generateUUID() {
    return 'tx-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
}

// Format Currency to Indian Standard
function formatINR(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
}

// Dynamic Field Generation based on Transaction Type
function buildDynamicFields(type) {
    const container = document.getElementById('dynamic-fields');
    let html = '';

    const accountOptions = ACCOUNTS.map(acc => `<option value="${acc}">${acc}</option>`).join('');

    if (type === "Direct Income") {
        html += `
            <div class="form-group">
                <label>Direct Income Category</label>
                <select id="tx-category">
                    <option value="JIO TOWER">JIO TOWER</option>
                    <option value="PLOTS & LAND">PLOTS & LAND</option>
                    <option value="PROJECT ROAD">PROJECT ROAD</option>
                    <option value="RAYATI ROYALTY">RAYATI ROYALTY</option>
                    <option value="SECURITY GUARD">SECURITY GUARD</option>
                    <option value="OTHERS">OTHERS</option>
                </select>
            </div>
            <div class="form-group">
                <label>Account Name</label>
                <select id="tx-account">${accountOptions}</select>
            </div>
        `;
    } else if (type === "Transfer") {
        html += `
            <div class="form-group">
                <label>Transfer Type</label>
                <select id="tx-transfer-type">
                    <option value="ATM Withdraw">ATM Withdraw</option>
                    <option value="Bank Deposit">Bank Deposit</option>
                    <option value="Bank to Bank">Bank to Bank</option>
                    <option value="Cash to Cash">Cash to Cash</option>
                </select>
            </div>
            <div class="form-group">
                <label>Subtraction Account (From)</label>
                <select id="tx-source">${accountOptions}</select>
            </div>
            <div class="form-group">
                <label>Adding Account (To)</label>
                <select id="tx-dest">${accountOptions}</select>
            </div>
        `;
    }
    // ... Implement logic for Indirect Inflow, Expenditures, Savings using similar blocks matching the prompt spec ...

    container.innerHTML = html;
}

// Save Transaction (Fetch API to Apps Script)
async function saveTransaction() {
    const btn = document.getElementById('save-btn');
    const loader = document.getElementById('loader');
    const notif = document.getElementById('notification');
    
    const amount = parseFloat(document.getElementById('tx-amount').value);
    if (!amount || amount <= 0) {
        alert("Please enter a valid positive amount.");
        return;
    }

    // Disable button to prevent double tap
    btn.disabled = true;
    loader.classList.remove('hidden');
    notif.classList.add('hidden');

    const payload = {
        action: "saveTransaction",
        data: {
            transactionId: generateUUID(),
            date: document.getElementById('tx-date').value,
            transactionType: document.getElementById('tx-type').value,
            description: document.getElementById('tx-desc').value,
            amount: amount,
            // Gather dynamic fields safely
            category: document.getElementById('tx-category') ? document.getElementById('tx-category').value : null,
            accountName: document.getElementById('tx-account') ? document.getElementById('tx-account').value : null,
            sourceAccount: document.getElementById('tx-source') ? document.getElementById('tx-source').value : null,
            destAccount: document.getElementById('tx-dest') ? document.getElementById('tx-dest').value : null,
            transferType: document.getElementById('tx-transfer-type') ? document.getElementById('tx-transfer-type').value : null,
        }
    };

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        
        if (result.status === "success") {
            notif.textContent = `Success! ID: ${result.transactionId}`;
            notif.className = 'notif-success';
            // Reset form
            document.getElementById('tx-amount').value = '';
            document.getElementById('tx-desc').value = '';
            prevStep();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        notif.textContent = "Error: " + error.message;
        notif.className = 'notif-error';
    } finally {
        btn.disabled = false;
        loader.classList.add('hidden');
        notif.classList.remove('hidden');
    }
}
