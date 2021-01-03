
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
  let img_postfix = "";
  if(type == "item"){img_postfix += object.tags ? "-"+object.tags.join("-") : "";}
  if(type == "thing" && object.img_postfixes){img_postfix += object.img_postfixes[my_name] ? "-"+object.img_postfixes[my_name] : "";}
  circle.style.backgroundImage = "url('./static/images/" + type + "s/" + object.name + img_postfix + ".jpg')";
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

  let place = game_obj.map.places[me.location];
  let prev_place = prev_game_obj.map.places[me.location]; //for animations
  let prev_location = prev_game_obj.players[my_name].location;

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
  let things = []; //for animation later
  for(let i=0; i<place.things.length; i++){
    let thing = place.things[i];
    if(!thing.visible && thing.found_by && !thing.found_by.includes(my_name)) {
      continue;
    }
    let div = makeThingOrItem("thing", thing, me.location + "-thing-" + i);
    thing_display.appendChild(div);
    things.push(div);
  }

  //items
  item_display.innerHTML = "";
  let items = []; //for animation later
  for(let i=0; i<place.items.length; i++){
    let item = place.items[i];
    let prev_item = prev_place.items[i];
    if(item.n_visible_for[my_name] <= 0 && (!prev_item || prev_item.n_visible_for[my_name] <= 0)) {
      continue; //still make item if it was just removed
    }
    let div = makeThingOrItem("item", item, me.location + "-item-" + i);
    item_display.appendChild(div);
    items.push(div);
  }


  //animate things and items
  //if new location, animate everything
  if(me.location != prev_location){
    console.log("new place");
    let stuff = things.concat(items);
    stuff.forEach(element => {element.style.opacity = 0});

    let i = 0;
    let interval = setInterval(function(){
      if(i >= stuff.length){
        clearInterval(interval);
        return;
      }
      stuff[i].style.opacity = 1;
      animateScale(stuff[i], true);
      i++;
    }, 150);
  }
  else {
    //only animate changes for individual things/items
    //note: prev_place doesn't refer to the place we were last time, it refers to the state of where we are now, one update before

    //things
    //TODO

    //items
    animateIndividualItems(place.items, prev_place.items, function(i){
      let item_circle = document.getElementById(me.location + "-item-" + i);
      if(item_circle){return item_circle.parentElement;}
      else {return undefined;}
    });

  }
}



function updateInventory(){
  //we'll let spectators view the inventory board, that way they can see what stuff there is to find

  inventory_items.innerHTML = "";
  if(!am_spectator){
    for(let i=0; i<me.items.length; i++){
      let item = me.items[i];
      let prev_item = prev_game_obj.players[my_name].items[i];

      if(item.quantity <= 0 && (!prev_item || prev_item.quantity <= 0)){continue;} //only check quantity, visibility is a given in your inventory
      //also still show items that are removed via animation (the second check)

      let div = makeThingOrItem("item", item, "my-item-" + i);
      inventory_items.appendChild(div);
    }

    //animate differences

    let items = me.items;
    let prev_items = prev_game_obj.players[my_name].items;
    //update n_visible_for, since the animation function checks that, not quantity
    items.forEach(item => {item.n_visible_for[my_name] = item.quantity});
    prev_items.forEach(item => {item.n_visible_for[my_name] = item.quantity});

    animateIndividualItems(items, prev_items, function(i){
      let item_circle = document.getElementById("my-item-" + i);
      if(item_circle){return item_circle.parentElement;}
      else {return undefined;}
    });
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





function animateIndividualItems(items, prev_items, getItemDiv){
  //items is an array of Item objects (from the server)
  //prev_items is what that array looked like last update
  //getItemDiv is a function, taking the index of the item in the array as an argument and returning the div container of the item

  for(let i=0; i<items.length; i++){
    let item_div = getItemDiv(i);
    if(!item_div){continue;} //item is not visible, don't animate

    //check if more of this item here than before
    if((items[i] && !prev_items[i]) ||
        items[i].n_visible_for[my_name] > prev_items[i].n_visible_for[my_name])
    {
      //if previously none, animate the item expanding
      if(!prev_items[i] || prev_items[i].n_visible_for[my_name] == 0){
        animateScale(item_div, true);
      }
      else {
        //animate a duplicate image of the item expanding on top
        let circle = document.createElement("div");
        circle.className = "animator_circle";
        circle.style.backgroundImage = item_div.firstElementChild.style.backgroundImage;

        item_div.appendChild(circle);
        animateScale(circle, true, function(){
          circle.parentElement.removeChild(circle);
        });
      }
    }
    //check if fewer of this item here than before
    else if((!items[i] && prev_items[i]) ||
              items[i].n_visible_for[my_name] < prev_items[i].n_visible_for[my_name])
    {
      //if no more here, animate the item contracting then change display to none
      if(!items[i] || items[i].n_visible_for[my_name] == 0){
        animateScale(item_div, false, function(){item_div.style.display = "none";});
      }
      else {
        //animate a duplicate image of the item contracting on top
        let circle = document.createElement("div");
        circle.className = "animator_circle";
        circle.style.backgroundImage = item_div.firstElementChild.style.backgroundImage;
        
        item_div.appendChild(circle);
        animateScale(circle, false, function(){
          circle.parentElement.removeChild(circle);
        });
      }
    }

  }

}






function initGameDisplay(game){
  game_obj = game; //game_obj is a global variable
  prev_game_obj = game; //originally no previous one
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
  for(let r=0; r<game_obj.map.adj_matrix.length; r++){

    //create this node
    let node = document.createElement("div");
    node.id = "node_" + r;
    node.className = "node";
    node.style.top = game_obj.map.places[r].pos.y + "px";
    node.style.left = game_obj.map.places[r].pos.x + "px";
    game_board.appendChild(node);

    for(let c=r+1; c<game_obj.map.adj_matrix[0].length; c++){
      if(game_obj.map.adj_matrix[r][c] == 1){
        ctx.beginPath();
        ctx.moveTo(game_obj.map.places[r].pos.x, game_obj.map.places[r].pos.y);
        ctx.lineTo(game_obj.map.places[c].pos.x, game_obj.map.places[c].pos.y);
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


//pop animations for items and things

function animateScale(element, expand=true, finishFunc=function(){}){
  let handleAnimationEnd = function(){
    element.removeEventListener("animationend", handleAnimationEnd);
    element.classList.remove("expand");
    element.classList.remove("contract");
    finishFunc();
  }
  element.addEventListener("animationend", handleAnimationEnd);
  element.classList.add(expand ? "expand" : "contract");
}
