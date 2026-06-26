// ESTRUTURA CENTRAL DE DADOS DO SISTEMA
let appData = {
    users: [],
    months: [], 
    expenses: [],
    incomes: [],
    bankBalances: {} // Estrutura: { "username": { "YYYY-MM": 0.00 } }
};

let isFirstKey = true;

window.onload = function() {
    if (localStorage.getItem("finance_app_data")) {
        appData = JSON.parse(localStorage.getItem("finance_app_data"));
    }
    
    // Inicialização segura de novos objetos
    if (!appData.bankBalances) appData.bankBalances = {};
    appData.expenses.forEach(exp => {
        if (!exp.paidStatuses) exp.paidStatuses = {};
    });

    renderAll();
    
    if (document.getElementById("gh-user")) {
        if(localStorage.getItem("gh_user")) document.getElementById("gh-user").value = localStorage.getItem("gh_user");
        if(localStorage.getItem("gh_repo")) document.getElementById("gh-repo").value = localStorage.getItem("gh_repo");
        if(localStorage.getItem("gh_token")) document.getElementById("gh-token").value = localStorage.getItem("gh_token");
    }
};

function saveToStorage() {
    localStorage.setItem("finance_app_data", JSON.stringify(appData));
}

function formatEuro(value) {
    if (value === undefined || value === null || isNaN(value)) return "€0,00";
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
}

function formatMonthLabel(monthString) {
    if (!monthString || monthString === "Nenhum mês criado") return "";
    const [year, month] = monthString.split('-');
    const date = new Date(year, month - 1, 1);
    const monthName = date.toLocaleString('pt-PT', { month: 'long' });
    return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
}

function renderAll() {
    if (document.getElementById("users-list")) renderUsers();
    if (document.querySelectorAll(".user-dropdown-select").length > 0) updateDropdowns();
    if (document.getElementById("dashboard-month-select")) renderMonthsSelector();
    
    updateDashboard();
    saveToStorage();
}

// GESTÃO DE UTILIZADORES
function renderUsers() {
    const listContainer = document.getElementById("users-list");
    if (!listContainer) return;
    listContainer.innerHTML = "";
    appData.users.forEach(user => {
        const tag = document.createElement("div");
        tag.className = "tag";
        tag.innerHTML = `${user} <span class="remove-btn" onclick="deleteUser('${user}')">&times;</span>`;
        listContainer.appendChild(tag);
    });
}

function addUser() {
    const input = document.getElementById("new-user-name");
    const name = input.value.trim();
    if (!name) return;
    if (appData.users.includes(name)) return alert("Responsável já existe!");
    appData.users.push(name);
    if(!appData.bankBalances[name]) appData.bankBalances[name] = {};
    input.value = "";
    renderAll();
}

function deleteUser(name) {
    if (confirm(`Remover "${name}"? Registos antigos continuam guardados.`)) {
        appData.users = appData.users.filter(u => u !== name);
        renderAll();
    }
}

function updateDropdowns() {
    document.querySelectorAll(".user-dropdown-select").forEach(select => {
        select.innerHTML = "";
        if (appData.users.length === 0) {
            select.innerHTML = "<option value=''>Crie um responsável primeiro</option>";
            return;
        }
        appData.users.forEach(user => {
            const opt = document.createElement("option");
            opt.value = user; opt.textContent = user;
            select.appendChild(opt);
        });
    });
}

// GESTÃO DE MESES
function addMonth() {
    const input = document.getElementById("new-month-input");
    const month = input.value;
    if (!month) return;
    if (appData.months.includes(month)) return alert("Mês já existe!");
    
    const lastActiveMonth = appData.months[appData.months.length - 1];
    appData.months.push(month);
    
    if (lastActiveMonth) {
        appData.expenses.forEach(exp => {
            if (exp.type === 'recorrente' && exp.values[lastActiveMonth] !== undefined) {
                exp.values[month] = exp.values[lastActiveMonth];
                if(!exp.paidStatuses) exp.paidStatuses = {};
                exp.paidStatuses[month] = false;
            }
        });
    }
    if (input) input.value = "";
    renderAll();
    alert("Mês adicionado com sucesso!");
}

