
'use strict';

const Twit = require('twit'); // this is how we import the twit package
const config = require('./config');
const fs = require('fs');
const path = require('path');
const async = require('async');
const _ = require('lodash');
const OUTPUT_DIR = '/processedOutput';

var processedOutputDir = __dirname + OUTPUT_DIR ;
var contaninatedJsonfileNM = "twitterFiltered.json";
contaninatedJsonfileNM = path.join( processedOutputDir ,contaninatedJsonfileNM );

// Log the config parameter to be used to access twitter api
console.log("debug: config: "+JSON.stringify(config));

var headerFlag = true;

//initialize the Twit with the config and create an object
var T = new Twit(config); 

// setup the twitter search params ( timeLine &  #hashTag list)
var timeLine = 'since:2020-05-01';
var hashTagList = ['#blackracism','#AfricanHolocaust','#BlackTwitter','#HandsUpDontShoot','#ICantBreath','#AliveWhileBlack','#BlackLivesMatter','#ThisEndsNow','#ShutItDown'];


// scan thrrough each of the #hashTag and perform the processing.
async.forEachSeries( hashTagList, function ( eachHashTagLookup, callback){

        console.log("Processing for eachHashTagLookup: "+eachHashTagLookup);

        var searchParam = eachHashTagLookup + ' ' + timeLine;
        var twitterParam = {q: searchParam,count: 100000};

        async.waterfall( [

                // create the processed output dir.
                async.apply( createDirSetup, processedOutputDir),

                // fetch tweeter search data and store into a json file.
                async.apply( writeTwitterFeedToJsonFile, T, twitterParam ),

                // process the tweeter json data and create the final data-file in csv format.
                async.apply( convertJsonToCSV, twitterParam, headerFlag )

        ], function ( error, result ){

                if ( error ){
                    console.log("error "+error);
                    callback( error );
                }

                if ( result ){
                    console.log("result:"+JSON.stringify(result) );
                    callback();
                }
        });

    }, function ( error ){

            if ( error ){
                console.log( "Error: "+error);

            } else {


                fs.appendFile( contaninatedJsonfileNM, "\n]", function ( error ){

                            if ( error ){
                                console.log("Failed to write to file: "+contaninatedJsonfileNM);
            
                            } else {
                                console.log("Successfully fetched data from tweeter and Converted to json: "+contaninatedJsonfileNM);                            
                            }
                });      
                
            }

});

/**
 * Function name: createDirSetup
 * Description: A callback function to create the processed output dir if that doesn't exist.
 *              This dir. is created in the current executing dir.
 * 
 * @param {*} processedOutputDir
 * @param {*} callback 
 */
function createDirSetup ( processedOutputDir, callback ){

    var createDirList = [processedOutputDir ];

    async.forEachSeries( createDirList, function ( eachDirToCreate, callbackEachSeries){

        fs.exists( eachDirToCreate, function ( exists ){

            if ( exists ){

                console.log("The dir "+eachDirToCreate+" exists.");
                callbackEachSeries();

            } else {

                fs.mkdir(eachDirToCreate,function ( error ){

                        if ( error ){
                            console.log( "createDirSetup error: "+error+" for creating dir. "+eachDirToCreate);

                            callbackEachSeries( "createDirSetup error: "+error+" for creating dir. "+eachDirToCreate);

                        } else {

                            console.log( "createDirSetup successfully created dir. "+eachDirToCreate);
                            callbackEachSeries();
                        }

                })
            }

        });

    }, function ( error ){
            if ( error ){

            } else {
                callback( null, "setupDir created Successfully");
            }
    });
}

/**
 * Function name: writeTwitterFeedToJsonFile
 * Description: A callback function to interact with twitter and fetch the #hashTag data and store it in json file
 *
 * @param {*} twitterObj 
 * @param {*} twitterParam 
 * @param {*} passOverObj 
 * @param {*} callback 
 */
