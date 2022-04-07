// Test file for courses.js
"use strict";

var expect = require("chai").expect;
var sinon = require("sinon");

var courses = require("../service/plugins/routes/v1/courses");

describe("buildPayload for courses.js", function() {
  it("Checks that the payload comes back with byte size and file output by default", function() {
    var payloadObj = courses.buildPayload();

    expect(payloadObj).to.haveOwnProperty("maxBytes");
  });

  it("Checks that the payload returns a Joi object when validating", function() {
    var args = { withValidate: true };

    var payloadObj = courses.buildPayload(args);
    var payloadLabel = payloadObj._flags.label;

    expect(payloadLabel).to.equal("Request-LaunchUrl");
  });
});

describe("getOptions for courses.js", function() {
  it("Checks that only tags are returned if no input is given", function() {
    var options = courses.getOptions();

    expect(options).to.eql({ tags: ["api"] });
  });

  it.skip("Checks that auth info is returned with tags if requested", function() {
    var args = { withAuth: true };
    var options = courses.getOptions(args);

    expect(options).to.eql({ auth: "basic", tags: ["api"] });
  });
});
