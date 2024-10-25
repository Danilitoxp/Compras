let fornecedores = [];
let compras = [];

// Função para carregar fornecedores e compras do localStorage ao iniciar
window.onload = () => {
  carregarDadosDoLocalStorage();
  loadContent("fornecedores"); // Carrega a página de fornecedores na inicialização
};

// Função para carregar dados do localStorage
function carregarDadosDoLocalStorage() {
  const fornecedoresSalvos = localStorage.getItem("fornecedores");
  if (fornecedoresSalvos) {
    fornecedores = JSON.parse(fornecedoresSalvos);
  }

  const comprasSalvas = localStorage.getItem("compras");
  if (comprasSalvas) {
    compras = JSON.parse(comprasSalvas);
  }
}

function loadContent(page) {
  const content = document.getElementById("content");

  if (page === "fornecedores") {
    content.innerHTML = `
            <h1>Fornecedores</h1>
            <button id='adicionarFornecedor' onclick="openModal()">Adicionar Fornecedor</button>
            <button class="frequencia-button" onclick="filtrarFornecedoresPorFrequencia('semanal')">Semanal</button>
<button class="frequencia-button" onclick="filtrarFornecedoresPorFrequencia('quinzenal')">Quinzenal</button>
<button class="frequencia-button" onclick="filtrarFornecedoresPorFrequencia('mensal')">Mensal</button>
<button class="frequencia-button" onclick="filtrarFornecedoresPorFrequencia('todos')">Todos</button>

            <div id="fornecedoresList"></div>
        `;
    filtrarFornecedoresPorFrequencia("semanal"); // Carrega fornecedores semanais ao abrir a página
  } else if (page === "compras") {
    content.innerHTML = `
            <h1>Historico de Compras</h1>
            <button onclick="openModalCompra()">Cadastrar Compra</button>
            <div id="comprasList"></div>
        `;
    mostrarCompras(); // Não precisa de setTimeout aqui se não houver dependência
  }
}

function filtrarFornecedoresPorFrequencia(frequencia) {
  const fornecedoresList = document.getElementById("fornecedoresList");
  fornecedoresList.innerHTML = ""; // Limpa a lista de fornecedores

  // Filtra fornecedores de acordo com a frequência selecionada ou exibe todos
  const fornecedoresFiltrados =
    frequencia === "todos"
      ? fornecedores
      : fornecedores.filter(
          (fornecedor) => fornecedor.frequencia === frequencia
        );

  // Remove a classe active de todos os botões
  const buttons = document.querySelectorAll("button.frequencia-button");
  buttons.forEach((button) => {
    button.classList.remove("active"); // Remove a classe active de todos os botões
  });

  // Adiciona a classe active ao botão clicado
  const activeButton = document.querySelector(
    `button[onclick*="${frequencia}"]`
  );
  if (activeButton) {
    activeButton.classList.add("active"); // Adiciona a classe active ao botão clicado
  }

  // Mostra apenas os fornecedores filtrados
  fornecedoresFiltrados.forEach((fornecedor, index) => {
    const { diasSemCompra, mediaCompras } =
      calcularInformacoesFornecedor(fornecedor);

    fornecedoresList.innerHTML += `
            <div class="fornecedor-card">
                <img src="${fornecedor.foto}" alt="${fornecedor.nome}">
                <div>
                    <strong>${fornecedor.nome}</strong>
                    <p>Pedido Mínimo: ${fornecedor.pedidoMinimo}</p>
                    <p>Frequência: ${fornecedor.frequencia}</p>
                    <p>Dias sem comprar: ${diasSemCompra} Dias</p>
                    <p>Média de compra: R$${mediaCompras.toFixed(2)}</p>
                    <button onclick="excluirFornecedor(${index})">Excluir</button>
                </div>
            </div>
        `;
  });
}

