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

        const situacaoBadge = `<span class="badge">${disciplina.situacao}</span>`;
        let horarioDisplay = "Horário não definido";


        const today = new Date();
        // Ajustar para o fuso horário do Brasil
        const brasilDate = new Date(today.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
        const dayOfWeek = brasilDate.getDay(); // 0 - Domingo, 1 - Segunda, ..., 6 - Sábado
        const horaAtual = brasilDate.getHours();

        // Verificar se a disciplina tem horário
        if (disciplina.horario) {
            const lines = disciplina.horario.split('\n');
            const diaSemana = {
                "2": "Segunda-feira",
                "3": "Terça-feira",
                "4": "Quarta-feira",
                "5": "Quinta-feira",
                "6": "Sexta-feira"
            };

            let horarioEncontrado = false;

            lines.forEach(line => {
                const diaRegex = /(\d)/; // Encontra o número do dia da semana
                const horarioRegex = /(\d{2}:\d{2})-(\d{2}:\d{2})/; // Encontra o horário

                const diaMatch = line.match(diaRegex);
                const horarioMatch = line.match(horarioRegex);

                if (diaMatch && horarioMatch) {
                    const dia = parseInt(diaMatch[1]);
                    const [horaInicio] = horarioMatch[1].split(":");

                    // Verifica se a aula é hoje
                    // if (dia === dayOfWeek) {
                    //     horarioEncontrado = true;
                    //     horarioDisplay = `Hoje às ${horarioMatch[1]}-${horarioMatch[2]}`;
                    // } 
                    // Verifica se a aula é amanhã (ou na segunda, caso seja sexta-feira)
                    if (dia === dayOfWeek + 1 || (dayOfWeek === 5 && dia === 2)) {
                        horarioEncontrado = true;
                        horarioDisplay = `Hoje às ${horarioMatch[1]}-${horarioMatch[2]}`;
                    }
                }
            });

            // Caso não tenha encontrado horário para hoje ou amanhã, mostra o horário padrão
            if (!horarioEncontrado) {
                horarioDisplay = disciplina.horario;
            }
        }

        // Adicionar média final, caso exista
        const mediaFinal = disciplina.mediaFinal ? `<p><strong>Média Final:</strong> ${disciplina.mediaFinal}</p>` : '';

        // Criar o card da disciplina
        card.innerHTML = `
     <h3>${disciplina.nome}</h3>
     <p><strong>Código:</strong> ${disciplina.codigo}</p>
     <p><strong>Créditos:</strong> ${disciplina.creditos}</p>
     <p><strong>Docente:</strong> ${disciplina.docente}</p>
     <p><strong>Semestre:</strong> ${disciplina.semestre}</p>
     ${mediaFinal}
     <p>${horarioDisplay}</p>
     <p>${situacaoBadge}</p>
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

