//Custom prompt and alert popups -------------------------------------------

let which_popup_open;
let prompt_callback = function(){};
let alert_callback = function(){};

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
  if(e.key == "Enter"){
    if(which_popup_open == "prompt"){
      let input = document.getElementById("prompt_input");
      closePopup();
      prompt_callback(input.value);
    }
    else if(which_popup_open == "alert"){
      closePopup();
      alert_callback();
    }
  }
  if(e.key == "Escape"){
    if(which_popup_open == "prompt"){
      closePopup();
      prompt_callback(null);
    }
    if(which_popup_open == "alert"){
      closePopup();
      alert_callback();
    }
  }
});


function closePopup(){
  document.getElementById("prompt").style.display = "none";
  document.getElementById("alert").style.display = "none";
  document.getElementById("disable_page_div").style.display = "none";

  //do a short timeout for the flag because otherwise an event triggering this will also be able to trigger other things right after this closes
  setTimeout(function(){
    which_popup_open = undefined;
  }, 10);
}


function customPrompt(message, callback=function(){}){
  //callback is a function to run when the user presses OK or Cancel, either input or null is passed as an arg to it
  //wait a sec before opening, in case closePopup() was doing it's thing; we don't want to have two things trying to change the display style at once
  setTimeout(function(){
    prompt_callback = callback;
    document.getElementById("prompt_text").innerText = message;
    document.getElementById("prompt").style.display = "block";
    document.getElementById("disable_page_div").style.display = "block";
    let input = document.getElementById("prompt_input");
    input.value = "";
    input.focus();
    which_popup_open = "prompt";
  }, 20); //longer delay than closePopup()'s setTimeout
}

function customAlert(message, callback=function(){}){
  //callback is a function to run when the user presses OK, no arguments
  //wait a sec before opening, in case closePopup() was doing it's thing; we don't want to have two things trying to change the display style at once
  setTimeout(function(){
    alert_callback = callback;
    document.getElementById("alert_text").innerText = message;
    document.getElementById("alert").style.display = "block";
    document.getElementById("disable_page_div").style.display = "block";
    which_popup_open = "alert";
  }, 20); //longer delay than closePopup()'s setTimeout
}




// Nested element child test ----------------------------------------

function elementPartOf(element, id){
    //checks if this element has a certain id, or one of it's parents/grandparents/etc. has the id
    let test_element = element;
    while(test_element && test_element != document.body){
      if(test_element.id == id){
        return true;
      }
      test_element = test_element.parentElement;
    }
    return false;
}
