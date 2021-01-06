const requestAPI = require('request-promise');
const utils = require('../utils/utils');
const { BasicCard, Button, Image, List} = require('actions-on-google');



//show single post
//by BrianKim
const showAPost = async (agent, conv) => {

    if(!utils.isGoogleInstance(agent, conv)) return;
    
    conv.data.postCount = 0;
    if(!conv.data.flaskblogdata || conv.data.flaskblogdata.length === 0) {
        let posts = await getPostsFromBlog();
        savePostsToTemp(conv, posts);
        displaySinglePost(agent, conv, conv.data.flaskblogdata);
    }
    else{
        displaySinglePost(agent, conv, conv.data.flaskblogdata);
    }
}

const getPostsFromBlog = () => requestAPI('https://flask-blog-ninhkim.herokuapp.com/api/v1/posts?page_size=100');

const savePostsToTemp = (conv, data) => {

    if(!conv.data.flaskblogdata) conv.data.flaskblogdata = [];

    conv.data.flaskblogdata = JSON.parse(data);
}

const displaySinglePost = (agent, conv, posts) => {

    if(posts.length <= 0 || conv.data.postCount < 0 || conv.data.postCount >= posts.length) {
        let textResponse = 'No posts are available at this time';
        conv.close(textResponse);
    }
    else{
        let selectedPost = posts[conv.data.postCount];

        //the order is matter, AUDIO or TEXT response must be set before SCREEN
        //if device has audio surface
        if(utils.hasAudioSurface(conv)){
            displayForAudioSurfaceDevice(conv, selectedPost);
        }
        else{
            let textResponse = `Post number 1:\n ${selectedPost.title} on ${new Date(selectedPost.date_posted).toDateString()}`;
            conv.ask(textResponse);
        }

        //if device has screen surface
        if(utils.hasScreenSurface(conv)){
            displayForScreenSurfaceDevice(conv, selectedPost);
        }
    }
    agent.add(conv);
};

const displayForAudioSurfaceDevice = (conv, data) => {

    let ssmlText = '<speak>' +
                    ' <say-as interpret-as="ordinal">' + (conv.data.postCount + 1) + '</say-as> post. ' +
                    ' Is ' + data.title + '. <break time="1" />' +
                    ' On ' + new Date(data.date_posted).toDateString() + '. <break time="1" />' +
                    '<break time="600ms" />For more visit website. <break time="800ms" />' +
                    ' Say next post for more.' +
                    '</speak>';
    conv.ask(ssmlText);
};

const displayForScreenSurfaceDevice = (conv, data) => {

    let image = `https://flask-blog-ninhkim.herokuapp.com${data.image_file}`;
    conv.ask(new BasicCard({
        text: '',
        subtitle: 'on ' + data.date_posted,
        title: data.title,
        buttons: new Button({
            title: 'Read more',
            url: 'https://flask-blog-ninhkim.herokuapp.com',
        }),
        image: new Image({
            url: image,
            alt: data.title,
        }),
        display: 'CROPPED',
    }));
}

const showNextPost = async (agent, conv) => {

    if(!utils.isGoogleInstance(agent, conv)) return;

    conv.data.postCount++;
    displaySinglePost(agent, conv, conv.data.flaskblogdata);
};

const showPrevPost = async (agent, conv) => {

    if(!utils.isGoogleInstance(agent, conv)) return;

    conv.data.postCount--;
    displaySinglePost(agent, conv, conv.data.flaskblogdata);
};

const repeatPost = async (agent, conv) => {

    if(!utils.isGoogleInstance(agent, conv)) return;

    displaySinglePost(agent, conv, conv.data.flaskblogdata);
};

//show list posts
//by BrianKim
const showPostsList = async (agent, conv) => {

    if(!utils.isGoogleInstance(agent, conv)) return;
    
    if(!conv.data.flaskblogdata || conv.data.flaskblogdata.length === 0) {
        let posts = await getPostsFromBlog();
        savePostsToTemp(conv, posts);
    }
    
    displayListPost(agent, conv, conv.data.flaskblogdata);
};

