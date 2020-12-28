
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
    this.location = location; //id of the starting place

    //below things are defined during game generation
    this.skills = []; //skill objects
    this.active_skills = []; //names of active skills

    //the more an animal trusts you, the more they will tell you / the more quests they will give. Keys are NPC animal names, values are trust level
    this.trust = {};

    //not sure if fear is useful?
    this.fear = {};
  }
}

class Skill {
  constructor(name, energy, description){
    this.name = name;
    this.energy = energy;
    this.description = description;
  }
}


class Element {
  constructor(tagName, id, parentId="game_board", className="", style={}){ //1st four args are strings, style is an object
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
      new Place("0", {x:89,y:126}, "Roaring Rapids"),
      new Place("1", {x:254,y:105}, "Prickly Pines"),
      new Place("2", {x:401,y:137}, "Prickly Pines"),
      new Place("3", {x:501,y:212}, "Prickly Pines"),
      new Place("4", {x:408,y:273}, "Prickly Pines"),
      new Place("5", {x:323,y:270}, "Roaring Rapids"),
      new Place("6", {x:486,y:333}, "Prickly Pines")
    ];
  }
}


class Place {
  constructor(name, pos, region, animal=undefined){
    //constants
    this.name = name;
    this.pos = pos; //{x:_, y:_} -unscaled coords for position on the game_board
    this.region = region; //string - name of region
    this.animal = animal; //who lives here, undefined if no one

    //these are defined during game generation

    this.items = []; //objects, see items.js
    this.things = []; //objects, see things.js

    this.knowledge = []; //Potential knowledge to learn here, from talking - only if animals live here
    this.quests = []; //Potential quests to get here - only if animals live here
  }
  search(player, focus=undefined){
    //player: Player object of the searching player
    //focus: string, name of item to search for specifically. Having a focus reduces search time and increases chances of finding that item
  }
}

class Knowledge {
  constructor(){

  }
}

class Quest {
  constructor(){

  }
}



// EXPORT CLASSES SO OTHER FILES CAN USE THEM  ------------------------------------------------------------------
exports.PlayerStatus = PlayerStatus;
exports.Player = Player;
exports.Skill = Skill;
exports.Element = Element;
exports.Map = Map;
exports.Place = Place;
exports.Knowledge = Knowledge;
exports.Quest = Quest;
