// Test file for mgmt.js
"use strict";

var chai = require("chai");
var expect = require("chai").expect;
var sinon = require("sinon");
var sinonChai = require("sinon-chai");

chai.use(sinonChai);
chai.should();

var mgmt = require("../service/plugins/routes/v1/mgmt");
const Boom = require("@hapi/boom");

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

describe("Database functions of mgmt.js", function() {
  let code = "code";
  let tenant = {
    code: code,
    id: "1234",
  };
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
  let tenantId = "tenantId";
  let req = {
    params: {
      id: "1234",
    },
    payload: {
      code: code,
    },
    server: {
      app: app,
    },
  };
  let h;

  afterEach(function() {
    sinon.restore();
  });

  it("handleTenantCreate returns tenant with valid input", async function() {
    let handleTenantCreateSpy = sinon.spy(mgmt, "handleTenantCreate");

    let test = await mgmt.handleTenantCreate(req, h);

    expect(handleTenantCreateSpy.calledOnceWithExactly(req, h)).to.be.true;
    expect(handleTenantCreateSpy).to.not.throw();
    expect(test).to.eql(tenant);
  });

  it("createTenant returns tenant with valid input", async function() {
    let createTenantStub = sinon.stub(mgmt, "createTenant");
    createTenantStub.withArgs(app, code).resolves(tenant);

    let test = await mgmt.createTenant(app, code);

    expect(createTenantStub.calledOnceWithExactly(app, code)).to.be.true;
    expect(createTenantStub).to.not.throw();
    expect(test).to.eql(tenant);
  });

  it("tryCreateTenant throws if insert fails", async function() {
    let tryCreateTenantStub = sinon.stub(mgmt, "tryCreateTenant");
    tryCreateTenantStub
      .withArgs(app, code)
      .rejects(Boom.internal(`Failed to insert tenant: Error`));

    try {
      await mgmt.tryCreateTenant(app, code);
      assert.fail(error);
    } catch (ex) {
      function error() {
        throw Boom.internal(`Failed to insert tenant: ${ex}`);
      }

      expect(error).to.throw(`Failed to insert`);
    }

    expect(tryCreateTenantStub.calledOnceWithExactly(app, code)).to.be.true;
  });

  it("handleTenantDelete returns tenant with valid input", async function() {
    let handleTenantDeleteSpy = sinon.spy(mgmt, "handleTenantDelete");

    let test = await mgmt.handleTenantDelete(req, h);

    expect(handleTenantDeleteSpy.calledOnceWithExactly(req, h)).to.be.true;
    expect(handleTenantDeleteSpy).to.not.throw();
    expect(test).to.eql(null);
  });

  it("deleteTenant returns null with valid input", async function() {
    let deleteTenantStub = sinon.stub(mgmt, "deleteTenant");
    deleteTenantStub.withArgs(app, tenantId).returns(null);

    let test = await mgmt.deleteTenant(app, tenantId);

    expect(deleteTenantStub.calledOnceWithExactly(app, tenantId)).to.be.true;
    expect(deleteTenantStub).to.not.throw();
    expect(test).to.eql(null);
  });

  it("tryDeleteTenant throws if input is invalid", async function() {
    let tryDeleteTenantStub = sinon.stub(mgmt, "tryDeleteTenant");
    tryDeleteTenantStub
      .withArgs(app, tenantId)
      .rejects(Boom.internal(`Failed to delete tenant (${tenantId}): Error`));

    try {
      await mgmt.tryDeleteTenant(app, tenantId);
      assert.fail(error);
    } catch (ex) {
      function error() {
        throw Boom.internal(`Failed to delete tenant (${tenantId}): ${ex}`);
      }

      expect(error).to.throw(`Failed to delete`);
    }

    expect(tryDeleteTenantStub.calledOnceWithExactly(app, tenantId)).to.be.true;
  });

  it("handleAuthToken returns a token with valid input", async function() {
    let handleAuthTokenSpy = sinon.spy(mgmt, "handleAuthToken");

    let test = await mgmt.handleAuthToken(req, h);

    expect(handleAuthTokenSpy.calledOnceWithExactly(req, h)).to.be.true;
    expect(handleAuthTokenSpy).to.not.throw();
  });
});
