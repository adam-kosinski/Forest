
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


function makeThingOrItem(type, object, id){
  //type is "thing" or "item"

  let div = document.createElement("div");
  div.className = type + "-container";
  let circle = document.createElement("div");
  circle.id = id;
  circle.className = type;
  if(object.img_src){
    circle.style.backgroundImage = "url('./static/images/" + type + "s/" + object.img_src + "')";
  }
  div.appendChild(circle);
  let p = document.createElement("p");
  p.textContent = object.name;
  if(type == "item"){
    if(object.owned_by){
      p.textContent += " (" + object.quantity + ")";
    }
    else {
      p.textContent += " (" + object.n_visible_for[my_name] + ")";
    }
  }

  div.appendChild(p);
  return div;
}


function updatePlaceInfo(){
  if(am_spectator){
    place_info.style.display = "none";
    return;
  }

  let place = map.places[me.location];

  place_name_display.textContent = place.name;
  region_name_display.textContent = place.region;

  //background
  let url = "/static/images/";
  let position = "";
  switch(place.region.toLowerCase()){
    case "prickly pines": url += "prickly_pines.jpg"; position = "right"; break;
    case "waterfall of wisdom": url += "waterfall_of_wisdom.jpg"; position = "left"; break;
    case "roaring rapids": url += "roaring_rapids.jpg"; position = "center"; break;
  }
  place_info.style.backgroundImage = "url('" + url + "')";
  place_info.style.backgroundPosition = position;

  //things
  thing_display.innerHTML = "";
  for(let i=0; i<place.things.length; i++){
    let thing = place.things[i];
    if(!thing.visible && thing.found_by && !thing.found_by.includes(my_name)) {
      continue;
    }
    let div = makeThingOrItem("thing", thing, me.location + "-thing-" + i);
    thing_display.appendChild(div);
  }

  //items
  item_display.innerHTML = "";
  for(let i=0; i<place.items.length; i++){
    let item = place.items[i];
    if(item.n_visible_for[my_name] < 1) {
      continue;
    }
    let div = makeThingOrItem("item", item, me.location + "-item-" + i);
    item_display.appendChild(div);
  }
}



function updateInventory(){
  //we'll let spectators view the inventory board, that way they can see what stuff there is to find

  inventory_items.innerHTML = "";
  if(!am_spectator){
    for(let i=0; i<me.items.length; i++){
      let item = me.items[i];
      if(item.quantity < 1){continue;} //only check quantity, visibility is a given in your inventory
      let div = makeThingOrItem("item", item, "my-item-" + i);
      inventory_items.appendChild(div);
    }
  }
  else {
    //tell the spectator they don't have an inventory
    let h1 = document.createElement("h1");
    h1.textContent = "N/A";
    h1.style.fontSize = "15vh";
    h1.style.color = "black";
    inventory_items.appendChild(h1);
  }
}




function initGameDisplay(game){
  map = game.map; //map is a global variable
  me = game.players[my_name];

  game_div.style.display = "block";
  place_info.style.display = "block"; //in case we were a spectator last round and this is hidden

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
  if(!am_spectator){
    my_token = document.getElementById(my_name+"_token"); //global variable
    my_token.classList.add("draggable");
    my_token.style.zIndex = 11;
  }


  //place info
  updatePlaceInfo(); //see this file
  updateInventory(); //see this file
}





//show and hide opacity animations

function animateOpacity(element, show, finishFunc=undefined){
  //show = true/false, if false means hide
  let opacity = show ? 0 : 1;
  element.style.opacity = opacity;
  let interval = setInterval(function(){
    opacity += (show ? 1 : -1)*0.2;
    element.style.opacity = opacity;
    if(opacity >= 1 || opacity <= 0){
      clearInterval(interval);
      if(finishFunc){finishFunc();}
    }
  }, 20);
}

function show(element){
  element.style.display = "block";
  animateOpacity(element, true);
}

function hide(element){
  animateOpacity(element, false, function(){element.style.display = "none";});
}
