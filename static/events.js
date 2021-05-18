document.addEventListener("click", handleClick);
document.addEventListener("mousedown", handleMousedown);
document.addEventListener("mousemove", handleMousemove);
document.addEventListener("mouseup", handleMouseup);
document.addEventListener("mousewheel", handleMousewheel);

document.addEventListener("contextmenu", handleContextmenu);
document.addEventListener("keypress", handleKeypress);
document.addEventListener("keydown", handleKeydown);
window.addEventListener("resize", handleWindowResize);


//note: custom prompt/alert events are handled in util.js, where the rest of the prompt/alert code is


let drag_element; //undefined means not currently dragging (same for next two)
let drag_offset_start; // {top: y, left: x} -what the element's offsets were at drag start
let drag_mouse_start; // {x: pageX, y: pageY} - what the mouse's coords were at drag start
let drag_place; //place name of node we're "over" (near), undefined if none

let map_zoom_div_scale = 1; //bigger is more zoomed in



function handleClick(e){
  if(elementPartOf(e.target, start_button)){
    socket.emit("start_game");
  }
  if(e.button == 0){ //left click
    if(getComputedStyle(contextmenu).display == "block"){
      hide(contextmenu);
    }
  }
  console.log(e.offsetX, e.offsetY);
  //note: when the contextmenu is generated, click event handlers for each menu item are attached individually, so we don't handle that here
}


function handleMousedown(e){

  if(e.target.tagName !== "INPUT"){
    e.preventDefault(); //otherwise computer complains about you trying to drag the background image
  }

  // drag and drop
  //if it's part of the map_zoom_div but not draggable, drag the map_zoom_div
  let drag_target = e.target;
  if(elementPartOf(e.target, map_zoom_div) && !e.target.classList.contains("draggable")){ //util.js
    drag_target = map_zoom_div;
  }

  if(drag_target.classList.contains("draggable")){
    drag_element = drag_target;
    let style = getComputedStyle(drag_element);
    drag_offset_start = {
      top: Number(style.top.split("px")[0]),
      left: Number(style.left.split("px")[0])
    };
    drag_mouse_start = {
      x: e.pageX,
      y: e.pageY
    };

    //find adjacent places so we know if player is allowed to go there
    if(!am_spectator){
      adj_places = game_obj.map.places[me.location].adj_place_names.slice(); //shallow copy just in case
    }
  }

}

function handleMousemove(e){
  //drag and drop ----------------------
  if(drag_element){
    let m_offset_y = e.pageY - drag_mouse_start.y;
    let m_offset_x = e.pageX - drag_mouse_start.x;

    if(drag_element != map_zoom_div && elementPartOf(drag_element, map_zoom_div)){
      //account for zoom
      m_offset_y /= map_zoom_div_scale;
      m_offset_x /= map_zoom_div_scale;
    }

    if(e.clientY > 0 && e.clientY < window.innerHeight){
      drag_element.style.top = drag_offset_start.top + m_offset_y + "px";
    }
    if(e.clientX > 0 && e.clientX < window.innerWidth){
      drag_element.style.left = drag_offset_start.left + m_offset_x + "px";
    }
    if(drag_element.classList.contains("tracked")){
      updateServerElement(drag_element,"top","left"); //client.js
    }

    //if dragging my token, show if over my location or an adjacent one
    if(my_token && drag_element == my_token){
      let style = getComputedStyle(my_token);
      let x = Number(style.left.split("px")[0]);
      let y = Number(style.top.split("px")[0]);
      //my location node
      let my_place = game_obj.map.places[me.location].pos;
      if(Math.hypot(x-my_place.x, y-my_place.y) <= place_radius){
        document.getElementById("node_"+me.location).style.boxShadow = "0 0 10px 5px white";
        drag_place = me.location;
      }
      else {
        document.getElementById("node_"+me.location).style.boxShadow = "none";
        drag_place = undefined;

        //adjacent nodes - do inside the else so that my location gets priority in case of overlap
        //first clear styling, then stop at the first location I'm at (in case of overlap)
        for(let i=0; i<adj_places.length; i++){
          document.getElementById("node_"+adj_places[i]).style.boxShadow = "none";
        }
        for(let i=0; i<adj_places.length; i++){
          let node_pos = game_obj.map.places[adj_places[i]].pos;
          if(Math.hypot(x-node_pos.x, y-node_pos.y) <= place_radius){
            document.getElementById("node_"+adj_places[i]).style.boxShadow = "0 0 10px 5px yellow";
            drag_place = adj_places[i];
            break;
          }
        }
      }
    }

  }


    //search_object search_content div contraction when mouse not on the search_object or contextmenu
    let search_contents = search_div.getElementsByClassName("search_content");
    for(let i=0; i<search_contents.length; i++){
      //check if display is block, implies it's expanded
      if(search_contents[i].classList.contains("showing")){
        if(!elementPartOf(e.target, search_contents[i].parentElement) && !elementPartOf(e.target, contextmenu)){
          //contract
          search_contents[i].classList.remove("showing");
          $(search_contents[i].parentElement.firstElementChild).fadeIn(500); //fade search_target back in
          animateScale(search_contents[i], "contract", function(){search_contents[i].style.display = "none"});
          hide(contextmenu); //if it was open, it was for this item/thing
        }
      }
    }

  //flashlight
  //NOTE: flashlight no longer located in search_div
  /*if(getComputedStyle(search_div).display == "block"){
    let search_box = search_div.getBoundingClientRect();
    let offset_x = e.clientX - search_box.x;
    let offset_y = e.clientY - search_box.y;
    flashlight_canvas.style.left = offset_x + "px";
    flashlight_canvas.style.top = offset_y + "px";
  }*/
}

