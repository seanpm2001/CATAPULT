// Test file for courses.js
"use strict";

var expect = require("chai").expect;
var sinon = require("sinon");

var courses = require("../service/plugins/routes/v1/courses");

describe("buildPayload for courses.js", function() {
  it("Checks that the payload comes back with byte size and file output by default", function() {
    var payloadObj = courses.buildPayload();

    expect(payloadObj).to.haveOwnProperty("maxBytes");
    expect(payloadObj).to.haveOwnProperty("output");
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

  it("Checks that a non-empty validate payload is returned when requested", function() {
    var args = { withPayload: true, withValidate: true };
    var options = courses.getOptions(args);

    expect(options).to.have.property("validate");
    expect(options.validate).is.not.empty;
  });

  it("Checks that a payload and an ext method are returned when requested", function() {
    var args = { withPayload: true, withExt: true };
    var options = courses.getOptions(args);

    expect(options).to.have.property("payload");
    expect(options).to.have.property("ext");
  });
});

describe("handlePostCourse for courses.js", function() {});
