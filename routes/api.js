'use strict';

const crypto = require('crypto');

const stockLikes = {};
const ipLikes = {};

module.exports = function (app) {

  const API_URL = "https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/[symbol]/quote"

  app.route('/api/stock-prices')
    .get(async function (req, res){
      let { stock, like } = req.query;
      const clientIp = req.ip;
      const ipHash = crypto.createHash('sha256').update(clientIp).digest('hex');

      if (typeof stock === 'string') {
        stock = [stock];
      } else if (!Array.isArray(stock)) {
        stock = [];
      }

      if (stock.length === 0) {
        return res.status(400).json({ error: 'No stock symbol provided' });
      }

      try {
        const stockDataPromises = stock.map(async (symbol) => {
          try { 
            const response = await fetch(API_URL.replace('[symbol]', symbol))
            if (!response.ok) {
              console.error(`Fetch failed for symbol: ${symbol}, status: ${response.status}`);
              throw new Error(`Failed to fetch data for symbol: ${symbol}`);
            }
            const data = await response.json();
            console.log(`Proxy API response for symbol: ${symbol}`, data);

            if (!data.symbol || data.latestPrice == null) {
              return { error: `Invalid stock symbol: ${symbol}` };
            }

            const symbolFromApi = data.symbol.toUpperCase();
            const price = Number(data.latestPrice);

            if (isNaN(price)) {
              return { error: `Invalid price for symbol: ${symbol}` };
            }

            if (!stockLikes[symbol]) {
              stockLikes[symbol] = 0;
            }

            if (like === "true") {
              if (!ipLikes[ipHash]) {
                ipLikes[ipHash] = new Set();
              }

              if (!ipLikes[ipHash].has(symbol)) {
                stockLikes[symbol]++;
                ipLikes[ipHash].add(symbol);
              }
            }

            return {
              stock: symbolFromApi,
              price: price,
              likes: Number(stockLikes[symbol])
            };
          } catch (error) {
            console.error(`Error fetching data for symbol: ${symbol}`, error);
            return { error: `Error fetching data for symbol: ${symbol}: ${error.message}` };
          }
        });

        const stockDataArray = await Promise.all(stockDataPromises);

        const hasErrors = stockDataArray.some(data => data.error);
        if (hasErrors) {
          return res.status(400).json({ stockData: stockDataArray.map((data) => data.error ? { error: data.error } : data)});
        }

        if (stockDataArray.length === 2) {
          const relLikes = stockDataArray[0].likes - stockDataArray[1].likes;
          stockDataArray[0].rel_likes = relLikes;
          stockDataArray[1].rel_likes = -relLikes;
          delete stockDataArray[0].likes;
          delete stockDataArray[1].likes;
          res.json({ stockData: stockDataArray });
        } else {
          res.json({ stockData: stockDataArray[0] });
        }

      } catch (error) {
        console.error(`Error processing request`, error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
      }

    });
    
};

module.exports.stockLikes = stockLikes;
module.exports.ipLikes = ipLikes;
