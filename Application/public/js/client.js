// this file is responsible for most of the GUI interactions. It also triggers requests
// executed by the user
/*jshint esversion: 6 */

//source field for the calendar, 'events' are the appointments
let source = {
    events: [],
    color: 'black',
    textColor: 'yellow'
};

let currentParticipant = ""; // currently selected participant
let currentCalendar = "Business"; // currently selected calendar => both are necessary for the view
let currentID = ""; // currently selected appointment, necessary to reset state of inputform after update
let currentEvent = {}; // current version of appointment, necessary to compare with updated one
let allDayChecked = false; // is allday radio checked? influences appearance of inputform
let participantsList = []; // list of available participants shown in the comboBox
$(document).ready(function () {
    initialize(); //initializes GUI
    let $calendars = $('#calendar-1, #calendar-2');
    $calendars.each(function (i, elem) {
        $(elem).fullCalendar({
            header: { // set header elements and style of FullCalendar
                left: "prev,next",
                center: "",
                right: 'agendaWeek'
            },
            defaultView: "agendaWeek",
            allDaySlot: true,
            minTime: "08:00:00",
            maxTime: "19:00:00",
            height: 500,
            draggable: true,
            eventSources: [],
            eventClick: function (calEvent, jsEvent, view) {
                eventClick(calEvent); // event, if an event (appointment in fullCalendar) is clicked
            },
            dayClick: function (date, jsEvent, view) {
                dayClick(i+1, date); //event, if empty timeslot in fullCalendar is clicked
            }
        });
    });
});

function onEnterNewParticipant(event) // event, if new participant is entered in regarding textBox and 'enter' is clicked
{
    code = event.keyCode;
    if (code == 13)
        addNewParticipant(event); //send addParticipant request to server
}

function onEnterComment(event) // event, ... new comment ...
{
    code = event.keyCode;
    if (code == 13)
        addComment(event); //send addComment request to server
}

function onChangeCbNames(e) { // event, if another participant was selected
    let calendarId = parseInt(e.id.match(/\d/)[0]);
    let valueSelected = e.value;
    currentParticipant = valueSelected;
    clearForm([calendarId]); // set all textfields to empty
    getUpdates(calendarId); //request data for the new view from the server
}

function onAllDayClick(dom){
    debugger;
    let calendarId = parseInt(dom.id.match(/\d/)[0]);
    handleAllDayCBClick(calendarId, dom);
}


function handleAllDayCBClick(calendarId, cb) { //depending on the selection of 'allDay' the 'endDate' field is shown or not
    allDayChecked = cb.checked;
    if (allDayChecked)
        document.getElementById('iendDate-'+calendarId).style.visibility = "hidden";
    else
        document.getElementById('iendDate-'+calendarId).style.visibility = "visible";
}

function onRemoveParticipants(dom) { // send removeParticipant-request to the server
    let calendarId = parseInt(dom.id.match(/\d/)[0]);
    removeParticipant(calendarId);
}

function getAppointmentFromForm(calendarId) { // read appointment from inputform
    let name = document.getElementById('iname-'+calendarId).value;
    let sDate = new Date(document.getElementById('istartDate-'+calendarId).value);
    sDate.setHours(sDate.getHours());
    let eDate = new Date(document.getElementById('iendDate-'+calendarId).value);
    eDate.setHours(eDate.getHours());
    let desc = $('#desc-'+calendarId).val();
    let allday = isAllDayChecked();
    let description = document.getElementById("idesc-"+calendarId).value;
    let priority = document.getElementById("ipriority-"+calendarId).value;
    let res = {
        id: 0,
        title: name,
        start: sDate,
        end: eDate,
        allDay: allday,
        description: description,
        participants: getSelectedParticipants(),
        priority: priority
    };
    return res;
}

