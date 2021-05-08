//Custom prompt and alert popups -------------------------------------------

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


function closePopup(){
  //do a short timeout because otherwise an event triggering this will also be able to trigger other things right after this closes (e.g. closing multiple things with Esc)
  setTimeout(function(){
    document.getElementById("prompt").style.display = "none";
    document.getElementById("alert").style.display = "none";
    document.getElementById("disable_page_div").style.display = "none";
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
  }, 20); //longer delay than closePopup()'s setTimeout
}



function isPopupOpen(){
  let alert_popup = document.getElementById("alert");
  let prompt_popup = document.getElementById("prompt");
  if(getComputedStyle(alert_popup).display != "none" || getComputedStyle(prompt_popup).display != "none") return true;
  return false;
}



// Nested element child test ----------------------------------------

function elementPartOf(element, target_element){
    //checks if this element is equal to another element, or one of its parents/grandparents/etc. is equal
    let test_element = element;
    while(test_element && test_element != document.body){
      if(test_element == target_element){
        return true;
      }
      test_element = test_element.parentElement;
    }
    return false;
}



// Item processing --------------------------------------------

function processItems(itemArray, cannotFindIds){
  //returns an object with two properties, visible and hidden, which each refer to objects
  //each sub-object is of form {item_name-tag1-tag2: [array of item objects]}
  //items we can't find are omitted entirely from the return object

  let out = {visible:{}, hidden:{}};

  //don't have duplicate code for visible vs hidden
  let addToObject = function(item, object){
    let key = item.name;
    if(item.tags.length > 0) key += "-" + item.tags.join("-");
    if(object.hasOwnProperty(key)) object[key].push(item);
    else object[key] = [item];
  }

  for(let i=0; i<itemArray.length; i++){
    let item = itemArray[i];
    if(cannotFindIds.includes(item.id)) continue;

    if(item.visible) addToObject(item, out.visible);
    else addToObject(item, out.hidden);
  }

  return out;
}