function deleteMonth(month) {
    if (confirm(`Eliminar o mês ${formatMonthLabel(month)}? Isto removerá os valores deste mês em todos os serviços.`)) {
        appData.months = appData.months.filter(m => m !== month);
        renderAll();
    }
}

function renderMonthsSelector() {
    const select = document.getElementById("dashboard-month-select");
    if (!select) return;
    const current = select.value;
    select.innerHTML = "";
    if (appData.months.length === 0) {
        select.innerHTML = "<option value=''>Nenhum mês criado</option>";
        return;
    }
    appData.months.forEach(m => {
        const opt = document.createElement("option");
        opt.value = m; opt.textContent = formatMonthLabel(m);
        select.appendChild(opt);
    });
    if (appData.months.includes(current)) {
        select.value = current;
    } else {
        select.value = appData.months[appData.months.length - 1]; 
    }
}

function toggleExpensePaid(id, month, isChecked) {
    let item = appData.expenses.find(e => e.id === id);
    if (item) {
        if (!item.paidStatuses) item.paidStatuses = {};
        item.paidStatuses[month] = isChecked;
    }
    saveToStorage();
    
    // CORREÇÃO: Força o ecrã a redesenhar os saldos e as tabelas com os novos cálculos
    updateDashboard(); 
}

function handleBankBalanceBlur(input) {
    let raw = input.value.trim().replace(/,/g, '.');
    let num = parseFloat(raw);
    if (isNaN(num)) num = 0.00;
    const user = input.dataset.user;
    const month = input.dataset.month;
    if (!appData.bankBalances[user]) appData.bankBalances[user] = {};
    appData.bankBalances[user][month] = num;
    saveToStorage();
    updateDashboard();
}

