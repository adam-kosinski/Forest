//TODO: consolidate identical generated items


let classes = require("./classes");
let PlayerStatus = classes.PlayerStatus;
let Player = classes.Player;
let Skill = classes.Skill;
let Element = classes.Element;
let Map = classes.Map;
let Place = classes.Place;
let Knowledge = classes.Knowledge;
let Quest = classes.Quest;

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
      let player = new Player(player_names[i], "squirrel", 1);
      this.players[player.name] = player;

      let pos = this.map.places[player.location].pos;
      let token = new Element("div", player.name+"_token", "map_overlay", "player_token tracked", {left:pos.x+"px", top:pos.y+"px"});
      this.elements[token.id] = token;
    }


    //add animals
    for(let i=0; i<this.map.places.length; i++){
      if(this.map.places[i].name == "Bear Den"){
        this.map.places[i].things.push(new things.BearDen());
      }
    }
    this.animals.bear = new animals.Bear();


    //iterate through places, adding things
    for(let i=0; i<this.map.places.length; i++){
      let place = this.map.places[i];

      if(place.region == "Prickly Pines"){
        //forest floor
        place.things.push(new things.ForestFloor("Prickly Pines"));
        //add trees
        let n_pine_trees = Math.ceil(Math.random()*3);
        for(let n=0; n<n_pine_trees; n++){
          let tree = new things.Tree("Pine");
          place.things.push(tree);
          tree.items.forEach(item => place.addItem(item));
        }

        //add dead pine needles on the ground (done here instead of in Tree to make it uniform in the prickly pines)
        let dead_leaves = new items.Leaf("Pine", false, "Brown", Math.floor(Math.random()*25)+50);
        place.addItem(dead_leaves);

        //chance to have a pinecone regardless of pine trees
        if(Math.random() > 0.6){
          place.addItem(new items.Pinecone(1));
        }
      }
    }

  }
}



exports.Game = Game;
