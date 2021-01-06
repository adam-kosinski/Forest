//TODO: sometimes players will disconnect if the computer goes to sleep (long inactivity)
//If this happens, they don't always reconnect when the computer comes back up, and thus the id_to_name array
//fails to get their name, which causes a failure to get the player object, which causes some other error and
//crashes the server

//fix - maaybe notify the player if they're disconnected (not sure if that's actually possible since they disconnected)
//better fix - put checks in this file if the player is disconnected before doing anything with a received emit


//SERVER SETUP --------------------------------------------------------------------------------

// Dependencies
let express = require("express");
let http = require("http");
let path = require("path");
let socketIO = require("socket.io");

let game_file = require("./game");
let Game = game_file.Game;

let classes = require("./classes");
let PlayerStatus = classes.PlayerStatus;
let Element = classes.Element;
let Map = classes.Map;

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

let player_statuses = {}; //holds PlayerStatus objects (only to store connected/not), keys are player names (not socket ids, since socket ids change when you disconnect then reconnect)
let id_to_name = {}; //maps socket ids to names. If a name isn't in here, player is disconnected

let game = undefined; //undefined means no game currently going on
let current_player_names = []; //items need to know this during the game constructor, so we're going to let them get it from this file
                                //having the game pass this as an argument to every item constructor is painful so this is better
                                //this is redefined each time a "start_game" emit is received



