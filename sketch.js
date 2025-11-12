// sketch.js

let clearButton;
let saveButton;
let trainButton;

let currentShapePoints = [];
let mainCanvas;

function setup() {
    mainCanvas = createCanvas(AGENT_CONFIG.CANVAS_SIZE, AGENT_CONFIG.CANVAS_SIZE);
    mainCanvas.parent('canvas-container');
    background(255);

    // Botões
    clearButton = createButton('Limpar');
    clearButton.parent('canvas-container');
    clearButton.mousePressed(clearCanvas);

    saveButton = createButton('Salvar Exemplo');
    saveButton.parent('canvas-container');
    saveButton.mousePressed(promptAndSave);

    trainButton = createButton('Treinar Modelo');
    trainButton.parent('canvas-container');
    trainButton.mousePressed(trainModel);
    trainButton.attribute('disabled', '');
    trainButton.elt.style.opacity = '0.5'; // visualmente desabilitado
    trainButton.elt.style.cursor = 'not-allowed';

    // Só inicia o ML quando tudo estiver pronto
    setTimeout(initML, 100); // dá um respiro pro DOM

    renderDatasetView();
}

// Função para limpar o canvas
function clearCanvas() {
  background(255);
  currentShapePoints = [];
}

// Função para salvar o desenho (temporário)
function promptAndSave() {
  // Pede o rótulo [cite: 82]
    const label = prompt("Qual o nome desta forma? (ex: circulo, triangulo)");
    
    if (label) {
        // Chama a função do agent.js para salvar [cite: 43]
        saveShape(label, currentShapePoints, mainCanvas);
        
        // Limpa o canvas para o próximo desenho
        clearCanvas();
        renderDatasetView();
    }
}

// Função executada em loop (desenho)
function draw() {
  // Se o mouse estiver pressionado, desenha
  if (mouseIsPressed) {
    stroke(0);           // Cor do traço: preto
    strokeWeight(4);     // Espessura do traço: 4 pixels
    // Desenha uma linha do ponto anterior ao ponto atual
    line(pmouseX, pmouseY, mouseX, mouseY);

    currentShapePoints.push([mouseX, mouseY]);
  }
}