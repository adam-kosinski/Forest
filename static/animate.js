
function show(element){
  $(element).fadeIn(100);
}

function hide(element){
  $(element).fadeOut(100);
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
