var Hapi = require('hapi');
var Inert = require('inert');
var sqlite3 = require("sqlite3").verbose();
var file = "./Quotes.db";
var db = new sqlite3.Database(file);

var server = new Hapi.Server();

var jsonQuotes = '';

server.connection({port: 3000});
server.register(Inert, function () {
});

server.route({
    method: 'GET',
    path: '/{path*}',
    handler: {
        file: './help.html'
    }
});


function updateJsonQuotes(newValue) {
    jsonQuotes = jsonQuotes + newValue;
}

function resetJsonQuotes() {
    jsonQuotes = '';
}

server.route({
    method: 'GET',
    path: '/listQuotes',
    handler: function (request, reply) {
        var sql = 'SELECT rowid AS id,content,author FROM Quotes';
        db.serialize(function () {
            db.all(sql, function (err, rows) {
                if (err) throw err;
                if (rows.length > 0) {
                    resetJsonQuotes();
                    updateJsonQuotes('['); //begin the quote array surrounded with bracket to tell json it is an array.
                    db.each(sql, function (err, row) {
                        if (row.id < rows.length) {
                            updateJsonQuotes('{"author":"' + row.author + '", "content":"' + row.content + '"},');
                        } else {
                            updateJsonQuotes('{"author":"' + row.author + '", "content":"' + row.content + '"}]');
                        }
                    });
                }
            })
        })
        reply(jsonQuotes);
    }
});

server.route({
    method: 'GET',
    path: '/getRandomQuote',
    handler: function (request, reply) {
        var sql = 'SELECT rowid AS id,content,author FROM Quotes ORDER BY RANDOM() LIMIT 1';
        db.serialize(function () {
            db.all(sql, function (err, rows) {
                if (err) throw err;
                if (rows.length > 0) {
                    resetJsonQuotes();
                    db.each(sql, function (err, row, idToUse) {
                        updateJsonQuotes('{"author":"' + row.author + '", "content":"' + row.content + '"}');
                    });
                }
            });
        })
        reply(jsonQuotes);
    }
});

server.route({
    method: 'GET',
    path: '/help',
    handler: function (request, reply) {
        reply.file('help.html');
    }
});


server.start(function (err) {

    if (err) {
        throw err;
    }

    console.log('Server running at:', server.info.uri);
});
