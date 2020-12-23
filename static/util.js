
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
