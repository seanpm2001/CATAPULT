const expect =require('chai').expect; //utilize chai assertion library 'expect'
const sinon = require('sinon'); //base sinon
const chai = require ("chai"); //base chai
const chaiAsPromised = require("chai-as-promised");
const Session = require('../service/plugins/routes/lib/session.js');//So Session is exported, can we get it's function here through this?
const { assert } = require('chai');
var spy = sinon.spy;
chai.use(chaiAsPromised);
chai.should();

describe.only('Test of load function', function() {

	var loadStub, getSessionStub;
	var sessionId = 1234; 
	var db = {}; //stand in for database
	var fetchedSession;
	
	//chai.return();
	///sooo don't stub load but stub what load calls???

	beforeEach(() =>{
		getSessionStub = sinon.stub(Session, 'getSession');
	});

	afterEach(() =>{
		getSessionStub.reset();
		getSessionStub.restore();
	});

	it('tries to calls the getSession function and waits for updated database information. Will throw an error if it cannot retrieve.',  function()  {

		var loadSpy = spy(Session, "load")

		Session.load(sessionId, db)

		Session.load.restore();
	
		expect(loadSpy.calledOnceWith(sessionId, db)).to.be.true;
		
	}),

	it('throws an error if it cannot retrieve database informaton,', async function (){
		ex = 'thrown error'
		loadStub = sinon.spy(Session,'load');
		
		getSessionStub.callsFake(() => Promise.reject(new Error(ex)).then(fetchedSession = false));

		//await expect(Session.load(sessionId, db)).to.be.rejectedWith(ex);
		try {
			return await Session.load(sessionId, db)//getSessionStub.withArgs(sessionId, db).callsFake(() => Promise.reject(new Error(ex)).then(fetchedSession = false));
			//expect(loadSpy.calledOnceWith(sessionId, db))
		}   catch (ex) {
			function error(ex = 'thrown error') {
				throw new Error(`Failed to select session: ${ex}`);
		}
			}
		/*if (fetchedSession == false) {
			
			function error(ex = 'thrown error') {
				throw new Error(`Failed to select session: ${ex}`);
			}
		}*/
		

	//	loadStub.reset();
	//	loadStub.restore();
		Session.load.restore();
		Session.getSession.restore();

		expect(fetchedSession).to.be.false;
		expect(error).to.throw(`Failed to select session: ${ex}`);
	})
}),
describe('Test of getSession function', function() {

	var getSessionStub;
	var sessionId = 1234; 
	var db = {}; //stand in for database
	chai.use(chaiAsPromised);
	chai.should();

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

		assert.equal(test, db)
		expect(test).to.equal(db);
	});

	it('throws an error if it cannot retrieve database informaton,', async function (){
		
		getSessionStub.callsFake(() => Promise.reject(new Error("Failed to select session:")));

		await expect(Session.getSession(sessionId, db)).to.be.rejectedWith("Failed to select session:");
	})
}),

describe('Test of loadForChange function', function() {
   
	var lfcStub;
	var txn = {}; //a transaction object
	var txnRollback = false; //to track whether the mocked txn is rolled back
	var sessionId = 1234; 
	var tenantId = 'tenantID'; 
	var queryResult;
	var session, //Stand in for Session values that are returned
		regCourseAu,
		registration,
		courseAu
	var regCourseAuObject = {courseAu:0 } //mock regCourseAu object assigned in this function
	var txnReturn = [sessions= 2, registrationsCoursesAus =13, registrations = 26, coursesAus =4]

	beforeEach(() =>{
		lfcStub = sinon.stub(Session,'loadForChange');
	});

	afterEach(() =>{
		lfcStub.reset();
		lfcStub.restore();
	});

	it('calls the tryGetQueryResult function and waits for updated txn, assigning it to queryResult variable', async function()  {
		
		tgqrStub = sinon.stub(Session,'tryGetQueryResult');

		lfcStub.callsFake(() => Promise.resolve(txn));
		tgqrStub.callsFake(() => Promise.resolve(txn));

		queryResult = await Session.tryGetQueryResult(txn, sessionId, tenantId);
		
		assert.equal(queryResult, txn)
		expect(queryResult).to.equal(txn);

		tgqrStub.reset();
		tgqrStub.restore();
	}),

	it('verifies queryResult was retrieved and uses it to assign session registration information', async function() {
	
		lfcStub.callsFake(() => Promise.resolve(txnReturn).then(queryResult = true));
		expect(Session.loadForChange(txn, sessionId, tenantId));

		if (queryResult == true) {

			txnRollback = false;

			var [session,
					regCourseAu,
					registration,
					courseAu
				] = txnReturn;

			regCourseAuObject.courseAu = courseAu;
		}

		expect(session).to.equal(2);
		expect(regCourseAu).to.equal(13);
		expect(registration).to.equal(26);
		expect(courseAu).to.equal(4);
		expect(regCourseAuObject.courseAu).to.equal(4);
		expect(txnRollback).to.be.false;
	}),
	
	it('returns the successfully updated Session registration information', async function()  {
		
		lfcStub.withArgs(txn, sessionId, tenantId).callsFake(() => Promise.resolve(session, regCourseAu, registration, courseAu));

		queryResult = await Session.loadForChange(txn, sessionId, tenantId);
		
		assert.equal(queryResult, session, regCourseAu, registration, courseAu)
		expect(queryResult).to.equal(session, regCourseAu, registration, courseAu);
	}),
	
	it('throws an error if queryResult was not retrieved successfully and rolls back transaction', async function() {
		
		lfcStub.callsFake(() => Promise.reject('cant retrieve').then(queryResult = false));
		await expect(Session.loadForChange(txn, sessionId, tenantId)).to.be.rejectedWith(`cant retrieve`);

		if (queryResult == false) {
			txnRollback = true;

			function errorAndRollback () {
				throw Error(`session: `);
			}
		}

		expect(txnRollback).to.be.true;
		expect(errorAndRollback).to.throw('session: ');
	})

	
}),

