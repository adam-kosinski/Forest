//SETUP ---------------------------------------------------

let socket = io();
let id; //id of the socket

//CONNECTION TO SERVER -----------------------------------

//store the id of the connection
socket.on("connect", function(){
	console.log("My ID: "+socket.id);
	id = socket.id;
});

//if disconnect, don't try to reconnect - that would mess up the id_to_name database in the server
//we could connect back with the same name using some hack... but just ask user to reload
socket.on("disconnect", function(){
	console.warn("disconnect detected, preventing reconnection attempts");
	socket.disconnect();
	alert("You have disconnected from the server. If the server is up, reloading the page will reconnect you.");
});

//send a new player message to the server, and pick name
function registerName(){
	//my_name declared in globals.js
	my_name = prompt("Please enter a name:"); //TODO: make this a GUI thing not a prompt
	if(my_name===""){
		registerName();
		return;
	}
	if(!my_name){
		throw new Error("Name entry canceled, leaving webpage blank");
	}

	socket.emit("new player", my_name, function(success){
		console.log("Name registration success:",success);
		if(!success){
			alert("'"+my_name+"' is taken. Please choose another");
			my_name = undefined;
			registerName();
		}
	});
}

registerName();




//check if a game is going on
socket.emit("get_state", function(player_statuses, game){
	if(game){
		console.log(game);
		if(!game.players.hasOwnProperty(my_name)){
			am_spectator = true;
			alert("The name you entered does not match a current player. You will be able to watch as a spectator until this game finishes.");
		}
		game_active = true;
		initGameDisplay(game);
		console.log("game already started");
	}
	else {
		home_screen.style.display = "block";
	}
});



// FUNCTIONS SENDING STUFF TO SERVER ---------------------------

function updateServerElement(element, ...style_properties){
	//sends data about an element (tagname, id, className, style) to the server, who remembers the data for each element it's tracking
	//if the server notices a difference, it will send out updates to all the clients but this one, do change the element's display
	//if the element is not yet tracked, the server will start tracking it

	//only the style properties specified as extra arguments will be updated

	let data = {
		tagName: element.tagName.toLowerCase(),
		id: element.id,
		parentId: element.parentElement.id,
		className: element.className,
		style: {}
	};

	let style = getComputedStyle(element);
	for(let i=0; i<style_properties.length; i++){
		let prop = style_properties[i];
		data.style[prop] = style[prop];
	}

	socket.emit("update_server_element", data);
}




//debug -----------------------------------------------
function getState(){
	socket.emit("get_state", function(player_statuses, game){
		console.log("Player Statuses", player_statuses);
		console.log("Game", game);
	});
}





// SOCKET EVENT HANDLERS ---------------------------------

socket.on("player_connection", function(player_statuses){
	//update player display on home screen
	player_display.innerHTML = "";
	for(let name in player_statuses){
		if(player_statuses[name].connected){

			//make a player display for them
			let div = document.createElement("div");
			div.id = name + "_home_screen";
			div.className = "connected_player";
			let avatar = document.createElement("div");
			let scroll = document.createElement("img");
			scroll.src = "/static/images/scroll.svg";
			let name_display = document.createElement("p");
			name_display.textContent = name;
			div.appendChild(avatar);
			div.appendChild(scroll);
			div.appendChild(name_display);
			player_display.appendChild(div);
			setTimeout(function(){ //seems like a delay is needed for curved text, maybe circletype is using computed values
				new CircleType(name_display).radius(0.15*window.innerHeight);
			}, 100);
		}
	}

	//indicate disconnected in game GUI if game active TODO
});


socket.on("start_game", function(game){
	console.log("Game starting");
	game_active = true;

	//fade to dark slowly and then back to light to start the game
	dark_fade.style.display = "block";
	let opacity = 0;
	let sign = 1; //increase opacity at first

	let interval = setInterval(function(){
		opacity += sign*0.05;
		dark_fade.style.opacity = opacity;

		if(opacity >= 1.5){ //if the opacity is > 1, element rendered fully opaque. This is a hack to get it to stay dark for a second before lightening up again
			home_screen.style.display = "none";
			initGameDisplay(game); //display.js
			sign = -1;
		}
		if(opacity <= 0){
			dark_fade.style.display = "none";
			clearInterval(interval);
		}
	}, 5); //TODO change it back to 50ms
});


socket.on("update_client_element", function(data){
	updateClientElement(data);
});


socket.on("update_state", function(game){
	console.log("update");
	me = game.players[my_name];
	here = game.map.places[me.location];

	prev_game_obj = game_obj;
	game_obj = game;

	socket.emit("getCannotFind", function(cannotFind){
		updatePlaceInfo(cannotFind); //display.js
		updateSearchDiv(cannotFind); //display.js
		updateInventory(); //display.js
		prevCannotFind = cannotFind; //prevCannotFind originally initialized in initGameDisplay() - see display.js
	});
});


socket.on("alert", function(message){
	customAlert(message);
});


socket.on("activity_progress", function(activity, duration){
	if(activity){
		let progress_bar = document.getElementById("activity_progress");
		document.getElementById("activity_name").textContent = activity;
		progress_bar.value = 0;

		show(progress_div);

		//animate the progress bar
		let t_start;
		let step_function = function(t_now){ //arg is time elapsed since document loaded, in ms
			if(t_start === undefined){
				t_start = t_now;
			}
			let fraction = (t_now - t_start)/duration;
			progress_bar.value = fraction;
			if(fraction < 1){
				window.requestAnimationFrame(step_function);
			}
		}
		window.requestAnimationFrame(step_function);
	}
	else {
		//clear the progress indicator screen
		if(getComputedStyle(progress_div).display != "none"){
			hide(progress_div);
		}
	}
});


//placeholder for bear conversation
socket.on("hello", function(){
	console.log("I heard hello!");
});
