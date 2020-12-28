let items = require("./items");

/*
"Things" are anything that can be placed at a location that is not an item. They cannot be picked up.
More things will be generated than are actually needed


Things are defined as classes, and must have the following member variables and methods:

name: string
actions: array of strings, names of actions a player can take involving this Thing
          - for each action, there needs to be a method with the same name, taking a player state as an argument (will replace spaces with underscores to get method name)
items: array of item objects generated by this Thing
visible: true/false, whether it is visible without searching
found_by: array of player names, who found this thing. Only specified if not visible
p: 0-1.0, probability of finding it in a general search. Only specified if not visible
p_focus: 0-1.0, probability of finding it when focusing on it. Only specified if not visible

Experiment with later:
exclusive: true/false, assumed false if not specified. If true, once a player starts interacting with this Thing, they can't interact with
            another Thing or leave until the method disengage(Player) is called. If the Place this Thing is in sees exclusive is true, it
            will define a disengage method, so no need to write that in the class definition

*/

class Tree {
  constructor(species){
    this.name = species + " Tree";
    this.actions = ["Climb Up", "Climb Down"];
    this.items = [];
    this.visible = true;

    this.species = species;
    this.items_on_top = {};
    this.climbed_by = []; //array of player names who are currently in this tree
    this.alive = Math.random() > 0.2;


    if(this.alive){
      //make some alive leaves
      let green_leaves = new items.Leaf(this.species, true, "Green", 100);
      green_leaves.canTake = function(player){
        return this.climbed_by.includes(player.name) ? "yes" : "You need to climb the tree to take this.";
      }.bind(this);
      this.items.push(green_leaves);
      console.log(green_leaves);
    }

    //make some dead leaves
    let dead_leaves = new items.Leaf(this.species, false, "Brown", 100);
    this.items.push(dead_leaves);

  }
  climb_up(player){
    this.climbed_by.push(player.name);
    console.log(player.name + " climbed " + this.name + "!");
  }
  climb_down(player){
    this.climbed_by = this.climbed_by.filter(name => name != player.name);
    console.log(player.name + " climbed down from " + this.name + "!");
  }
}

/*
alive_tree = {
  climbed: false

  //can make alive leaves that are visible from the ground but that require climbing to access
  //same thing with nuts, fruits
  //occasionally green leaves also on the ground
  //more commonly nuts on the ground
  //also lots of dead leaves on the ground, really easy to access
  //bark on the tree, not sure about accessing it
  //
}
*/

exports.Tree = Tree;
