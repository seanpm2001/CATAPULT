const { expect } =require('chai'); //utilize chai assertion library 'expect'
const { createSandbox } = require("sinon");
const sinon = require('sinon'); //base sinon
const chai = require ("chai"); //base chai
const chaiAsPromised = require("chai-as-promised");
const Session = require('../service/plugins/routes/lib/session.js');//So Session is exported, can we get it's function here through this?
const { assert } = require('chai');
const proxyquire = require('proxyquire');
const { load } = require('proxyquire');
const { initializeDuration } = require('../service/plugins/routes/lib/session.js');
//const session = require('../service/plugins/routes/lib/session.js');
var spy = sinon.spy;

//const { getSession } =require('../service/plugins/routes/lib/session.js');

chai.use(chaiAsPromised);
chai.should();

describe('Test of load function', function() {

	var loadSpy, getSessionStub;
	var sessionId = 1234; 
	var db = {}; //stand in for database

	beforeEach(() =>{
		getSessionStub = sinon.stub(Session, 'getSession');

	});

	afterEach(() =>{
		getSessionStub.reset();
		getSessionStub.restore();
	});

	it('tries to calls the getSession function and waits for updated database information.', async function()  {
		getSessionStub.withArgs(sessionId, db).resolves(db)
		loadSpy = spy(Session, "load")
		
		test = await Session.load(sessionId, db);

		Session.load.restore();
		Session.getSession.restore();

		expect(loadSpy.calledOnceWithExactly(sessionId, db)).to.be.true;

		expect(getSessionStub.calledOnceWithExactly(sessionId, db)).to.be.true;

		expect(test).to.equal(db);
	})

	it('throws an error if it cannot retrieve database informaton,', async function (){
		
		getSessionStub.withArgs(sessionId, db).rejects(`Failed to select session: Error`)
		loadSpy =spy(Session, "load")
		
		try{
			await Session.load(sessionId, db);
			assert.fail(error);//ensure promise was rejected, ie no false positive test
		}
	  	catch (ex) {
			function error () {			
			throw new Error(`Failed to select session: ${ex}`);
			}
			
			//error has to be wrapped and tested here, or it will throw and interrupt test execution
			expect(error).to.throw(`Failed to select session: ${ex}`);
		}

		Session.load.restore();
		Session.getSession.restore();
		
		expect(loadSpy.calledOnceWithExactly(sessionId, db)).to.be.true;

		expect(getSessionStub.calledOnceWithExactly(sessionId, db)).to.be.true;
	})

}),

describe('Test of getSession function', function() {

	var getSessionStub;
	var sessionId = 1234; 
	var db = {}; //stand in for database

	beforeEach(() =>{
		getSessionStub = sinon.stub(Session,'getSession');
	});

	afterEach(() =>{
		getSessionStub.reset();
		getSessionStub.restore();
	});

	it('uses the session ID to search and return data from database', async function()  {

		getSessionStub.callsFake(() => Promise.resolve(db));

		test = await Session.getSession(sessionId, db);

		Session.getSession.restore();
		
		expect(getSessionStub.calledOnceWithExactly(sessionId, db)).to.be.true;

		expect(test).to.equal(db);
	});
}),

