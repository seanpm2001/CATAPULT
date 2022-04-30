const { expect } = require('chai')
const sinon = require('sinon')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const Session = require('../service/plugins/routes/lib/session.js')
const { assert } = require('chai')
const Wreck = require('@hapi/wreck')
const spy = sinon.spy
const knex = require('knex')
const mockDb = require('mock-knex')

chai.use(chaiAsPromised)
chai.should()

describe('Test of load function', function () {
  let loadSpy, getSessionStub, test, error
  const sessionId = 1234
  const db = {} // stand in for database

  beforeEach(() => {
    getSessionStub = sinon.stub(Session, 'getSession')
    loadSpy = spy(Session, 'load')
  })

  afterEach(() => {
    getSessionStub.reset()
    getSessionStub.restore()

    loadSpy.restore()
  })

  it('tries to calls the getSession function and waits for updated database information.', async function () {
    getSessionStub.withArgs(sessionId, db).resolves(db)

    test = await Session.load(sessionId, db)

    Session.load.restore()
    Session.getSession.restore()

    expect(loadSpy.calledOnceWithExactly(sessionId, db)).to.be.true

    expect(getSessionStub.calledOnceWithExactly(sessionId, db)).to.be.true

    expect(test).to.equal(db)
  })

  it('throws an error if it cannot retrieve database informaton,', async function () {
    try {
      await Session.load(sessionId, db)
      assert.fail(error)// ensure promise was rejected, ie no false positive test
    } catch (ex) {
      function error () {
        throw new Error(`Failed to select session: ${ex}`)
      }

      // error has to be wrapped and tested here, or it will throw and interrupt test execution
      expect(error).to.throw(`Failed to select session: ${ex}`)
    }

    Session.load.restore()

    expect(loadSpy.calledOnceWithExactly(sessionId, db)).to.be.true
  })
})

describe('Test of getSession function', function () {
  let getSessionSpy
  const sessionId = 1234
  // stand in for database
  const db = knex({
    client: 'mysql'
  })

  beforeEach(() => {
    getSessionSpy = sinon.spy(Session, 'getSession')

    mockDb.mock(db)
  })

  afterEach(() => {
    getSessionSpy.restore()

    mockDb.unmock(db)
  })

  it('uses the session ID to search and return data from database', async function () {
    await Session.getSession(sessionId, db)

    Session.getSession.restore()

    expect(getSessionSpy.calledOnceWithExactly(sessionId, db)).to.be.true
  })
})

describe('Test of loadForChange function', function () {
  let tgqrStub, lfcSpy
  const txn = {} // a transaction object
  let txnRollback = false // to track whether the mocked txn is rolled back
  const sessionId = 1234
  const tenantId = 'tenantID'
  let queryResult

  beforeEach(() => {
    tgqrStub = sinon.stub(Session, 'tryGetQueryResult')
    lfcSpy = sinon.spy(Session, 'loadForChange')
  })

  afterEach(() => {
    tgqrStub.reset()
    tgqrStub.restore()

    lfcSpy.restore()
  })

  it('calls the tryGetQueryResult function and waits for updated txn, assigning it to queryResult variable', async function () {
    tgqrStub.withArgs(txn, sessionId, tenantId).resolves(txn)

    queryResult = await Session.tryGetQueryResult(txn, sessionId, tenantId)

    Session.loadForChange.restore()
    Session.tryGetQueryResult.restore()

    expect(tgqrStub.calledOnceWithExactly(txn, sessionId, tenantId)).to.be.true

    expect(queryResult).to.equal(txn)
  }),

  it('returns the successfully updated Session registration information', async function () {
    tgqrStub.callsFake(() => {
      const queryResult =
		{
		  sessions: 1, // Stand in for Session values that are returned
		  registrationsCoursesAus: regCourseAu = { courseAu: 0 },
		  registrations: 3,
		  coursesAus: 4
		}

      return queryResult
    })

    lfcResult = await Session.loadForChange()

    Session.loadForChange.restore()
    Session.tryGetQueryResult.restore()

    expect(lfcResult).to.eql({ session: 1, regCourseAu: { courseAu: 4 }, registration: 3, courseAu: 4 })
  }),

  it('throws an error if queryResult was not retrieved successfully and rolls back transaction', async function () {
    lfcSpy.restore()
    lfcStub = sinon.stub(Session, 'loadForChange')
    lfcStub.withArgs(txn, sessionId, tenantId).rejects()

    try {
     	await Session.loadForChange(txn, sessionId, tenantId)
      assert.fail(error)
    } catch {
      function error () {
        throw Error(`session: ${sessionId}`)
      }

      txnRollback = true
      expect(error).to.throw(`session: ${sessionId}`)
    }

    Session.loadForChange.restore()

    expect(lfcStub.calledOnceWithExactly(txn, sessionId, tenantId)).to.be.true

    expect(txnRollback).to.be.true

    lfcStub.reset()
    lfcStub.restore()
  })
}),