function clearForm(calendarIds) { // set all input fields to empty and shows inputform
    calendarIds.forEach(function (calendarId) {
        currentID = "";
        document.getElementById("iallDay-" + calendarId).checked = false;
        handleAllDayCBClick(calendarId, document.getElementById("iallDay-" + calendarId));
        document.getElementById("istartDate-" + calendarId).value = new Date();
        document.getElementById("iendDate-" + calendarId).value = new Date();
        $('#iname-' + calendarId).val("");
        $('#idesc-' + calendarId).val("");
        $('#ipriority-' + calendarId).val("");
        setComments(calendarId, []);
        document.getElementById("iedit-" + calendarId).disabled = true;
        document.getElementById("idelete-" + calendarId).disabled = true;
        document.getElementById("iadd-" + calendarId).disabled = true;
        document.getElementById("iCommentInput-" + calendarId).disabled = true;
        let container = $('#iSelParticipants-' + calendarId);
        let inputs = container.find('input');
        let id = inputs.length;
        // TODO SOLVE THE ISSUE WITH PARTICIPANT
        for (let i = 1; i <= id; i++) //deselect all patricipants
            document.getElementById("participant" + i).checked = false;
        showInput(calendarId); 
    });
}

function setEventToForm(calendarId, ev) { //if an event(appointment) was clicked, the regarding data is set to the inputform
    // ev is a appointment JSON-structure
    currentID = ev.id;
    document.getElementById("iallDay-"+calendarId).checked = ev.allDay;
    handleAllDayCBClick(calendarId, document.getElementById("iallDay-"+calendarId));
    let start = new Date(ev.start);
    let end;
    if (ev.end == null) { // if its an allDay event, the 'end' property has to be set to a value to prevent nullpointerExpt
        end = start;
        end.setMinutes(start.getMinutes() + 30);
    } else
        end = new Date(ev.end);
    let str1 = start.getFullYear() + "-" + // transform date to string in format: 'yyyy-mm-ddThh:mm'
        ((start.getMonth() + 1).toString().length < 2 ? "0" + (start.getMonth() + 1) : (start.getMonth() + 1)) +
        "-" +
        (start.getDate().toString().length < 2 ? "0" + (start.getDate()) : (start.getDate())) + "T" +
        ((start.getHours() - 2).toString().length < 2 ? "0" + (start.getHours() - 2) : (start.getHours() - 2)) + ":" +
        (start.getMinutes().toString().length < 2 ? "0" + start.getMinutes() : start.getMinutes());
    document.getElementById('istartDate-'+calendarId).value = str1;
    let str2 = end.getFullYear() + "-" +
        ((end.getMonth() + 1).toString().length < 2 ? "0" + (end.getMonth() + 1) : (end.getMonth() + 1)) + "-" +
        (end.getDate().toString().length < 2 ? "0" + (end.getDate()) : (end.getDate())) + "T" +
        ((end.getHours() - 2).toString().length < 2 ? "0" + (end.getHours() - 2) : (end.getHours() - 2)) + ":" +
        (end.getMinutes().toString().length < 2 ? "0" + end.getMinutes() : end.getMinutes());
    document.getElementById('iendDate-'+calendarId).value = str2;
    $('#iname-'+calendarId).val(ev.title);
    $('#idesc-'+calendarId).val(ev.description);
    $('#ipriority-'+calendarId).val(ev.priority);
    let comments = ev.comments;
    setComments(calendarId, comments); //add comments to regarding div
    setSelectedParticipants(calendarId, ev.participants); // select assigned participants
}

function isAllDayChecked() { //returns flag, if field 'allDay' is checked in the current appointment
    return allDayChecked;
}

function initialize() { // initializes GUI and fullCalendar with default values
    // clear forms of both calendars
    clearForm([1, 2]); //
    currentCalendar = "Business";
    $('#cbcalendars').val(currentCalendar);
}


function dayClick(calendarId, date) { // if an empty time slot is clicked, add the time and ...
    // ...the current selected patricipant to the inputform. date is of type Date
    let start = new Date(date);
    start.setHours(start.getHours());
    let end = new Date(date);
    end.setMinutes(end.getMinutes() + 30);
    end.setHours(end.getHours());
    clearForm([calendarId]);
    setEventToForm(calendarId, {
        start: start,
        end: end,
        participants: [currentParticipant]
    });
    document.getElementById("iadd-"+calendarId).disabled = false;
}

