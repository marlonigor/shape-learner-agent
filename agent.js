// agent.js - CORRIGIDO

const AGENT_CONFIG = {
    STORAGE_KEY: 'shapeDataset',
    CANVAS_SIZE: 600,
    CAPTURE_SIZE: 224
};

function getDataset() {
    return JSON.parse(localStorage.getItem(AGENT_CONFIG.STORAGE_KEY)) || [];
}

function saveDataset(dataset) {
    localStorage.setItem(AGENT_CONFIG.STORAGE_KEY, JSON.stringify(dataset));
    console.log(`Dataset salvo. Total de ${dataset.length} formas.`);
}

function captureBitmap(mainCanvas) {
    let gfx = createGraphics(AGENT_CONFIG.CAPTURE_SIZE, AGENT_CONFIG.CAPTURE_SIZE);
    gfx.background(255);
    gfx.image(mainCanvas, 0, 0, AGENT_CONFIG.CAPTURE_SIZE, AGENT_CONFIG.CAPTURE_SIZE);
    const bitmap = gfx.canvas.toDataURL('image/png');
    gfx.remove();
    return bitmap;
}

function saveShape(label, points, mainCanvas) {
    if (!label || label.trim() === "") {
        console.warn("Rótulo (label) não pode ser vazio.");
        return;
    }

    const bitmap = captureBitmap(mainCanvas);
    
    const newShape = {
        id: crypto.randomUUID(),
        label: label.toLowerCase().trim(),
        bitmap: bitmap,
        points: points,
        createdAt: new Date().toISOString()
    };

    const dataset = getDataset();
    dataset.push(newShape);
    saveDataset(dataset);

    console.log('Nova forma salva:', newShape.label, newShape.id);
    updateTrainingStatus(`Forma "${newShape.label}" salva. Total: ${dataset.length}`);
}

function updateTrainingStatus(message) {
    const statusEl = document.getElementById('status-bar');
    if (statusEl) {
        statusEl.innerText = message;
    }
}

function renderDatasetView() {
    const dataset = getDataset();
    const listEl = document.getElementById('dataset-list');
    if (!listEl) return;

    const groups = {};
    for (const shape of dataset) {
        if (!groups[shape.label]) {
            groups[shape.label] = [];
        }
        groups[shape.label].push(shape);
    }

    listEl.innerHTML = '';
    
    for (const label in groups) {
        const shapes = groups[label];
        let groupHTML = `<div class="dataset-group">`;
        groupHTML += `<strong>${label}</strong> (${shapes.length}x)`;
        groupHTML += `<div class="mini-grid">`;
        
        // --- MODIFICAÇÃO AQUI ---
        shapes.forEach(shape => {
            // Adicionamos um container e um botão com 'onclick'
            groupHTML += `
                <div class="thumbnail-container">
                    <img src="${shape.bitmap}" alt="${label}" title="${shape.id}">
                    <button 
                        class="delete-btn" 
                        onclick="handleDeleteShape('${shape.id}', '${label}')"
                    >
                        X
                    </button>
                </div>
            `;
        });
        
        groupHTML += `</div></div>`;
        listEl.innerHTML += groupHTML;
    }

    if (Object.keys(groups).length === 0) {
        listEl.innerHTML = '<p>Nenhuma forma salva ainda.</p>';
    }
}

// Machine Learning com TensorFlow.js PURO
let mobilenetModel;
let customModel;
let isModelReady = false;
let isClassifying = false;
let labelMap = {};
let reverseLabelMap = {};

async function initML() {
    if (typeof p5 === 'undefined') {
        console.warn("p5.js ainda não carregou...");
        setTimeout(initML, 300);
        return;
    }
    if (typeof tf === 'undefined' || typeof mobilenet === 'undefined') {
        console.warn("TensorFlow.js ainda não carregou...");
        setTimeout(initML, 300);
        return;
    }

    updateTrainingStatus("Carregando MobileNet...");
    console.log("TensorFlow.js detectado! Iniciando ML...");

    try {
        mobilenetModel = await mobilenet.load();
        console.log('MobileNet carregado com sucesso!');
        isModelReady = true;
        updateTrainingStatus("Modelo pronto! Salve formas e treine.");

        if (typeof trainButton !== 'undefined' && trainButton && trainButton.elt) {
            trainButton.removeAttribute('disabled');
            trainButton.elt.style.opacity = '1';
            trainButton.elt.style.cursor = 'pointer';
        }

        renderDatasetView();
    } catch (e) {
        updateTrainingStatus("Erro ao carregar MobileNet: " + e.message);
        console.error(e);
    }
}

