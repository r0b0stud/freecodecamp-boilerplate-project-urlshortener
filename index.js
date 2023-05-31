require('dotenv').config();
//*** my changes
const bodyParser = require('body-parser');
const dns = require('dns');

const express = require('express');
const cors = require('cors');
const app = express();
let check;

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://robostud:HellSpawn2023@cluster0robostud.zoszsjd.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.use(bodyParser.urlencoded({extended: true}));
app.post("/api/shorturl", async function(req, res){
var c = checkURL(req.body.url);
if(!c){
  res.json({ error: 'invalid url' });
}
//await checkURL(req.body.url);
//dns.lookup(req.body.url, (error, address, family) => { check = address; }).then();

await client.connect();
var db = await client.db("shortURL");
let collection = await db.collection("shortURL");
let results = await collection.find({originalURL: req.body.url}).toArray();
if(results.length > 0) {
  //restituisco
  client.close();
  res.json({ original_url : req.body.url, short_url : results[0].shortURL });
}
else {
  //inserisco e restituisco
  //verifico quale id è il più alto
  let results = await collection.find({}).sort({shortURL : -1}).toArray();
  var nextNumber;
  if(results.length == 0) {
    nextNumber = 1;
  }
  else
  {
    nextNumber = results[0].shortURL + 1;
  }
  var newUrl = { originalURL : req.body.url, shortURL : nextNumber };
  await collection.insertOne(newUrl);
  client.close();
  res.json({ original_url : req.body.url, short_url : nextNumber });
}
});

app.get("/api/shorturl/:shorturl", async function(req, res){
  //console.log(req.params.shorturl);
  //res.send(req.params.shorturl);
  await client.connect();
  var db = await client.db("shortURL");
  let collection = await db.collection("shortURL");
  let results = await collection.find({shortURL: parseInt(req.params.shorturl)}).toArray();
  client.close();
  console.log(results[0].originalURL);
  //res.redirect("https://www.wikipedia.org/");
  res.redirect(results[0].originalURL);
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

app.get("/api/shorturl1/:shorturl", async function(req, res){
  var c = isValidHttpUrl(req.params.shorturl);
  res.send(c);
});

function checkURL(url) {
  const check = new RegExp('^([a-zA-Z]+:\\/\\/)?((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|((\\d{1,3}\\.){3}\\d{1,3}))(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*(\\?[;&a-z\\d%_.~+=-]*)?(\\#[-a-z\\d_]*)?$','i');
  return check.test(url);
}