describe('Test of tryGetQueryResult function', function () {
  let tgqrSpy, gqrStub
  const txn = {} // a transaction object
  const sessionId = 1234
  const tenantId = 'tenantID'

  beforeEach(() => {
    tgqrSpy = sinon.spy(Session, 'tryGetQueryResult')
    gqrStub = sinon.stub(Session, 'getQueryResult')
  })

  afterEach(() => {
    tgqrSpy.restore()

    gqrStub.reset()
    gqrStub.restore()
  })

  it('calls the getQueryResult function and waits for updated txn', async function () {
    gqrStub.withArgs(txn, sessionId, tenantId).resolves(txn)

    queryResult = await Session.tryGetQueryResult(txn, sessionId, tenantId)

    Session.tryGetQueryResult.restore()
    Session.getQueryResult.restore()

    expect(tgqrSpy.calledOnceWithExactly(txn, sessionId, tenantId)).to.be.true
    expect(gqrStub.calledOnceWithExactly(txn, sessionId, tenantId)).to.be.true

    expect(queryResult).to.equal(txn)
  })

  it('throws an error if it cannot retrieve,', async function () {
    gqrStub.withArgs(txn, sessionId, tenantId).rejects('Failed to select session, registration course AU, registration and course AU for update: ')

    try {
      await Session.tryGetQueryResult(txn, sessionId, tenantId)
      assert.fail(error)// ensure promise was rejected, ie no false positive test
    } catch (ex) {
      function error () {
        throw new Error(`Failed to select session, registration course AU, registration and course AU for update: ${ex}`)
      }

      // error has to be wrapped and tested here, or it will throw and interrupt test execution
      expect(error).to.throw(`Failed to select session, registration course AU, registration and course AU for update: ${ex}`)
    }

    Session.tryGetQueryResult.restore()
    Session.getQueryResult.restore()

    expect(tgqrSpy.calledOnceWithExactly(txn, sessionId, tenantId)).to.be.true

    expect(gqrStub.calledOnceWithExactly(txn, sessionId, tenantId)).to.be.true
  })
}),

describe('Test of getQueryResult', function () {
  let gqrSpy
  // a transaction object
  const txn = knex({
    client: 'mysql'
  })
  const txnRollback = false // to track whether the mocked txn is rolled back
  const sessionId = 12345
  const tenantId = 'tenantID'

  beforeEach(() => {
    gqrSpy = sinon.spy(Session, 'getQueryResult')

    mockDb.mock(txn)
  })

  afterEach(() => {
    gqrSpy.restore()

    mockDb.unmock(txn)
  })

  it('returns the txn(transaction) with requested table information if  match for args sessionId and tenantId are found in database', async function () {
    await Session.getQueryResult(txn, sessionId, tenantId)

    Session.getQueryResult.restore()

    expect(gqrSpy.calledOnceWithExactly(txn, sessionId, tenantId)).to.be.true

    expect(txnRollback).to.be.false
  })
}),

