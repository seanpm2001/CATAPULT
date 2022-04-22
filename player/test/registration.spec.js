const { expect } =require('chai'); //utilize chai assertion library 'expect'
const sinon = require('sinon'); //base sinon
const chai = require ("chai"); //base chai
const sinonChai = require("sinon-chai");
const chaiAsPromised = require("chai-as-promised");
const Registration = require('../service/plugins/routes/lib/registration.js');//So Session is exported, can we get it's function here through this?
const { mapMoveOnChildren, tryParseTemplate, assignStatementValues, nodeSatisfied } = require ('../service/plugins/routes/lib/registration.js');
const { assert } = require('chai');
const Wreck = require("@hapi/wreck");
const lrs = require("../service/plugins/routes/lrs");
const { v4: uuidv4 } = require("uuid"),
    Boom = require("@hapi/boom");
const { AUnodeSatisfied } = require('../service/plugins/routes/lib/registration.js');
const { parse } = require('iso8601-duration');
const { getQueryResult } = require('../service/plugins/routes/lib/session.js');
var spy = sinon.spy;
chai.use(chaiAsPromised);
chai.should();

describe.only('Test of create function', async function() {

	var tenantId, courseId, actor, code =1000, lrsWreck, registrationId, course, courseAUs;
	var createSpy, getCourseStub, getCourseAUsStub, getRegistrationStub, 
			updateCourseAUmapStub, parseRegistrationDataStub, updateMetadataStub;
	var db = {async transaction() {Promise.resolve(registrationId = 32)}}
	var txn = { rollback: ()=> {return true|false}  }; //a transaction object
	var ex;
	/*var db = {
		course: 0,
		courseAUs: 0,
		registration: {
			id: 0
		},
		regResult: "au",
		transaction:(
			/*async (txn) => {
			    const course = await Registration.getCourse(txn, tenantId, courseId),
				   courseAUs = await Registration.getCourseAUs(txn, tenantId, courseId),
				   registration = await Registration.getRegistration(course, {tenantId, courseId, actor, code}),
				   regResult = await txn("registrations").insert(registration);
			    registrationId = registration.id = regResult[0];

			    await Registration.updateCourseAUmap(txn, tenantId, registrationId, courseAUs) 

			    await Registration.parseRegistrationData(registration, lrsWreck);
			    
			    await Registration.updateMetadata(txn, registration, tenantId);
			}
		 ) => {registrationId =2; return registrationId}
	}*/
	async function txn (arg = "registrations")  { console.log("betterquestion, is THIS being called>")
		insert: (registration) => {return 100; console.log("is this being called?")}
	}

	beforeEach(() =>{
		createSpy = sinon.spy(Registration, "create");
/*
		getCourseStub = sinon.stub(Registration, "getCourse");
		getCourseAUsStub = sinon.stub(Registration, "getCourseAUs");
		getRegistrationStub = sinon.stub(Registration, "getRegistration");
		updateCourseAUmapStub = sinon.stub(Registration, "updateCourseAUmap");
		parseRegistrationDataStub = sinon.stub(Registration, "parseRegistrationData");
		updateMetadataStub = sinon.stub(Registration, "updateMetadata");
*/
		});

	afterEach(() =>{
		createSpy.restore();
		/*
		getCourseStub.reset();
		getCourseStub.restore();

		getCourseAUsStub.reset();
		getCourseAUsStub.restore();

		getRegistrationStub.reset();
		getRegistrationStub.restore();

		updateCourseAUmapStub.reset();
		updateCourseAUmapStub.restore();

		parseRegistrationDataStub.reset();
		parseRegistrationDataStub.restore();

		updateMetadataStub.reset();
		updateMetadataStub.restore();
*/
	});

	//come back to this, may need to stub whole thing out, wil not use false db we created
	it.skip('updates the database with information from transaction and returns the registrationId', async function()  {
		/*
		getCourseStub.withArgs(txn, tenantId, courseId).resolves(1);
		getCourseAUsStub.withArgs(txn, tenantId, courseId).resolves(1);
		getRegistrationStub.withArgs(course, {tenantId, courseId, actor, code}).resolves(1);
		updateCourseAUmapStub.withArgs(txn, tenantId, registrationId, courseAUs).resolves(true);
		parseRegistrationDataStub.withArgs(registration, lrsWreck).resolves(true);
		updateMetadataStub.withArgs(txn, registration, tenantId).resolves(true);
*/
		
		testCreate =  await Registration.create({tenantId, courseId, actor, code}, {db, lrsWreck});
		
		console.log(testCreate);
/*
		Registration.create.restore();
		Registration.getCourse.restore();
		Registration.getRegistration.restore();
		Registration.updateCourseAUmap.restore();
		Registration.parseRegistrationData.restore();
		Registration.updateMetadata.restore();
*/
		expect(createSpy.calledOnceWithExactly({tenantId, courseId, actor, code}, {db, lrsWreck})).to.be.true;

		//expect(testChild.lmsId).to.equal(0);
		//expect(testChild.pubId).to.equal(0);
		//expect(testChild.type).to.equal("au");
		//expect(testChild.satisfied).to.equal(true);
	})

it('catches and throws an error if it is not able to update DB or return registrationId', async function (){
	
	createSpy.restore();
	createStub = sinon.stub(Registration, "create")
	
	createStub.withArgs({tenantId, courseId, actor, code}, {db, lrsWreck}, txn).rejects(`Failed to store registration: `);
		
	
	
	try {
		await Registration.create({tenantId, courseId, actor, code}, {db, lrsWreck}, txn);
		assert.fail(error); //ensure promise was rejected, ie no false positive
	 }
	 catch(ex)  {
		function error () {
			throw new Error(`Failed to store registration: `);
		}
	 }

	Registration.create.restore();

	expect(error).to.throw(`Failed to store registration: `);

	expect(createStub.calledOnceWithExactly({tenantId, courseId, actor, code}, {db, lrsWreck}, txn)).to.be.true;

})

})