describe('Test of loadForChange function', function() {
   
	var tgqrStub, lfcSpy;
	var txn = {}; //a transaction object
	var txnRollback = false; //to track whether the mocked txn is rolled back
	var sessionId = 1234; 
	var tenantId = 'tenantID'; 
	var queryResult;
	var regCourseAu= { courseAu:0}  //mock regCourseAu object assigned in this function

	beforeEach(() =>{

		tgqrStub = sinon.stub(Session,'tryGetQueryResult');
		lfcSpy =sinon.spy(Session, 'loadForChange');	
	});

	afterEach(() =>{

		tgqrStub.reset();
		tgqrStub.restore();
		
		lfcSpy.restore();
	});

	it('calls the tryGetQueryResult function and waits for updated txn, assigning it to queryResult variable', async function()  {

		tgqrStub.withArgs(txn, sessionId, tenantId).resolves(txn);

		queryResult = await Session.tryGetQueryResult(txn, sessionId, tenantId);
		
		Session.loadForChange.restore();
		Session.tryGetQueryResult.restore();

		expect(tgqrStub.calledOnceWithExactly(txn, sessionId, tenantId)).to.be.true;
		
		expect(queryResult).to.equal(txn);
	}),
	
	it('returns the successfully updated Session registration information', async function()  {
		
	tgqrStub.callsFake(() => {
		var queryResult = 
		{sessions :1, //Stand in for Session values that are returned
			registrationsCoursesAus : regCourseAu = {courseAu:0 },
			registrations : 3,
			coursesAus : 4}

		return queryResult});

		lfcResult = await Session.loadForChange();

		Session.loadForChange.restore();
		Session.tryGetQueryResult.restore()

		expect(lfcResult).to.eql({session: 1, regCourseAu: {courseAu: 4}, registration: 3, courseAu: 4});
	}),
	
	it('throws an error if queryResult was not retrieved successfully and rolls back transaction', async function() {

		try{ 
			expect(await Session.loadForChange(txn, sessionId, tenantId)).to.throw()
			assert.fail(error);
		}
		catch{
			function error() {
				throw Error(`session: ${sessionId}`);
			}

			txnRollback = true;
			expect(error).to.throw(`session: ${sessionId}`);
		}

		Session.loadForChange.restore();

		expect(lfcSpy.calledOnceWithExactly(txn, sessionId, tenantId)).to.be.true;
		
		expect(txnRollback).to.be.true;
	})
}),

describe('Test of tryGetQueryResult function', function() {
   
	var tgqrSpy, gqrStub;
	var txn = {}; //a transaction object
	var txnRollback = false; //to track whether the mocked txn is rolled back
	var sessionId = 1234; 
	var tenantId = 'tenantID'; 
	chai.use(chaiAsPromised);
	chai.should();

	beforeEach(() =>{
		tgqrSpy = sinon.spy(Session, "tryGetQueryResult")
		gqrStub = sinon.stub(Session,'getQueryResult');
	});

	afterEach(() =>{
		tgqrSpy. restore();

		gqrStub.reset();
		gqrStub.restore();
	});

	it('calls the getQueryResult function and waits for updated txn', async function()  {
		
		gqrStub.withArgs(txn, sessionId, tenantId).resolves(txn);

		queryResult = await Session.tryGetQueryResult(txn, sessionId, tenantId);
		
		Session.tryGetQueryResult.restore();
		Session.getQueryResult.restore();

		expect(tgqrSpy.calledOnceWithExactly(txn, sessionId, tenantId)).to.be.true;
		expect(gqrStub.calledOnceWithExactly(txn, sessionId, tenantId)).to.be.true;

		expect(queryResult).to.equal(txn);
		
	});

	it('throws an error if it cannot retrieve,', async function (){
		
		gqrStub.withArgs(txn, sessionId, tenantId).rejects(`Failed to select session, registration course AU, registration and course AU for update: `)
		
		try{
			await Session.tryGetQueryResult(txn, sessionId, tenantId);
			assert.fail(error);//ensure promise was rejected, ie no false positive test
		}
	  	catch (ex) {
			
			function error () {			
				throw new Error(`Failed to select session, registration course AU, registration and course AU for update: ${ex}`);
			}
			
			//error has to be wrapped and tested here, or it will throw and interrupt test execution
			expect(error).to.throw(`Failed to select session, registration course AU, registration and course AU for update: ${ex}`);
		}

		Session.tryGetQueryResult.restore();
		Session.getQueryResult.restore();
		
		expect(tgqrSpy.calledOnceWithExactly(txn, sessionId, tenantId)).to.be.true;

		expect(gqrStub.calledOnceWithExactly(txn, sessionId, tenantId)).to.be.true;
	})
}),

