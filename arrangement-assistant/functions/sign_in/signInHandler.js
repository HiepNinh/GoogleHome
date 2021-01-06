const { SignIn } = require('actions-on-google');
const jwt = require('jsonwebtoken');




const askForSignIn = (agent, conv) => {

    conv.ask(new SignIn("To personalize your experience"));
    agent.add(conv);
};

const getSignIn = (agent, conv) => {

    const user = jwt.decode(conv.request.user.idToken);

    if(!user) {
        conv.ask("I respect your privacy. I will try to provide you great services even without your data.");
    }else{
        conv.ask(`Hi ${user.name}`);
    }
    
    agent.add(conv);
};


exports.askForSignIn = askForSignIn;
exports.getSignIn = getSignIn;