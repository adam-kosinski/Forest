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
    this.location = location; //name of the player's place
    this.traveling = false;
    this.items = []; //inventory
    this.weight_thresholds = [ //if past a threshold multiply the time it takes to do actions by the multiplier. Weight range is how large this threshold is past the previous one
      {name: "Fast", color: "#aec230", multiplier: 1, weight_range: 10},
      {name: "Medium", color: "#8ba133", multiplier: 4, weight_range: 15},
      {name: "Slow", color: "#547d2a", multiplier: 8, weight_range: 10}
    ];
    //note: adding up all the weight ranges gives you the max_weight

    //below things are defined during game generation
    //this.skills = []; //skill objects

    //the more an animal trusts you, the more they will tell you / the more quests they will give. Keys are NPC animal names, values are trust level
    this.trust = {};
  }
  getTotalWeight(){
    let total_weight = 0;
    for(let i=0; i<this.items.length; i++){
      total_weight += this.items[i].weight;
      if(this.items[i].is_container){
        total_weight += this.items[i].holding.reduce((accum, item) => accum + item.weight, 0);
      }
    }
    return total_weight;
  }
  getActionDuration(base_duration){
    //base duration (ms) = duration w/o carrying items
    //returns duration in ms
    //note: rounding down at the threshold border, matching updateTotalWeight() in client's display.js

    //figure out which segment (aka threshold) we're on
    let weight = this.getTotalWeight();
    let seg = 0;
    while(weight > this.weight_thresholds[seg].weight_range && seg < this.weight_thresholds.length){
      weight -= this.weight_thresholds[seg].weight_range;
      seg++;
    }
    let multiplier = this.weight_thresholds[seg].multiplier;
    return base_duration * multiplier;
  }
  removeItem(item){
    for(let i=0; i<this.items.length; i++){
      if(this.items[i].id == item.id){
        this.items.splice(i, 1);
        return;
      }
    }
    console.log("Failed to remove item: " + item.name + ", id=" + item.id + ", couldn't find it in " + this.name + "'s inventory items");
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
    //non-redundant, easily-editable way for me to define places, processed into actual places later in the constructor
    this.place_def = {
      "Waterfall of Wisdom": {
        "The Spiral Stones": {x:89, y:126, adj:["Clifftop Pines"]},
        "Cliff": {x:235, y:176, adj:["Clifftop Pines"]},
        "Waterbase": {x:262, y:274, adj:["Cliffbase", "Log"]},
        "Cliffbase": {x:331, y:246, adj:["Waterbase", "Fern Haven", "Log"]}
      },
      "Prickly Pines": {
        "Clifftop Pines": {x:195, y:123, adj:["The Spiral Stones", "Cliff", "Cliffside Grove"]},
        "Cliffside Grove": {x:304, y:113, adj:["Clifftop Pines", "Bear Den", "Behind Bear"]},
        "Bear Den": {x:401, y:137, adj:["Cliffside Grove", "Behind Bear", "Behind Bear Right", "Redhill", "Backhill"]},
        "Behind Bear": {x:418, y:56, adj:["Cliffside Grove", "Bear Den", "Behind Bear Right"]},
        "Behind Bear Right": {x:511, y:95, adj:["Bear Den", "Behind Bear", "Backhill", "Darkhill"]},
        "Redhill": {x:424, y:197, adj:["Bear Den", "Backhill", "Fern Haven"]},
        "Backhill": {x:512, y:175, adj:["Bear Den", "Behind Bear Right", "Redhill", "Darkhill", "Fern Haven", "Misty Gloom"]},
        "Fern Haven": {x:481, y:244, adj:["Cliffbase", "Log", "Redhill", "Clearing", "Backhill"]},
        "Clearing": {x:543, y:300, adj:["Fern Haven", "River Right", "Middle", "Pine Overlook"]},
        "Sunlit Stand": {x:672, y:338, adj:["Middle", "Right Side", "Pine Overlook"]},
        "Darkhill": {x:587, y:107, adj:["Backhill", "Behind Bear Right", "The Silent Wood", "Thicket of Secrets"]},
        "The Silent Wood": {x:642, y:72, adj:["Darkhill", "Grove of Souls", "Thicket of Secrets"]},
        "Grove of Souls": {x:742, y:80, adj:["The Silent Wood"]},
        "Thicket of Secrets": {x:650, y:150, adj:["Darkhill", "The Silent Wood", "Misty Gloom"]},
        "Misty Gloom": {x:592, y:200, adj:["Thicket of Secrets", "Backhill", "Path", "Middle"]},
        "Middle": {x:617, y:274, adj:["Clearing", "Sunlit Stand", "Misty Gloom", "Path", "Right Side"]},
        "Sunset Edge": {x:765, y:188, adj:["Path", "Right Side"]},
        "Path": {x:679, y:212, adj:["Sunset Edge", "Misty Gloom", "Middle", "Right Side"]},
        "Right Side": {x:742, y:275, adj:["Path", "Middle", "Stream Top", "Sunlit Stand", "Sunset Edge"]},
        "Mountain Stream": {x:909, y:233, adj:["Stream Top"]},
        "Stream Top": {x:854, y:280, adj:["Mountain Stream", "Stream Mid", "Right Side"]},
        "Stream Mid": {x:860, y:346, adj:["Stream Top"]}
      },
      "Roaring Rapids": {
        "Log": {x:395, y:309, adj:["Waterbase", "Cliffbase", "Fern Haven", "River Right"]},
        "River Right": {x:450, y:344, adj:["Log", "Clearing"]},
        "Pine Overlook": {x:577, y:360, adj:["Clearing", "Sunlit Stand"]}
      },
      "Old Oaks": {
        "Opposite Pines": {x:846, y:403, adj:["Bottom Opp Pines"]},
        "Bottom Opp Pines": {x:763, y:434, adj:["Opposite Pines"]},
        "The Great Oak": {x:792, y:728, adj:[]}
      }
    }

    this.places = {}; //object with key = place name, value = Place object

    //process this.place_def
    for(let region in this.place_def){
      for(let place_name in this.place_def[region]){
        let info = this.place_def[region][place_name];
        let place = new Place(place_name, {x: info.x, y: info.y}, region, info.adj);
        this.places[place_name] = place;
      }
    }
  }
}


