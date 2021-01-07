let server = require("./server"); //used to get the game object

/*
"Items" are collected as part of the scavenger hunt
This is not to be confused with "things," which is everything else that can be placed at a location
Also, only items (not things) can be picked up by players

Only a subset of items will be used for each hunt, but many other unused items also be placed in the forest
Items are generated by places, or by things located in a place

Image used for an item must be titled: itemname-tag1-tag2-etc.jpg


Items are defined as classes, with lots of variations, all extending the main Item class
Each class is required to have the below member variables and methods

    name: string, assumed that items with the same name are the same (instead of making new items, will just increment quantity), unless have different tags
    quantity: integer
    categories: array of categories (strings) this item belongs to. These may be used as item descriptions given to the players
              - this will not be an exhaustive list, but should include the less general/more objective categories
    weight: number, how heavy it is; how much it slows the player down


Required, specified by Item class:
    owned_by: undefined or a player name
		search_coords: array of {x: "0-100%", "y: 0-100%", found_by:[player_names]} - where on the search div it's located (if the player hasn't yet found it)
							- left empty at the start, filled/updated with the method updateSearchCoords(), which matches the number of coords to the item's quantity
		n_visible_for: object (player_name: int) - how many were found by each player (a player may not have found the whole quantity)
              - Only consulted if visible is false
              - Default values are 0
              - if a value equals the quantity, the player found them all
              - when an item is taken, we subtract one from the quantity AND from counts in here if not 0 (some "take that! - you have to search again")
              - when an item is dropped, it's visible, so we increment all counts in here
          - setNVisible(int): function that sets all values in n_visible_for to the arg
                    - EACH CONSTRUCTOR MUST CALL THIS TO MAKE THE ITEM VISIBLE!!!
    a bunch of other functions, look below


Sometimes not specified:

    tags: array of strings, used to mark items with the same name as different. Optional.
              - this property is cleared when an item goes in the inventory
    size: between 1.5 and 2.5 (vh units) - how big the search target div for this item is. Only specified if not always visible
		size_focus: vh units, how big the search target div is when we focus on this item (should be larger than the size property). Only specified if not always visible
    canTake(Player): optional method, run to check if a player can take an item. Returns "yes" if they can, otherwise returns a string explaining why they can't
              - if not defined, assumed "yes"
              - arg is the player's player state object
              - if include one of these, should include a tag as well, so dropped items don't get lumped into this
    canFind(Player): optional method, run to check if a player can find this item. Returns "yes" if they can, something else if they can't
              - only specified if not visible
              - if not defined, assumed "yes"

*/


//TODO: FIX IMAGE SRC TO MAKE IT BASED ON TAGS - currently the first img src for given tags will stay


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


// Class definitions

