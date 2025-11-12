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
    alert(`Forma "${newShape.label}" salva!`);
}