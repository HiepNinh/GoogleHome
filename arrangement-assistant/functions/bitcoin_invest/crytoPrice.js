const requestAPI = require('request-promise');


const getCrytoPrice = (conv, date, cryto_name, currency_name) => {

    switch(cryto_name){
        case 'btc':
            if(conv.data.bitcoinPrices && conv.data.bitcoinPrices.hasOwnProperty(date)) return conv.data.bitcoinPrices[date];

            return requestAPI(`https://api.coindesk.com/v1/bpi/historical/close.json?start=${date}&end=${date}&currency=${currency_name}`)
                    .then(function (data) {
                        let assetPrice = JSON.parse(data);
                        if (assetPrice.hasOwnProperty('bpi') && assetPrice['bpi'].hasOwnProperty(date)) {

                            if(!conv.data.bitcoinPrices) conv.data.bitcoinPrices = {};

                            conv.data.bitcoinPrices[date] = assetPrice['bpi'][date];
                            return assetPrice['bpi'][date];
                        }
                    }).catch(function (err) {
                        console.log('No asset data');
                        console.log(err);
                    });

        case 'eth':
            return null;

        default:
            return null;
    }
};


exports.getCrytoPrice = getCrytoPrice;