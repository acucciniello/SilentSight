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
var tableData;
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
    tableData = mongoose.Schema({
        transactions: [transaction],
        timestamp: Number
    });
    //var bidsAsks = mongoose.model('bidsAsks', transaction);
    //bidsTrans = new bidsAsks({price: , amount: })
    var tableModel = mongoose.model('tableModel', transaction);
    var silentSight = mongoose.model('silentSight', tableData);
    testBook = new silentSight({
        transactions: [
            new tableModel({
                type:'bid',
                amount: 10,
                price: 100
            })
            ],
        timestamp: 12345
    });
    console.log(testBook);
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
	console.log("Guys we have connected to the client");
    pullData(socket);
    socket.on('dataOrderBook', function(order_book) {
        //console.log(order_book);
    });
});

//Send Table to Client every 1.5 seconds
function pullData (socket) {
	console.log("Hi we entered the pullData function");
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
            //testBook.insert(order_book);
            testBook.update({transaction: order_book});
            testBook.save(function(err, testBook){
                if(err)
                    {
                        console.log("Testbook wasnt properly saved")
                        return console.error(err);
                    }
                else
                    {
                        console.log(testBook);
                        console.log("testBook has been saved");
                    }
                });
        });
    });
}
