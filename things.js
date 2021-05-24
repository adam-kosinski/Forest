let items = require("./items");
let server = require("./server"); //used to get the game object


/* Info on Things -------------------------------------

"Things" are anything that can be at a location that is not an item. They cannot be picked up.
Things create the general environment (e.g. trees), so more will be generated than are actually useful.
Things are generated by the game.
Things are never stackable, unlike Items.
An image used for an thing must be titled: thing_name-tag1-tag2-etc.jpg, tags in alphabetical order, spaces replaced with underscores
- if Thing.const_name is defined, use that instead. See client's util.js imageSrc() for details

Things are defined as classes, which extend the base Thing class below:
*/
let next_thing_id = 0; //every Thing in the game gets a unique integer id, to help track it over time / update calls

class Thing {
  constructor(){
    //set default values

    //typically overridden by children
    this.name = "no name";
    this.items = []; //array of Item objects generated by this thing. When this thing is added to a place, the Items in here can be copied to the Place's items property (see game.js code)
    this.visible = true; //if false is hidden (not in side panel). Being visible doesn't imply a person can see it, if Thing.canFind() doesn't return "yes"

    //sometimes overridden
    this.const_name = undefined; //used for images if defined (in the case when this.name can change)
    this.coords = {x:"50%", y:"50%"}; //where this Thing is located in the search_div, if hidden. "0-100%" for x and y
		this.search_target_size = 1; //in gw units (1/100 of game div width) - width and height styling for this Thing's search target div, when hidden
    this.tags = []; //array of strings, alphabetically sorted (but usually empty or only one tag)
                    //used to differentiate Things with the same name, to save space with the name (e.g. name = Forest Floor vs. Prickly Pines Forest Floor)


    //not overridden by children
    this.type = "thing";
    this.className = Object.getPrototypeOf(this).constructor.name; //used in client's client_actions.js file
    this.stackable = false; //Things are never stackable, including this property to be consistent with Items
    this.id = next_thing_id;
    next_thing_id++;
  }

  //methods sometimes overridden -------------------------
  canFind(player){
		//Returns "yes" if the player can find this Thing, otherwise returns something else - explanation not necessary
		return "yes"; //default
	}
  getInteractions(player){
    /*function returning an object {actions: [], messages: []} - arrays of strings
        - actions are stuff the player can do, messages are any information relating to the Thing to show the player
        - for each possible action, there needs to be a method with the same name, taking a player state as an argument
        - (will convert action name to lowercase, and replace spaces with underscores to get method name, see server.js)
    */
    return {actions:[], messages:[]};
  }


  //methods we don't override -------------------------
  addTag(tag){ //maintains alphabetical sorting and no duplicates
		if(!this.tags.includes(tag)) this.tags.push(tag);
		this.tags.sort();
	}
	removeTag(tag){
		let i = this.tags.indexOf(tag);
		if(i != -1) this.tags.splice(i, 1);
	}
  equalityString(){
		//same function as in client's util.js
		this.tags.sort(); //just in case
    let string = object.name + (object.tags.length > 0 ? "-" + object.tags.join("-") : "");
	  if(!object.stackable) string += "~" + object.id;
	  return string.replaceAll(" ","_");
	}
}



class Tree extends Thing {
  constructor(species){
    //species is title case

    super();
    this.species = species;
    this.alive = Math.random() < 0.9;

    this.name = (this.alive ? "" : "Dead ") + species + " Tree";
    this.items = [];
    this.visible = true;

    if(this.alive){
      if(species == "Pine"){
        //pinecones on the ground
        if(Math.random() < 0.7){
          let n_pinecones = Math.floor(Math.random()*Math.random()*7); //quadratic, more likely less visible
          for(let i=0; i<n_pinecones; i++) this.items.push(new items.Pinecone());
        }
        //green pine needles (dead ones generated by the game constructor)
        let n_green_needles = Math.floor(Math.random()*Math.random()*15);
        for(let i=0; i<n_green_needles; i++) this.items.push(new items.Leaf("Pine", true, "Green"));
      }
    }
  }
  getInteractions(player){
    let out = {actions:[], messages:[]};
    if(this.alive) out.actions.push("Climb");
    else {
      out.messages.push(["It's dead.", "Dead as a doorknob."][Math.floor(Math.random()*2)]);
    }
    return out;
  }
  climb(player){
    console.log(player.name + " climbed " + this.name + "! ...though it doesn't do anything yet");
  }
}

/*
Tree notes
  same thing with nuts, fruits
  occasionally green leaves also on the ground
  more commonly nuts on the ground
  also lots of dead leaves on the ground, really easy to access
  bark on the tree, not sure about accessing it
}
*/


class ForestFloor extends Thing {
  constructor(region){
    /*
    Can consider adding the argument
    underground_data: {
      empty: {prob: 0-1.0}
      item: {prob: 0-1.0, quantity: int}
      item2: {prob: 0-1.0, quantity: int}
      etc.
    }
    Or just have this constructor generate that stuff
    */
    super();
    this.name = "Forest Floor";
    this.items = [];
    this.visible = true;

    this.addTag(region);
  }
  getInteractions(){
    return {
      actions: ["Dig"],
      messages: []
    }
  }
  dig(player, socket){
    console.log(player.name + " dug!");
    let duration = player.getActionDuration(1000);
    socket.emit("activity_progress", "Digging", duration);

    setTimeout(function(){
      let place = server.getGame().map.places[player.location];
      place.things.push(new Hole());
      place.items.push(new items.Dirt());
      place.items.push(new items.Dirt());
      socket.emit("activity_progress"); //no args mean clear the progress bar
      server.getIO().emit("update_state", server.getGame());
    }, duration);
  }
}


