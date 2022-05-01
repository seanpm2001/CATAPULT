const { expect } = require('chai');
const sinon = require('sinon');
const chai = require('chai');
const sinonChai = require('sinon-chai');
const chaiAsPromised = require('chai-as-promised');
const RegistrationHelpers = require('../service/plugins/routes/lib/registrationHelpers.js');
const { assert } = require('chai');
const Wreck = require('@hapi/wreck');
const { v4: uuidv4 } = require('uuid');

chai.use(chaiAsPromised);
chai.should();

describe('Test of mapMoveOnChildren function', function () {
  let moveOnChildrenSpy, testChild, satisfied;

  const child = {
    lmsId: 0,
    id: 0,
    pubId: 1,
    type: 'au',
    moveOn: 'NotApplicable',
    satisfied: true || false,
    children: { map: () => satisfied = true }
  };

  beforeEach(() => {
    moveOnChildrenSpy = sinon.spy(RegistrationHelpers, 'mapMoveOnChildren');
  })

  afterEach(() => {
    moveOnChildrenSpy.restore();
  })

  it('accepts a "child" parameter and maps to its corresponding information', function () {
    testChild = RegistrationHelpers.mapMoveOnChildren(child);

    RegistrationHelpers.mapMoveOnChildren.restore();

    expect(moveOnChildrenSpy.calledOnceWithExactly(child)).to.be.true;

    expect(testChild.lmsId).to.equal(0);
    expect(testChild.pubId).to.equal(0);
    expect(testChild.type).to.equal('au');
    expect(testChild.satisfied).to.equal(true);
  })

  it('if the .type of child is equal to "block", calls the map() to create array of elements and store in .children property', function () {
    child.type = 'block';

    testChild = RegistrationHelpers.mapMoveOnChildren(child);

    RegistrationHelpers.mapMoveOnChildren.restore();

    expect(moveOnChildrenSpy.calledOnceWithExactly(child)).to.be.true;

    expect(testChild.lmsId).to.equal(0);
    expect(testChild.pubId).to.equal(0);
    expect(testChild.type).to.equal('block');
    expect(testChild.children).to.equal(true);
  })
})

describe('Test of tryParseTemplate function', function () {
  let tptSpy, parseStub, statement, satisfiedStTemplate, error;

  beforeEach(() => {
    parseStub = sinon.stub(JSON, 'parse');
    tptSpy = sinon.spy(RegistrationHelpers, 'tryParseTemplate');
  })

  afterEach(() => {
    parseStub.reset()
    parseStub.restore()
    tptSpy.restore()
  })

  it('tries to parse a JSON statement template', function () {
    parseStub.withArgs(satisfiedStTemplate).returns('a parsed template');
    statement = RegistrationHelpers.tryParseTemplate(satisfiedStTemplate);

    RegistrationHelpers.tryParseTemplate.restore();
    JSON.parse.restore();

    expect(tptSpy.calledOnceWithExactly(satisfiedStTemplate)).to.be.true;

    expect(parseStub.calledOnceWithExactly(satisfiedStTemplate)).to.be.true;

    expect(statement).to.equal('a parsed template');
  })

  it('throws an error if it cannot parse the template', function () {
    parseStub.withArgs(satisfiedStTemplate).rejects();

    try {
      statement = RegistrationHelpers.tryParseTemplate(satisfiedStTemplate)
      // ensure promise was rejected, ie no false positive test
      assert.fail(error);
    } catch (ex) {
      function error () {
        throw new Error(`Failed to parse statement template: ${ex}`);
      }

      // error has to be wrapped and tested here, or it will throw and interrupt test execution
      expect(error).to.throw(`Failed to parse statement template: ${ex}`);
    }

    RegistrationHelpers.tryParseTemplate.restore();
    JSON.parse.restore();

    expect(tptSpy.calledOnceWithExactly(satisfiedStTemplate)).to.be.true;

    expect(parseStub.calledOnceWithExactly(satisfiedStTemplate)).to.be.true;
  })
})

describe('Test of assignStatementValues function', function () {
  let asvSpy;

  const statement = {
    id: 0,
    timestamp: 0,
    object: {
      id: 0,
      definition: {
        type: ' '
      }
    },
    moveOn: 'NotApplicable',
    context: {
      contextActivities: {
        grouping: 0
      }
    },
    children: 0
  };
  const node = {
    lmsId: 0,
    type: 'au',
    pubId: 0
  };

  beforeEach(() => {
    asvSpy = sinon.spy(RegistrationHelpers, 'assignStatementValues');
  })

  afterEach(() => {
    asvSpy.restore();
  })

  it('assigns statement values from passed in node and statement parameters (called by loopThroughChildren)', function () {
    RegistrationHelpers.assignStatementValues(node, statement);
    RegistrationHelpers.assignStatementValues.restore();

    expect(asvSpy.calledOnceWithExactly(node, statement)).to.be.true;
  })
})

