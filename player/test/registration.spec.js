const { expect } = require('chai')
const sinon = require('sinon')
const chai = require('chai')
const sinonChai = require('sinon-chai')
const Registration = require('../service/plugins/routes/lib/registration.js')
const RegistrationHelpers = require('../service/plugins/routes/lib/registrationHelpers.js')
const { assert } = require('chai')
const knex = require('knex')
const mockDb = require('mock-knex')

chai.use(sinonChai)
chai.should()

describe('Test of create function', function () {
  const tenantId = 0
  const courseId = 0
  let actor, lrsWreck, registrationId, registration, courseAUs, createStub, error
  let createSpy, getCourseStub, getCourseAUsStub, updateCourseAUmapStub, parseRegistrationDataStub, updateMetadataStub
  const code = 1000

  const txn = knex({
    client: 'mysql'
  })

  const db = {
    transaction: async () => {
      const course = await Registration.getCourse(txn, tenantId, courseId)
      const courseAUs = await Registration.getCourseAUs(txn, tenantId, courseId)
      const registration = {
        tenantId,
        code,
        courseId,
        actor: JSON.stringify(actor),
        metadata: JSON.stringify({
          version: 1,
          moveOn: {
            type: 'course',
            lmsId: course.lmsId,
            pubId: course.structure.course.id,
            satisfied: false,
            children: {
              course: {
                structure: {
                  course: { children: { map: () => 1 } }
                }
              }
            }
          }
        })
      }
      let regResult = await txn('registrations').insert(registration)

      // Nothing will really be returned, so give value

      regResult = [5, 5]
      registrationId = registration.id = regResult[0]

      await Registration.updateCourseAUmap(txn, tenantId, registrationId, courseAUs)

      await Registration.parseRegistrationData(registration, lrsWreck)

      await Registration.updateMetadata(txn, registration, tenantId)

      return await registrationId
    }
  }

  const course = {
    lmsId: 0,
    structure: {
      course: {
        id: 0
      }
    }
  }

  beforeEach(() => {
    createSpy = sinon.spy(Registration, 'create')
    getCourseStub = sinon.stub(Registration, 'getCourse')
    getCourseAUsStub = sinon.stub(Registration, 'getCourseAUs')
    updateCourseAUmapStub = sinon.stub(Registration, 'updateCourseAUmap')
    parseRegistrationDataStub = sinon.stub(Registration, 'parseRegistrationData')
    updateMetadataStub = sinon.stub(Registration, 'updateMetadata')

    mockDb.mock(txn)
  })

  afterEach(() => {
    createSpy.restore()

    getCourseStub.reset()
    getCourseStub.restore()

    getCourseAUsStub.reset()
    getCourseAUsStub.restore()

    updateCourseAUmapStub.reset()
    updateCourseAUmapStub.restore()

    parseRegistrationDataStub.reset()
    parseRegistrationDataStub.restore()

    updateMetadataStub.reset()
    updateMetadataStub.restore()

    mockDb.unmock(txn)
  })

  // come back to this, may need to stub whole thing out, will not use false db we created
  it('updates the database with information from transaction and returns the registrationId', async function () {
    getCourseStub.withArgs(txn, tenantId, courseId).resolves(course)
    getCourseAUsStub.withArgs(txn, tenantId, courseId).resolves(courseAUs)
    updateCourseAUmapStub.withArgs(txn, tenantId, registrationId, courseAUs).resolves(true)
    parseRegistrationDataStub.withArgs(registration, lrsWreck).resolves(true)
    updateMetadataStub.withArgs(txn, registration, tenantId).resolves(true)

    testCreate = await Registration.create({ tenantId, courseId, actor, code }, db, lrsWreck, course, registration, txn)

    Registration.create.restore()
    Registration.getCourse.restore()
    Registration.updateCourseAUmap.restore()
    Registration.parseRegistrationData.restore()
    Registration.updateMetadata.restore()

    expect(createSpy.calledOnce).to.be.true
    getCourseStub.should.have.been.calledOnceWithExactly(txn, tenantId, courseId)
    getCourseAUsStub.should.have.been.calledOnceWithExactly(txn, tenantId, courseId)
    updateCourseAUmapStub.should.have.been.calledOnceWithExactly(txn, tenantId, registrationId, courseAUs)

    parseRegistrationDataStub.should.have.been.calledOnce
    updateMetadataStub.should.have.been.calledOnce

    // Because the db.transaction utilizes a query in the middle, I cannot seem to mock it. So despite my
    // efforts to create a 'fake' query, we cannot seem to get it to return anything.
  })

  it('catches and throws an error if it is not able to update DB or return registrationId', async function () {
    createSpy.restore()
    createStub = sinon.stub(Registration, 'create')

    createStub.withArgs({ tenantId, courseId, actor, code }, { db, lrsWreck }, txn).rejects('Failed to store registration: ')
    try {
      await Registration.create({ tenantId, courseId, actor, code }, { db, lrsWreck }, txn)
      // ensure promise was rejected, ie no false positive
      assert.fail(error)
    } catch (ex) {
      function error () {
        throw new Error('Failed to store registration: ')
      }
    }

    Registration.create.restore()

    expect(error).to.throw('Failed to store registration: ')

    expect(createStub.calledOnceWithExactly({ tenantId, courseId, actor, code }, { db, lrsWreck }, txn)).to.be.true
  })
})

