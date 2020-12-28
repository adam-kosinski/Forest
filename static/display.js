
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


function updatePlaceInfo(){
  let place = map.places[me.location];

  place_name_display.textContent = place.name;
  region_name_display.textContent = place.region;


  //things
  thing_display.innerHTML = "";
  for(let i=0; i<place.things.length; i++){

    let thing = place.things[i];
    if(!thing.visible && thing.found_by && !thing.found_by.includes(my_name)) {
      continue;
    }

    let div = document.createElement("div");
    let circle = document.createElement("div");
    circle.id = me.location + "-thing-" + i;
    circle.className = "thing";
    div.appendChild(circle);
    let p = document.createElement("p");
    p.textContent = place.things[i].name;
    div.appendChild(p);
    thing_display.appendChild(div);
  }


  //items
  item_display.innerHTML = "";
  for(let i=0; i<place.items.length; i++){

    let item = place.items[i];
    if(!item.visible && item.found_by && !item.found_by.includes(my_name)) {
      continue;
    }

    let div = document.createElement("div");
    let circle = document.createElement("div");
    circle.className = "item";
    circle.id = me.location + "-item-" + i;
    div.appendChild(circle);
    let p = document.createElement("p");
    p.textContent = place.items[i].name + " (" + item.quantity + ")";
    div.appendChild(p);
    item_display.appendChild(div);
  }
}



function initGameDisplay(game){
  map = game.map; //map is a global variable
  me = game.players[my_name];

  game_div.style.display = "block";

  //board background image
  let img = document.createElement("img");
  img.id = "map_image";
  img.src = "./static/unfinished_map.jpg";
  game_board.appendChild(img);

  //board canvas for graph lines
  let canvas = document.createElement("canvas");
  canvas.id = "map_canvas";
  let map_height = getComputedStyle(img).height.split("px")[0];
  canvas.width = map_height*board_aspect_ratio;
  canvas.style.width = map_height*board_aspect_ratio + "px";
  canvas.height = map_height;
  canvas.style.height = map_height + "px";
  game_board.appendChild(canvas);



  //board graph nodes (circular divs) and lines connecting them (drawn on canvas)
  let ctx = canvas.getContext("2d");
  ctx.strokeStyle = "rgba(255, 228, 196, 0.6)"; //bisque
  ctx.lineWidth = 2;
  //iterate through adjacency matrix, without redundancies
  for(let r=0; r<map.adj_matrix.length; r++){

    //create this node
    let node = document.createElement("div");
    node.id = "node_" + r;
    node.className = "node";
    node.style.top = map.places[r].pos.y + "px";
    node.style.left = map.places[r].pos.x + "px";
    game_board.appendChild(node);

    for(let c=r+1; c<map.adj_matrix[0].length; c++){
      if(map.adj_matrix[r][c] == 1){
        ctx.beginPath();
        ctx.moveTo(map.places[r].pos.x, map.places[r].pos.y);
        ctx.lineTo(map.places[c].pos.x, map.places[c].pos.y);
        ctx.stroke();
        ctx.closePath();
      }
    }
  }


  //server tracked elements
  for(let id in game.elements){
    let data = game.elements[id];
    let element = document.createElement(data.tagName);
    element.id = data.id;
    element.className = data.className;
    for(let prop in data.style){
      element.style[prop] = data.style[prop];
    }
    document.getElementById(data.parentId).appendChild(element);
  }

  //only my token is draggable, also make it appear on top of other player tokens
  my_token = document.getElementById(my_name+"_token"); //global variable
  my_token.classList.add("draggable");
  my_token.style.zIndex = 11;


  //place info
  updatePlaceInfo(); //this file
}