describe('Test of tryGetQueryResult function', function() {
   
	var tgqrStub;
	var txn = {}; //a transaction object
	var txnRollback = false; //to track whether the mocked txn is rolled back
	var sessionId = 1234; 
	var tenantId = 'tenantID'; 
	chai.use(chaiAsPromised);
	chai.should();

	beforeEach(() =>{
		tgqrStub = sinon.stub(Session,'tryGetQueryResult');
	});

	afterEach(() =>{
		tgqrStub.reset();
		tgqrStub.restore();
	});

	it('calls the getQueryResult function and waits for updated txn', async function()  {
		
		gqrStub = sinon.stub(Session, 'getQueryResult');
		tgqrStub.callsFake(gqrStub.withArgs(txn, sessionId, tenantId).returns(Promise.resolve(txn)));

		queryResult = await Session.getQueryResult(txn, sessionId, tenantId);
		
		assert.equal(queryResult, txn)
		expect(queryResult).to.equal(txn);
		
		gqrStub.reset();
		gqrStub.restore();
		
	});

	it('throws an error if it cannot retrieve,', async function (){
		
		tgqrStub.callsFake(() => Promise.reject(new Error(`Failed to select session, registration course AU, registration and course AU for update:`)).then());

		await expect(Session.tryGetQueryResult(txn, sessionId, tenantId)).to.be.rejectedWith(`Failed to select session, registration course AU, registration and course AU for update:`)
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
		
		gqrStub.withArgs(txn, sessionId, tenantId).callsFake(() => Promise.resolve(txn));

		queryResult = await Session.getQueryResult(txn, sessionId, tenantId);
		
		assert.equal(queryResult,txn)
		expect(queryResult).to.equal(txn);
		expect(txnRollback).to.be.false;
	});

	it('rollsback the txn (transaction) with requested table information if they do not match', async function (){

		gqrStub.withArgs(txn, sessionId, tenantId).callsFake(() => Promise.reject('No match in Database').then(txnRollback = true));
		await expect(Session.getQueryResult(txn, sessionId, tenantId)).to.be.rejectedWith(`No match in Database`);

		if (txnRollback == true) {

			function error() {
				throw Error('Failed to select session, registration course AU, registration and course AU for update:');
			}
		}

		expect(txnRollback).to.be.true;
		expect(error).to.throw('Failed to select session, registration course AU, registration and course AU for update:');
	
	});
}),

