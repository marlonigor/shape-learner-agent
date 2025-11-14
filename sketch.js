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
    clearButton.addClass('control-button'); 
    clearButton.addClass('btn-danger');     

    saveButton = createButton('Salvar Exemplo');
    saveButton.parent('button-container');
    saveButton.mousePressed(() => { promptAndSave(); });
    saveButton.addClass('control-button');

    trainButton = createButton('Treinar Modelo');
    trainButton.parent('button-container');
    trainButton.mousePressed(trainModel);
    trainButton.addClass('control-button'); 
    trainButton.addClass('btn-primary');    
    trainButton.attribute('disabled', '');

    recognitionButton = createButton('Iniciar Reconhecimento');
    recognitionButton.parent('button-container');
    recognitionButton.mousePressed(toggleRecognition);
    recognitionButton.addClass('control-button');
    recognitionButton.attribute('disabled', ''); 

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