const displayListPost = (agent, conv, posts) => {

    if(posts.length <= 0) {
        let textResponse = 'No posts are available at this time';
        conv.close(textResponse);
    }
    else{
        //the order is matter, AUDIO or TEXT response must be set before SCREEN
        //if device has audio surface
        if(utils.hasAudioSurface(conv)){
            displayListForAudioSurfaceDevice(conv, posts, 3);
        }
        else{
            defaultTextResponseForListPost(conv, posts, 3);
        }

        //if device has screen surface
        if(utils.hasScreenSurface(conv)){
            displayListForScreenSurfaceDevice(conv, posts);
        }
    }
    agent.add(conv);
};

const defaultTextResponseForListPost = (conv, posts, numberToResponse) => {

    let textList = 'This is a list of posts. Please select one of them to proceed. ';

    for(let i = 0; i < posts.length; i++){
        let post = posts[i];
        textList += `Post number ${i+1}:\n ${post.title} on ${new Date(post.date_posted).toDateString()}`;
        if(i >= numberToResponse) break;
    }

    conv.ask(textList);
};

const displayListForAudioSurfaceDevice = (conv, posts, numberToResponse) => {

    let ssmlText = '<speak>This is a list of posts. Please select one of them. <break time="1500ms" />';
    for(let i = 0; i < posts.length; i++){
        let post = posts[i];
        ssmlText += '  <say-as interpret-as="ordinal">' + (i + 1) + '</say-as> posts. ' +
                        '  <break time="500ms" />' +
                        'Is ' + post.title + '. <break time="700ms" />' +
                        ' On ' + new Date(post.date_posted).toDateString() + '.' +
                        ' For more information say "post ' + (i + 1) + '". <break time="1200ms" />';
        if(i >= numberToResponse) break;
    }
    ssmlText += '</speak>';
    
    conv.ask(ssmlText);
};

const displayListForScreenSurfaceDevice = (conv, posts) => {

    let items = {};

    for(let i = 0; i < posts.length; i++){
        let post = posts[i];
        items['post ' + i] = {
            title: 'post ' + (i + 1),
            description: post.title,
            image: new Image({
                url: `https://flask-blog-ninhkim.herokuapp.com${post.image_file}`,
                alt: post.title,
            })
        }
    }

    conv.ask(new List({
        title: 'List of posts: ',
        items
    }));
};

const selectPostByNumber = (agent, conv) => {

    if(!utils.isGoogleInstance(agent, conv)) return;

    let option = agent.contexts.find((obj) => obj.name === 'actions_intent_option');
    if(option && option.hasOwnProperty('parameters') && option.parameters.hasOwnProperty('OPTION')){
        conv.data.postCount = parseInt(option.parameters.OPTION.replace("post ", ""));
    }

    let number = agent.parameters['number'];
    if ( number.length > 0 ) {
        conv.data.postCount = parseInt(number[0]) - 1;
    }

    displaySinglePost(agent, conv, conv.data.flaskblogdata);
}

//show list with specific requirement
//by BrianKim
const selectPostsInSpecificRequirement = async (agent, conv) => {

    if(!utils.isGoogleInstance(agent, conv)) return;
    
    //save all missing context as list in conv data
    findMissingParameters(agent, conv);

    if(isExistingMissingContex(agent, conv)) return;

    await displayListPostInSpecificReuirement(conv);
    agent.add(conv);
}

const findMissingParameters = (agent, conv) => {
    
    conv.data.missingParameters = [];

    //missing position
    if(!agent.parameters['position']) 
        conv.data.missingParameters.push('position');
    else storingPositionToConv(agent, conv);

    //missing post date
    if(!agent.parameters['select-option-date']) 
        conv.data.missingParameters.push('select-option-date');
    else storingPostedDateToConv(agent, conv);

    //missing number
    if(!agent.parameters['number']) 
        conv.data.missingParameters.push('number');
    else storingNumberToConv(agent, conv);

    //missing person
    if(!agent.parameters['any'])
        conv.data.missingParameters.push('person');
    else storingAuthorToConv(agent, conv);
};

const storingPositionToConv = (agent, conv) => conv.data.flaskblogposition = agent.parameters['position'];

const storingNumberToConv = (agent, conv) => conv.data.flaskblognumber = agent.parameters['number'];

const storingAuthorToConv = (agent, conv) => conv.data.flaskblogperson = agent.parameters['any'];

