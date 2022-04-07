// Test file for mgmt.js
"use strict";

var expect = require("chai").expect;
var mgmt = require("../service/plugins/routes/v1/mgmt");

describe("buildPayloadTest", function() {
  it("Checks that the Joi object requests a tenant by default", function() {
    var payloadObj = mgmt.buildPayload();
    var payloadLabel = payloadObj.payload._flags.label;

    expect(payloadLabel).to.equal("Request-Tenant");
  });

  it("Checks that the Joi object requests an auth token when prompted", function() {
    var args = { requestAuth: true };

    var payloadObj = mgmt.buildPayload(args);
    var payloadLabel = payloadObj.payload._flags.label;

    expect(payloadLabel).to.equal("Request-Auth");
  });
});

describe("getOptionsTest", function() {
  it("Checks that only tags are returned if no input is given", function() {
    var options = mgmt.getOptions();

    expect(options).to.eql({ tags: ["api"] });
  });

  it("Checks that auth info is returned with tags if requested", function() {
    var args = { withAuth: true };
    var options = mgmt.getOptions(args);

    expect(options).to.eql({ auth: "basic", tags: ["api"] });
  });
});
