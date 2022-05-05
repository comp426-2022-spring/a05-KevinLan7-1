const args = require('minimist')(process.argv.slice(2))
// Store help text 
const help = (`
server.js [options]
--port, -p	Set the port number for the server to listen on. Must be an integer
            between 1 and 65535.
--debug, -d If set to true, creates endlpoints /app/log/access/ which returns
            a JSON access log from the database and /app/error which throws 
            an error with the message "Error test successful." Defaults to 
            false.
--log		If set to false, no log files are written. Defaults to true.
            Logs are always written to database.
--help, -h	Return this message and exit.
`)
// If --help, echo help text and exit
if (args.help || args.h) {
    console.log(help)
    process.exit(0)
}
var express = require('express')
var app = express()
const fs = require('fs')
const morgan = require('morgan')
const db = require('./src/services/database.js')

const HTTP_PORT = args.port || process.env.PORT || 5000;

if (args.log == null || args.log == 'true') {
// Create a write stream to append to an access.log file
    const accessLog = fs.createWriteStream('access.log', { flags: 'a' })
// Set up the access logging middleware
    app.use(morgan('combined', { stream: accessLog }))
} else {
// If --log=false then do not create a log file
    console.log("NOTICE: not creating file access.log")
}

if(args.log == null || args.log == 'true'){
    app.use((req, res, next) => {
        let logdata = {
            remoteaddr: req.ip,
            remoteuser: req.user,
            time: Date.now(),
            method: req.method,
            url: req.url,
            protocol: req.protocol,
            httpversion: req.httpVersion,
            status: res.statusCode,
            referrer: req.headers['referer'],
            useragent: req.headers['user-agent']
        };
        const stmt = db.prepare('INSERT INTO accesslog (remoteaddr, remoteuser, time, method, url, protocol, httpversion, status, referrer, useragent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        const info = stmt.run(logdata.remoteaddr, logdata.remoteuser, logdata.time, logdata.method, logdata.url, logdata.protocol, logdata.httpversion, logdata.status, logdata.referrer, logdata.useragent)
        next();
    })
}

// Serve static HTML public directory
app.use(express.static('./public'))
app.use(express.urlencoded({extended:true}))
app.use(express.json())

// READ (HTTP method GET) at root endpoint /app/
app.get("/app/", (req, res, next) => {
    // Respond with status 200
	res.statusCode = 200;
    // Respond with status message "OK"
    res.statusMessage = 'OK';
    res.writeHead( res.statusCode, { 'Content-Type' : 'text/plain' });
    res.end(res.statusCode+ ' ' +res.statusMessage)
});

app.get('/app/flip/', (req, res) => {
    const flip = coinFlip()
    res.status(200).json({ "flip" : flip })
});

app.post('/app/flip/coins/', (req, res, next) => {
    const flips = coinFlips(req.body.number)
    const count = countFlips(flips)
    res.status(200).json({"raw":flips,"summary":count})
})

app.get('/app/flips/:number', (req, res, next) => {
    const flips = coinFlips(req.params.number)
    const count = countFlips(flips)
    res.status(200).json({"raw":flips,"summary":count})
});

app.post('/app/flip/call/', (req, res, next) => {
    res.statusCode = 200;
    const game = flipACoin(req.body.guess);
    res.send(game);
    res.writeHead(res.statusCode,{'Content-Type':'text/plain'});
})

if (args.debug || args.d) {
    app.get('/app/log/access/', (req, res, next) => {
        const stmt = db.prepare("SELECT * FROM accesslog").all();
	    res.status(200).json(stmt);
    })

    app.get('/app/error/', (req, res, next) => {
        throw new Error('Error test successful.')
    })
}

// Default API endpoint that returns 404 Not found for any endpoints that are not defined.
app.use(function(req, res){
    const statusCode = 404
    const statusMessage = 'NOT FOUND'
    res.status(statusCode).end(statusCode+ ' ' +statusMessage)
});

// Start server
const server = app.listen(HTTP_PORT, () => {
    console.log("Server running on port %PORT%".replace("%PORT%",HTTP_PORT))
});
// Tell STDOUT that the server is stopped
process.on('SIGINT', () => {
    server.close(() => {
		console.log('\nApp stopped.');
	});
});

// Flip one coin
function coinFlip() {
    return Math.random() > .5 ? ("heads") : ("tails");
}
// Flip many coins
function coinFlips(flips) {
    let results = [];
    for(let i = 0; i < flips; i++){
      results[i] = coinFlip();
    }
    return results;
}
// Count coin flips
function countFlips(array) {
    let array2 = {heads:0,tails:0};
    for(let i = 0; i < array.length; i++){
      if(array[i] == "heads"){
        array2.heads++;
      }else{
        array2.tails++;
      }
    }
    return array2;
}
// Call a coin flip
function flipACoin(call) {
    let flip = coinFlip();
    let result;
    if ( flip == call ) {
        result = 'win'
    } else {
        result = 'lose'
    }
    let game = {
        call: call,
        flip: flip,
        result: result
    }
    return game
}