// WEBSOCKET HANDLERS --------------------------------------------------------------------------------------------------------------------
io.on("connection", function(socket) {


  // PLAYER CONNECTIONS ----------------------------------------------


	//when a new player joins, check if player exists. If they don't, create new player. If they do, only allow join if that player was disconnected
	socket.on("new player", function(name, callback){

		if(!player_statuses.hasOwnProperty(name)){
			if(game != undefined){return;} //don't count spectators as player_statuses. If the game ends, they can refresh and join as a player

			//new player
			console.log("New player: " + name + " (id: " + socket.id + ")");
			player_statuses[name] = new PlayerStatus(name);
			id_to_name[socket.id] = name;
			callback(true); //successful
		}
		else if(player_statuses[name].connected){
			console.log(name + " is a duplicate name - asking them to try another");
			callback(false); //duplicate name, tell the client it's invalid
		}
		else {
			console.log(name + " reconnected (id: " + socket.id + ")");
			id_to_name[socket.id] = name; //add the new mapping
			player_statuses[name].connected = true;
			callback(true); //successful
		}
		io.emit("player_connection", player_statuses);
	});

	//mark player as disconnected when they leave
	socket.on("disconnect", function(){
		if(id_to_name.hasOwnProperty(socket.id)){
			console.log(id_to_name[socket.id]+" disconnected (id: " + socket.id + ")");

			let player = player_statuses[id_to_name[socket.id]];
			player.connected = false;
			delete id_to_name[socket.id];

		}
		io.emit("player_connection", player_statuses);
	});

	socket.on("get_state", function(callback){
		callback(player_statuses, game); //if game is undefined, tells them no game currently happening
	});




  // STATE UPDATES -------------------------------------------------------------------

  socket.on("start_game", function(){
    let connected_player_names = [];
    for(let name in player_statuses){
      if(player_statuses[name].connected){
        connected_player_names.push(name);
      }
    }

    current_player_names = connected_player_names;
    game = new Game(connected_player_names);
    console.log("Game starting");
    console.log(game);
    io.emit("start_game", game);
  });


  socket.on("update_server_element", function(data){
    if(!game){return;} //element storage only occurs during a game

    let update = {id: data.id, style: {}}; //stores stuff to tell clients to update

    if(game.elements.hasOwnProperty(data.id)){
      //then check if there's a difference between the updated version and the one we have
      let storage = game.elements[data.id];
      let different = false;

      //tagName and parentId should never change, just check className and style
      //(id is used as the "name", so has to be the same)

      //never track the 'draggable' class
      data.className = data.className.replace("draggable","").replace(/ +/g, " "); //second one to remove any extra whitespace

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
      let element = new Element(data.tagName, data.id, data.parentId, data.className, data.style);
      game.elements[data.id] = element;
      update = element;
      console.log("New element", element);
    }

    //update all clients except the sender
    socket.broadcast.emit("update_client_element", update);

  });



  socket.on("walk", function(destination){
    let player = game.players[id_to_name[socket.id]];
    if(player.location != destination){

      game.map.places[player.location].leave(player);

      let walk_duration = 5000; //ms, TODO: determine algorithmically based on weight
      let fps = 30; //for showing player progress via emitting updates

      let t_elapsed = 0;
      let interval = setInterval(function(){
        t_elapsed += 1000/fps;
        let fraction = t_elapsed/walk_duration;
        player.travel_progress = fraction;

        socket.emit("activity_progress", "Traveling", fraction); //only send to the person traveling

        if(fraction >= 1){
          clearInterval(interval);
          player.location = destination;
          player.travel_progress = false;
          socket.emit("activity_progress"); //no args mean clear the progress bar
          io.emit("update_state", game); //tell everyone that the player's location changed
        }
        else {
          socket.emit("update_state", game); //only the player moving needs to know the progress while traveling
        }
      }, 1000/fps);
    }
  });


  /*/interactions for places
  socket.on("get_place_interactions", function(place_idx, callback){
    let player = game.players[id_to_name[socket.id]];
    callback(game.map.places[place_idx].getInteractions());
  });*/

  /*/actions for places
  socket.on("place_action", function(place_idx, action, search_focus=undefined){
    //can consider making search_focus a more generic list of args in the future if more place actions than searching are added
    if(action == "Focused Search"){action = "Search";}
    action = action.toLowerCase().replace(/ /g, "_");
    let player = game.players[id_to_name[socket.id]];
    game.map.places[place_idx][action](player, socket, search_focus);
    io.emit("update_state", game); //in case the action changed something
    // ^ TODO have the acutal action emit update in the future, make sure to pass io (or have a getter function in exports)
  });*/


  socket.on("update_search_coords", function(callback){ //callback takes the place's object as an arg
    //update search coords to match quantity of each item
    let player = game.players[id_to_name[socket.id]];
    game.map.places[player.location].updateSearchCoords();

    callback(game.map.places[player.location]);
    //don't emit update_state, to avoid double updating:
    //(client takes an item -> update_state from server -> client detects item visibility diff -> emits this -> update_state from server)
  });


  socket.on("found", function(place_idx, type, idx){
    //type is either "item" or "thing"

    let player = game.players[id_to_name[socket.id]];

    if(type == "item"){
      game.map.places[place_idx].items[idx].n_visible_for[player.name]++;
      io.emit("update_state", game);
    }
  });


  //interactions for things and items, shown in the contextmenu
  socket.on("get_interactions", function(where, type, idx, callback){
    //where is a place idx or "my"
    //type is "thing" or "item"
    let player = game.players[id_to_name[socket.id]];
    let object = where == "my" ? player.items[idx] : game.map.places[where][type+"s"][idx];
    callback(object.getInteractions(player));
  });


  //actions for things and items
  socket.on("action", function(where, type, idx, action){
    //where is a place idx or "my"
    //type is "thing" or "item"
    action = action.toLowerCase().replace(/ /g, "_");
    let player = game.players[id_to_name[socket.id]];
    let object = where == "my" ? player.items[idx] : game.map.places[where][type+"s"][idx];

    object[action](player, socket);
    io.emit("update_state", game); //in case the action changed something
    // ^ TODO have the acutal action emit update in the future, make sure to pass io (or have a getter function in exports)
  });



});


exports.getGame = function(){return game;}
exports.getCurrentPlayerNames = function(){return current_player_names;}