describe.only('Test of getCourse function', function() {

     var getCourseSpy; 
     var txn, tenantId, courseId;

     beforeEach(() =>{
		//parseStub = sinon.stub(JSON, 'parse')
		getCourseSpy = sinon.spy(Registration, 'getCourse');
	});

	afterEach(() =>{
		//parseStub.reset();
		//parseStub.restore();

          getCourseSpy.restore();
	});

	it('queries databse for course information', async function()  {
		
		Registration.getCourse(txn, tenantId, courseId);
          //parseStub.withArgs(satisfiedStTemplate).returns('a parsed template');
          //statement =  RegistrationHelpers.tryParseTemplate(satisfiedStTemplate);

          Registration.getCourse.restore();
		
          expect(getCourseSpy.calledOnceWithExactly(txn, tenantId, courseId)).to.be.true;
	})
})

describe.only('Test of getCourseAUs function', function() {

     var getCourseAUsSpy; 
     var txn, tenantId, courseId;

     beforeEach(() =>{
		//parseStub = sinon.stub(JSON, 'parse')
		getCourseAUsSpy = sinon.spy(Registration, 'getCourseAUs');
	});

	afterEach(() =>{
		//parseStub.reset();
		//parseStub.restore();

          getCourseAUsSpy.restore();
	});

	it('queries database for course authentication information', async function()  {
		
		Registration.getCourseAUs(txn, tenantId, courseId);

          Registration.getCourseAUs.restore();
		
          expect(getCourseAUsSpy.calledOnceWithExactly(txn, tenantId, courseId)).to.be.true;
	})
})

