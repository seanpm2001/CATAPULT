const expect =require('chai').expect; //utilize chai assertion library 'expect'
const sinon = require('sinon'); //base sinon
const chai = require ("chai"); //base chai
//const chaiHttp = require ("chai-http"); //this is used to mock request like GET, POST, FETCH
const chaiAsPromised = require("chai-as-promised");
const { createSandbox } = require ("sinon");
const { getQueryResult } = require('../service/plugins/routes/lib/session');
const Session = require('../service/plugins/routes/lib/session.js');//So Session is exported, can we get it's function here through this?
const { assert } = require('chai');
const spy = sinon.spy();


const sandbox = require("sinon").createSandbox();

describe('Test of getQueryResult', function() {
   //stub the queryresult func
   var gqrStub = sinon.stub(Session,'getQueryResult')

   //var txn = {returnTXN: returnedTXN = sinon.spy()}; 
   var txn = {}; //a transaction object
   var txnRollback = false; //to track whether the mocked txn is rolled back
   var sessionId = 12345;//Session id
   var tenantId = 'tenantID'; //tenant id

   beforeEach ( async function () { 
       sinon.reset();

        //var self = this;
        //var sandbox = sinon.sandbox.create();
        //var sandbox = require("sinon").createSandbox();
        //var getQueryResult = Session.getQueryResult();
    
        //this.fetchStub = sandbox.stub();
        //this.fetchStub.returns(this.fetchResultPromise);

       // sandbox.stub(Session, "getQueryResult").callsFake()
        //{
           // return {fetch: done() };

      //  };
    })

    

    it('takes three arguments',  function()  {
       ///if we call with the correct three args, we want it to return a transaction object (knex query)
       gqrStub.withArgs(txn, sessionId, tenantId).returns(txn);
      expect(Session.getQueryResult(txn, sessionId, tenantId)).to.be.equal(txn);
      expect(txnRollback).to.be.false;

    //  let returnValue =  gqrStub.returnsThis();
      console.log(txn);
      gqrStub.reset();
    });///end it

    //it('searches for a match to sessionsId and tenantId in table', function(done)  {
       
      it('returns the txn(transaction) with requested table information if they match', function (){
         let sessionId = 'correct sessionId', //let this be the value it looks for in DB
             tenantId = 'correct tenantID';
            
            const callback = sinon.stub();
            callback.withArgs(txn, sessionId, tenantId).returns(txn, txnRollback = false);
            
            expect(callback(txn, sessionId, tenantId)).to.be.equal(txn);
            expect(txnRollback).to.be.false;

            callback.reset()
      //assert needs its own library
           // assert.equals(callback(txn, sessionId, tenantId), txn);
           // assert.equals(callback(txn, sessionId, tenantId), txn, txnRollback == true );               
      })

      it.only('rollsback the txn (transaction) with requested table information if they do not match', function (){
         nomatchSessionId = 'nomatch sessionId', //let these be the value it looks for in DB, in this case it finds nothing there
         nomatchTenantId = 'nomatch tenantID';

        const callback = sinon.stub()
        callback.withArgs(txn, nomatchSessionId, nomatchTenantId).returns(null, txnRollback = true).throws("`Failed to select session, registration course AU, registration and course AU for update:");
        ///assert needs its own library
         //assert.equals(callback (txn, nomatchSessionId, nomatchTenantId), null);
         //assert.equals(callback (txn, nomatchSessionId, nomatchTenantId), txnRollback == false);
            expect(callback(txn, nomatchSessionId, nomatchTenantId)).to.be.equal(txn);
            expect(txnRollback).to.be.true;

            
         expect(callback().to.throw());
         callback.reset()
                  
      })
      

     //  done();



   });

//}); //end describe
