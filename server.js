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
var searchTime;
var dbAskPrice;
var dbAskAmount;
var dbBidPrice;
var dbBidAmount;
var oldTableShow = 0;
var askColumn = {};
var bidColumn = {};
var reconstructedTable = {};
reconstructedTable.bids = [];
reconstructedTable.asks = [];
var askCount = 19;
var bidCount = 39;
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
    socket.on('timeSentToDB', function(searchTime){
                pg.connect(conString, function(err, client, done){
                    if (err){
                        return console.error('error fetching the timestamped client from pool', err);
                    }
                    var loadTimeStampValues = format('SELECT * FROM orderdata WHERE timestamp = %L ORDER BY type', searchTime);
                    client.query(loadTimeStampValues, function(err, result){
                        done();
                        if(err){
                            console.log("You entered a time where the data doesnt exist");
                            console.log("Please enter a time where data exists in the database.")
                            return console.error('error running query', err);
                        }

                        oldTableShow = 1;
                        for (var j = 0; j <= askCount; j++)
                        {
                            var dbAskPair = [];
                            dbAskPrice = result.rows[j].price;
                            dbAskAmount = result.rows[j].amount;
                            dbAskPair[0] = dbAskPrice;
                            dbAskPair[1] = dbAskAmount;
                            askColumn[j] = dbAskPair;

                            var dbBidPair = [];
                            dbBidPrice = result.rows[j+20].price;
                            dbBidAmount = result.rows[j+20].amount;
                            dbBidPair[0] = dbBidPrice;
                            dbBidPair[1] = dbBidAmount;
                            bidColumn[j] = dbBidPair;


                            reconstructedTable.bids[j] = bidColumn[j];
                            reconstructedTable.asks[j] = askColumn[j];
                        }
                        socket.emit('dataOrderBook',  reconstructedTable); 
                    })
                })
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
            if(oldTableShow == 0)
            {
                socket.emit('dataOrderBook',  order_holder);   

            }
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