
var model = "";
$(document).ready(function(){
model = document.getElementById('modelPop-1');
 
var span = document.getElementById("close-1");

span.onclick = function() {
    model.style.display = "none";
}

});


function openModel_1()
{
	model.style.display = "block";
}

var model2 = "";
$(document).ready(function(){
model2 = document.getElementById('modelPop-2');
 

var span2 = document.getElementById("close-2");

span2.onclick = function() {
    model2.style.display = "none";
}

});

 
 function openModel_2()
{
	model2.style.display = "block";
}
