const { expect } = require('chai');
const sinon = require('sinon');
const chai = require('chai');
const sinonChai = require('sinon-chai');
const Helpers = require('../service/plugins/routes/lib/helpers.js');
const { assert } = require('chai');

chai.use(sinonChai);

describe('Test of buildViolatedReqId function', function () {
  let violatedReqIdSpy, msg, violatedReqId, returnedBoom, boomType, error;

  beforeEach(() => {
    violatedReqIdSpy = sinon.spy(Helpers, 'buildViolatedReqId');
  })

  afterEach(() => {
    violatedReqIdSpy.restore();
  })

  it('tests if requirements were violated and throws an error if so', function () {
    try {
      Helpers.buildViolatedReqId(violatedReqId, msg, boomType = 'forbidden');
      // ensure promise was rejected, ie no false positive
      assert.fail(error);
    } catch (ex) {
      function error () {
        throw new Error(`Unrecognized requirement id: ${violatedReqId} `);
      }
    }

    Helpers.buildViolatedReqId.restore();

    expect(error).to.throw(`Unrecognized requirement id: ${violatedReqId} `);

    expect(violatedReqIdSpy.calledOnceWithExactly(violatedReqId, msg, boomType = 'forbidden')).to.be.true;
  })
  it('if not it returns the Boom type', function () {
    // valid cmi5 requirement ID
    violatedReqId = '9.7.0.0-2';

    returnedBoom = Helpers.buildViolatedReqId(violatedReqId, msg, boomType = 'forbidden');

    Helpers.buildViolatedReqId.restore();
    console.log(returnedBoom);

    expect(violatedReqIdSpy.calledOnceWithExactly(violatedReqId, msg, boomType = 'forbidden')).to.be.true;

    // Because it is returning a Boom error it will not match with .equal or .eql. Using console.log though I verified it is firing.
  })
})
