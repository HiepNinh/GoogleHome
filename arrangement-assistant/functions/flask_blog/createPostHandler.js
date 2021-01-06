const requestAPI = require('request-promise');
const utils = require('../utils/utils');
const jwt = require('jsonwebtoken');



const createPost = async (agent, conv) => {

    if(!utils.isGoogleInstance(agent, conv)) return;
        
    //linking account with google
    if(!conv.request.user.idToken) {
        conv.ask("To use this feature. You must linking google account first. Say sign in for example to proceed");
        agent.add(conv);
        return;
    };

    //get token via login api
    if(!conv.data.flaskblogtoken) {
        conv.ask('going to follow up intent');
        agent.setFollowupEvent('missing-flask-blog-token');
        agent.add(conv);
        return;
    }
    
    conv.ask('going to follow up intent');
    agent.setFollowupEvent('missing-flask-blog-title');
    agent.add(conv);
}

const provideToken = async (agent, conv) => {

    if(!utils.isGoogleInstance(agent, conv)) return;

    conv.data.flaskblogtoken = await loginToFlaskBlog(agent, conv);

    if(conv.data.flaskblogtoken){
        conv.ask("Your flask blog account has been synchronize with google account");
        agent.add(conv);
        return;
    }

    if(!conv.data.wrongPasswordCount) conv.data.wrongPasswordCount = 0;
    conv.data.wrongPasswordCount++;

    if(conv.data.wrongPasswordCount > 2){
        conv.close("You provided wrong password too much. Please make sure you remember it and try in another time");
    }
    else{
        conv.ask('going to follow up intent');
        agent.setFollowupEvent('synchronize-account-wrong-password');
    }
    agent.add(conv);
};

const loginToFlaskBlog = async (agent, conv) => {

    const user = jwt.decode(conv.request.user.idToken);

    let options = {
        method: 'POST',
        uri: 'https://flask-blog-ninhkim.herokuapp.com/api/v1/login',
        body: {
            "email": user.email,
            "password": agent.parameters['any']
        },
        json: true, // Automatically stringifies the body to JSON
        headers: {
            'content-type': 'application/json',
        }
    };

    return requestAPI(options)
            .then((result) => {
                return result["token"];
            })
            .catch((err) => {
                return null;
            });
};


const provideTitle = async (agent, conv) => {
    
    if(!utils.isGoogleInstance(agent, conv)) return;

    conv.data.flaskblogTitle = agent.parameters['any'];

    conv.ask('going to follow up intent');
    agent.setFollowupEvent('missing-flask-blog-content');
    agent.add(conv);
};

const provideContent = async (agent, conv) => {
    
    if(!utils.isGoogleInstance(agent, conv)) return;

    conv.data.flaskblogContent = agent.parameters['any'];

    let response = await postNewToBlog(conv);

    if(response) {
        conv.ask(`I've just make a post on blog with title ${conv.data.flaskblogTitle}. For more information, you can search the post has number ${response}`);
    }
    else{
        conv.ask(`Somthing wrong happend when I make a post on blog for you. Maybe you should try again`);
    }
    agent.add(conv);
};

const postNewToBlog = async conv => {

    let options = {
        method: 'POST',
        uri: 'https://flask-blog-ninhkim.herokuapp.com/api/v1/post',
        body: {
            "title": conv.data.flaskblogTitle,
            "content": conv.data.flaskblogContent
        },
        json: true, // Automatically stringifies the body to JSON
        headers: {
            'content-type': 'application/json',
        },
        auth: {
            'bearer': conv.data.flaskblogtoken
        }
    };

   return requestAPI(options)
            .then((result) => {
                return result["id"];
            })
            .catch((err) => {
                return null;
            });
};



exports.provideToken = provideToken;
exports.createPost = createPost;
exports.provideTitle = provideTitle;
exports.provideContent = provideContent;