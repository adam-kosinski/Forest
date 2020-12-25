document.addEventListener("click", handleClick);
document.addEventListener("mousedown", handleMousedown);
document.addEventListener("mousemove", handleMousemove);
document.addEventListener("mouseup", handleMouseup);
document.addEventListener("mousewheel", handleMousewheel);


let drag_element; //undefined means not currently dragging (same for next two)
let drag_offset_start; // {top: y, left: x} -what the element's offsets were at drag start
let drag_mouse_start; // {x: pageX, y: pageY} - what the mouse's coords were at drag start
let drag_place; //id of node we're "over" (near), undefined if none

let game_board_scale = 1; //bigger is more zoomed in




function handleClick(e){
  if(e.target.id == "start_button"){
    socket.emit("start_game");
  }

  console.log(e.offsetX, e.offsetY);
}


function handleMousedown(e){

  e.preventDefault(); //otherwise computer complains about you trying to drag the background image

  // drag and drop
  //if it's part of the game_board but not draggable, drag the game_board
  let drag_target = e.target;
  if(elementPartOf(e.target, "game_board") && !e.target.classList.contains("draggable")){ //util.js
    drag_target = game_board;
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

    //compute adjacent places so we know if player is allowed to go there
    adj_places = [];
    for(let c=0; c<map.adj_matrix[me.location].length; c++){
      if(map.adj_matrix[me.location][c] == 1){
        adj_places.push(c);
      }
    }
    console.log("adj_places",adj_places);
  }

}

function handleMousemove(e){
  //drag and drop ----------------------
  if(drag_element){
    let m_offset_y = e.pageY - drag_mouse_start.y;
    let m_offset_x = e.pageX - drag_mouse_start.x;

    if(drag_element != game_board && elementPartOf(drag_element, "game_board")){
      //account for zoom
      m_offset_y /= game_board_scale;
      m_offset_x /= game_board_scale;
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
    if(drag_element == my_token){
      let style = getComputedStyle(my_token);
      let x = Number(style.left.split("px")[0]);
      let y = Number(style.top.split("px")[0]);
      //my location node
      let my_place = map.places[me.location].pos;
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
          let node_pos = map.places[adj_places[i]].pos;
          if(Math.hypot(x-node_pos.x, y-node_pos.y) <= place_radius){
            document.getElementById("node_"+adj_places[i]).style.boxShadow = "0 0 10px 5px yellow";
            drag_place = adj_places[i];
            break;
          }
        }
      }
    }

    console.log("drag_place",drag_place)

  }
}

function handleMouseup(e){

  //drag and drop
  if(drag_element == my_token){
    //check if invalid drag
    if(drag_place == undefined){
      //reset to initial position
      drag_element.style.left = drag_offset_start.left + "px";
      drag_element.style.top = drag_offset_start.top + "px";
      updateServerElement(my_token, "left", "top");
    }
    else {
      //tell the server we're at a new position
      socket.emit("walk", drag_place);
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
  if(elementPartOf(e.target, "game_board")){ //util.js
    //get initial position
    let style = getComputedStyle(game_board);
    let left = Number(style.left.split("px")[0]);
    let top = Number(style.top.split("px")[0]);

    //get mouse offset, in unscaled px
    let rect = game_board.getBoundingClientRect();
    let m_offset_x = (e.clientX-rect.x)/game_board_scale;
    let m_offset_y = (e.clientY-rect.y)/game_board_scale;

    let initial_scale = game_board_scale;

    //negative deltaY means zoom in
    let scale_factor = Math.pow(1.07, -e.deltaY/100);
    game_board_scale *= scale_factor;

    game_board.style.transform = "scale(" + game_board_scale + ")";
    game_board.style.left = left + (m_offset_x*initial_scale) - (m_offset_x*game_board_scale) + "px";
    game_board.style.top = top + (m_offset_y*initial_scale) - (m_offset_y*game_board_scale) + "px";
  }
}
