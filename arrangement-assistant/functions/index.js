// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';
 
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const voteHandler = require('./vote/voteHandler');
const flaskBlogHandler = require('./flask_blog/flaskBlogHandler');
const createPostHandler = require('./flask_blog/createPostHandler');
const crytoPredictHandler = require('./bitcoin_invest/bitcoinInvestHandler');
const assumptionInvestment = require('./bitcoin_invest/assumptionInvestment');
const signInHandler = require('./sign_in/signInHandler');
 
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

var admin = require("firebase-admin");
var serviceAccount = require("./config/meetups-sqid-firebase-adminsdk-3b0mk-4302d213ba.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://meetups-sqid-default-rtdb.firebaseio.com"
});
 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  // Get Actions on Google library conv instance
  // remember it's only be initialised inside actions on google platforms, dialogFlow is not one.
  // Testing on simulator
  let conv = agent.conv();
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
 
  function welcome(agent) {
    agent.add(`Welcome to my agent!`);
  }
 
  function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
  }

  const singerVoting = agent => {
    voteHandler.makeAVote(agent, conv, admin);
  }

  const showVotingResult = async agent => {
    await voteHandler.showResult(agent, admin);
  };

  const showFlaskBlogPost = async agent => {
    await flaskBlogHandler.showAPost(agent, conv);
  };

  const showNextFlaskBlogPost = async agent => {
    await flaskBlogHandler.showNextPost(agent, conv);
  };

  const showPreviousFlaskBlogPost = async agent => {
    await flaskBlogHandler.showPrevPost(agent, conv);
  };

  const repeatFlaskBlogPost = async agent => {
    await flaskBlogHandler.repeatPost(agent, conv);
  };

  const showFlaskBlogPostsList = async agent => {
    await flaskBlogHandler.showPostsList(agent, conv);
  };

  const selectFlaskBlogPostByNumber = async agent => {
    await flaskBlogHandler.selectPostByNumber(agent, conv);
  };

  const predictInvestmentInSpecificPeriod = async agent => {
    await crytoPredictHandler.predictInSpecificPeriod(agent, conv);
  };

  const provideMissingCapital = async agent => {
    await crytoPredictHandler.provideMissingCapital(agent, conv);
  };

  const provideMissingCrytoName = async agent => {
    await crytoPredictHandler.provideMissingCrytoName(agent, conv);
  };

  const provideMissingCurrencyName = async agent => {
    await crytoPredictHandler.provideMissingCurrencyName(agent, conv);
  };

  const provideMissingInvestDate = async agent => {
    await crytoPredictHandler.provideMissingInvestDate(agent, conv);
  };

  const predictInvestmentVariousOfTime = async agent => {
    await assumptionInvestment.predictInvestmentVariousOfTime(agent, conv);
  };

  const askForSignIn = async agent => {
    signInHandler.askForSignIn(agent, conv);
  };

  const getSignIn = async agent => {
    signInHandler.getSignIn(agent, conv);
  };

  const providePasswordForFlaskBlogPost = async agent => {
    await createPostHandler.provideToken(agent, conv);
  };

  const createNewFlaskBlogPost = async agent => {
    await createPostHandler.createPost(agent, conv);
  };

  const provideTitleForFlaskBlogPost = async agent => {
    await createPostHandler.provideTitle(agent, conv);
  };

  const provideContentForFlaskBlogPost = async agent => {
    await createPostHandler.provideContent(agent, conv);
  };

  const showPostsInSpecificRequirement = async agent => {
    await flaskBlogHandler.selectPostsInSpecificRequirement(agent, conv);
  };

  const flaskBlogPostPositionProvided = async agent => {
    await flaskBlogHandler.flaskBlogPostPositionProvided(agent, conv);
  };

  const flaskBlogPostDateProvided = async agent => {
    await flaskBlogHandler.flaskBlogPostDateProvided(agent, conv);
  };

  const flaskBlogPostNumberProvided = async agent => {
    await flaskBlogHandler.flaskBlogPostNumberProvided(agent, conv);
  };

  const flaskBlogPostAuthorProvided = async agent => {
    await flaskBlogHandler.flaskBlogPostAuthorProvided(agent, conv);
  };

  const selectNumberPostsInSpecificRequirement = async agent => {
    await flaskBlogHandler.selectNumberPostsInSpecificRequirement(agent, conv);
  };

  const nextPostsInSpecificRequirement = async agent => {
    await flaskBlogHandler.nextPostsInSpecificRequirement(agent, conv);
  };

  const previousPostsInSpecificRequirement = async agent => {
    await flaskBlogHandler.previousPostsInSpecificRequirement(agent, conv);
  };

  const repeatPostsInSpecificRequirement = async agent => {
    await flaskBlogHandler.repeatPostsInSpecificRequirement(agent, conv);
  };


  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('vote singer', singerVoting);
  intentMap.set('vote result', showVotingResult);
  intentMap.set('show flask blog', showFlaskBlogPost);
  intentMap.set('show flask blog - next', showNextFlaskBlogPost);
  intentMap.set('show flask blog - previous', showPreviousFlaskBlogPost);
  intentMap.set('show flask blog - repeat', repeatFlaskBlogPost);
  intentMap.set('show  flask blog list', showFlaskBlogPostsList);
  intentMap.set('show  flask blog list - select.number', selectFlaskBlogPostByNumber);
  intentMap.set('show  flask blog list - select.number - next', showNextFlaskBlogPost);
  intentMap.set('show  flask blog list - select.number - previous', showPreviousFlaskBlogPost);
  intentMap.set('show  flask blog list - select.number - repeat', repeatFlaskBlogPost);
  intentMap.set('earn with bitcoin in specific period', predictInvestmentInSpecificPeriod);
  intentMap.set('earn with bitcoin in specific period - missing capital - filled', provideMissingCapital);
  intentMap.set('earn with bitcoin in specific period - missing cryto name - provided', provideMissingCrytoName);
  intentMap.set('earn with bitcoin in specific period - missing currency name - provided', provideMissingCurrencyName);
  intentMap.set('earn with bitcoin in specific period - missing invest date - filled', provideMissingInvestDate);
  intentMap.set('earn with bitcoin', predictInvestmentVariousOfTime);
  intentMap.set('ask-for-signin', askForSignIn);
  intentMap.set('get-signin', getSignIn);
  intentMap.set('synchronize account - provide password', providePasswordForFlaskBlogPost);
  intentMap.set('create post on blog', createNewFlaskBlogPost);
  intentMap.set('create post on blog - missing title - provide title', provideTitleForFlaskBlogPost);
  intentMap.set('create post on blog - missing title - provide title - custom - provide content', provideContentForFlaskBlogPost);
  intentMap.set('show flask blog in specific requirement', showPostsInSpecificRequirement);
  intentMap.set('show flask blog in specific requirement - missing position - provided', flaskBlogPostPositionProvided);
  intentMap.set('show flask blog in specific requirement - missing date - provided', flaskBlogPostDateProvided);
  intentMap.set('show flask blog in specific requirement - missing number - provided', flaskBlogPostNumberProvided);
  intentMap.set('show flask blog in specific requirement - missing author - provided', flaskBlogPostAuthorProvided);
  intentMap.set('show flask blog in specific requirement - select.number', selectNumberPostsInSpecificRequirement);
  intentMap.set('show flask blog in specific requirement - select.number - next', nextPostsInSpecificRequirement);
  intentMap.set('show flask blog in specific requirement - select.number - previous', previousPostsInSpecificRequirement);
  intentMap.set('show flask blog in specific requirement - select.number - repeat', repeatPostsInSpecificRequirement);
  intentMap.set('missing date - provided - select.number', selectNumberPostsInSpecificRequirement);
  intentMap.set('missing date - provided - select.number - next', nextPostsInSpecificRequirement);
  intentMap.set('missing date - provided - select.number - previous', previousPostsInSpecificRequirement);
  intentMap.set('missing date - provided - select.number - repeat', repeatPostsInSpecificRequirement);
  intentMap.set('missing position - select.number', selectNumberPostsInSpecificRequirement);
  intentMap.set('missing position - select.number - next', nextPostsInSpecificRequirement);
  intentMap.set('missing position - select.number - previous', previousPostsInSpecificRequirement);
  intentMap.set('missing position - select.number - repeat', repeatPostsInSpecificRequirement);
  intentMap.set('missing number - select.number', selectNumberPostsInSpecificRequirement);
  intentMap.set('missing number - select.number - next', nextPostsInSpecificRequirement);
  intentMap.set('missing number - select.number - previous', previousPostsInSpecificRequirement);
  intentMap.set('missing number - select.number - repeat', repeatPostsInSpecificRequirement);
  intentMap.set('missing author - select.number', selectNumberPostsInSpecificRequirement);
  intentMap.set('missing author - select.number - next', nextPostsInSpecificRequirement);
  intentMap.set('missing author - select.number - previous', previousPostsInSpecificRequirement);
  intentMap.set('missing author - select.number - repeat', repeatPostsInSpecificRequirement);
  
  agent.handleRequest(intentMap);
});
