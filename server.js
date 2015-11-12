require('waitjs');
var express = require('express')
var app = express()
var got = require('got');
var server = require('http').createServer(app)
var io = require('socket.io').listen(server);
var mongoose = require('mongoose');
var url = 'mongodb://localhost:27017/silentSight';
var order_book;
var dataOrderBook;
var testBook;
server.listen(3000);

//Database work
mongoose.connect(url);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function(callback){
    var transaction = mongoose.Schema({
        price:Number,
        amount: Number,
        type: String
    });
    dataOrderBook = mongoose.Schema({
        transactions: [transaction],
        timestamp: Number
    });
var silentSight = mongoose.model('silentSight', dataOrderBook);
testBook = new silentSight;
testBook.save(function(err){
    if (err){
       return console.error(err); 
    } 
    else {
        console.log("testBook has been Saved");
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
    pullData(socket);
    socket.on('dataOrderBook', function(order_book) {
        //console.log(order_book);
    });
});

//Send Table to Client every 1.5 seconds
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
            testBook = order_book;
            console.log(testBook);
            //testBook.save();
        });
    });
}
s = order_bids;
            //testBook.asks = order_asks;
            console.log(inBids);
            console.log(inAsks);
    });
}
