// Recuperar meses guardados ou iniciar com o padrão
let meses = JSON.parse(localStorage.getItem('financas_meses')) || ["06/2026"];

// Função para recalcular tudo e guardar os dados atuais
function calcularTudo() {
    let totalGeralDespesas = 0;
    let totalGeralReceitas = 0;
    let dividaPorRetentor = {};

    const linhasDespesas = document.querySelectorAll("#bodyDespesas .linha-dados");
    const tfootDespesas = document.getElementById("totalDespesasRow");
    
    for(let i = 2; i < tfootDespesas.cells.length - 1; i++) {
        tfootDespesas.cells[i].innerText = "0";
    }

    linhasDespesas.forEach(linha => {
        const retentor = linha.querySelector(".select-retentor").value;
        const inputsValores = linha.querySelectorAll(".valor-celula");
        
        inputsValores.forEach((input, index) => {
            const valor = parseFloat(input.value) || 0;
            totalGeralDespesas += valor;

            let celulaTotal = tfootDespesas.cells[2 + index];
            if (celulaTotal) {
                celulaTotal.innerText = (parseFloat(celulaTotal.innerText) + valor).toFixed(2);
            }

            if (!dividaPorRetentor[retentor]) dividaPorRetentor[retentor] = 0;
            dividaPorRetentor[retentor] += valor;
        });
    });

    const linhasReceitas = document.querySelectorAll("#bodyReceitas .linha-dados");
    const tfootReceitas = document.getElementById("totalReceitasRow");

    for(let i = 2; i < tfootReceitas.cells.length - 1; i++) {
        tfootReceitas.cells[i].innerText = "0";
    }

    linhasReceitas.forEach(linha => {
        const inputsValores = linha.querySelectorAll(".valor-celula");
        inputsValores.forEach((input, index) => {
            const valor = parseFloat(input.value) || 0;
            totalGeralReceitas += valor;

            let celulaTotal = tfootReceitas.cells[2 + index];
            if (celulaTotal) {
                celulaTotal.innerText = (parseFloat(celulaTotal.innerText) + valor).toFixed(2);
            }
        });
    });

    document.getElementById("resumoReceber").innerText = totalGeralReceitas.toFixed(2);
    document.getElementById("resumoPagar").innerText = totalGeralDespesas.toFixed(2);
    
    const saldoRow = totalGeralReceitas - totalGeralDespesas;
    const resumoSaldo = document.getElementById("resumoSaldo");
    resumoSaldo.innerText = saldoRow.toFixed(2);
    resumoSaldo.className = saldoRow >= 0 ? "text-success" : "text-danger";

    const containerRetentores = document.getElementById("resumoRetentores");
    containerRetentores.innerHTML = "";
    
    for (let retentor in dividaPorRetentor) {
        if(retentor !== "Próprio" && dividaPorRetentor[retentor] > 0) { 
            containerRetentores.innerHTML += `<p><strong>${retentor}:</strong> ${dividaPorRetentor[retentor].toFixed(2)} €</p>`;
        }
    }

    // SALVAR NO SITEMA: Guarda o estado atual no armazenamento local
    salvarEstadoNoDispositivo();
}

// Guarda a estrutura e valores em texto na memória do aparelho
function salvarEstadoNoDispositivo() {
    localStorage.setItem('financas_meses', JSON.stringify(meses));
    
    let dadosDespesas = [];
    document.querySelectorAll("#bodyDespesas .linha-dados").forEach(linha => {
        let valores = Array.from(linha.querySelectorAll(".valor-celula")).map(inp => inp.value);
        dadosDespesas.push({
            nome: linha.querySelector("input[type='text']").value,
            retentor: linha.querySelector(".select-retentor").value,
            valores: valores
        });
    });
    localStorage.setItem('financas_despesas', JSON.stringify(dadosDespesas));

    let dadosReceitas = [];
    document.querySelectorAll("#bodyReceitas .linha-dados").forEach(linha => {
        let valores = Array.from(linha.querySelectorAll(".valor-celula")).map(inp => inp.value);
        dadosReceitas.push({
            nome: linha.querySelector("input[type='text']").value,
            retentor: linha.querySelector(".select-retentor").value,
            valores: valores
        });
    });
    localStorage.setItem('financas_receitas', JSON.stringify(dadosReceitas));
}

