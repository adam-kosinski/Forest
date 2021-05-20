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



//Element highlighting ---------------------------------------------------

let highlighted_element; //to remember the element upon window resize (see event handler in events.js)

function highlightElement(element, text=""){
  //If the element is visible, darkens the rest of the screen, while still allowing clicking on the element
  //The element's z-index doesn't matter

  //check if visible - note can't check display style property b/c could still not be visible if a parent has display = "none"
  if(element.offsetHeight == 0) return; //offsetHeight is the display height of the element (including padding borders etc) - won't be 0 if the element is showing in any meaningful way

  highlighted_element = element;

  let top_div = document.getElementById("top_darkener");
  let left_div = document.getElementById("left_darkener");
  let right_div = document.getElementById("right_darkener");
  let bottom_div = document.getElementById("bottom_darkener");
  let text_p = document.getElementById("element_highlighter_text");

  let rect = element.getBoundingClientRect();
  top_div.style.height = rect.y + "px";

  left_div.style.width = rect.x + "px";
  left_div.style.height = rect.height + "px";
  left_div.style.top = rect.y + "px";

  right_div.style.width = window.innerWidth - (rect.x + rect.width) + "px";
  right_div.style.height = rect.height + "px";
  right_div.style.top = rect.y + "px";

  bottom_div.style.height = window.innerHeight - (rect.y + rect.height) + "px";

  show(top_div);
  show(left_div);
  show(right_div);
  show(bottom_div);

  text_p.textContent = text;
  if(text.length > 0){
    text_p.style.left = rect.x + rect.width/2 + "px";
    text_p.style.top = rect.y + "px";
    show(text_p);
  }
}

function clearElementHighlight(){
  highlighted_element = undefined;
  hide(document.getElementById("top_darkener"));
  hide(document.getElementById("left_darkener"));
  hide(document.getElementById("right_darkener"));
  hide(document.getElementById("bottom_darkener"));
  hide(document.getElementById("element_highlighter_text"));
}


// Item/Thing processing --------------------------------------------

function processItems(itemArray, cannotFindIds=[]){
  //returns an object with two properties, visible and hidden, which each refer to objects
  //each sub-object is of form {item_name-tag1-tag2: [array of item objects]}
  //items we can't find are omitted entirely from the return object

  let out = {visible:{}, hidden:{}};

  //don't have duplicate code for visible vs hidden
  let addToObject = function(item, object){
    let key = equalityString(item);
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


function findDifferences(prev, current, prevCannotFindIds=[], cannotFindIds=[]){
  //prev and current are arrays of both item objects or both thing objects
  //function returns {new:[], missing:[], changed:[]}
  //new contains all new objects in current compared to prev, missing contains all missing objects,
    //changed contains objects that aren't new or missing, but a property changed - represented as {prev:object, current:object}
  //items/things we can't find aren't considered in the comparison

  let out = {new:[], missing:[], changed:[]};

  //filter out stuff we can't find (also makes a new array, letting us splice)
  prev = prev.filter(obj => !prevCannotFindIds.includes(obj.id));
  current = current.filter(obj => !cannotFindIds.includes(obj.id));

  //iterate through prev, checking if each entry's id is in current
  //if so, check if changed, then splice out of current - this will leave only new entries in current by the end
  //if not, push to missing
  prev_iteration:
  for(let i=0; i<prev.length; i++){
    for(let j=0; j<current.length; j++){
      if(prev[i].id == current[j].id){
        if(JSON.stringify(prev[i]) != JSON.stringify(current[j])){
          out.changed.push({prev:prev[i], current:current[j]});
        }
        current.splice(j, 1);
        continue prev_iteration;
      }
    }
    out.missing.push(prev[i]);
  }

  out.new = current;
  return out;
}


function equalityString(object){
  //object is either an Item or a Thing object
  //items/things with the same equality string (name + tags + stackability) are the same; unstackable objects always have unique equality strings
  //equality strings used in processItems() above, and lots of functions in display.js
  let string = object.name + (object.tags.length > 0 ? "-" + object.tags.join("-") : "");
  if(!object.stackable) string += "~" + object.id;
  return string.replaceAll(" ","_"); //some applications (e.g. class name) don't accept spaces
}


function imageSrc(object){
  //similar to equality string, but removes uniqueness of unstackables, and checks for const_name
  //also does path and .jpg
  let image_name = (object.const_name ? object.const_name : object.name);
  image_name += (object.tags.length > 0 ? "-" + object.tags.join("-") : "");
  image_name = image_name.replaceAll(" ","_");
  return "./static/images/" + object.type + "s/" + image_name + ".jpg";
}
