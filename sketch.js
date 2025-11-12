// sketch.js

let clearButton;
let saveButton;
let trainButton;

let currentShapePoints = [];
let mainCanvas;

function setup() {
  // Cria o canvas e o anexa ao container 'main'
  mainCanvas = createCanvas(AGENT_CONFIG.CANVAS_SIZE, AGENT_CONFIG.CANVAS_SIZE);
  mainCanvas.parent('canvas-container');
  
  // Fundo branco
  background(255);

  // Botão para limpar o canvas
  clearButton = createButton('Limpar');
  clearButton.parent('canvas-container'); // Coloca o botão no container
  clearButton.mousePressed(clearCanvas); // Define o que acontece ao clicar

  // Botão temporário para salvar um exemplo (como no plano)
  saveButton = createButton('Salvar Exemplo');
  saveButton.parent('canvas-container');
  saveButton.mousePressed(promptAndSave);

  // Botão de treino
  trainButton = createButton('Treinar Modelo');
  trainButton.parent('canvas-container');
  trainButton.mousePressed(trainModel);

  // Inicializa
  initML(); // chama o agent.js
}

// Função para limpar o canvas
function clearCanvas() {
  background(255);
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