class Hole extends Thing {
  constructor(capacity=3){
    super();
    this.name = "Empty Hole";
    this.const_name = "Hole";
    this.items = []; //items in this hole
    this.visible = true;

    this.hole_capacity = capacity; //how many items can fit in the hole
  }
  getInteractions(){
    let out = {actions:["Fill In"], messages:[]};
    if(this.items.length > 0){
      out.actions.push("Remove Items");
    }
    if(this.items.length < this.hole_capacity){
      out.actions.push("Put Item In");
    }
    else {
      out.messages.push("Hole cannot fit more items.");
    }
    return out;
  }
  addItem(item){
    if(this.items.length >= this.hole_capacity) console.log("Hole capacity exceeded, id=" + this.id);
    this.items.push(item);
    this.name = "Hole with Items (" + this.items.length + ")";
  }
  put_item_in(player, socket, data){
    //data.item_id should refer to an item in the player's inventory
    let item = player.items.find(obj => obj.id==data.item_id);
    if(item === undefined) {console.log("Couldn't find item in inventory to put in hole, canceling action, item_id=" + data.item_id); return;}
    console.log(player.name + " put item " + item.name + " (id=" + item.id + ") in hole, id=" + this.id);

    player.removeItem(item);
    this.addItem(item);

    this.name = "Hole with Items (" + this.items.length + ")";
  }
  remove_items(player){ //action
    let place = server.getGame().map.places[player.location];
    while(this.items.length > 0){
      let item = this.items.pop();
      place.items.push(item);
    }
    this.name = "Empty Hole";
  }
  fill_in(player, socket){ //action
    console.log(player.name + " filled hole in: " + this.name + ", id=" + this.id);

    //create disturbed ground and transfer my items to it, remove this hole
    let ground = new DisturbedGround();
    while(this.items.length > 0){
      let item = this.items.pop();
      ground.addBuriedItem(item);
    }
    ground.visible = this.visible;
    ground.coords = this.coords;

    let place = server.getGame().map.places[player.location];
    place.removeThing(this);

    //fill in using the activity bar
    let duration = player.getActionDuration(1000);
    socket.emit("activity_progress", "Filling In Hole", duration);
    setTimeout(function(){
      place.things.push(ground);
      socket.emit("activity_progress"); //no args mean clear the progress bar
      server.getIO().emit("update_state", server.getGame());
    }, duration);
  }
}



class DisturbedGround extends Thing {
  constructor(){
    super();
    this.name = "Disturbed Ground";
    this.items = []; //stuff buried here
    this.visible = true; //often it's not

    this.inspect_result = "There doesn't seem to be anything particularly special here. Try digging or looking around here more."; //default
  }
  getInteractions(){
    return {
      actions: ["Toggle","Dig", "Inspect"],
      messages: ["Someone or something disturbed the ground here"]
    };
  }
  addBuriedItem(item){
    //utility function for making the items unfindable
    this.items.push(item);
    item.visible = true; //once we dig it up and are able to find it
    item.canFind = function(){return "nope";}
  }
  dig(player, socket){ //action
    console.log(player.name + " dug at " + this.name + ", id=" + this.id);
    //make a hole and transfer our items/properties to it, remove this disturbed ground
    let hole = new Hole();
    while(this.items.length > 0){
      let item = this.items.pop();
      item.canFind = function(){return "yes";}
      hole.addItem(item);
    }
    hole.visible = this.visible;
    hole.coords = this.coords;

    let place = server.getGame().map.places[player.location];
    place.removeThing(this);

    //dig using the activity bar
    let duration = player.getActionDuration(1000);
    socket.emit("activity_progress", "Digging", duration);
    setTimeout(function(){
      place.things.push(hole);
      place.items.push(new items.Dirt());
      place.items.push(new items.Dirt());
      socket.emit("activity_progress"); //no args mean clear the progress bar
      server.getIO().emit("update_state", server.getGame());
    }, duration);
  }
  inspect(player, socket){ //action
    console.log(player.name + " inspected " + this.name + ", id=" + this.id);
    socket.emit("alert", this.inspect_result);
  }
  toggle(){
    this.visible = !this.visible;
  }
}




class BearDen extends Thing {
  constructor(){
    super();
    this.name = "Bear Den";
    this.items = [];
    this.visible = true;
  }
  getInteractions(){
    return {
      actions: ["Talk to Bear"],
      messages: []
    };
  }
  talk_to_bear(player, socket){
    console.log("talk to bear");
    server.getGame().animals.bear.talk(player, socket);
  }
}


exports.Tree = Tree;
exports.ForestFloor = ForestFloor;
exports.Hole = Hole;
exports.DisturbedGround = DisturbedGround;
exports.BearDen = BearDen;