function adicionarFornecedor() {
  const nome = document.getElementById("nome").value;
  const pedidoMinimo = document.getElementById("pedidoMinimo").value;
  const frequencia = document.getElementById("frequencia").value;
  const categoria = document.getElementById("categoria").value;
  const foto = document.getElementById("foto").files[0]; // Obtendo a imagem

  if (nome && pedidoMinimo && frequencia && categoria && foto) {
    const leitor = new FileReader();
    leitor.onload = function (e) {
      const fornecedor = {
        nome: nome,
        pedidoMinimo: pedidoMinimo,
        frequencia: frequencia,
        categoria: categoria,
        foto: e.target.result, // Armazena a imagem em base64
        compras: [], // Inicializa um array para armazenar as compras
      };

      fornecedores.push(fornecedor);
      localStorage.setItem("fornecedores", JSON.stringify(fornecedores));
      fecharModal();
      mostrarFornecedores();
      limparFormulario();
    };
    leitor.readAsDataURL(foto); // Lê a imagem como URL
  } else {
    alert("Preencha todos os campos e selecione uma foto!");
  }
}

function mostrarFornecedores() {
  const fornecedoresList = document.getElementById("fornecedoresList");

  // Verifica se o elemento fornecedoresList existe
  if (!fornecedoresList) {
    return; // Sai da função se o elemento não for encontrado
  }

  fornecedoresList.innerHTML = ""; // Limpa a lista

  // Calcula os dias sem compra e adiciona à lista de fornecedores
  const fornecedoresComDiasSemCompra = fornecedores.map((fornecedor, index) => {
    const { diasSemCompra, mediaCompras } =
      calcularInformacoesFornecedor(fornecedor);
    return { ...fornecedor, diasSemCompra, index }; // Adiciona diasSemCompra e index
  });

  // Ordena os fornecedores pela quantidade de dias sem compra, em ordem decrescente
  fornecedoresComDiasSemCompra.sort(
    (a, b) => b.diasSemCompra - a.diasSemCompra
  );

  // Exibe os fornecedores ordenados
  fornecedoresComDiasSemCompra.forEach(
    ({ diasSemCompra, mediaCompras, index, ...fornecedor }) => {
      fornecedoresList.innerHTML += `
            <div class="fornecedor-card">
                <img src="${fornecedor.foto}" alt="${fornecedor.nome}">
                <div>
                    <strong>${fornecedor.nome}</strong>
                    <p>Pedido Mínimo: ${fornecedor.pedidoMinimo}</p>
                    <p>Frequência: ${fornecedor.frequencia}</p>
                    <p>Dias sem comprar: ${diasSemCompra} Dias</p>
                    <p>Média de compra: R$${mediaCompras.toFixed(2)}</p>
                    <button onclick="excluirFornecedor(${index})">Excluir</button>
                </div>
            </div>
        `;
    }
  );
}

function excluirCompra(fornecedorIndex, compraIndex) {
  if (confirm("Tem certeza que deseja excluir esta compra?")) {
    const fornecedor = fornecedores[fornecedorIndex];

    // Remove a compra do fornecedor
    fornecedor.compras.splice(compraIndex, 1);

    // Atualiza o localStorage com as mudanças
    localStorage.setItem("fornecedores", JSON.stringify(fornecedores));

    // Atualiza as listas após a exclusão
    mostrarCompras();
    mostrarFornecedores(); // Se você quiser atualizar a lista de fornecedores também
  }
}

function calcularInformacoesFornecedor(fornecedor) {
  const comprasFornecedor = fornecedor.compras || [];
  let diasSemCompra = 0;
  let mediaCompras = 0;
  let ultimaCompraData = null;

  if (comprasFornecedor.length > 0) {
    // Encontra a última compra baseada na data mais recente
    const ultimaCompra = comprasFornecedor.reduce(
      (maisRecente, compraAtual) => {
        return new Date(compraAtual.data) > new Date(maisRecente.data)
          ? compraAtual
          : maisRecente;
      }
    );

    // Calcula os dias desde a última compra
    const dataAtual = new Date();
    const dataUltimaCompra = new Date(ultimaCompra.data);
    diasSemCompra = Math.floor(
      (dataAtual - dataUltimaCompra) / (1000 * 60 * 60 * 24)
    ); // Diferença em dias
    ultimaCompraData = dataUltimaCompra.toLocaleDateString(); // Formato legível

    // Calcula a média dos valores das compras
    mediaCompras =
      comprasFornecedor.reduce((acc, compra) => acc + compra.valor, 0) /
      comprasFornecedor.length;
  }

  return { diasSemCompra, mediaCompras, ultimaCompraData };
}

