// agent.js

// Configuração central do agente
const AGENT_CONFIG = {
    STORAGE_KEY: 'shapeDataset', // Onde salvamos no LocalStorage [cite: 22]
    CANVAS_SIZE: 400,            // Tamanho do canvas de desenho
    CAPTURE_SIZE: 128            // Tamanho que salvaremos para o ML [cite: 62, 116]
};

/**
 * Pega o dataset atual do LocalStorage
 */
function getDataset() {
    return JSON.parse(localStorage.getItem(AGENT_CONFIG.STORAGE_KEY)) || [];
}

/**
 * Salva o dataset completo no LocalStorage
 */
function saveDataset(dataset) {
    localStorage.setItem(AGENT_CONFIG.STORAGE_KEY, JSON.stringify(dataset));
    console.log(`Dataset salvo. Total de ${dataset.length} formas.`);
}

/**
 * Captura o canvas atual e o formata como um bitmap (imagem base64)
 * no tamanho esperado pelo modelo. [cite: 124, 125]
 * @param {p5.Graphics} mainCanvas - O canvas principal do p5
 */
function captureBitmap(mainCanvas) {
    // Cria um buffer gráfico temporário para redimensionar
    let gfx = createGraphics(AGENT_CONFIG.CAPTURE_SIZE, AGENT_CONFIG.CAPTURE_SIZE);
    
    // Desenha o canvas principal (mainCanvas) dentro do buffer, redimensionando
    gfx.image(mainCanvas, 0, 0, AGENT_CONFIG.CAPTURE_SIZE, AGENT_CONFIG.CAPTURE_SIZE);
    
    // Converte o buffer para DataURL (base64 PNG) 
    const bitmap = gfx.canvas.toDataURL('image/png');
    gfx.remove(); // Limpa a memória
    return bitmap;
}

/**
 * Função principal para salvar uma nova forma
 * @param {string} label - O rótulo (ex: "circulo") 
 * @param {Array} points - O vetor de pontos do desenho 
 * @param {p5.Graphics} mainCanvas - O canvas principal do p5
 */
function saveShape(label, points, mainCanvas) {
    if (!label || label.trim() === "") {
        console.warn("Rótulo (label) não pode ser vazio.");
        return;
    }

    const bitmap = captureBitmap(mainCanvas);
    
    // Monta o objeto 'Forma' como definido no PRD [cite: 54, 55]
    const newShape = {
        id: crypto.randomUUID(), // ID único
        label: label.toLowerCase().trim(),
        bitmap: bitmap,
        points: points,
        createdAt: new Date().toISOString()
        // O campo 'meta'  pode ser adicionado depois
    };

    // Adiciona ao dataset e salva
    const dataset = getDataset();
    dataset.push(newShape);
    saveDataset(dataset);

    console.log('Nova forma salva:', newShape.label, newShape.id);
    updateTrainingStatus(`Forma "${newShape.label}" salva. Total: ${dataset.length}`);
}

// UI

/**
 * Atualiza a barra de status com uma mensagem.
 * @param {string} message - A mensagem para exibir.
 */
function updateTrainingStatus(message) {
    const statusEl = document.getElementById('status-bar');
    if (statusEl) {
        statusEl.innerText = message;
    }
}

/**
 * Renderiza a visualização do dataset na UI.
 */
function renderDatasetView() {
    const dataset = getDataset();
    const listEl = document.getElementById('dataset-list');
    if (!listEl) return;

    // 1. Agrupar dados por label
    const groups = {};
    for (const shape of dataset) {
        if (!groups[shape.label]) {
            groups[shape.label] = [];
        }
        groups[shape.label].push(shape);
    }

    // 2. Limpar a view antiga e renderizar a nova
    listEl.innerHTML = '';
    
    // 3. Criar HTML para cada grupo
    for (const label in groups) {
        const shapes = groups[label];
        let groupHTML = `<div class="dataset-group">`;
        groupHTML += `<strong>${label}</strong> (${shapes.length}x)`;
        groupHTML += `<div class="mini-grid">`;
        
        // Mostrar miniaturas
        shapes.forEach(shape => {
            // Usamos o bitmap salvo como src da imagem
            groupHTML += `<img src="${shape.bitmap}" alt="${label}" title="${shape.id}">`;
        });
        
        groupHTML += `</div></div>`;
        listEl.innerHTML += groupHTML;
    }

    if (Object.keys(groups).length === 0) {
        listEl.innerHTML = '<p>Nenhuma forma salva ainda.</p>';
    }
}


// Machine Learning

let featureExtractor;
let classifier;
let isModelReady = false;

// Inicializa o FeatureExtractor e o classificador
function initML() {
    // 1. Verifica se p5 e ml5 estão no window
    if (typeof p5 === 'undefined') {
        console.warn("p5.js ainda não carregou...");
        setTimeout(initML, 300);
        return;
    }
    if (typeof ml5 === 'undefined') {
        console.warn("ml5.js ainda não carregou...");
        setTimeout(initML, 300);
        return;
    }

    updateTrainingStatus("Carregando MobileNet...");
    console.log("p5 e ml5 detectados! Iniciando ML...");

    try {
        featureExtractor = ml5.featureExtractor('MobileNet', modelLoaded);
    } catch (e) {
        updateTrainingStatus("Erro ao carregar MobileNet: " + e.message);
        console.error(e);
    }
}

function modelLoaded() {
    console.log('MobileNet carregado com sucesso!');
    isModelReady = true;
    updateTrainingStatus("Modelo pronto! Salve formas e treine.");

    // Prepara o classificador
    const options = { numLabels: 10 }; // ml5 adapta dinamicamente
    classifier = featureExtractor.classification(options);

    // Habilita o botão de treino
    if (window.trainButton && trainButton.elt) {
        trainButton.removeAttribute('disabled');
        trainButton.elt.style.opacity = '1';
        trainButton.elt.style.cursor = 'pointer';
    }

    renderDatasetView();
}

/**
 * Treina o modelo de ML usando o dataset salvo no LocalStorage
 */
async function trainModel() {
    if (!isModelReady) {
        updateTrainingStatus("Modelo ainda não está pronto. Aguarde..."); // Mudar status
        return;
    }
    const dataset = getDataset();
    if (dataset.length < 2) {
        updateTrainingStatus("Você precisa de pelo menos 2 exemplos salvos para treinar."); // Mudar status
        return;
    }

    updateTrainingStatus("Iniciando treinamento... (adicionando exemplos)"); // Mudar status
    
    // ... (o loop 'for (const shape of dataset)' continua o mesmo) ...
    for (const shape of dataset) {
        let img = createImg(shape.bitmap, 'training image', 'anonymous', () => {
            classifier.addImage(img, shape.label);
            img.remove();
        });
        img.hide();
    }

    console.log("Exemplos adicionados. Começando o treino...");
    updateTrainingStatus("Treinando... (calculando...)"); // Mudar status

    classifier.train((lossValue) => {
        if (lossValue) {
            // Isso é chamado a cada época, bom para feedback
            updateTrainingStatus(`Treinando... Perda (Loss): ${lossValue.toFixed(4)}`);
            console.log('Perda (Loss):', lossValue);
        } else {
            console.log('Treinamento concluído!');
            updateTrainingStatus('Treinamento concluído!'); // Mudar status
        }
    });
}