// Test file for courses.js
"use strict";

var expect = require("chai").expect;
var sinon = require("sinon");

var courses = require("../service/plugins/routes/v1/courses");
const Boom = require("@hapi/boom");
const StreamZip = require("node-stream-zip");

describe("buildPayload for courses.js", function() {
  it("Checks that the payload comes back with byte size and file output by default", function() {
    let payloadObj = courses.buildPayload();

    expect(payloadObj).to.haveOwnProperty("maxBytes");
    expect(payloadObj).to.haveOwnProperty("output");
  });

  it("Checks that the payload returns a Joi object when validating", function() {
    let args = { withValidate: true };

    let payloadObj = courses.buildPayload(args);

    let payloadLabel = payloadObj._flags.label;

    expect(payloadLabel).to.equal("Request-LaunchUrl");
  });
});

describe("getOptions for courses.js", function() {
  it("Checks that only tags are returned if no input is given", function() {
    let options = courses.getOptions();

    expect(options).to.eql({ tags: ["api"] });
  });

  it("Checks that a non-empty validate payload is returned when requested", function() {
    let args = { withPayload: true, withValidate: true };
    let options = courses.getOptions(args);

    expect(options).to.have.property("validate");
    expect(options.validate).is.not.empty;
  });

  it("Checks that a payload and an ext method are returned when requested", function() {
    let args = { withPayload: true, withExt: true };
    let options = courses.getOptions(args);

    expect(options).to.have.property("payload");
    expect(options).to.have.property("ext");
  });
});

describe("Database functions in courses.js", function() {
  let tenantDb = {
    first: function() {
      return {
        from: function() {
          return {
            where: function() {
              return {};
            },
          };
        },
      };
    },
    insert: function() {
      return ["1234"];
    },
    where: function() {
      return {
        delete: function() {
          return null;
        },
      };
    },
  };
  let app = {
    db: function() {
      return tenantDb;
    },
    jwt: {
      audPrefix: "abc",
      iss: "1234",
      tokenSecret: "BigSecret",
    },
  };

  let db = {};
  let tenantId = "tenantId";
  let courseId = "1234";
  let course = {};

  let req = {
    auth: {
      credentials: {
        tenantId: tenantId,
      },
    },
    headers: {
      "content-type": "text/xml",
    },
    params: {
      id: "1234",
    },
    payload: {
      path: "Test",
    },
    server: {
      app: app,
    },
  };
  let h;

  afterEach(function() {
    sinon.restore();
  });

  it("handlePostCourse collects course information, posts it to the database, and confirms its existence", async function() {
    let handlePostCourseSpy = sinon.spy(courses, "handlePostCourse");

    let test = courses.handlePostCourse(req, h);
    console.log(test);

    expect(handlePostCourseSpy.calledOnceWithExactly(req, h)).to.be.true;
    expect(test).to.eql({});
  });

  it("selectCourse returns a course from the database", async function() {
    let selectCourseStub = sinon.stub(courses, "selectCourse");
    selectCourseStub.withArgs(db, tenantId, courseId).resolves(course);

    let test = await courses.selectCourse(db, tenantId, courseId);

    expect(selectCourseStub.calledOnceWithExactly(db, tenantId, courseId)).to.be
      .true;
    expect(selectCourseStub).to.not.throw();
    expect(test).to.eql(course);
  });

  it("selectCourse throws if course does not exist in the database", async function() {
    let selectCourseStub = sinon.stub(courses, "selectCourse");
    selectCourseStub
      .withArgs(db, tenantId, courseId)
      .rejects(Boom.notFound(`Unrecognized course: ${courseId} (${tenantId})`));

    try {
      await courses.selectCourse(db, tenantId, courseId);
      assert.fail(error);
    } catch (ex) {
      function error() {
        throw Boom.notFound(`Unrecognized course: ${courseId} (${tenantId})`);
      }

      expect(error).to.throw(`Unrecognized course`);
    }

    expect(selectCourseStub.calledOnceWithExactly(db, tenantId, courseId)).to.be
      .true;
  });

  it("deleteCourse returns null if successful", async function() {
    let deleteCourseStub = sinon.stub(courses, "deleteCourse");
    deleteCourseStub.withArgs(db, tenantId, courseId).returns(null);

    let test = await courses.deleteCourse(db, tenantId, courseId);

    expect(deleteCourseStub.calledOnceWithExactly(db, tenantId, courseId)).to.be
      .true;
    expect(deleteCourseStub).to.not.throw();
    expect(test).to.eql(null);
  });

  it("deleteCourse throws if course does not exist in the database", async function() {
    let deleteCourseStub = sinon.stub(courses, "deleteCourse");
    deleteCourseStub
      .withArgs(db, tenantId, courseId)
      .rejects(Boom.internal(`Failed to delete course (${courseId}): Error`));

    try {
      await courses.deleteCourse(db, tenantId, courseId);
      assert.fail(error);
    } catch (ex) {
      function error() {
        throw new Boom.internal(`Failed to delete course (${courseId}): ${ex}`);
      }

      expect(error).to.throw(`Failed to delete course`);
    }

    expect(deleteCourseStub.calledOnceWithExactly(db, tenantId, courseId)).to.be
      .true;
  });
});

