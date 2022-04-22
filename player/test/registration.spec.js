const { expect } =require('chai'); //utilize chai assertion library 'expect'
const sinon = require('sinon'); //base sinon
const chai = require ("chai"); //base chai
const sinonChai = require("sinon-chai");
const chaiAsPromised = require("chai-as-promised");
const Registration = require('../service/plugins/routes/lib/registration.js');//So Session is exported, can we get it's function here through this?
const RegistrationHelpers = require('../service/plugins/routes/lib/registrationHelpers.js');//So Session is exported, can we get it's function here through this?

const { mapMoveOnChildren, tryParseTemplate, assignStatementValues, nodeSatisfied } = require ('../service/plugins/routes/lib/registration.js');
const { assert } = require('chai');
const Wreck = require("@hapi/wreck");
const lrs = require("../service/plugins/routes/lrs");
const { v4: uuidv4 } = require("uuid"),
    Boom = require("@hapi/boom");
const { AUnodeSatisfied } = require('../service/plugins/routes/lib/registration.js');
const { parse } = require('iso8601-duration');
const { getQueryResult } = require('../service/plugins/routes/lib/session.js');
const { json } = require('mocha/lib/reporters');
var spy = sinon.spy;
chai.use(sinonChai);

chai.should();

describe.only('Test of create function', async function() {

	var tenantId, courseId, actor, code =1000, lrsWreck, registrationId, registration,
	course ={lmsId: 0,

		structure: {course:{id:0}, 
					children: {map : () => {return 1}}

		}
	 }, 
	courseAUs;
	var createSpy, getCourseStub, getCourseAUsStub, getRegistrationStub, 
			updateCourseAUmapStub, parseRegistrationDataStub, updateMetadataStub;
	var db = {  why: "otsure",
		transaction: async () => {
		    course,courseAUs,
			   registration = {
				  tenantId,
				  code,
				  courseId,
				  actor: JSON.stringify(actor),
				  metadata: JSON.stringify({
					 version: 1,
					 moveOn: {
						type: "course",
						lmsId: course.lmsId,
						pubId: course.structure.course.id,
						satisfied: false,
						children: {course: {structure: {course: {children: {map : () => {return 1}}}}}}
					 }
				  })
			   },
			  // regResult = await txn("registrations").insert(registration);
		   console.log("have we come this far?")
		    //registrationId = registration.id = regResult[0];

		//    await Registration.updateCourseAUmap(txn, tenantId, registrationId, courseAUs) 

		  //  await Registration.parseRegistrationData(registration, lrsWreck);
		    
		    //await Registration.updateMetadata(txn, registration, tenantId);
		}
	 
	};

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

		getCourseStub = sinon.stub(Registration, "getCourse");
		getCourseAUsStub = sinon.stub(Registration, "getCourseAUs");
		updateCourseAUmapStub = sinon.stub(Registration, "updateCourseAUmap");
		parseRegistrationDataStub = sinon.stub(Registration, "parseRegistrationData");
		updateMetadataStub = sinon.stub(Registration, "updateMetadata");

		});

	afterEach(() =>{
		createSpy.restore();

		getCourseStub.reset();
		getCourseStub.restore();

		getCourseAUsStub.reset();
		getCourseAUsStub.restore();

		updateCourseAUmapStub.reset();
		updateCourseAUmapStub.restore();

		parseRegistrationDataStub.reset();
		parseRegistrationDataStub.restore();

		updateMetadataStub.reset();
		updateMetadataStub.restore();
	});

	//come back to this, may need to stub whole thing out, wil not use false db we created
	it.only('updates the database with information from transaction and returns the registrationId', async function()  {
		getCourseStub.withArgs(txn, tenantId, courseId).resolves(1);
		getCourseAUsStub.withArgs(txn, tenantId, courseId).resolves(1);
		updateCourseAUmapStub.withArgs(txn, tenantId, registrationId, courseAUs).resolves(true);
		parseRegistrationDataStub.withArgs(registration, lrsWreck).resolves(true);
		updateMetadataStub.withArgs(txn, registration, tenantId).resolves(true);
		
		testCreate =  await Registration.create({tenantId, courseId, actor, code}, db, lrsWreck, course);
		
		console.log(testCreate);

		Registration.create.restore();
		Registration.getCourse.restore();
		Registration.updateCourseAUmap.restore();
		Registration.parseRegistrationData.restore();
		Registration.updateMetadata.restore();
		//expect(createSpy.calledOnceWithExactly({tenantId, courseId, actor, code}, {db, lrsWreck})).to.be.true;
		
		//because I had to pass other arguments for fake db.transaction to work, note the change from calledExactlyOnceWith
		expect(createSpy.calledOnce).to.be.true;
		//expect(createSpy.calledWith({tenantId, courseId, actor}, db, lrsWreck, txn)).to.be.true;


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

describe('Test of getCourse function', function() {

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

	it('queries database for course information', async function()  {
		
		Registration.getCourse(txn, tenantId, courseId);
          //parseStub.withArgs(satisfiedStTemplate).returns('a parsed template');
          //statement =  RegistrationHelpers.tryParseTemplate(satisfiedStTemplate);

          Registration.getCourse.restore();
		
          expect(getCourseSpy.calledOnceWithExactly(txn, tenantId, courseId)).to.be.true;
	})
})

describe('Test of getCourseAUs function', function() {

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

describe('Test of load function', function() {

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
describe('Test of loadRegistration', function() {

	var loadRegistrationStub;
	var db = {}; //a database object
	var sessionId = 12345; 
	var tenantId, registrationId; 

	beforeEach(() =>{
		loadRegistrationStub = sinon.stub(Registration,'loadRegistration');
	});

	afterEach(() =>{
		loadRegistrationStub.reset();
		loadRegistrationStub.restore();
	});

	it('returns database information, using registration id as match to query', async function (){
		
		loadRegistrationStub.callsFake(() => Promise.resolve(db));

		queryResult = await Registration.loadRegistration(tenantId, registrationId, db);
		
		Registration.loadRegistration.restore();
		
		expect(loadRegistrationStub.calledOnceWithExactly(tenantId, registrationId, db)).to.be.true;

		expect(queryResult).to.equal(db);
		
	});

})
describe('Test of loadRegistrationAus', function() {

	var loadRegistrationAusStub;
	var db = {}; //a database object
	var sessionId = 12345; 
	var tenantId, registrationId, registration; 

	beforeEach(() =>{
		loadRegistrationAusStub = sinon.stub(Registration,'loadRegistrationAus');
	});

	afterEach(() =>{
		loadRegistrationAusStub.reset();
		loadRegistrationAusStub.restore();
	});

	it('returns database information, using registration id and tenant id as match to query', async function (){
		
		loadRegistrationAusStub.callsFake(() => Promise.resolve(db));

		queryResult = await Registration.loadRegistrationAus(tenantId, registrationId, db, registration);
		
		Registration.loadRegistrationAus.restore();
		
		expect(loadRegistrationAusStub.calledOnceWithExactly(tenantId, registrationId, db, registration)).to.be.true;

		expect(queryResult).to.equal(db);
		
	});

})
describe('Test of loadAuForChange function', function() {

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

describe('Test of getQueryResult', function() {

	var gqrStub;
	var txn = {}; //a transaction object
	var txnRollback = false; //to track whether the mocked txn is rolled back
	var sessionId = 12345; 
	var tenantId, auIndex, registrationId; 

	beforeEach(() =>{
		gqrStub = sinon.stub(Registration,'getQueryResult');
	});

	afterEach(() =>{
		gqrStub.reset();
		gqrStub.restore();
	});

	it('returns the txn(transaction) with requested table information if  match for args registrationId and tenantId are found in database', async function (){
		
		gqrStub.callsFake(() => Promise.resolve(txn));

		queryResult = await Registration.getQueryResult(txn, registrationId, auIndex, tenantId);
		
		Registration.getQueryResult.restore();
		
		expect(gqrStub.calledOnceWithExactly(txn, registrationId, auIndex, tenantId)).to.be.true;

		expect(queryResult).to.equal(txn);
		
	});

})

describe('Test of interpretMoveOn', function() {
	var interpretMoveOnSpy, templateToStringStub, isSatisfiedStub;
	var txn = {}; //a transaction object
	var txnRollback = false; //to track whether the mocked txn is rolled back
	var sessionId = 12345; 
	var registration = {
		metadata: {
			moveOn : true
		},
	} 
	var auToSetSatisfied, sessionCode, lrsWreck, moveOn, satisfiedStTemplate; 

	beforeEach(() =>{
		interpretMoveOnSpy = sinon.spy(Registration,'interpretMoveOn');

		templateToStringStub = sinon.stub(Registration, "templateToString");
		isSatisfiedStub = sinon.stub(RegistrationHelpers, "isSatisfied");
	});

	afterEach(() =>{
		interpretMoveOnSpy.restore();

		templateToStringStub.reset();
		templateToStringStub.restore();

		isSatisfiedStub.reset();
		isSatisfiedStub.restore();
	});

	it('returns the txn(transaction) with requested table information if  match for args registrationId and tenantId are found in database', async function (){
		
		templateToStringStub.withArgs(registration, sessionCode).returns(satisfiedStTemplate);
		isSatisfiedStub.withArgs(moveOn =true , {auToSetSatisfied, lrsWreck, satisfiedStTemplate}).resolves(true);

		moveOnResult = await Registration.interpretMoveOn(registration, {auToSetSatisfied, sessionCode, lrsWreck});

		Registration.interpretMoveOn.restore();
		Registration.templateToString.restore();
		RegistrationHelpers.isSatisfied.restore();

		expect(interpretMoveOnSpy.calledOnceWithExactly(registration, {auToSetSatisfied, sessionCode, lrsWreck})).to.be.true;
		expect(templateToStringStub.calledOnceWithExactly(registration, sessionCode)).to.be.true;
		isSatisfiedStub.should.have.been.calledWith(moveOn, {auToSetSatisfied, lrsWreck, satisfiedStTemplate})
		//I chose a different form to verify isSatisfied test, as the'calledexactlywith' doesn't understand moveOn will
		//be updated through interpretMoveOn function.
		//Also this function does not return anything, so no need to test what moveOnResult is, only need it to start function
	});
})
describe('Test of templateToString function', function() {
   
	var templateToStringSpy;
	var sessionCode =100;
	var registration = {
		code: 0,
		actor: 1
	};
	var actor = "registration.actor",
		verb = {
	    id: "https://w3id.org/xapi/adl/verbs/satisfied",
	    display: {
		   "en": "satisfied"
	    		}
		},
	context = {
	    registration: "registration.code",
	    contextActivities: {
		   category: [
			  {
				 id: "https://w3id.org/xapi/cmi5/context/categories/cmi5"
			  }
		   ],
		   grouping: []
	    },
	    extensions: {
		   "https://w3id.org/xapi/cmi5/context/extensions/sessionid": sessionCode
	    }
	}
 
	beforeEach(() =>{
		templateToStringSpy = sinon.spy(Registration, "templateToString");
	});

	afterEach(() =>{
		templateToStringSpy. restore();
	});

	it('converts the template information (such as actor, or verb) to string', async function()  {
		
		result =  Registration.templateToString(registration, sessionCode, actor, verb, context);
		
		Registration.templateToString.restore();

		//because I had to pass other arguments for stringify to work, note the change from calledExactlyOnceWith
		expect(templateToStringSpy.calledOnce).to.be.true;
		expect(templateToStringSpy.calledWith(registration, sessionCode)).to.be.true;
	
		//I know this is long, but it actually allows the program to execute the stringify function, which is nice for code coverage.
		//you can see our values in there for confirmation
		expect(result).to.eql('{"actor":1,"verb":{"id":"https://w3id.org/xapi/adl/verbs/satisfied","display":{"en":"satisfied"}},"context":{"registration":0,"contextActivities":{"category":[{"id":"https://w3id.org/xapi/cmi5/context/categories/cmi5"}],"grouping":[]},"extensions":{"https://w3id.org/xapi/cmi5/context/extensions/sessionid":100}}}');
	})
})
describe('Test of parseRegistrationData', function() {

	var parseRegistrationDataSpy, retrieveRegStub;
	var lrsWreck;
	var registration ={
		actor: "actor",
		metadata: "metadata"
	};

	beforeEach(() =>{
		parseRegistrationDataSpy = sinon.spy(Registration,'parseRegistrationData');

		parseStub = sinon.stub(JSON, 'parse');
		retrieveRegStub = sinon.stub(Registration, "retrieveRegistrationDataAsString");
	});

	afterEach(() =>{
		parseRegistrationDataSpy.restore();

		parseStub.reset();
		parseStub.restore();

		retrieveRegStub.reset();
		retrieveRegStub.restore();
	});

	it("parses the actor and metadata of registration, then sends it to be converted to string (via retrieveRegistrationDataAsString). After returns registration", async function (){
		
		parseStub.withArgs(registration.actor).returns("actor");
		parseStub.withArgs(registration.metadata).returns("metadata")

		retrieveRegStub.withArgs(registration, lrsWreck).resolves(true);

		queryResult = await Registration.parseRegistrationData(registration, lrsWreck);
		
		Registration.parseRegistrationData.restore();
		Registration.retrieveRegistrationDataAsString.restore();

		expect(parseRegistrationDataSpy.calledOnceWithExactly(registration, lrsWreck)).to.be.true;
		expect(retrieveRegStub.calledOnceWithExactly(registration, lrsWreck)).to.be.true;

		expect(queryResult).to.equal(registration)
	});
	it('catches and throws an error if it is not able to update registration data', async function (){
	
		retrieveRegStub.withArgs(registration, lrsWreck).rejects('Failed to interpret moveOn:');

		try{
			await Registration.parseRegistrationData(registration, lrsWreck);
			assert.fail(error);//ensure promise was rejected, ie no false positive test
		}
	  	catch (ex) {
			
			function error () {	
				throw new Error('Failed to interpret moveOn:');
			}
			
			//error has to be wrapped and tested here, or it will throw and interrupt test execution
			expect(error).to.throw('Failed to interpret moveOn:');
		}

		Registration.parseRegistrationData.restore();
		Registration.retrieveRegistrationDataAsString.restore();

		expect(parseRegistrationDataSpy.calledOnceWithExactly(registration, lrsWreck)).to.be.true;
		expect(retrieveRegStub.calledOnceWithExactly(registration, lrsWreck)).to.be.true;
	})
})
describe('Test of updateCourseAUmap', function() {

	var updateCourseAUmapStub;
	var txn, tenantId, registrationId, courseAUs;

	beforeEach(() =>{
		updateCourseAUmapStub = sinon.stub(Registration,'updateCourseAUmap');
	});

	afterEach(() =>{
		updateCourseAUmapStub.reset();
		updateCourseAUmapStub.restore();
	});

	it("attempts to update the transaction object with stringified metadata", async function (){
		//need to stub out instead of spy since this is querying the txn object, which we can't mock
		updateCourseAUmapStub.withArgs(txn, tenantId, registrationId, courseAUs).resolves(true);

		updateResult = await Registration.updateCourseAUmap(txn, tenantId, registrationId, courseAUs);
		
		Registration.updateCourseAUmap.restore();

		expect(updateCourseAUmapStub.calledOnceWithExactly(txn, tenantId, registrationId, courseAUs)).to.be.true;

		expect(updateResult).to.equal(true)
	});
})
