require('waitjs');
var express = require('express')
var	app = express()
var got = require('got');
var server = require('http').createServer(app)
var io = require('socket.io').listen(server);
var order_book;
server.listen(3000);

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
})
got('https://www.bitstamp.net/api/order_book/', function(error, data, res) {
	    order_book = data;
        console.log(order_book);
})
io.on('connection', function (socket) {
	pullData(socket);
	socket.on('dataOrderBook', function(order_book) {
		console.log(order_book);
	});
});

function pullData (socket) {
    repeat(1500, function(){
    	//get the current time to the console
    	console.log(Date());
    	got('https://www.bitstamp.net/api/order_book/', function(error, data, res) {
    		console.log(Date());
        	order_book = data;
        	//console.log(order_book);
        	socket.emit('dataOrderBook',  order_book);
        });
    });
}
