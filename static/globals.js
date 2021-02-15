//Note: these are not all the global variables, the rest are at the top of various files where they're more relevant

//DOM references
let home_screen = document.getElementById("home_screen");
let player_display = document.getElementById("player_display");
let start_button = document.getElementById("start_button");
let dark_fade = document.getElementById("dark_fade");

let game_div = document.getElementById("game_div");
let game_board = document.getElementById("game_board");

let place_name_display = document.getElementById("place_name_display");
let region_name_display = document.getElementById("region_name_display");
let item_display = document.getElementById("item_display");
let thing_display = document.getElementById("thing_display");

let contextmenu = document.getElementById("contextmenu");

let inventory = document.getElementById("inventory");
let inventory_items = document.getElementById("inventory_items");

let search_div = document.getElementById("search_div");
let flashlight_canvas = document.getElementById("flashlight_canvas");
let progress_div = document.getElementById("progress_div");


//constants

let my_name;
let board_aspect_ratio = 959/750; // width/height, determined by the background image's dimensions
let place_radius = 50; //px around a place's center where a token is considered at that place
let flashlight_radius = 20; //in vh

//game-state variables, need to reset these if ending a game --------------------------

let game_active = false;
let am_spectator = false;
let game_obj; //copy of the server's game object
let prev_game_obj; //last game state, used for detecting and animating changes
let me; //stores a copy of my player state object that the server has
let my_token; //DOM reference
let adj_places = []; //list of place ids adjacent to my location, redefined each time we start dragging my token
let search_focus = undefined; //this is a global var b/c updateSearchDiv() needs to know it. Gets reset to undefined when press Esc to close the search_div

//debug
let disable_contextmenu = true;
