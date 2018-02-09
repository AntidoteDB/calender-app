let storage = require('./storage.js');

// 'res' is the result value for sending back data to the client.
// the view is defined by parameters 'participant' and 'calendar'

exports.addAppointment = function(calendar,app,res){
    let result = storage.writeNewAppointment(calendar,app); //write new appointment to storage
    result.then(_=>{res.send({result:true});}) // if operation was successful, a true flag is sent to the client
        .catch(err=>{console.log("Failed to add Appointment", err);res.send({result:false});});
};
exports.editAppointment = function(id,app,calendar,comment,res){
    let result = storage.updateAppointment(id,app,calendar,comment,res); //update appointment in antidote
    result.then(_=>{console.log("Appointment successfully edited with id: " + id + ", try to read all Appointments");
        res.send({result:true});
    })
        .catch(err=>{console.log("Failed to edit Appointment", err);res.send({result:false});});
};
exports.removeAppointment = function(id,res){
    let result = storage.deleteAppointment(id);
    result.then(_=>{console.log("Appointment successfully removed with id: " + id);res.send({result:true});})
        .catch(err=>{console.log("Failed to remove Appointment", err);res.send({result:false});});
};
exports.addComment = function(id,comment,res){
    let result = storage.writeComment(id,comment);
    result.then(_=>{/*console.log("Comment " + comment + " to app " + id);*/res.send({result:true});})
        .catch(err=>{console.log("Failed to add Comment", err);res.send({result:false});});
};
exports.getUpdates = function(participant, calendar, res){
    //this request requires more database operations (nested query), therefore this procedure is more complex
    let updateObject = {participants : [],apps:[]}; //create empty object, that will be sent back to the client
    let UserApps,UserApps2, AllApps;
    let isGlobal = calendar=="Global"?true:false; // check, if the calendar is global. (then we need appointments from all of them=
    let y,y2;
    let x = storage.readAllParticipants();
    if(isGlobal) {
        y = storage.readAllUserAppos(participant, "Privat");
        y2 = storage.readAllUserAppos(participant,"Business");
    }
    else
        y = storage.readAllUserAppos(participant, calendar);
    let z = storage.readAllAppointments();

    x.then(valuea=> {
            updateObject.participants = valuea;
        y.then(valueb=> {
            if(isGlobal){
                y2.then(valuec=>{
                    UserApps = valueb;
                    UserApps2 = valuec;
                })
                    .catch(err=>console.log("Error read value for UserApps2 (global calendar!",err));
            }
            else {
                UserApps = valueb;
            }
            z.then(value=> {
                if(isGlobal) {
                    AllApps = value.toJsObject(); //convert Map of Maps to JSON (Dictionary)
                    if (!"length" in value.entries)
                        console.log("fehler gefunden");
                    if (value.entries.length > 0) {
                        var apps1 = compareAppsWithUserApps(AllApps, UserApps); //join allApps and UserApps by aId
                        apps1 = coloringApp(apps1, "green"); //set different color to show them differently for user in client
                        var apps2 = compareAppsWithUserApps(AllApps, UserApps2); //join allApps and UserApps by aId
                        apps2 = coloringApp(apps2, "blue"); //set different color to show them differently for user in client
                        updateObject.apps = apps1.concat(apps2); //calendar is global, therefore add appointments from both calendars private and business
                    }
                }
                else
                {
                    AllApps = value.toJsObject(); //convert Map of Maps to JSON (Dictionary)
                    if (!"length" in value.entries)
                        console.log("fehler gefunden");
                    if (value.entries.length > 0) {
                        updateObject.apps = compareAppsWithUserApps(AllApps, UserApps); // join...
                    }
                }
                res.send(updateObject); //send the filled object with apps and participants to the client

            }).catch(err => {console.log("GetUpdates: Participants send back to client, readAllAppointments failed",err);res.send(updateObject);})
        }).catch(err => {console.log("GetUpdates: Participants send back to client, readAllUserAppos failed",err);res.send(updateObject);})
    }).catch(err => console.log("Wrapper.getUpdates: failed to read Updates, readAllParticipants failed",err))


};
exports.addParticipant = function (participant,res) { // add new participant to storage
    let result = storage.addParticipant(participant);
    result.then(_=>{res.send({result:true});})
        .catch(err=>{console.log("Failed to add Participant", err);res.send({result:false});});
};
exports.removeParticipant = function (participant, res) { // remove participant from storage
    let result = storage.deleteParticipant(participant);
    result.then(_=>{
        res.send({result:true});
    })
        .catch(err => {console.log("wrapper: failed to delete participant " + participant, err), res.send({result:false})});
};
function compareAppsWithUserApps(apps,userapps){ // calculates join to get necessary appointment structures
    let result = [];
    if(userapps==undefined || apps==undefined)
        return result;
    for(let i =0;i<userapps.length;i++){
        let key = ((userapps[i]));
        if(key in apps) {
            let app = MapToJSON(apps[userapps[i]]); // transformation from array (due to MVRs) to single values
            result.push(app);
        }
    }
    return result;
}

function MapToJSON(map) { // eliminates the array structure due to MVRs and ad conflict flag if necessary
    if(Array.isArray(map))
        map = map[0];
    let isConflict = isConflicted(map);
    let app = {
        id: map.id[0],
        title: map.title[0],
        start: map.start[0],
        end: map.end[0],
        allDay: map.allDay[0],
        description: map.description[0],
        participants: map.participants,
        priority : map.priority[0],
        comments: map.comments
    };
    if(isConflict) { // in case of conflict, app covers the conflict flag and the real application structure. else, it only covers the properties
        app.conflict = true;
        app.app = map;
    }
    return app;
}

/*function isConflicted(app){
    var conflict = false;
    if(app.id.length>1)
        conflict = true;
    if(app.title.length>1)
        conflict = true;
    if(app.start.length>1)
        conflict = true;
    if(app.end.length>1)
        conflict = true;
    if(app.allDay.length>1)
        conflict = true;
    if(app.description.length>1)
        conflict = true;
    if(app.priority.length>1)
        conflict = true;
    return conflict;
}*/

function isConflicted(app){
    let conflict = false;
    if(app.id.length>1 || app.title.length>1 || app.start.length>1 || app.end.length>1 || app.allDay.length>1 || app.description.length>1 || app.priority.length>1)
        conflict = true;
    return conflict;
}

function coloringApp(apps, color) { //add color to appointment depending on the calendar (only if global view)
    for(let app in apps)
        apps[app].backgroundColor = color;
    return apps;
}
