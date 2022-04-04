const expect =require('chai').expect; //utilize chai assertion library 'expect'
const sinon = require('sinon'); //base sinon
const chai = require ("chai"); //base chai
//const chaiHttp = require ("chai-http"); //this is used to mock request like GET, POST, FETCH
const chaiAsPromised = require("chai-as-promised");
const { createSandbox } = require ("sinon");
const { getQueryResult } = require('../service/plugins/routes/lib/session');
const Session = require('../service/plugins/routes/lib/session.js')//So Session is exported, can we get it's function here through this?
const spy = sinon.spy();
const proxyquire = require("proxyquire");
const session = require('../service/plugins/routes/lib/session');
const mysql = require('mysql')
//this gives us a point to db server???
const SERVER_URL = process.env.APP_URL || "htpp://localhost:33060";

const sandbox = require("sinon").createSandbox();
//////ok, lets try something totally diff here
const connection = mysql.createConnection({
   host: '127.0.0.1',
   user: 'catapult',
   password: 'quartz',
   database: 'rdbms_1',
   port: '33060',
   });
   /**
    *     - MYSQL_RANDOM_ROOT_PASSWORD=yes

      - DATABASE_USER=catapult

      - DATABASE_USER_PASSWORD=quartz

      - DATABASE_NAME=catapult_cts

      - PLAYER_DATABASE_NAME=catapult_player*/ 

      const Knex = require("knex"),
    KnexStringcase = require("knex-stringcase"),
    KnexCfg = require("./knexfile.js");

    const mysql      = require('mysql');
const util       = require('util');

//this is a wrapper for a DB conection
class DbDriver {
   constructor(config) {
       this.config = config;
       this.connection;
   }

   async connect() {
       this.connection = mysql.createConnection(this.config);

       this.connection.connectPromise = (await util.promisify(this.connection.connect)).bind(this.connection);

       await this.connection.connectPromise();

       Object.keys(this.connection.__proto__).forEach(async key => {
           if(typeof this.connection.__proto__[key] === 'function')
               this.connection[`${key}Promise`] = (await util.promisify(this.connection[key])).bind(this.connection);   
       });
   }

   async query(query, params = []) {
       if(!this.connection || this.connection.state === 'disconnected') {
           await this.connect();
       }
       return this.connection.queryPromise(query, params);
   }
}

module.exports = DbDriver;

module.exports = async () => {
    const knexCfg = await KnexCfg();

    return Knex(KnexStringcase(knexCfg));
};
txn = await db.transaction()

describe('Access to DB', async function(){
   describe('testing getquery result', async function(){
        it('should return txn?', async function(){
         let txn; 
         txn =  await txn
                .first("*")
                .from("sessions")
                .leftJoin("registrations_courses_aus", "sessions.registrations_courses_aus_id", "registrations_courses_aus.id")
                .leftJoin("registrations", "registrations_courses_aus.registration_id", "registrations.id")
                .leftJoin("courses_aus", "registrations_courses_aus.course_au_id", "courses_aus.id")
                .where({"sessions.tenant_id": tenantId})
                .andWhere( finder => {
                    finder
                        .where("sessions.id", sessionId)
                        .orWhere("sessions.code", sessionId.toString());
                        })
                .queryContext({
                    jsonCols: [
                        "registrations_courses_aus.metadata",
                        "registrations.actor",
                        "registrations.metadata",
                        "courses_aus.metadata",
                        "sessions.context_template"
                    ]
                })
                .forUpdate()
                .options({nestTables: true});
                done();
        }),//end it
         expect.txn.to.not.be.null;
      done();
   });//end nested descrive
   connection.connect(done);       
 });//end describe
    

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