function eventClick(ev) { // if an event(appointment) is clicked, set the values to the inputform. ev is the JSON-struct
    debugger;
    
    if ("conflict" in ev) // in case of a conflict, the event consists of ev.app and ev. conflict. Else, it covers just the properties
    {
        showChoose(); //if a conflict is detected, change the inputform to the chooseform (with value versions)
        setEventToChooseForm(ev.app); //and add the conflicting values to it
        return;
    }
    setEventToForm(ev);
    currentEvent = ev;
    document.getElementById("iadd").disabled = true;
    document.getElementById("iedit").disabled = false;
    document.getElementById("idelete").disabled = false;
    document.getElementById("iCommentInput").disabled = false;
    getUpdates(); // get new updates to check, if appointment has changed
}

function getSelectedParticipants(calendarId) { // return a list of selected participants of inputform
    let container = $('#iSelParticipants-'+calendarId);
    let inputs = container.find('input');
    let id = inputs.length;
    let names = [];
    // TODO SOLVE THE ISSUE WITH PARTICIPANTS
    for (let i = 1; i <= id; i++) {
        let x = document.getElementById("participant" + i);
        if (x.checked)
            names.push(x.value);
    }
    return names;
}

function setSelectedParticipants(calendarId, participants) { // select participants in inputform, if they appear in 'participants'
    if (participants == undefined)
        return;
    let container = $('#iSelParticipants-'+calendarId);
    let inputs = container.find('input');
    let id = inputs.length;
    for (let i = 0; i < participants.length; i++)
        // TODO SOLVE THE ISSUE WITH PARTICIPANTS
        for (let j = 1; j <= id; j++) {
            let x = document.getElementById("participant" + j);
            if (x.value == participants[i])
                x.checked = true;
        }
}

function addCheckbox(calendarId, name) { //add new Checkbox for the given 'name' to the regarding field in the inputform
    let container = $('#iSelParticipants-'+calendarId);
    let inputs = container.find('input');
    let id = inputs.length + 1;
    let newItem = $('<li>');
    $('<input />', {
        type: 'checkbox',
        id: 'participant' + id,
        value: name
    }).appendTo(newItem);
    $('<label />', {
        'for': 'cb' + id,
        text: name
    }).appendTo(newItem);
    newItem.appendTo(container);
}

function setParticipants(calendarId, participants) { // set available participants to comboBox (selectable for view)
    participantsList = participants;
    let tmp = currentParticipant;
    let isEmpty = (currentParticipant == "" || (typeof currentParticipant == "undefined")) ? true : false;
    let x = document.getElementById("cbNames-" + calendarId);
    $('#cbNames-' + calendarId).empty();
    x.size = 1;
    $('#iSelParticipants-'+calendarId).empty();
    for (let i = 0; i < participants.length; i++) {
        let option1 = document.createElement("option");
        option1.text = participants[i];
        let option2 = document.createElement("option");
        option2.text = participants[i];
        x.add(option1);
    }
    for (let i in participants) {
        addCheckbox(calendarId, participants[i]);
    }
    if (isEmpty) {
        x.value = participants[0];
        currentParticipant = participants[0];
        if (!(currentParticipant == "" || currentParticipant == undefined))
            getUpdates(calendarId);
    } else {
        x.value = tmp;
        currentParticipant = tmp;
    }
}

function setComments(calendarId, comments) { //add comments to field in inputform
    if (comments == undefined)
        return;
    comments.sort(); //sort all comments to date of creation
    $('#iCommentBox-' + calendarId).empty();
    for (var i in comments) {
        $('#iCommentBox-'+calendarId).append(
            $('<li></li>').append(
                $('<span>').text(comments[i]))
        );
    }
}

function showInput(calendarId) { //show inputform (for appointment)
    let input = $('#appInputForm-'+calendarId);
    let choose = $('#appChooseForm-'+calendarId);
    choose.hide();
    input.show();
}

function showChoose(calendarId) { //show chooseForm (for conflicting values in appointment)
    let input = $('#appInputForm-' + calendarId);
    let choose = $('#appChooseForm-' + calendarId);
    input.hide();
    choose.show();
}

