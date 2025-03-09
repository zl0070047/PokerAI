"use strict";
exports.__esModule = true;
exports.updateGameState = exports.handlePlayerAction = exports.startGame = void 0;
var CARD_SUITS = ['♠', '♥', '♦', '♣'];
var CARD_VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
function startGame(room) {
    room.deck = createDeck();
    shuffleDeck(room.deck);
    dealInitialCards(room);
    room.gameState.phase = 'preFlop';
    postBlinds(room);
}
exports.startGame = startGame;
function handlePlayerAction(room, playerIndex, action) {
    var player = room.players[playerIndex];
    switch (action.type) {
        case 'fold':
            player.isActive = false;
            break;
        case 'call':
            var callAmount = room.gameState.currentBet - player.bet;
            player.chips -= callAmount;
            player.bet += callAmount;
            room.pot += callAmount;
            break;
        case 'raise':
            if (action.amount && action.amount > room.gameState.currentBet) {
                var raiseAmount = action.amount - player.bet;
                player.chips -= raiseAmount;
                player.bet += raiseAmount;
                room.pot += raiseAmount;
                room.gameState.currentBet = action.amount;
                room.gameState.lastRaiseAmount = raiseAmount;
            }
            break;
    }
}
exports.handlePlayerAction = handlePlayerAction;
function updateGameState(room) {
    var activePlayers = room.players.filter(function (p) { return p.isActive; });
    if (activePlayers.length === 1) {
        endHand(room);
        return;
    }
    var allPlayersBetEqual = activePlayers.every(function (p) { return p.bet === room.gameState.currentBet; });
    if (allPlayersBetEqual) {
        advancePhase(room);
    }
    else {
        room.currentTurn = getNextPlayerIndex(room);
    }
}
exports.updateGameState = updateGameState;
function createDeck() {
    var deck = [];
    for (var _i = 0, CARD_SUITS_1 = CARD_SUITS; _i < CARD_SUITS_1.length; _i++) {
        var suit = CARD_SUITS_1[_i];
        for (var _a = 0, CARD_VALUES_1 = CARD_VALUES; _a < CARD_VALUES_1.length; _a++) {
            var value = CARD_VALUES_1[_a];
            deck.push(value + suit);
        }
    }
    return deck;
}
function shuffleDeck(deck) {
    var _a;
    for (var i = deck.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        _a = [deck[j], deck[i]], deck[i] = _a[0], deck[j] = _a[1];
    }
}
function dealInitialCards(room) {
    for (var _i = 0, _a = room.players; _i < _a.length; _i++) {
        var player = _a[_i];
        player.cards = [room.deck.pop(), room.deck.pop()];
    }
}
function postBlinds(room) {
    var smallBlindIndex = 1 % room.players.length;
    var bigBlindIndex = 2 % room.players.length;
    room.players[smallBlindIndex].chips -= room.settings.smallBlind;
    room.players[smallBlindIndex].bet = room.settings.smallBlind;
    room.players[bigBlindIndex].chips -= room.settings.bigBlind;
    room.players[bigBlindIndex].bet = room.settings.bigBlind;
    room.gameState.currentBet = room.settings.bigBlind;
    room.pot = room.settings.smallBlind + room.settings.bigBlind;
}
function advancePhase(room) {
    switch (room.gameState.phase) {
        case 'preFlop':
            room.gameState.phase = 'flop';
            room.communityCards = [room.deck.pop(), room.deck.pop(), room.deck.pop()];
            break;
        case 'flop':
            room.gameState.phase = 'turn';
            room.communityCards.push(room.deck.pop());
            break;
        case 'turn':
            room.gameState.phase = 'river';
            room.communityCards.push(room.deck.pop());
            break;
        case 'river':
            room.gameState.phase = 'showdown';
            determineWinner(room);
            break;
    }
    resetBets(room);
}
function resetBets(room) {
    room.gameState.currentBet = 0;
    room.players.forEach(function (p) { return p.bet = 0; });
}
function getNextPlayerIndex(room) {
    var nextIndex = (room.currentTurn + 1) % room.players.length;
    while (!room.players[nextIndex].isActive) {
        nextIndex = (nextIndex + 1) % room.players.length;
    }
    return nextIndex;
}
function determineWinner(room) {
    var activePlayers = room.players.filter(function (p) { return p.isActive; });
    var winner = activePlayers[0];
    winner.chips += room.pot;
    winner.score += 1;
    room.pot = 0;
    startNewRound(room);
}
function startNewRound(room) {
    room.players.forEach(function (player) {
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
function endHand(room) {
    var activePlayers = room.players.filter(function (p) { return p.isActive; });
    if (activePlayers.length === 1) {
        var winner = activePlayers[0];
        winner.chips += room.pot;
        winner.score += 1;
        room.pot = 0;
        startNewRound(room);
    }
}