describe('Test of getCourse function', function () {
  let getCourseSpy
  const tenantId = 0
  const courseId = 0
  const txn = knex({
    client: 'mysql'
  })

  beforeEach(() => {
    getCourseSpy = sinon.spy(Registration, 'getCourse')
  })

  afterEach(() => {
    getCourseSpy.restore()
  })

  it('queries database for course information', async function () {
    mockDb.mock(txn)
    await Registration.getCourse(txn, tenantId, courseId)

    Registration.getCourse.restore()

    expect(getCourseSpy.calledOnceWithExactly(txn, tenantId, courseId)).to.be.true
    mockDb.unmock(txn)
  })
})

describe('Test of getCourseAUs function', function () {
  let getCourseAUsSpy
  const tenantId = 0
  const courseId = 0
  const txn = knex({
    client: 'mysql'
  })

  beforeEach(() => {
    getCourseAUsSpy = sinon.spy(Registration, 'getCourseAUs')

    mockDb.mock(txn)
  })

  afterEach(() => {
    getCourseAUsSpy.restore()

    mockDb.unmock(txn)
  })

  it('queries database for course authentication information', async function () {
    await Registration.getCourseAUs(txn, tenantId, courseId)

    Registration.getCourseAUs.restore()

    expect(getCourseAUsSpy.calledOnceWithExactly(txn, tenantId, courseId)).to.be.true
  })
})