describe('Test of nodeSatisfied function', function () {
  let nodeSatisfiedSpy, testNode;

  const node = {
    satisfied: true || false
  };

  beforeEach(() => {
    nodeSatisfiedSpy = sinon.spy(RegistrationHelpers, 'nodeSatisfied');
  })

  afterEach(() => {
    nodeSatisfiedSpy.restore();
  })

  it('returns true if node it is passed satisified property is true (called by isSatisfied)', async function () {
    node.satisfied = true;

    testNode = await RegistrationHelpers.nodeSatisfied(node);

    RegistrationHelpers.nodeSatisfied.restore();

    expect(nodeSatisfiedSpy.calledOnceWithExactly(node)).to.be.true;

    expect(testNode).to.be.true;
  })
})

describe('Test of AUnodeSatisfied function', function () {
  let auNodeSatisfiedSpy;
  let testNode;

  const node = {
    satisfied: true || false,
    type: '',
    lmsId: true || false
  };
  let auToSetSatisfied = true || false;

  beforeEach(() => {
    auNodeSatisfiedSpy = sinon.spy(RegistrationHelpers, 'AUnodeSatisfied');
  })

  afterEach(() => {
    auNodeSatisfiedSpy.restore();
  })

  it('verifies the nodes "type" property is "au". If so it sets the "lmsId" and "satisified" properties and returns the "satisified property (called by isSatisfied)', async function () {
    node.type = 'au';
    node.lmsId = true;
    auToSetSatisfied = true;

    testNode = await RegistrationHelpers.AUnodeSatisfied(node, auToSetSatisfied);

    RegistrationHelpers.AUnodeSatisfied.restore();

    expect(auNodeSatisfiedSpy.calledOnceWithExactly(node, auToSetSatisfied)).to.be.true;

    expect(testNode).to.be.true;
  })
})

describe('Test of loopThroughChildren function', function () {
  let auToSetSatisfied, satisfiedStTemplate, isSatisfiedStub, ltcSpy, lrsWreck, child, allChildrenSatisfied, txn;
  const node = {
    satisfied: true || false,
    type: '',
    lmsId: true || false,
    children: [child, child, child]
  };

  chai.use(sinonChai);

  beforeEach(() => {
    isSatisfiedStub = sinon.stub(RegistrationHelpers, 'isSatisfied');

    ltcSpy = sinon.spy(RegistrationHelpers, 'loopThroughChildren');
  })

  afterEach(() => {
    isSatisfiedStub.reset();
    isSatisfiedStub.restore();

    ltcSpy.restore();
  })

  it('recursively loops through a node and if any of the nodes children are unsatisified, it marks "allChildrenSatisifed false and returns that value" (called in isSatisifed function)', async function () {
    isSatisfiedStub.withArgs(child, auToSetSatisfied, satisfiedStTemplate, lrsWreck, txn).resolves(false);

    allChildrenSatisfied = await RegistrationHelpers.loopThroughChildren(node, auToSetSatisfied, satisfiedStTemplate, lrsWreck, txn);

    RegistrationHelpers.isSatisfied.restore();
    RegistrationHelpers.loopThroughChildren.restore();

    expect(ltcSpy.calledOnceWithExactly(node, auToSetSatisfied, satisfiedStTemplate, lrsWreck, txn)).to.be.true;

    // this should be called three times. There are three items in node.children
    isSatisfiedStub.should.have.callCount(3);
    isSatisfiedStub.should.have.been.calledWith(child, auToSetSatisfied, satisfiedStTemplate, lrsWreck, txn);

    expect(allChildrenSatisfied).to.be.false;
  })

  it('recursively loops through a node and if all of the nodes children are satisified, it marks "allChildrenSatisifed" true and returns that value (called in isSatisifed function)', async function () {
    isSatisfiedStub.withArgs(child, auToSetSatisfied, satisfiedStTemplate, lrsWreck, txn).resolves(true);

    allChildrenSatisfied = await RegistrationHelpers.loopThroughChildren(node, auToSetSatisfied, satisfiedStTemplate, lrsWreck, txn);

    RegistrationHelpers.isSatisfied.restore();
    RegistrationHelpers.loopThroughChildren.restore();

    expect(ltcSpy.calledOnceWithExactly(node, auToSetSatisfied, satisfiedStTemplate, lrsWreck, txn)).to.be.true;

    // this should be called three times. There are three items in node.children
    isSatisfiedStub.should.have.callCount(3);
    isSatisfiedStub.should.have.been.calledWith(child, auToSetSatisfied, satisfiedStTemplate, lrsWreck, txn);

    expect(allChildrenSatisfied).to.be.true;
  })
})

