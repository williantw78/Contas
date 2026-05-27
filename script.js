// =========================
// ADICIONAR SERVIÇO
// =========================

function addService(){

  const tbody =
    document.getElementById("servicesBody");

  const headers =
    document.querySelectorAll("#headerRow th");

  const row = document.createElement("tr");

  let html = `

    <td>
      <div class="cell-flex">

        <input
          type="text"
          placeholder="Novo serviço"
        >

        <button
          class="delete-btn"
          onclick="removeRow(this)"
        >
          X
        </button>

      </div>
    </td>

    <td>
      <select onchange="updateTotals()">
        <option>Willian</option>
        <option>Duda</option>
        <option>Ambos</option>
      </select>
    </td>

  `;

  for(let i = 2; i < headers.length; i++){

    html += `

      <td>
        <input
          type="text"
          inputmode="numeric"
          class="money-input"
          value="R$ 0,00"
        >
      </td>

    `;

  }

  row.innerHTML = html;

  tbody.appendChild(row);

}

// =========================
// ADICIONAR MÊS
// =========================

function addMonth(){

  const monthName =
    prompt("Nome do mês:");

  if(!monthName) return;

  // HEADER

  const th = document.createElement("th");

  th.innerText = monthName;

  document
    .getElementById("headerRow")
    .appendChild(th);

  // LINHAS

  const rows =
    document.querySelectorAll("#servicesBody tr");

  rows.forEach(row => {

    const td = document.createElement("td");

    td.innerHTML = `

      <input
        type="text"
        inputmode="numeric"
        class="money-input"
        value="R$ 0,00"
      >

    `;

    row.appendChild(td);

  });

  // TOTAL

  const totalTd = document.createElement("td");

  totalTd.classList.add("month-total");

  totalTd.innerText = "R$ 0,00";

  document
    .getElementById("totalRow")
    .appendChild(totalTd);

}

// =========================
// ADICIONAR RECEITA
// =========================

function addIncome(){

  const tbody =
    document.getElementById("incomeBody");

  const row = document.createElement("tr");

  row.innerHTML = `

    <td>
      <div class="cell-flex">

        <input
          type="text"
          placeholder="Nova receita"
        >

        <button
          class="delete-btn"
          onclick="removeRow(this)"
        >
          X
        </button>

      </div>
    </td>

    <td>
      <select onchange="updateTotals()">
        <option>Willian</option>
        <option>Duda</option>
      </select>
    </td>

    <td>

      <input
        type="text"
        inputmode="numeric"
        class="income-input"
        value="R$ 0,00"
      >

    </td>

  `;

  tbody.appendChild(row);

}

// =========================
// REMOVER
// =========================

function removeRow(button){

  if(confirm("Remover item?")){

    button.closest("tr").remove();

    updateTotals();

  }

}

// =========================
// FORMATAR MOEDA
// =========================

function formatCurrency(value){

  return value.toLocaleString("pt-BR", {
    style:"currency",
    currency:"BRL"
  });

}

/*function parseCurrency(value){

  value = value
    .replace(/\s/g, "")
    .replace("R$", "")
    .replace(/\./g, "")
    .replace(",", ".");

  return Number(value) || 0;

}*/
function parseCurrency(value){

  if(!value) return 0;

  value = value
    .replace("R$", "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();

  return Number(value) || 0;

}
//
// BALACOBACO
//


// =========================
// FORMATA INPUT
// =========================

/*function maskCurrency(input){

  let value =
    input.value.replace(/\D/g, "");

  if(value === ""){

    input.value = "";

    return;

  }

  value = Number(value);

  input.value = formatCurrency(value);

} */
function maskCurrency(input){

  let value = input.value.replace(/\D/g, "");

  // EVITA VAZIO
  if(value.length === 0){
    input.value = "";
    return;
  }

  // CONVERTE PARA CENTAVOS
  value = (parseInt(value) / 100).toFixed(2);

  // FORMATA BR
  value = value
    .replace(".", ",")
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  input.value = `R$ ${value}`;

}//
// BALACOBACO
//

// =========================
// EVENTOS
// =========================

/*document.addEventListener("input", function(e){

  if(
    e.target.classList.contains("money-input") ||
    e.target.classList.contains("income-input")
  ){

    maskCurrency(e.target);

    updateTotals();

  }

});*/
document.addEventListener("input", function(e){

  if(
    e.target.classList.contains("money-input") ||
    e.target.classList.contains("income-input")
  ){

    // GUARDA POSIÇÃO
    const cursorPosition = e.target.selectionStart;

    maskCurrency(e.target);

    // MOVE CURSOR PARA O FINAL
    setTimeout(() => {

      e.target.setSelectionRange(
        e.target.value.length,
        e.target.value.length
      );

    }, 0);

    updateTotals();

  }

});
//
// BALACOBACO//

document.addEventListener("focusin", function(e){

  if(
    e.target.classList.contains("money-input") ||
    e.target.classList.contains("income-input")
  ){

    if(
      e.target.value === "R$ 0,00"
    ){
      e.target.value = "";
    }

  }

});

document.addEventListener("focusout", function(e){

  if(
    e.target.classList.contains("money-input") ||
    e.target.classList.contains("income-input")
  ){

    if(
      e.target.value.trim() === ""
    ){

      e.target.value = "R$ 0,00";

    }

    updateTotals();

  }

});

// =========================
// ATUALIZAR TOTAIS
// =========================

function updateTotals(){

  let totalPay = 0;

  let willian = 0;
  let duda = 0;
  let ambos = 0;

  const monthTotals = [];

  // DESPESAS

  const serviceRows =
    document.querySelectorAll("#servicesBody tr");

  serviceRows.forEach(row => {

    const responsible =
      row.querySelector("select").value;

    const inputs =
      row.querySelectorAll(".money-input");

    inputs.forEach((input, index) => {

      const value =
        parseCurrency(input.value);

      totalPay += value;

      if(!monthTotals[index]){
        monthTotals[index] = 0;
      }

      monthTotals[index] += value;

      if(responsible === "Willian"){
        willian += value;
      }
      else if(responsible === "Duda"){
        duda += value;
      }
      else{
        ambos += value;
      }

    });

  });

  // TOTAIS MENSAIS

  const totalCells =
    document.querySelectorAll(".month-total");

  totalCells.forEach((cell, index) => {

    cell.innerText =
      formatCurrency(monthTotals[index] || 0);

  });

  // RECEITAS

  let totalReceive = 0;

  let willianIncome = 0;
  let dudaIncome = 0;

  const incomeRows =
    document.querySelectorAll("#incomeBody tr");

  incomeRows.forEach(row => {

    const responsible =
      row.querySelector("select").value;

    const value =
      parseCurrency(
        row.querySelector(".income-input").value
      );

    totalReceive += value;

    if(responsible === "Willian"){
      willianIncome += value;
    }
    else{
      dudaIncome += value;
    }

  });

  // TELA

  document.getElementById("totalToPay")
    .innerText = formatCurrency(totalPay);

  document.getElementById("totalToReceive")
    .innerText = formatCurrency(totalReceive);

  document.getElementById("willianTotal")
    .innerText = formatCurrency(willian);

  document.getElementById("dudaTotal")
    .innerText = formatCurrency(duda);

  document.getElementById("ambosTotal")
    .innerText = formatCurrency(ambos);

  document.getElementById("willianIncome")
    .innerText = formatCurrency(willianIncome);

  document.getElementById("dudaIncome")
    .innerText = formatCurrency(dudaIncome);

}

updateTotals();