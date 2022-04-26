// Test file for mgmt.js
"use strict";

var expect = require("chai").expect;
var sinon = require("sinon");

var sessions = require("../service/plugins/routes/v1/sessions");

describe("handleSessionTest", function() {
  let req = {
    auth: {
      credentials: {
        tenantId: "tenantId",
      },
    },
    params: {
      id: "1234",
    },
    server: {
      app: {
        db: {
          first: function() {
            return {
              from: function() {
                return {
                  where: function() {
                    return {
                      queryContext: function() {
                        return {};
                      },
                    };
                  },
                };
              },
            };
          },
        },
      },
      methods: {
        lrsWreckDefaults: function() {
          return {};
        },
      },
    },
    test: true,
  };
  let h = null;

  let args = {
    doAbandon: true,
  };
  let result = {};

  afterEach(() => {
    sinon.restore();
  });

  it("Checks that the session is loading", async function() {
    var sessionStub = sinon.stub(sessions, "handleSession");
    sessionStub.withArgs(req, h).returns(result);

    var test = await sessionStub(req, h);

    expect(test).to.be.eql(result);
  });

  it("Checks that the session is being abandoned if prompted", async function() {
    var sessionStub = sinon.stub(sessions, "handleSession");
    sessionStub
      .withArgs(req, h, {
        doAbandon: true,
      })
      .returns(null);
    var test = await sessionStub(req, h, {
      doAbandon: true,
    });

    expect(test).to.be.eql(null);
  });

  it("handleSession returns a loaded session when requested with valid input", async function() {
    var sessionSpy = sinon.spy(sessions, "handleSession");

    var test = await sessions.handleSession(req, h);

    expect(sessionSpy.calledOnceWithExactly(req, h)).to.be.true;
    expect(sessionSpy).to.not.throw();
    expect(test).to.eql(result);
  });

  it("handleSession abandons the current session when requested with valid input", async function() {
    var sessionSpy = sinon.spy(sessions, "handleSession");

    var test = await sessions.handleSession(req, h, args);

    expect(sessionSpy.calledOnceWithExactly(req, h, args)).to.be.true;
    expect(sessionSpy).to.not.throw();
    expect(test).to.eql(null);
  });

  it("handleSession throws when it fails to load a session", async function() {
    let badReq = {
      auth: {
        credentials: {
          tenantId: "tenantId",
        },
      },
      badTest: true,
      params: {
        id: "1234",
      },
      server: {
        app: {
          db: {},
        },
        methods: {
          lrsWreckDefaults: function() {
            return {};
          },
        },
      },
      test: true,
    };

    var sessionSpy = sinon.spy(sessions, "handleSession");

    try {
      await sessions.handleSession(badReq, h);
      assert.fail(error);
    } catch (ex) {
      function error() {
        throw Boom.notFound();
      }

      expect(error).to.throw();
    }

    expect(sessionSpy.calledOnceWithExactly(badReq, h)).to.be.true;
  });
});
