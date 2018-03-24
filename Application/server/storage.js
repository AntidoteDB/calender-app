let express = require('express');
let app = express();
let	antidoteClient = require('antidote_ts_client');

let antidote = antidoteClient.connect(process.env.ANTIDOTE_PORT||8087, process.env.ANTIDOTE_HOST || "localhost");
antidote.requestTimeoutMs = 5000;

//===== Data modeling
let UserSet = antidote.set("users"); // Set of available participants

let AppMap = antidote.map("appointments"); // AppMap, Map of Map of Appointments

function UserApps(user,calendar) {      // Function returning the Set of aIds for the given view
    return antidote.map(user + "_apps").set(calendar);
}
//===================================

UserSet.read().then(_=>console.log("Connection established to antidote with UserSet: " + _))
    .catch(err=>console.log("Connection to antidote failed", err)); // dummy read to check if connection is available

//====== get a unique server id
let date = new Date();
let ident = "server_" + date.getFullYear()+ "." + (date.getMonth()+1) + "." + date.getDate() + "T" + date.getHours() + ":" + date.getMinutes() +
    ":" + date.getSeconds() + ":" + date.getMilliseconds();
let count = 1;
//=================================



//================ performing elementary database operations
exports.readAllUserAppos = function(user,calendar){ //all aIds of an user,calender tuple;
    return UserApps(user,calendar).read();
};
exports.readAllAppointments = function(){ // all aId-Appointment tuples
    return AppMap.read();
};
exports.readAllParticipants = function(){ // all participants
    return UserSet.read();
};
exports.addParticipant = function(participant){
    return antidote.update(UserSet.add(participant))
};
exports.writeNewAppointment = function(calendar,app){
    let id = getNewId();
    app.id = id;
    let userApps;
    let participants = app.participants;
    for(let p in participants){
        userApps = UserApps(participants[p], calendar);
        antidote.update(userApps.add(id));
    }

    return antidote.update(
        [
            AppMap.map(id).multiValueRegister("id").set(app.id),
            AppMap.map(id).multiValueRegister("title").set(app.title),
            AppMap.map(id).multiValueRegister("start").set(app.start),
            AppMap.map(id).multiValueRegister("end").set(app.end),
            AppMap.map(id).multiValueRegister("allDay").set(app.allDay),
            AppMap.map(id).multiValueRegister("description").set(app.description),
            AppMap.map(id).set("participants").addAll(app.participants),
            AppMap.map(id).multiValueRegister("priority").set(app.priority),
            AppMap.map(id).set("comments").addAll(app.comments),
            //userApps.add(id)
        ]
    );
};
exports.updateAppointment = function(aId, app,calendar,comment,res) {
    // more complex procedure, since the update influences more than only the AppMap (assigned Participants)
    let userSet;
    antidote.update(AppMap.map(aId).multiValueRegister("id").set(app.id));
    let updates = [];
    if(app.hasOwnProperty("title"))
        updates.push(AppMap.map(aId).multiValueRegister("title").set(app.title));
    if(app.hasOwnProperty("start"))
        updates.push(AppMap.map(aId).multiValueRegister("start").set(app.start));
    if(app.hasOwnProperty("end"))
        updates.push(AppMap.map(aId).multiValueRegister("end").set(app.end));
    if(app.hasOwnProperty("allDay"))
        updates.push(AppMap.map(aId).multiValueRegister("allDay").set(app.allDay));
    if(app.hasOwnProperty("description"))
        updates.push(AppMap.map(aId).multiValueRegister("description").set(app.description));
    if(app.hasOwnProperty("priority"))
        updates.push(AppMap.map(aId).multiValueRegister("priority").set(app.priority));
    antidote.update(updates);
    antidote.update(AppMap.map(aId).set("comments").add(comment));
    return UserSet.read()
        .then(_=>{
            userSet = _;
            // following is the correct version of assigned participants. (added/removed participants instead of assignedParticipants)
            let remove = antidote.update(AppMap.map(aId).set("participants").removeAll(app.removedParticipants));
            remove.then(_=>{
                //console.log("remove " + app.removedParticipants.length + ": " + app.removedParticipants + " successfull");
                let add = antidote.update(AppMap.map(aId).set("participants").addAll(app.addedParticipants));
                add.then(_=> {
                    //console.log("adding " + app.addedParticipants.length + ": " + app.addedParticipants + " to app successfull");
                    for (let p in app.addedParticipants) {
                        antidote.update(UserApps(app.addedParticipants[p],calendar).add(aId));
                    }
                    for(let p in app.removedParticipants){
                        antidote.update(UserApps(app.removedParticipants[p], calendar).remove(aId));
                    }
                    res.send({result:true});
                })
                    .catch(err=>console.log("adding new values failed", err));
            })
                .catch(err=>console.log("remove failed", err));
        })
        .catch(err=>console.log("failed to read all names",err));
};
exports.writeComment = function(aId,comment){
    return antidote.update(AppMap.map(aId).set("comments").add(comment));
};
exports.deleteAppointment = function(aId){
    return antidote.update(AppMap.remove(AppMap.map(aId)));
};
exports.deleteParticipant = function (participant) {
    // more complex too, since the deleted participant has to be removed from all involved appointments
    // the following removes all aIds and the userapps for the given participant

    UserApps(participant, "Business").read()
        .then(priv => {
            antidote.update(UserApps(participant, "Business").removeAll(priv));
        })
        .catch(err=>console.log("failed to read Business calendar of " + participant + ". Maybe it was empty", err));
    // remove participant from all appointments
    AppMap.read()
        .then(_=>{
            let AllApps = _.toJsObject();
            for(let i in AllApps){
                //console.log("i: " + i + "AppApps: " + JSON.stringify(AllApps));
                if(contains(AllApps[i].participants,participant)) {
                    //console.log(participant + "ist in (" + AllApps[i].participants + ") enthalten");
                    antidote.update(AppMap.map(i).set("participants").remove(participant))
                        .then(res => console.log("removed " + participant + " from app.participsnts " + i))
                        .catch(err => console.log("failed remove " + participant + " from app.participnts " + i, err));
                }
            }
        })
        .catch(err=>console.log("failed to read AppMap", err));
    return antidote.update(UserSet.remove(participant));
};

//=============== helper functions

function contains(arr, elem) { // check, if an element 'elem' is contained in the array 'arr'
    let i = arr.length;
    while (i--) {
        if (arr[i] === elem) {
            return true;
        }
    }
    return false;
}
function getNewId(){ // increment the aId counter and return the current one. (so aIds stay unique)
    count++;
    return ident + "_" + count;
}
