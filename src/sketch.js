let clearButton;
let saveButton;

// Função executada uma vez, quando o app inicia
function setup() {
  // Cria o canvas e o anexa ao container 'main'
  let canvas = createCanvas(400, 400);
  canvas.parent('canvas-container');
  
  // Fundo branco
  background(255);

  // Botão para limpar o canvas
  clearButton = createButton('Limpar');
  clearButton.parent('canvas-container'); // Coloca o botão no container
  clearButton.mousePressed(clearCanvas); // Define o que acontece ao clicar

  // Botão temporário para salvar um PNG (como no plano)
  saveButton = createButton('Salvar PNG');
  saveButton.parent('canvas-container');
  saveButton.mousePressed(saveDrawing);
}

// Função para limpar o canvas
function clearCanvas() {
  background(255);
}

// Função para salvar o desenho (temporário)
function saveDrawing() {
  saveCanvas('meu_desenho', 'png');
}

// Função executada em loop (desenho)
function draw() {
  // Se o mouse estiver pressionado, desenha
  if (mouseIsPressed) {
    stroke(0);           // Cor do traço: preto
    strokeWeight(4);     // Espessura do traço: 4 pixels
    // Desenha uma linha do ponto anterior ao ponto atual
    line(pmouseX, pmouseY, mouseX, mouseY);
  }
}