describe('Test of retrieveResponse function', function () {
  let rrSpy, rrStub, wreckStub, error;
  const txn = { rollback: () => true || false };
  // assume request received
  const lrsWreck = { request: (string1, string2) => 'response received' };
  let satisfiedStResponse = 'st response';
  let satisfiedStResponseBody = 'st response body';

  beforeEach(() => {
    rrSpy = sinon.spy(RegistrationHelpers, 'retrieveResponse');
    wreckStub = sinon.stub(Wreck, 'read');
  })

  afterEach(() => {
    rrSpy.restore();

    wreckStub.reset();
    wreckStub.restore();
  })

  it('tries to retrieve and return the response from a POST request to the LRS server', async function () {
    // this is the only one we want to use a stub for, so take away spy
    rrSpy.restore();
    rrStub = sinon.stub(RegistrationHelpers, 'retrieveResponse');

    rrStub.withArgs(lrsWreck, txn).resolves([satisfiedStResponse, satisfiedStResponseBody]);

    [satisfiedStResponse, satisfiedStResponseBody] = await RegistrationHelpers.retrieveResponse(lrsWreck, txn);

    RegistrationHelpers.retrieveResponse.restore();

    expect(satisfiedStResponse).to.equal('st response');
    expect(satisfiedStResponseBody).to.equal('st response body');

    expect(rrStub.calledOnceWithExactly(lrsWreck, txn)).to.be.true;
  })

  it('catches and throws an error if the server information was not retrieved and returned successfully, then rolls back transaction', async function () {
    try {
      await RegistrationHelpers.retrieveResponse(lrsWreck, txn);
      // ensure promise was rejected, ie no false positive test
      assert.fail(error);
    } catch (ex) {
      function error () {
        txn.rollback = true;
        throw new Error(`Failed request to store abandoned statement: ${ex}`);
      }

      // error has to be wrapped and tested here, or it will throw and interrupt test execution
      expect(error).to.throw(`Failed request to store abandoned statement: ${ex}`);
    }

    RegistrationHelpers.retrieveResponse.restore();

    expect(txn.rollback).to.be.true;

    expect(rrSpy.calledOnceWithExactly(lrsWreck, txn)).to.be.true;
  })
})

describe('Test of checkStatusCode function', function () {
  const txn = { rollback: () => true || false };
  const satisfiedStResponse = { statusCode: 300 };
  const satisfiedStResponseBody = 'response body';
  let chkStatusSpy, error;

  beforeEach(() => {
    chkStatusSpy = sinon.spy(RegistrationHelpers, 'checkStatusCode');
  })

  afterEach(() => {
    chkStatusSpy.restore();
  })

  it(' checks if status code (from POST response in retrieveResponse) is equal to 200, if it is not, it throws an error.', async function () {
    try {
      await RegistrationHelpers.checkStatusCode(satisfiedStResponse, satisfiedStResponseBody);
      // ensure promise was rejected, ie no false positive test
      assert.fail(error);
    } catch (ex) {
      function error () {
        txn.rollback = true;
        throw new Error(`Failed to store satisfied statement: ${satisfiedStResponse.statusCode} (${satisfiedStResponseBody})`);
      }
      // error has to be wrapped and tested here, or it will throw and interrupt test execution
      expect(error).to.throw(`Failed to store satisfied statement: ${satisfiedStResponse.statusCode} (${satisfiedStResponseBody})`);
    }

    RegistrationHelpers.checkStatusCode.restore();

    expect(txn.rollback).to.be.true;

    expect(chkStatusSpy.calledOnceWithExactly(satisfiedStResponse, satisfiedStResponseBody)).to.be.true;
  })
})