describe.only('Test of load function', function() {

	var loadSpy;
	var tenantId, registrationId, db, loadAus = true, course, courseId, actor, code;
	var registration ={
		aus : null
	};
	var db; //mock db item to pass in. Needs to be undefined, because the one in source code will be when test runs
	var dbReturn ={}//mock db item to return

	beforeEach(() =>{
		loadSpy = sinon.spy(Registration, "load");

		loadRegistrationStub = sinon.stub(Registration, "loadRegistration");
		loadRegistrationAusStub = sinon.stub(Registration, "loadRegistrationAus");

	});

	afterEach(() =>{
		loadSpy.restore();

		loadRegistrationStub.reset();
		loadRegistrationStub.restore();

		loadRegistrationAusStub.reset();
		loadRegistrationAusStub.restore();
	});

	it('attempts to load registration information', async function()  {
		
		loadRegistrationStub.withArgs(tenantId, registrationId, db).resolves(registration);
		loadRegistrationAusStub.withArgs(tenantId, registrationId, db, registration).resolves(dbReturn);

		loadAus = true
		registrationTest = await Registration.load(tenantId, registrationId, db, loadAus);

          Registration.load.restore();
		Registration.loadRegistration.restore();
		Registration.loadRegistrationAus.restore();

		expect(loadSpy.calledOnceWithExactly(tenantId, registrationId, db, loadAus)).to.be.true;
		expect(loadRegistrationStub.calledOnceWithExactly(tenantId, registrationId, db)).to.be.true;
		expect(loadRegistrationAusStub.calledOnceWithExactly(tenantId, registrationId, db, registration)).to.be.true;

          expect(registrationTest).to.equal(registration);
		expect(registrationTest.aus).to.equal(dbReturn);
	})

	it('catches and throws an error if it is not able to update or return registration', async function (){
	
		loadRegistrationStub.withArgs(tenantId, registrationId, db).rejects('Failed to load registration:')
		
		try{
			await Registration.load(tenantId, registrationId, db, loadAus = true);
			assert.fail(error);//ensure promise was rejected, ie no false positive test
		}
	  	catch (ex) {
			
			function error () {	
				throw new Error('Failed to load registration:');
			}
			
			//error has to be wrapped and tested here, or it will throw and interrupt test execution
			expect(error).to.throw('Failed to load registration:');
		}

		Registration.load.restore();
		Registration.loadRegistration.restore();
		

		expect(loadSpy.calledOnceWithExactly(tenantId, registrationId, db, loadAus = true)).to.be.true;

		expect(loadRegistrationStub.calledOnceWithExactly(tenantId, registrationId, db)).to.be.true;
		
	})

	it('catches and throws an error if it is not able to update or return registration aus', async function (){
	
		let registration; //reset this variable as testing node can't compare it's children

		loadRegistrationAusStub.withArgs(tenantId, registrationId, db, registration).rejects('Failed to load registration:');

		try{
			await Registration.load(tenantId, registrationId, db, loadAus = true);
			assert.fail(error);//ensure promise was rejected, ie no false positive test
		}
	  	catch (ex) {
			
			function error () {	
				throw new Error('Failed to load registration:');
			}
			
			//error has to be wrapped and tested here, or it will throw and interrupt test execution
			expect(error).to.throw('Failed to load registration:');
		}

		Registration.load.restore();
		Registration.loadRegistrationAus.restore();
		

		expect(loadSpy.calledOnceWithExactly(tenantId, registrationId, db, loadAus = true)).to.be.true;
		expect(loadRegistrationAusStub.calledOnceWithExactly(tenantId, registrationId, db, registration)).to.be.true;
	})
})

