
class PlayerStatus {
  constructor(name){
    this.name = name;
    this.connected = true; //because when we make one of these, it's triggered by a connected player
  }
}

class Game {
  constructor(){

    //Storage object for tracked elements. Keys are element ids, values are Element objects
    this.elements = {};
  }
}


class Element {
  constructor(tagName, id, parentId="game_board", className="", style={}){ //1st four args are strings, style is an object
    this.tagName = tagName;
    this.id = id;
    this.parentId = parentId; //has to be a hardcoded element in index.html
    this.className = className;
    this.style = style;
  }
}

exports.PlayerStatus = PlayerStatus;
exports.Game = Game;
exports.Element = Element;