const storingPostedDateToConv = (agent, conv) => {

    let dateUnit = agent.parameters['select-option-date'].hasOwnProperty('date-unit') ?
         agent.parameters['select-option-date']['date-unit'] : false;
    let datePeriod = agent.parameters['select-option-date'].hasOwnProperty('date-period') ?
         agent.parameters['select-option-date']['date-period'] : false;
    let dateNumber = agent.parameters['select-option-date'].hasOwnProperty('number') ?
         agent.parameters['select-option-date']['number'] : 0;
    if(!datePeriod && dateNumber===0) dateNumber = 1;

    let now = new Date();
    let calculatedDate = new Date();
    
    switch(dateUnit){
        case 'day':
            calculatedDate.setDate(now.getDate() - dateNumber);
            break;

        case 'month':
            calculatedDate.setMonth(now.getMonth() - dateNumber);
            if(datePeriod == "beginning"){
                calculatedDate.setDate(1);
            }
            else if(datePeriod == "end"){
                let lastDate = new Date(calculatedDate.getFullYear(), calculatedDate.getMonth() - dateNumber, 0);
                calculatedDate.setDate(lastDate.getDate());
            }
            break;

        case 'year':
            if(dateNumber > 2000) calculatedDate.setFullYear(dateNumber);
            else if(dateNumber < 20) calculatedDate.setFullYear(now.getFullYear() - dateNumber);
            if(datePeriod == "beginning"){
                calculatedDate.setDate(1);
                calculatedDate.setMonth(0);
            }
            else if(datePeriod == "end"){
                calculatedDate.setDate(31);
                calculatedDate.setMonth(11);
            }
            break;
    }
    conv.data.flaskblogdate = calculatedDate.toString();
}

const isExistingMissingContex = (agent, conv) => {

    if(conv.data.missingParameters.length <= 0) return false;

    switch(conv.data.missingParameters[0]){
        case 'position':
            agent.setFollowupEvent('show-flask-blog-missing-position');
            break;
        
        case 'select-option-date':
            agent.setFollowupEvent('show-flask-blog-missing-date');
            break;

        case 'number':
            agent.setFollowupEvent('show-flask-blog-missing-number');
            break;

        case 'person':
            agent.setFollowupEvent('show-flask-blog-missing-author');
            break;
    }

    conv.ask('going to follow up intent');
    agent.context.set('showflaskbloginspecificrequirement-followup', 1, null);
    agent.add(conv);

    return true;
};

const filterByParameters = async (conv) => {

    if(!conv.data.flaskblogdata || conv.data.flaskblogdata.length === 0) {
        let posts = await getPostsFromBlog();
        savePostsToTemp(conv, posts);
    }

    let posts = [...conv.data.flaskblogdata]
        .filter(item => new Date(item.date_posted).getTime() >= new Date(conv.data.flaskblogdate).getTime() && item.author.toLowerCase() == conv.data.flaskblogperson.toLowerCase())
        .sort((firstItem, secondItem) => (new Date(firstItem.date_posted).getTime() < new Date(secondItem.date_posted).getTime()) ? 1 : -1);

    switch(conv.data.flaskblogposition){
        case 'top':
            return posts.slice(0, conv.data.flaskblognumber);
        
        case 'mid':
            return posts.slice(Math.floor(posts.length / 2), Math.floor(posts.length / 2) + conv.data.flaskblognumber);

        case 'bottom':
            return posts.slice(-conv.data.flaskblognumber);
        default:
            return [];
    }
}

const flaskBlogPostPositionProvided = async (agent, conv) => {

    if(!utils.isGoogleInstance(agent, conv)) return;

    //remove mising parameter mark from conv
    conv.data.missingParameters.shift();
    //save provided invest date in conv data
    storingPositionToConv(agent, conv);
    
    if(isExistingMissingContex(agent, conv)) return;

    await displayListPostInSpecificReuirement(conv);
    agent.add(conv);
};

const flaskBlogPostDateProvided = async (agent, conv) => {

    if(!utils.isGoogleInstance(agent, conv)) return;

    //remove mising parameter mark from conv
    conv.data.missingParameters.shift();
    //save provided invest date in conv data
    storingPostedDateToConv(agent, conv);
    
    if(isExistingMissingContex(agent, conv)) return;

    await displayListPostInSpecificReuirement(conv);
    agent.add(conv);
};

