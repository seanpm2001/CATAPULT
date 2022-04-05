// Test file for mgmt.js
"use strict";

var expect = require("chai").expect;
var sinon = require("sinon");
var proxyquire = require("proxyquire");

var sessions = require("../service/plugins/routes/v1/sessions");
var Session = require("../service/plugins/routes/lib/session");
var Wreck = require("@hapi/wreck");

describe("handleSessionTest", function() {
  let req, h;

  beforeEach(async () => {
    req = {
      auth: {
        credentials: {
          tenantId: 1,
        },
      },
      params: {
        id: 1,
      },
      server: {
        app: {},
      },
    };
    h = null;

    req.server.app.db = null;
    req.server.methods = {};
    // req.server.app.db = await require("../service/lib/db")();
  });

  afterEach(() => {
    sinon.restore();
  });

  it("Checks that the session is loading", async function() {
    var sessionSpy = sinon.stub(Session, "load");
    var sessionResult = await sessions.handleSession(req, h);

    expect(sessionSpy.called).to.be.true;
  });

  it.skip("Checks that the session is being abandoned if prompted", async function() {
    var sessionSpy = sinon.stub(Session, "abandon");
    var sessionResult = await sessions.handleSession(req, h, {
      doAbandon: true,
    });

    expect(sessionSpy.called).to.be.true;
  });
});
