
class Player {
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
  constructor(tagName, id, className="", style={}){ //1st three args are strings, style is an object
    this.tagName = tagName;
    this.id = id;
    this.className = className;
    this.style = style;
  }
}

exports.Player = Player;
exports.Game = Game;
exports.Element = Element;
