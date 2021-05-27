let server = require("./server"); //used to get the game object


// Deep copy (required for the copy method) ------------------------------------------------------------

function deepCopy(object){
	let copy;
	//figure out if input is an array or a generic object
	if(Array.isArray(object)){copy = []}
	else {copy = {}}

	for(prop in object){
		if(typeof object[prop] == "object"){
			copy[prop] = deepCopy(object[prop]);
		} else {
			copy[prop] = object[prop]
		}
	}
	return copy;
}


//TODO: FIX IMAGE SRC TO MAKE IT BASED ON TAGS - currently the first img src for given tags will stay


/* Info on Items ---------------------------------

"Items" are collected as part of the scavenger hunt.
This is not to be confused with "things," which is everything else that can be placed at a location.
Only items (not things) can be picked up by players.
Only a subset of items will be used for the goals of a hunt, but many other unused items (or useful but not goal items) will also be placed in the forest.
Items are generated by the game, by places, or by things located in a place.
Items are by default stackable, and same items are defined by having the same equalityString (determined by name, tags, and stackability)
	- unstackable items will always have unique equality strings
An image used for an item must be titled: item_name-tag1-tag2-etc.jpg, tags in alphabetic order, spaces replaced with underscores
	- if Item.const_name is defined, use that instead. See client's util.js imageSrc() for details

Items are defined as classes, with lots of variations, all extending the main Item class below:
*/
let next_item_id = 0; //every item in the game gets a unique integer id, to help track it over time / update calls

class Item {
  constructor(){
		//set defaults

		//these properties typically overridden in child constructors --------------------------
		this.name = "no name"; //items with the same name and the same tags are the same
		this.categories = []; //array of noun categories (strings) this item belongs to. These may be used as item descriptions given to the players to find
              						// - this will not be an exhaustive list, but should include the less general/more objective categories
		this.weight = 0; //how heavy it is; how much it slows the player down
		this.visible = true; //if false, is hidden (not in side panel). Being visible doesn't imply a person can see it, if Item.canFind() doesn't return "yes"


		//these properties sometimes overridden in child constructors -----------------------------
		this.const_name = undefined; //used for images if defined (in the case when this.name can change)
		this.search_target_size = 1 + Math.random()**3; //in gw units (1/100 of game div width) - width and height styling for this Item's search target div, when hidden
		this.coords = {  //where this Item is located in the search_div, if hidden. 0-100 (percent) for x and y
			x: 2+Math.floor(Math.random()*96),
			y: 2+Math.floor(Math.random()*96)
		};
		this.tags = []; //array of strings in alphabetic order, used to mark items with the same name as different - e.g. pinecones in a tree vs. pinecones on the ground
										//generally tags are cleared when an item is placed in a player's inventory - see Item.take (after taking a pinecone from anywhere, they're all the same really)
										//tags are modified with Item.addTag(), Item.removeTag(), and Item.tags = []; to ensure they stay sorted
		this.is_container = false;
		this.needs_container = false;
		this.stackable = true; //affects the equality string


		//these properties not overridden in child constructors -----------------------------------
		this.type = "item";
		this.className = Object.getPrototypeOf(this).constructor.name; //used in client's client_actions.js file
		this.id = next_item_id;
		next_item_id++;
    this.owner = undefined; //undefined or a player name (implies it's in their inventory)
  }
	//methods sometimes overridden ---------------------------
	canTake(player){
		//Returns "yes" if the player can take this item, otherwise returns a string explaining why they can't
		return "yes"; //default
	}
	canFind(player){
		//Returns "yes" if the player can find this item, otherwise returns something else - explanation not necessary
		return "yes"; //default
	}
	getInteractions(player){
    /*function returning an object {actions: [], messages: []} - arrays of strings
        - actions are stuff the player can do, messages are any information relating to the item to show the player
        - for each possible action, there needs to be a method with the same name, taking a player state as an argument
        - (will convert action name to lowercase, and replace spaces with underscores to get method name, see server.js)
    */
    let out = {actions:[], messages:["Weight "+this.weight]};

    if(!this.owner){
			let can_take_result = this.canTake(player);
      if(can_take_result == "yes"){out.actions.push("Take")}
      else {out.messages.push(can_take_result)}
    }
    else if(player.name == this.owner){
      out.actions.push("Drop");
    }
    return out;
  }