// Carrega os dados guardados assim que o aplicativo abre
function carregarEstadoDoDispositivo() {
    // 1. Reconstruir os headers dos meses salvos
    const headerDespesas = document.getElementById("headerDespesas");
    const headerReceitas = document.getElementById("headerReceitas");
    const tfootDespRow = document.getElementById("totalDespesasRow");
    const tfootRecRow = document.getElementById("totalReceitasRow");

    // Limpar meses padrão do HTML para não duplicar
    while(headerDespesas.cells.length > 3) { headerDespesas.cells[2].remove(); }
    while(headerReceitas.cells.length > 3) { headerReceitas.cells[2].remove(); }
    while(tfootDespRow.cells.length > 3) { tfootDespRow.cells[2].remove(); }
    while(tfootRecRow.cells.length > 3) { tfootRecRow.cells[2].remove(); }

    meses.forEach((mes, idx) => {
        if(idx > 0) { // O primeiro mês já existe estruturalmente no HTML básico
            let thDesp = document.createElement("th"); thDesp.innerText = mes;
            headerDespesas.insertBefore(thDesp, headerDespesas.cells[headerDespesas.cells.length - 1]);

            let thRec = document.createElement("th"); thRec.innerText = mes;
            headerReceitas.insertBefore(thRec, headerReceitas.cells[headerReceitas.cells.length - 1]);

            let tdTotalDesp = document.createElement("td"); tdTotalDesp.innerText = "0";
            tfootDespRow.insertBefore(tdTotalDesp, tfootDespRow.cells[tfootDespRow.cells.length - 1]);

            let tdTotalRec = document.createElement("td"); tdTotalRec.innerText = "0";
            tfootRecRow.insertBefore(tdTotalRec, tfootRecRow.cells[tfootRecRow.cells.length - 1]);
        } else {
            headerDespesas.cells[2].innerText = mes;
            headerReceitas.cells[2].innerText = mes;
        }
    });

    // 2. Reconstruir linhas de Despesas
    let salvasDespesas = JSON.parse(localStorage.getItem('financas_despesas'));
    if(salvasDespesas) {
        document.getElementById("bodyDespesas").innerHTML = "";
        salvasDespesas.forEach(item => reconstruirLinha("bodyDespesas", item));
    }

    // 3. Reconstruir linhas de Receitas
    let salvasReceitas = JSON.parse(localStorage.getItem('financas_receitas'));
    if(salvasReceitas) {
        document.getElementById("bodyReceitas").innerHTML = "";
        salvasReceitas.forEach(item => reconstruirLinha("bodyReceitas", item));
    }

    calcularTudo();
}

function reconstruirLinha(idTabela, item) {
    let tr = document.createElement("tr");
    tr.className = "linha-dados";

    let tdNome = `<td><input type="text" value="${item.nome}" oninput="calcularTudo()"></td>`;
    let tdRetentor = `
        <td>
            <select class="select-retentor" onchange="calcularTudo()">
                <option value="João" ${item.retentor === 'João' ? 'selected' : ''}>João</option>
                <option value="Maria" ${item.retentor === 'Maria' ? 'selected' : ''}>Maria</option>
                <option value="Empresa" ${item.retentor === 'Empresa' ? 'selected' : ''}>Empresa</option>
                <option value="Próprio" ${item.retentor === 'Próprio' ? 'selected' : ''}>Próprio</option>
            </select>
        </td>`;
    
    let tdsValores = "";
    meses.forEach((_, idx) => {
        let val = item.valores[idx] !== undefined ? item.valores[idx] : 0;
        tdsValores += `<td><input type="number" class="valor-celula" value="${val}" oninput="calcularTudo()"></td>`;
    });

    let tdAcao = `<td><button class="btn-danger" onclick="eliminarLinha(this)">❌</button></td>`;

    tr.innerHTML = tdNome + tdRetentor + tdsValores + tdAcao;
    document.getElementById(idTabela).appendChild(tr);
}