// TABELA DE SALDOS BANCÁRIOS
function renderBankBalancesTable(activeMonth) {
    const table = document.getElementById("bank-balances-table");
    if (!table) return;
    const tbody = table.querySelector("tbody");
    tbody.innerHTML = "";

    if (!activeMonth) {
        tbody.innerHTML = "<tr><td colspan='3' style='text-align:center; color:#64748b;'>Nenhum mês ativo.</td></tr>";
        return;
    }
    if (appData.users.length === 0) {
        tbody.innerHTML = "<tr><td colspan='3' style='text-align:center; color:#64748b;'>Nenhum utilizador criado.</td></tr>";
        return;
    }

    appData.users.forEach(u => {
        if (!appData.bankBalances[u]) appData.bankBalances[u] = {};
        let currentInitial = appData.bankBalances[u][activeMonth] || 0;
        
        let totalPaidByThisUser = appData.expenses
            .filter(e => e.user === u && e.paidStatuses && e.paidStatuses[activeMonth] === true)
            .reduce((acc, curr) => acc + (curr.values[activeMonth] || 0), 0);
            
        let realAvailable = currentInitial - totalPaidByThisUser;
        const valStr = currentInitial.toFixed(2).replace('.', ',');

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${u}</strong></td>
            <td style="text-align:right;">
                <input type="text" class="currency-input" data-user="${u}" data-month="${activeMonth}" value="${valStr}" onfocus="handleInputFocus(this)" onblur="handleBankBalanceBlur(this)" onkeydown="handleInputKeyDown(this, event)">
            </td>
            <td style="text-align:right; font-family:monospace; font-weight:bold; color: ${realAvailable >= 0 ? 'var(--success)' : 'var(--danger)'}">
                ${formatEuro(realAvailable)}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// TABELA CONTAS A PAGAR
function renderExpensesTable(activeMonth) {
    const table = document.getElementById("expenses-table");
    if (!table) return;
    const thead = table.querySelector("thead");
    const tbody = table.querySelector("tbody");
    const tfoot = table.querySelector("tfoot");

    if (!activeMonth || activeMonth === "") {
        thead.innerHTML = "<tr><th>Serviços</th><th>Status</th><th>Valor</th></tr>";
        tbody.innerHTML = "<tr><td colspan='3' style='text-align:center; padding: 20px; color: #64748b;'>Nenhum mês selecionado.</td></tr>";
        tfoot.innerHTML = "";
        return;
    }

    thead.innerHTML = `<tr>
        <th>Serviços <button class="delete-row-btn" onclick="deleteMonth('${activeMonth}')" title="Eliminar este mês">🗑️</button></th>
        <th style="text-align:center;">Pago?</th>
        <th style="text-align:right;">Valor</th>
    </tr>`;

    if (appData.expenses.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px; color:#64748b;">Nenhum serviço cadastrado.</td></tr>`;
        tfoot.innerHTML = "";
        return;
    }

    tbody.innerHTML = "";
    appData.expenses.forEach(exp => {
        const tr = document.createElement("tr");
        if (!exp.paidStatuses) exp.paidStatuses = {};
        const isPaid = exp.paidStatuses[activeMonth] || false;

        let html = `<td><button class="delete-row-btn" onclick="deleteExpense(${exp.id})">❌</button> ${exp.name}<span class="meta-info">${exp.user} (${exp.type})</span></td>`;
        html += `<td style="text-align:center;"><input type="checkbox" style="width:18px; height:18px; cursor:pointer;" ${isPaid ? 'checked' : ''} onchange="toggleExpensePaid(${exp.id}, '${activeMonth}', this.checked)"></td>`;
        
        const val = exp.values[activeMonth] !== undefined ? exp.values[activeMonth].toFixed(2).replace('.', ',') : "0,00";
        html += `<td style="text-align:right;"><input type="text" class="currency-input" data-type="expense" data-id="${exp.id}" data-month="${activeMonth}" value="${val}" onfocus="handleInputFocus(this)" onblur="handleInputBlur(this)" onkeydown="handleInputKeyDown(this, event)"></td>`;
        
        tr.innerHTML = html;
        if(isPaid) tr.style.backgroundColor = "#f0fdf4"; 
        tbody.appendChild(tr);
    });

    let total = appData.expenses.reduce((acc, curr) => acc + (curr.values[activeMonth] || 0), 0);
    tfoot.innerHTML = `<tr>
        <td colspan="2">TOTAL A PAGAR</td>
        <td style="text-align:right; font-family:monospace; font-weight:bold;">${formatEuro(total)}</td>
    </tr>`;
}

// TABELA VALORES A RECEBER
function renderIncomesTable(activeMonth) {
    const table = document.getElementById("incomes-table");
    if (!table) return;
    const thead = table.querySelector("thead");
    const tbody = table.querySelector("tbody");
    const tfoot = table.querySelector("tfoot");

    if (!activeMonth || activeMonth === "") {
        thead.innerHTML = "<tr><th>Ganhos / Receitas</th><th>Valor</th></tr>";
        tbody.innerHTML = "<tr><td colspan='2' style='text-align:center; padding: 20px; color: #64748b;'>Nenhum mês selecionado.</td></tr>";
        tfoot.innerHTML = "";
        return;
    }

    thead.innerHTML = `<tr>
        <th>Ganhos / Receitas</th>
        <th style="text-align:right;">Valor</th>
    </tr>`;

    if (appData.incomes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="2" style="text-align:center; padding:20px; color:#64748b;">Nenhuma receita cadastrada.</td></tr>`;
        tfoot.innerHTML = "";
        return;
    }

    tbody.innerHTML = "";
    appData.incomes.forEach(inc => {
        const tr = document.createElement("tr");
        let html = `<td><button class="delete-row-btn" onclick="deleteIncome(${inc.id})">❌</button> ${inc.name}<span class="meta-info">${inc.user}</span></td>`;
        
        const val = inc.values[activeMonth] !== undefined ? inc.values[activeMonth].toFixed(2).replace('.', ',') : "0,00";
        html += `<td style="text-align:right;"><input type="text" class="currency-input" data-type="income" data-id="${inc.id}" data-month="${activeMonth}" value="${val}" onfocus="handleInputFocus(this)" onblur="handleInputBlur(this)" onkeydown="handleInputKeyDown(this, event)"></td>`;
        
        tr.innerHTML = html;
        tbody.appendChild(tr);
    });

    let total = appData.incomes.reduce((acc, curr) => acc + (curr.values[activeMonth] || 0), 0);
    tfoot.innerHTML = `<tr>
        <td>TOTAL A RECEBER</td>
        <td style="text-align:right; font-family:monospace; font-weight:bold;">${formatEuro(total)}</td>
    </tr>`;
}

// COMPONENTES INLINE E INTERAÇÕES
function saveNewExpenseInline() {
    const name = document.getElementById("exp-name").value.trim();
    const type = document.getElementById("exp-type").value;
    const user = document.getElementById("exp-user").value;
    if (!name || !user) return alert("Preencha os campos!");
    const newId = appData.expenses.length > 0 ? Math.max(...appData.expenses.map(e => e.id)) + 1 : 1;
    appData.expenses.push({ id: newId, name, type, user, values: {}, paidStatuses: {} });
    document.getElementById("exp-name").value = "";
    renderAll();
}

function deleteExpense(id) {
    if (confirm("Eliminar serviço?")) { appData.expenses = appData.expenses.filter(e => e.id !== id); renderAll(); }
}

function saveNewIncomeInline() {
    const name = document.getElementById("inc-name").value.trim();
    const user = document.getElementById("inc-user").value;
    if (!name || !user) return alert("Preencha os campos!");
    const newId = appData.incomes.length > 0 ? Math.max(...appData.incomes.map(i => i.id)) + 1 : 1;
    appData.incomes.push({ id: newId, name, user, values: {} });
    document.getElementById("inc-name").value = "";
    renderAll();
}

function deleteIncome(id) {
    if (confirm("Eliminar receita?")) { appData.incomes = appData.incomes.filter(i => i.id !== id); renderAll(); }
}

function handleInputFocus(input) { isFirstKey = true; setTimeout(() => input.select(), 50); }

function handleInputKeyDown(input, event) {
    if (["Backspace", "Delete", "Tab", "Enter", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        if (event.key === "Enter") input.blur(); return;
    }
    if (!/[0-9.,]/.test(event.key)) { event.preventDefault(); return; }
    if (isFirstKey) { input.value = ""; isFirstKey = false; }
}

function handleInputBlur(input) {
    let raw = input.value.trim().replace(/,/g, '.');
    let num = parseFloat(raw);
    if (isNaN(num) || num < 0) num = 0.00;
    const type = input.dataset.type;
    const id = parseInt(input.dataset.id);
    const m = input.dataset.month;

    if (type === "expense") {
        let item = appData.expenses.find(e => e.id === id);
        if (item) item.values[m] = num;
    } else {
        let item = appData.incomes.find(i => i.id === id);
        if (item) item.values[m] = num;
    }
    saveToStorage();
    updateDashboard();
}

function updateDashboard() {
    const select = document.getElementById("dashboard-month-select");
    const m = select ? select.value : appData.months[appData.months.length - 1];
    
    if (document.getElementById("expenses-table")) renderExpensesTable(m);
    if (document.getElementById("incomes-table")) renderIncomesTable(m);
    renderBankBalancesTable(m);

    if (!m || m === "") {
        if(document.getElementById("dash-total-income")) document.getElementById("dash-total-income").textContent = "€0,00";
        if(document.getElementById("dash-total-expense")) document.getElementById("dash-total-expense").textContent = "€0,00";
        if(document.getElementById("dash-balance-value")) document.getElementById("dash-balance-value").textContent = "€0,00";
        return;
    }

    let tInc = appData.incomes.reduce((acc, c) => acc + (c.values[m] || 0), 0);
    let tExp = appData.expenses.reduce((acc, c) => acc + (c.values[m] || 0), 0);
    let bal = tInc - tExp;

    if(document.getElementById("dash-total-income")) document.getElementById("dash-total-income").textContent = formatEuro(tInc);
    if(document.getElementById("dash-total-expense")) document.getElementById("dash-total-expense").textContent = formatEuro(tExp);
    if(document.getElementById("dash-balance-value")) document.getElementById("dash-balance-value").textContent = formatEuro(bal);
    
    const balanceBox = document.getElementById("dash-balance-box");
    if (balanceBox) {
        balanceBox.className = "compact-item total-balance-row " + (bal >= 0 ? "balance-positive" : "balance-negative");
    }

    const tableBreakdown = document.getElementById("breakdown-table");
    if (tableBreakdown) {
        const tbody = tableBreakdown.querySelector("tbody");
        tbody.innerHTML = "";
        if (appData.users.length === 0) {
            tbody.innerHTML = "<tr><td colspan='4' style='text-align:center;'>Nenhum responsável criado.</td></tr>"; return;
        }
        appData.users.forEach(u => {
            let pInc = appData.incomes.filter(i => i.user === u).reduce((acc, c) => acc + (c.values[m] || 0), 0);
            let pExp = appData.expenses.filter(e => e.user === u).reduce((acc, c) => acc + (c.values[m] || 0), 0);
            let pBal = pInc - pExp;
            tbody.innerHTML += `<tr>
                <td><strong>${u}</strong></td>
                <td style="color:var(--success); text-align:right; font-family:monospace;">${formatEuro(pInc)}</td>
                <td style="color:var(--danger); text-align:right; font-family:monospace;">${formatEuro(pExp)}</td>
                <td style="text-align:right; font-family:monospace; font-weight:bold; color:${pBal >= 0 ? 'var(--success)' : 'var(--danger)'}">${formatEuro(pBal)}</td>
            </tr>`;
        });
    }
}

// --- INTEGRAÇÃO COM GITHUB ---
function saveGitHubConfig() {
    localStorage.setItem("gh_user", document.getElementById("gh-user").value.trim());
    localStorage.setItem("gh_repo", document.getElementById("gh-repo").value.trim());
    localStorage.setItem("gh_token", document.getElementById("gh-token").value.trim());
    alert("Configurações salvas localmente!");
}

function getGitHubCredentials() {
    return { user: localStorage.getItem("gh_user"), repo: localStorage.getItem("gh_repo"), token: localStorage.getItem("gh_token"), file: "backup.txt" };
}

async function saveToGitHub() {
    const { user, repo, token, file } = getGitHubCredentials();
    if (!user || !repo || !token) return alert("Configura o acesso ao GitHub primeiro.");
    const url = `https://api.github.com/repos/${user}/${repo}/contents/${file}`;
    const dataStr = JSON.stringify(appData, null, 4);
    const contentBase64 = btoa(unescape(encodeURIComponent(dataStr)));
    try {
        let sha = "";
        const resGet = await fetch(url, { headers: { "Authorization": `token ${token}` } });
        if (resGet.ok) sha = (await resGet.json()).sha;
        const resPut = await fetch(url, {
            method: "PUT",
            headers: { "Authorization": `token ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Update via App", content: contentBase64, sha: sha || undefined })
        });
        if (resPut.ok) alert("Guardado no GitHub!");
        else alert("Erro ao salvar.");
    } catch (e) { alert("Erro de rede."); }
}

async function loadFromGitHub() {
    const { user, repo, token, file } = getGitHubCredentials();
    if (!user || !repo || !token) return alert("Configura o GitHub primeiro.");
    const url = `https://api.github.com/repos/${user}/${repo}/contents/${file}?timestamp=${new Date().getTime()}`;
    try {
        const response = await fetch(url, { headers: { "Authorization": `token ${token}` } });
        if (!response.ok) return alert("Erro ao carregar ficheiro.");
        const fileInfo = await response.json();
        const decodedText = decodeURIComponent(escape(atob(fileInfo.content)));
        appData = JSON.parse(decodedText);
        if(!appData.bankBalances) appData.bankBalances = {};
        renderAll();
        alert("Sincronizado!");
    } catch (e) { alert("Erro ao sincronizar."); }
}

function exportToTxt() {
    const dataStr = JSON.stringify(appData, null, 4);
    const blob = new Blob([dataStr], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `backup-financeiro.txt`;
    link.click();
}

function importFromTxt(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            appData = JSON.parse(e.target.result);
            if(!appData.bankBalances) appData.bankBalances = {};
            renderAll();
            alert("Dados importados!");
        } catch (error) { alert("Erro ao ler ficheiro."); }
    };
    reader.readAsText(file);
}