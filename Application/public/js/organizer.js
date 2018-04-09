// this file is responsible for executing the http-requests.

function getCurrentDate() { // returns the current Date and Time used in comments
    var date = new Date();
    var month = (date.getMonth() + 1) < 10 ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1);
    var day = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
    var hour = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
    var min = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
    var sec = date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();
    return date.getFullYear() + "." + month + "." + day + ", " + hour + ":" + min + ":" + sec;

}

function serverRequest(requestUrl, value, success) { // skeleton for performing http-request
    // requestUrl = route defined in api.js
    // value = json object storing necessary information
    // success = callback function executed if the request was successful
    xhr = new XMLHttpRequest();
    var url = requestUrl;
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onreadystatechange = function () { // if result is available
        if (xhr.readyState == 4 && xhr.status == 200) { // and request was successful,
            var json = JSON.parse(xhr.responseText);
            success(json); // // invoke 'success' function with json-result as parameter
        }
    };
    var data = JSON.stringify(value);
    xhr.send(data); // send server request
}

function addNewParticipant(event) { // send addParticipant request
    consoleAdd("send AddNewParticipant Request");
    debugger;

    let calendarId = 1; // mocking 

    // if the event is triggered by key 
    if (event.keyCode==13){
        var val = document.getElementById(event.target.id).value;
        if (val == ""){
            consoleAdd("Participant name cannot be empty!");
        }
        else {
            serverRequest("/api/" + calendarId +  "/addParticipant", {
                name: val
            }, function (json) { // "val" covers the new participant name
                consoleAdd("addNewParticipant: " + json.result); // on success, client logs information
                getUpdates(); // client requests new data, if request was successful
            })
        }
    }
    else { // if the event is triggered by button
        // TODO
    }

    $('#newParticipant').val(""); //clear textBox, where participant was inserted
}

function removeParticipant() { // send removeParticipant request
    consoleAdd("Remove Participant " + currentParticipant);
    serverRequest("/api/removeParticipant", {
        participant: currentParticipant
    }, function (json) {
        consoleAdd("removeParticipant: " + json.result);
        getUpdates() // get updates from server, after request was successful
    })
}

function editAppointment() { // send editAppointment request. This is NOT invoked after solving conflicts
    consoleAdd("Current ID for editing: " + currentID);
    var newApp = getAppointmentFromForm();
    newApp = getChanges(newApp, currentEvent);
    newApp.id = currentID; // set aId depending on the current selected appointment
    serverRequest("/api/editAppointment", {
        id: currentID,
        app: newApp,
        calendar: currentCalendar,
        comment: getCurrentDate() + ": edited by " + currentParticipant
    }, function (json) {
        consoleAdd("editAppointment: " + json.result);
        clearForm(); // clear inputForm
        getUpdates() //request new updates
    })
}

function removeAppointment() { // send removeAppointment request
    consoleAdd("Current ID for deleting: " + currentID);
    serverRequest("/api/removeAppointment", {
        id: currentID
    }, function (json) {
        consoleAdd("removeAppointment: " + json.result);
        clearForm();
        getUpdates();
    })
}

function addAppointment() { // send addAppointment request
    if (currentParticipant == "" || (typeof currentParticipant == "undefined") || $('#iname').val() == "") {
        alert("Calendar name and title should be filled out!");
        return;
    }
    var app = getAppointmentFromForm();
    app.comments = [getCurrentDate() + ": created by " + currentParticipant];
    serverRequest("/api/addAppointment", {
        calendar: currentCalendar,
        appointment: app
    }, function (json) {
        consoleAdd("addAppointment: " + json.result);
        clearForm();
        getUpdates();
        currentID = ""; //after an new appointment was created, set currentID to empty.
        // otherwise you could modify an "old" appointment
    })
}

