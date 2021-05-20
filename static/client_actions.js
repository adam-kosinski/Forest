/*
The client_actions object stores the event handlers for clicking on contextmenu actions.
The keys are "ObjectClassname-Action Name"
The values are functions with args (where, object, action_name)
  - note: action_name only needed for the default function
There is a "default" function which is used if none of the other function keys match (most common occurrence; no data needed).
In general, we specify a non-default function here if the client has to do something extra to determine data to send to the server along with the action.
*/

//callback for all the actions is the same, avoid redundancy by defining it here
let action_callback = function(success){
  if(!success){
    alert("Action failed because the item/thing wasn't found on the server. Someone may have beaten you to taking an item, or something else weird might have happened.");
    console.warn("Action socket emit from contextmenu, couldn't find item/thing. where: " + where + ", type: " + type + ", id: " + id + ", action: " + actions[i]);
    //note: item/thing not found for an action emit will cause the server to gracefully do nothing
  }
}


let client_actions = {
  "default": function(where, object, action_name){
    socket.emit("action", where, object.type, object.id, action_name, {}, action_callback);
  },
  "Hole-Put Item In": function(where, object){
    console.log("hole put item in");
    show(inventory);

    highlightElement(inventory_items, "Select item to put in hole (press Esc to cancel)");
    inventory_items.classList.add("highlight_items");
    //these things undone if press escape or if click an item (below)

    //event handler for selecting an item
    $("#inventory_items .item").click(function(e){
      console.log("item clicked");
      $("#inventory_items .item").off("click"); //remove event handler from items
      clearElementHighlight();
      inventory_items.classList.remove("highlight_items");

      let split = e.target.id.split("|");
      let item_where = split[0];
      if(item_where != "my"){
        console.warn("Somehow selected an item not in the inventory for putting in a hole, canceling action.");
        return;
      }
      let item_id = Number(split[2]);

      socket.emit("action", where, object.type, object.id, "Put Item In", {item_id: item_id}, action_callback);
    });
  }
};