const flaskBlogPostNumberProvided = async (agent, conv) => {

    if(!utils.isGoogleInstance(agent, conv)) return;

    //remove mising parameter mark from conv
    conv.data.missingParameters.shift();
    //save provided invest date in conv data
    storingNumberToConv(agent, conv);
    
    if(isExistingMissingContex(agent, conv)) return;

    await displayListPostInSpecificReuirement(conv);
    agent.add(conv);
};

const flaskBlogPostAuthorProvided = async (agent, conv) => {

    if(!utils.isGoogleInstance(agent, conv)) return;

    //remove mising parameter mark from conv
    conv.data.missingParameters.shift();
    //save provided invest date in conv data
    storingAuthorToConv(agent, conv);
    
    if(isExistingMissingContex(agent, conv)) return;

    await displayListPostInSpecificReuirement(conv);
    agent.add(conv);
};

const displayListPostInSpecificReuirement = async conv => {

    //proceed when parameter is valid
    let posts = await filterByParameters(conv);

    //saving for query next, repeat or previous
    conv.data.flaskblogspecificdata = posts;

    if(posts.length <= 0) {
        let textResponse = `<speak>
        I can't find any posts of ${conv.data.flaskblogperson} 
        from <say-as interpret-as="date" format="yyyymmdd" detail="1">${conv.data.flaskblogdate}</say-as> until now. <break time="300ms" />
        Please choose another and try later.
        </speak>`;
        conv.ask(textResponse);
    }
    else{
        if(utils.hasAudioSurface(conv)){
            displayListForAudioSurfaceDevice(conv, posts, Math.min(posts.length, 10));
        }
        else{
            defaultTextResponseForListPost(conv, posts, Math.min(posts.length, 10));
        }
    
        //if device has screen surface
        if(utils.hasScreenSurface(conv)){
            displayListForScreenSurfaceDevice(conv, posts);
        }
    }
}

const selectNumberPostsInSpecificRequirement = async (agent, conv) => {

    if(!utils.isGoogleInstance(agent, conv)) return;

    let option = agent.contexts.find((obj) => obj.name === 'actions_intent_option');
    if(option && option.hasOwnProperty('parameters') && option.parameters.hasOwnProperty('OPTION')){
        conv.data.postCount = parseInt(option.parameters.OPTION.replace("post ", ""));
    }

    let number = agent.parameters['number'];
    if ( number.length > 0 ) {
        conv.data.postCount = parseInt(number[0]) - 1;
    }

    displaySinglePost(agent, conv, conv.data.flaskblogspecificdata);
};

const nextPostsInSpecificRequirement = async (agent, conv) => {
    
    if(!utils.isGoogleInstance(agent, conv)) return;

    conv.data.postCount++;
    displaySinglePost(agent, conv, conv.data.flaskblogspecificdata);
};

const previousPostsInSpecificRequirement = async (agent, conv) => {
    
    if(!utils.isGoogleInstance(agent, conv)) return;

    conv.data.postCount--;
    displaySinglePost(agent, conv, conv.data.flaskblogspecificdata);
};

const repeatPostsInSpecificRequirement = async (agent, conv) => {
    
    if(!utils.isGoogleInstance(agent, conv)) return;

    displaySinglePost(agent, conv, conv.data.flaskblogspecificdata);
};



exports.showAPost = showAPost;
exports.showNextPost = showNextPost;
exports.showPrevPost = showPrevPost;
exports.repeatPost = repeatPost;
exports.showPostsList = showPostsList;
exports.selectPostByNumber = selectPostByNumber;
exports.selectPostsInSpecificRequirement = selectPostsInSpecificRequirement;
exports.flaskBlogPostPositionProvided = flaskBlogPostPositionProvided;
exports.flaskBlogPostDateProvided = flaskBlogPostDateProvided;
exports.flaskBlogPostNumberProvided = flaskBlogPostNumberProvided;
exports.flaskBlogPostAuthorProvided = flaskBlogPostAuthorProvided;
exports.selectNumberPostsInSpecificRequirement = selectNumberPostsInSpecificRequirement;
exports.nextPostsInSpecificRequirement = nextPostsInSpecificRequirement;
exports.previousPostsInSpecificRequirement = previousPostsInSpecificRequirement;
exports.repeatPostsInSpecificRequirement = repeatPostsInSpecificRequirement;