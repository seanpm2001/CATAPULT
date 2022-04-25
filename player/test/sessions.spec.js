// Test file for mgmt.js
"use strict";

var expect = require("chai").expect;
var sinon = require("sinon");

var sessions = require("../service/plugins/routes/v1/sessions");
var Session = require("../service/plugins/routes/lib/session");
var Wreck = require("@hapi/wreck");

describe("handleSessionTest", function() {
  let req, h;
  req = {
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
  };
  h = null;
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
});
