const utils = require('../utils/utils');
const {Image, BrowseCarousel, BrowseCarouselItem} = require('actions-on-google');
const crytoPredictHandler = require('./bitcoinInvestHandler');


const predictInvestmentVariousOfTime = async (agent, conv) => {

    if(!utils.isGoogleInstance(agent, conv)) return;

    let now = new Date();
    now.setDate(now.getDate() - 1);
    let takeProfitDate = utils.formatDate(now);

    let cryto_name = agent.parameters['cryto-currency-name'];
    let currency_name = 'VND';
    let capital = 100000000;

    //beginning of the year
    investDate = new Date();
    investDate.setDate(1);
    investDate.setMonth(0);
    let startOfYear = utils.formatDate(investDate);

    //one year ago
    investDate = new Date();
    investDate.setFullYear(investDate.getFullYear() - 1);
    let aYearAgo = utils.formatDate(investDate);

    //two years ago
    investDate = new Date();
    investDate.setFullYear(investDate.getFullYear() - 2);
    let twoYearAgo = utils.formatDate(investDate);

    //three years ago
    investDate = new Date();
    investDate.setFullYear(investDate.getFullYear() - 3);
    let threeYearAgo = utils.formatDate(investDate);

    //calculate investment
    let investmentStartOfYear = await crytoPredictHandler.evaluateProfit(conv, startOfYear, takeProfitDate, cryto_name, capital, currency_name);
    let investmentAYearAgo = await crytoPredictHandler.evaluateProfit(conv, aYearAgo, takeProfitDate, cryto_name, capital, currency_name);
    let investmentTwoYearAgo = await crytoPredictHandler.evaluateProfit(conv, twoYearAgo, takeProfitDate, cryto_name, capital, currency_name);
    let investmentThreeYearAgo = await crytoPredictHandler.evaluateProfit(conv, threeYearAgo, takeProfitDate, cryto_name, capital, currency_name);

    if(utils.hasScreenSurface(conv) && utils.hasWebBrowserSurface(conv)){
        conv.ask(`This is how much you would earn with ${cryto_name} if you invest ${utils.formatMoney(capital)} ${currency_name}`);
        let items = [];
        items.push(displayForScreenSurfaceDevice(investmentStartOfYear));
        items.push(displayForScreenSurfaceDevice(investmentAYearAgo));
        items.push(displayForScreenSurfaceDevice(investmentTwoYearAgo));
        items.push(displayForScreenSurfaceDevice(investmentThreeYearAgo));

        conv.ask(new BrowseCarousel({
            items: items
        }));
    }else if(utils.hasAudioSurface(conv)){
        let responseAudio = "<speak>";
        responseAudio += displayForAudioSurfaceDevice(investmentStartOfYear);
        responseAudio += displayForAudioSurfaceDevice(investmentAYearAgo);
        responseAudio += "</speak>";
        conv.ask(responseAudio);
    }else{
        responseDefault += defaultTextResponseForListPost(investmentStartOfYear);
        responseDefault += defaultTextResponseForListPost(investmentAYearAgo);
        conv.ask(responseDefault);
    }

    agent.add(conv);
};

const displayForAudioSurfaceDevice = (investmentResult) => {

    return `If you invested ${utils.formatMoney(investmentResult.capital)} ${investmentResult.currency_name} in ${investmentResult.cryto_name}<break time="400ms" />` +
                `on <say-as interpret-as="date" format="yyyymmdd" detail="1">${investmentResult.investDate}</say-as><break time="400ms" />` +
                `you would have earned ${utils.formatMoney(investmentResult.profit.toFixed(2))} ${investmentResult.currency_name}. <break time="500ms" />`
};

const defaultTextResponseForListPost = (investmentResult) => {

    return `If you invested ${utils.formatMoney(investmentResult.capital)} ${investmentResult.currency_name} in ${investmentResult.cryto_name} 
                on ${investmentResult.investDate} you would have earned ${utils.formatMoney(investmentResult.profit.toFixed(2))} ${investmentResult.currency_name}. `;
};

const displayForScreenSurfaceDevice = (investmentResult) => {

    return new BrowseCarouselItem({
                title: `Earn ${utils.formatMoney(investmentResult.profit)} ${investmentResult.currency_name} with ${investmentResult.cryto_name}`,
                url: `https://coinmarketcap.com/`,
                description: `Beginning of this month with buying price is ${utils.formatMoney(investmentResult.buyingPrice)} ${investmentResult.currency_name}`,
                image: new Image({
                    url: `https://kodudinh.com/wp-content/uploads/2020/11/mua-btc2020.jpg`,
                    alt: `CoinMarketCap`
                }),
                footer: `Buy ${investmentResult.cryto_name}`
            });
};



exports.predictInvestmentVariousOfTime = predictInvestmentVariousOfTime;
