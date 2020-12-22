//SERVER SETUP --------------------------------------------------------------------------------

// Dependencies
let express = require("express");
let http = require("http");
let path = require("path");
let socketIO = require("socket.io");

let classes = require("./classes");
let Player = classes.Player;
let Game = classes.Game;
let Element = classes.Element;

//app stuff
let app = express();
let server = http.Server(app);
let io = socketIO(server);

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




//STORAGE ------------------------------------------------------

let players = {}; //holds Player objects, keys are player names (not socket ids, since socket ids change when you disconnect then reconnect)
let id_to_name = {}; //maps socket ids to names. If a name isn't in here, player is disconnected

let game = undefined; //undefined means no game currently going on



// WEBSOCKET HANDLERS --------------------------------------------------------------------------------------------------------------------
io.on("connection", function(socket) {


  // PLAYER CONNECTIONS ----------------------------------------------


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




  // STATE UPDATES -------------------------------------------------------------------

  socket.on("start_game", function(){
    game = new Game();
    console.log("Game starting");
    console.log(game);
    io.emit("start_game");
  });


  socket.on("update_server_element", function(data){
    if(!game){return;} //element storage only occurs during a game

    let update = {id: data.id, style: {}}; //stores stuff to tell clients to update

    if(game.elements.hasOwnProperty(data.id)){
      //then check if there's a difference between the updated version and the one we have
      let storage = game.elements[data.id];
      let different = false;

      //tagName should never change, but just in case...
      if(data.tagName != storage.tagName) {
        console.log("Tagnames don't match", data, storage);
        return;
      }

      if(data.className != storage.className) {
        update.className = data.className;
        storage.className = data.className;
        different = true;
      }

      for(let prop in data.style){
        if(data.style[prop] != storage.style[prop]) {
          update.style[prop] = data.style[prop];
          storage.style[prop] = data.style[prop];
          different = true;
        }
      }

      if(!different){return;}
    }
    else {
      //element isn't tracked yet, start tracking
      let element = new Element(data.tagName, data.id, data.className, data.style);
      game.elements[data.id] = element;
      update = element;
      console.log("New element", element);
    }

    //update all clients except the sender
    socket.broadcast.emit("update_client_element", update);

  });



});