	//methods we don't usually override -------------------------
	addTag(tag){ //maintains alphabetical sorting and no duplicates
		if(!this.tags.includes(tag)) this.tags.push(tag);
		this.tags.sort();
	}
	removeTag(tag){
		let i = this.tags.indexOf(tag);
		if(i != -1) this.tags.splice(i, 1);
	}
  deepCopyPropertiesTo(target){
    for(let prop in this){
      if(typeof this[prop] != "object"){
        target[prop] = this[prop];
      }
      else {
        target[prop] = deepCopy(this[prop]);
      }
    }
  }
  copy(){
    let out = new Item();
    this.deepCopyPropertiesTo(out); //copies methods too
    return out;
  }
	equalityString(){
		//same function as in client's util.js - items with the same equality string (same name and tags) are the same
		this.tags.sort(); //just in case
		let string = object.name + (object.tags.length > 0 ? "-" + object.tags.join("-") : "");
	  if(!object.stackable) string += "~" + object.id;
	  return string.replaceAll(" ","_");
	}
  take(player){
		//returns false if failed, true if succeeded - useful when children overriding Item.take() use it

		if(this.canTake(player) != "yes"){
			console.log(player.name + " not allowed to take " + this.name + ", id=" + this.id);
			return false;
		}
		console.log(player.name + " took " + this.name + ", id=" + this.id);

		let item_list = server.getGame().map.places[player.location].items;
		let idx = item_list.indexOf(this);
		if(idx < 0){
			console.log("Item not found in place's item array, canceling 'take' action.");
			return false;
		}
		item_list.splice(idx, 1);

		this.tags = [];
		this.owner = player.name;
		this.visible = true; //technically it is, and if drop it by default it's visible
		player.items.push(this);
		return true;
  }
  drop(){
		let player = server.getGame().players[this.owner];
		console.log(player.name + " dropped " + this.name + ", id=" + this.id);

		let idx = player.items.indexOf(this);
		if(idx < 0){
			console.log("Item not found in player's item array, canceling 'drop' action.");
			return;
		}
		player.items.splice(idx, 1);

		this.owner = undefined;
		server.getGame().map.places[player.location].items.push(this);
  }
}


class Leaf extends Item {
  constructor(species, alive, color){
    super();
    this.species = species;
    this.alive = alive;
    this.color = color;
    if(!color){this.color = alive ? "Green" : "Brown";}

    //required
    this.name = (alive ? this.color : "Dead") + " " + this.species + (species=="Pine" ? " Needle" : " Leaf");
    this.categories = [
      this.species + " Leaf",
      (alive ? "Alive" : "Dead") + " Leaf",
      "Leaf"
    ];
    this.weight = 1;
		this.visible = alive ? Math.random() > 0.4 : true;
  }
}


class Pinecone extends Item {
  constructor(){
    super();
    this.name = "Pinecone";
    this.categories = ["Seed"];
    this.weight = 3;
		this.visible = Math.random() < 0.2;
  }
}


class Nut extends Item {
	constructor(name){
		//name: Acorn, Hickory Nut, Walnut, etc
		super();
		this.name = name;
		this.categories = ["Seed"];
		this.weight = 3;
		this.visible = Math.random() < 0.3;
	}
}


class Rock extends Item {
	constructor(type="Rock"){
		//type can be something like granite
		super();
		this.name = type;
		this.categories = ["Rock"];
		if(type.length > 0) this.categories.push(type);
		this.weight = 5;
		this.visible = type != "Rock" ? Math.random() < 0.2 : Math.random() < 0.5; //special types of rock are rarer
	}
}