function enableInput(calendarId) { //enable inputform in 'no global' calendar
    $("#appInputForm-"+calendarId).removeClass("disabledbutton");
}

function disableInput(calendarId) { // disable inputform by 'global' calendar => readonly
    $("#appInputForm-"+calendarId).addClass("disabledbutton");
}

function getAppointmentFromChooseForm(calendarId) { // get the solved conflict appointment from chooseForm
    let name = document.getElementById('cname-' + calendarId).value;
    let x = document.getElementById("cstartDate-"+calendarId).value;
    let sDate = new Date(document.getElementById('cstartDate-'+calendarId).value);
    sDate.setHours(sDate.getHours());
    let eDate = new Date(document.getElementById('cendDate-'+calendarId).value);
    eDate.setHours(eDate.getHours());
    let allday = document.getElementById("cendDate-"+calendarId).value == "true" ? true : false;
    let description = document.getElementById("cdesc-"+calendarId).value;
    let priority = document.getElementById("cpriority-"+calendarId).value;
    let res = {
        id: 0,
        title: name,
        start: sDate,
        end: eDate,
        allDay: allday,
        description: description,
        participants: [],
        priority: priority
    };
    return res;
}

function setEventToChooseForm(ev) { // set conflicting appointment to chooseForm (comboBoxes)
    debugger;
    currentID = ev.id[0];
    $('#cname').empty();
    let x = document.getElementById("cname");
    for (let i = 0; i < ev.title.length; i++) {
        let option1 = document.createElement("option");
        option1.text = ev.title[i];
        x.add(option1);
    }
    $('#cdesc').empty();
    x = document.getElementById("cdesc");
    for (let i = 0; i < ev.description.length; i++) {
        let option1 = document.createElement("option");
        option1.text = ev.description[i];
        x.add(option1);
    }
    $('#cpriority').empty();
    x = document.getElementById("cpriority");
    for (let i = 0; i < ev.priority.length; i++) {
        let option1 = document.createElement("option");
        option1.text = ev.priority[i];
        x.add(option1);
    }
    $('#cstartDate').empty();
    x = document.getElementById('cstartDate');
    let y = document.getElementById('cendDate');
    for (let i = 0; i < ev.start.length; i++) {
        let start = new Date(ev.start[i]);
        let str1 = start.getFullYear() + "-" +
            ((start.getMonth() + 1).toString().length < 2 ? "0" + (start.getMonth() + 1) : (start.getMonth() + 1)) + "-" +
            (start.getDate().toString().length < 2 ? "0" + (start.getDate()) : (start.getDate())) + "T" +
            ((start.getHours() - 2).toString().length < 2 ? "0" + (start.getHours() - 2) : (start.getHours() - 2)) + ":" +
            (start.getMinutes().toString().length < 2 ? "0" + start.getMinutes() : start.getMinutes());
        let option1 = document.createElement("option");
        option1.text = str1;
        x.add(option1);
    }
    $('#cendDate').empty();

    for (let i = 0; i < ev.end.length; i++) {
        let end = new Date(ev.end[i]);
        let str2 = end.getFullYear() + "-" +
            ((end.getMonth() + 1).toString().length < 2 ? "0" + (end.getMonth() + 1) : (end.getMonth() + 1)) + "-" +
            (end.getDate().toString().length < 2 ? "0" + (end.getDate()) : (end.getDate())) + "T" +
            ((end.getHours() - 2).toString().length < 2 ? "0" + (end.getHours() - 2) : (end.getHours() - 2)) + ":" +
            (end.getMinutes().toString().length < 2 ? "0" + end.getMinutes() : end.getMinutes());
        let option1 = document.createElement("option");
        option1.text = str2;
        if (document.getElementById('cendDate') != null)
            y.add(option1);
    }
    for (let i = 0; i < ev.allDay.length; i++) {
        let option1 = document.createElement("option");
        option1.text = ev.allDay[i];
        if (option1.text == "true")
            if (document.getElementById('cendDate') != null)
                y.add(option1);
    }
}