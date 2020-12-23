
function updateClientElement(data){
  //some other client updated an element, need to update that here
  let element = document.getElementById(data.id);

  if(!element){
    console.warn("Couldn't find element to update, id = '" + data.id + "'");
  }
  else {
    //update it
    if(data.className){
      element.className = data.className;
    }
    for(let prop in data.style){
      element.style[prop] = data.style[prop];
    }
  }
}




function initGameDisplay(game){

  game_div.style.display = "block";

  //board background image
  let img = document.createElement("img");
  img.src = "./static/unfinished_map.jpg";
  img.id = "map_image";
  game_board.appendChild(img);


  //debug
  game_board.appendChild(document.getElementById("test"));
}