function writeTwitterFeedToJsonFile( twitterObj, twitterParam, passOverObj ,callback ){

    twitterObj.get('search/tweets', twitterParam, function( error, data, response) {

            if ( error ) {

                var errorMsg = "Error to fetch data from twitter:"+error+ "for pattern: "+JSON.stringify(twitterParam) ;            
                console.log("writeTwitterFeedToJsonFile error: "+errorMsg);                                               
                callback ( errorMsg,null);

            }

            if ( data ){

                var writeContent = data.statuses;
                var fileName = 'hashtag_'+twitterParam.q.toString().replace(/[^a-zA-Z0-9]/,'').replace(/\s+since:.*?$/,'.json');
                fileName = path.join(processedOutputDir, fileName );

                 fs.writeFile(fileName, JSON.stringify(writeContent).toString().replace(/[^A-Za-z 0-9 \.,\?""!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~]*/g, '').replace(/\\n/g,' '), function (err) {

                    if (err) {
                            console.log("failed to write to json file"+err);                        
                            callback ("failed to write to json file"+err, null)

                    } else {
                            console.log("saved json file successfully");
                            callback ( null, {'jsonfileNM':fileName});
                    }
                  });
            }
  });
}

/**
 * Function name: convertJsonToCSV
 * Description: A callback function to create the csv/json file, used to append! For every new execution its being recreated.
 *
 * @param {*} twitterParam 
 * @param {*} headerFlag 
 * @param {*} passOverObj 
 * @param {*} callback 
 */
function convertJsonToCSV( twitterParam,headerFlag,passOverObj, callback){

    // var csvfileNM = "twitterFiltered.csv";
    // csvfileNM = path.join( processedOutputDir ,csvfileNM);

    var lookupHashTag = twitterParam.q.toString().replace(/[^a-zA-Z0-9]/,'').replace(/\s+since:.*?$/,'');
    var jsonFile = passOverObj.jsonfileNM;
    var jsonData = require(jsonFile);

    // fs.exists( csvfileNM, function ( exists){
    fs.exists( contaninatedJsonfileNM, function ( exists){

        if( exists ) {


            if ( ! headerFlag ){

                console.log('File exists... in the middle of processing, so not deleting it');

                // fileConverter(jsonData, csvfileNM, lookupHashTag, function ( error, result ){
                fileConverterToJSON (jsonData, contaninatedJsonfileNM, function ( error, result)  {

                    if ( error ){
                        return callback('convertJsonToCSV fileConverter error: ' +  error, null);
                    }

                    if ( result ){
                        return callback(null, 'convertJsonToCSV fileConverter successful ' +  contaninatedJsonfileNM);
                    }
                });                

            } else {

                console.log('File exists. Deleting now ... '+contaninatedJsonfileNM);
                fs.unlink(contaninatedJsonfileNM, function(err){
                    if(err) {
                            return callback('convertJsonToCSV file deletion error: ' +  err, null);
                    } else {

                            console.log('file deleted successfully');

                            // fileConverter(jsonData, csvfileNM, lookupHashTag, function ( error, result ){
                            fileConverterToJSON (jsonData, contaninatedJsonfileNM, function ( error, result)  {

                                        if ( error ){
                                            return callback('convertJsonToCSV fileConverter error: ' +  error, null);
                                        }

                                        if ( result ){
                                            return callback(null, 'convertJsonToCSV fileConverter successful ' +  contaninatedJsonfileNM);
                                        }
                            });
                    }
                });
            }

          } else {

                console.log('File not found, so not deleting.');

                // fileConverter(jsonData, csvfileNM, lookupHashTag, function ( error, result ){
                fileConverterToJSON (jsonData, contaninatedJsonfileNM, function ( error, result)  {

                    if ( error ){
                        return callback('convertJsonToCSV fileConverter error: ' +  error, null);
                    }

                    if ( result ){
                        return callback(null, 'convertJsonToCSV fileConverter successful ' +  contaninatedJsonfileNM);
                    }
                });            
          }

    });
}


/**
 * function - fileConverter creates a consolidated/ screened csv file
 * @param {*} jsonData 
 * @param {*} csvfileNM 
 * @param {*} lookupHashTag 
 * @param {*} callback 
 */
