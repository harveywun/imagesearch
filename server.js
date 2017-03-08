var express = require('express');
var app = express();
var mongo = require('mongodb');
var dotenv = require('dotenv');
dotenv.config();
var url = process.env.MONGOLAB_URI;
//var appurl = "https://fcc-project-hwun.c9users.io/";
var appurl = "https://fcc-bingimagesearch.herokuapp.com/";

var Bing = require('node-bing-api')({
    accKey: process.env.BING_KEY
});

// use mongodb to store search entry and time
// every search gets stored in mongo db with time
// can retrieve past searches

// pass search query to bing api
// spit out result (only 10)
// with ?page can see other pages

function addSearchEntry(src, db) {
    var entry = {
        term: src,
        when: new Date()
    };

    db.collection('searchhistory').insert(entry, function(err, data) {
        if (err) throw console.error(err);
        console.log("Add an entry: " + JSON.stringify(entry));
    });
}


function printHistory(res, db) {
    db.collection('searchhistory').find({}, {
        "_id": 0
    }).toArray(function(err, docs) {
        if (err) throw console.error("Mongo Find to Array: " + err);

        res.send(JSON.stringify(docs));
    });
}


mongo.MongoClient.connect(url, function(err, db) {
    if (err) throw new Error("Fail to connect to Mongo: " + err);

    app.get('/', function(req, res) {
        res.send(
            "Search history: " + appurl + "api/latest/imagesearch/" + "<br>"+
            "Search instructions: " + appurl + "api/[search term]?offset=[num]"
        );
    });

    // search with api
    // add to search history
    app.get('/api/:search', function(req, res) {
        //bingSearch(res, req.params.search, req.query.offset);
        var srcResult = [];
        var skip = 0;
        if(!isNaN(req.query.offset)) {
            skip = req.query.offset * 5;
        }
        
        Bing.images(req.params.search, {
            top: 5, // Number of results (max 50) 
            offset: skip // Skip result 
        }, function(error, result, body) {
            body.value.forEach(function(element) {
                srcResult.push({
                    url: element.contentUrl,
                    snippet: element.name,
                    thumbnail: element.thumbnailUrl,
                    context: element.hostPageUrl
                });
            });

            res.send(srcResult);
        });

        addSearchEntry(req.params.search, db);
    });

    // print search history
    app.get('/api/latest/imagesearch/', function(req, res) {
        printHistory(res, db);
    });

    app.listen(process.env.PORT || 8080);
    /*
    app.listen(8080, function() {
        console.log('Example app listening');
    });
    */
});
