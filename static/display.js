

function updateClientElement(data){
  //some other client updated an element, need to update that here
  let element = document.getElementById(data.id);

  if(!element){
    console.warn("Couldn't find element to update, id = '" + data.id + "'");
  }
  else {
    //update it
    if(data.className){
      element.className = data.className;
    }
    for(let prop in data.style){
      element.style[prop] = data.style[prop];
    }
  }
}


function makeThingOrItem(object, display_quantity=0){
  let div = document.createElement("div");
  div.className = object.type + "-container";

  let circle = document.createElement("div");
  let where = object.owner == my_name ? "my" : me.location;
  circle.id = where + "|" + object.type + "|" + object.id;
  circle.classList.add(object.type); //styling
  circle.classList.add(equalityString(object)); //for searching by equality_string, see util.js for details on equality strings
  circle.style.backgroundImage = "url('" + imageSrc(object) + "')"; //imageSrc() in util.js
  div.appendChild(circle);

  let p = document.createElement("p");
  p.textContent = object.name;
  if(display_quantity > 0 && object.stackable) p.textContent += " (" + display_quantity + ")";

  div.appendChild(p);
  return div;
}





function updatePlaceInfo(cannotFind={thingIds:[],itemIds:[]}, first_time=false){
  if(am_spectator){
    return; //TODO: fix everything
  }

  //check if traveling
  if(me.traveling){
    //check if just started, if so, animate hiding everything about this place
    if(!prev_game_obj.players[my_name].traveling){

      $(place_name_display).fadeOut(250);
      $(region_name_display).fadeOut(250);

      let things = Array.from(thing_display.children);
      let items = Array.from(item_display.children);
      let stuff = things.concat(items);
      stuff.forEach(div => {animateScale(div, "contract", function(){div.style.display = "none";})});
    }
    return; //in general don't show anything while traveling
  }

  //info used throughout the rest of the function
  let place = game_obj.map.places[me.location];
  let prev_place = prev_game_obj.map.places[me.location]; //for animations
  let prev_location = prev_game_obj.players[my_name].location;
  let processed_items = processItems(place.items, cannotFind.itemIds); //see util.js
  let prev_processed_items = processItems(prev_place.items, prevCannotFind.itemIds);

  //place name display
  place_name_display.textContent = place.name;
  region_name_display.textContent = place.region;

  //background
  let url = "/static/images/";
  let position = "";
  switch(place.region.toLowerCase()){
    case "prickly pines": url += "prickly_pines.jpg"; position = "right"; break;
    case "waterfall of wisdom": url += "waterfall_of_wisdom.jpg"; position = "left"; break;
    case "roaring rapids": url += "roaring_rapids.jpg"; position = "center"; break;
  }
  place_info.style.backgroundImage = "url('" + url + "')";
  place_info.style.backgroundPosition = position;



  //if new location or first update, create all things/items and animate them expanding out sequentially
  if(me.location != prev_location || first_time){
    console.log("new place");

    $(place_name_display).fadeIn(1000);
    $(region_name_display).fadeIn(1000);

    let stuff_to_animate = [];

    //create things
    thing_display.innerHTML = "";
    for(let i=0; i<place.things.length; i++){
      let thing = place.things[i];
      if(!thing.visible || cannotFind.thingIds.includes(thing.id)) continue;

      let div = makeThingOrItem(thing);
      thing_display.appendChild(div);
      stuff_to_animate.push(div);
    }

    //create items
    item_display.innerHTML = "";
    //only show visible items in placeInfo
    for(key in processed_items.visible){
      let item_list = processed_items.visible[key];
      let div = makeThingOrItem(item_list[0], item_list.length); //arbitrarily use the first item of its kind (same name / tags)
      item_display.appendChild(div);
      stuff_to_animate.push(div);
    }

    //animate
    stuff_to_animate.forEach(element => {element.style.opacity = 0});

    let i = 0;
    let interval = setInterval(function(){
      if(i >= stuff_to_animate.length){
        clearInterval(interval);
        return;
      }
      stuff_to_animate[i].style.opacity = 1;
      animateScale(stuff_to_animate[i], "expand");
      i++;
    }, 150);
  }
  else {
    //not new location nor first update, figure out if anything changed and update/animate it
    //note: prev_place doesn't refer to the place we were last time, it refers to the state of where we are now, one update before

    //things
    let prev_visible_things = prev_place.things.filter(thing => thing.visible);
    let visible_things = place.things.filter(thing => thing.visible);
    let thing_differences = findDifferences(prev_visible_things, visible_things, prevCannotFind.thingIds, cannotFind.thingIds); //see util.js

    thing_differences.new.forEach(thing => {
      let thing_container = makeThingOrItem(thing);
      thing_display.appendChild(thing_container);
      animateScale(thing_container, "expand");
    });
    thing_differences.missing.forEach(thing => {
      let equality_string = equalityString(thing);
      let thing_container = thing_display.getElementsByClassName(equality_string)[0].parentElement; //note this works because things all have unique equality strings (b/c they're not stackable)
      animateScale(thing_container, "contract", function(){thing_container.parentElement.removeChild(thing_container)});
    });
    thing_differences.changed.forEach(pair => {
      let prev_equality_string = equalityString(pair.prev);

      console.log("thing changed", pair);
      let thing_container = thing_display.getElementsByClassName(prev_equality_string)[0].parentElement; //note this works because things all have unique equality strings (b/c they're not stackable)
      let new_thing_container = makeThingOrItem(pair.current);
      thing_container.replaceWith(new_thing_container);
    });

    //items
    updateVisibleItemAmounts(item_display, prev_place.items, place.items, prevCannotFind.itemIds, cannotFind.itemIds);
  }

}