class Item {
  constructor(){
    this.owned_by = undefined; //if a player name, implies it's in their inventory
		this.quantity = 0; //just in case a child forgets to set this, don't crash the server

		this.search_coords = [];
		this.found_search_targets = {};

    this.n_visible_for = {};
    let player_names = server.getCurrentPlayerNames();
    for(let i=0; i<player_names.length; i++){
      this.n_visible_for[player_names[i]] = 0;
    }
  }
  setNVisible(n){
    for(let name in this.n_visible_for){
      this.n_visible_for[name] = n;
    }
  }
	updateSearchCoords(){
		if(this.quantity < this.search_coords.length){
			//chop off the end
			this.search_coords.splice(this.quantity);
		}
		else if(this.quantity > this.search_coords.length){
			//add new coords
			let n_to_add = this.quantity - this.search_coords.length;
			for(let i=0; i<n_to_add; i++){
				let coord = {
					x: 5 + Math.floor(Math.random()*90) + "%",
					y: 5 + Math.floor(Math.random()*90) + "%",
					found_by: []
				};
				this.search_coords.push(coord);
			}
		}
	}
  deepCopyPropertiesTo(target){
    for(let prop in this){
      if(typeof this[prop] != "object"){
        target[prop] = this[prop];
      }
      else {
        target[prop] = deepCopy(this[prop]); //util.js
      }
    }
  }
  copy(){
    let out = new Item();
    this.deepCopyPropertiesTo(out); //copies methods too
    return out;
  }
  getInteractions(player){
    /*function returning an object {actions: [], messages: []} - arrays of strings
        - actions are stuff the player can do, messages are any information relating to the item to show the player
        - for each possible action, there needs to be a method with the same name, taking a player state as an argument
        - (will convert action name to lowercase, and replace spaces with underscores to get method name, see server.js)
    */
    let out = {actions:[], messages:[]};

    if(!this.owned_by){
      if(this.canTake){
        let result = this.canTake(player);
        if(result == "yes"){out.actions.push("Take")}
        else {out.messages.push(result)}
      }
      else {
        out.actions.push("Take");
      }
    }
    else if(player.name == this.owned_by){
      out.actions.push("Drop One");
      out.actions.push("Drop All");
    }

    out.messages.push("Weight " + this.weight);
    return out;
  }
  sameAs(item){
    if(this.name != item.name){return false;}
    if(!this.tags && !item.tags){return true;}
    if(this.tags && !item.tags){return false;}
    if(!this.tags && item.tags){return false;}
    if(this.tags.length != item.tags.length){return false;}
    //then have same name and both have a tags property that's the same length, check if tags are the same
    for(let i=0; i>this.tags.length; i++){
      if(this.tags[i] != item.tags[i]){return false;}
    }
    return true;
  }
  take(player){
    //for items the player finds in the forest
    let item = this.copy(); //methods added later not copied - that's what we want
    item.quantity = 1; //don't copy the quantity!
    item.owned_by = player.name;
    item.canTake = undefined; //after it's been taken, this item will never have a canTake function again (it's been "unlocked")
    delete item.tags; //tags only used for different functions surrounding the same item - once we take it, it's just the item
    player.give(item);

    this.quantity--;
    //take one away from visibility
    for(let name in this.n_visible_for){
      this.n_visible_for[name] = Math.max(0, this.n_visible_for[name] - 1);
    }

    //IMPORTANT: never remove items entirely (just change quantity), this way the client can use its index to reliably track it over time
  }
  drop_one(player){
    let item = this.copy();
    item.quantity = 1; //only drop one!
    item.setNVisible(item.quantity); //dropped items are pretty obvious
    item.owned_by = undefined;

    let place = server.getGame().map.places[player.location];
    place.addItem(item);
    this.quantity--; //from inventory, so no need to worry about changing n_visible_for
    console.log("dropped one!");
  }
  drop_all(player){
    let item = this.copy();
    //no need to change the quantity here, we're dropping it all
    item.setNVisible(item.quantity); //dropped items are pretty obvious
    item.owned_by = undefined;

    let place = server.getGame().map.places[player.location];
    place.addItem(item);
    this.quantity = 0; //from inventory, so no need to worry about changing n_visible_for
    console.log("dropped all!");
  }
}


class Leaf extends Item {
  constructor(species, alive, color, quantity){
    super();
    this.species = species;
    this.alive = alive;
    this.color = color;
    if(!color){this.color = alive ? "Green" : "Brown";}

    //required
    this.name = (alive ? this.color : "Dead") + " " + this.species + (species=="Pine" ? " Needle" : " Leaf");
    this.quantity = quantity;
    this.categories = [
      this.species + " Leaf",
      (alive ? "Alive" : "Dead") + " Leaf",
      "Leaf"
    ];
    this.weight = 1;
    this.setNVisible(this.quantity);
  }
}


class Pinecone extends Item {
  constructor(quantity){
    super();
    this.name = "Pinecone";
    this.quantity = quantity;
    this.categories = [
      "Seed"
    ];
    this.weight = 3;
    this.size = "2vh";
    this.size_focus = "3vh";

		let n_visible = Math.random() < 0.5 ? 0 : Math.ceil(quantity*Math.pow(Math.random(), 2)); //quadratic, more likely that fewer are visible
    this.setNVisible(n_visible);
  }
}


exports.Item = Item;
exports.Leaf = Leaf;
exports.Pinecone = Pinecone;
