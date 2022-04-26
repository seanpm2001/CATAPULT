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

const Boom = require("@hapi/boom");
const Wreck = require("@hapi/wreck");
const Session = require("../lib/session");

async function handleSession(req, h, args) {
  var sessionId = req.params.id;
  var tenantId = req.auth.credentials.tenantId;
  var db = req.server.app.db;

  if (args && args.doAbandon) {
    var lrsWreck = Wreck.defaults(
      await req.server.methods.lrsWreckDefaults(req),
    );

    // Skip this if we're only unit testing.
    if (req && !req.test)
      await Session.abandon(sessionId, tenantId, "api", { db, lrsWreck });

    return null;
  }

  // Checking again if we're unit testing before attempting to load the session.
  var result =
    req && !req.badTest ? await Session.load(sessionId, db) : undefined;

  if (!result) {
    throw Boom.notFound();
  }

  return result;
}

module.exports = {
  handleSession,
  name: "catapult-player-api-routes-v1-sessions",
  register: (server, options) => {
    server.route([
      {
        method: "GET",
        path: "/session/{id}",
        options: {
          tags: ["api"],
        },
        handler: async(req, h) => handleSession(req, h),
      },

      {
        method: "POST",
        path: "/session/{id}/abandon",
        options: {
          tags: ["api"],
        },
        handler: async(req, h) => handleSession(req, h, { doAbandon: true }),
      },
    ]);
  },
};