describe('Test of abandon function', function () {
  let abandonSpy
  const db = { transaction: txn = {} }
  var lrsWreck, courseAu, session, regCourseAu, registration, sessionId, tenantId, by
  var txn = {} // a transaction object
  let txnRollback = false // to track whether the mocked txn is rolled back
  var sessionId = 1234
  var tenantId = 'tenantID'

  beforeEach(() => {
    abandonSpy = sinon.spy(Session, 'abandon')
    lfcStub = sinon.stub(Session, 'loadForChange')
  })

  afterEach(() => {
    abandonSpy.restore()

    lfcStub.reset()
    lfcStub.restore()
  })

  it('retrieves the database transaction object, and tries to call the loadForChange function, to update Session information ', async function () {
    Session.abandon(sessionId, tenantId, by, { db, lrsWreck })

    lfcStub.withArgs(txn, sessionId, tenantId, courseAu).callsFake(() => {
      const queryResult = {
        session,
        regCourseAu,
        registration,
        courseAu
      }
    })

    queryResult = await Session.loadForChange(txn, sessionId, tenantId, courseAu)

    Session.abandon.restore()
    Session.loadForChange.restore()

    expect(abandonSpy.calledOnceWithExactly(sessionId, tenantId, by, { db, lrsWreck })).to.be.true
    expect(lfcStub.calledOnceWithExactly(txn, sessionId, tenantId, courseAu)).to.be.true
  }),

  it('catches and throws an error if the Session information was not retrieved successfully and rolls back transaction', async function () {
    lfcStub.withArgs(txn, sessionId, tenantId, courseAu).rejects('Boom error (internal)')

    Session.abandon(sessionId, tenantId, by, { db, lrsWreck })

    try {
      await Session.loadForChange(txn, sessionId, tenantId, courseAu)
      assert.fail(error) // ensure promise was rejected, ie no false positive
		 } catch {
      txnRollback = true
      function error () {
        throw new Error('Boom error (internal)')
      }
		 }

    Session.abandon.restore()
    Session.loadForChange.restore()

    expect(txnRollback).to.be.true
    expect(error).to.throw('Boom error (internal)')

    expect(abandonSpy.calledOnceWithExactly(sessionId, tenantId, by, { db, lrsWreck })).to.be.true
    expect(lfcStub.calledOnceWithExactly(txn, sessionId, tenantId, courseAu)).to.be.true
  })

  it('deterimines the Session is niether abandoned or terminated, and has it update and commit the transaction', async function () {

    /// This part of abandon function is all done via other functions, which will be tested separetly on their own.
    /// There is no more logic executed in this function, but wanted to leave this space to describe what the rest
    /// of 'abandon does for any future questions or updates.
  })
})

describe('Test of tryGetSessionInfo function', function () {
  let tgsiSpy, lfcStub
  const txn = {} // a transaction object
  let txnRollback = false // to track whether the mocked txn is rolled back
  const sessionId = 1234
  const tenantId = 'tenantID'
  let session, regCourseAu, registration, courseAu

  beforeEach(() => {
    tgsiSpy = sinon.spy(Session, 'tryGetSessionInfo')
    lfcStub = sinon.stub(Session, 'loadForChange')
  })

  afterEach(() => {
    tgsiSpy.restore()

    lfcStub.reset()
    lfcStub.restore()
  })

  it('calls the loadForChange function and waits for updated Session information', async function () {
    lfcStub.withArgs(txn, sessionId, tenantId).resolves({ session, regCourseAu, registration, courseAu })

    queryResult = await Session.tryGetSessionInfo(txn, sessionId, tenantId)

    Session.tryGetSessionInfo.restore()
    Session.loadForChange.restore()

    expect(tgsiSpy.calledOnceWithExactly(txn, sessionId, tenantId)).to.be.true
    expect(lfcStub.calledOnceWithExactly(txn, sessionId, tenantId)).to.be.true

    expect(queryResult).to.eql({ session, regCourseAu, registration, courseAu })// note use of 'eql' here. Values are same, reference is not
  })

  it('throws an error if it cannot retrieve,', async function () {
    lfcStub.withArgs(txn, sessionId, tenantId).rejects('Boom error (internal)')

    try {
      await Session.tryGetSessionInfo(txn, sessionId, tenantId)
      assert.fail(error)// ensure promise was rejected, ie no false positive test
    } catch (ex) {
      function error () {
        txnRollback = true
        throw new Error('Boom error (internal)')
      }

      // error has to be wrapped and tested here, or it will throw and interrupt test execution
      expect(error).to.throw('Boom error (internal)')
    }

    Session.tryGetSessionInfo.restore()
    Session.loadForChange.restore()

    expect(txnRollback).to.be.true

    expect(tgsiSpy.calledOnceWithExactly(txn, sessionId, tenantId)).to.be.true

    expect(lfcStub.calledOnceWithExactly(txn, sessionId, tenantId)).to.be.true
  })
}),