describe('Test of abandon function', function() {
   
	var abandonStub;
	var db = {transaction: txn = {}}
	var lrsWreck;
	var txn = {}; //a transaction object
	var txnRollback = false; //to track whether the mocked txn is rolled back
	var sessionId = 1234; 
	var tenantId = 'tenantID'; 
	var by; //stand in for what exactly???
	var queryResult;
	var regCourseAuObject = {courseAu:0 } //mock regCourseAu object assigned in this function
	var sessionReturn = [rtnSession= 2, rtnRegCourseAu =13, returnRegistration = 26, rtnCoursesAu =4]

	beforeEach(() =>{
		abandonStub = sinon.stub(Session,'abandon');
	});

	afterEach(() =>{
		abandonStub.reset();
		abandonStub.restore();
	});

	it('retrieves the database transaction object (the txn) ', async function() {
			
		abandonStub.withArgs(db).callsFake(() => Promise.resolve(db.transaction));

		queryResult = await Session.abandon(db);

		expect(queryResult).to.eql(txn);//note use of 'eql' here as values are the same but reference point is not

	})

	it('tries to call the loadForChange function and waits for updated Session information', async function()  {
		
		lfcStub = sinon.stub(Session,'loadForChange');

		lfcStub.withArgs(txn, sessionId, tenantId, courseAu).callsFake(() => Promise.resolve(sessionReturn));

		queryResult = await Session.loadForChange(txn, sessionId, tenantId, courseAu);
			
		var [session,
			regCourseAu,
			registration,
			courseAu
		] = sessionReturn;
		
		expect(session).to.equal(2);
		expect(regCourseAu).to.equal(13);
		expect(registration).to.equal(26);
		expect(courseAu).to.equal(4);
		expect(txnRollback).to.be.false;

		assert.equal(queryResult, sessionReturn)
		expect(queryResult).to.equal(sessionReturn);

		lfcStub.reset();
		lfcStub.restore();
	}),

	it('catches and throws an error if the Session information was not retrieved successfully and rolls back transaction', async function() {
		
		abandonStub.callsFake(() => Promise.reject('cant retrieve').then(txnRollback = true));
		await expect(Session.abandon(sessionId, tenantId, by, {db, lrsWreck})).to.be.rejectedWith(`cant retrieve`);

		if(txnRollback == true){
			function error () {
				throw Error(`Boom error (internal)`);
			}
		}

		expect(txnRollback).to.be.true;
		expect(error).to.throw('Boom error (internal)');
	})

	it('verifies queryResult was retrieved and uses it to assign session registration information', async function() {
	
		lfcStub = sinon.stub(Session,'loadForChange');

		lfcStub.withArgs(txn, sessionId, tenantId, courseAu).callsFake(() => Promise.resolve(sessionReturn).then(queryResult = true));
		expect(Session.loadForChange(txn, sessionId, tenantId, courseAu));

		if (queryResult == true) {

			txnRollback = false;

			var [session,
					regCourseAu,
					registration,
					courseAu
				] = sessionReturn;

			regCourseAuObject.courseAu = courseAu;
		}

		expect(session).to.equal(2);
		expect(regCourseAu).to.equal(13);
		expect(registration).to.equal(26);
		expect(courseAu).to.equal(4);
		expect(regCourseAuObject.courseAu).to.equal(4);
		expect(txnRollback).to.be.false;

		lfcStub.reset();
		lfcStub.restore();
	}),
	
	it('deterimines the Session is niether abandoned or terminated, and has it update and commit the transaction', async function()  {
		
		///This part of abandon function is all done via other functions, which will be tested separetly on their own.
		///There is no more logic executed in this function, but wanted to leave this space to describe what the rest 
		///of 'abandon does for any future questions or updates. 
	})
})

describe('Test of tryGetSessionInfo function', function() {
   
	var tgsiStub;
	var txn = {}; //a transaction object
	var txnRollback = false; //to track whether the mocked txn is rolled back
	var sessionId = 1234; 
	var tenantId = 'tenantID'; 
	chai.use(chaiAsPromised);
	chai.should();

	beforeEach(() =>{
		tgsiStub = sinon.stub(Session,'tryGetSessionInfo');
	});

	afterEach(() =>{
		tgsiStub.reset();
		tgsiStub.restore();
	});

	it('calls the loadForChange function and waits for updated session information', async function()  {
		
		lfcStub = sinon.stub(Session, 'loadForChange');
		tgsiStub.callsFake(lfcStub.withArgs(txn, sessionId, tenantId).returns(Promise.resolve(txn, sessionId, tenantId)));

		sessionInfo = await Session.loadForChange(txn, sessionId, tenantId);
		
		assert.equal(sessionInfo, txn, sessionId, tenantId)
		expect(sessionInfo).to.equal(txn, sessionId, tenantId);
	});

	it('catches and throws an error if the Session information was not retrieved successfully and rolls back transaction', async function() {
		
		tgsiStub.callsFake(() => Promise.reject('cant retrieve').then(txnRollback = true));
		await expect(Session.tryGetSessionInfo(txn, sessionId, tenantId)).to.be.rejectedWith(`cant retrieve`);

		if(txnRollback == true){
			function error () {
				throw Error(`Boom error (internal)`);
			}
		}

		expect(txnRollback).to.be.true;
		expect(error).to.throw('Boom error (internal)');
	});
}),

describe('Test of initializeDuration function', function() {

	let durationSeconds;
	sessionInitialized = true; //for test we assume true, not being intialized is covered in another func
	sessionInitializedAt = new Date().getTime(); //mock session starting time
	
	it(' checks if Session has been initialized and if true returns the duration since then', function (){
		
		if (sessionInitialized == true) {
			
			durationSeconds = (new Date().getTime() - sessionInitializedAt) / 1000;
			
			return durationSeconds; 
		}
		 
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