describe('Test of getQueryResult', function() {

	var gqrStub;
	var txn = {}; //a transaction object
	var txnRollback = false; //to track whether the mocked txn is rolled back
	var sessionId = 12345; 
	var tenantId = 'tenantID'; 

	beforeEach(() =>{
		gqrStub = sinon.stub(Session,'getQueryResult');
	});

	afterEach(() =>{
		gqrStub.reset();
		gqrStub.restore();
	});

	it('returns the txn(transaction) with requested table information if  match for args sessionId and tenantId are found in database', async function (){
		
		gqrStub.callsFake(() => Promise.resolve(txn));

		queryResult = await Session.getQueryResult(txn, sessionId, tenantId);
		
		Session.getQueryResult.restore();
		
		expect(gqrStub.calledOnceWithExactly(txn, sessionId, tenantId)).to.be.true;

		expect(queryResult).to.equal(txn);
		
		expect(txnRollback).to.be.false;
	});

}),

describe('Test of abandon function', function() {
   
	var abandonSpy;
	var db = {transaction: txn = {}}
	var lrsWreck, courseAu, session, regCourseAu, registration, sessionId, tenantId, by;
	var txn = {}; //a transaction object
	var txnRollback = false; //to track whether the mocked txn is rolled back
	var sessionId = 1234; 
	var tenantId = 'tenantID'; 
	var queryResult;

	beforeEach(() =>{
		abandonSpy = sinon.spy(Session, 'abandon');
		lfcStub = sinon.stub(Session, 'loadForChange')

	});

	afterEach(() =>{
		abandonSpy.restore();
		
		lfcStub.reset();
		lfcStub.restore();
	});

	it('retrieves the database transaction object, and tries to call the loadForChange function, to update Session information ', async function() {
			
		Session.abandon(sessionId, tenantId, by, {db, lrsWreck});

		lfcStub.withArgs(txn, sessionId, tenantId, courseAu).callsFake(() => {
			var queryResult = {session,
			regCourseAu,
			registration,
			courseAu}
			});

		queryResult = await Session.loadForChange(txn, sessionId, tenantId, courseAu);

		Session.abandon.restore();
		Session.loadForChange.restore();

		expect(abandonSpy.calledOnceWithExactly(sessionId, tenantId, by, {db, lrsWreck})).to.be.true;
		expect(lfcStub.calledOnceWithExactly(txn, sessionId, tenantId, courseAu)).to.be.true;

	}),

	it('catches and throws an error if the Session information was not retrieved successfully and rolls back transaction', async function() {
		
		lfcStub.withArgs(txn, sessionId, tenantId, courseAu).rejects('Boom error (internal)');
		
		Session.abandon(sessionId, tenantId, by, {db, lrsWreck});
		
		try {
			
			await Session.loadForChange(txn, sessionId, tenantId, courseAu);
			assert.fail(error); //ensure promise was rejected, ie no false positive
		 }
		 catch  {
			txnRollback = true;
			function error () {
				throw new Error('Boom error (internal)');
			}
		 }

		Session.abandon.restore();
		Session.loadForChange.restore();

		expect(txnRollback).to.be.true;
		expect(error).to.throw('Boom error (internal)');

		expect(abandonSpy.calledOnceWithExactly(sessionId, tenantId, by, {db, lrsWreck})).to.be.true;
		expect(lfcStub.calledOnceWithExactly(txn, sessionId, tenantId, courseAu)).to.be.true;
	})
	
	it('deterimines the Session is niether abandoned or terminated, and has it update and commit the transaction', async function()  {
	
		///This part of abandon function is all done via other functions, which will be tested separetly on their own.
		///There is no more logic executed in this function, but wanted to leave this space to describe what the rest 
		///of 'abandon does for any future questions or updates. 
	})
})

