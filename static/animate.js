
//show and hide opacity animations

function animateOpacity(element, show, finishFunc=undefined, duration=100){
  //show = true/false, if false means hide
  let n_steps = 5;

  let opacity = show ? 0 : 1;
  element.style.opacity = opacity;

  let interval = setInterval(function(){
    opacity += (show ? 1 : -1)*(1/n_steps);
    element.style.opacity = opacity;
    if(opacity >= 1 || opacity <= 0){
      clearInterval(interval);
      if(finishFunc){finishFunc();}
    }
  }, duration/n_steps);
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