class Place {
  //note: place image files should be named place_name.jpg, spaces replaced with underscores (to be consistent with item/thing naming)

  constructor(name, pos, region, adj_place_names=[], background_position="top left"){
    //constants
    this.name = name;
    this.pos = pos; //{x:_, y:_} -unscaled coords for position on the map_zoom_div
    this.region = region; //string - name of region
    //this.background_position = background_position; //css value
    this.adj_place_names = adj_place_names; //array of strings

    //these are filled out during game generation

    this.items = []; //Item objects, see items.js - all items in a place are listed here, even the ones generated by things
    this.things = []; //Thing objects, see things.js
  }
  removeItem(item){
    for(let i=0; i<this.items.length; i++){
      if(this.items[i].id == item.id){
        this.items.splice(i, 1);
        return;
      }
    }
    console.log("Failed to remove item: " + item.name + ", id=" + item.id + ", couldn't find it in " + this.name + " items");
  }
  removeThing(thing){
    for(let i=0; i<this.things.length; i++){
      if(this.things[i].id == thing.id){
        this.things.splice(i, 1);
        return;
      }
    }
    console.log("Failed to remove thing: " + thing.name + ", id=" + thing.id + ", couldn't find it in " + this.name + " things");
  }

}




// EXPORT CLASSES SO OTHER FILES CAN USE THEM  ------------------------------------------------------------------
exports.PlayerStatus = PlayerStatus;
exports.Player = Player;
exports.Element = Element;
exports.Map = Map;
exports.Place = Place;
