
class PlayerStatus {
  constructor(name){
    this.name = name;
    this.connected = true; //because when we make one of these, it's triggered by a connected player
  }
}

class Game {
  constructor(player_names){

    this.players = {}; //keys are player names

    //Storage object for tracked elements. Keys are element ids, values are Element objects
    this.elements = {};
    this.map = new Map();
  }
}

class Player {
  constructor(name, species){
    this.name = name;
    this.species = species; //this influences how much certain animals trust you, as well as your skills
    this.energy = 10;
    this.max_energy = 10;

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
    this.adj_matrix = [];
    this.places = [];
  }
}


class Place {
  constructor(name, pos, region, animal){
    //constants
    this.name = name;
    this.pos = pos; //{x:_, y:_} -unscaled coords for position on the game_board
    this.region = region; //string - name of region
    this.animal = animal; //who lives here, undefined if no one

    //these are defined during game generation
    this.discoveries = []; //Potential discoveries to be made here, either by searching or just being there. List can change over time
    this.knowledge = []; //Potential knowledge to learn here, from talking - only if animals live here
    this.quests = []; //Potential quests to get here - only if animals live here
  }
}

class Discovery {
  constructor(){

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
exports.Game = Game;
exports.Player = Player;
exports.Skill = Skill;
exports.Element = Element;
exports.Map = Map;
exports.Place = Place;
exports.Discovery = Discovery;
exports.Knowledge = Knowledge;
exports.Quest = Quest;
