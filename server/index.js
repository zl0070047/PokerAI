"use strict";
exports.__esModule = true;
var express_1 = require("express");
var http_1 = require("http");
var socket_io_1 = require("socket.io");
var cors_1 = require("cors");
var gameLogic_1 = require("./gameLogic");
var app = (0, express_1["default"])();
var httpServer = (0, http_1.createServer)(app);
var io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});
app.use((0, cors_1["default"])());
app.use(express_1["default"].json());
var rooms = new Map();
io.on('connection', function (socket) {
    console.log('用户连接:', socket.id);
    socket.on('createRoom', function (settings) {
        var roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        var room = {
            id: roomId,
            players: [],
            settings: settings,
            gameState: {
                phase: 'waiting',
                currentBet: 0,
                lastRaiseAmount: 0
            },
            deck: [],
            pot: 0,
            currentTurn: 0,
            communityCards: []
        };
        rooms.set(roomId, room);
        socket.join(roomId);
        socket.emit('roomCreated', roomId);
    });
    // 加入房间
    socket.on('joinRoom', function (_a) {
        var roomId = _a.roomId, playerName = _a.playerName, avatar = _a.avatar;
        var room = rooms.get(roomId);
        if (!room) {
            socket.emit('error', '房间不存在');
            return;
        }
        if (room.players.length >= (room.settings.maxPlayers || 9)) {
            socket.emit('error', '房间已满');
            return;
        }
        var isHost = room.players.length === 0;
        var player = {
            id: socket.id,
            name: playerName,
            avatar: avatar,
            chips: room.settings.initialChips,
            cards: [],
            bet: 0,
            isActive: true,
            isHost: isHost,
            score: 0
        };
        room.players.push(player);
        socket.join(roomId);
        io.to(roomId).emit('playerJoined', room.players);
    });
    // 离开房间
    socket.on('leaveRoom', function (roomId) {
        var _a;
        var room = rooms.get(roomId);
        if (!room)
            return;
        var updatedPlayers = room.players.filter(function (p) { return p.id !== socket.id; });
        if (updatedPlayers.length > 0) {
            // 如果离开的是房主，将房主权限转移给第一个玩家
            if ((_a = room.players.find(function (p) { return p.id === socket.id; })) === null || _a === void 0 ? void 0 : _a.isHost) {
                updatedPlayers[0].isHost = true;
            }
            room.players = updatedPlayers;
        }
        else {
            rooms["delete"](roomId);
        }
        socket.leave(roomId);
        io.to(roomId).emit('playerJoined', updatedPlayers);
    });
    // 开始游戏
    socket.on('startGame', function (roomId) {
        var room = rooms.get(roomId);
        if (!room)
            return;
        var player = room.players.find(function (p) { return p.id === socket.id; });
        if (!(player === null || player === void 0 ? void 0 : player.isHost))
            return;
        if (room.players.length < 2) {
            socket.emit('error', '至少需要2名玩家才能开始游戏');
            return;
        }
        (0, gameLogic_1.startGame)(room);
        io.to(roomId).emit('gameStarted', room);
    });
    // 玩家操作
    socket.on('playerAction', function (action, roomId) {
        var room = rooms.get(roomId);
        if (!room)
            return;
        var playerIndex = room.players.findIndex(function (p) { return p.id === socket.id; });
        if (playerIndex === -1 || playerIndex !== room.currentTurn)
            return;
        (0, gameLogic_1.handlePlayerAction)(room, playerIndex, action);
        (0, gameLogic_1.updateGameState)(room);
        io.to(roomId).emit('gameStateUpdated', room);
    });
    // 断开连接
    socket.on('disconnect', function () {
        rooms.forEach(function (room, roomId) {
            var playerIndex = room.players.findIndex(function (p) { return p.id === socket.id; });
            if (playerIndex !== -1) {
                var isHost = room.players[playerIndex].isHost;
                room.players.splice(playerIndex, 1);
                if (room.players.length === 0) {
                    rooms["delete"](roomId);
                }
                else {
                    if (isHost) {
                        room.players[0].isHost = true;
                    }
                    io.to(roomId).emit('playerLeft', room.players);
                }
            }
        });
    });
});
var PORT = process.env.PORT || 3001;
httpServer.listen(PORT, function () {
    console.log("\u670D\u52A1\u5668\u8FD0\u884C\u5728\u7AEF\u53E3 ".concat(PORT));
});
