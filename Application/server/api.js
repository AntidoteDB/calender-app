//dependecies
let express = require('express');
let router = express.Router();
let wrapper = require('./wrapper.js');

// this file defines the available routes accessible by the client via http-requests.
// json structure gets extracted and forwarted to the wrapper (wrapper.js) inclusive 'res' parameter

// 'req' = request data, 'res' is result value for sending back data to the client
router.post("/update", function (req,res) {
    console.log("try to request updates for participant: " + req.body.participant + ", calendar: " + req.body.calendar);
    let value = req.body;
    wrapper.getUpdates(value.participant, value.calendar, res);
});

router.post("/addAppointment", function (req, res) {
    console.log("try to add Appointment " + JSON.stringify(req.body.appointment) + " to calendar: " + req.body.calendar);
    let value = req.body;
    wrapper.addAppointment(value.calendar,value.appointment,res);
});
router.post("/addParticipant", function (req, res) {
    let value = req.body;
    console.log("try to add Participant: " + value.name);
    wrapper.addParticipant(value.name, res);
});
router.post("/removeAppointment", function (req, res) {
    let value = req.body;
    console.log("try to remove appointment with id " + value.id);
    wrapper.removeAppointment(value.id,res);
});
router.post("/editAppointment", function (req, res) {
    let value = req.body;
    console.log("try to edit appointment with id: " + value.id);
    console.log("edit app: " + JSON.stringify(value));
    wrapper.editAppointment(value.id,value.app,value.calendar,value.comment,res);
});
router.post("/addComment", function (req, res) {
    let value = req.body;
    console.log("try to add comment to app (id: " + value.id + "), comment: " + value.comment);
    wrapper.addComment(value.id, value.comment, res);
});
router.post("/removeParticipant", function (req,res) {
    let value = req.body;
    console.log("try to remove Participant " + value.participant);
    wrapper.removeParticipant(value.participant, res);
});
//return router
module.exports = router;
