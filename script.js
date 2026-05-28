// =====================================
// CONTROLE FINANCEIRO - JS LIMPO
// =====================================

// =========================
// CONVERSÃO SEGURA
// =========================

function parseCurrency(value) {

  if (!value) return 0;

  value = value
    .toString()
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const number = parseFloat(value);

  return isNaN(number) ? 0 : number;
}

// =========================
// FORMATAÇÃO FINAL
// =========================

function formatCurrency(value) {

  return Number(value).toLocaleString("pt-PT", {
    style: "currency",
    currency: "EUR"
  });
}

// =========================
// NORMALIZA INPUT (SEM TRAVAR CURSOR)
// =========================

function setupMoneyInputs() {

  const inputs = document.querySelectorAll(".money-input, .income-input");

  inputs.forEach(input => {

    if (input.dataset.ready) return;
    input.dataset.ready = true;

    // -------------------------
    // FOCUS → remove formatação
    // -------------------------
    input.addEventListener("focus", () => {

      const value = parseCurrency(input.value);

      if (value > 0) {
        input.value = value.toString().replace(".", ",");
      } else {
        input.value = "";
      }

    });

    // -------------------------
    // INPUT → livre (SEM máscara)
    // -------------------------
    input.addEventListener("input", () => {

      updateTotals();
      saveData();

    });

    // -------------------------
    // BLUR → formata moeda
    // -------------------------
    input.addEventListener("blur", () => {

      const value = parseCurrency(input.value);

      if (value <= 0) {
        input.value = "";
      } else {
        input.value = formatCurrency(value);
      }

      updateTotals();
      saveData();

    });

    // -------------------------
    // ENTER → salva/fecha teclado
    // -------------------------
    input.addEventListener("keydown", (e) => {

      if (e.key === "Enter") {
        e.preventDefault();
        input.blur();
      }

    });

  });

}

// =========================
// REMOVER LINHA
// =========================

function removeRow(btn) {

  if (!confirm("Remover item?")) return;

  btn.closest("tr").remove();

  updateTotals();
  saveData();
}

// =========================
// ADICIONAR SERVICE
// =========================

function addService() {

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

  for (let i = 2; i < headers.length; i++) {
    html += `
      <td>
        <input type="text" class="money-input" inputmode="decimal" placeholder="0,00">
      </td>
    `;
  }

  row.innerHTML = html;
  tbody.appendChild(row);

  setupMoneyInputs();
}

// =========================
// ADICIONAR MÊS
// =========================

function addMonth() {

  const monthName = prompt("Digite o nome do mês:");
  if (!monthName) return;

  const th = document.createElement("th");
  th.innerText = monthName;

  document.getElementById("headerRow").appendChild(th);

  document.querySelectorAll("#servicesBody tr").forEach(row => {

    const td = document.createElement("td");

    td.innerHTML = `
      <input type="text" class="money-input" inputmode="decimal" placeholder="0,00">
    `;

    row.appendChild(td);

  });

  const totalTd = document.createElement("td");
  totalTd.classList.add("month-total");
  totalTd.innerText = "R$ 0,00";

  document.getElementById("totalRow").appendChild(totalTd);

  setupMoneyInputs();
  saveData();
}

// =========================
// ADICIONAR RECEITA
// =========================

function addIncome() {

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
      <input type="text" class="income-input" inputmode="decimal" placeholder="0,00">
    </td>
  `;

  tbody.appendChild(row);

  setupMoneyInputs();
}

// =========================
// INICIALIZAÇÃO
// =========================

document.addEventListener("DOMContentLoaded", () => {

  setupMoneyInputs();

  updateTotals();

});