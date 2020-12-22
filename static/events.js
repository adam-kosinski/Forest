
document.addEventListener("mousedown", handleMousedown);
document.addEventListener("mousemove", handleMousemove);
document.addEventListener("mouseup", handleMouseup);


let drag_element; //undefined means not currently dragging (same for next two)
let drag_offset_start; // {top: y, left: x} -what the element's offsets were at drag start
let drag_mouse_start; // {x: pageX, y: pageY} - what the mouse's coords were at drag start

function handleMousedown(e){

  // drag and drop
  if(/draggable/.test(e.target.className)){
    drag_element = e.target;
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
    if(e.pageY > 0 && e.pageY < window.innerHeight){
      drag_element.style.top = drag_offset_start.top + (e.pageY - drag_mouse_start.y) + "px";
    }
    if(e.pageX > 0 && e.pageX < window.innerWidth){
      drag_element.style.left = drag_offset_start.left + (e.pageX - drag_mouse_start.x) + "px";
    }
    updateServerElement(drag_element,"top","left"); //client.js
  }

/*  top = topstart + dmouse
  top = topstart + mousenow - mousestart
*/}

function handleMouseup(e){

  //drag and drop
  //TODO - check if valid drag (for player walking)
  drag_element = undefined;
  drag_offset_start = undefined;
  drag_mouse_start = undefined;
}