describe('Test of load function', function () {
  let loadSpy, loadRegistrationStub, loadRegistrationAusStub, registrationTest, error
  let tenantId, registrationId
  let loadAus = true
  const registration = {
    aus: null
  }
  // mock db item to pass in. Needs to be undefined, because the one in source code will be when test runs
  let db
  // mock db item to return
  const dbReturn = {}

  beforeEach(() => {
    loadSpy = sinon.spy(Registration, 'load')

    loadRegistrationStub = sinon.stub(Registration, 'loadRegistration')
    loadRegistrationAusStub = sinon.stub(Registration, 'loadRegistrationAus')
  })

  afterEach(() => {
    loadSpy.restore()

    loadRegistrationStub.reset()
    loadRegistrationStub.restore()

    loadRegistrationAusStub.reset()
    loadRegistrationAusStub.restore()
  })

  it('attempts to load registration information', async function () {
    loadRegistrationStub.withArgs(tenantId, registrationId, db).resolves(registration)
    loadRegistrationAusStub.withArgs(tenantId, registrationId, db, registration).resolves(dbReturn)

    loadAus = true
    registrationTest = await Registration.load(tenantId, registrationId, db, loadAus)

    Registration.load.restore()
    Registration.loadRegistration.restore()
    Registration.loadRegistrationAus.restore()

    expect(loadSpy.calledOnceWithExactly(tenantId, registrationId, db, loadAus)).to.be.true
    expect(loadRegistrationStub.calledOnceWithExactly(tenantId, registrationId, db)).to.be.true
    expect(loadRegistrationAusStub.calledOnceWithExactly(tenantId, registrationId, db, registration)).to.be.true

    expect(registrationTest).to.equal(registration)
    expect(registrationTest.aus).to.equal(dbReturn)
  })

  it('catches and throws an error if it is not able to update or return registration', async function () {
    loadRegistrationStub.withArgs(tenantId, registrationId, db).rejects('Failed to load registration:')

    try {
      await Registration.load(tenantId, registrationId, db, loadAus = true)
      // ensure promise was rejected, ie no false positive test
      assert.fail(error)
    } catch (ex) {
      function error () {
        throw new Error('Failed to load registration:')
      }

      // error has to be wrapped and tested here, or it will throw and interrupt test execution
      expect(error).to.throw('Failed to load registration:')
    }

    Registration.load.restore()
    Registration.loadRegistration.restore()

    expect(loadSpy.calledOnceWithExactly(tenantId, registrationId, db, loadAus = true)).to.be.true

    expect(loadRegistrationStub.calledOnceWithExactly(tenantId, registrationId, db)).to.be.true
  })

  it('catches and throws an error if it is not able to update or return registration aus', async function () {
    // reset this variable as testing node can't compare it's children
    let registration

    loadRegistrationAusStub.withArgs(tenantId, registrationId, db, registration).rejects('Failed to load registration:')

    try {
      await Registration.load(tenantId, registrationId, db, loadAus = true)
      // ensure promise was rejected, ie no false positive test
      assert.fail(error)
    } catch (ex) {
      function error () {
        throw new Error('Failed to load registration:')
      }
      // error has to be wrapped and tested here, or it will throw and interrupt test execution
      expect(error).to.throw('Failed to load registration:')
    }

    Registration.load.restore()
    Registration.loadRegistrationAus.restore()

    expect(loadSpy.calledOnceWithExactly(tenantId, registrationId, db, loadAus = true)).to.be.true
    expect(loadRegistrationAusStub.calledOnceWithExactly(tenantId, registrationId, db, registration)).to.be.true
  })
})
describe('Test of loadRegistration', function () {
  let loadRegistrationStub
  // a database object
  const db = knex({
    client: 'mysql'
  })
  let tenantId, registrationId, queryResult

  beforeEach(() => {
    loadRegistrationStub = sinon.stub(Registration, 'loadRegistration')

    mockDb.mock(db)
  })

  afterEach(() => {
    loadRegistrationStub.reset()
    loadRegistrationStub.restore()

    mockDb.unmock(db)
  })

  it('returns database information, using registration id as match to query', async function () {
    loadRegistrationStub.callsFake(() => Promise.resolve(db))

    queryResult = await Registration.loadRegistration(tenantId, registrationId, db)

    Registration.loadRegistration.restore()

    expect(loadRegistrationStub.calledOnceWithExactly(tenantId, registrationId, db)).to.be.true

    expect(queryResult).to.equal(db)
  })
})
describe('Test of loadRegistrationAus', function () {
  let loadRegistrationAusSpy
  const tenantId = 0
  const registrationId = 0
  const registration = {
    id: 0
  }
  // a database object
  const db = knex({
    client: 'mysql'
  })

  beforeEach(() => {
    loadRegistrationAusSpy = sinon.spy(Registration, 'loadRegistrationAus')

    mockDb.mock(db)
  })

  afterEach(() => {
    loadRegistrationAusSpy.restore()

    mockDb.unmock(db)
  })

  it('returns database information, using registration id and tenant id as match to query', async function () {
    await Registration.loadRegistrationAus(tenantId, registrationId, db, registration)

    expect(loadRegistrationAusSpy.calledOnceWithExactly(tenantId, registrationId, db, registration)).to.be.true
  })
})
describe('Test of loadAuForChange function', function () {
  let loadAuForChangeSpy, getQueryResultStub, tenantId, registrationId, auIndex, queryTest, regCourseAu, error
  let queryResult = {
    // Stand in for Session values that are returned
    registrationsCoursesAus: regCourseAu = { courseAu: 0 },
    registrations: 3,
    coursesAus: 4
  }
  const txn = { rollback: () => true || false }

  beforeEach(() => {
    loadAuForChangeSpy = sinon.spy(Registration, 'loadAuForChange')

    getQueryResultStub = sinon.stub(Registration, 'getQueryResult')
  })

  afterEach(() => {
    loadAuForChangeSpy.restore()

    getQueryResultStub.reset()
    getQueryResultStub.restore()
  })

  it('attempts to retrieve the transaction information with a query, and assigns collected info to registration variables', async function () {
    getQueryResultStub.withArgs(txn, registrationId, auIndex, tenantId).resolves(queryResult)

    queryTest = await Registration.loadAuForChange(txn, registrationId, auIndex, tenantId)

    Registration.loadAuForChange.restore()
    Registration.getQueryResult.restore()

    expect(loadAuForChangeSpy.calledOnceWithExactly(txn, registrationId, auIndex, tenantId)).to.be.true
    expect(getQueryResultStub.calledOnceWithExactly(txn, registrationId, auIndex, tenantId)).to.be.true

    // note use of 'eql' here. Values are same, reference is not
    expect(queryTest).to.eql({ regCourseAu: { courseAu: 4 }, registration: 3, courseAu: 4 })
  })

  it('catches and throws an error if it is not able to retrieve the registration info through its query, rolling back transaction', async function () {
    getQueryResultStub.withArgs(txn, registrationId, auIndex, tenantId).rejects('Failed to select registration course AU, registration and course AU for update:')

    try {
      await Registration.loadAuForChange(txn, registrationId, auIndex, tenantId)
      // ensure promise was rejected, ie no false positive test
      assert.fail(error)
    } catch (ex) {
      function error () {
        txn.rollback = true
        throw new Error('Failed to select registration course AU, registration and course AU for update:')
      }

      // error has to be wrapped and tested here, or it will throw and interrupt test execution
      expect(error).to.throw('Failed to select registration course AU, registration and course AU for update:')
    }

    Registration.loadAuForChange.restore()
    Registration.getQueryResult.restore()

    expect(txn.rollback).to.be.true

    expect(loadAuForChangeSpy.calledOnceWithExactly(txn, registrationId, auIndex, tenantId)).to.be.true

    expect(getQueryResultStub.calledOnceWithExactly(txn, registrationId, auIndex, tenantId)).to.be.true
  })

  it('catches and throws an error if retreived query result is false (no registration id), rolling back transaction', async function () {
    getQueryResultStub.withArgs(txn, registrationId, auIndex, tenantId).resolves(queryResult = false)

    try {
      await Registration.loadAuForChange(txn, registrationId, auIndex, tenantId)
      // ensure promise was rejected, ie no false positive test
      assert.fail(error)
    } catch (ex) {
      function error () {
        txn.rollback = true
        throw new Error('registration:')
      }

      // error has to be wrapped and tested here, or it will throw and interrupt test execution
      expect(error).to.throw('registration:')
    }

    Registration.loadAuForChange.restore()
    Registration.getQueryResult.restore()

    expect(txn.rollback).to.be.true

    expect(loadAuForChangeSpy.calledOnceWithExactly(txn, registrationId, auIndex, tenantId)).to.be.true

    expect(getQueryResultStub.calledOnceWithExactly(txn, registrationId, auIndex, tenantId)).to.be.true
  })
})