//function to update changing amounts of visible items, and animating it
//intended for use with the place info item display, and the inventory (separate function to avoid duplicating code)

function updateVisibleItemAmounts(display_div, prev_items, items, prevCannotFindIds=[], cannotFindIds=[]){
  let debug = false;

  //filter for visible items
  prev_items = prev_items.filter(item => item.visible);
  items = items.filter(item => item.visible);

  let processed_items = processItems(items, cannotFindIds); //util.js
  let prev_processed_items = processItems(prev_items, prevCannotFindIds);
  let item_differences = findDifferences(prev_items, items, prevCannotFindIds, cannotFindIds); //see util.js
  let new_equality_strings = []; //so we don't create multiple new divs if multiple of the same type of item that wasn't there before arrive at once

  item_differences.new.forEach(item => {
    if(debug) console.log("new visible item", item);
    let equality_string = equalityString(item);
    let same_items = processed_items.visible[equality_string];
    let prev_same_items = prev_processed_items.visible[equality_string];

    //check if item type (equality string) not there before
    if(!prev_same_items && !new_equality_strings.includes(equalityString(item))){
      if(debug) console.log("--> not there before");
      new_equality_strings.push(equalityString(item));
      let div = makeThingOrItem(item, same_items.length);
      display_div.appendChild(div);
      if(! (display_div == inventory_items && getComputedStyle(inventory).display == "none") ){ //special case for inventory, don't animate if not showing b/c then animation will trigger when open inventory later
        animateScale(div, "expand");
      }
    }
    else { //there before
      if(debug) console.log("--> there before");
      //update the item's display
      let item_container = display_div.getElementsByClassName(equality_string)[0].parentElement;
      let new_item_container = makeThingOrItem(same_items[0], same_items.length);
      item_container.replaceWith(new_item_container);

      //animate a duplicate image of the item expanding on top
      if(! (display_div == inventory_items && getComputedStyle(inventory).display == "none") ){ //special case for inventory, don't animate if not showing b/c then animation will trigger when open inventory later
        let circle = document.createElement("div");
        circle.className = "animator_circle";
        circle.style.backgroundImage = "url('" + imageSrc(item) + "')";
        new_item_container.appendChild(circle);
        animateScale(circle, "expand", function(){
          circle.parentElement.removeChild(circle);
        });
      }
    }
  });
  item_differences.missing.forEach(item => {
    if(debug) console.log("missing visible item", item);
    let equality_string = equalityString(item);
    let same_items = processed_items.visible[equality_string];
    let prev_same_items = prev_processed_items.visible[equality_string];
    let item_container = display_div.getElementsByClassName(equality_string)[0].parentElement;

    //check if not there now - contract the item container and remove it
    if(!same_items){
      if(debug) console.log("--> not there now");
      animateScale(item_container, "contract", function(){item_container.parentElement.removeChild(item_container)})
    }
    else {
      if(debug) console.log("--> still some there");
      //update the item's display
      let new_item_container = makeThingOrItem(same_items[0], same_items.length);
      item_container.replaceWith(new_item_container);

      //animate a duplicate image of the item expanding on top
      let circle = document.createElement("div");
      circle.className = "animator_circle";
      circle.style.backgroundImage = "url('" + imageSrc(item) + "')";
      new_item_container.appendChild(circle);
      animateScale(circle, "contract", function(){
        circle.parentElement.removeChild(circle);
      });
    }
  });
  item_differences.changed.forEach(pair => {
    //TODO:
    //deal with weight changing?

    if(debug) console.log("item changed", pair);
    let equality_string = equalityString(pair.current);
    let prev_equality_string = equalityString(pair.prev);
    let same_items = processed_items.visible[equality_string];
    let item_container = display_div.getElementsByClassName(prev_equality_string)[0].parentElement;

    //update the item's display
    let new_item_container = makeThingOrItem(same_items[0], same_items.length);
    item_container.replaceWith(new_item_container);
  });
}





