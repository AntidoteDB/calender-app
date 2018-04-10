
$(document).ready(function(){
var model = document.getElementById('modelPop-1');
 

// Get the <span> element that closes the modal
var span = document.getElementById("close-1");
 
$( "#addAppointment-1" ).click(function() {
		model.style.display = "block";
});

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
    model.style.display = "none";
}

 
// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target == model) {
        model.style.display = "none";
    }
}
});


$(document).ready(function(){
var model2 = document.getElementById('modelPop-2');
 

// Get the <span> element that closes the modal
var span2 = document.getElementById("close-2");
 
$( "#addAppointment-2" ).click(function() {
		model2.style.display = "block";
});

// When the user clicks on <span> (x), close the modal
span2.onclick = function() {
    model2.style.display = "none";
}

 
// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target == model) {
        model2.style.display = "none";
    }
}
});