'use strict';

module.exports = function (app) {

  const API_URL = "https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/[symbol]/quote"

  app.route('/api/stock-prices')
    .get(function (req, res){
      
    });
    
};
