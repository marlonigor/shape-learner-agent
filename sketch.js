// sketch.js

let clearButton;
let saveButton;
let trainButton;
let recognitionButton;

let currentShapePoints = [];
let mainCanvas;

let canDraw = false;

function setup() {
    mainCanvas = createCanvas(AGENT_CONFIG.CANVAS_SIZE, AGENT_CONFIG.CANVAS_SIZE);
    mainCanvas.parent('canvas-container');
    background(255);

    // Botões
    clearButton = createButton('Limpar');
    clearButton.parent('button-container');
    clearButton.mousePressed(clearCanvas);

    saveButton = createButton('Salvar Exemplo');
    saveButton.parent('button-container');
    saveButton.mousePressed(() => { promptAndSave(); 
});

    trainButton = createButton('Treinar Modelo');
    trainButton.parent('button-container');
    trainButton.mousePressed(trainModel);
    trainButton.attribute('disabled', '');
    trainButton.elt.style.opacity = '0.5'; // visualmente desabilitado
    trainButton.elt.style.cursor = 'not-allowed';

    recognitionButton = createButton('Iniciar Reconhecimento');
    recognitionButton.parent('button-container');
    recognitionButton.mousePressed(toggleRecognition);
    recognitionButton.attribute('disabled', ''); // Desabilitado até o modelo treinar
    recognitionButton.elt.style.opacity = '0.5';
    recognitionButton.elt.style.cursor = 'not-allowed';

    // Só inicia o ML quando tudo estiver pronto
    setTimeout(initML, 100); // dá um respiro pro DOM

    renderDatasetView();
}

function toggleRecognition() {
    isClassifying = !isClassifying; // Inverte o estado

    if (isClassifying) {
        recognitionButton.html('Parar Reconhecimento');
        loopClassification(); // Inicia o loop (definido no agent.js)
    } else {
        recognitionButton.html('Iniciar Reconhecimento');
        updatePredictionUI(null); // Limpa a UI
    }
}

// Função para limpar o canvas
function clearCanvas() {
  background(255);
  currentShapePoints = [];
  canDraw = false;
}



/**
 * @param {string | null} suggestedLabel - O rótulo sugerido pelo crítico.
 */
function promptAndSave(suggestedLabel = null) {
    canDraw = false;
  
    // Se uma sugestão foi dada, usa ela. Senão, fica em branco.
    const defaultLabel = suggestedLabel || "";
    const label = prompt("Qual o nome desta forma? (ex: circulo, triangulo)", defaultLabel);
    
    if (label) {
        saveShape(label, currentShapePoints, mainCanvas);
        clearCanvas(); // <-- Bug de limpeza de canvas que corrigimos
        renderDatasetView();
    }
}

// Função executada em loop (desenho)
function draw() {
    if (mouseIsPressed && canDraw && 
        mouseX >= 0 && mouseX <= width && 
        mouseY >= 0 && mouseY <= height) {
        
        stroke(0);
        strokeWeight(4);
        line(pmouseX, pmouseY, mouseX, mouseY);
        currentShapePoints.push([mouseX, mouseY]);
    }
}

function mousePressed() {
    if (mouseX >= 0 && mouseX <= width && 
        mouseY >= 0 && mouseY <= height) {
        
        canDraw = true;           // ← REATIVA AQUI!
        currentShapePoints = [];  // Novo desenho
    }
}

function mouseReleased() {
    canDraw = false; // Desativa ao soltar o mouse
}