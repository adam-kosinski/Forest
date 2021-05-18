//TODO: consolidate identical generated items


let classes = require("./classes");
let PlayerStatus = classes.PlayerStatus;
let Player = classes.Player;
let Element = classes.Element;
let Map = classes.Map;
let Place = classes.Place;

let items = require("./items");
let things = require("./things");
let animals = require("./animals");



class Game {
  constructor(player_names){

    this.players = {}; //keys are player names
    this.elements = {};  //Storage object for tracked elements. Keys are element ids, values are Element objects
    this.map = new Map();
    this.animals = {}; //animal_name: animal_object - filled below


    //add player objects
    for(let i=0; i<player_names.length; i++){
      let player = new Player(player_names[i], "squirrel", "Backhill");
      this.players[player.name] = player;

      let pos = this.map.places[player.location].pos;
      let token = new Element("div", player.name+"_token", "map_overlay", "player_token tracked", {left:pos.x+"px", top:pos.y+"px"});
      this.elements[token.id] = token;
    }


    //add animals
    for(let place_name in this.map.places){
      if(place_name == "Bear Den"){
        this.map.places[place_name].things.push(new things.BearDen());
      }
    }
    this.animals.bear = new animals.Bear();


    //iterate through places, adding things and items
    for(let place_name in this.map.places){
      let place = this.map.places[place_name];

      for(let n=0; n<5; n++) place.items.push(new items.Dirt());
      place.items.push(new items.Container("Basket", "normal", 3));

      if(place.region == "Prickly Pines"){
        //forest floor
        place.things.push(new things.ForestFloor("Prickly Pines"));
        //add trees
        let n_pine_trees = 4 - Math.floor(Math.random()*3);
        for(let n=0; n<n_pine_trees; n++){
          let tree = new things.Tree("Pine");
          place.things.push(tree);
          tree.items.forEach(item => place.items.push(item));
        }

        //add dead pine needles on the ground (done here instead of in Tree to make it uniform in the prickly pines)
        let n_dead_needles = Math.floor(Math.random()*15)+35
        for(let i=0; i<n_dead_needles; i++) place.items.push(new items.Leaf("Pine", false, "Brown"));

        //chance to have a pinecone regardless of pine trees
        if(Math.random() > 0.6){
          place.items.push(new items.Pinecone());
        }
      }
    }


  }
}



exports.Game = Game;
