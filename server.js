require('waitjs');
var express = require('express')
var app = express()
var got = require('got');
var server = require('http').createServer(app)
var io = require('socket.io').listen(server);
var order_book;
var dataOrderBook;

server.listen(3000);

//DATABASE 
pg.connect(function(err, client, done){
    if(err){
        return console.error('error fetching client from pool', err);
    }
    client.query('INSERT INTO orderdata VALUES (415.0, 1.000000, "bids", "2001-12-12")', function(err, result){
        //call 'done()' to realease the client back to the pool
        done();
        if(err){
            return console.error('error running query', err);
        }
        });
    });

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
})

//Pull Data from Bit Stamp
got('https://www.bitstamp.net/api/order_book/', function(error, data, res) {
	 order_book = data;
         //console.log(order_book);
})

//Connect to Client
io.on('connection', function (socket) {
	console.log("Guys we have connected to the client");
    pullData(socket);
    socket.on('dataOrderBook', function(order_book) {
        //console.log(order_book);
    });
});

//Send Table to Client every 1.5 seconds
function pullData (socket) {
    repeat(15000, function(){
        console.log(Date());
        got('https://www.bitstamp.net/api/order_book/', function(error, data, res) {
            console.log(Date());
            order_book = JSON.parse(data);
            var order_bids = order_book.bids;
            var order_asks = order_book.asks;
            var order_holder = {}
            order_holder.bids = order_bids;
            order_holder.asks = order_asks;
            socket.emit('dataOrderBook',  order_holder);   
        });
    });
}
