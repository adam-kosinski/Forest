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




//Color processing (for making search objects in display.js) -------------------------------------------

class RGBA {
  constructor(r=0, g=0, b=0, a=1){
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }
  copy(){
    return new RGBA(this.r, this.g, this.b, this.a);
  }
  clamp(){
    //clamp to 0-255 for rgb, 0-1 for a
    let out = this.copy();
    out.r = Math.min(255, Math.max(0, out.r));
    out.g = Math.min(255, Math.max(0, out.g));
    out.b = Math.min(255, Math.max(0, out.b));
    out.a = Math.min(1, Math.max(0, out.a));
    return out;
  }
  relativeLuminance(){
    //The formula used to convert to black/white, where relative luminance for black is 0 and for white is 1
    //From https://www.w3.org/WAI/GL/wiki/Relative_luminance
    //Details on gamma correction (the weird math bit): https://www.cambridgeincolour.com/tutorials/gamma-correction.htm
    let Rs = this.r/255;
    let Gs = this.g/255;
    let Bs = this.b/255;
    let R = Rs <= 0.04045 ? Rs/12.92 : ((Rs+0.055)/1.055)**2.4; //this stuff is called gamma correction
    let G = Gs <= 0.04045 ? Gs/12.92 : ((Gs+0.055)/1.055)**2.4;
    let B = Bs <= 0.04045 ? Bs/12.92 : ((Bs+0.055)/1.055)**2.4;
    return 0.2126*R + 0.7152*G + 0.0722*B;
  }
  contrastRatioWith(other){
    //other is an RGBA object
    //Contrast between two colors, ranges 1 to 21
    //From https://www.w3.org/WAI/GL/wiki/Contrast_ratio
    let darker = Math.min(this.relativeLuminance(), other.relativeLuminance());
    let lighter = Math.max(this.relativeLuminance(), other.relativeLuminance());
    return (lighter + 0.05) / (darker + 0.05);
  }
  scale(channel, scalar){
    if(scalar < 0) return;

    let out = this.copy();
    out[channel] = (this[channel]**2.2 * scalar)**(1/2.2); //note: DON'T ROUND - creates infinite loops
    return out.clamp();
  }
  scaleBrightness(scalar){
    return this.scale("r", scalar).scale("g", scalar).scale("b", scalar);
  }
  toString(){
    return "rgba(" + this.r + ", " + this.g + ", " + this.b + ", " + this.a + ")"
  }
}

function processImageData(image_data){
  let out = {};
  let data = image_data.data;

  //Average the colors by averaging their "squares" then taking the "square root"
  //(actually use power of 2.2 aka gamma)
  //Referenced this for correct color averaging: https://sighack.com/post/averaging-rgb-colors-the-right-way
  let avg = new RGBA();
  let n_pixels = data.length / 4;
  for(let i=0; i<data.length; i+=4){
    avg.r += data[i]**2.2 / n_pixels;
    avg.g += data[i+1]**2.2 / n_pixels;
    avg.b += data[i+2]**2.2 / n_pixels;
    avg.a += (data[i+3]/255)**2.2 / n_pixels;
  }
  avg.r = Math.round(avg.r**(1/2.2)); //rounding not necessary, just for my easier reading
  avg.g = Math.round(avg.g**(1/2.2));
  avg.b = Math.round(avg.b**(1/2.2));
  avg.a = Math.round(avg.a**(1/2.2));
  out.average = avg.clamp(); //clamp to 0-255 / 0-1 just in case we went over

  //Calculate median contrast among each pair of pixels
  let pair_contrasts = [];
  for(let i=0; i<data.length; i+=4){
    for(let j=i+4; j<data.length; j+=4){
      let pixel_1 = new RGBA(data[i], data[i+1], data[i+2], data[i+3]);
      let pixel_2 = new RGBA(data[j], data[j+1], data[j+2], data[j+3]);
      let contrast = pixel_1.contrastRatioWith(pixel_2);
      pair_contrasts.push(contrast);
    }
  }
  pair_contrasts.sort();
  out.median_contrast = pair_contrasts[Math.floor(pair_contrasts.length/2)];

  return out;
}
