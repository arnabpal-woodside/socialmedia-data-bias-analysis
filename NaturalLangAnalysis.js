const config = require('./configNew'), 
 fs = require('fs');

const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1');
const { IamAuthenticator } = require('ibm-watson/auth');

const naturalLanguageUnderstanding = new NaturalLanguageUnderstandingV1({
    version: '2019-07-12',
    authenticator: new IamAuthenticator({
        apikey: config.nlu_api_key,
    }),
    url: config.nlu_url
});

const tweetdata = require('./data.json');

async function processData() {

    let response = [];

    let analyzeParams = {
        'features': {
            'keywords': {
                'sentiment': true,
                'emotion': true,
                'limit': 10
            }
        }
    };
    for (i = 0; i < tweetdata.length; i++) {

        analyzeParams.text = tweetdata[i].text;
        let userId = tweetdata[i].userInfo_id;
        let jsonResp = await processNLU(analyzeParams, userId);
        console.log("Analysis done for Row number: ", i)
        response.push(jsonResp);
    }
    console.log("Response ", JSON.stringify(response));
    await writeFileJson(JSON.stringify(response))
    console.log("Response Received");
    return;
}

async function writeFileJson(data) {
    return new Promise(function (resolve, reject) {
        fs.writeFile("output.json", data, function (err) {
            if (err) reject(err);
            else resolve(data);
        });
    });
}

async function processNLU(analyzeParams, userId) {
    let finaljson = {};
    try {
        let analysisResults = await naturalLanguageUnderstanding.analyze(analyzeParams);

        let jsonResponse = analysisResults.result.keywords[0];

        if (jsonResponse != null) {
            finaljson.userId = userId;
            finaljson.text = analyzeParams.text;
            finaljson.sentiment_label = jsonResponse.sentiment && jsonResponse.sentiment.label ? jsonResponse.sentiment.label : null;
            finaljson.sadness = jsonResponse.emotion && jsonResponse.emotion.sadness ? jsonResponse.emotion.sadness : null;
            finaljson.joy = jsonResponse.emotion && jsonResponse.emotion.joy ? jsonResponse.emotion.joy : null;
            finaljson.fear = jsonResponse.emotion && jsonResponse.emotion.fear ? jsonResponse.emotion.fear : null;
            finaljson.disgust = jsonResponse.emotion && jsonResponse.emotion.disgust ? jsonResponse.emotion.disgust : null;
            finaljson.anger = jsonResponse.emotion && jsonResponse.emotion.anger ? jsonResponse.emotion.anger : null;
        }
    } catch (err) {
        console.log('error:', err);
    }
    return finaljson;

}

processData();
