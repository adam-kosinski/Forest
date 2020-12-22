//SERVER SETUP --------------------------------------------------------------------------------

// Dependencies
var express = require("express");
var http = require("http");
var path = require("path");
var socketIO = require("socket.io");

//app stuff
var app = express();
var server = http.Server(app);
var io = socketIO(server);

app.set("port", 5000);
app.use("/static", express.static(__dirname + "/static"));

// Routing
app.get("/", function(request, response) {
  response.sendFile(path.join(__dirname, "index.html"));
});

// Starts the server.
let port = process.env.PORT;
if(port == null || port == ""){
	port = 5000;
}
server.listen(port, function() {
  console.log("Starting server on port "+port);
});

//CLASSES ------------------------------------------------------
class Player {
  constructor(name){
    this.name = name;
    this.connected = true; //because when we make one of these, it's triggered by a connected player
  }
}


//STORAGE ------------------------------------------------------

let players = {}; //holds Player objects, keys are player names (not socket ids, since socket ids change when you disconnect then reconnect)
let id_to_name = {}; //maps socket ids to names. If a name isn't in here, player is disconnected

let game = undefined; //undefined means no game currently going on



// WEBSOCKET HANDLERS -------------------------------------------
io.on("connection", function(socket) {

	//when a new player joins, check if player exists. If they don't, create new player. If they do, only allow join if that player was disconnected
	socket.on("new player", function(name, callback){

		if(!players.hasOwnProperty(name)){
			if(game != undefined){return;} //don't count spectators as players. If the game ends, they can refresh and join as a player

			//new player
			console.log("New player: " + name + " (id: " + socket.id + ")");
			players[name] = new Player(name);
			id_to_name[socket.id] = name;
			callback(true); //successful
		}
		else if(players[name].connected){
			console.log(name + " is a duplicate name - asking them to try another");
			callback(false); //duplicate name, tell the client it's invalid
		}
		else {
			console.log(name + " reconnected (id: " + socket.id + ")");
			id_to_name[socket.id] = name; //add the new mapping
			players[name].connected = true;
			callback(true); //successful
		}
		io.emit("player_connection", players);
	});

	//mark player as disconnected when they leave
	socket.on("disconnect", function(){
		if(id_to_name.hasOwnProperty(socket.id)){
			console.log(id_to_name[socket.id]+" disconnected (id: " + socket.id + ")");

			let player = players[id_to_name[socket.id]];
			player.connected = false;
			delete id_to_name[socket.id];

		}
		io.emit("player_connection", players);
	});

	socket.on("get_state", function(callback){
		callback(players, game); //if game is undefined, tells them no game currently happening
	});





});
