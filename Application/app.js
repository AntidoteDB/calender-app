(function () {
    'use strict';

    const antidote = require('antidote_ts_client');
    const express = require('express');
    const path = require('path');
    const favicon = require('serve-favicon');
    const logger = require('morgan');
    const cookieParser = require('cookie-parser');
    const bodyParser = require('body-parser');
    const {
        spawn
    } = require('child_process');
    const compression = require('compression');
    const helmet = require('helmet');
    const wrapper = require('./wrapper.js');

    const DEBUG = true;

    function log(...args) {
        if (DEBUG) {
            console.log(...args);
        }
    }

    const app = express();

    app.use(helmet());
    app.use(compression()); // Compress all routes
    app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
    app.use(logger('dev'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: false
    }));
    app.use(cookieParser());
    app.use(express.static(path.join(__dirname, 'public')));

    const viewPath = __dirname + '/views/';

    /* Static web page routing. */
    var staticRouter = express.Router();
    staticRouter.get('/', function (req, res, next) {
        res.sendFile(viewPath + 'index.html');
    });
    app.use("/", staticRouter);

    /* API routing. */
    var apiRouter = express.Router();

    // this file defines the available routes accessible by the client via http-requests.
    // json structure gets extracted and forwarted to the wrapper (wrapper.js) inclusive 'res' parameter

    // 'req' = request data, 'res' is result value for sending back data to the client
    apiRouter.post("/:calendar_id/update", function (req, res) {
        let calendarId = req.params.calendar_id;
        let repId = parseInt(req.params.rep_id);
        console.log("try to request updates for participant: " + req.body.participant + ", calendar: " + req.body.calendar);
        let value = req.body;
        wrapper.getUpdates(calendarId, value.participant, value.calendar, res);
    });

    apiRouter.post("/addAppointment", function (req, res) {
        console.log("try to add Appointment " + JSON.stringify(req.body.appointment) + " to calendar: " + req.body.calendar);
        let value = req.body;
        wrapper.addAppointment(value.calendar, value.appointment, res);
    });
    apiRouter.post("/:calendar_id/addParticipant", function (req, res) {
        let calendarId = req.params.calendar_id;
        let value = req.body;
        console.log("try to add Participant: " + value.name);
        wrapper.addParticipant(calendarId, value.name, res);
    });
    apiRouter.post("/removeAppointment", function (req, res) {
        let value = req.body;
        console.log("try to remove appointment with id " + value.id);
        wrapper.removeAppointment(value.id, res);
    });
    apiRouter.post("/editAppointment", function (req, res) {
        let value = req.body;
        console.log("try to edit appointment with id: " + value.id);
        console.log("edit app: " + JSON.stringify(value));
        wrapper.editAppointment(value.id, value.app, value.calendar, value.comment, res);
    });
    apiRouter.post("/addComment", function (req, res) {
        let value = req.body;
        console.log("try to add comment to app (id: " + value.id + "), comment: " + value.comment);
        wrapper.addComment(value.id, value.comment, res);
    });
    apiRouter.post("/removeParticipant", function (req, res) {
        let value = req.body;
        console.log("try to remove Participant " + value.participant);
        wrapper.removeParticipant(value.participant, res);
    });

    app.use("/api", apiRouter);

    /* Default routing. */
    app.use("*", function (req, res) {
        res.sendFile(viewPath + "404.html");
    });

    //return router
    //module.exports = router;

    module.exports = app;
}());