function makeSearchObject(object){
  //object can be an item or thing object
  //returns a search object

  //search objects are divs that have a search target div and a content div showing the item/thing
  //normally the content div is hidden, but when the search target is clicked it expands into view in front of the search target
  //when the mouse moves off the content div, it contracts back down

  let search_object = document.createElement("div");
  search_object.id = "search_object-" + object.type + "-" + object.id;
  search_object.className = "search_object";
  search_object.style.top = object.coords.y + "%";
  search_object.style.left = object.coords.x + "%";

  let search_content = makeThingOrItem(object);
  search_content.classList.add("search_content");

  let search_target = document.createElement("div");
  search_target.classList.add("search_target");
  let size = "calc(" + object.search_target_size + " * var(--gw))";
  search_target.style.height = size;
  search_target.style.width = size;
  search_target.style.animationDelay = 5*Math.random() + "s";

  //set glow color based on background
  let ctx = search_canvas.getContext("2d");
  let sx = search_canvas.width * object.coords.x / 100;
  let sy = search_canvas.height * object.coords.y / 100;
  let canvas_px_per_gw = search_canvas.width / (100 * search_div_width_fraction);
  let square_size = object.search_target_size * canvas_px_per_gw;
  let image_data = ctx.getImageData(sx-0.5*square_size, sy-0.5*square_size, square_size, square_size); //note: this includes around the glowy bit, since only the center of the search target glows
  ctx.strokeStyle = "red";
  ctx.beginPath();
  ctx.rect(sx-0.5*square_size, sy-0.5*square_size, square_size, square_size);
  ctx.stroke();

  let processed_data = processImageData(image_data);
  let avg_color = processed_data.average;
  let glow_color = avg_color.copy();

  let med_contrast = processed_data.median_contrast < 1.02 ? 1 : processed_data.median_contrast;
  let add_contrast = ( 0.1 + 10*(med_contrast-1)**2 ) / Math.sqrt(object.search_target_size);
  let min_contrast = Math.min(10, 1 + add_contrast);

  console.log(processed_data.median_contrast, processed_data.noise_contrast);

  if(glow_color.contrastRatioWith(avg_color) < min_contrast){
    let white_contrast = avg_color.contrastRatioWith(new RGBA(255, 255, 255, 1));

    if(white_contrast > min_contrast){ //if brightening will help increase contrast enough
      glow_color.r += 1; //avoid infinite loop with scaling if channel was 0
      glow_color.g += 1;
      glow_color.b += 1;
      while(glow_color.contrastRatioWith(avg_color) < min_contrast){
        glow_color = glow_color.scaleBrightness(1.2);
      }
    }
    else {
      console.warn("Brightening the search_target couldn't achieve the necessary contrast, setting to white.", search_target);
      glow_color = new RGBA(255, 255, 255, 1);
    }
  }
  search_target.style.backgroundImage = "radial-gradient(closest-side, " + glow_color.toString() + ", transparent 50%)";
  //search_target.style.backgroundColor = glow_color.toString();

  search_target.addEventListener("click",function(){
    search_content.style.display = "block"; //need to have first for the offset calcs below to work
    search_content.style.top = "0px"; //reset so we can recalculate the offsets
    search_content.style.left = "0px";


    //console.log("glow color", glow_color);
    //console.log("avg color", avg_color);
    console.log("glow_contrast", glow_color.contrastRatioWith(avg_color));
    console.log("med_contrast", processed_data.median_contrast);
    console.log("noise_contrast", processed_data.noise_contrast);
    console.log("min_contrast", min_contrast);
    console.log("");

    //calculate top and left offsets of search_content to not go offscreen, ideally centering on the search_object's coords
    //doing this on every click in case the window was resized since the search_object was generated or last clicked on
    let vw = window.innerWidth/100;
    let rect = search_content.getBoundingClientRect();
    let search_rect = search_div.getBoundingClientRect();

    let top = - Math.min(2*vw + 1, (rect.y - search_rect.y) - vw); //2vw (half height) + 1px (border) to center the image circle, -1vw in 2nd option to account for blur
    let bottom_diff = (search_rect.y + search_rect.height) - (rect.y + top + rect.height) - vw; //diff from if we'd used the 'top' value so far, -vw to account for blur of search_content
    if(bottom_diff < 0) top += bottom_diff; //+= b/c we calculated bottom_diff assuming it was already offset by the previous 'top' value.
    search_content.style.top = top + "px";

    let left = -Math.min(2*vw + 1, (rect.x - search_rect.x) - vw);
    let right_diff = (search_rect.x + search_rect.width) - (rect.x + left + rect.width) - vw;
    if(right_diff < 0) left += right_diff;
    search_content.style.left = left + "px";

    //show
    search_content.classList.add("showing"); //used to decide whether to contract in events.js
    $(search_target).fadeOut(500); //in case search_content is offset b/c the screen edge and doesn't cover the search_target - wll fade back on contract
    animateScale(search_content, "expand"); //contraction handled by general mousemove handler
  });

  search_object.appendChild(search_target);
  search_object.appendChild(search_content); //lazy z-indexing by append order

  return search_object;
}