// Converte bitmap para tensor
async function bitmapToTensor(bitmap) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const tensor = tf.browser.fromPixels(img)
                .resizeBilinear([224, 224])
                .toFloat()
                .div(255.0)
                .expandDims(0);
            resolve(tensor);
        };
        img.onerror = () => reject(new Error("Erro ao carregar imagem"));
        img.src = bitmap;
    });
}

// Extrai features usando MobileNet
async function extractFeatures(imageTensor) {
    // O MobileNet do TensorFlow retorna um embedding direto
    // Usamos o método infer() para pegar as features intermediárias
    const activation = mobilenetModel.infer(imageTensor, true);
    return activation;
}

async function trainModel() {
    if (!isModelReady) {
        updateTrainingStatus("Modelo ainda não está pronto. Aguarde...");
        return;
    }
    
    const dataset = getDataset();
    if (dataset.length < 2) {
        updateTrainingStatus("Você precisa de pelo menos 2 exemplos salvos para treinar.");
        return;
    }

    updateTrainingStatus("Extraindo features das imagens...");
    
    const features = [];
    const labels = [];
    const uniqueLabels = [...new Set(dataset.map(s => s.label))];
    
    labelMap = {};
    reverseLabelMap = {};
    uniqueLabels.forEach((label, idx) => {
        labelMap[idx] = label;
        reverseLabelMap[label] = idx;
    });
    
    console.log('Labels encontrados:', uniqueLabels);
    
    for (let i = 0; i < dataset.length; i++) {
        const shape = dataset[i];
        try {
            const imageTensor = await bitmapToTensor(shape.bitmap);
            const feature = await extractFeatures(imageTensor);
            
            features.push(feature);
            labels.push(reverseLabelMap[shape.label]);
            
            imageTensor.dispose();
            
            console.log(`✓ Features extraídas: ${shape.label} (${i + 1}/${dataset.length})`);
            updateTrainingStatus(`Extraindo features... ${i + 1}/${dataset.length}`);
        } catch (err) {
            console.error(`✗ Erro ao processar ${shape.label}:`, err);
        }
    }
    
    if (features.length === 0) {
        updateTrainingStatus("Erro: Nenhuma feature foi extraída.");
        return;
    }

    const xs = tf.concat(features);
    const ys = tf.oneHot(tf.tensor1d(labels, 'int32'), uniqueLabels.length);
    
    features.forEach(f => f.dispose());
    
    console.log('Shape dos dados:', xs.shape, ys.shape);
    updateTrainingStatus("Construindo modelo neural...");
    
    customModel = tf.sequential({
        layers: [
            tf.layers.dense({ units: 128, activation: 'relu', inputShape: [xs.shape[1]] }),
            tf.layers.dropout({ rate: 0.5 }),
            tf.layers.dense({ units: uniqueLabels.length, activation: 'softmax' })
        ]
    });
    
    customModel.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
    });
    
    console.log('Iniciando treinamento...');
    updateTrainingStatus("Treinando modelo neural...");
    
    try {
        await customModel.fit(xs, ys, {
            epochs: 50,
            batchSize: 8,
            validationSplit: 0.1,
            shuffle: true,
            callbacks: {
                onEpochEnd: (epoch, logs) => {
                    console.log(`Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}, acc = ${logs.acc.toFixed(4)}`);
                    updateTrainingStatus(`Treinando... Epoch ${epoch + 1}/50 - Loss: ${logs.loss.toFixed(4)}`);
                }
            }
        });
        
        xs.dispose();
        ys.dispose();
        
        console.log('✓ Treinamento concluído!');
        updateTrainingStatus('✓ Modelo treinado com sucesso!');
        
        if (typeof recognitionButton !== 'undefined' && recognitionButton && recognitionButton.elt) {
            recognitionButton.removeAttribute('disabled');
            recognitionButton.elt.style.opacity = '1';
            recognitionButton.elt.style.cursor = 'pointer';
        }
    } catch (err) {
        updateTrainingStatus("Erro no treinamento: " + err.message);
        console.error("Erro:", err);
    }
}

