// Test file for mgmt.js
"use strict";

var expect = require("chai").expect;
var sinon = require("sinon");

var sessions = require("../service/plugins/routes/v1/sessions");
var Session = require("../service/plugins/routes/lib/session");
var Wreck = require("@hapi/wreck");

describe("handleSessionTest", function() {
  let req, h;
  let result = {};

  beforeEach(async () => {
    req = {};
    h = null;
  });

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
});
