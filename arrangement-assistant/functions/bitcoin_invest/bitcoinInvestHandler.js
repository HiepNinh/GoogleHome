const utils = require('../utils/utils');
const { BasicCard, Button, Image} = require('actions-on-google');
const crytoPriceHandler = require('./crytoPrice');



const predictInSpecificPeriod = async (agent, conv) => {
    
    if(!utils.isGoogleInstance(agent, conv)) return;

    //save all missing context as list in conv data
    findMissingParameters(agent, conv);

    if(isExistingMissingContex(agent, conv)) return;
    
    let investmentResult = await evaluateProfit(conv, conv.data.investDate, conv.data.takeProfitDate, conv.data.cryto_name, conv.data.capital, conv.data.currency_name);
    if(!investmentResult){
        conv.close("Maybe your cryptocurency or currency you provided is not supported. Please choose another one");
    }
    else{
        displayResultBaseOnSurface(conv, investmentResult);
    }

    agent.add(conv);
}

const findMissingParameters = (agent, conv) => {
    
    conv.data.missingParameters = [];

    //missing cryto name
    if(!agent.parameters['cryto-currency-name'] || agent.parameters['cryto-currency-name'] === "") 
        conv.data.missingParameters.push('cryto-currency-name');
    else storingCrytoNameToConv(agent, conv);

    //missing invest date
    if(!agent.parameters['select-option-date'] || agent.parameters['select-option-date'] === "") 
        conv.data.missingParameters.push('select-option-date');
    else storingInvestDateToConv(agent, conv);

    //missing capital
    if(!agent.parameters['number'] || agent.parameters['number'] === "") 
        conv.data.missingParameters.push('number');
    else storingCapitalToConv(agent, conv);

    //missing currency name
    if(!agent.parameters['currency-name'] || agent.parameters['currency-name'] === "") 
        conv.data.missingParameters.push('currency-name');
    else storingCurrencyNameToConv(agent, conv);
};

const storingInvestDateToConv = (agent, conv) => {

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

    conv.data.investDate = utils.formatDate(calculatedDate);
    now.setDate(now.getDate() - 1);
    conv.data.takeProfitDate = utils.formatDate(now);
}

const storingCapitalToConv = (agent, conv) => conv.data.capital = agent.parameters['number'];

const storingCrytoNameToConv = (agent, conv) => conv.data.cryto_name = agent.parameters['cryto-currency-name'];

const storingCurrencyNameToConv = (agent, conv) => conv.data.currency_name = agent.parameters['currency-name'];

const isExistingMissingContex = (agent, conv) => {

    if(conv.data.missingParameters.length <= 0) return false;

    switch(conv.data.missingParameters[0]){
        case 'cryto-currency-name':
            agent.setFollowupEvent('missing-cryto-name');
            break;
        
        case 'select-option-date':
            agent.setFollowupEvent('missing-invest-date');
            break;

        case 'number':
            agent.setFollowupEvent('missing-capital');
            break;

        case 'currency-name':
            agent.setFollowupEvent('missing-currency-name');
            break;
    }

    conv.ask('going to follow up intent');
    agent.context.set('earnwithbitcoininspecificperiod-followup', 1, null);
    agent.add(conv);

    return true;
};

const evaluateProfit = async (conv, investDate, takeProfitDate, cryto_name, capital, currency_name) => {

    let buyingPrice = await crytoPriceHandler.getCrytoPrice(conv, investDate, cryto_name, currency_name);
    let sellingPrice = await crytoPriceHandler.getCrytoPrice(conv, takeProfitDate, cryto_name, currency_name);

    if(!buyingPrice || !sellingPrice) return null;
    
    let boughtAmount = capital / buyingPrice;
    let profit = boughtAmount * sellingPrice - capital;

    return {
        capital,
        currency_name,
        cryto_name,
        investDate,
        takeProfitDate,
        buyingPrice,
        sellingPrice,
        boughtAmount,
        profit
    };
};

var displayResultBaseOnSurface = (conv, investmentResult) => {

    if(utils.hasAudioSurface(conv)){
        displayForAudioSurfaceDevice(conv, investmentResult);
    }else{
        defaultTextResponseForListPost(conv, investmentResult);
    }

    if(utils.hasScreenSurface(conv)){
        displayForScreenSurfaceDevice(conv, investmentResult);
    }
};

const defaultTextResponseForListPost = (conv, investmentResult) => {

    let textList = `If you invested ${utils.formatMoney(investmentResult.capital)} ${investmentResult.currency_name} in ${investmentResult.cryto_name} 
        on ${investmentResult.investDate} you would buy ${investmentResult.boughtAmount.toFixed(2)} ${investmentResult.cryto_name}
        with buying price is ${utils.formatMoney(investmentResult.buyingPrice.toFixed(2))} ${investmentResult.currency_name}. 
        If you sold all on ${investmentResult.takeProfitDate} you would have earned ${utils.formatMoney(investmentResult.profit.toFixed(2))} ${investmentResult.currency_name}
        with selling price is ${utils.formatMoney(investmentResult.sellingPrice.toFixed(2))} ${investmentResult.currency_name}.`;

    conv.ask(textList);
};

