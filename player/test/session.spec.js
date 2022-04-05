const expect =require('chai').expect; //utilize chai assertion library 'expect'
const sinon = require('sinon'); //base sinon
const chai = require ("chai"); //base chai
const chaiAsPromised = require("chai-as-promised");
const { createSandbox } = require ("sinon");
const { getQueryResult } = require('../service/plugins/routes/lib/session');
const Session = require('../service/plugins/routes/lib/session.js');//So Session is exported, can we get it's function here through this?
const { assert } = require('chai');
const spy = sinon.spy();
const sandbox = require("sinon").createSandbox();

describe.only('Test of tryGetQueryResult function', async function() {
   //stub the trygetqueryresult func, which basically wraps 'getQueryResult'
    var tgqrStub = sinon.stub(Session,'tryGetQueryResult').callsFake(getQueryResult(txn, sessionId, tenantId)).returns(txn);
    var txn = {}; //a transaction object
    var txnRollback = false; //to track whether the mocked txn is rolled back
    var sessionId = 1234; //Session id
    var tenantId = 'tenantID'; //tenant id

    it('passes three arguments to getQueryResult function', async function()  {
      await Session.tryGetQueryResult(txn, sessionId, tenantId);
      expect(tgqrStub.calledOnce);
      //call with these three arguments
      expect(tgqrStub.calledWith(txn, sessionId, tenantId));
      //retreive returned data (from first and only call)
      var data = tgqrStub.getCall(0);
      console.log(data.args);
      console.log(data.returnValue);
      expect(data.returnValue).to.equal(txn)
      console.log(txn);
      console.log(tgqrStub);
   });
   
   it.skip('tries to return the txn(transaction) from getQueryResult,', async function (){
      await Session.tryGetQueryResult(txn, sessionId, tenantId);
      Promise.resolve(txn);
     // expect(tgqrStub.withArgs(txn, sessionId, tenantId).returns(txn, txnRollback = false));
      console.log(txn)
      //retreive returned data (from first and only call)
      var data = tgqrStub.getCall(0);
      console.log(tgqrStub);
     // data.returnValue.should.equal(txn);
      console.log(data.args);
      console.log(data.resolve)
      //expect(data.returnValue).to.equal(txn);
      expect(data.resolve).to.equal(txn)
      console.log(txn)
      //expect(txnRollback).to.be.false;

      //gqrStub.reset();
   });

   it.skip('rollsback the txn (transaction) with requested table information if they do not match', function (){
      nomatchSessionId = 'nomatch sessionId', //let these be the value it looks for in DB, in this case it finds nothing there
      nomatchTenantId = 'nomatch tenantID';

      gqrStub.withArgs(txn, nomatchSessionId, nomatchTenantId).returns(txn, txnRollback = true);
      expect(gqrStub(txn, nomatchSessionId, nomatchTenantId)).to.be.equal(txn);
      expect(txnRollback).to.be.true;

      gqrStub = function () {throw('Failed to select session, registration course AU, registration and course AU for update:')}  
      
      expect(gqrStub).to.throw('Failed to select session, registration course AU, registration and course AU for update:');
      
               
   });

})


describe.skip('Test of getQueryResult', function() {
   //stub the queryresult func
   var gqrStub = sinon.stub(Session,'getQueryResult')
   //var txn = {returnTXN: returnedTXN = sinon.spy()}; 
   var txn = {}; //a transaction object
   var txnRollback = false; //to track whether the mocked txn is rolled back
   var sessionId = 12345; //Session id
   var tenantId = 'tenantID'; //tenant id

   it('takes three arguments',  function()  {
      ///if we call with the correct three args, we want it to return a transaction object (knex query)
      gqrStub.withArgs(txn, sessionId, tenantId).returns(txn);
      expect(Session.getQueryResult(txn, sessionId, tenantId)).to.be.equal(txn);
      expect(txnRollback).to.be.false;
      console.log(txn);
      gqrStub.reset();
   });
       
   it('returns the txn(transaction) with requested table information if they match', function (){
      let sessionId = 'correct sessionId', //let this be the value it looks for in DB
      tenantId = 'correct tenantID';
         
      gqrStub.withArgs(txn, sessionId, tenantId).returns(txn, txnRollback = false);
      
      expect(gqrStub(txn, sessionId, tenantId)).to.be.equal(txn);
      expect(txnRollback).to.be.false;

      gqrStub.reset();
   });

   it('rollsback the txn (transaction) with requested table information if they do not match', function (){
      nomatchSessionId = 'nomatch sessionId', //let these be the value it looks for in DB, in this case it finds nothing there
      nomatchTenantId = 'nomatch tenantID';

      gqrStub.withArgs(txn, nomatchSessionId, nomatchTenantId).returns(txn, txnRollback = true);
      expect(gqrStub(txn, nomatchSessionId, nomatchTenantId)).to.be.equal(txn);
      expect(txnRollback).to.be.true;

      gqrStub = function () {throw('Failed to select session, registration course AU, registration and course AU for update:')}  
      
      expect(gqrStub).to.throw('Failed to select session, registration course AU, registration and course AU for update:');
      
               
   });
});