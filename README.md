# Shape Learner Agent

Um **agente de IA leve**, rodando **100% no navegador**, que **aprende por demonstração** formas geométricas desenhadas pelo usuário em um canvas.

Este projeto usa um **pipeline de transfer learning** para treinar um modelo de rede neural que reconhece seus desenhos à mão – **sem precisar de servidor**.

## Funcionalidades

- **Aprendizado por Demonstração**  
  No modo *Treinamento*, você desenha uma forma, dá um rótulo (ex: `"círculo"`) e salva no dataset **local**.

- **Reconhecimento em Tempo Real**  
  No modo *Reconhecimento*, o agente analisa o canvas **continuamente** e classifica o desenho atual.

- **Agente Crítico Inteligente**  
  Ele não só classifica: avalia a **própria confiança**!  

- **Gerador de Problemas (Loop de Feedback)**  
  Quando fica "confuso" (baixa confiança), o agente **sugere ações**:  
  > _"Salvar como [forma]?"_ ou _"Salvar como (Outro)?"_  

- **Curadoria de Dataset**  
  Visualize **miniaturas** de todos os exemplos salvos e **delete dados ruins** com um clique.

- **Persistência Total**  
  O agente **nunca esquece**:  
  - Dataset (desenhos) → salvo no **LocalStorage** (JSON + bitmaps)  
  - Modelo treinado ("cérebro" de IA) → salvo no **IndexedDB** (pesos)


## Tecnologias Utilizadas

| Tecnologia | Uso |
|------------|-----|
| **HTML5 / CSS3** | Estrutura e estilo da interface |
| **JavaScript (ES6+ / async/await)** | Lógica principal e fluxo assíncrono |
| **p5.js** | Canvas interativo + captura fluida de desenho |
| **TensorFlow.js (TF.js)** | Pipeline completo de ML no navegador: <br> • Carregamento do **MobileNet** (extração de features) <br> • Modelo **sequencial customizado** (`tf.sequential`) <br> • **Treinamento** (`model.fit`) e **inferência** (`model.predict`) |
| **LocalStorage** | Persistência do dataset (JSON + imagens em base64) |
| **IndexedDB** | Armazenamento dos pesos do modelo treinado |