function updateSearchDiv(cannotFind={thingIds:[],itemIds:[]}, first_time=false){

  if(me.traveling){
    if(!prev_game_obj.players[my_name].traveling){
      //if just started traveling, fade out search div to show the black background
      $(search_div).fadeOut(500);
    }
    return;
  }
  $(search_div).fadeIn(500);


  //timer
  let time_left_on_update = game_obj.time_left; //sec
  let sec_past_update = 1;
    //normally the client lags behind the server a little, but better experience for client to be ahead, e.g. so player not upset about things failing at 1s left
    //also this compensates for server-client communication lag time, may better match actual server time

  let showTime = function(){
    let time_left = Math.max(0, Math.round(time_left_on_update - sec_past_update));
    let min = Math.floor(time_left/60);
    let sec = time_left % 60;
    document.getElementById("timer").textContent = min + ":" + (sec < 10 ? "0" : "") + sec;
  }
  showTime();

  if(timer_interval_id !== undefined) clearInterval(timer_interval_id);
  timer_interval_id = setInterval(function(){
    sec_past_update++;
    showTime();
  }, 1000);
  //note: this interval will get paused if we ever call window.alert() etc. - in theory we never do this during the game so it's fine


  //background, items, things

  let place = game_obj.map.places[me.location];
  let prev_place = prev_game_obj.map.places[me.location];

  //if first update or new location, completely reset the search div - otherwise look if there are items/things missing or added and just change those
  if(first_time || me.location != prev_game_obj.players[my_name].location){

    //clear search_div
    $("#search_div .search_object").remove();
    let ctx = search_canvas.getContext("2d");
    ctx.clearRect(0, 0, search_canvas.width, search_canvas.height);

    //make an image element to draw on the background canvas with
    //this won't be visible, will be opacity 0 and only display as long as needed for drawing it (can only reliably get aspect ratio if displayed)
    let img = document.createElement("img");
    img.src = "./static/images/" + place.region + "/" + place.name.replaceAll(" ","_") + ".jpg";
    img.style.opacity = 0;
    search_div.appendChild(img);

    img.addEventListener("load", function(){

      let aspect_ratio = $(img).width() / $(img).height();
      let draw_width = Math.max(search_canvas.width, search_canvas.height * aspect_ratio);
      let draw_height = draw_width / aspect_ratio;

      let center = {x:0, y:0}; //values 0-1, what point in the image we should attempt to put as close to the center as possible
      switch(place.name){
        case "Cliffside Grove": center = {x:0.5, y:0.5}; break;
        case "Bear Den": center = {x:0.5, y:1}; break;
        case "Redhill": center = {x:0.5, y:0.5};break;
        case "Fern Haven": center = {x:0.5, y:1}; break;
        case "Thicket of Secrets": center = {x:0.5, y:0.75}; break;
        case "Sunlit Stand": center = {x:0.5, y:0.75}; break;
        case "Path": center = {x:0.5, y:0.5}; break;
        case "Middle": center = {x:0.5, y:0.5}; break;
        case "Stream Mid": center = {x:0.75, y:1}; break;
        case "Cliffbase": center = {x:0, y:0.75}; break;
      }

      //find offset in positive units b/c easier to work with (then make negative when we do it - offsets have to be neg since img starts aligned to top left of canvas)
      let max_x_offset = Math.max(0, draw_width - search_canvas.width); //always positive
      let max_y_offset = Math.max(0, draw_height - search_canvas.height);
      let target_x_offset = Math.max(0, draw_width*center.x - search_canvas.width/2); //target center has to be bigger than default (search_canvas) center in order to shift
      let target_y_offset = Math.max(0, draw_height*center.y - search_canvas.height/2);
      let offset = {
        x: Math.min(max_x_offset, target_x_offset),
        y: Math.min(max_y_offset, target_y_offset)
      }
      ctx.drawImage(img, -offset.x, -offset.y, draw_width, draw_height);
      $(img).remove();


      //make hidden search objects - doing this inside the background image load handler, so we'll have
      //access to the background pixels and can use those to modify the search targets

      //things
      for(let i=0; i<place.things.length; i++){
        let thing = place.things[i];
        if(thing.visible || cannotFind.thingIds.includes(thing.id)) continue;

        let search_object = makeSearchObject(thing);
        search_div.appendChild(search_object);
      }

      //items
      for(let i=0; i<place.items.length; i++){
        let item = place.items[i];
        if(item.visible || cannotFind.itemIds.includes(item.id)) continue;

        let search_object = makeSearchObject(item);
        search_div.appendChild(search_object);
      }
    });


  }
  else {
    //not the first update or a new location, just check for differences from previous update

    //things
    let prev_hidden_things = prev_place.things.filter(thing => !thing.visible);
    let hidden_things = place.things.filter(thing => !thing.visible);
    let thing_differences = findDifferences(prev_hidden_things, hidden_things, prevCannotFind.thingIds, cannotFind.thingIds); //see util.js

    thing_differences.new.forEach(thing => {
      search_div.appendChild(makeSearchObject(thing));
    });
    thing_differences.missing.forEach(thing => {
      let search_object = document.getElementById("search_object-thing-" + thing.id);
      $(search_object).fadeOut(500, function(){search_object.parentElement.removeChild(search_object)});
    });
    thing_differences.changed.forEach(pair => {
      /*let search_object = document.getElementById("search_object-thing-" + pair.prev.id);
      $(search_object).fadeOut(500, function(){
        let new_search_object = makeSearchObject(pair.current);
        search_object.replaceWith(new_search_object);
      });*/
    });


    //items
    let prev_hidden_items = prev_place.items.filter(item => !item.visible);
    let hidden_items = place.items.filter(item => !item.visible);
    let item_differences = findDifferences(prev_hidden_items, hidden_items, prevCannotFind.itemIds, cannotFind.itemIds); //see util.js

    item_differences.new.forEach(item => {
      search_div.appendChild(makeSearchObject(item));
    });
    item_differences.missing.forEach(item => {
      let search_object = document.getElementById("search_object-item-" + item.id);
      $(search_object).fadeOut(500, function(){search_object.parentElement.removeChild(search_object)});
    });
    item_differences.changed.forEach(pair => {

    });

  }
}





