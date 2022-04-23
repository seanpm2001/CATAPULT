const { expect, should } =require('chai'); //utilize chai assertion library 'expect'
const sinon = require('sinon'); //base sinon
const chai = require ("chai"); //base chai
const sinonChai = require("sinon-chai");
const chaiAsPromised = require("chai-as-promised");
const Helpers = require('../service/plugins/routes/lib/helpers.js');//So Session is exported, can we get it's function here through this?
const { mapMoveOnChildren, tryParseTemplate, assignStatementValues, nodeSatisfied } = require ('../service/plugins/routes/lib/registration.js');
const { assert } = require('chai');
const Wreck = require("@hapi/wreck");
const lrs = require("../service/plugins/routes/lrs");
const Boom = require("@hapi/boom"),
    Requirements = require("@cmi5/requirements");
const { AUnodeSatisfied } = require('../service/plugins/routes/lib/registration.js');
const { parse } = require('iso8601-duration');
const { getQueryResult } = require('../service/plugins/routes/lib/session.js');
const { json } = require('mocha/lib/reporters');
const { transpile } = require('typescript');
var spy = sinon.spy;
chai.use(sinonChai);

chai.should();

describe('Test of buildViolatedReqId function', async function() {

     var violatedReqIdSpy, msg, boomType = "forbidden", violatedReqId, returnedBoom
     var buildViolatedReqIdSpy;
     
     beforeEach(() =>{
		violatedReqIdSpy = sinon.spy(Helpers, "buildViolatedReqId");
		});

	afterEach(() =>{
          violatedReqIdSpy.restore();
     });

     it("tests if requirements were violated and throws an error if so",async function() {

          try {
               Helpers.buildViolatedReqId(violatedReqId, msg, boomType = "forbidden");
               assert.fail(error); //ensure promise was rejected, ie no false positive
           }
           catch(ex)  {
               function error () {
                    throw new Error(`Unrecognized requirement id: ${violatedReqId} `);
               }
           }
     
          Helpers.buildViolatedReqId.restore();
     
          expect(error).to.throw(`Unrecognized requirement id: ${violatedReqId} `);
     
          expect(violatedReqIdSpy.calledOnceWithExactly(violatedReqId, msg, boomType = "forbidden")).to.be.true;
     
     })
     it("if not it returns the Boom type",async function() {
          //valid cmi5 requirement ID
          violatedReqId ='9.7.0.0-2'

          returnedBoom = Helpers.buildViolatedReqId(violatedReqId, msg, boomType = "forbidden");
     
          Helpers.buildViolatedReqId.restore();
          console.log(returnedBoom)

          expect(violatedReqIdSpy.calledOnceWithExactly(violatedReqId, msg, boomType = "forbidden")).to.be.true;
          trySomething = returnedBoom.toString();
          
          //Because it is returning a Boom error it will not match with .equal or .eql. Using console.log though I verified it is firing.
     })
})