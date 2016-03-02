require('waitjs');

var express = require('express')
var app = express()
var got = require('got');
var server = require('http').createServer(app)
var io = require('socket.io').listen(server);
var pg = require('pg');
var order_book;
var currentTime;
var dataOrderBook;
var conString  = "pg://Antonio:timleetimlee@localhost/orderbook";
var format = require('pg-format');
var price;
var amount;



server.listen(3000);

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
})

//Pull Data from Bit Stamp
got('https://www.bitstamp.net/api/order_book/', function(error, data, res) {
     order_book = data;
})



//Connect to Client
io.on('connection', function (socket) {
    pullData(socket);
    socket.on('dataOrderBook', function(order_book) {
    });
});

//Send Table to Client every 1.5 seconds
function pullData (socket) {
    repeat(1500, function(){
        got('https://www.bitstamp.net/api/order_book/', function(error, data, res) {
            currentTime = getCurrentTime(currentTime);
            order_book = JSON.parse(data);
            var order_bids = order_book.bids;
            var order_asks = order_book.asks;
            pg.connect(conString, function(err, client, done){
                if(err){
                    return console.error('error fetching client from pool', err);
                }
                for (var i = 0; i < 20; i++){
                    askingPrice = order_asks[i][0];
                    askingAmount = order_asks[i][1];
                    biddingPrice = order_bids[i][0];
                    biddingAmount = order_bids[i][1];
                    var bidString = format('INSERT INTO orderdata VALUES(%L, %L, $$bids$$ , %L)', biddingPrice, biddingAmount, currentTime);
                    var askString = format('INSERT INTO orderdata VALUES(%L, %L, $$asks$$ , %L)', askingPrice, askingAmount, currentTime);
                    //DATABASE 
                    client.query(bidString, function(err, result){
                        done();
                        if(err){
                            return console.error('error running query', err);
                        }
                    });
                    client.query(askString, function(err, result){
                        done();
                        if(err){
                            return console.error('error running query', err);
                        }
                    });
                }
                });
                

            var order_holder = {}
            order_holder.bids = order_bids;
            order_holder.asks = order_asks;
            socket.emit('dataOrderBook',  order_holder);   
        });
    });
};

function getCurrentTime(i){
    var d = new Date();
    var h = d.getHours();
    var m = d.getMinutes();
    var s = d.getSeconds();

    h = h.toString();
    m = m.toString();
    s = s.toString();

    if (h < 10)
    {
        h = '0'+h;
    }
    if (m < 10)
    {
        m = '0'+m;
    }
    if (s < 10)
    {
        s = '0'+s;
    }
    i = h + ':' + m + ':' + s;

    i = i.toString();
    return i;
}
