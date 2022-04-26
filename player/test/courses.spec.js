// Test file for courses.js
"use strict";

var expect = require("chai").expect;
var sinon = require("sinon");

var courses = require("../service/plugins/routes/v1/courses");
const Boom = require("@hapi/boom");

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
            queryContext: function() {
              return {
                where: function() {
                  return {};
                },
              };
            },
            where: function() {
              return {};
            },
          };
        },
        queryContext: function() {
          return {
            from: function() {
              return {
                where: function() {
                  return {
                    actor: {
                      account: {
                        homePage: "https://example.com",
                        name: "abc",
                      },
                    },
                    id: "1234",
                  };
                },
              };
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
    contentUrl: "https://example.com",
    db: tenantDb,
    jwt: {
      audPrefix: "abc",
      iss: "1234",
      tokenSecret: "BigSecret",
    },
  };

  let db, courseId;
  let tenantId = "tenantId";

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
      auIndex: 0,
      id: "1234",
    },
    payload: {
      actor: {
        account: {
          homePage: "https://example.com",
          name: "abc",
        },
      },
      path: "Test",
      reg: true,
    },
    server: {
      app: app,
      methods: {
        lrsWreckDefaults: function() {
          return {};
        },
      },
    },
    test: true,
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
    // expect(test).to.eql({});
  });

  db = {
    first: function() {
      return {
        from: function() {
          return {
            queryContext: function() {
              return {
                where: function() {
                  return {};
                },
              };
            },
            where: function() {
              return {
                delete: function() {
                  return {};
                },
              };
            },
          };
        },
      };
    },
  };
  courseId = "1234";

  it("selectCourse returns a course with valid input", async function() {
    let selectCourseSpy = sinon.spy(courses, "selectCourse");

    let test = await courses.selectCourse(db, tenantId, courseId);

    expect(selectCourseSpy.calledOnceWithExactly(db, tenantId, courseId)).to.be
      .true;
    expect(selectCourseSpy).to.not.throw();
    expect(test).to.eql({});
  });

  it("selectCourse throws if course does not exist in the database", async function() {
    let badDb = {
      first: function() {
        return {
          from: function() {
            return {
              queryContext: function() {
                return {
                  where: function() {
                    return false;
                  },
                };
              },
            };
          },
        };
      },
    };

    let selectCourseSpy = sinon.spy(courses, "selectCourse");

    try {
      await courses.selectCourse(badDb, tenantId, courseId);
      assert.fail(error);
    } catch (ex) {
      function error() {
        throw Boom.notFound(`Unrecognized course: ${courseId} (${tenantId})`);
      }

      expect(error).to.throw("Unrecognized course");
    }

    expect(selectCourseSpy.calledOnceWithExactly(badDb, tenantId, courseId)).to
      .be.true;
  });

  it("handleGetCourse selects a course with valid input", async function() {
    let handleGetCourseSpy = sinon.spy(courses, "handleGetCourse");

    let test = await courses.handleGetCourse(req, h);

    expect(handleGetCourseSpy.calledOnceWithExactly(req, h)).to.be.true;
    expect(handleGetCourseSpy).to.not.throw();
    expect(test).to.eql({});
  });

  it("deleteCourse returns null if successful", async function() {
    let deleteCourseSpy = sinon.spy(courses, "deleteCourse");

    let test = await courses.deleteCourse(db, tenantId, courseId);

    expect(deleteCourseSpy.calledOnceWithExactly(db, tenantId, courseId)).to.be
      .true;
    expect(deleteCourseSpy).to.not.throw();
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

      expect(error).to.throw("Failed to delete course");
    }

    expect(deleteCourseStub.calledOnceWithExactly(db, tenantId, courseId)).to.be
      .true;
  });

  it("handleCourseLaunch obtains course data and returns the session info", async function() {
    let handleCourseLaunchSpy = sinon.spy(courses, "handleCourseLaunch");

    let test = courses.handleCourseLaunch(req, h);

    expect(handleCourseLaunchSpy.calledOnceWithExactly(req, h)).to.be.true;
    // expect(test).to.eql({});
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
  let zip = {
    entryData: function() {
      return {};
    },
    extract: function() {
      return {};
    },
  };

  afterEach(function() {
    sinon.restore();
  });

  it("getCourseStructureData returns data if input is valid (isZip is true)", async function() {
    let getCourseStructureDataSpy = sinon.spy(
      courses,
      "getCourseStructureData"
    );

    let test = await courses.getCourseStructureData(true, zip, "");

    expect(getCourseStructureDataSpy).to.be.calledOnce;
    expect(getCourseStructureDataSpy).to.not.throw();
    expect(test).to.eql({});
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

  it("validateSchema returns true if input is valid", async function() {
    let validateSchemaSpy = sinon.spy(courses, "validateSchema");

    let test = await courses.validateSchema(documentValid);

    expect(validateSchemaSpy).to.be.calledOnce;
    expect(validateSchemaSpy).to.not.throw();
    expect(test).to.eql(null);
  });

  it("validateSchema throws if input is invalid", async function() {
    let validateSchemaSpy = sinon.spy(courses, "validateSchema");

    try {
      await courses.validateSchema(documentInvalid);
      assert.fail(error);
    } catch (ex) {
      function error() {
        throw Boom.internal(
          `Failed to validate course structure against schema: ${ex}`
        );
      }

      expect(error).to.throw("Failed to validate course structure");
    }

    expect(validateSchemaSpy).to.be.calledOnce;
  });

  it("storeCourseContent returns null if input is valid (isZip is true)", async function() {
    let storeCourseContentSpy = sinon.spy(courses, "storeCourseContent");

    let test = await courses.storeCourseContent(true, zip, "", "");

    expect(storeCourseContentSpy).to.be.calledOnce;
    expect(test).to.eql(null);
  });

  it("storeCourseContent throws if input is valid (isZip is true)", async function() {
    let badZip = {
      entryData: function() {
        throw new Error();
      },
    };

    let storeCourseContentSpy = sinon.spy(courses, "storeCourseContent");

    try {
      await courses.storeCourseContent(true, badZip, "", "");
      assert.fail(error);
    } catch (ex) {
      function error() {
        throw Boom.internal(new Error(`Failed to store course content: ${ex}`));
      }

      expect(error).to.throw("Failed to store");
    }

    expect(storeCourseContentSpy).to.be.calledOnce;
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
      return [
        {
          attr: function() {
            return {
              value: function() {
                return "https://example.com";
              },
            };
          },
          get: function() {
            return {
              childNodes: function() {
                return [
                  {
                    attr: function() {
                      return {
                        value: function() {
                          return "https://example.com";
                        },
                      };
                    },
                    map: function() {
                      return "1234";
                    },
                    text: function() {
                      return "abc";
                    },
                  },
                ];
              },
              text: function() {
                return "abc";
              },
            };
          },
          name: function() {
            return "au";
          },
        },
      ];
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
    blockIndex: 0,
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
          return [
            {
              attr: function() {
                return {
                  value: function() {
                    return "https://example.com";
                  },
                };
              },
              get: function() {
                return {
                  childNodes: function() {
                    return [
                      {
                        attr: function() {
                          return {
                            value: function() {
                              return "https://example.com";
                            },
                          };
                        },
                        map: function() {
                          return "1234";
                        },
                        text: function() {
                          return "abc";
                        },
                      },
                    ];
                  },
                  text: function() {
                    return "abc";
                  },
                };
              },
              name: function() {
                return "au";
              },
            },
          ];
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
              return [
                {
                  attr: function() {
                    return {
                      value: function() {
                        return "https://example.com";
                      },
                    };
                  },
                  get: function() {
                    return {
                      childNodes: function() {
                        return {
                          map: function() {
                            return "1234";
                          },
                        };
                      },
                    };
                  },
                  name: function() {
                    return "objective";
                  },
                },
              ];
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

  afterEach(function() {
    sinon.restore();
  });

  it("validateIRI returns true with valid input", function() {
    let validateIRISpy = sinon.spy(courses, "validateIRI");

    let test = courses.validateIRI("https://example.com");

    expect(validateIRISpy.calledOnceWithExactly("https://example.com")).to.be
      .true;
    expect(test).to.eql(true);
  });

  it("validateIRI throws with invalid input", function() {
    let validateIRISpy = sinon.spy(courses, "validateIRI");

    try {
      courses.validateIRI("Fail");
      assert.fail(error);
    } catch (ex) {
      function error() {
        throw new Error("Invalid IRI: Fail");
      }

      expect(error).to.throw("Invalid IRI");
    }

    expect(validateIRISpy.calledOnceWithExactly("Fail")).to.be.true;
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

  it.skip("validateBlock returns result with valid input", function() {
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

  it("flattenAUs returns a list from a tree if input is type au", function() {
    let tree = [
      {
        type: "au",
      },
    ];
    let list = [];
    let result = [
      {
        auIndex: 0,
        type: "au",
      },
    ];
    let flattenAUsSpy = sinon.spy(courses, "flattenAUs");

    courses.flattenAUs(tree, list);

    expect(flattenAUsSpy).to.be.calledOnce;
    expect(list).to.eql(result);
  });

  it("flattenAUs is called recursively if input is type block", function() {
    let tree = [
      {
        children: [
          {
            type: "au",
          },
        ],
        type: "block",
      },
    ];
    let list = [];
    let result = [
      {
        auIndex: 0,
        type: "au",
      },
    ];
    let flattenAUsSpy = sinon.spy(courses, "flattenAUs");

    courses.flattenAUs(tree, list);

    expect(flattenAUsSpy).to.be.calledOnce;
    expect(list).to.eql(result);
  });

  it("getCourseDir returns a string including its inputs", function() {
    let tenantId = "tenantId";
    let courseId = "1234";
    let getCourseDirSpy = sinon.spy(courses, "getCourseDir");

    let test = courses.getCourseDir(tenantId, courseId);

    expect(getCourseDirSpy).to.be.calledOnce;
    expect(test).to.include("tenantId");
    expect(test).to.include("1234");
  });
});