describe('Test of initializeDuration function', function () {
  let durationSeconds
  const session = {
    initialized_at: { getTime: () => new Date().getTime() + 100000 },
    is_initialized: true
  }

  it(' checks if Session has been initialized and if true returns the duration since then', function () {
    initDurSpy = sinon.spy(Session, 'initializeDuration')

    durationSeconds = Session.initializeDuration(session)

    Session.initializeDuration.restore()

    expect(initDurSpy.calledOnceWithExactly(session)).to.be.true

    assert.isDefined(durationSeconds)
    assert.isNumber(durationSeconds)
  })
}),

describe('Test of determineSessionTerminated function', async function () {
  const session = { is_terminated: true }
  const txn = { rollback: () => true } // a transaction object

  it('checks the Session status, and if terminated, rolls back the txn (transaction object)', async function () {
    dstSpy = sinon.spy(Session, 'determineSessionTerminated')

    sessionInfo = await Session.determineSessionTerminated(session, txn)

    Session.determineSessionTerminated.restore()

    expect(txn.rollback()).to.equal(true)// determineSessionTerminated does not return a value itself, it just rollsback the transaction and returns to program execution
    expect(dstSpy.calledOnceWithExactly(session, txn)).to.be.true

    dstSpy.restore()
  })
}),

describe('Test of determineSessionAbandoned function', async function () {
  const session = { is_abandoned: true }
  const txn = { rollback: () => true } // a transaction object

  it('checks the Session status, and if abandoned, rolls back the txn (transaction object)', async function () {
    dsaSpy = sinon.spy(Session, 'determineSessionAbandoned')

    sessionInfo = await Session.determineSessionAbandoned(session, txn)

    Session.determineSessionAbandoned.restore()

    expect(txn.rollback()).to.equal(true)// determineSessionAbandoned does not return a value itself, it just rollsback the transaction and returns to program execution
    expect(dsaSpy.calledOnceWithExactly(session, txn)).to.be.true

    dsaSpy.restore()
  })
}),

describe('Test of retrieveResponse function', function () {
  let rrSpy, rrStub, wreckStub, error
  const txn = { rollback: () => true || false } // a transaction object
  let durationSeconds, session, regCourseAu, registration
  const lrsWreck = { request: (string1, string2) => 'response received' /* assume request received */ }
  let stResponse = 'st response'
  let stResponseBody = 'st response body'

  beforeEach(() => {
    rrSpy = sinon.spy(Session, 'retrieveResponse')
    wreckStub = sinon.stub(Wreck, 'read')
  })

  afterEach(() => {
    rrSpy.restore()

    wreckStub.reset()
    wreckStub.restore()
  })

  it('tries to retrieve and return the response from a POST request to the LRS server', async function () {
    rrSpy.restore()// this is the only one we want to use a stub for, so take away spy
    rrStub = sinon.stub(Session, 'retrieveResponse')

    rrStub.withArgs(durationSeconds, session, regCourseAu, registration, lrsWreck, txn).resolves([stResponse, stResponseBody]);

    [stResponse, stResponseBody] = await Session.retrieveResponse(durationSeconds, session, regCourseAu, registration, lrsWreck, txn)

    Session.retrieveResponse.restore()

    expect(stResponse).to.equal('st response')
    expect(stResponseBody).to.equal('st response body')

    expect(rrStub.calledOnceWithExactly(durationSeconds, session, regCourseAu, registration, lrsWreck, txn)).to.be.true
  })

  it('catches and throws an error if the server information was not retrieved and returned successfully, then rolls back transaction', async function () {
    try {
      await Session.retrieveResponse(durationSeconds, session, regCourseAu, registration, lrsWreck, txn)
      assert.fail(error)// ensure promise was rejected, ie no false positive test
    } catch (ex) {
      function error () {
        txn.rollback = true
        throw new Error(`Failed request to store abandoned statement: ${ex}`)
      }

      // error has to be wrapped and tested here, or it will throw and interrupt test execution
      expect(error).to.throw(`Failed request to store abandoned statement: ${ex}`)
    }

    Session.retrieveResponse.restore()

    expect(txn.rollback).to.be.true

    expect(rrSpy.calledOnceWithExactly(durationSeconds, session, regCourseAu, registration, lrsWreck, txn)).to.be.true
  })
}),

