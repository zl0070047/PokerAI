import { Room, Player, GameState, GameSettings } from './types';

const CARD_SUITS = ['♠', '♥', '♦', '♣'];
const CARD_VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export function startGame(room: Room) {
  room.deck = createDeck();
  shuffleDeck(room.deck);
  dealInitialCards(room);
  room.gameState.phase = 'preFlop';
  postBlinds(room);
}

export function handlePlayerAction(room: Room, playerIndex: number, action: { type: string, amount?: number }) {
  const player = room.players[playerIndex];
  
  switch (action.type) {
    case 'fold':
      player.isActive = false;
      break;
    case 'call':
      const callAmount = room.gameState.currentBet - player.bet;
      player.chips -= callAmount;
      player.bet += callAmount;
      room.pot += callAmount;
      break;
    case 'raise':
      if (action.amount && action.amount > room.gameState.currentBet) {
        const raiseAmount = action.amount - player.bet;
        player.chips -= raiseAmount;
        player.bet += raiseAmount;
        room.pot += raiseAmount;
        room.gameState.currentBet = action.amount;
        room.gameState.lastRaiseAmount = raiseAmount;
      }
      break;
  }
}

export function updateGameState(room: Room) {
  const activePlayers = room.players.filter(p => p.isActive);
  
  if (activePlayers.length === 1) {
    endHand(room);
    return;
  }

  const allPlayersBetEqual = activePlayers.every(p => p.bet === room.gameState.currentBet);
  
  if (allPlayersBetEqual) {
    advancePhase(room);
  } else {
    room.currentTurn = getNextPlayerIndex(room);
  }
}

function createDeck(): string[] {
  const deck: string[] = [];
  for (const suit of CARD_SUITS) {
    for (const value of CARD_VALUES) {
      deck.push(value + suit);
    }
  }
  return deck;
}

function shuffleDeck(deck: string[]) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

function dealInitialCards(room: Room) {
  for (const player of room.players) {
    player.cards = [room.deck.pop()!, room.deck.pop()!];
  }
}

function postBlinds(room: Room) {
  const smallBlindIndex = 1 % room.players.length;
  const bigBlindIndex = 2 % room.players.length;
  
  room.players[smallBlindIndex].chips -= room.settings.smallBlind;
  room.players[smallBlindIndex].bet = room.settings.smallBlind;
  
  room.players[bigBlindIndex].chips -= room.settings.bigBlind;
  room.players[bigBlindIndex].bet = room.settings.bigBlind;
  
  room.gameState.currentBet = room.settings.bigBlind;
  room.pot = room.settings.smallBlind + room.settings.bigBlind;
}

function advancePhase(room: Room) {
  switch (room.gameState.phase) {
    case 'preFlop':
      room.gameState.phase = 'flop';
      room.communityCards = [room.deck.pop()!, room.deck.pop()!, room.deck.pop()!];
      break;
    case 'flop':
      room.gameState.phase = 'turn';
      room.communityCards.push(room.deck.pop()!);
      break;
    case 'turn':
      room.gameState.phase = 'river';
      room.communityCards.push(room.deck.pop()!);
      break;
    case 'river':
      room.gameState.phase = 'showdown';
      determineWinner(room);
      break;
  }
  
  resetBets(room);
}

function resetBets(room: Room) {
  room.gameState.currentBet = 0;
  room.players.forEach(p => p.bet = 0);
}

function getNextPlayerIndex(room: Room): number {
  let nextIndex = (room.currentTurn + 1) % room.players.length;
  while (!room.players[nextIndex].isActive) {
    nextIndex = (nextIndex + 1) % room.players.length;
  }
  return nextIndex;
}

function determineWinner(room: Room) {
  const activePlayers = room.players.filter(p => p.isActive);
  const winner = activePlayers[0];
  winner.chips += room.pot;
  winner.score += 1;
  room.pot = 0;
  
  startNewRound(room);
}

function startNewRound(room: Room) {
  room.players.forEach(player => {
    player.cards = [];
    player.bet = 0;
    player.isActive = true;
  });
  room.communityCards = [];
  room.pot = 0;
  room.gameState.phase = 'waiting';
  room.gameState.currentBet = 0;
  
  if (room.players.length >= 2) {
    startGame(room);
  }
}

function endHand(room: Room) {
  const activePlayers = room.players.filter(p => p.isActive);
  if (activePlayers.length === 1) {
    const winner = activePlayers[0];
    winner.chips += room.pot;
    winner.score += 1;
    room.pot = 0;
    startNewRound(room);
  }
}