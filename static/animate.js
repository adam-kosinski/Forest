
//show and hide functions, animate the opacity - using separate functions instead of just $().fadeIn() so we have one place to configure the duration

function show(element){
  $(element).fadeIn(100);
}

function hide(element){
  $(element).fadeOut(100);
}


//pop animations for items and things

function animateScale(element, expand="expand", finishFunc=function(){}){ //expand is "expand" or "contract" to scale 0->1 or 1->0
  let handleAnimationEnd = function(){
    element.removeEventListener("animationend", handleAnimationEnd);
    element.classList.remove(expand);
    finishFunc();
  }
  element.addEventListener("animationend", handleAnimationEnd);
  element.classList.add(expand);
}
