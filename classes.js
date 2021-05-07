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
    this.energy = 10;
    this.max_energy = 10;
    this.location = location; //index of the starting place
    this.traveling = false;
    //this.occupied_with = undefined; //can be a thing object, used to reset things we are no longer interacting with
    this.climbed = []; //names of things this player has climbed, gets reset when moving
    this.items = [];

    //below things are defined during game generation
    this.skills = []; //skill objects
    this.active_skills = []; //names of active skills

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
      [0,1,0,0,0,0,0],
      [1,0,1,0,0,0,0],
      [0,1,0,1,0,0,0],
      [0,0,1,0,1,0,1],
      [0,0,0,1,0,1,1],
      [0,0,0,0,1,0,0],
      [0,0,0,1,1,0,0]
    ];
    this.places = [
      new Place("0", {x:89,y:126}, "Waterfall of Wisdom"),
      new Place("Cliffside Grove", {x:254,y:105}, "Prickly Pines"),
      new Place("Bear Den", {x:401,y:137}, "Prickly Pines"),
      new Place("3", {x:501,y:212}, "Prickly Pines"),
      new Place("4", {x:408,y:273}, "Prickly Pines"),
      new Place("5", {x:323,y:270}, "Waterfall of Wisdom"),
      new Place("6", {x:486,y:333}, "Prickly Pines")
    ];
  }
}


class Place {
  constructor(name, pos, region){
    //constants
    this.name = name;
    this.pos = pos; //{x:_, y:_} -unscaled coords for position on the map_zoom_div
    this.region = region; //string - name of region

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
