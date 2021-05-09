

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


function makeThingOrItem(object, display_quantity=0){

  let div = document.createElement("div");
  div.className = object.type + "-container";

  let circle = document.createElement("div");
  let where = object.owner == my_name ? "my" : me.location;
  circle.id = where + "-" + object.type + "-" + object.id;
  circle.className = object.type;
  let img_postfix = "";
  if(object.type == "item" && object.tags.length > 0) img_postfix = "-" + object.tags.join("-");
  circle.style.backgroundImage = "url('./static/images/" + object.type + "s/" + object.name + img_postfix + ".jpg')";
  div.appendChild(circle);

  let p = document.createElement("p");
  p.textContent = object.name;
  if(display_quantity > 0) p.textContent += " (" + display_quantity + ")";

  div.appendChild(p);
  return div;
}


function updatePlaceInfo(cannotFind={thingIds:[],itemIds:[]}){
  if(am_spectator){
    place_info.style.display = "none";
    return;
  }

  //check if traveling
  if(me.traveling){
    //check if just started, if so, animate hiding everything about this place
    if(!prev_game_obj.players[my_name].traveling){

      $(place_name_display).fadeOut(250);
      $(region_name_display).fadeOut(250);

      let things = Array.from(thing_display.children);
      let items = Array.from(item_display.children);
      let stuff = things.concat(items);
      stuff.forEach(div => {animateScale(div, "contract", function(){div.style.display = "none";})});
    }
    return; //in general don't show anything while traveling
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
  for(let i=0; i<place.things.length; i++){
    let thing = place.things[i];
    if(!thing.visible || cannotFind.thingIds.includes(thing.id)) continue;

    let div = makeThingOrItem(thing);
    thing_display.appendChild(div);
  }

  //items
  item_display.innerHTML = "";
  let processed_items = processItems(place.items, cannotFind.itemIds); //see util.js
  //only show visible items in placeInfo
  for(key in processed_items.visible){
    let item_list = processed_items.visible[key];
    let div = makeThingOrItem(item_list[0], item_list.length);
    item_display.appendChild(div);
  }


  //animate things and items
  //if new location, animate everything
  if(me.location != prev_location){
    console.log("new place");

    $(place_name_display).fadeIn(1000);
    $(region_name_display).fadeIn(1000);

    let things = Array.from(thing_display.children);
    let items = Array.from(item_display.children);
    let stuff = things.concat(items);
    stuff.forEach(element => {element.style.opacity = 0});

    let i = 0;
    let interval = setInterval(function(){
      if(i >= stuff.length){
        clearInterval(interval);
        return;
      }
      stuff[i].style.opacity = 1;
      animateScale(stuff[i], "expand");
      i++;
    }, 150);
  }
  else {
    //only animate changes for individual things/items
    //note: prev_place doesn't refer to the place we were last time, it refers to the state of where we are now, one update before

    //things


    //items
    

  /*
    //things
    //TODO

    //items
    animateIndividualItems(place.items, prev_place.items, function(i){
      let item_circle = document.getElementById(me.location + "-item-" + i);
      if(item_circle){return item_circle.parentElement;}
      else {return undefined;}
    });
  */
  }

}


function makeSearchObject(object){
  //object can be an item or thing object
  //returns a search object

  //search objects are divs that have a search target div and a content div showing the item/thing
  //normally the content div is hidden, but when the search target is clicked it expands into view in front of the search target
  //when the mouse moves off the content div, it contracts back down

  let search_object = document.createElement("div");
  search_object.id = "search_object-" + object.type + "-" + object.id;
  search_object.className = "search_object";
  search_object.style.top = object.coords.y;
  search_object.style.left = object.coords.x;

  let search_content = makeThingOrItem(object);
  search_content.classList.add("search_content");

  let search_target = document.createElement("div");
  search_target.classList.add("search_target_static");
  search_target.style.height = object.search_target_size;
  search_target.style.width = object.search_target_size;
  search_target.style.animationDelay = 3*Math.random() + "s";

  search_target.addEventListener("click",function(){
    search_content.style.display = "block"; //need to have first for the offset calcs below to work
    search_content.style.top = "0px"; //reset so we can recalculate the offsets
    search_content.style.left = "0px";

    //calculate top and left offsets of search_content to not go offscreen, ideally centering on the search_object's coords
    //doing this on every click in case the window was resized since the search_object was generated or last clicked on
    let vw = window.innerWidth/100;
    let rect = search_content.getBoundingClientRect();
    let search_rect = search_div.getBoundingClientRect();

    let top = -Math.min(2*vw + 1, (rect.y - search_rect.y) - vw); //2vw (half height) + 1px (border) to center the image circle, -1vw in 2nd option to account for blur
    let bottom_diff = (search_rect.y + search_rect.height) - (rect.y + top + rect.height) - vw; //diff from if we'd used the 'top' value so far, -vw to account for blur of search_content
    if(bottom_diff < 0) top += bottom_diff; //+= b/c we calculated bottom_diff assuming it was already offset by the previous 'top' value.
    search_content.style.top = top + "px";

    let left = -Math.min(2*vw + 1, (rect.x - search_rect.x) - vw);
    let right_diff = (search_rect.x + search_rect.width) - (rect.x + left + rect.width) - vw;
    if(right_diff < 0) left += right_diff;
    search_content.style.left = left + "px";

    //show
    search_content.classList.add("showing"); //used to decide whether to contract in events.js
    $(search_target).fadeOut(500); //in case search_content is offset b/c the screen edge and doesn't cover the search_target - wll fade back on contract
    animateScale(search_content, "expand"); //contraction handled by general mousemove handler
  });

  search_object.appendChild(search_target);
  search_object.appendChild(search_content); //lazy z-indexing by append order

  return search_object;
}





function updateSearchDiv(cannotFind={thingIds:[],itemIds:[]}, first_time=false){

  if(me.traveling){
    if(!prev_game_obj.players[my_name].traveling){
      //if just started traveling, fade out search div to show the black background
      $(search_div).fadeOut(500);
    }
    return;
  }
  $(search_div).fadeIn(500);

  let place = game_obj.map.places[me.location];
  let prev_place = prev_game_obj.map.places[me.location];

  //if first update or new location, completely reset the search div - otherwise look if there are items/things missing or added and just change those
  if(first_time || me.location != prev_game_obj.players[my_name].location){
    //background image and clear contents
    search_div.style.backgroundImage = "url('./static/images/" + place.region + "/" + place.name + ".jpg')";
    let position = "top left";
    switch(place.name){
      case "Cliffside Grove": position = "top left"; break;
      case "Bear Den": position = "center bottom"; break;
    }
    search_div.style.backgroundPosition = position;
    search_div.innerHTML = "";

    //things
    for(let i=0; i<place.things.length; i++){
      let thing = place.things[i];
      if(thing.visible || cannotFind.thingIds.includes(thing.id)) continue;

      let search_object = makeSearchObject(item);
      search_div.appendChild(search_object);
    }

    //items
    for(let i=0; i<place.items.length; i++){
      let item = place.items[i];
      if(item.visible || cannotFind.itemIds.includes(item.id)) continue;

      let search_object = makeSearchObject(item);
      search_div.appendChild(search_object);
    }
  }
  else {
    //not the first update or a new location, just check for differences from previous update

    //things
    let thing_differences = findDifferences(prev_place.things, place.things, prevCannotFind.thingIds, cannotFind.thingIds); //see util.js
    thing_differences.new.forEach(thing => {
      if(thing.visible) return;
      search_div.appendChild(makeSearchObject(thing));
    });
    thing_differences.missing.forEach(thing => {
      if(thing.visible) return;
      let search_object = document.getElementById("search_object-thing-" + thing.id);
      $(search_object).fadeOut(500, function(){search_object.parentElement.removeChild(search_object)});
    });
  }

  //items
  let item_differences = findDifferences(prev_place.items, place.items, prevCannotFind.itemIds, cannotFind.itemIds); //see util.js
  item_differences.new.forEach(item => {
    if(item.visible) return;
    search_div.appendChild(makeSearchObject(item));
  });
  item_differences.missing.forEach(item => {
    if(item.visible) return;
    let search_object = document.getElementById("search_object-item-" + item.id);
    $(search_object).fadeOut(500, function(){search_object.parentElement.removeChild(search_object)});
  });

}





function updateInventory(){
  //we'll let spectators view the inventory board, that way they can see what stuff there is to find

  inventory_items.innerHTML = "";

  if(am_spectator){
    //tell the spectator they don't have an inventory
    let h1 = document.createElement("h1");
    h1.textContent = "N/A";
    h1.style.fontSize = "15vh";
    h1.style.color = "black";
    inventory_items.appendChild(h1);
  }
  else { //not spectator

    //update items
    let processed_items = processItems(me.items); //see util.js
     //items in a player's inventory should always be visible due to the take method on the server
    if(Object.keys(processed_items.hidden).length > 0) console.error("Some inventory items hidden, processed_items:", processed_items);
    for(key in processed_items.visible){
      let item_list = processed_items.visible[key];
      let div = makeThingOrItem(item_list[0], item_list.length);
      inventory_items.appendChild(div);
    }
/*
    //animate differences
    if(getComputedStyle(inventory).display != "none"){

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
    }*/
  }
}




//function to animate an item's quantity changing

function animateIndividualItems(items, prev_items, getItemDiv){
  //items is an array of Item objects (from the server)
  //prev_items is what that array looked like last update
  //getItemDiv is a function, taking the index of the item in the array as an argument and returning the div container of the item
/*
  for(let i=0; i<items.length; i++){
    let item_div = getItemDiv(i);
    if(!item_div){continue;} //item is not visible, don't animate

    //check if more of this item here than before
    if((items[i] && !prev_items[i]) ||
        items[i].n_visible_for[my_name] > prev_items[i].n_visible_for[my_name])
    {
      //if previously none, animate the item expanding
      if(!prev_items[i] || prev_items[i].n_visible_for[my_name] == 0){
        animateScale(item_div, "expand");
      }
      else {
        //animate a duplicate image of the item expanding on top
        let circle = document.createElement("div");
        circle.className = "animator_circle";
        circle.style.backgroundImage = item_div.firstElementChild.style.backgroundImage;

        item_div.appendChild(circle);
        animateScale(circle, "expand", function(){
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
        animateScale(item_div, "contract", function(){item_div.style.display = "none";});
      }
      else {
        //animate a duplicate image of the item contracting on top
        let circle = document.createElement("div");
        circle.className = "animator_circle";
        circle.style.backgroundImage = item_div.firstElementChild.style.backgroundImage;

        item_div.appendChild(circle);
        animateScale(circle, "contract", function(){
          circle.parentElement.removeChild(circle);
        });
      }
    }

  }
*/
}






function initGameDisplay(game){
  game_obj = game; //game_obj is a global variable
  prev_game_obj = game; //originally no previous one
  me = game.players[my_name];

  game_div.style.display = "block";
  place_info.style.display = "block"; //in case we were a spectator last round and this is hidden

  let map_overlay = document.getElementById("map_overlay");
  let map_image = document.getElementById("map_image");

  //board canvas for graph lines
  let canvas = document.createElement("canvas");
  canvas.id = "map_canvas";
  let map_height = getComputedStyle(map_image).height.split("px")[0];
  let map_width = getComputedStyle(map_image).width.split("px")[0];
  canvas.width = map_width;
  canvas.style.width = map_width + "px";
  canvas.height = map_height;
  canvas.style.height = map_height + "px";
  map_overlay.appendChild(canvas);



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
    map_overlay.appendChild(node);

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


  //flashlight canvas
  let fc = flashlight_canvas; //alias
  fc.width = 500;
  fc.height = 500;
  fc.style.width = "500px";
  fc.style.height = "500px";

  let flash_ctx = fc.getContext("2d");

  flash_ctx.fillStyle = "black";
  flash_ctx.fillRect(0, 0, fc.width, fc.height);

  flash_ctx.beginPath();
  let px_radius = flashlight_radius * (window.innerHeight/100);
  flash_ctx.arc(0.5*fc.width, 0.5*fc.height, px_radius, 0, 2*Math.PI);
  flash_ctx.clip(); //now all changes will only apply to the circle we defined
  flash_ctx.clearRect(0, 0, fc.width, fc.height);


  socket.emit("getCannotFind", function(cannotFind){
    prevCannotFind = cannotFind;
    updatePlaceInfo(cannotFind); //display.js
    updateSearchDiv(cannotFind, true); //display.js
    updateInventory(); //display.js
  });
}
