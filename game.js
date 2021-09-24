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
const {performance} = require("perf_hooks");


class Game {
  constructor(player_names){

    this.players = {}; //keys are player names
    this.elements = {};  //Storage object for tracked elements. Keys are element ids, values are Element objects
    this.map = new Map();
    this.animals = {}; //animal_name: animal_object - filled below

    this.duration = 420; //sec
    this.start_time = performance.now() / 1000; //sec
    this.time_left = this.duration;
    let timer_id = setInterval(function(){
      this.time_left = Math.max(0, this.duration - (performance.now()/1000 - this.start_time));
    }.bind(this), 100);

    this.clearTimerInterval = function(){clearInterval(timer_id);}

    //add player objects
    for(let i=0; i<player_names.length; i++){
      let player = new Player(player_names[i], "squirrel", "Path");
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

      //rocks
      if(Math.random() < 0.75){
        let n_rocks = Math.ceil(Math.random()*5);
        for(let i=0; i<n_rocks; i++){
          place.items.push(new items.Rock());
        }
      }

      switch(place.region){
        case "Prickly Pines":
          //forest floor
          place.things.push(new things.ForestFloor("Prickly Pines"));
          //add trees
          let n_pine_trees = 4 - Math.floor(Math.random()*3);
          for(let n=0; n<n_pine_trees; n++){
            let pine = new things.Tree("Pine");
            place.things.push(pine);
            pine.items.forEach(item => place.items.push(item));
          }
          //add dead pine needles on the ground (done here instead of in Tree to make it uniform in the prickly pines)
          let n_dead_needles = Math.floor(Math.random()*15)+35
          for(let i=0; i<n_dead_needles; i++) place.items.push(new items.Leaf("Pine", false, "Brown"));

          //chance to have a pinecone regardless of pine trees
          if(Math.random() > 0.6){
            place.items.push(new items.Pinecone());
          }
        break;
        case "Roaring Rapids":
          //pebbles
          /*
          let n_pebbles = 15 + Math.floor(Math.random()*10);
          for(let i=0; i<n_pebbles; i++){
            place.items.push(new items.Pebble());
          }
          */
        break;
      }
    }


  }
  end(){
    this.clearTimerInterval(); //method defined in the constructor, where the timer interval was set up
  }
}



exports.Game = Game;