describe('Test of tryGetSessionInfo function', function() {
   
	var tgsiSpy, lfcStub;
	var txn = {}; //a transaction object
	var txnRollback = false; //to track whether the mocked txn is rolled back
	var sessionId = 1234; 
	var tenantId = 'tenantID'; 
	var session, regCourseAu, registration, courseAu;

	beforeEach(() =>{
		tgsiSpy = sinon.spy(Session, "tryGetSessionInfo")
		lfcStub = sinon.stub(Session,'loadForChange');
	});

	afterEach(() =>{
		tgsiSpy. restore();

		lfcStub.reset();
		lfcStub.restore();
	});

	it('calls the loadForChange function and waits for updated Session information', async function()  {
		
		lfcStub.withArgs(txn, sessionId, tenantId).resolves({session, regCourseAu, registration, courseAu});

		queryResult = await Session.tryGetSessionInfo(txn, sessionId, tenantId);
		
		Session.tryGetSessionInfo.restore();
		Session.loadForChange.restore();

		expect(tgsiSpy.calledOnceWithExactly(txn, sessionId, tenantId)).to.be.true;
		expect(lfcStub.calledOnceWithExactly(txn, sessionId, tenantId)).to.be.true;

		expect(queryResult).to.eql({session, regCourseAu, registration, courseAu});//note use of 'eql' here. Values are same, reference is not
		
	});

	it('throws an error if it cannot retrieve,', async function (){
		
		lfcStub.withArgs(txn, sessionId, tenantId).rejects('Boom error (internal)')
		
		try{
			await Session.tryGetSessionInfo(txn, sessionId, tenantId);
			assert.fail(error);//ensure promise was rejected, ie no false positive test
		}
	  	catch (ex) {
			
			function error () {	
				txnRollback = true;		
				throw new Error('Boom error (internal)');
			}
			
			//error has to be wrapped and tested here, or it will throw and interrupt test execution
			expect(error).to.throw('Boom error (internal)');
		}

		Session.tryGetSessionInfo.restore();
		Session.loadForChange.restore();
		
		expect(txnRollback).to.be.true;

		expect(tgsiSpy.calledOnceWithExactly(txn, sessionId, tenantId)).to.be.true;

		expect(lfcStub.calledOnceWithExactly(txn, sessionId, tenantId)).to.be.true;
	})
}),

describe('Test of initializeDuration function', function() {

	let durationSeconds;
	var session = {initialized_at: {getTime: ()=> {return new Date().getTime()+100000;} },
				is_initialized: true,
				}
	
	it(' checks if Session has been initialized and if true returns the duration since then', function (){
		
		initDurSpy = sinon.spy(Session, 'initializeDuration');

		durationSeconds = Session.initializeDuration(session);

		 Session.initializeDuration.restore();

		expect(initDurSpy.calledOnceWithExactly(session)).to.be.true;

		assert.isDefined(durationSeconds);
		assert.isNumber(durationSeconds);
	});
}),

describe('Test of determineSessionTerminated function', async function() {
   
	var dstStub;
	var txn = {}; //a transaction object
	var txnRollback = false; //to track whether the mocked txn is rolled back
	var session; 
	chai.use(chaiAsPromised);
	chai.should();

	beforeEach(() =>{
		dstStub = sinon.stub(Session,'determineSessionTerminated');
	});

	afterEach(() =>{
		dstStub.reset();
		dstStub.restore();
	});

	it('checks the Session status, and if terminated, rolls back the txn (transaction object)', async function()  {
		
		dstStub.withArgs(session, txn).callsFake(() => Promise.resolve(txn).then(txnRollback = true));

		sessionInfo = await Session.determineSessionTerminated(session, txn);
		
		expect(txnRollback).to.be.true;

		assert.equal(sessionInfo, txn)
		expect(sessionInfo).to.equal(txn);
	});
}),

describe('Test of determineSessionAbandoned function', async function() {
   
	var dsaStub;
	var txn = {}; //a transaction object
	var txnRollback = false; //to track whether the mocked txn is rolled back
	var session; 
	chai.use(chaiAsPromised);
	chai.should();

	beforeEach(() =>{
		dsaStub = sinon.stub(Session,'determineSessionAbandoned');
	});

	afterEach(() =>{
		dsaStub.reset();
		dsaStub.restore();
	});

	it('checks the Session status, and if abandoned, rolls back the txn (transaction object)', async function()  {
		
		dsaStub.withArgs(session, txn).callsFake(() => Promise.resolve(txn).then(txnRollback = true));

		sessionInfo = await Session.determineSessionAbandoned(session, txn);
		
		expect(txnRollback).to.be.true;

		assert.equal(sessionInfo, txn)
		expect(sessionInfo).to.equal(txn);
	});
}),

