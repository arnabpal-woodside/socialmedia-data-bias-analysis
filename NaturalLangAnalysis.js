const fs = require('fs'),
    tweetdata = require('./data.json'),
     NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1'),
    { IamAuthenticator } = require('ibm-watson/auth'),
   naturalLanguageUnderstanding = new NaturalLanguageUnderstandingV1({
       version: '2019-07-12',
       authenticator: new IamAuthenticator({
           apikey: "LUg7iyRGq3m9qj_Nh95grcb3AgeZaWRIp9RBuWe8FVsY",
       }),
       url: "https://api.eu-gb.natural-language-understanding.watson.cloud.ibm.com/instances/37f4e121-9f84-4eb1-8b87-69186e08327e"
   });
   
var analyzeParams = {
    'features': {
        'keywords': {
            'sentiment': true,
            'emotion': true,
            'limit': 10
        }
    }
};

module.exports = class NaturalLangAnalysis {

    constructor(config) {
        this.config = config
    }

    async processTweetData() {

        let response = [];
        try {
            for (var i = 0; i < tweetdata.length; i++) {
                analyzeParams.text = tweetdata[i].text;
                let userId = tweetdata[i].userInfo_id;
                let jsonResp = await this.analyseSentiment(analyzeParams,userId);

                console.log("Analysis done for Row number: ", i)
                response.push(jsonResp);
            }
        } catch (err) {
            console.error(err);
        }
        return response;

    }
    async processRequest() {
        let response = await this.processTweetData();
        console.log("Response ", JSON.stringify(response));
        await this.writeFileJson(JSON.stringify(response))
        console.log("Response Received");
        return response;
    }

    async writeFileJson(data) {
        return new Promise(function (resolve, reject) {
            fs.writeFile("output.json", data, function (err) {
                if (err) reject(err);
                else resolve(data);
            });
        });
    }

    async analyseSentiment(analyzeParams, userId) {

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
            return finaljson;
        } catch (err) {
            throw err;
        }

    }


}