function updateInventory(first_time=false){
  //we'll let spectators view the inventory board, that way they can see what stuff there is to find

  if(am_spectator){
    //tell the spectator they don't have an inventory
    inventory_items.innerHTML = "";
    let h1 = document.createElement("h1");
    h1.textContent = "N/A";
    h1.style.fontSize = "15vh";
    h1.style.color = "black";
    inventory_items.appendChild(h1);
  }
  else { //not spectator

    if(first_time){
      inventory_items.innerHTML = ""; //just in case
      let processed_items = processItems(me.items); //see util.js
       //items in a player's inventory should always be visible due to the take method on the server
      if(Object.keys(processed_items.hidden).length > 0) console.warn("Some inventory items hidden, processed_items:", processed_items);
      for(key in processed_items.visible){
        let item_list = processed_items.visible[key];
        let div = makeThingOrItem(item_list[0], item_list.length);
        inventory_items.appendChild(div);
      }

      //generate weight bar according to player thresholds
      let weight_bar = document.getElementById("weight_bar");
      let current_max_weight = 0;

      for(let i=0; i<me.weight_thresholds.length; i++){
        let threshold = me.weight_thresholds[i];

        let segment = document.createElement("div");
        segment.className = "weight_bar_segment";
        segment.style.backgroundColor = threshold.color;
        segment.style.flex = threshold.weight_range;
        weight_bar.appendChild(segment);

        let speed_label = document.createElement("p");
        speed_label.className = "speed_label";
        speed_label.textContent = threshold.name;
        segment.appendChild(speed_label);

        let weight_label_left = document.createElement("p");
        weight_label_left.className = "weight_label_left";
        weight_label_left.textContent = current_max_weight;
        segment.appendChild(weight_label_left);

        current_max_weight += threshold.weight_range;
        if(i+1 == me.weight_thresholds.length){
          let weight_label_right = document.createElement("p");
          weight_label_right.className = "weight_label_right";
          weight_label_right.textContent = current_max_weight;
          segment.appendChild(weight_label_right);
        }
      }
    }
    else {
      //just update what's already there
      let prev_items = prev_game_obj.players[my_name].items;
      updateVisibleItemAmounts(inventory_items, prev_items, me.items); //let cannotFindIds arrays default to [] - we can find everything in our inventory
    }

    updateTotalWeight();
  }
}



