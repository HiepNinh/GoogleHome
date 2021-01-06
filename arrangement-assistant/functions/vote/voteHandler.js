const makeAVote = (agent, conv, admin) => {
    let textResponse = '';
    let singer = agent.parameters['singer'];
    
    if(singer){
        let convertedSingerName = singer.trim().replace(" ", "-").toLowerCase();
        saveToRealTimeDatabase(convertedSingerName, admin);
        textResponse = `You've just voted for ${convertedSingerName}. Thank you for voting`;
        conv.ask(textResponse);
    }
    else{
        if(checkingFrustration(conv)){
            textResponse = `Thanks for voting. Your vote is confusing. Try again later`;
            conv.close(textResponse);
        }
        else{
            textResponse = request.body.queryResult.fulfillmentText;
            conv.ask(textResponse);
        }
    }
    agent.add(conv);
}

const saveToRealTimeDatabase = (nodeName, admin) => {
    let currentArtist = admin.database().ref().child(`/artists/${nodeName}`);

    currentArtist.once('value', (snapshot) => {
        if(snapshot.exists() && snapshot.hasChild('votes')){
            let obj = snapshot.val();
            currentArtist.update({
                votes: obj.votes + 1
            });
        }
        else{
            currentArtist.set({
                votes: 1,   
                name: nodeName.replace("-", " ")
            });
        }
    });
}

const checkingFrustration = conv => {
    if(!conv.data.voteFallback){
        conv.data.voteFallback = 0;
    }
    conv.data.voteFallback++;

    return conv.data.voteFallback > 2 ? true : false;
}

const showResult = async (agent, admin) => {
    let voteResultsRef = admin.database().ref('artists').orderByChild('votes');

    let results = [];
    await voteResultsRef.once('value', (snapshot) => {
        snapshot.forEach((childSnapShot) => {
            let data = childSnapShot.val();
            results.push(data);
        });
    });

    let textResponse = 'Vote result are: \n';
    for (let item of results){
        textResponse += `${item.name} has ${item.votes} ${item.votes > 1 ? 'votes' : 'vote'}. `;
    }
    agent.add(textResponse);
}
exports.makeAVote = makeAVote;
exports.showResult = showResult;