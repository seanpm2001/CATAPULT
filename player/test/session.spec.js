const expect =require('chai').expect; //utilize chai assertion library 'expect'
const sinon = require('sinon'); //base sinon
const chai = require ("chai"); //base chai
//const chaiHttp = require ("chai-http"); //this is used to mock request like GET, POST, FETCH
const chaiAsPromised = require("chai-as-promised");
const { createSandbox } = require ("sinon");
const { getQueryResult } = require('../service/plugins/routes/lib/session');
const Session = require('../service/plugins/routes/lib/session.js')//So Session is exported, can we get it's function here through this?
const spy = sinon.spy();


const sandbox = require("sinon").createSandbox();

describe('Test of getQueryResult', function() {
    beforeEach ( async function () { 
       //setup a mini DB, or should we USE a DB??

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

    

    it('takes three arguments', async function()  {
      // let getQueryResultMock = sinon.mock(txn, sessionId, tenantId);
       
      //stub the queryresult func
       var gqrStub = sinon.stub(Session,'getQueryResult')

        //const Session = proxyquire('../service/plugins/routes/lib/session.js', { Session } );
        //fake txn to be returned? nestled in passed in txn? Thestub returns a TXN???
        //var txn = {returnTXN: returnedTXN = sinon.spy()}; 
        var txn = {};
        var sessionId = 'sessionId';
        var tenantId = sinon.spy();

       ///if we call with the correct three args, we want it to return a txn object (knex query)
       gqrStub.withArgs(txn, sessionId, tenantId).returns(txn);
      expect(Session.getQueryResult(txn, sessionId, tenantId)).to.be.equal(sessionId);
    //  let returnValue =  gqrStub.returnsThis();
      console.log(txn)

    });///end it



}); //end describe
