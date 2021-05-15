let server = require("./server");


class PlayerStatus {
  constructor(name){
    this.name = name;
    this.connected = true; //because when we make one of these, it's triggered by a connected player
  }
}


class Player {
  constructor(name, species, location){
    this.name = name;
    this.species = species; //this influences how much certain animals trust you, as well as your skills
    this.location = location; //index of the starting place
    this.traveling = false;
    this.items = [];

    //below things are defined during game generation
    //this.skills = []; //skill objects

    //the more an animal trusts you, the more they will tell you / the more quests they will give. Keys are NPC animal names, values are trust level
    this.trust = {};
  }
  give(item){
    /*
    //used to give this player items
    //note: no need to worry about item.n_visible_for, the client inventory display ignores that and displays the full quantity always
    //check if player already has this item
    for(let i=0; i<this.items.length; i++){
      if(this.items[i].sameAs(item)){
        this.items[i].quantity++;
        return;
      }
    }
    //they don't have it, add it
    this.items.push(item);
    */
  }
}


class Element {
  constructor(tagName, id, parentId="map_overlay", className="", style={}){ //1st four args are strings, style is an object
    this.tagName = tagName;
    this.id = id;
    this.parentId = parentId; //has to be a hardcoded element in index.html
    this.className = className;
    this.style = style;
  }
}


class Map {
  constructor(){
    this.adj_matrix = [
      [0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [1,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0],
      [0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,1,0,1,0,0,0,0,0,0,1,0,1,0],
      [0,0,0,1,1,0,0,0,0,0,0,0,0,0,1,0],
      [0,1,0,0,0,0,0,1,1,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,1,0,1,1,1,0,0,0,0,0],
      [0,0,0,0,0,0,1,1,0,1,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,1,1,0,0,1,0,0,0,0],
      [0,0,0,0,0,0,0,1,0,0,0,1,1,1,0,0],
      [0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0],
      [0,0,0,0,1,0,0,0,0,0,1,0,0,1,1,0],
      [0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0],
      [0,0,0,0,1,1,0,0,0,0,0,0,1,0,0,1],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0]
    ];
    this.places = [
      new Place("The Spiral Stones", {x:89,y:126}, "Waterfall of Wisdom"),
      new Place("Clifftop Pines", {x:195,y:123}, "Prickly Pines"),
      new Place("Cliff", {x:235,y:176}, "Waterfall of Wisdom"),
      new Place("waterbase", {x:262,y:274}, "Waterfall of Wisdom"),
      new Place("cliffbase", {x:331,y:246}, "Waterfall of Wisdom"),
      new Place("waterfall river", {x:346,y:298}, "Waterfall of Wisdom"),

      new Place("Cliffside Grove", {x:304,y:113}, "Prickly Pines"),
      new Place("Bear Den", {x:401,y:137}, "Prickly Pines"),
      new Place("Behind Bear", {x:418,y:56}, "Prickly Pines"),
      new Place("Behind Bear Right", {x:511,y:95}, "Prickly Pines"),
      new Place("Redhill", {x:467,y:189}, "Prickly Pines"),
      new Place("backhill", {x:569,y:117}, "Prickly Pines"),
      new Place("hillbase", {x:453,y:252}, "Prickly Pines"),
      new Place("flowers", {x:564,y:267}, "Prickly Pines"),

      new Place("log", {x:395,y:309}, "Roaring Rapids"),
      new Place("river right", {x:450,y:344}, "Roaring Rapids")
    ];
  }
}


class Place {
  //note: place image files should be named place_name.jpg, spaces replaced with underscores (to be consistent with item/thing naming)

  constructor(name, pos, region, background_position="top left"){
    //constants
    this.name = name;
    this.pos = pos; //{x:_, y:_} -unscaled coords for position on the map_zoom_div
    this.region = region; //string - name of region
    //this.background_position = background_position; //css value

    //these are defined during game generation

    this.items = []; //objects, see items.js - all items in a place are listed here, even the ones generated by things
    this.things = []; //objects, see things.js
  }
  removeThing(id){
    for(let i=0; i<this.things.length; i++){
      if(this.things[i].id == id){
        this.things.splice(i, 1);
        return;
      }
    }
  }

}




// EXPORT CLASSES SO OTHER FILES CAN USE THEM  ------------------------------------------------------------------
exports.PlayerStatus = PlayerStatus;
exports.Player = Player;
exports.Element = Element;
exports.Map = Map;
exports.Place = Place;
