require('waitjs');
var express = require('express')
var	app = express()
var got = require('got');
var server = require('http').createServer(app)
var io = require('socket.io').listen(server);
var mongoose = require('mongoose');
var url = 'mongodb://localhost:27017/silentSight';
var order_book;
var inBids;
var inAsks;

var testBook;
server.listen(3000);


//mongoose.model('silentSight');


app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
})



got('https://www.bitstamp.net/api/order_book/', function(error, data, res) {
	    order_book = data;
        //console.log(order_book);
})

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function(callback){
    //Create bids schema
    var bids = mongoose.Schema({
        price: Number,
        amount: Number
    });
    //Create asks schema
    var asks = mongoose.Schema({
        price: Number,
        amount: Number
    })

    var givenBids = mongoose.model('givenBids', bids);
    inBids = new givenBids;

    var givenAsks = mongoose.model('givenAsks', asks);
    inAsks = new givenAsks;
});

io.on('connection', function (socket) {
	pullData(socket);
	socket.on('dataOrderBook', function(order_book) {
		//console.log(order_book);
	});
});

mongoose.connect(url);

function pullData (socket, inBids, inAsks) {
    repeat(1500, function(inBids, inAsks){
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
            inBids = order_book.bids;
            inBids.save();
            inAsks = order_book.asks;
            inAsks.save();
            //Atempting to store the data in the database's schema
            //testBook.bids = order_bids;
            //testBook.asks = order_asks;
            console.log(inBids);
            console.log(inAsks);
    });
}