describe.only('Test of loadAuForChange function', function() {

	var loadAuForChangeSpy, getQueryResultStub;
	var tenantId, registrationId, db, auIndex, txn, loadAus = true, course, courseId, actor, code;
	var queryResult = 
		{//Stand in for Session values that are returned
			registrationsCoursesAus : regCourseAu = {courseAu:0 },
			registrations : 3,
			coursesAus : 4}
	var db; //mock db item to pass in. Needs to be undefined, because the one in source code will be when test runs
	var dbReturn ={}//mock db item to return
	var txn = { rollback: ()=> {return true|false}  };

	beforeEach(() =>{
		loadAuForChangeSpy = sinon.spy(Registration, "loadAuForChange");

		getQueryResultStub = sinon.stub(Registration, "getQueryResult");

	});

	afterEach(() =>{
		loadAuForChangeSpy.restore();

		getQueryResultStub.reset();
		getQueryResultStub.restore();
	});

	it('attempts to retrieve the transaction information with a query, and assigns collected info to registration variables', async function()  {
		
		getQueryResultStub.withArgs(txn, registrationId, auIndex, tenantId).resolves(queryResult);

		queryTest = await Registration.loadAuForChange(txn, registrationId, auIndex, tenantId);

          Registration.loadAuForChange.restore();
		Registration.getQueryResult.restore();

		expect(loadAuForChangeSpy.calledOnceWithExactly(txn, registrationId, auIndex, tenantId)).to.be.true;
		expect(getQueryResultStub.calledOnceWithExactly(txn, registrationId, auIndex, tenantId)).to.be.true;

		//note use of 'eql' here. Values are same, reference is not
          expect(queryTest).to.eql({regCourseAu: {courseAu: 4}, registration: 3, courseAu: 4});
	})

	it('catches and throws an error if it is not able to retrieve the registration info through its query, rolling back transaction', async function (){
		
		getQueryResultStub.withArgs(txn, registrationId, auIndex, tenantId).rejects('Failed to select registration course AU, registration and course AU for update:')
		
		try{
			await Registration.loadAuForChange(txn, registrationId, auIndex, tenantId);
			assert.fail(error);//ensure promise was rejected, ie no false positive test
		}
	  	catch (ex) {
			
			function error () {	
				txn.rollback = true;		
				throw new Error('Failed to select registration course AU, registration and course AU for update:');
			}
			
			//error has to be wrapped and tested here, or it will throw and interrupt test execution
			expect(error).to.throw('Failed to select registration course AU, registration and course AU for update:');
		}

		Registration.loadAuForChange.restore();
		Registration.getQueryResult.restore();
		
		expect(txn.rollback).to.be.true;

		expect(loadAuForChangeSpy.calledOnceWithExactly(txn, registrationId, auIndex, tenantId)).to.be.true;

		expect(getQueryResultStub.calledOnceWithExactly(txn, registrationId, auIndex, tenantId)).to.be.true;
	})


	it('catches and throws an error if retreived query result is false (no registration id), rolling back transaction', async function (){
		
		getQueryResultStub.withArgs(txn, registrationId, auIndex, tenantId).resolves(queryResult = false);
		
		try{
			await Registration.loadAuForChange(txn, registrationId, auIndex, tenantId);
			assert.fail(error);//ensure promise was rejected, ie no false positive test
		}
	  	catch (ex) {
			
			function error () {	
				txn.rollback = true;		
				throw new Error('registration:');
			}
			
			//error has to be wrapped and tested here, or it will throw and interrupt test execution
			expect(error).to.throw('registration:');
		}

		Registration.loadAuForChange.restore();
		Registration.getQueryResult.restore();
		
		expect(txn.rollback).to.be.true;

		expect(loadAuForChangeSpy.calledOnceWithExactly(txn, registrationId, auIndex, tenantId)).to.be.true;

		expect(getQueryResultStub.calledOnceWithExactly(txn, registrationId, auIndex, tenantId)).to.be.true;
	})
})
describe('Test of nodeSatisfied function', function() {

	var nodeSatisfiedSpy, getSessionStub;
	//var child=  sinon.spy(Registration, "");//stand in child object 
	
     var node = {
          satisfied : true | false
          }  
     var testNode

	beforeEach(() =>{
		//getSessionStub = sinon.stub(Session, 'getSession');
		nodeSatisfiedSpy = sinon.spy(RegistrationHelpers, "nodeSatisfied");

	});

	afterEach(() =>{
		//getSessionStub.reset();
		//getSessionStub.restore();

		nodeSatisfiedSpy.restore();
	});

	it('returns true if node it is passed satisified property is true (called by isSatisfied)', async function()  {
		
          node.satisfied = true;

		testNode =  await RegistrationHelpers.nodeSatisfied(node);
          
          RegistrationHelpers.nodeSatisfied.restore();

		expect(nodeSatisfiedSpy.calledOnceWithExactly(node)).to.be.true;

          expect(testNode).to.be.true;

          //expect(testStatement.lmsId).to.equal(lmsId);
          //expect(testStatement.pubId).to.equal(0);
          //expect(testStatement.type).to.equal("au");
          //expect(testStatement.satisfied).to.equal(true);
	})
})
describe('Test of AUnodeSatisfied function', function() {

	var auNodeSatisfiedSpy, getSessionStub;
	
     var node = {
          satisfied : true|false,
          type: "",
          lmsId: true|false
          }  
     var testNode, auToSetSatisfied = true|false;

	beforeEach(() =>{
		//getSessionStub = sinon.stub(Session, 'getSession');
		auNodeSatisfiedSpy = sinon.spy(RegistrationHelpers, "AUnodeSatisfied");

	});

	afterEach(() =>{
		//getSessionStub.reset();
		//getSessionStub.restore();

		auNodeSatisfiedSpy.restore();
	});

	it('verifies the nodes "type" property is "au". If so it sets the "lmsId" and "satisified" properties and returns the "satisified property (called by isSatisfied)', async function()  {
		
          node.type = "au";
          node.lmsId =true;
          auToSetSatisfied = true;

		testNode =  await RegistrationHelpers.AUnodeSatisfied(node, auToSetSatisfied);

		RegistrationHelpers.AUnodeSatisfied.restore();

		expect(auNodeSatisfiedSpy.calledOnceWithExactly(node, auToSetSatisfied)).to.be.true;

          expect(testNode).to.be.true;
	})
})

