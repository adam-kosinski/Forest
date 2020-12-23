document.addEventListener("click", handleClick);
document.addEventListener("mousedown", handleMousedown);
document.addEventListener("mousemove", handleMousemove);
document.addEventListener("mouseup", handleMouseup);
document.addEventListener("mousewheel", handleMousewheel);


let drag_element; //undefined means not currently dragging (same for next two)
let drag_offset_start; // {top: y, left: x} -what the element's offsets were at drag start
let drag_mouse_start; // {x: pageX, y: pageY} - what the mouse's coords were at drag start

let game_board_scale = 1; //bigger is more zoomed in




function handleClick(e){
  if(e.target.id == "start_button"){
    socket.emit("start_game");
  }
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
  }

/*  top = topstart + dmouse
  top = topstart + mousenow - mousestart
*/}

function handleMouseup(e){

  //drag and drop
  //TODO - check if valid drag (for player walking) - if not, reset to initial position before forgetting that
  drag_element = undefined;
  drag_offset_start = undefined;
  drag_mouse_start = undefined;
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
