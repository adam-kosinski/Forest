let items = require("./items");
let server = require("./server"); //used to get the game object


/*
"Things" are anything that can be placed at a location that is not an item. They cannot be picked up.
More things will be generated than are actually needed

Image used for an thing must be titled: thingname.jpg OR thingname-postfix.jpg


Things are defined as classes, and must have the following member variables and methods:

    name: string
    type: "thing"
    items: array of item objects generated by this Thing
    visible: true/false, whether it is visible without searching
    getInteractions(Player): function returning an object {actions: [], messages: []} - arrays of strings
        - actions are stuff the player can do, messages are any information relating to the thing to show the player
        - for each possible action, there needs to be a method with the same name, taking a player state as an argument (and the socket as an optional second, if you need to emit back)
        - (will convert action name to lowercase, and replace spaces with underscores to get method name, see server.js)

Sometimes not specified:

    img_postfixes: object (playername: string) - postfixes to put on the image src name after the thing's name
        - Similar to an Item's tags, but these are per-player
        - Purely visual usage - can show different pictures of the same Thing depending on the player
        - e.g. if climbed a tree or not
    found_by: array of player names, who found this thing. Only specified if not visible
    p: 0-1.0, probability of finding it in a general search. Only specified if not visible
    leave(Player): Optional, function to run when the player leaves this place

Experiment with later:
exclusive: true/false, assumed false if not specified. If true, once a player starts interacting with this Thing, they can't interact with
            another Thing or leave until the method disengage(Player) is called. If the Place this Thing is in sees exclusive is true, it
            will define a disengage method, so no need to write that in the class definition

*/


//parent class for all Things
class Thing {
  constructor(){
    //set default values
    this.name = "no name";
    this.type = "thing";
    this.items = [];
    this.visible = true;
  }
  getInteractions(player){
    return {actions:[], messages:[]};
  }
}



class Tree extends Thing {
  constructor(species){
    //species is title case

    super();
    this.species = species;
    this.alive = Math.random() > 0.2;
    this.climbed_by = []; //player names, this is tree specific. player.climbed is for player-specific (used to consolidate items)
    this.climb_finds = []; //item objects, lists items that can be found if you climb this tree - see climb() for implementation
    this.img_postfixes = {};

    this.name = (this.alive ? "" : "Dead ") + species + " Tree";
    this.visible = true;

    if(this.alive){
      //make some alive leaves up high
      let green_leaves = new items.Leaf(this.species, true, "Green", Math.floor(Math.random()*25)+50);
      green_leaves.addTag("in_tree");
      green_leaves.canTake = function(player){
        return player.climbed.includes(this.name) ? "yes" : "You need to climb a "+this.name.toLowerCase()+" to take this.";
      }.bind(this);
      this.items.push(green_leaves);

      //if pine tree, make pinecones
      if(species == "Pine"){
        //pinecones in tree
        if(Math.random() < 0.3){
          let high_pinecones = new items.Pinecone(Math.ceil(Math.random()*2));
          high_pinecones.size = "1.5vh";
          high_pinecones.size_focus = "2vh"; //high pinecones are hard to see from the ground compared to normal (fallen) pinecones
          high_pinecones.addTag("in_tree");
          high_pinecones.canTake = function(player){
            return player.climbed.includes(this.name) ? "yes" : "You need to climb a "+this.name.toLowerCase()+" to take this.";
          }.bind(this);
          //high_pinecones.setNVisible(0); //can't see from ground
          this.items.push(high_pinecones);
          this.climb_finds.push(high_pinecones);
        }
        //pinecones on the ground
        if(Math.random() < 0.7){
          let ground_pinecones = new items.Pinecone(Math.ceil(Math.random()*3));
          this.items.push(ground_pinecones);
        }
      }
    }

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
    this.img_postfixes[player.name] = "climbed";

    //climb finds
    /*
    for(let i=0; i<this.climb_finds.length; i++){
      let item = this.climb_finds[i];
      item.n_visible_for[player.name] = item.quantity;
    }
    */

    console.log(player.name + " climbed " + this.name + "!");
  }
  leave(player){
    this.climbed_by = this.climbed_by.filter(name => name != player.name);
    delete this.img_postfixes[player.name];
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

    this.img_postfixes = {};
    server.getCurrentPlayerNames().forEach(name => {this.img_postfixes[name] = region});
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


class Hole extends Thing {
  constructor(){
    super();
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
  leave(player){
    //if all players left, and there's a dropped item the bear wants that the player left, bear will become friendly with them
    //maybe some time needs to elapse?
  }
}


exports.Tree = Tree;
exports.ForestFloor = ForestFloor;
exports.Hole = Hole;
exports.BearDen = BearDen;
