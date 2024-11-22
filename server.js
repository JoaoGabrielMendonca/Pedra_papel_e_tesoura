const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });
console.log('Servidor WebSocket rodando em ws://localhost:8080');

let players = []; // Armazena os jogadores conectados
let choices = {}; // Armazena as escolhas dos jogadores

// Determina o vencedor do jogo
function determineWinner() {
  const [player1, player2] = players;
  const choice1 = choices[player1.id];
  const choice2 = choices[player2.id];

  if (choice1 === choice2) return 'Empate!';
  if (
    (choice1 === 'pedra' && choice2 === 'tesoura') ||
    (choice1 === 'tesoura' && choice2 === 'papel') ||
    (choice1 === 'papel' && choice2 === 'pedra')
  ) {
    return 'Jogador 1 venceu!';
  }
  return 'Jogador 2 venceu!';
}

// Gerencia conexões WebSocket
wss.on('connection', (ws) => {
  if (players.length < 2) {
    const playerId = `player${players.length + 1}`;
    players.push({ id: playerId, ws });

    ws.send(JSON.stringify({ type: 'status', message: 'Aguardando outro jogador...' }));

    if (players.length === 2) {
      players.forEach((player, index) => {
        player.ws.send(JSON.stringify({ type: 'status', message: `Jogadores conectados. Você é o Jogador ${index + 1}.` }));
      });
    }
  } else {
    ws.send(JSON.stringify({ type: 'status', message: 'Sala cheia!' }));
    ws.close();
  }

  // Recebe mensagens dos jogadores
  ws.on('message', (data) => {
    const message = JSON.parse(data);

    if (message.type === 'choice') {
      const player = players.find((p) => p.ws === ws);
      if (player) {
        choices[player.id] = message.choice;

        // Verifica se ambos os jogadores já fizeram suas escolhas
        if (Object.keys(choices).length === 2) {
          const result = determineWinner();

          // Envia o resultado para ambos os jogadores
          players.forEach((player) => {
            player.ws.send(JSON.stringify({ type: 'result', message: result }));
          });

          // Reinicia o jogo
          choices = {};
        }
      }
    }
  });

  // Remove o jogador ao desconectar
  ws.on('close', () => {
    players = players.filter((player) => player.ws !== ws);
    choices = {};
    players.forEach((player) => {
      player.ws.send(JSON.stringify({ type: 'status', message: 'O outro jogador saiu. Aguardando novo jogador...' }));
    });
  });
});