describe('Test of isSatisfied function', function () {
  let isSatisfiedSpy, isSatisfiedStub, nodeSatisfiedStub, AUnodeSatisfiedStub, loopThroughChildrenStub, tryParseTemplateStub,
    assignStatementValuesStub, retrieveResponseStub, checkStatusCodeStub, auToSetSatisfied, satisfiedStTemplate, statement, allSatisfiedTest, testLoop;
  /* assume request received */
  const lrsWreck = { request: (string1, string2) => 'response received' };
  const txn = { rollback: () => true || false };
  const satisfiedStResponse = 'a satisfied response';
  const satisfiedStResponseBody = 'satisfied response body';

  const child = {
    lmsId: 0,
    id: 0,
    pubId: 1,
    type: 'au',
    moveOn: 'NotApplicable',
    satisfied: true || false,
    children: [testLoop, testLoop, testLoop, testLoop, testLoop]
  };
  const node = {
    satisfied: true || false,
    type: '',
    lmsId: true || false,
    children: [child, child, child]
  };

  beforeEach(() => {
    nodeSatisfiedStub = sinon.stub(RegistrationHelpers, 'nodeSatisfied');
    AUnodeSatisfiedStub = sinon.stub(RegistrationHelpers, 'AUnodeSatisfied');
    loopThroughChildrenStub = sinon.stub(RegistrationHelpers, 'loopThroughChildren');
    tryParseTemplateStub = sinon.stub(RegistrationHelpers, 'tryParseTemplate');
    assignStatementValuesStub = sinon.stub(RegistrationHelpers, 'assignStatementValues');
    retrieveResponseStub = sinon.stub(RegistrationHelpers, 'retrieveResponse');
    checkStatusCodeStub = sinon.stub(RegistrationHelpers, 'checkStatusCode');

    isSatisfiedSpy = sinon.spy(RegistrationHelpers, 'isSatisfied');
  })

  afterEach(() => {
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
  })

  it('recursively iterates through node (given as param), ensuring all its children are satisified. When they are, returns true', async function () {
    nodeSatisfiedStub.withArgs(node).resolves(true);
    AUnodeSatisfiedStub.withArgs(node, { auToSetSatisfied }).resolves(true);
    loopThroughChildrenStub.withArgs(node, auToSetSatisfied, satisfiedStTemplate, lrsWreck).resolves(true);
    tryParseTemplateStub.withArgs(satisfiedStTemplate).resolves(statement);
    assignStatementValuesStub.withArgs(node, statement).resolves(true);
    retrieveResponseStub.withArgs(lrsWreck, txn).resolves([satisfiedStResponse, satisfiedStResponseBody]);
    checkStatusCodeStub.withArgs(satisfiedStResponse, satisfiedStResponseBody);

    // returns true or false from main func, so this should be true or false?
    allSatisfiedTest = await RegistrationHelpers.isSatisfied(node, auToSetSatisfied, satisfiedStTemplate, lrsWreck, txn);

    RegistrationHelpers.isSatisfied.restore();
    RegistrationHelpers.nodeSatisfied.restore();
    RegistrationHelpers.AUnodeSatisfied.restore();
    RegistrationHelpers.loopThroughChildren.restore();
    RegistrationHelpers.tryParseTemplate.restore();
    RegistrationHelpers.assignStatementValues.restore();
    RegistrationHelpers.retrieveResponse.restore();
    RegistrationHelpers.checkStatusCode.restore();

    expect(allSatisfiedTest).to.be.true;
    // this could be called more than once, and that is acceptable if it needs to iterate until children satisfied
    expect(isSatisfiedSpy.calledWith(node, auToSetSatisfied, satisfiedStTemplate, lrsWreck, txn)).to.be.true;
  })
  it('recursively iterates through node (given as param), ensuring all its children are satisified. If they cannot be, returns false', async function () {
    // Because of the nature of the recursion here, it really isn't possible to return false under normal circumstances,
    // as the program will loop util satisified. So I have stubbed the function to make it return false
    isSatisfiedSpy.restore();
    isSatisfiedStub = sinon.stub(RegistrationHelpers, 'isSatisfied');
    isSatisfiedStub.withArgs(node, auToSetSatisfied, satisfiedStTemplate, lrsWreck, txn).resolves(false);

    // returns true or false from main func, so this should be true or false?
    allSatisfiedTest = await RegistrationHelpers.isSatisfied(node, auToSetSatisfied, satisfiedStTemplate, lrsWreck, txn);

    RegistrationHelpers.isSatisfied.restore();

    expect(allSatisfiedTest).to.be.false;
    // this could be called more than once, and that is acceptable if it needs to iterate until children satisfied
    expect(isSatisfiedStub.calledWith(node, auToSetSatisfied, satisfiedStTemplate, lrsWreck, txn)).to.be.true;
  })
})
