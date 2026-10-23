// ==========================================
// 0. CONFIGURAÇÃO DO BANCO DE DADOS (IndexedDB para Vídeos Longos)
// ==========================================
function abrirBanco() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('DiarioInfantilDB', 1);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('midias')) {
                db.createObjectStore('midias');
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function salvarVideoLocal(file) {
    const db = await abrirBanco();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('midias', 'readwrite');
        const store = tx.objectStore('midias');
        store.put(file, 'videoAtividade');
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function obterVideoLocal() {
    const db = await abrirBanco();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('midias', 'readonly');
        const store = tx.objectStore('midias');
        const request = store.get('videoAtividade');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// ==========================================
// 1. LÓGICA DA TELA DE LOGIN (index.html)
// ==========================================
const formLogin = document.querySelector('form');

if (formLogin && document.getElementById('perfil')) {
    formLogin.addEventListener('submit', function(event) {
        event.preventDefault();
        const perfil = document.getElementById('perfil').value;
        sessionStorage.setItem('usuarioLogado', perfil);
        window.location.href = (perfil === 'pai') ? 'feed.html' : 'dashboard.html';
    });
}

// ==========================================
// 2. LÓGICA DO PAINEL DO PROFESSOR (dashboard.html)
// ==========================================
const formDashboard = document.querySelector('.form-dashboard') || document.querySelector('form');

if (formDashboard && document.getElementById('aluno-select')) {
    formDashboard.addEventListener('submit', async function(event) {
        event.preventDefault();

        const alunoSelect = document.getElementById('aluno-select');
        const nomeAluno = alunoSelect ? alunoSelect.options[alunoSelect.selectedIndex].text : 'Maria Oliveira';

        const alimentacao = document.getElementById('alimentacao') ? document.getElementById('alimentacao').value : '';
        const cochilo = document.getElementById('cochilo') ? document.getElementById('cochilo').value : '';
        const observacao = document.getElementById('observacao') ? document.getElementById('observacao').value : '';

        const higiene = document.getElementById('higiene-select') ? document.getElementById('higiene-select').value : '';
        const disposicao = document.getElementById('disposicao-select') ? document.getElementById('disposicao-select').value : '';

        const horaEntrada = document.getElementById('hora-entrada') ? document.getElementById('hora-entrada').value : '--:--';
        const horaSaida = document.getElementById('hora-saida') ? document.getElementById('hora-saida').value : '--:--';
        const responsavelBusca = document.getElementById('responsavel-busca') ? document.getElementById('responsavel-busca').value : '';

        const ementaSopa = document.getElementById('ementa-sopa') ? document.getElementById('ementa-sopa').value : '';
        const ementaPrato = document.getElementById('ementa-prato') ? document.getElementById('ementa-prato').value : '';
        const ementaLanche = document.getElementById('ementa-lanche') ? document.getElementById('ementa-lanche').value : '';

        const medNome = document.getElementById('med-nome') ? document.getElementById('med-nome').value : '';
        const medHora = document.getElementById('med-hora') ? document.getElementById('med-hora').value : '';
        const medStatus = document.getElementById('med-status') ? document.getElementById('med-status').value : '';
        const saudeBaixa = document.getElementById('saude-baixa') ? document.getElementById('saude-baixa').value : '';

        const recadoTexto = document.getElementById('recado-texto') ? document.getElementById('recado-texto').value : '';
        const elemAtividadeTexto = document.getElementById('atividade-texto');
        const atividadeTexto = elemAtividadeTexto ? elemAtividadeTexto.value : '';

        const fotoInput = document.getElementById('foto-input');
        const videoInput = document.getElementById('video-input');

        // 1. Processar e AGUARDAR a gravação do vídeo no IndexedDB
        let temVideo = false;
        if (videoInput && videoInput.files && videoInput.files[0]) {
            try {
                await salvarVideoLocal(videoInput.files[0]);
                temVideo = true;
            } catch (err) {
                console.error("Erro ao guardar o vídeo no IndexedDB:", err);
            }
        }

        // 2. Função de envio final dos dados
        function salvarEEnviar(fotoBase64) {
            const dadosRotina = {
                aluno: nomeAluno,
                alimentacao: alimentacao,
                cochilo: cochilo,
                higiene: higiene,
                disposicao: disposicao,
                observacao: observacao,
                horaEntrada: horaEntrada,
                horaSaida: horaSaida,
                responsavelBusca: responsavelBusca,
                ementaSopa: ementaSopa,
                ementaPrato: ementaPrato,
                ementaLanche: ementaLanche,
                medNome: medNome,
                medHora: medHora,
                medStatus: medStatus,
                saudeBaixa: saudeBaixa,
                recadoTexto: recadoTexto,
                confirmado: false,
                atividadeTexto: atividadeTexto,
                foto: fotoBase64 || null,
                temVideo: temVideo
            };

            localStorage.setItem('rotinaAluno', JSON.stringify(dadosRotina));
            alert('✅ Registro enviado com sucesso!');
            window.location.href = 'feed.html';
        }

        // 3. Processar Foto
        if (fotoInput && fotoInput.files && fotoInput.files[0]) {
            const readerFoto = new FileReader();
            readerFoto.onload = function(e) {
                salvarEEnviar(e.target.result);
            };
            readerFoto.readAsDataURL(fotoInput.files[0]);
        } else {
            salvarEEnviar(null);
        }
    });
}

// ==========================================
// 3. LÓGICA DO FEED DO PAI (feed.html)
// ==========================================
const elemObservacao = document.querySelector('.observacao-box');

if (elemObservacao) {
    const dadosSalvos = localStorage.getItem('rotinaAluno');

    if (dadosSalvos) {
        const rotina = JSON.parse(dadosSalvos);

        // 1. Nome do Aluno
        const elemNomeAluno = document.getElementById('nome-aluno');
        if (elemNomeAluno && rotina.aluno) elemNomeAluno.innerText = rotina.aluno;

        // 2. Rotina Base
        const caixasInfo = document.querySelectorAll('.card-rotina:first-of-type .info-box');
        caixasInfo.forEach(box => {
            const span = box.querySelector('span');
            const strong = box.querySelector('strong');
            if (span && strong) {
                const rotulo = span.innerText.trim();
                if (rotulo === 'Alimentação' && rotina.alimentacao) strong.innerText = rotina.alimentacao;
                if (rotulo === 'Cochilo' && rotina.cochilo) strong.innerText = rotina.cochilo;
                if (rotulo === 'Higiene' && rotina.higiene) strong.innerText = rotina.higiene;
                if (rotulo === 'Disposição' && rotina.disposicao) strong.innerText = rotina.disposicao;
            }
        });

        // 3. Entrada e Saída
        const elemEntrada = document.getElementById('feed-entrada');
        const elemSaida = document.getElementById('feed-saida');
        const elemResponsavel = document.getElementById('feed-responsavel');
        if (elemEntrada && rotina.horaEntrada) elemEntrada.innerText = rotina.horaEntrada;
        if (elemSaida && rotina.horaSaida) elemSaida.innerText = rotina.horaSaida;
        if (elemResponsavel && rotina.responsavelBusca) elemResponsavel.innerText = rotina.responsavelBusca;

        // 4. Ementa
        const elemSopa = document.getElementById('feed-sopa');
        const elemPrato = document.getElementById('feed-prato');
        const elemLanche = document.getElementById('feed-lanche');
        if (elemSopa && rotina.ementaSopa) elemSopa.innerText = rotina.ementaSopa;
        if (elemPrato && rotina.ementaPrato) elemPrato.innerText = rotina.ementaPrato;
        if (elemLanche && rotina.ementaLanche) elemLanche.innerText = rotina.ementaLanche;

        // 5. Saúde e Medicamentos
        const elemSaudeBaixa = document.getElementById('feed-saida-baixa');
        const elemMedNome = document.getElementById('feed-med-nome');
        const elemMedHora = document.getElementById('feed-med-hora');
        const elemMedStatus = document.getElementById('feed-med-status');

        if (elemSaudeBaixa && rotina.saudeBaixa) elemSaudeBaixa.innerText = rotina.saudeBaixa;
        if (elemMedNome && rotina.medNome) elemMedNome.innerText = rotina.medNome;
        if (elemMedHora && rotina.medHora) elemMedHora.innerText = rotina.medHora;
        if (elemMedStatus && rotina.medStatus) elemMedStatus.innerText = rotina.medStatus;

        // 6. Recado e Confirmação
        const elemRecado = document.getElementById('feed-recado-texto');
        const btnConfirmar = document.getElementById('btn-confirmar');
        const statusConfirmacao = document.getElementById('status-confirmacao');

        if (elemRecado && rotina.recadoTexto) elemRecado.innerText = rotina.recadoTexto;

        function atualizarStatusBotao(isConfirmado) {
            if (isConfirmado) {
                if (btnConfirmar) btnConfirmar.style.display = 'none';
                if (statusConfirmacao) statusConfirmacao.style.display = 'block';
            } else {
                if (btnConfirmar) btnConfirmar.style.display = 'block';
                if (statusConfirmacao) statusConfirmacao.style.display = 'none';
            }
        }

        atualizarStatusBotao(rotina.confirmado);

        if (btnConfirmar) {
            btnConfirmar.addEventListener('click', function() {
                rotina.confirmado = true;
                localStorage.setItem('rotinaAluno', JSON.stringify(rotina));
                atualizarStatusBotao(true);
                alert('👍 Confirmação registrada com sucesso!');
            });
        }

        // 7. Atividade do Dia
        const elemDescricao = document.getElementById('descricao-atividade');
        if (elemDescricao && rotina.atividadeTexto) elemDescricao.innerText = rotina.atividadeTexto;

        // 8. Nota
        if (rotina.observacao) elemObservacao.innerHTML = `📌 <strong>Nota do Professor:</strong> ${rotina.observacao}`;

        // 9. Foto com Download
        const containerFoto = document.getElementById('container-foto');
        const imgAtividade = document.getElementById('foto-atividade');
        const btnDownloadFoto = document.getElementById('btn-download-foto');

        if (rotina.foto && containerFoto && imgAtividade) {
            imgAtividade.src = rotina.foto;
            if (btnDownloadFoto) btnDownloadFoto.href = rotina.foto;
            containerFoto.style.display = 'block';
        }

        // 10. Vídeo Longo via IndexedDB (Com correção para reprodução imediata)
        if (rotina.temVideo) {
            obterVideoLocal().then(fileBlob => {
                if (fileBlob) {
                    const videoUrl = URL.createObjectURL(fileBlob);
                    const containerVideo = document.getElementById('container-video');
                    const videoAtividade = document.getElementById('video-atividade');
                    const btnDownloadVideo = document.getElementById('btn-download-video');

                    if (containerVideo && videoAtividade) {
                        videoAtividade.src = videoUrl;
                        
                        if (btnDownloadVideo) {
                            btnDownloadVideo.href = videoUrl;
                            btnDownloadVideo.download = fileBlob.name || "video-atividade.mp4";
                        }

                        containerVideo.style.display = 'block';
                        videoAtividade.load();
                    }
                }
            }).catch(err => {
                console.error("Erro ao ler o vídeo do IndexedDB:", err);
            });
        }
    }
}
// =======================================================
// RESPOSTA DO RECADO (SIM / NÃO) - FEED E DASHBOARD
// =======================================================

// 1. Função chamada quando o pai clica em Autorizar ou Não Autorizar no feed.html
function responderRecado(autorizado) {
    let dadosSalvos = localStorage.getItem('rotinaAluno');
    let rotina = dadosSalvos ? JSON.parse(dadosSalvos) : {};

    // Guarda o estado da resposta
    rotina.respostaRecado = autorizado ? 'autorizado' : 'negado';
    localStorage.setItem('rotinaAluno', JSON.stringify(rotina));

    // Atualiza a visualização no Feed do Pai
    exibirStatusPai(rotina.respostaRecado);
}

// 2. Esconde os botões e mostra a mensagem de confirmação no feed.html
function exibirStatusPai(status) {
    const boxBotoes = document.getElementById('box-botoes-confirmacao');
    const statusBox = document.getElementById('status-confirmacao');

    if (boxBotoes && statusBox) {
        boxBotoes.style.display = 'none'; // Esconde os botões após responder
        statusBox.style.display = 'block';

        if (status === 'autorizado') {
            statusBox.style.backgroundColor = '#e8f8f5';
            statusBox.style.border = '1px solid #27ae60';
            statusBox.style.color = '#27ae60';
            statusBox.innerHTML = '✅ Leitura / Autorização Confirmada!';
        } else if (status === 'negado') {
            statusBox.style.backgroundColor = '#fadbd8';
            statusBox.style.border = '1px solid #e74c3c';
            statusBox.style.color = '#c0392b';
            statusBox.innerHTML = '❌ Marcado como NÃO Autorizado pelo Responsável.';
        }
    }
}

// 3. Ao carregar a página, verifica se já existe resposta e atualiza a interface
document.addEventListener('DOMContentLoaded', () => {
    const dadosSalvos = localStorage.getItem('rotinaAluno');
    if (!dadosSalvos) return;

    const rotina = JSON.parse(dadosSalvos);

    // Se estiver no Feed do Pai e já houver resposta guardada:
    if (rotina.respostaRecado) {
        exibirStatusPai(rotina.respostaRecado);
    }

    // Se estiver no Dashboard do Professor e o elemento de alerta existir:
    const alertaProf = document.getElementById('alerta-resposta-pai');
    if (alertaProf && rotina.respostaRecado) {
        alertaProf.style.display = 'block';
        if (rotina.respostaRecado === 'autorizado') {
            alertaProf.style.backgroundColor = '#d4edda';
            alertaProf.style.color = '#155724';
            alertaProf.style.border = '1px solid #c3e6cb';
            alertaProf.innerHTML = '📩 <strong>Status do Recado:</strong> O responsável marcou como <strong>AUTORIZADO / CONFIRMADO</strong>.';
        } else if (rotina.respostaRecado === 'negado') {
            alertaProf.style.backgroundColor = '#f8d7da';
            alertaProf.style.color = '#721c24';
            alertaProf.style.border = '1px solid #f5c6cb';
            alertaProf.innerHTML = '⚠️ <strong>Status do Recado:</strong> O responsável marcou como <strong>NÃO AUTORIZADO</strong>.';
        }
    }
});