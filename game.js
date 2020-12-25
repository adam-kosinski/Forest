let classes = require("./classes");
let PlayerStatus = classes.PlayerStatus;
let Player = classes.Player;
let Skill = classes.Skill;
let Element = classes.Element;
let Map = classes.Map;
let Place = classes.Place;
let Discovery = classes.Discovery;
let Knowledge = classes.Knowledge;
let Quest = classes.Quest;



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
  }
}



exports.Game = Game;