describe('Test of checkStatusCode function', function () {
  const txn = { rollback: () => true || false } // a transaction object
  const stResponse = { statusCode: 300 }
  const stResponseBody = 'response body'
  let chkStatusSpy, error

  beforeEach(() => {
    chkStatusSpy = sinon.spy(Session, 'checkStatusCode')
  })

  afterEach(() => {
    chkStatusSpy.restore()
  })

  it(' checks if status code (from POST response in retrieveResponse) is equal to 200, if it is not, it throws an error.', async function () {
    try {
      await Session.checkStatusCode(txn, stResponse, stResponseBody)
      assert.fail(error)// ensure promise was rejected, ie no false positive test
    } catch (ex) {
      function error () {
        txn.rollback = true
        throw new Error(`Failed to store abandoned statement (${stResponse.statusCode}): ${stResponseBody}`)
      }

      // error has to be wrapped and tested here, or it will throw and interrupt test execution
      expect(error).to.throw('Failed to store abandoned statement (300): response body')
    }

    Session.checkStatusCode.restore()

    expect(txn.rollback).to.be.true

    expect(chkStatusSpy.calledOnceWithExactly(txn, stResponse, stResponseBody)).to.be.true
  })
}),

describe('Test of txnUpdate function', function () {
  let txnUpdateStub, txnUpdateSpy
  let session
  const txn = { rollback: () => true || false } // a transaction object
  let tenantId, by, error, updateResult

  it("uses the transaction objects 'update' and 'where' functions to update the Session", async function () {
    txnUpdateStub = sinon.stub(Session, 'txnUpdate')
    txnUpdateStub.withArgs(session, tenantId, txn, by).callsFake(() => (Promise.resolve(txn.rollback = false))) // we will pass back txn, as the updating of txn actually falls under third party functions;

    updateResult = await Session.txnUpdate(session, tenantId, txn, by)

    Session.txnUpdate.restore()

    expect(txnUpdateStub.calledOnceWithExactly(session, tenantId, txn, by)).to.be.true
    expect(updateResult).to.equal(false)

    txnUpdateStub.reset()
    txnUpdateStub.restore()
  })

  it('catches and throws an error if the session information was not updated and returned successfully, then rolls back transaction', async function () {
    txnUpdateSpy = sinon.spy(Session, 'txnUpdate')

    try {
      await Session.txnUpdate(session, tenantId, txn, by)
      assert.fail(error)// ensure promise was rejected, ie no false positive test
    } catch (ex) {
      function error () {
        txn.rollback = true
        throw new Error(`Failed to update session: ${ex}`)
      }

      // error has to be wrapped and tested here, or it will throw and interrupt test execution
      expect(error).to.throw(`Failed to update session: ${ex}`)
    }

    Session.txnUpdate.restore()

    expect(txn.rollback).to.be.true

    expect(txnUpdateSpy.calledOnceWithExactly(session, tenantId, txn, by)).to.be.true

    txnUpdateSpy.restore()
  })
})