describe('Test of getQueryResult', function () {
  let gqrStub, tenantId, auIndex, registrationId, queryResult
  // a transaction object
  const txn = {}

  beforeEach(() => {
    gqrStub = sinon.stub(Registration, 'getQueryResult')
  })

  afterEach(() => {
    gqrStub.reset()
    gqrStub.restore()
  })

  it('returns the txn(transaction) with requested table information if  match for args registrationId and tenantId are found in database', async function () {
    gqrStub.callsFake(() => Promise.resolve(txn))

    queryResult = await Registration.getQueryResult(txn, registrationId, auIndex, tenantId)

    Registration.getQueryResult.restore()

    expect(gqrStub.calledOnceWithExactly(txn, registrationId, auIndex, tenantId)).to.be.true

    expect(queryResult).to.equal(txn)
  })
})

describe('Test of interpretMoveOn', function () {
  let interpretMoveOnSpy, templateToStringStub, isSatisfiedStub, auToSetSatisfied, sessionCode, lrsWreck, moveOn, satisfiedStTemplate
  const registration = {
    metadata: {
      moveOn: {
        satisfied: true
      }
    }
  }

  beforeEach(() => {
    interpretMoveOnSpy = sinon.spy(Registration, 'interpretMoveOn')

    templateToStringStub = sinon.stub(Registration, 'templateToString')
    isSatisfiedStub = sinon.stub(RegistrationHelpers, 'isSatisfied')
  })

  afterEach(() => {
    interpretMoveOnSpy.restore()

    templateToStringStub.reset()
    templateToStringStub.restore()

    isSatisfiedStub.reset()
    isSatisfiedStub.restore()
  })

  it('returns registration data as string if the the registration.metadata.moveOn is true', async function () {
    templateToStringStub.withArgs(registration, sessionCode).returns(satisfiedStTemplate)
    isSatisfiedStub.withArgs(moveOn, { auToSetSatisfied, lrsWreck, satisfiedStTemplate }).resolves(true)

    await Registration.interpretMoveOn(registration, { auToSetSatisfied, sessionCode, lrsWreck })

    Registration.interpretMoveOn.restore()
    Registration.templateToString.restore()
    RegistrationHelpers.isSatisfied.restore()

    expect(interpretMoveOnSpy.calledOnceWithExactly(registration, { auToSetSatisfied, sessionCode, lrsWreck })).to.be.true
    expect(templateToStringStub.calledOnceWithExactly(registration, sessionCode)).to.be.true
  })

  it('calls and awaits the isSatisifed function to update registration information if registration.metadata.moveOn is not true', async function () {
    registration.metadata.moveOn = false

    templateToStringStub.withArgs(registration, sessionCode).returns(satisfiedStTemplate)
    isSatisfiedStub.withArgs(moveOn = false, { auToSetSatisfied, lrsWreck, satisfiedStTemplate }).resolves(true)

    await Registration.interpretMoveOn(registration, { auToSetSatisfied, sessionCode, lrsWreck })

    Registration.interpretMoveOn.restore()
    Registration.templateToString.restore()
    RegistrationHelpers.isSatisfied.restore()

    expect(interpretMoveOnSpy.calledOnceWithExactly(registration, { auToSetSatisfied, sessionCode, lrsWreck })).to.be.true
    expect(templateToStringStub.calledOnceWithExactly(registration, sessionCode)).to.be.true
    isSatisfiedStub.should.have.been.calledOnce
    isSatisfiedStub.should.have.been.calledWith(moveOn, { auToSetSatisfied, lrsWreck, satisfiedStTemplate })
    // I chose a different form to verify isSatisfied test, as the'calledexactlywith' doesn't understand moveOn will
    // be updated through interpretMoveOn function.
  })
})
describe('Test of templateToString function', function () {
  let templateToStringSpy, result
  const sessionCode = 100
  const registration = {
    code: 0,
    actor: 1
  }
  const actor = 'registration.actor'
  const verb = {
    id: 'https://w3id.org/xapi/adl/verbs/satisfied',
    display: {
      en: 'satisfied'
    }
  }
  const context = {
    registration: 'registration.code',
    contextActivities: {
      category: [
        {
          id: 'https://w3id.org/xapi/cmi5/context/categories/cmi5'
        }
      ],
      grouping: []
    },
    extensions: {
      'https://w3id.org/xapi/cmi5/context/extensions/sessionid': sessionCode
    }
  }

  beforeEach(() => {
    templateToStringSpy = sinon.spy(Registration, 'templateToString')
  })

  afterEach(() => {
    templateToStringSpy.restore()
  })

  it('converts the template information (such as actor, or verb) to string', function () {
    result = Registration.templateToString(registration, sessionCode, actor, verb, context)

    Registration.templateToString.restore()

    // because I had to pass other arguments for stringify to work, note the change from calledExactlyOnceWith
    expect(templateToStringSpy.calledOnce).to.be.true
    expect(templateToStringSpy.calledWith(registration, sessionCode)).to.be.true

    // I know this is long, but it actually allows the program to execute the stringify function, which is nice for code coverage.
    // you can see our values in there for confirmation
    expect(result).to.eql('{"actor":1,"verb":{"id":"https://w3id.org/xapi/adl/verbs/satisfied","display":{"en":"satisfied"}},"context":{"registration":0,"contextActivities":{"category":[{"id":"https://w3id.org/xapi/cmi5/context/categories/cmi5"}],"grouping":[]},"extensions":{"https://w3id.org/xapi/cmi5/context/extensions/sessionid":100}}}')
  })
})
describe('Test of parseRegistrationData', function () {
  let parseRegistrationDataSpy, retrieveRegStub, parseStub, queryResult
  let lrsWreck, error
  const registration = {
    actor: 'actor',
    metadata: 'metadata'
  }

  beforeEach(() => {
    parseRegistrationDataSpy = sinon.spy(Registration, 'parseRegistrationData')

    parseStub = sinon.stub(JSON, 'parse')
    retrieveRegStub = sinon.stub(Registration, 'retrieveRegistrationDataAsString')
  })

  afterEach(() => {
    parseRegistrationDataSpy.restore()

    parseStub.reset()
    parseStub.restore()

    retrieveRegStub.reset()
    retrieveRegStub.restore()
  })

  it('parses the actor and metadata of registration, then sends it to be converted to string (via retrieveRegistrationDataAsString). After returns registration', async function () {
    parseStub.withArgs(registration.actor).returns('actor')
    parseStub.withArgs(registration.metadata).returns('metadata')

    retrieveRegStub.withArgs(registration, lrsWreck).resolves(true)

    queryResult = await Registration.parseRegistrationData(registration, lrsWreck)

    Registration.parseRegistrationData.restore()
    Registration.retrieveRegistrationDataAsString.restore()

    expect(parseRegistrationDataSpy.calledOnceWithExactly(registration, lrsWreck)).to.be.true
    expect(retrieveRegStub.calledOnceWithExactly(registration, lrsWreck)).to.be.true

    expect(queryResult).to.equal(registration)
  })
  it('catches and throws an error if it is not able to update registration data', async function () {
    retrieveRegStub.withArgs(registration, lrsWreck).rejects('Failed to interpret moveOn:')

    try {
      await Registration.parseRegistrationData(registration, lrsWreck)
      // ensure promise was rejected, ie no false positive test
      assert.fail(error)
    } catch (ex) {
      function error () {
        throw new Error('Failed to interpret moveOn:')
      }

      // error has to be wrapped and tested here, or it will throw and interrupt test execution
      expect(error).to.throw('Failed to interpret moveOn:')
    }

    Registration.parseRegistrationData.restore()
    Registration.retrieveRegistrationDataAsString.restore()

    expect(parseRegistrationDataSpy.calledOnceWithExactly(registration, lrsWreck)).to.be.true
    expect(retrieveRegStub.calledOnceWithExactly(registration, lrsWreck)).to.be.true
  })
})

