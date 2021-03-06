//Note: these are not all the global variables, the rest are at the top of various files where they're more relevant

//DOM references
let home_screen = document.getElementById("home_screen");
let player_display = document.getElementById("player_display");
let start_button = document.getElementById("start_button");
let dark_fade = document.getElementById("dark_fade");

let game_div = document.getElementById("game_div");
let map_div = document.getElementById("map_div");
let map_zoom_div = document.getElementById("map_zoom_div");

let place_name_display = document.getElementById("place_name_display");
let region_name_display = document.getElementById("region_name_display");
let item_display = document.getElementById("item_display");
let thing_display = document.getElementById("thing_display");

let contextmenu = document.getElementById("contextmenu");

let inventory = document.getElementById("inventory");
let inventory_items = document.getElementById("inventory_items");

let search_div = document.getElementById("search_div");
let search_canvas = document.getElementById("search_canvas");
let flashlight_canvas = document.getElementById("flashlight_canvas");

let progress_div = document.getElementById("progress_div");


//constants

let my_name;
let place_radius = 50; //px around a place's center where a token is considered at that place
let flashlight_radius = 20; //in vh
let map_max_scale = 3;
let map_min_scale = 0.25;
let search_div_width_fraction = 0.8; //fraction of game_div

//game-state variables, need to reset these if ending a game --------------------------

let game_active = false;
let am_spectator = false;
let game_obj; //copy of the server's game object
let prev_game_obj; //last game state, used for detecting and animating changes
let prevCannotFind;
let me; //stores a copy of my player state object that the server has
let here; //stores a copy of the place we're in
let my_token; //DOM reference
let adj_places = []; //list of place names adjacent to my location, redefined each time we start dragging my token
let timer_interval_id; //used in updateSearchDiv(), display.js

//debug
let disable_contextmenu = true;