function adicionarMes() {
    let ultimoMes = meses[meses.length - 1];
    let [mes, ano] = ultimoMes.split("/").map(Number);
    mes++;
    if (mes > 12) { mes = 1; ano++; }
    let novoMesStr = (mes < 10 ? "0" + mes : mes) + "/" + ano;
    meses.push(novoMesStr);

    const headerDespesas = document.getElementById("headerDespesas");
    let thDesp = document.createElement("th"); thDesp.innerText = novoMesStr;
    headerDespesas.insertBefore(thDesp, headerDespesas.cells[headerDespesas.cells.length - 1]);

    const headerReceitas = document.getElementById("headerReceitas");
    let thRec = document.createElement("th"); thRec.innerText = novoMesStr;
    headerReceitas.insertBefore(thRec, headerReceitas.cells[headerReceitas.cells.length - 1]);

    document.querySelectorAll("#bodyDespesas .linha-dados").forEach(linha => {
        let td = document.createElement("td");
        td.innerHTML = `<input type="number" class="valor-celula" value="0" oninput="calcularTudo()">`;
        linha.insertBefore(td, BackendObterBotaoAcao(linha));
    });

    document.querySelectorAll("#bodyReceitas .linha-dados").forEach(linha => {
        let td = document.createElement("td");
        td.innerHTML = `<input type="number" class="valor-celula" value="0" oninput="calcularTudo()">`;
        linha.insertBefore(td, BackendObterBotaoAcao(linha));
    });

    const tfootDespRow = document.getElementById("totalDespesasRow");
    let tdTotalDesp = document.createElement("td"); tdTotalDesp.innerText = "0";
    tfootDespRow.insertBefore(tdTotalDesp, tfootDespRow.cells[tfootDespRow.cells.length - 1]);

    const tfootRecRow = document.getElementById("totalReceitasRow");
    let tdTotalRec = document.createElement("td"); tdTotalRec.innerText = "0";
    tfootRecRow.insertBefore(tdTotalRec, tfootRecRow.cells[tfootRecRow.cells.length - 1]);

    calcularTudo();
}

function BackendObterBotaoAcao(linha) {
    return linha.cells[linha.cells.length - 1];
}

function criarEstruturaLinha(tipoTabela, nomePadrao) {
    let tr = document.createElement("tr");
    tr.className = "linha-dados";

    let tdNome = `<td><input type="text" value="${nomePadrao}" oninput="calcularTudo()"></td>`;
    let tdRetentor = `
        <td>
            <select class="select-retentor" onchange="calcularTudo()">
                <option value="João">João</option>
                <option value="Maria">Maria</option>
                <option value="Empresa">Empresa</option>
                <option value="Próprio">Próprio</option>
            </select>
        </td>`;
    
    let tdsValores = "";
    meses.forEach(() => {
        tdsValores += `<td><input type="number" class="valor-celula" value="0" oninput="calcularTudo()"></td>`;
    });

    let tdAcao = `<td><button class="btn-danger" onclick="eliminarLinha(this)">❌</button></td>`;

    tr.innerHTML = tdNome + tdRetentor + tdsValores + tdAcao;
    document.getElementById(tipoTabela).appendChild(tr);
    calcularTudo();
}

function adicionarServico() { criarEstruturaLinha("bodyDespesas", "Novo Serviço"); }
function adicionarReceita() { criarEstruturaLinha("bodyReceitas", "Nova Receita"); }

function eliminarLinha(botao) {
    if(confirm("Tem a certeza que deseja eliminar esta linha?")) {
        botao.closest("tr").remove();
        calcularTudo();
    }
}

// Inicialização correta carregando os dados locais
window.onload = carregarEstadoDoDispositivo;