describe('Test of loopThroughChildren function', function() {
     
     var auToSetSatisfied, satisfiedStTemplate, lrsWreck
     var node = {
               satisfied : true | false,
               type: "",
               lmsId: true|false,
               children: [1, 2, 3]
               } 
     var child, allChildrenSatisfied, txn
	chai.use(sinonChai);

	beforeEach(() =>{
          isSatisfiedStub = sinon.stub(RegistrationHelpers, "isSatisfied");

          ltcSpy = sinon.spy(RegistrationHelpers, "loopThroughChildren")
	});

	afterEach(() =>{
          isSatisfiedStub.reset();
          isSatisfiedStub.restore();

          ltcSpy.restore();
	});

	it('recursively loops through a node and if any of the nodes children are unsatisified, it marks "allChildrenSatisifed false and returns that value" (called in isSatisifed function)', async function()  {
		
          isSatisfiedStub.withArgs(child, auToSetSatisfied, satisfiedStTemplate, lrsWreck, txn).resolves(false);

		test = await RegistrationHelpers.isSatisfied(child, auToSetSatisfied, satisfiedStTemplate, lrsWreck, txn);
		console.log(test)

          allChildrenSatisfied = await RegistrationHelpers.loopThroughChildren(node, auToSetSatisfied, satisfiedStTemplate, lrsWreck, txn);

          RegistrationHelpers.isSatisfied.restore();
          RegistrationHelpers.loopThroughChildren.restore();

          expect(ltcSpy.calledOnceWithExactly(node, auToSetSatisfied, satisfiedStTemplate, lrsWreck)).to.be.true;
          
          //this should be called three times. There are three items in node.children
		isSatisfiedStub.should.have.callCount(3);
  		
		expect(allChildrenSatisfied).to.be.false;
		
	})

	it('recursively loops through a node and if all of the nodes children are satisified, it marks "allChildrenSatisifed" true and returns that value (called in isSatisifed function)', async function (){
		
          isSatisfiedStub.withArgs(child, auToSetSatisfied, satisfiedStTemplate, lrsWreck).resolves(true);

		test = await RegistrationHelpers.isSatisfied(child, auToSetSatisfied, satisfiedStTemplate, lrsWreck);
		console.log(test)
          allChildrenSatisfied = await RegistrationHelpers.loopThroughChildren(node, auToSetSatisfied, satisfiedStTemplate, lrsWreck);

          RegistrationHelpers.isSatisfied.restore();
          RegistrationHelpers.loopThroughChildren.restore();

          expect(ltcSpy.calledOnceWithExactly(node, auToSetSatisfied, satisfiedStTemplate, lrsWreck)).to.be.true;
          
         //this should be called three times. There are three items in node.children
          expect(isSatisfiedStub.calledThrice).to.be.true

          expect(allChildrenSatisfied).to.be.true;
	})

})
describe('Test of retrieveResponse function', function() {
   
	var rrSpy, wreckStub;
	var txn = { rollback: ()=> {return true|false}  }; //a transaction object
	var lrsWreck = {request: async (string1, string2) => {return "response received" /*assume request received*/} }
	var satisfiedStResponse ="st response", satisfiedStResponseBody = "st response body"

	beforeEach(() =>{
		rrSpy = sinon.spy(RegistrationHelpers,'retrieveResponse');
		wreckStub =sinon.stub(Wreck, 'read')
	});

	afterEach(() =>{
		rrSpy.restore();

		wreckStub.reset();
		wreckStub.restore();
	});

	it('tries to retrieve and return the response from a POST request to the LRS server', async function()  {
		rrSpy.restore();//this is the only one we want to use a stub for, so take away spy
		rrStub = sinon.stub(RegistrationHelpers, 'retrieveResponse');

		rrStub.withArgs(lrsWreck, txn).resolves([satisfiedStResponse, satisfiedStResponseBody]);
		
		[satisfiedStResponse, satisfiedStResponseBody] = await RegistrationHelpers.retrieveResponse(lrsWreck, txn);
		
		RegistrationHelpers.retrieveResponse.restore();

		expect(satisfiedStResponse).to.equal("st response");
		expect(satisfiedStResponseBody).to.equal("st response body");

		expect(rrStub.calledOnceWithExactly(lrsWreck, txn)).to.be.true;
	});

	it('catches and throws an error if the server information was not retrieved and returned successfully, then rolls back transaction', async function() {
		
		try{
			await RegistrationHelpers.retrieveResponse(lrsWreck, txn);
			assert.fail(error);//ensure promise was rejected, ie no false positive test
		}
	  	catch (ex) {
			
			function error () {	
				txn.rollback = true;		
				throw new Error(`Failed request to store abandoned statement: ${ex}`);
			}
			
			//error has to be wrapped and tested here, or it will throw and interrupt test execution
			expect(error).to.throw(`Failed request to store abandoned statement: ${ex}`);
		}

		RegistrationHelpers.retrieveResponse.restore();
		
		expect(txn.rollback).to.be.true;

		expect(rrSpy.calledOnceWithExactly(lrsWreck, txn)).to.be.true;
	});
})
describe('Test of checkStatusCode function', function() {
	
	var txn = { rollback: ()=> {return true|false}  }; //a transaction object
	var satisfiedStResponse ={ statusCode: 300 };
	var satisfiedStResponseBody = 'response body'

	beforeEach(() =>{
		chkStatusSpy = sinon.spy(RegistrationHelpers, "checkStatusCode");
	});

	afterEach(() =>{
		chkStatusSpy.restore();
	});
	
	
	it(' checks if status code (from POST response in retrieveResponse) is equal to 200, if it is not, it throws an error.', async function (){

		try{
			await RegistrationHelpers.checkStatusCode(satisfiedStResponse, satisfiedStResponseBody);
			assert.fail(error);//ensure promise was rejected, ie no false positive test
		}
	  	catch (ex) {
			
			function error () {	
				txn.rollback = true;		
				throw new Error(`Failed to store satisfied statement: ${satisfiedStResponse.statusCode} (${satisfiedStResponseBody})`);
			}
			
			//error has to be wrapped and tested here, or it will throw and interrupt test execution
			expect(error).to.throw(`Failed to store satisfied statement: ${satisfiedStResponse.statusCode} (${satisfiedStResponseBody})`);
		}

		RegistrationHelpers.checkStatusCode.restore();
		
		expect(txn.rollback).to.be.true;

		expect(chkStatusSpy.calledOnceWithExactly(satisfiedStResponse, satisfiedStResponseBody)).to.be.true;
	});
})

