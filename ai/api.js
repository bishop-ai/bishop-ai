var router = require('express').Router();

var brain = new require('./brain');

router.get('/test/:message', function (req, res) {
    var message = decodeURIComponent(req.params.message);
    brain.processExpression(message).then(function (result) {
        res.send(result);
    }, function (err) {
        res.status(500).send(err);
    });
});

module.exports = router;