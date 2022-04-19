const { expect } =require('chai'); //utilize chai assertion library 'expect'
const sinon = require('sinon'); //base sinon
const chai = require ("chai"); //base chai
const chaiAsPromised = require("chai-as-promised");
const Registration = require('../service/plugins/routes/lib/registration.js');//So Session is exported, can we get it's function here through this?
const RegistrationFunctions = require('../service/plugins/routes/lib/registration.js');//So Session is exported, can we get it's function here through this?

const { assert } = require('chai');
const Wreck = require("@hapi/wreck");
const lrs = require("../service/plugins/routes/lrs");

const { v4: uuidv4 } = require("uuid"),
    Boom = require("@hapi/boom")
var spy = sinon.spy;
chai.use(chaiAsPromised);
chai.should();

describe.skip('Test of mapMoveOnChildren function', function() {

     ////map move on children is NOT counted as a function????
	var moveOnChildrenSpy, getSessionStub;
	var child=  sinon.spy(Registration, "");//stand in child object 
	var db = {}; //stand in for database

	beforeEach(() =>{
		//getSessionStub = sinon.stub(Session, 'getSession');
		//moveOnChildrenSpy = sinon.spy(Registration, "mapMoveOnChildren");

	});

	afterEach(() =>{
		//getSessionStub.reset();
		//getSessionStub.restore();

		//moveOnChildrenSpy.reset();
	});

	it('accepts a "child" parameter and maps to its corresponding information', function()  {
		
          //getSessionStub.withArgs(sessionId, db).resolves(db)
		
		//test = await Session.load(sessionId, db);
       //   Registration.mapMoveOnChildren(child);
		
        //  Registration.mapMoveOnChildren.restore();
		//Session.getSession.restore();

		expect(child.calledOnceWithExactly).to.be.true;

	//	expect(getSessionStub.calledOnceWithExactly(sessionId, db)).to.be.true;

	//	expect(test).to.equal(db);
	})

	it.skip('throws an error if it cannot retrieve database informaton,', async function (){
		
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
		
		expect(loadSpy.calledOnceWithExactly(sessionId, db)).to.be.true;
	})

})

describe('Test of tryParseTemplate function', function() {

	var tptSpy, getSessionStub;
	var db = {}; //stand in for database
     var statement, satisfiedStTemplate = "a satisfied template"
	beforeEach(() =>{
		//getSessionStub = sinon.stub(Session, 'getSession');
		tptSpy = sinon.spy(RegistrationFunctions, 'tryParseTemplate');

	});

	afterEach(() =>{
		//getSessionStub.reset();
		//getSessionStub.restore();

		tptSpy.reset();
	});

	it('accepts a "child" parameter and maps to its corresponding information', function()  {
		
          statement = RegistrationFunctions.tryParseTemplate(satisfiedStTemplate);
          //getSessionStub.withArgs(sessionId, db).resolves(db)
		
		//test = await Session.load(sessionId, db);
       //   Registration.mapMoveOnChildren(child);
		
        //  Registration.mapMoveOnChildren.restore();
		//Session.getSession.restore();

		expect(tptSpy.calledOnceWithExactly(satisfiedStTemplate)).to.be.true;

	//	expect(getSessionStub.calledOnceWithExactly(sessionId, db)).to.be.true;

	//	expect(test).to.equal(db);
	})

	it.skip('throws an error if it cannot retrieve database informaton,', async function (){
		
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
		
		expect(loadSpy.calledOnceWithExactly(sessionId, db)).to.be.true;
	})

})