function fileConverter(jsonData, csvfileNM, lookupHashTag,callback ) {

            async.forEachSeries( jsonData, function ( eachElement, loopCallback ){

                var considerObjList = {};
                considerObjList.tweetCreationDT = eachElement.created_at;
                considerObjList.text = eachElement.text.toString().replace(/[^A-Za-z 0-9 \.,\?""!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~]*/g, '').replace(/\\n/g, ' ');

                var hashTag = eachElement.entities.hashtags.find(function(eachValue){ if ( eachValue.text == lookupHashTag ){ return eachValue.text; }});
                considerObjList.hashTag =  ( hashTag ) ? hashTag.text : "";

                var userMentionTemp = {"user_mentions_screenNM":"","user_mentions_NM":""};
                if ( eachElement.user_mentions ){
                    eachElement.user_mentions.map(function ( eachValue ){ userMentionTemp.user_mentions_screenNM = ( userMentionTemp.user_mentions_screenNM ) ?  userMentionTemp.user_mentions_screenNM + "; " + eachValue.screen_name : eachValue.screen_name ; userMentionTemp.user_mentions_NM = ( userMentionTemp.user_mentions_NM ) ?  userMentionTemp.user_mentions_NM + "; " + eachValue.name : eachValue.name ;});
                }
                considerObjList = Object.assign( {}, considerObjList, userMentionTemp);

                considerObjList.iso_language_code = eachElement.metadata.iso_language_code;
                considerObjList.in_reply_to_screen_name = eachElement.in_reply_to_screen_name;

                considerObjList.userInfo_id = eachElement.user.id;
                considerObjList.userInfo_name = eachElement.user.name;
                considerObjList.userInfo_screen_name = eachElement.user.screen_name;
                considerObjList.userInfo_description = eachElement.user.description;
                considerObjList.userInfo_followers_count = eachElement.user.followers_count;
                considerObjList.userInfo_friends_count = eachElement.user.friends_count;
                considerObjList.userInfo_geo_enabled = eachElement.user.geo_enabled;
                considerObjList.userInfo_verified = eachElement.user.verified;
                considerObjList.userInfo_statuses_count = eachElement.user.statuses_count;

                considerObjList.retweeted_status_id = ( eachElement.retweeted_status ) ?  eachElement.retweeted_status.id : ""; 
                considerObjList.retweeted_text = (eachElement.retweeted_status) ? eachElement.retweeted_status.text.toString().replace(/[^A-Za-z 0-9 \.,\?""!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~]*/g, '').replace(/\\n/g, ' ') : "";
                considerObjList.retweeted_DT = (eachElement.retweeted_status) ? eachElement.retweeted_status.created_at : "";

                var csvheader = Object.keys(considerObjList).join(",");
                var csvValues = Object.values(considerObjList).join(",");
                
                csvValues.toString().replace(/\\n/g, ' ');
                csvValues.toString().replace(/(\n|\r)+/g, ' ');
                
                csvValues = ( headerFlag ) ? csvheader + "\n" + csvValues + "\n" : csvValues +"\n" ;                
                headerFlag = false ;

                fs.appendFile( csvfileNM, csvValues, function ( error ){

                        if ( error ){
                            console.log("Failed to write to file");
                            loopCallback(error);

                        } else {
                            loopCallback();                            
                        }
                });


        }, function ( error ){

                if ( error ){
                    callback( error, null);

                } else {

                    callback( null, "done");
                }
        });
}

/**
 * function - fileConverterToJSON creates a consolidated/ screened json file
 * 
 * @param {*} jsonData 
 * @param {*} jsonfileNM 
 * @param {*} callback 
 */
function fileConverterToJSON(jsonData, jsonfileNM, callback ) {

        async.forEachSeries( jsonData, function ( eachElement, loopCallback ){

                var considerObjList = {};

                considerObjList.text = eachElement.text.toString().replace(/[^A-Za-z 0-9 \.,\?""!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~]*/g, '').replace(/\\n/g, ' ');
                considerObjList.userInfo_id = eachElement.user.id;

                var fileString = JSON.stringify(considerObjList);

                fileString = ( headerFlag ) ? "[\n" + fileString + "\n" : ","+ fileString +"\n" ;                
                headerFlag = false ;

                fs.appendFile( jsonfileNM, fileString, function ( error ){

                        if ( error ){
                            console.log("Failed to write to file");
                            loopCallback(error);

                        } else {
                            loopCallback();                            
                        }
                });


        }, function ( error ){

                if ( error ){
                    callback( error, null);

                } else {

                    callback( null, "done");
                }
        });
}