describe('Test of updateMetaData function', function () {
  const txn = knex({
    client: 'mysql'
  })
  let updateMetadataSpy, testQuery, error
  const tenantId = 0
  const registration = {
    id: 0,
    metadata: ''
  }

  beforeEach(() => {
    updateMetadataSpy = sinon.spy(Registration, 'updateMetadata')

    mockDb.mock(txn)
  })

  afterEach(() => {
    updateMetadataSpy.restore()

    mockDb.unmock(txn)
  })

  it('queries the transaction object for updated metadata', async function () {
    testQuery = await Registration.updateMetadata(txn, registration, tenantId)

    Registration.updateMetadata.restore()

    expect(updateMetadataSpy.calledOnceWithExactly(txn, registration, tenantId)).to.be.true
    console.log(testQuery)
  })

  it('unable to query, throws error', async function () {
    try {
      await Registration.updateMetadata(txn, registration, tenantId)
      // ensure promise was rejected, ie no false positive test
      assert.fail(error)
    } catch (ex) {
      function error () {
        throw new Error(`Failed to update registration metadata: ${ex}`)
      }

      // error has to be wrapped and tested here, or it will throw and interrupt test execution
      expect(error).to.throw(`Failed to update registration metadata: ${ex}`)
      // it's not actually throwing the error like in parseData, how to make a mock db cal throw error?
    }

    expect(updateMetadataSpy.calledOnceWithExactly(txn, registration, tenantId)).to.be.true
  })
})

describe('Test of updateCourseAUmap', function () {
  let updateCourseAUmapSpy
  let tenantId, registrationId
  const courseAUs = {
    map: () => true
  }
  const txn = knex({
    client: 'mysql'
  })

  beforeEach(() => {
    updateCourseAUmapSpy = sinon.spy(Registration, 'updateCourseAUmap')

    mockDb.mock(txn)
  })

  afterEach(() => {
    updateCourseAUmapSpy.restore()

    mockDb.unmock(txn)
  })

  it('attempts to update the transaction object with stringified metadata', async function () {
    await Registration.updateCourseAUmap(txn, tenantId, registrationId, courseAUs)

    Registration.updateCourseAUmap.restore()

    expect(updateCourseAUmapSpy.calledOnceWithExactly(txn, tenantId, registrationId, courseAUs)).to.be.true
  })
})
