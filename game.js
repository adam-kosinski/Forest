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



class Game {
  constructor(player_names){

    this.players = {}; //keys are player names
    this.elements = {};  //Storage object for tracked elements. Keys are element ids, values are Element objects
    this.map = new Map();

    //fill out players
    for(let i=0; i<player_names.length; i++){
      let player = new Player(player_names[i], "squirrel", 1);
      this.players[player.name] = player;

      let pos = this.map.places[player.location].pos;
      let token = new Element("div", player.name+"_token", "game_board", "player_token tracked", {left:pos.x+"px", top:pos.y+"px"});
      this.elements[token.id] = token;
    }

    //add trees
    for(let i=0; i<this.map.places.length; i++){
      let place = this.map.places[i];

      if(place.region == "Prickly Pines"){
        let n_pine_trees = Math.ceil(Math.random()*3);
        for(let n=0; n<n_pine_trees; n++){
          let tree = new things.Tree("Pine");
          place.things.push(tree);
          place.items = place.items.concat(tree.items);
        }
      }
    }

    /*
    let tree = new things.Tree("oak");
    let p = this.players[player_names[0]];

    console.log("can take", tree.items[0].canTake(p));
    tree.climb_up(p);
    console.log(tree);
    console.log("can take", tree.items[0].canTake(p));
    tree.climb_down(p);
    console.log(tree);
    */
  }
}



exports.Game = Game;