function addComment() { // send addComment request
    var val = document.getElementById("iCommentInput").value;
    $('#iCommentInput').val("");
    if (val == "") {
        consoleAdd("Comment cannot be empty!");
    } else {
        consoleAdd("New Comment: " + val);
    }
    serverRequest("/api/addComment", {
        id: currentID,
        comment: getCurrentDate() + ", " + currentParticipant + ": " + val
    }, function (json) {
        consoleAdd("addComment: " + json.result);
        getUpdates();
    })
}

function solveAppointment() { // after the "right" value versions were selected, a editAppointment request is performed
    consoleAdd("Solving conflict as 'editNewAppointment' with " + currentID);
    var app = getAppointmentFromChooseForm();
    app.id = currentID; // set aId depending on the current selected appointment
    serverRequest("/api/editAppointment", {
        id: currentID,
        app: app,
        calendar: currentCalendar,
        comment: getCurrentDate() + ": conflict solved by " + currentParticipant
    }, function (json) {
        consoleAdd("editAppointment: " + json.result);
        clearForm(); // empty inputForm
        getUpdates() //request Updates
    })
    // show Inputform here as well, because this request can last some time!
    showInput(); //  show default inputForm instead of chooseForm
    clearForm(); // empty inputForm
}

function getUpdates() { // request new calendar data from the server
    let calendarId = 1; // mocking 
    consoleAdd("update request");
    var selectedParticipants = getSelectedParticipants();
    serverRequest("/api/" +calendarId +  "/update", {
        participant: currentParticipant,
        calendar: currentCalendar
    }, function (json) {
        setParticipants(json.participants);
        setSelectedParticipants(selectedParticipants);
        setEvents(json.apps);
    });
}

function consoleAdd(text) { // add come text to the 'console'. This is useful for debugging client
    let $consoles = $('#console-1, #console-2');
    debugger;
    $consoles.each(function (i, elem) {
        debugger;
        $(elem).val($(elem).val() + "\n" + text);
    });
}


function getChanges(editedEvent, currentEvent) { //compare appointment and changed appointment for changes since only them are
    // sent to the server
    var result = {};
    if (editedEvent.title != currentEvent.title)
        result.title = editedEvent.title;
    if (editedEvent.description != currentEvent.description)
        result.description = editedEvent.description;
    if (new Date(editedEvent.start).getTime() !== new Date(currentEvent.start).getTime())
        result.start = editedEvent.start;
    if (new Date(editedEvent.end).getTime() !== new Date(currentEvent.end).getTime())
        result.end = editedEvent.end;
    if (editedEvent.priority != currentEvent.priority)
        result.priority = editedEvent.priority;
    if (editedEvent.allDay != currentEvent.allDay)
        result.allDay = editedEvent.allDay;

    result.addedParticipants = []; // instead of 'selectedParticipants' we add 'removed/added Participants'
    // see 'Obstacles' in Bachelor thesis
    result.removedParticipants = [];
    for (var p in participantsList) {
        var name = participantsList[p];
        if (editedEvent.participants.includes(name) && !currentEvent.participants.includes(name))
            result.addedParticipants.push(name);
        if (!editedEvent.participants.includes(name) && currentEvent.participants.includes(name))
            result.removedParticipants.push(name)
    }
    return result;
}


function setEvents(events) { // set events to fullCalendar.
    let $calendars = $('#calendar-1, #calendar-2');

    $calendars.each(function (i, elem) {
        debugger;
        $(elem).fullCalendar('removeEventSource', source);
        source.events = [];
        $(elem).fullCalendar('addEventSource', source);
        for (var i = 0; i < events.length; i++) {
            var app = events[i];
            if ("conflict" in app) { //true: app has conflict flag and app, else only the properties
                app.backgroundColor = "red";
            }
            source.events.push(events[i]);
            if (app.id == currentID) {
                //setComments(app.comments);
                setEventToForm(app);
            }
        }
        $(elem).fullCalendar('addEventSource', source);
    });
}