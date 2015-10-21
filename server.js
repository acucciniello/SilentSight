require('waitjs');
var express = require('express')
var	app = express()
var got = require('got');
var server = require('http').createServer(app)
var io = require('socket.io').listen(server);
var mongoose = require('mongoose');
var url = 'mongodb://localhost:3000/silentSight';
var order_book;
var dataOrderBook;
var testBook;
server.listen(3000);


mongoose.connect(url);
//mongoose.model('silentSight');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function(callback){
    dataOrderBook = mongoose.Schema({
        order_info: {
            bids: [Number],
            asks: [Number]
        }
    })
var silentSight = mongoose.model('silentSight', dataOrderBook);
testBook = new silentSight;
});



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
            //Atempting to store the data in the database's schema
            testBook.order_info.bids = order_bids;
            testBook.order_info.asks = order_asks;
        });
    });
}