class Pebble extends Item {
	constructor(){
		super();
		this.name = "Pebble";
		this.categories = ["Rock"];
		this.weight = 3;
		this.visible = Math.random() < 0.7; //lots of pebbles will be made if they're in a place
	}
}


class Stick extends Item {
	constructor(size){
		//size can be "Twig", nothing for average stick, or "Branch"
		super();
		this.name = "Stick";
		if(size) this.name = size;
		this.categories = ["Stick"];
		switch(size){
			case "Twig": this.weight = 1; this.visible = Math.random() < 0.3; break;
			case "Branch": this.weight = 4; this.visible = Math.random() < 0.7; break;
			default: this.weight = 2; this.visible = Math.random() < 0.5
		}
	}
}


class Container extends Item {
	constructor(name, type, capacity){
		//type: "normal" or "watertight"
		super();
		this.const_name = name;
		this.name = "Empty " + this.const_name + " (0/" + capacity + ")";
		this.categories = ["Container"];
		this.weight = 5;
		this.visible = true; //by default, but can be hidden

		this.is_container = true;
		this.stackable = false;
		this.container_type = type;
		this.container_capacity = capacity;
		this.holding = []; //array of Item objects
	}
	getInteractions(player){
		let out = Item.prototype.getInteractions.call(this, player);
		if(this.owner == player.name) out.actions.push("Empty");
		let total_weight = this.weight + this.holding.reduce((accum, item) => accum + item.weight, 0); //0 is initial value aka initial sum
		out.messages.push("Weight w/ Contents " + total_weight);
		return out;
	}
	isFull(){
		return this.holding.length == this.container_capacity;
	}
	addItem(item){
		if(!this.owner) {
			console.log("Can't add an item to a non-owned container");
			return;
		}
		this.holding.push(item);
		this.name = this.const_name + " with " + this.holding.map(item => item.name).join(", ");
		this.name += " (" + this.holding.length + "/" + this.container_capacity + ")";
	}
	empty(){ //interaction action
		if(!this.owner) {
			console.log("Can't empty a non-owned container");
			return;
		}
		console.log(this.owner + " emptied " + this.name + ", id=" + this.id);
		let owner_player = server.getGame().players[this.owner];
		while(this.holding.length > 0){
			let item = this.holding.pop();
			owner_player.items.push(item);
			if(item.needs_container) item.drop();
		}

		this.name = "Empty " + this.const_name + " (0/" + this.container_capacity + ")";
	}
}


class Dirt extends Item {
	constructor(type="Dirt"){
		//type can also be "Clay", "Sand", etc.
		super();
		this.name = type;
		this.categories = [];
		this.weight = 4;
		this.visible = true;
		this.needs_container = true;
	}
	canTake(player){
		for(let i=0; i<player.items.length; i++){
			let item = player.items[i];
			if(item.is_container && !item.isFull()) return "yes";
		}
		return "You don't have any containers with space left to hold this.";
	}
	take(player){
		//pick it up like normal, then put it in a container
		let success = Item.prototype.take.call(this, player);
		if(!success) return false;
		//look for a container - doesn't have to be watertight
		for(let i=0; i<player.items.length; i++){
			if(player.items[i].is_container && !player.items[i].isFull()){
				let container = player.items[i];
				let my_index = player.items.indexOf(this);
				if(my_index < 0) {
					console.log("Couldn't find item in player items to add to container: " + this.name + ", id=" + this.id);
					return false;
				}
				player.items.splice(my_index, 1);
				container.addItem(this);
				return true;
			}
		}
		console.log("No container for taking item: " + this.name + ", id=" + this.id);
		return false;
	}
}




exports.Item = Item;
exports.Leaf = Leaf;
exports.Pinecone = Pinecone;
exports.Nut = Nut;
exports.Rock = Rock;
exports.Pebble = Pebble;
exports.Stick = Stick;
exports.Container = Container;
exports.Dirt = Dirt;
