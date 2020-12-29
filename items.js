/*
"Items" are collected as part of the scavenger hunt
This is not to be confused with "things," which is everything else that can be placed at a location
Also, only items (not things) can be picked up by players

Only a subset of items will be used for each hunt, but many other unused items also be placed in the forest
Items are generated by places, or by things located in a place

Items are defined as classes, with lots of variations.
Each class is required to have the below member variables and methods

    name: string, assumed that items with the same name are the same (instead of making new items, will just increment quantity), unless have different tags
    quantity: integer
    categories: array of categories (strings) this item belongs to. These may be used as item descriptions given to the players
              - this will not be an exhaustive list, but should include the less general/more objective categories
    weight: number, how heavy it is; how much it slows the player down
    visible: true/false, whether it is visible without searching
    getInteractions(Player): function returning an object {actions: [], messages: []} - arrays of strings
        - actions are stuff the player can do, messages are any information relating to the item to show the player
        - for each possible action, there needs to be a method with the same name, taking a player state as an argument
        - (will convert action name to lowercase, and replace spaces with underscores to get method name, see server.js)

Sometimes not specified:

    tags: array of strings, used to mark items with the same name as different. Optional.
    found_by: array of player names, who found this item. Only specified if not visible
    p: 0-1.0, probability of finding it in a general search. Only specified if not visible
    p_focus: 0-1.0, probability of finding it when focusing on it. Only specified if not visible
    canTake(Player): optional method, run to check if a player can take an item. Returns "yes" if they can, otherwise returns a string explaining why they can't
              - if not defined, assumed "yes"
              - arg is the player's player state object
    canFind(Player): optional method, run to check if a player can find this item. Returns "yes" if they can, something else if they can't
              - only specified if not visible
              - if not defined, assumed "yes"
*/



class Item {
  constructor(){}
  getInteractions(player){
    let out = {actions:[], messages:[]};
    if(this.canTake){
      let result = this.canTake(player);
      if(result == "yes"){out.actions.push("Take")}
      else {out.messages.push(result)}
    }
    else {
      out.actions.push("Take");
    }
    messages.push("Weight " + this.weight);
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
    this.visible = true; //may change
  }
  take(player){
    //for items the player finds in the forest
    player.give(new Leaf(this.species, this.alive, this.color, 1));
    this.quantity--;
    console.log(player.name, player.items);
  }
}

exports.Leaf = Leaf;