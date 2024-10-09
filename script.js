let currentPage = 1;
let filteredDisciplinas = [];
const itemsPerPage = 9;
let groupedBySemestre = {}; // Para armazenar as disciplinas agrupadas por semestre

// Função para simular a chamada da API e o retorno do sucesso
async function login() {
  const matricula = document.getElementById("matricula").value;
  const senha = document.getElementById("senha").value;
  const vinculo = document.getElementById("vinculo").value;

  const response = await fetch('http://localhost:7777/api/session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      matricula,
      senha,
      vinculo,
    }),
  });

  if (response.ok) {
    const data = await response.json();
    displayUserData(data.data);
    filteredDisciplinas = [...data.data.historicoAcademico];
    groupedBySemestre = groupBySemester(filteredDisciplinas);

    document.getElementById('login-container').classList.remove('active');
    document.getElementById('main-container').classList.add('active');

    renderDisciplinas();
  } else {
    document.getElementById("message").innerText = "Falha ao fazer login, verifique suas credenciais.";
  }
}

// Função para exibir as informações do usuário na tela principal
function displayUserData(userData) {
  document.getElementById("login-container").style.display = "none";
  document.getElementById("main-container").style.display = "block";

  document.getElementById("nome").innerText = `Nome: ${userData.nome}`;
  document.getElementById("matricula-info").innerText = `Matrícula: ${userData.matricula}`;
  document.getElementById("curso").innerText = `Curso: ${userData.curso}`;
  document.getElementById("universidade").innerText = `Universidade: ${userData.universidade}`;
}

// Função para agrupar disciplinas por semestre
function groupBySemester(disciplinas) {
  const grouped = {};

  disciplinas.forEach(disciplina => {
    const semestre = disciplina.semestre;

    if (!grouped[semestre]) {
      grouped[semestre] = [];
    }
    grouped[semestre].push(disciplina);
  });

  // Ordena os semestres da mais recente (maior) para a mais antiga (menor)
  return Object.keys(grouped)
    .sort((a, b) => b.localeCompare(a))
    .map(semestre => ({ semestre, disciplinas: grouped[semestre] }));
}

// Função para renderizar disciplinas agrupadas por semestre
function renderDisciplinas(page = 1) {
  const totalSemestres = groupedBySemestre.length;
  const disciplinasGrid = document.getElementById('disciplinas-grid');

  disciplinasGrid.innerHTML = '';

  if (totalSemestres === 0) {
    disciplinasGrid.innerHTML = '<p>Nenhuma disciplina encontrada.</p>';
    return;
  }

  // Determina o semestre atual a ser exibido
  const currentSemestreData = groupedBySemestre[page - 1];
  const disciplinasToShow = currentSemestreData.disciplinas;

  disciplinasToShow.forEach(disciplina => {
    const card = document.createElement('div');
    card.classList.add('disciplina-card');

    card.innerHTML = `
      <h3>${disciplina.nome}</h3>
      <p><strong>Código:</strong> ${disciplina.codigo}</p>
      <p><strong>Créditos:</strong> ${disciplina.creditos}</p>
      <p><strong>Docente:</strong> ${disciplina.docente}</p>
      <p><strong>Semestre:</strong> ${disciplina.semestre}</p>
  `;

    disciplinasGrid.appendChild(card);
  });

  document.getElementById('page-info').textContent = `Página ${page} de ${totalSemestres} (Semestre: ${currentSemestreData.semestre})`;
}

function nextPage() {
  const totalSemestres = groupedBySemestre.length;
  if (currentPage < totalSemestres) {
    currentPage++;
    renderDisciplinas(currentPage);
  }
}

function prevPage() {
  if (currentPage > 1) {
    currentPage--;
    renderDisciplinas(currentPage);
  }
}

function filterDisciplinas() {
  const searchTerm = document.getElementById('search-input').value.toLowerCase();

  const filteredBySearch = filteredDisciplinas.filter(disciplina =>
    disciplina.nome.toLowerCase().includes(searchTerm) ||
    disciplina.docente.toLowerCase().includes(searchTerm)
  );

  groupedBySemestre = groupBySemester(filteredBySearch);
  currentPage = 1; // Reseta para a primeira página ao filtrar
  renderDisciplinas(currentPage);
}

