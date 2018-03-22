var express = require('express');
var app = express();

app.get('/', function(req, res) {res.send('Hello World!')});

app.use(express.static("../"));

app.post('/api/user', function(req, res) {
    console.log(req.body);
    console.log(req.params);
    res.send('success');
});

app.get('/api/problems/0', function(req, res) {
    res.send({
            id: 0,
            content: 'How many regions has Microsoft Azure GAed across the globe',
            category: 'tech',
            options: ['32', '36', '40', '44'],
            answer: 1,
    });
});

app.listen(8080, function() {console.log('Example app listening on port 8080!')});