var router = require('express').Router();

var Brain = new require('./brain');
var brain = new Brain();

router.get('/test/:message', function (req, res) {
    var message = decodeURIComponent(req.params.message);
    brain.processExpression(message).then(function (result) {
        res.send(result);
    }, function (err) {
        res.status(500).send(err);
    });
});

module.exports = router;