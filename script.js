// =====================================
// FORMATAR / PARSE MOEDA
// =====================================

function formatCurrency(value){
  return value.toLocaleString("pt-PT", {
    style: "currency",
    currency: "EUR"
  });
}

function parseCurrency(value){

  if(!value) return 0;

  value = value
    .replace("€", "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();

  return Number(value) || 0;
}

// =====================================
// MÁSCARA MONETÁRIA ESTÁVEL
// =====================================

function maskCurrency(input){

  let value = input.value.replace(/\D/g, "");

  if(value === ""){
    input.value = "";
    return;
  }

  value = Number(value) / 100;

  input.value = value.toLocaleString("pt-PT", {
    style: "currency",
    currency: "EUR"
  });
}

// =====================================
// INPUT EVENTO
// =====================================

document.addEventListener("input", function(e){

  if(
    e.target.classList.contains("money-input") ||
    e.target.classList.contains("income-input")
  ){

    maskCurrency(e.target);

    updateTotals();
    saveData();

  }

});

// =====================================
// FOCO (LIMPA SÓ ZERO)
// =====================================

document.addEventListener("focusin", function(e){

  if(
    e.target.classList.contains("money-input") ||
    e.target.classList.contains("income-input")
  ){

    if(e.target.value === "€ 0,00"){
      e.target.value = "";
    }

  }

});

// =====================================
// BLUR (GARANTE FORMATO)
// =====================================

document.addEventListener("focusout", function(e){

  if(
    e.target.classList.contains("money-input") ||
    e.target.classList.contains("income-input")
  ){

    let value = parseCurrency(e.target.value);

    e.target.value = formatCurrency(value);

    updateTotals();
    saveData();

  }

});

// =====================================
// ADICIONAR SERVIÇO
// =====================================

function addService(){

  const tbody = document.getElementById("servicesBody");
  const headers = document.querySelectorAll("#headerRow th");

  const row = document.createElement("tr");

  let html = `
    <td>
      <div class="cell-flex">
        <input type="text" placeholder="Novo serviço">
        <button class="delete-btn" onclick="removeRow(this)">X</button>
      </div>
    </td>

    <td>
      <select onchange="updateTotals();saveData()">
        <option>Willian</option>
        <option>Duda</option>
        <option>Ambos</option>
      </select>
    </td>
  `;

  for(let i = 2; i < headers.length; i++){

    html += `
      <td>
        <input type="text" inputmode="numeric"
          class="money-input"
          value="R$ 0,00">
      </td>
    `;
  }

  row.innerHTML = html;
  tbody.appendChild(row);

}

// =====================================
// ADICIONAR MÊS
// =====================================

function addMonth(){

  const monthName = prompt("Digite o nome do mês:");
  if(!monthName) return;

  const th = document.createElement("th");
  th.innerText = monthName;

  document.getElementById("headerRow").appendChild(th);

  const rows = document.querySelectorAll("#servicesBody tr");

  rows.forEach(row => {

    const td = document.createElement("td");

    td.innerHTML = `
      <input type="text"
        inputmode="numeric"
        class="money-input"
        value="R$ 0,00">
    `;

    row.appendChild(td);

  });

  const totalTd = document.createElement("td");
  totalTd.classList.add("month-total");
  totalTd.innerText = "R$ 0,00";

  document.getElementById("totalRow").appendChild(totalTd);

  saveData();

}

// =====================================
// ADICIONAR RECEITA
// =====================================

function addIncome(){

  const tbody = document.getElementById("incomeBody");

  const row = document.createElement("tr");

  row.innerHTML = `
    <td>
      <div class="cell-flex">
        <input type="text" placeholder="Nova receita">
        <button class="delete-btn" onclick="removeRow(this)">X</button>
      </div>
    </td>

    <td>
      <select onchange="updateTotals();saveData()">
        <option>Willian</option>
        <option>Duda</option>
      </select>
    </td>

    <td>
      <input type="text"
        inputmode="numeric"
        class="income-input"
        value="R$ 0,00">
    </td>
  `;

  tbody.appendChild(row);

}

// =====================================
// REMOVER
// =====================================

function removeRow(btn){

  if(confirm("Remover item?")){

    btn.closest("tr").remove();

    updateTotals();
    saveData();

  }

}

// =====================================
// TOTAIS
// =====================================

function updateTotals(){

  let totalPay = 0;
  let willian = 0;
  let duda = 0;
  let ambos = 0;

  let totalReceive = 0;
  let willianIncome = 0;
  let dudaIncome = 0;

  const monthTotals = [];

  // DESPESAS
  document.querySelectorAll("#servicesBody tr").forEach(row => {

    const responsible = row.querySelector("select").value;

    const inputs = row.querySelectorAll(".money-input");

    inputs.forEach((input, i) => {

      const value = parseCurrency(input.value);

      totalPay += value;

      if(!monthTotals[i]) monthTotals[i] = 0;
      monthTotals[i] += value;

      if(responsible === "Willian") willian += value;
      else if(responsible === "Duda") duda += value;
      else ambos += value;

    });

  });

  // MESES
  document.querySelectorAll(".month-total").forEach((cell, i) => {
    cell.innerText = formatCurrency(monthTotals[i] || 0);
  });

  // RECEITAS
  document.querySelectorAll("#incomeBody tr").forEach(row => {

    const responsible = row.querySelector("select").value;

    const value = parseCurrency(
      row.querySelector(".income-input").value
    );

    totalReceive += value;

    if(responsible === "Willian") willianIncome += value;
    else dudaIncome += value;

  });

  // UI
  document.getElementById("totalToPay").innerText =
    formatCurrency(totalPay);

  document.getElementById("totalToReceive").innerText =
    formatCurrency(totalReceive);

  document.getElementById("willianTotal").innerText =
    formatCurrency(willian);

  document.getElementById("dudaTotal").innerText =
    formatCurrency(duda);

  document.getElementById("ambosTotal").innerText =
    formatCurrency(ambos);

  document.getElementById("willianIncome").innerText =
    formatCurrency(willianIncome);

  document.getElementById("dudaIncome").innerText =
    formatCurrency(dudaIncome);

}

// =====================================
// LOCALSTORAGE SAVE
// =====================================

function saveData(){

  const data = {
    services: [],
    incomes: [],
    months: []
  };

  document.querySelectorAll("#servicesBody tr").forEach(row => {

    data.services.push({
      name: row.querySelector("input").value,
      responsible: row.querySelector("select").value,
      values: [...row.querySelectorAll(".money-input")]
        .map(i => i.value)
    });

  });

  document.querySelectorAll("#incomeBody tr").forEach(row => {

    data.incomes.push({
      name: row.querySelector("input").value,
      responsible: row.querySelector("select").value,
      value: row.querySelector(".income-input").value
    });

  });

  document.querySelectorAll("#headerRow th").forEach((th, i) => {
    if(i >= 2) data.months.push(th.innerText);
  });

  localStorage.setItem("finance_data", JSON.stringify(data));

}

// =====================================
// LOAD DATA
// =====================================

function loadData(){

  const saved = localStorage.getItem("finance_data");
  if(!saved) return;

  const data = JSON.parse(saved);

  document.getElementById("servicesBody").innerHTML = "";
  document.getElementById("incomeBody").innerHTML = "";

  const header = document.getElementById("headerRow");

  while(header.children.length > 2){
    header.removeChild(header.lastChild);
  }

  data.months.forEach(m => {
    const th = document.createElement("th");
    th.innerText = m;
    header.appendChild(th);
  });

  data.services.forEach(s => {

    const row = document.createElement("tr");

    let html = `
      <td>
        <div class="cell-flex">
          <input type="text" value="${s.name}">
          <button class="delete-btn" onclick="removeRow(this)">X</button>
        </div>
      </td>

      <td>
        <select onchange="updateTotals();saveData()">
          <option ${s.responsible==="Willian"?"selected":""}>Willian</option>
          <option ${s.responsible==="Duda"?"selected":""}>Duda</option>
          <option ${s.responsible==="Ambos"?"selected":""}>Ambos</option>
        </select>
      </td>
    `;

    s.values.forEach(v => {
      html += `
        <td>
          <input type="text"
            class="money-input"
            value="${v}">
        </td>
      `;
    });

    row.innerHTML = html;
    document.getElementById("servicesBody").appendChild(row);

  });

  data.incomes.forEach(i => {

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>
        <div class="cell-flex">
          <input type="text" value="${i.name}">
          <button class="delete-btn" onclick="removeRow(this)">X</button>
        </div>
      </td>

      <td>
        <select onchange="updateTotals();saveData()">
          <option ${i.responsible==="Willian"?"selected":""}>Willian</option>
          <option ${i.responsible==="Duda"?"selected":""}>Duda</option>
        </select>
      </td>

      <td>
        <input type="text"
          class="income-input"
          value="${i.value}">
      </td>
    `;

    document.getElementById("incomeBody").appendChild(row);

  });

  updateTotals();

}

// =====================================
// INIT
// =====================================

loadData();