function handleMouseup(e){

  //drag and drop ---------------------

  if(my_token && drag_element == my_token){
    //check if invalid drag
    if(drag_place == undefined){
      //reset to initial position
      drag_element.style.left = drag_offset_start.left + "px";
      drag_element.style.top = drag_offset_start.top + "px";
      updateServerElement(my_token, "left", "top");
    }
    else {
      //tell the server we're at a new position
      if(drag_place != me.location){
        socket.emit("walk", drag_place);
      }
    }
  }
  drag_element = undefined;
  drag_offset_start = undefined;
  drag_mouse_start = undefined;
  drag_place = undefined;

  //clear node highlighting
  let nodes = document.getElementsByClassName("node");
  for(let i=0; i<nodes.length; i++){
    nodes[i].style.boxShadow = "none";
  }
}



function handleMousewheel(e){

  //gameboard zooming
  //check if the target is the gameboard, or a child of the gameboard, or a child of a child of the gameboard, etc
  if(elementPartOf(e.target, map_zoom_div)){ //util.js
    //get initial position
    let style = getComputedStyle(map_zoom_div);
    let left = Number(style.left.split("px")[0]);
    let top = Number(style.top.split("px")[0]);

    //get mouse offset, in unscaled px
    let rect = map_zoom_div.getBoundingClientRect();
    let m_offset_x = (e.clientX-rect.x)/map_zoom_div_scale;
    let m_offset_y = (e.clientY-rect.y)/map_zoom_div_scale;

    let initial_scale = map_zoom_div_scale; //global at top of file

    //negative deltaY means zoom in
    let scale_factor = Math.pow(1.07, -e.deltaY/100);
    map_zoom_div_scale *= scale_factor;
    map_zoom_div_scale = Math.max(map_min_scale, Math.min(map_max_scale, map_zoom_div_scale));

    map_zoom_div.style.transform = "scale(" + map_zoom_div_scale + ")";
    map_zoom_div.style.left = left + (m_offset_x*initial_scale) - (m_offset_x*map_zoom_div_scale) + "px";
    map_zoom_div.style.top = top + (m_offset_y*initial_scale) - (m_offset_y*map_zoom_div_scale) + "px";
  }
}



function handleContextmenu(e){
  if(disable_contextmenu){e.preventDefault();}
  else {return;}

  contextmenu.innerHTML = "";

  //contextmenu for things and items
  if(e.target.classList.contains("thing") || e.target.classList.contains("item")){
    let split = e.target.id.split("|");
    let where = split[0]; //"my" or location name
    let type = split[1]; //"item" or "thing"
    let id = Number(split[2]);
    let equality_string = split[3]; //not used right now but might in the future

    socket.emit("get_interactions", where, type, id, function(interactions){
      if(interactions == null){
        alert("Couldn't find item/thing on server. Someone may have taken the item before you, or something else weird might have happened. Reload the page to be safe.");
        console.error("Error with get_interactions socket emit from contextmenu, couldn't find item/thing. where: " + where + ", type: " + type + ", id: " + id);
        return;
      }

      let actions = interactions.actions;
      let messages = interactions.messages;

      //add actions to contextmenu
      for(let i=0; i<actions.length; i++){
        let menu_item = document.createElement("div");
        menu_item.className = "action";
        menu_item.textContent = actions[i];
        menu_item.addEventListener("click", function(){
          socket.emit("action", where, type, id, actions[i], {}, function(success){
            if(!success){
              alert("Action failed because the item/thing wasn't found on the server. Someone may have beaten you to taking an item, or something else weird might have happened.");
              console.warn("Action socket emit from contextmenu, couldn't find item/thing. where: " + where + ", type: " + type + ", id: " + id + ", action: " + actions[i]);
              //note: item/thing not found for an action emit will cause the server to gracefully do nothing
            }
          });
        });
        contextmenu.appendChild(menu_item);
      }

      //add messages to contextmenu
      for(let i=0; i<messages.length; i++){
        let menu_item = document.createElement("div");
        menu_item.textContent = messages[i];
        contextmenu.appendChild(menu_item);
      }
    });
  }
  else { //if right click on something without a menu
    hide(contextmenu); //hide it in case it was showing
    return; //and skip showing it (below)
  }


  //show the contextmenu, making sure it doesn't go offscreen

  //for some reason jquery can tell the width/height immediately (unlike getComputedStyle), but weirdly it only works if inside a setTimeout with 0 delay
  let size_timeout = setTimeout(function(){
    let left_offset = Math.min(0, window.innerWidth - ($(contextmenu).width() + e.pageX));
    contextmenu.style.left = e.pageX + left_offset + "px";

    let top_offset = Math.min(0, window.innerHeight - ($(contextmenu).height() + e.pageY));
    contextmenu.style.top = e.pageY + top_offset + "px";

    show(contextmenu);
  }, 0);

}


function handleKeypress(e){
  if(isPopupOpen()) return;

  if(e.key == "~"){
    disable_contextmenu = !disable_contextmenu;
    console.log("Disable contextmenu:", disable_contextmenu);
  }
  if(e.key == " " && game_active){
    hide(map_div);
    getComputedStyle(inventory).display == "block" ? hide(inventory) : show(inventory);
    //we'll let spectators view the inventory board, that way they can see what stuff there is to find
  }
  if(e.key == "m"){
    hide(inventory);
    getComputedStyle(map_div).display == "block" ? hide(map_div) : show(map_div);
  }
}


function handleKeydown(e){
  if(isPopupOpen()) return;

  if(e.key == "Escape"){
    hide(contextmenu);
    hide(inventory);
    hide(map_div);
  }
}

function handleWindowResize(e){
  hide(contextmenu);
}
