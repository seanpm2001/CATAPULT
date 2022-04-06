/*
    Copyright 2021 Rustici Software

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/
"use strict";

const Joi = require("joi");
const Boom = require("@hapi/boom");
const Jwt = require("@hapi/jwt");
const { v4: uuidv4 } = require("uuid");

function getOptions(args) {
  var optionsOut = { tags: ["api"] };

<<<<<<< Updated upstream
  if (args && args.withAuth) optionsOut.auth = "basic";
  if (args && args.withValidate) optionsOut.validate = buildPayload(args);
=======
  if (args.withAuth) optionsOut.auth = "basic";
  if (args.withValidate) optionsOut.validate = buildPayload(args.requestAuth);
>>>>>>> Stashed changes

  return optionsOut;
}

<<<<<<< Updated upstream
function buildPayload(args) {
  var payloadOut = {};
  var payloadObj;

  if (args && args.requestAuth)
=======
function buildPayload(requestAuth) {
  var payloadOut = {};
  var payloadObj;

  if (requestAuth)
>>>>>>> Stashed changes
    payloadObj = Joi.object({
      tenantId: Joi.number().required(),
      audience: Joi.string().required(),
    })
      .required()
      .label("Request-Auth");
  else
    payloadObj = Joi.object({
      code: Joi.string().required(),
    })
      .required()
      .label("Request-Tenant");

  payloadOut.payload = payloadObj;

  return payloadOut;
}

async function handleTenantCreate(req, h) {
  let app = req.server.app;
  let code = req.payload.code;

  return await tryCreateTenant(app, code);
}

async function tryCreateTenant(app, code) {
  try {
    return await createTenant(app, code);
  } catch (ex) {
    // TODO: Could check what message is returned
    // and provide 409 when tenant already exists.
    throw Boom.internal(`Failed to insert tenant: ${ex}`);
  }
}

async function createTenant(app, code) {
  let tenant = { code: code };
  let tenantDb = await app.db("tenants");
  let insertResult = await tenantDb.insert(tenant);

  tenant.id = insertResult[0];

  return tenant;
}

async function handleTenantDelete(req, h) {
  let app = req.server.app;
  let tenantId = req.params.id;

  return await tryDeleteTenant(app, tenantId);
}

async function tryDeleteTenant(app, tenantId) {
  try {
    return await deleteTenant(app, tenantId);
  } catch (ex) {
    throw new Boom.internal(`Failed to delete tenant (${tenantId}): ${ex}`);
  }
}

async function deleteTenant(app, tenantId) {
  let tenantDb = await app.db("tenants");
  let deleteResult = await tenantDb.where({ id: tenantId }).delete();

  return null;
}

async function handleAuthToken(req, h) {
  let app = req.server.app;
  let tenantId = req.params.id;
  let audience = req.payload.audience;

  let queryResult = await tryGetTenant(app, tenantId);

  if (!queryResult) {
    throw Boom.notFound(`Unknown tenant: ${tenantId}`);
  }

  return generateToken(app, audience, tenantId);
}

async function tryGetTenant(app, tenantId) {
  try {
    return await getTenant(app, tenantId);
  } catch (ex) {
    throw Boom.internal(`Failed to select to confirm tenant: ${ex}`);
  }
}

async function getTenant(app, tenantId) {
  let tenant = await app
    .first("id")
    .from("tenants")
    .where({ id: tenantId });

  return tenant;
}

function generateToken(app, audience, tenantId) {
  const token = Jwt.token.generate(
    {
      iss: app.jwt.iss,
      aud: `${app.jwt.audPrefix}${audience}`,
      sub: tenantId,
      jti: uuidv4(),
    },
    app.jwt.tokenSecret
  );

  return { token };
}

module.exports = {
<<<<<<< Updated upstream
  getOptions,
  buildPayload,
=======
>>>>>>> Stashed changes
  name: "catapult-player-api-routes-v1-mgmt",
  register: (server, options) => {
    server.route([
      {
        method: "GET",
        path: "/ping",
        options: getOptions(),
        handler: (req, h) => ({
          ok: true,
        }),
      },
      {
        method: "GET",
        path: "/about",
        options: getOptions(),
        handler: (req, h) => ({
          tenantId: req.auth.credentials.tenantId,
          description: "catapult-player-service",
        }),
      },
      {
        method: "POST",
        path: "/tenant",
        options: getOptions({
          withAuth: true,
          withValidate: true,
          requestAuth: false,
        }),
        handler: handleTenantCreate(req, h),
      },
      {
        method: "DELETE",
        path: "/tenant/{id}",
        options: getOptions({ withAuth: true }),
        handler: handleTenantDelete(),
      },
      {
        method: "POST",
        path: "/auth",
        options: getOptions({
          withAuth: true,
          withValidate: true,
          requestAuth: true,
        }),
        handler: handleAuthToken(req, h),
      },
    ]);
  },
};
