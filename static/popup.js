//Custom prompt and alert popups -------------------------------------------
//To copy to another project - need jquery, the popup HTML inside the body (which should be positioned), and the popup css copy-pasted

let prompt_callback = function(){};
let alert_callback = function(){};
let popup_open = false; //whether the popup is intended to be open/closed at this time, NOT whether it's visible (there's a fade animation for showing/hiding the popups) - use isPopupVisible() for checking visibility
let popup_queue = []; //stores functions to run when popup closed - for if a popup triggered when one already open

document.addEventListener("click", function(e){
  if(e.target.id == "prompt_ok"){
    let input = document.getElementById("prompt_input");
    prompt_callback(input.value);
    closePopup();
  }
  else if(e.target.id == "prompt_cancel"){
    prompt_callback(null);
    closePopup();
  }
  else if(e.target.id == "alert_ok"){
    alert_callback();
    closePopup();
  }
});


document.addEventListener("keydown", function(e){

  let alert_popup = document.getElementById("alert");
  let prompt_popup = document.getElementById("prompt");

  if(e.key == "Enter"){
    if(getComputedStyle(prompt_popup).display != "none"){
      let input = document.getElementById("prompt_input");
      closePopup();
      prompt_callback(input.value);
    }
    else if(getComputedStyle(alert_popup).display != "none"){
      closePopup();
      alert_callback();
    }
  }
  if(e.key == "Escape"){
    if(getComputedStyle(prompt_popup).display != "none"){
      closePopup();
      prompt_callback(null);
    }
    if(getComputedStyle(alert_popup).display != "none"){
      closePopup();
      alert_callback();
    }
  }
});


function closePopup(clear_queue=false){
  if(clear_queue) popup_queue = []; //to force all popups to close

  //important it takes a little time to disappear because otherwise an event triggering this will also be able to trigger other things right after this closes (e.g. closing multiple things with Esc)
  // - since other things will check isPopupVisible()
  //also the animation looks nice
  $(".popup").fadeOut(100);
  $("#disable_page_div").fadeOut(100);
  popup_open = false;

  if(popup_queue.length > 0){
    let func = popup_queue.shift(); //removes first item and returns it
    func();
  }
}


function customPrompt(message, callback=function(){}){
  //callback is a function to run when the user presses OK or Cancel, either input or null is passed as an arg to it

  if(popup_open){
    popup_queue.push(function(){customPrompt(message, callback)});
    return;
  }

  prompt_callback = callback;
  document.getElementById("prompt_text").innerText = message;
  $("#prompt").fadeIn(100);
  $("#disable_page_div").fadeIn(100);
  let input = document.getElementById("prompt_input");
  input.value = "";
  input.focus();
  popup_open = true;
}

function customAlert(message, callback=function(){}){
  //callback is a function to run when the user presses OK, no arguments

  if(popup_open){
    popup_queue.push(function(){customAlert(message, callback)});
    return;
  }

  alert_callback = callback;
  document.getElementById("alert_text").innerText = message;
  $("#alert").fadeIn(100);
  $("#disable_page_div").fadeIn(100);
  popup_open = true;
}



function isPopupVisible(){
  let alert_popup = document.getElementById("alert");
  let prompt_popup = document.getElementById("prompt");
  if(getComputedStyle(alert_popup).display != "none" || getComputedStyle(prompt_popup).display != "none") return true;
  return false;
}
