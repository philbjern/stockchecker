const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

describe('Functional Tests', function() {

  it("should fetch stock data for one stock", function (done) {
    chai.
      request(server)
      .keepOpen()
      .get('/api/stock-prices')
      .query({stock: 'AAPL'})
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.isObject(res.body);
        assert.property(res.body, 'stockData');
        assert.property(res.body.stockData, 'stock');
        assert.property(res.body.stockData, 'price');
        assert.property(res.body.stockData, 'likes');
        assert.equal(res.body.stockData.stock, 'AAPL');
        done();
      });
  });

  it("should fetch stock data with like", function (done) {
    chai.
      request(server)
      .keepOpen()
      .get('/api/stock-prices')
      .query({stock: 'AAPL', like: true})
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.isObject(res.body);
        assert.property(res.body, 'stockData');
        assert.property(res.body.stockData, 'stock');
        assert.property(res.body.stockData, 'price');
        assert.property(res.body.stockData, 'likes');
        assert.equal(res.body.stockData.stock, 'AAPL');
        assert.isAtLeast(res.body.stockData.likes, 1);
        done();
      });
  });

  it("should prevent multiple likes from the same IP", function (done) {
    const ip = "124.124.124.124";
    chai
      .request(server)
      .keepOpen()
      .get('/api/stock-prices')
      .set('X-Forwarded-For', ip)
      .query({stock: 'AAPL', like: true})
      .end(function() {
        chai
          .request(server)
          .keepOpen()
          .get('/api/stock-prices')
          .set('X-Forwarded-For', ip)
          .query({stock: 'AAPL', like: true})
          .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.isObject(res.body);
            assert.property(res.body, 'stockData');
            assert.property(res.body.stockData, 'stock');
            assert.property(res.body.stockData, 'price');
            assert.property(res.body.stockData, 'likes');
            assert.equal(res.body.stockData.stock, 'AAPL');
            assert.equal(res.body.stockData.likes, 1);
            done();
          });
      });
  });

});
