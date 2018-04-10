$(document).ready(function () {
    initialize();  //initializes GUI
	 
	$( "#appInputForm-1" ).click(function() {
		alert("clcik");
        modal.style.display = "block";
    });
	
	let span = document.getElementsByClassName("close")[0];
	
	span.onclick = function() {
      modal.style.display = "none";
    }
});

