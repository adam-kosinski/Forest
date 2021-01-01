let items = require("./items");
let server = require("./server"); //used to get the game object


/*
"Things" are anything that can be placed at a location that is not an item. They cannot be picked up.
More things will be generated than are actually needed


Things are defined as classes, and must have the following member variables and methods:

    name: string
    items: array of item objects generated by this Thing
    visible: true/false, whether it is visible without searching
    getInteractions(Player): function returning an object {actions: [], messages: []} - arrays of strings
        - actions are stuff the player can do, messages are any information relating to the thing to show the player
        - for each possible action, there needs to be a method with the same name, taking a player state as an argument (and the socket as an optional second, if you need to emit back)
        - (will convert action name to lowercase, and replace spaces with underscores to get method name, see server.js)

Sometimes not specified:

    found_by: array of player names, who found this thing. Only specified if not visible
    p: 0-1.0, probability of finding it in a general search. Only specified if not visible
    p_focus: 0-1.0, probability of finding it when focusing on it. Only specified if not visible
    leave(Player): Optional, function to run when the player leaves this place

Experiment with later:
exclusive: true/false, assumed false if not specified. If true, once a player starts interacting with this Thing, they can't interact with
            another Thing or leave until the method disengage(Player) is called. If the Place this Thing is in sees exclusive is true, it
            will define a disengage method, so no need to write that in the class definition

*/

class Tree {
  constructor(species){
    //species is title case
    this.species = species;
    this.alive = Math.random() > 0.2;
    this.climbed_by = []; //player names, this is tree specific. player.climbed is for player-specific (used to consolidate items)
    this.climb_finds = []; //item objects, lists items that can be found if you climb this tree - see climb() for implementation

    this.name = (this.alive ? "" : "Dead ") + species + " Tree";
    this.items = [];
    this.visible = true;

    if(this.alive){
      //make some alive leaves up high
      let green_leaves = new items.Leaf(this.species, true, "Green", Math.floor(Math.random()*25)+50);
      green_leaves.tags = ["in_tree"];
      green_leaves.canTake = function(player){
        return player.climbed.includes(this.name) ? "yes" : "You need to climb a "+this.name.toLowerCase()+" to take this.";
      }.bind(this);
      this.items.push(green_leaves);

      //if pine tree, make pinecones
      if(species == "Pine"){
        //pinecones in tree
        if(Math.random() < 0.3){
          let high_pinecones = new items.Pinecone(Math.floor(Math.random()*3));
          high_pinecones.visible = false;
          high_pinecones.p = 0.1;
          high_pinecones.p_focus = 0.4; //these are hard to see from the ground
          high_pinecones.tags = ["in_tree"];
          high_pinecones.canTake = function(player){
            return player.climbed.includes(this.name) ? "yes" : "You need to climb a "+this.name.toLowerCase()+" to take this.";
          }.bind(this);
          high_pinecones.img_src = "Pine Cone Tree.jpg";
          this.items.push(high_pinecones);
          this.climb_finds.push(high_pinecones);
        }
      }
    }

    //make some dead leaves on the ground
    let dead_leaves = new items.Leaf(this.species, false, "Brown", Math.floor(Math.random()*25)+50);
    this.items.push(dead_leaves);

  }
  getInteractions(player){
    let out = {actions:[], messages:[]};
    if(this.alive && !this.climbed_by.includes(player.name)){out.actions.push("Climb")}
    if(!this.alive){
      out.messages.push(["It's dead.", "Dead as a doorknob."][Math.floor(Math.random()*2)]);
    }
    return out;
  }
  climb(player){
    player.climbed.push(this.name);
    this.climbed_by.push(player.name);

    //climb finds
    console.log("climb_finds", this.climb_finds);
    for(let i=0; i<this.climb_finds.length; i++){
      this.climb_finds[i].found_by.push(player.name);
    }

    console.log(player.name + " climbed " + this.name + "!");
  }
  leave(player){
    this.climbed_by = this.climbed_by.filter(name => name != player.name);
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


class ForestFloor {
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

    this.name = "Forest Floor";
    this.items = [];
    this.visible = true;
  }
  getInteractions(){
    return {
      actions: ["Dig"],
      messages: []
    }
  }
  dig(player){
    console.log(player.name + " dug!");
    let hole = new Hole();
    server.getGame().map.places[player.location].things.push(hole);
  }
}


class Hole {
  constructor(){
    this.name = "Hole";
    this.items = [];
    this.visible = true;
  }
  getInteractions(){
    return {
      actions: [],
      messages: ["An empty hole."]
    };
  }
}


class BearDen {
  constructor(){
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
  leave(player){
    //if all players left, and there's a dropped item the bear wants that the player left, bear will become friendly with them
    //maybe some time needs to elapse?
  }
}


exports.Tree = Tree;
exports.ForestFloor = ForestFloor;
exports.Hole = Hole;
exports.BearDen = BearDen;
