
const express = require("express"),
app = express();

app.use(express.json());


/******************************************/
const port = process.env.PORT || 3000;
console.log('listening on ' + port);

app.listen(port);

const config = require('./config.json');


var NaturalLangAnalysis = require('./NaturalLangAnalysis'),
NLU = new NaturalLangAnalysis(config);


//------- Error Handling -----------------------------
let wrapper = fn => (req, res) => fn(req, res).catch((err) => {

    return res.status(500).send(err);
});

app.get('/api/sentimentAnalysis', wrapper(async (req, res) => {

let response = await NLU.processRequest();
console.log("Response Received :: "+JSON.stringify(response));
return res.send(JSON.stringify(response));
}));