function excluirFornecedor(index) {
  if (confirm("Tem certeza que deseja excluir este fornecedor?")) {
    fornecedores.splice(index, 1);
    localStorage.setItem("fornecedores", JSON.stringify(fornecedores));
    mostrarFornecedores();
  }
}

// Funções para abrir e fechar o modal
function openModal() {
  document.getElementById("modalForm").style.display = "flex";
}

function fecharModal() {
  document.getElementById("modalForm").style.display = "none";
}

function limparFormulario() {
  document.getElementById("nome").value = "";
  document.getElementById("pedidoMinimo").value = "";
  document.getElementById("frequencia").value = "";
  document.getElementById("categoria").value = "";
  document.getElementById("foto").value = "";
}

function openModalCompra() {
  const fornecedorSelect = document.getElementById("fornecedorCompra");
  fornecedorSelect.innerHTML =
    '<option value="">Selecione um fornecedor</option>';
  fornecedores.forEach((fornecedor, index) => {
    fornecedorSelect.innerHTML += `<option value="${index}">${fornecedor.nome}</option>`;
  });
  document.getElementById("modalCompra").style.display = "flex";
}

// Atualizar a função de adicionar compra para garantir que os fornecedores sejam mostrados corretamente
function adicionarCompra() {
  const fornecedorSelect = document.getElementById("fornecedorCompra");
  const fornecedorIndex = fornecedorSelect.value;
  const valor = document.getElementById("valorCompra").value;
  const dataCompra = document.getElementById("dataCompra").value; // Captura a data inserida
  const status = document.getElementById("statusCompra").value;

  // Verifica se todos os campos obrigatórios foram preenchidos
  if (fornecedorIndex === "" || !dataCompra) {
    alert("Por favor, selecione um fornecedor e insira a data da compra.");
    return;
  }

  const fornecedor = fornecedores[fornecedorIndex];

  if (fornecedor) {
    const novaCompra = {
      valor: parseFloat(valor),
      data: new Date(dataCompra).toISOString(), // Armazena a data da compra
      status: status, // Armazena o status da compra
    };

    // Adiciona a compra ao fornecedor
    fornecedor.compras.push(novaCompra);
    localStorage.setItem("fornecedores", JSON.stringify(fornecedores));

    // Atualiza as listas após a adição
    mostrarFornecedores();
    mostrarCompras();

    fecharModalCompra();
    limparFormularioCompra();
  } else {
    alert("Fornecedor não encontrado.");
  }
}

function mostrarCompras() {
  const comprasList = document.getElementById("comprasList");
  comprasList.innerHTML = "";

  fornecedores.forEach((fornecedor, fornecedorIndex) => {
    if (fornecedor.compras) {
      fornecedor.compras.forEach((compra, compraIndex) => {
        comprasList.innerHTML += `
                    <div class="compra-card">
                        <strong>Fornecedor: ${fornecedor.nome}</strong>
                        <p>Valor: R$${compra.valor.toFixed(2)}</p>
                        <p>Data: ${new Date(
                          compra.data
                        ).toLocaleDateString()}</p>
                        <p>Status: <span>${compra.status}</span></p>
                        <button id='excluir' onclick="excluirCompra(${fornecedorIndex}, ${compraIndex})">Excluir</button>
                    </div>
                `;
      });
    }
  });
}

function limparFormularioCompra() {
  document.getElementById("compraForm").reset(); // Reseta o formulário
}

// Funções para fechar o modal de compra
function fecharModalCompra() {
  document.getElementById("modalCompra").style.display = "none";
}