describe("Helper functions for courses.js", function() {
  let xmlValid = "<a/>";
  let documentValid = {
    validate: function() {
      return true;
    },
  };
  let documentInvalid = {
    validate: function() {
      throw new Error();
    },
  };
  let zip = new StreamZip.async({
    file: "/home/jbmartin/Desktop/catapult/test/example.zip",
  });

  afterEach(function() {
    sinon.restore();
  });

  it("getCourseStructureDocument returns a document if input is valid", async function() {
    let getCourseStructureDocumentSpy = sinon.spy(
      courses,
      "getCourseStructureDocument"
    );

    let test = await courses.getCourseStructureDocument(xmlValid);

    expect(getCourseStructureDocumentSpy).to.be.calledOnce;
    expect(getCourseStructureDocumentSpy).to.not.throw();
    expect(test).to.not.be.empty;
  });

  it("getValidationResult returns true if input is valid", async function() {
    let getValidationResultSpy = sinon.spy(courses, "getValidationResult");

    let test = await courses.getValidationResult(documentValid);

    expect(getValidationResultSpy).to.be.calledOnce;
    expect(getValidationResultSpy).to.not.throw();
    expect(test).to.eql(true);
  });

  it("getValidationResult throws if input is invalid", async function() {
    let getValidationResultSpy = sinon.spy(courses, "getValidationResult");

    try {
      await courses.getValidationResult(documentInvalid);
      assert.fail(error);
    } catch (ex) {
      function error() {
        throw Boom.internal(
          `Failed to validate course structure against schema: ${ex}`
        );
      }

      expect(error).to.throw(`Failed to validate course structure`);
    }

    expect(getValidationResultSpy).to.be.calledOnce;
  });

  it.skip("storeCourseContent doesn't throw if all input is valid (isZip is true)", async function() {
    let storeCourseContentSpy = sinon.spy(courses, "storeCourseContent");

    let test = await courses.storeCourseContent(
      true,
      zip,
      "/home/jbmartin/Desktop/catapult/test/course",
      ""
    );

    expect(test).to.eql(null);
  });
});

describe("Validation functions for courses.js", function() {
  // Begin inits.
  // Mocking several inputs and functions to ensure code can execute.
  let element = {
    attr: function() {
      return {
        value: function() {
          return "https://example.com";
        },
      };
    },
    childNodes: function() {
      return [];
    },
    get: function() {
      return {
        text: function() {
          return "";
        },
      };
    },
    test: true,
  };
  let lmsIdHelper = {
    auIndex: 0,
    prefix: "prefix",
  };
  let objectiveMap = {
    test: true,
  };
  let duplicateCheck = {
    aus: {
      "https://example.com": false,
    },
    blocks: {
      "https://example.com": false,
    },
  };
  let parents = {
    map: function() {
      return {};
    },
    pop: function() {
      return {};
    },
    push: function() {
      return {};
    },
  };
  let document = {
    root: function() {
      return {
        childNodes: function() {
          return [];
        },
        get: function() {
          return {
            attr: function() {
              return {
                value: function() {
                  return "https://example.com";
                },
              };
            },
            childNodes: function() {
              return [];
            },
            get: function() {
              return {};
            },
            test: true,
          };
        },
        test: true,
      };
    },
  };
  let lmsId = "1234";
  // End inits.

  it("validateIRI returns true with valid input", function() {
    let validateIRISpy = sinon.spy(courses, "validateIRI");

    let test = courses.validateIRI("https://example.com");

    expect(validateIRISpy.calledOnceWithExactly("https://example.com")).to.be
      .true;
    expect(test).to.eql(true);
  });

  it("validateAU returns result with valid input", function() {
    let validateAUSpy = sinon.spy(courses, "validateAU");

    let test = courses.validateAU(
      element,
      lmsIdHelper,
      objectiveMap,
      duplicateCheck,
      parents
    );

    expect(validateAUSpy).to.be.calledOnce;
    expect(test).to.not.be.empty;
  });

  it("validateBlock returns result with valid input", function() {
    let validateBlockSpy = sinon.spy(courses, "validateBlock");

    let test = courses.validateBlock(
      element,
      lmsIdHelper,
      objectiveMap,
      duplicateCheck,
      parents
    );

    expect(validateBlockSpy).to.be.calledOnce;
    expect(test).to.not.be.empty;
  });

  it("validateAndReduceStructure returns result with valid input", function() {
    let validateAndReduceStructureSpy = sinon.spy(
      courses,
      "validateAndReduceStructure"
    );

    let test = courses.validateAndReduceStructure(document, lmsId);

    expect(validateAndReduceStructureSpy).to.be.calledOnce;
    expect(test).to.not.be.empty;
  });
});
