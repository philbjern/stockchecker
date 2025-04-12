const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const { application } = require('express');

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

  it('should fetch data for two stocks', function (done) {
    chai
      .request(server)
      .keepOpen()
      .get('/api/stock-prices')
      .query({stock: ['AAPL', 'GOOG']})
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.property(res.body, 'stockData');
        assert.isArray(res.body.stockData);
        assert.lengthOf(res.body.stockData, 2);
        const [ aapl, goog ] = res.body.stockData;
        assert.property(aapl, 'stock');
        assert.property(aapl, 'price');
        assert.property(aapl, 'rel_likes');
        assert.property(goog, 'stock');
        assert.property(goog, 'price');
        assert.property(goog, 'rel_likes');
        done();
      })
  });

  it('should fetch data for two stocks and record likes', function (done) {
    const ip1 = '123.123.123.123';
    const ip2 = '123.123.123.124';

    chai
      .request(server)
      .keepOpen()
      .get('/api/stock-prices')
      .set('X-Forwarded-For', ip1)
      .query({ stock: 'GOOG', like: true })
      .end(function () {
        chai
          .request(server)
          .keepOpen()
          .get('/api/stock-prices')
          .set('X-Forwarded-For', ip2)
          .query({ stock: 'MSFT', like: true })
          .end(function () {
            chai
              .request(server)
              .keepOpen()
              .get('/api/stock-prices')
              .query({ stock: ['GOOG', 'MSFT'] })
              .end(function (err, res) {
                assert.equal(res.status, 200);
                assert.property(res.body, 'stockData');
                assert.isArray(res.body.stockData);
                assert.lengthOf(res.body.stockData, 2);

                const [ goog, msft ] = res.body.stockData;
                assert.equal(goog.stock, 'GOOG');
                assert.equal(msft.stock, 'MSFT');
                assert.property(goog, 'rel_likes');
                assert.property(msft, 'rel_likes');
                assert.strictEqual(goog.rel_likes + msft.rel_likes, 0);
                assert.isNumber(goog.rel_likes);
                assert.isNumber(msft.rel_likes);

                done();
              })
          })
      })
  });

});
