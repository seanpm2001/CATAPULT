const expect =require('chai').expect; //utilize chai assertion library 'expect'
const sinon = require('sinon'); //base sinon
const chai = require ("chai"); //base chai
const chaiAsPromised = require("chai-as-promised");
const { createSandbox } = require ("sinon");
const { getQueryResult, tryGetQueryResult } = require('../service/plugins/routes/lib/session');
const Session = require('../service/plugins/routes/lib/session.js');//So Session is exported, can we get it's function here through this?
const { assert } = require('chai');
const spy = sinon.spy();
const sandbox = require("sinon").createSandbox();

describe('Test of load function', function() {

	var loadStub;
	var sessionId = 1234; 
	var db = {}; //stand in for database
	chai.use(chaiAsPromised);
	chai.should();

	beforeEach(() =>{
		loadStub = sinon.stub(Session,'load');
	});

	afterEach(() =>{
		loadStub.reset();
		loadStub.restore();
	});

	it('calls the getSession function and waits for updated database information', async function()  {

		loadStub.callsFake(() => Promise.resolve(db));

		test = await Session.load(sessionId, db);

		assert.equal(test, db)
		expect(test).to.equal(db);
	});

	it('throws an error if it cannot retrieve database informaton,', async function (){
		
		loadStub.callsFake(() => Promise.reject(new Error("Failed to select session:")));

		await expect(Session.load(sessionId, db)).to.be.rejectedWith("Failed to select session:");
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

describe.only('Test of loadForChange function', function() {
   
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


	chai.use(chaiAsPromised);
	chai.should();

	beforeEach(() =>{
		lfcStub = sinon.stub(Session,'loadForChange');
	});

	afterEach(() =>{
		lfcStub.reset();
		lfcStub.restore();
	});

	it('calls the tryGetQueryResult function and waits for updated txn, assigning it to queryResult variable', async function()  {
		
		lfcStub.callsFake(() => Promise.resolve(txn));

		queryResult = await Session.loadForChange(txn, sessionId, tenantId);
		
		assert.equal(queryResult, txn)
		expect(queryResult).to.equal(txn);
	
	}),

	it('verifies queryResult was retrieved and uses it to assign session registration information', async function() {
	
		var sessions, //Stand in for values that would be deconstructed from returned txn
		registrationsCoursesAus, 
		registrations, 
		coursesAus

		lfcStub.callsFake(() => Promise.resolve(txn).then(queryResult = true));
		expect(Session.loadForChange(txn, sessionId, tenantId));

		if (queryResult == true) {
			txnRollback = false;

			function assignValues () {
				
			}
		}

		expect(txnRollback).to.be.true;
		expect(errorAndRollback).to.throw('session: ');
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
/////////////////////////////
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
		
		tgqrStub.callsFake(() => Promise.resolve(txn));

		test = await Session.tryGetQueryResult(txn, sessionId, tenantId);
		
		assert.equal(test, txn)
		expect(test).to.equal(txn);
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

	it('takes three arguments', async function()  {

		gqrStub.withArgs(txn, sessionId, tenantId).returns(txn);

		expect(Session.getQueryResult(txn, sessionId, tenantId)).to.be.equal(txn);
		expect(txnRollback).to.be.false;
	});
		
	it('returns the txn(transaction) with requested table information if they match', function (){
		let sessionId = 'correct sessionId', //let this be the value it looks for in DB
		     tenantId = 'correct tenantID';
		
		gqrStub.withArgs(txn, sessionId, tenantId).returns(txn, txnRollback = false);
		
		expect(gqrStub(txn, sessionId, tenantId)).to.be.equal(txn);
		expect(txnRollback).to.be.false;
	});

	it('rollsback the txn (transaction) with requested table information if they do not match', function (){
		let nomatchSessionId = 'nomatch sessionId', //let these be the value it looks for in DB, in this case it finds nothing there
			nomatchTenantId = 'nomatch tenantID';

		gqrStub.withArgs(txn, nomatchSessionId, nomatchTenantId).returns(txn, txnRollback = true);
		expect(gqrStub(txn, nomatchSessionId, nomatchTenantId)).to.be.equal(txn);
		expect(txnRollback).to.be.true;

		gqrStubcheckThrow = function () {throw('Failed to select session, registration course AU, registration and course AU for update:')}  
		
		expect(gqrStubcheckThrow).to.throw('Failed to select session, registration course AU, registration and course AU for update:');
	});
})
