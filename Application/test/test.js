var superagent = require('superagent');
var assert = require('assert');
var express = require('express');
var path = require('path');
var port = 3000; //testing port
var calendar = "Privat";
var participant = "testParticipant";
var id1;
var id2;
describe('calendar api', function() {
    it('update gets correct object', function (done) {
        superagent
            .post('http://localhost:' + port + "/api/update")
            .send({participant: participant, calendar:calendar})
            .end(function (res) {
                assert.equal(res.status, 200, "status code is not 200, but " + res.status);
                assert(res.body.hasOwnProperty("participants"), "response has no property 'participants'");
                assert(res.body.hasOwnProperty("apps"), "response has no property 'apps'");
                done();
            })
    });

    it('addParticipant', function (done) {
        console.log("try to add participant 'testPerson'");
        superagent
            .post('http://localhost:' + port + "/api/addParticipant")
            .send({name: participant})
            .end(function (res) {
                assert.equal(res.status, 200, "status code is not 200, but " + res.status);
                getUpdates(function (updates) {
                    console.log("updates: " + JSON.stringify(updates.body));
                    assert(updates.body.participants.contains(participant), "testPerson is not included");
                    done();
                });
            })
    });

    it('addAppointment', function (done) {
            console.log("try to add appointment");
            var app = {
                title: "testAppointment",
                start: new Date("2016-01-01T11:00:00"),
                end: new Date("2016-01-01T13:30:00"),
                allDay : false,
                description : "testDescription",
                participants: [participant],
                priority: 5,
                comments: []
            };
            superagent
                .post('http://localhost:' + port + "/api/addAppointment")
                .send({calendar: calendar, appointment: app })
                .end(function(res){
                    assert.equal(res.status, 200, "status code is not 200, but " + res.status);
                    getUpdates(function (updates) {
                        console.log("updates: " + JSON.stringify(updates.body));
                        assert.equal(updates.body.apps[0].title, app.title, "title. expected: " + app.title + " got: " + updates.body.apps[0].title);
                        assert.equal(updates.body.apps[0].description, app.description, "description. expected: " + app.description + " got: " + updates.body.apps[0].description);
                        //necessary for equality..
                        id1 = updates.body.apps[0].id;
                        done();
                    })
                })
        });
    it('addAppointment2', function (done) {
        console.log("try to add appointment");
        var app = {
            title: "testAppointment2",
            start: new Date("2017-05-02T11:00:00"),
            end: new Date("2017-05-02T13:30:00"),
            allDay : false,
            description : "testDescription2",
            participants: [participant],
            priority: 7,
            comments: []
        };
        superagent
            .post('http://localhost:' + port + "/api/addAppointment")
            .send({calendar: calendar, appointment: app })
            .end(function(res){
                assert.equal(res.status, 200, "status code is not 200, but " + res.status);
                getUpdates(function (updates) {
                    console.log("updates: " + JSON.stringify(updates.body));
                    assert.equal(updates.body.apps[1].title, app.title, "title. expected: " + app.title + " got: " + updates.body.apps[1].title);
                    assert.equal(updates.body.apps[1].description, app.description, "description. expected: " + app.description + " got: " + updates.body.apps[1].description);
                    //necessary for equality..
                    id2 = updates.body.apps[1].id;
                    done();
                })
            })
    });
    it('editAppointment', function (done) {
        console.log("try to edit appointment");
        var app = {
            title: "testAppointment2",
            id : id2,
            removedParticipants: [],
            addedParticipants: []
        };
        console.log(id2 + ", " + app + ", " + calendar + ", ");
        superagent
            .post('http://localhost:' + port + "/api/editAppointment")
            .send({id:id2, app:app,calendar:calendar, comment:"k"})
            .end(function(res){
                //assert.equal(res.status, 200, "status code is not 200, but " + res.status);
                getUpdates(function (updates) {
                    console.log("updates: " + JSON.stringify(updates.body));
                    assert.equal(updates.body.apps[1].title, app.title, "title. expected: " + app.title + " got: " + updates.body.apps[1].title);
                    //necessary for equality..
                    done();
                })
            })
    });

    it('addComment', function (done) {
        console.log("try to add comment");
        var app = {
            title: "testAppointment2",
            id : id1,
            removedParticipants: [],
            addedParticipants: []
        };
        console.log(id1 + ", " + app + ", " + calendar + ", ");
        superagent
            .post('http://localhost:' + port + "/api/addComment")
            .send({id:id1, comment:"k2"})
            .end(function(res){
                assert.equal(res.status, 200, "status code is not 200, but " + res.status);
                getUpdates(function (updates) {
                    console.log("updates: " + JSON.stringify(updates.body));
                    var isContained = updates.body.apps[0].comments.contains("k2");
                    assert(isContained, "comment is not contained");
                    //necessary for equality..
                    done();
                })
            })
    });

    it('deleteAppointment', function (done) {
        console.log("try to delete appointment");
        superagent
            .post('http://localhost:' + port + "/api/removeAppointment")
            .send({id:id2, comment:"deleteStamp"})
            .end(function(res){
                assert.equal(res.status, 200, "status code is not 200, but " + res.status);
                getUpdates(function (updates) {
                    console.log("updates: " + JSON.stringify(updates.body));
                    var isDeleted = true;
                    var iMax = updates.body.apps.length;
                    for(var i = 0; i<iMax;i++){
                        console.log("current i: " + i + "\ncurrent app: " + updates.body.apps[i]);
                        console.log(JSON.stringify(updates.body));
                        isDeleted &= !(updates.body.apps[i].id == (id2));
                    }
                    assert(isDeleted, "id is still in sotrage after deleting");
                    done();
                })
            })
    });

    it('deleteParticipant', function (done) {
        superagent
            .post('http://localhost:' + port + "/api/addParticipant")
            .send({name: "testP2"})
            .end(function (res) {
                console.log("try to delete participant");
                superagent
                    .post('http://localhost:' + port + "/api/removeParticipant")
                    .send({participant: "testP2"})
                    .end(function(res){
                        assert.equal(res.status, 200, "status code is not 200, but " + res.status);
                        getUpdates(function (updates) {
                            var isDeleted = true;
                            var iMax = updates.body.participants.length;
                            console.log("Participants length: " + iMax + "\n" + JSON.stringify(updates.body.participants));
                            for(var i = 0; i<iMax;i++){
                                isDeleted &= !(updates.body.participants[i] == "testP2");
                            }
                            assert(isDeleted, "participant is still in sotrage after deleting");
                            done();
                        })
                    })
            })

    });
});


function getUpdates(func){
    superagent
        .post('http://localhost:' + port + "/api/update")
        .send({participant: participant, calendar:calendar})
        .end(function (res) {
            func(res);
        });
}

Array.prototype.contains = function(obj) {
    var i = this.length;
    var result = false;
    while (i--) {
        result |= (this[i] === obj);
    }
    return result;
}