const displayForAudioSurfaceDevice = (conv, investmentResult) => {

    let ssmlText = '<speak>' +
                        `If you invested ${utils.formatMoney(investmentResult.capital)} ${investmentResult.currency_name} in ${investmentResult.cryto_name}<break time="400ms" />` +
                        `on <say-as interpret-as="date" format="yyyymmdd" detail="1">${investmentResult.investDate}</say-as><break time="400ms" />` +
                        `you would buy ${investmentResult.boughtAmount.toFixed(2)} ${investmentResult.cryto_name}<break time="500ms" />` +
                        `with buying price is ${utils.formatMoney(investmentResult.buyingPrice.toFixed(2))} ${investmentResult.currency_name}. <break time="1" />` +
                        `If you sold all on <say-as interpret-as="date" format="yyyymmdd" detail="1">${investmentResult.takeProfitDate}</say-as><break time="400ms" />` +
                        `you would have earned ${utils.formatMoney(investmentResult.profit.toFixed(2))} ${investmentResult.currency_name}<break time="500ms" />` +
                        `with selling price is ${utils.formatMoney(investmentResult.sellingPrice.toFixed(2))} ${investmentResult.currency_name}` +
                    '</speak>';
    conv.ask(ssmlText);
};

const displayForScreenSurfaceDevice = (conv, investmentResult) => {

    let text = `${investmentResult.cryto_name.toUpperCase()} price on ${investmentResult.investDate}: ${investmentResult.buyingPrice.toFixed(2)} ${investmentResult.currency_name.toUpperCase()} \n
    Investment: ${utils.formatMoney(investmentResult.capital)} ${investmentResult.currency_name.toUpperCase()} \n
    Selling price on ${investmentResult.takeProfitDate}: ${investmentResult.sellingPrice.toFixed(2)} ${investmentResult.currency_name.toUpperCase()} \n
    Profit: ${utils.formatMoney(investmentResult.profit.toFixed(2))} ${investmentResult.currency_name.toUpperCase()}`;

    conv.ask(new BasicCard({
        text: text,
        subtitle: `Investment date ${investmentResult.investDate}`,
        title: `Investment return ${utils.formatMoney(investmentResult.profit.toFixed(2))} ${investmentResult.currency_name.toUpperCase()}`,
        buttons: new Button({
            title: 'Read more',
            url: 'https://coinmarketcap.com/',
        }),
        image: new Image({
            url: "https://kodudinh.com/wp-content/uploads/2020/11/mua-btc2020.jpg",
            alt: "BTC to the moon",
        }),
        display: 'CROPPED',
    }));
}

const provideMissingCapital = async (agent, conv) => {

    if(!utils.isGoogleInstance(agent, conv)) return;

    //remove mising parameter mark from conv
    conv.data.missingParameters.shift();
    //save provided number in conv data
    storingCapitalToConv(agent, conv);

    if(isExistingMissingContex(agent, conv)) return;

    //calculate investment and display
    let investmentResult = await evaluateProfit(conv, conv.data.investDate, conv.data.takeProfitDate, conv.data.cryto_name, conv.data.capital, conv.data.currency_name);
    if(!investmentResult){
        conv.close("Maybe your cryptocurency or currency you provided is not supported. Please choose another one");
    }
    else{
        displayResultBaseOnSurface(conv, investmentResult);
    }

    agent.add(conv);
};

const provideMissingCrytoName = async (agent, conv) => {

    if(!utils.isGoogleInstance(agent, conv)) return;

    //remove mising parameter mark from conv
    conv.data.missingParameters.shift();
    //save provided cryto name in conv data
    storingCrytoNameToConv(agent, conv);

    if(isExistingMissingContex(agent, conv)) return;

    //calculate investment and display
    let investmentResult = await evaluateProfit(conv, conv.data.investDate, conv.data.takeProfitDate, conv.data.cryto_name, conv.data.capital, conv.data.currency_name);
    if(!investmentResult){
        conv.close("Maybe your cryptocurency or currency you provided is not supported. Please choose another one");
    }
    else{
        displayResultBaseOnSurface(conv, investmentResult);
    }

    agent.add(conv);
};

const provideMissingCurrencyName = async (agent, conv) => {

    if(!utils.isGoogleInstance(agent, conv)) return;

    //remove mising parameter mark from conv
    conv.data.missingParameters.shift();
    //save provided currency name in conv data
    storingCurrencyNameToConv(agent, conv);

    if(isExistingMissingContex(agent, conv)) return;

    //calculate investment and display
    let investmentResult = await evaluateProfit(conv, conv.data.investDate, conv.data.takeProfitDate, conv.data.cryto_name, conv.data.capital, conv.data.currency_name);
    if(!investmentResult){
        conv.close("Maybe your cryptocurency or currency you provided is not supported. Please choose another one");
    }
    else{
        displayResultBaseOnSurface(conv, investmentResult);
    }

    agent.add(conv);
};

const provideMissingInvestDate = async (agent, conv) => {

    if(!utils.isGoogleInstance(agent, conv)) return;

    //remove mising parameter mark from conv
    conv.data.missingParameters.shift();
    //save provided invest date in conv data
    storingInvestDateToConv(agent, conv);

    if(isExistingMissingContex(agent, conv)) return;

    //calculate investment and display
    let investmentResult = await evaluateProfit(conv, conv.data.investDate, conv.data.takeProfitDate, conv.data.cryto_name, conv.data.capital, conv.data.currency_name);
    if(!investmentResult){
        conv.close("Maybe your cryptocurency or currency you provided is not supported. Please choose another one");
    }
    else{
        displayResultBaseOnSurface(conv, investmentResult);
    }

    agent.add(conv);
};


exports.predictInSpecificPeriod = predictInSpecificPeriod;
exports.provideMissingCapital = provideMissingCapital;
exports.provideMissingCrytoName = provideMissingCrytoName;
exports.provideMissingCurrencyName = provideMissingCurrencyName;
exports.provideMissingInvestDate = provideMissingInvestDate;
exports.evaluateProfit = evaluateProfit;