function updateTotalWeight(){
  //called by updateInventory()

  let total_weight = 0;
  for(let i=0; i<me.items.length; i++){
    total_weight += me.items[i].weight;
    if(me.items[i].is_container){
      total_weight += me.items[i].holding.reduce((accum, item) => accum + item.weight, 0);
    }
  }

  //move weight marker
  let max_weight = me.weight_thresholds.reduce((accum, obj) => accum + obj.weight_range, 0);
  let marker = document.getElementById("weight_bar_marker");
  marker.textContent = total_weight;
  marker.style.left = (100*total_weight/max_weight) + "%";

  //indicate current segment
  let test_weight = total_weight;
  let seg = 0;
  while(test_weight > me.weight_thresholds[seg].weight_range && seg < me.weight_thresholds.length){
    test_weight -= me.weight_thresholds[seg].weight_range;
    seg++;
  }
  let segments = document.getElementsByClassName("weight_bar_segment");
  for(let i=0; i<segments.length; i++){
    if(i == seg) segments[i].classList.add("current_segment");
    else segments[i].classList.remove("current_segment");
  }
}




function initGameDisplay(game){
  game_obj = game; //game_obj is a global variable
  prev_game_obj = game; //originally no previous one
  me = game.players[my_name];
  here = game.map.places[me.location];

  game_div.style.display = "block";

  let map_overlay = document.getElementById("map_overlay");
  let map_image = document.getElementById("map_image");

  //map canvas for graph lines
  let canvas = document.createElement("canvas");
  canvas.id = "map_canvas";
  let map_height = getComputedStyle(map_image).height.split("px")[0];
  let map_width = getComputedStyle(map_image).width.split("px")[0];
  canvas.width = map_width;
  canvas.style.width = map_width + "px";
  canvas.height = map_height;
  canvas.style.height = map_height + "px";
  map_overlay.appendChild(canvas);



  //map graph nodes (circular divs) and lines connecting them (drawn on canvas)
  let ctx = canvas.getContext("2d");
  ctx.strokeStyle = "rgba(255, 228, 196, 0.6)"; //bisque
  ctx.lineWidth = 2;
  //iterate through the places (which also contain an adjacency list)
  let edges_drawn = []; //strings formatted place1-place2
  for(let place_name in game_obj.map.places){
    let place = game_obj.map.places[place_name];

    //create this node
    let node = document.createElement("div");
    node.id = "node_" + place_name;
    node.className = "node";
    node.style.top = place.pos.y + "px";
    node.style.left = place.pos.x + "px";
    map_overlay.appendChild(node);

    place.adj_place_names.forEach(adj_place_name => {
      if(!edges_drawn.includes([place_name, adj_place_name].sort().join("-"))){
        edges_drawn.push([place_name, adj_place_name].sort().join("-"));
        let adj_place = game_obj.map.places[adj_place_name];
        ctx.beginPath();
        ctx.moveTo(place.pos.x, place.pos.y);
        ctx.lineTo(adj_place.pos.x, adj_place.pos.y);
        ctx.stroke();
        ctx.closePath();
      }
    });
  }


  //server tracked elements
  for(let id in game.elements){
    let data = game.elements[id];
    let element = document.createElement(data.tagName);
    element.id = data.id;
    element.className = data.className;
    for(let prop in data.style){
      element.style[prop] = data.style[prop];
    }
    document.getElementById(data.parentId).appendChild(element);
  }

  //only my token is draggable, also make it appear on top of other player tokens
  if(!am_spectator){
    my_token = document.getElementById(my_name+"_token"); //global variable
    my_token.classList.add("draggable");
    my_token.style.zIndex = 11;
  }

  //search_canvas
  let search_aspect_ratio = search_div_width_fraction * Number(getComputedStyle(document.documentElement).getPropertyValue("--aspect_ratio")); //see game.scss
  search_aspect_ratio = Number(search_aspect_ratio.toFixed(3)); //3 decimals, to fix floating point
  search_canvas.width = 1920 * search_div_width_fraction; //1920 is my monitor width, so search_div width in my monitor fullscreen
  search_canvas.height = search_canvas.width / search_aspect_ratio;

  //flashlight canvas
  let fc = flashlight_canvas; //alias
  fc.width = 500;
  fc.height = 500;
  fc.style.width = "500px";
  fc.style.height = "500px";

  let flash_ctx = fc.getContext("2d");

  flash_ctx.fillStyle = "black";
  flash_ctx.fillRect(0, 0, fc.width, fc.height);

  flash_ctx.beginPath();
  let px_radius = flashlight_radius * (window.innerHeight/100);
  flash_ctx.arc(0.5*fc.width, 0.5*fc.height, px_radius, 0, 2*Math.PI);
  flash_ctx.clip(); //now all changes will only apply to the circle we defined
  flash_ctx.clearRect(0, 0, fc.width, fc.height);


  socket.emit("getCannotFind", function(cannotFind){
    prevCannotFind = cannotFind;
    updatePlaceInfo(cannotFind, true); //display.js
    updateSearchDiv(cannotFind, true); //display.js
    updateInventory(true); //display.js
  });
}