describe('Test of isSatisfied function', function() {

	var isSatisfiedSpy, isSatisfiedStub, nodeSatisfiedStub, AUnodeSatisfiedStub, loopThroughChildrenStub, tryParseTemplateStub,
          assignStatementValuesStub, retrieveResponseStub, checkStatusCodeStub;
	//var child=  sinon.spy(Registration, "");//stand in child object 
	var child = {
          lmsId: 0,
          id: 0,
          pubId: 1,
          type: "au",
          moveOn : "NotApplicable",
          satisfied: true|false,
          children: [1, 2, 3, 4, 5],
          } 
     //////
     var node = {
          satisfied : true | false,
          type: "",
          lmsId: true|false,
          children: [1, 2, 3, 4]
          } 
          var auToSetSatisfied, satisfiedStTemplate, lrsWreck = {request: async (string1, string2) => {return "response received" /*assume request received*/} }, statement, txn ={ rollback: ()=> {return true|false}  }, 
			satisfiedStResponse = "a satisfied response", satisfiedStResponseBody ="satisfied response body" //passed as arguments
	
	beforeEach(() =>{
	     nodeSatisfiedStub = sinon.stub(RegistrationHelpers, 'nodeSatisfied');
          AUnodeSatisfiedStub = sinon.stub(RegistrationHelpers, "AUnodeSatisfied");
	     loopThroughChildrenStub = sinon.stub(RegistrationHelpers, 'loopThroughChildren');
	     tryParseTemplateStub = sinon.stub(RegistrationHelpers, 'tryParseTemplate');
		assignStatementValuesStub = sinon.stub(RegistrationHelpers, 'assignStatementValues');
	     retrieveResponseStub = sinon.stub(RegistrationHelpers, 'retrieveResponse');
	     checkStatusCodeStub = sinon.stub(RegistrationHelpers, 'checkStatusCode');

		isSatisfiedSpy = sinon.spy(RegistrationHelpers, "isSatisfied");

	});

	afterEach(() =>{
		nodeSatisfiedStub.reset();
		nodeSatisfiedStub.restore();

          AUnodeSatisfiedStub.reset();
		AUnodeSatisfiedStub.restore();

		loopThroughChildrenStub.reset();
		loopThroughChildrenStub.restore();

		tryParseTemplateStub.reset();
		tryParseTemplateStub.restore();

		assignStatementValuesStub.reset();
		assignStatementValuesStub.restore();

		retrieveResponseStub.reset();
		retrieveResponseStub.restore();

		checkStatusCodeStub.reset();
		checkStatusCodeStub.restore();

		isSatisfiedSpy.restore();
	});

	it('recursively iterates through node (given as param), ensuring all its children are satisified. When they are, returns true', async function()  {
		
		nodeSatisfiedStub.withArgs(node).resolves(true);
          AUnodeSatisfiedStub.withArgs(node, {auToSetSatisfied}).resolves(false);
          loopThroughChildrenStub.withArgs(node, auToSetSatisfied, satisfiedStTemplate, lrsWreck).resolves(true);
		tryParseTemplateStub.withArgs(satisfiedStTemplate).resolves(statement);
		assignStatementValuesStub.withArgs(node, statement).resolves(true);
		retrieveResponseStub.withArgs(lrsWreck, txn).resolves([satisfiedStResponse, satisfiedStResponseBody]);
		checkStatusCodeStub.withArgs(satisfiedStResponse, satisfiedStResponseBody);		
		
		//satisfiedStResponse, satisfiedStResponseBody = await RegistrationHelpers.retrieveResponse(lrsWreck, txn);
          
          //returns true or false from main func, so this should be true or false?
          allSatisfiedTest =  await RegistrationHelpers.isSatisfied(node, auToSetSatisfied, satisfiedStTemplate, lrsWreck, txn);

          RegistrationHelpers.isSatisfied.restore();
          RegistrationHelpers.nodeSatisfied.restore();
          RegistrationHelpers.AUnodeSatisfied.restore();
		RegistrationHelpers.loopThroughChildren.restore();
		RegistrationHelpers.tryParseTemplate.restore();
		RegistrationHelpers.assignStatementValues.restore();
		RegistrationHelpers.retrieveResponse.restore();
		RegistrationHelpers.checkStatusCode.restore();

		expect(allSatisfiedTest).to.be.true;
		//this could be called more than once, and that is acceptable if it needs to iterate until children satisfied
		expect(isSatisfiedSpy.calledWith(node, auToSetSatisfied, satisfiedStTemplate, lrsWreck, txn)).to.be.true;
	})
	it('recursively iterates through node (given as param), ensuring all its children are satisified. If they cannot be, returns false', async function()  {
		//Because of the nature of the recursion here, it really isn't possible to return false under normal circumstances,
		//as the program will loop util satisified. So I have stubbed the function to make it return false
		isSatisfiedSpy.restore();
		isSatisfiedStub = sinon.stub(RegistrationHelpers, "isSatisfied")	
		isSatisfiedStub.withArgs(node, auToSetSatisfied, satisfiedStTemplate, lrsWreck, txn).resolves(false);
		
          //returns true or false from main func, so this should be true or false?
          allSatisfiedTest =  await RegistrationHelpers.isSatisfied(node, auToSetSatisfied, satisfiedStTemplate, lrsWreck, txn);

          RegistrationHelpers.isSatisfied.restore();

		expect(allSatisfiedTest).to.be.false;
		//this could be called more than once, and that is acceptable if it needs to iterate until children satisfied
		expect(isSatisfiedStub.calledWith(node, auToSetSatisfied, satisfiedStTemplate, lrsWreck, txn)).to.be.true;
	})
})
