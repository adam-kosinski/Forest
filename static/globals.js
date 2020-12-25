//Note: these are not all the global variables, the rest are at the top of various files where they're more relevant

//DOM references
let home_screen = document.getElementById("home_screen");
let player_display = document.getElementById("player_display");
let start_button = document.getElementById("start_button");

let game_div = document.getElementById("game_div");
let game_board = document.getElementById("game_board");



let my_name;
let board_aspect_ratio = 959/750; // width/height, determined by the background image's dimensions
let place_radius = 50; //px around a place's center where a token is considered at that place


//game-state variables, need to reset these if ending a game --------------------------

let game_active = false;
let map; //copy of the server's map, used mostly for walking purposes
let me; //stores a copy of my player state object that the server has
let my_token; //DOM reference
let adj_places = []; //list of place ids adjacent to my location, redefined each time we start dragging my token
