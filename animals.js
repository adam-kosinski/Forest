let server = require("./server"); //for getting the game object


//animals are classes, helps with organization. Will be different each time (constructor has lots of variation)

class Bear {
  constructor(){
    this.friendly_with = []; //player_names
  }
  talk(player, socket){
    socket.emit("hello");
  }
}



exports.Bear = Bear;
