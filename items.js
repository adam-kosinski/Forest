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
An image used for an item must be titled: item_name-tag1-tag2-etc.jpg, tags in alphabetic order, spaces replaced with underscores

Items are defined as classes, with lots of variations, all extending the main Item class below:
*/
let next_item_id = 0; //every item in the game gets a unique integer id, to help track it over time / update calls

class Item {
  constructor(){
		//set defaults

		//these properties typically overridden in child constructors
		this.name = "no name"; //items with the same name and the same tags are the same
		this.categories = []; //array of categories (strings) this item belongs to. These may be used as item descriptions given to the players to find
              						// - this will not be an exhaustive list, but should include the less general/more objective categories
		this.weight = 0; //how heavy it is; how much it slows the player down
		this.visible = true; //if false, is hidden (not in side panel). Being visible doesn't imply a person can see it, if Item.canFind() doesn't return "yes"

		//these properties sometimes overridden in child constructors
		this.search_target_size = "2vw"; //width and height styling for this Item's search target div, when hidden
		this.coords = {  //where this Item is located in the search_div, if hidden. "0-100%" for x and y
			x: (2+Math.floor(Math.random()*96)) + "%",
			y: (2+Math.floor(Math.random()*96)) + "%"
		};
		this.tags = []; //array of strings in alphabetic order, used to mark items with the same name as different - e.g. pinecones in a tree vs. pinecones on the ground
										//generally tags are cleared when an item is placed in a player's inventory - see Item.take (after taking a pinecone from anywhere, they're all the same really)
										//tags are modified with Item.addTag(), Item.removeTag(), and Item.tags = []; to ensure they stay sorted

		//these properties not overridden in child constructors
		this.type = "item";
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
        if(this.canTake(player) == "yes"){out.actions.push("Take")}
        else {out.messages.push(result)}
    }
    else if(player.name == this.owner){
      out.actions.push("Drop");
    }
    return out;
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
  sameAs(item){
    if(this.name != item.name) return false;
    if(this.tags.length != item.tags.length) return false;
    //then have same name and same number of tags, check if tags are the same (note: we assume tags are alphabetically sorted)
		this.tags.sort(); //just in case...
    for(let i=0; i<this.tags.length; i++){
      if(this.tags[i] != item.tags[i]) return false;
    }
    return true;
  }
  take(player){
		console.log(player.name + " took " + this.name + ", id=" + this.id);

		let item_list = server.getGame().map.places[player.location].items;
		let idx = item_list.indexOf(this);
		if(idx < 0){
			console.log("Item not found in place's item array, canceling 'take' action.");
			return;
		}
		item_list.splice(idx, 1);

		this.tags = [];
		this.owner = player.name;
		this.visible = true; //technically it is, and if drop it by default it's visible
		player.items.push(this);
  }
  drop(player){
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
    this.categories = [
      "Seed"
    ];
    this.weight = 3;
		this.visible = Math.random() < 0.3;
  }
}


exports.Item = Item;
exports.Leaf = Leaf;
exports.Pinecone = Pinecone;