describe('Test of retrieveResponse function', function() {
   
	var rrStub;
	var txn = {}; //a transaction object
	var txnRollback = false; //to track whether the mocked txn is rolled back
	var durationSeconds, session, regCourseAu, registration, lrsWreck
	var stResponse, stResponseBody
	chai.use(chaiAsPromised);
	chai.should();

	beforeEach(() =>{
		rrStub = sinon.stub(Session,'retrieveResponse');
	});

	afterEach(() =>{
		rrStub.reset();
		rrStub.restore();
	});

	it('tries to retrieve and return the response from a POST request to the LRS server', async function()  {
		
		rrStub.withArgs(durationSeconds, session, regCourseAu, registration, lrsWreck, txn).callsFake(() => (Promise.resolve(stResponse, {json: true})));

		stResponseBody = await Session.retrieveResponse(durationSeconds, session, regCourseAu, registration, lrsWreck, txn);
		
		assert.equal(stResponseBody, stResponse, {json: true})
		expect(stResponseBody).to.equal(stResponse, {json: true});
	});

	it('catches and throws an error if the server information was not retrieved and returned successfully, then rolls back transaction', async function() {
		
		rrStub.callsFake(() => Promise.reject('cant retrieve').then(txnRollback = true));
		await expect(Session.retrieveResponse(durationSeconds, session, regCourseAu, registration, lrsWreck, txn)).to.be.rejectedWith(`cant retrieve`);

		if(txnRollback == true){
			function error () {
				throw Error(`Failed request to store abandoned statement: `);
			}
		}

		expect(txnRollback).to.be.true;
		expect(error).to.throw('Failed request to store abandoned statement: ');
	});
}),

describe('Test of checkStatusCode function', function() {

	let statusCode = 300;
	var txnRollback = false; //to track whether the mocked txn is rolled back

	it(' checks if status code (from POST response in retrieveResponse) is equal to 200. If not, throws an error and rolls back transaction', function (){
		
		if (statusCode !== 200) {
			
			txnRollback = true;
			
			function error () {
				throw Error(`Failed request to store abandoned statement: `);
			}		}

		expect(txnRollback).to.be.true;
		expect(error).to.throw('Failed request to store abandoned statement: ');
	});
}),

describe('Test of txnUpdate function', function() {
   
	var txnUpdateStub;
	var txn = {}; //a transaction object
	var txnRollback = false; //to track whether the mocked txn is rolled back
	var tenantId = 'tenantID';
	var by, session;
	chai.use(chaiAsPromised);
	chai.should();

	beforeEach(() =>{
		txnUpdateStub = sinon.stub(Session,'txnUpdate');
	});

	afterEach(() =>{
		txnUpdateStub.reset();
		txnUpdateStub.restore();
	});

	it("uses the transaction objects 'update' and 'where' functions to update the Session", async function()  {
		
		txnUpdateStub.withArgs(session, tenantId, txn, by).callsFake(() => (Promise.resolve(txn))); //we will pass back txn, as the updating of txn actually falls under third party functions

		testResult = await Session.txnUpdate(session, tenantId, txn, by);
		
		assert.equal(testResult, txn)
		expect(testResult).to.equal(txn);
	});

	it('catches and throws an error if the session information was not updated and returned successfully, then rolls back transaction', async function() {
		
		txnUpdateStub.callsFake(() => Promise.reject('cant update').then(txnRollback = true));
		await expect(Session.txnUpdate(session, tenantId, txn, by)).to.be.rejectedWith(`cant update`);

		if(txnRollback == true){
			function error () {
				throw Error(`Failed to update session: `);
			}
		}

		expect(txnRollback).to.be.true;
		expect(error).to.throw('Failed to update session: ');
	});
})