async function classifyCanvas() {
    if (!customModel || !isClassifying) return;
    
    try {
        const bitmap = captureBitmap(mainCanvas);
        const imageTensor = await bitmapToTensor(bitmap);
        const features = await extractFeatures(imageTensor);
        
        const prediction = customModel.predict(features);
        const probabilities = await prediction.data();
        
        const maxProb = Math.max(...probabilities);
        const maxIndex = probabilities.indexOf(maxProb);
        const predictedLabel = labelMap[maxIndex];
        
        imageTensor.dispose();
        features.dispose();
        prediction.dispose();
        
        updatePredictionUI([{
            label: predictedLabel,
            confidence: maxProb
        }]);
        
    } catch (err) {
        console.error("Erro na classificação:", err);
    }
    
    if (isClassifying) {
        setTimeout(classifyCanvas, 500);
    }
}

function updatePredictionUI(results) {
    const el = document.getElementById('prediction-output');
    if (!el) return;

    el.classList.remove('critic-confident', 'critic-unsure', 'critic-confused');

    if (!results || !isClassifying) {
        el.innerHTML = 'Predição: (desligado)';
        return;
    }

    const bestResult = results[0];
    const label = bestResult.label;
    const confidence = bestResult.confidence;
    
    let feedbackHTML = '';

    if (confidence >= 0.85) {
        feedbackHTML = `
            <strong>Certeza: ${label}</strong> 
            (${(confidence * 100).toFixed(0)}%)
        `;
        el.classList.add('critic-confident');

    } else if (confidence >= 0.60 && confidence < 0.85) {
        feedbackHTML = `
            Acho que é... <strong>${label}?</strong>
            (${(confidence * 100).toFixed(0)}%)
        `;
        el.classList.add('critic-unsure');

    } else { 
        // --- GERADOR DE PROBLEMAS ATIVADO  ---
        
        feedbackHTML = `
            Não tenho certeza... <strong>(${label}?)</strong>
            (${(confidence * 100).toFixed(0)}%)
            <br><small>O que você quer fazer?</small>
            <div class="critic-actions">
                <button class="critic-button" onclick="promptAndSave('${label}')">Salvar como "${label}"</button>
                <button class="critic-button" onclick="promptAndSave()">Salvar como (Outro)</button>
            </div>
        `;
        el.classList.add('critic-confused');
        
        // 2. Para o loop de classificação
        // toggleRecognition() é global (do sketch.js) e vai
        // inverter isClassifying para 'false' e parar o loop.
        if (typeof toggleRecognition === 'function') {
            toggleRecognition();
        }
    }
    
    el.innerHTML = feedbackHTML;
}

function loopClassification() {
    if (!isClassifying || !customModel) {
        updatePredictionUI(null);
        return;
    }
    
    classifyCanvas();
}

/**
 Deleta uma forma específica do dataset
 * Esta função é chamada pelo 'onclick' do botão 'X'
 * @param {string} shapeId - O ID (UUID) da forma a ser deletada
 * @param {string} label - O rótulo (apenas para a mensagem de log)
 */
function handleDeleteShape(shapeId, label) {
    if (!shapeId) return;

    // Pedir confirmação
    if (!confirm(`Tem certeza que quer deletar este exemplo de "${label}"?`)) {
        return;
    }

    try {
        let dataset = getDataset();
        
        // Filtra o dataset, mantendo todos, EXCETO o que tem o ID correspondente
        const newDataset = dataset.filter(shape => shape.id !== shapeId);

        // Salva o novo dataset (menor) no LocalStorage
        saveDataset(newDataset);

        // Atualiza a UI para refletir a mudança
        renderDatasetView();

        updateTrainingStatus(`Exemplo de "${label}" deletado. Total: ${newDataset.length}`);
        console.log(`Exemplo ${shapeId} (${label}) deletado.`);

    } catch (e) {
        console.error("Erro ao deletar forma:", e);
        updateTrainingStatus("Erro ao deletar exemplo.");
    }
}
