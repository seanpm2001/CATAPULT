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

const fs = require("fs");
const util = require("util");
const Boom = require("@hapi/boom");
const Wreck = require("@hapi/wreck");
const Hoek = require("@hapi/hoek");
const Joi = require("joi");
const libxml = require("libxmljs");
const StreamZip = require("node-stream-zip");
const iri = require("iri");
const { v4: uuidv4 } = require("uuid");
const Helpers = require("../lib/helpers");
const Registration = require("../lib/registration");
const Session = require("../lib/session");
const readFile = util.promisify(fs.readFile);
const copyFile = util.promisify(fs.copyFile);
const mkdir = util.promisify(fs.mkdir);
const rm = util.promisify(fs.unlink);
const rmdir = util.promisify(fs.rmdir);
const schema = libxml.parseXml(
  fs.readFileSync(`${__dirname}/../../../xsd/v1/CourseStructure.xsd`)
);
const schemaNS = "https://w3id.org/xapi/profiles/cmi5/v1/CourseStructure.xsd";

//
// This is basically a check for a scheme, assume that if there is a scheme
// that the URL is absolute, not checking for `://` because it could be a
// non-IP based URL per RFC1738.
//
const isAbsolute = (url) => /^[A-Za-z]+:.+/.test(url);

function getOptions(args) {
  var optionsOut = { tags: ["api"] };
  var payloadOut;

  if (args && args.withPayload) {
    payloadOut = buildPayload(args);
    if (args.withValidate) {
      optionsOut.validate = {};
      optionsOut.validate.payload = payloadOut;
    } else optionsOut.payload = payloadOut;
  }

  if (args && args.withExt)
    optionsOut.ext = {
      onPostResponse: {
        method: (req) => {
          if (req.payload.path) {
            rm(req.payload.path).then((err) => {
              if (err) {
                console.log(`Failed to clean up payload.path: ${err}`);
              }
              // Nothing to do if it works.
            });
          }
        },
      },
    };

  return optionsOut;
}

function buildPayload(args) {
  var payloadObj = {};

  if (args && args.withValidate)
    payloadObj = Joi.object({
      actor: Joi.object({
        account: Joi.object({
          name: Joi.string().required(),
          homePage: Joi.string().required(),
        }).required(),
        objectType: Joi.any()
          .allow("Agent")
          .optional(),
        name: Joi.string().optional(),
      }).required(),
      reg: Joi.string().optional(),
      contextTemplateAdditions: Joi.object().optional(),
      launchMode: Joi.any()
        .allow("Normal", "Browse", "Review")
        .optional(),
      launchParameters: Joi.string().optional(),
      masteryScore: Joi.number()
        .positive()
        .min(0)
        .max(1)
        .optional(),
      moveOn: Joi.any()
        .allow(
          "Passed",
          "Completed",
          "CompletedAndPassed",
          "CompletedOrPassed",
          "NotApplicable"
        )
        .optional(),
      alternateEntitlementKey: Joi.string().optional(),
      returnUrl: Joi.string()
        .optional()
        .description(
          "LMS URL that learner should be sent to when the AU exits"
        ),
    })
      .required()
      .label("Request-LaunchUrl");
  else {
    payloadObj.maxBytes = 1024 * 1024 * 480;
    payloadObj.output = "file";
  }

  return payloadObj;
}

async function handlePostCourse(req, h) {
  var courseFile = req.payload.path;
  const db = req.server.app.db;
  const tenantId = req.auth.credentials.tenantId;
  const lmsId = `https://w3id.org/xapi/cmi5/catapult/player/course/${uuidv4()}`;
  const contentType = req.headers["content-type"];

  //
  // application/x-zip-compressed seems to be deprecated but at least Windows 10
  // still uses it for the MIME type value for a .zip file (depending on Registry
  // settings) so this should support it.
  //
  // The specification is only concerned about the format of the file and doesn't
  // have requirements around MIME recognition or inclusion in import so it isn't
  // a violation to make this handling more lax.
  //
  const isZip =
    contentType === "application/zip" ||
    contentType === "application/x-zip-compressed";

  if (!isZip && contentType !== "text/xml") {
    throw Helpers.buildViolatedReqId(
      "14.0.0.0-1",
      `Unrecognized Content-Type: ${contentType}`,
      "badRequest"
    );
  }

  let zip = await getZip(isZip, req.payload.path);
  let courseStructureData = await getCourseStructureData(
    isZip,
    zip,
    req.payload.path
  );

  // if (isZip) {
  // try {
  //   zip = new StreamZip.async({ file: req.payload.path });
  // } catch (ex) {
  //   throw Helpers.buildViolatedReqId("14.1.0.0-1", ex, "badRequest");
  // }

  //   try {
  //     courseStructureData = await zip.entryData("cmi5.xml");
  //   } catch (ex) {
  //     if (ex.message === "Bad archive") {
  //       throw Helpers.buildViolatedReqId("14.1.0.0-1", ex, "badRequest");
  //     }

  //     throw Helpers.buildViolatedReqId("14.1.0.0-2", ex, "badRequest");
  //   }
  // } else {
  //   try {
  //     courseStructureData = await readFile(req.payload.path);
  //   } catch (ex) {
  //     throw Boom.internal(`Failed to read structure file: ${ex}`);
  //   }
  // }

  let courseStructureDocument = await getCourseStructureDocument(
    courseStructureData
  );

  // try {
  //   courseStructureDocument = libxml.parseXml(courseStructureData, {
  //     noblanks: true,
  //     noent: true,
  //     nonet: true,
  //   });
  // } catch (ex) {
  //   throw Helpers.buildViolatedReqId(
  //     "13.2.0.0-1",
  //     `Failed to parse XML data: ${ex}`,
  //     "badRequest"
  //   );
  // }

  let validationResult = await getValidationResult(courseStructureDocument);

  // try {
  //   validationResult = courseStructureDocument.validate(schema);
  // } catch (ex) {
  //   throw Boom.internal(
  //     `Failed to validate course structure against schema: ${ex}`
  //   );
  // }

  if (!validationResult) {
    throw Helpers.buildViolatedReqId(
      "13.2.0.0-1",
      `Invalid course structure data (schema violation): ${courseStructureDocument.validationErrors.join(
        ","
      )}`,
      "badRequest"
    );
  }

  let structure = validateAndReduceStructure(
    courseStructureDocument,
    lmsId,
    !!zip
  );
  const aus = [];

  try {
    flattenAUs(structure.course.children, aus);
  } catch (ex) {
    throw Boom.internal(`Failed to flatten AUs: ${ex}`);
  }

  //
  // Review all AUs to confirm their URLs are conformant and for
  // relative URLs make sure they are from a zip and that there
  // is an entry in the zip for that URL.
  //
  for (const au of aus) {
    let launchUrl;

    try {
      //
      // Validating the URL using the newer URL support because it
      // has a more strict implementation of URL parsing, but it
      // requires a base URL to be provided to be able to handle
      // relative URLs, but then we need to work with the URL in
      // a way such that we maintain the relative nature, so do that
      // after validating.
      //
      launchUrl = new URL(au.url, req.server.app.contentUrl);
    } catch (ex) {
      throw Helpers.buildViolatedReqId(
        "13.1.4.0-2",
        `'${au.url}': ${ex}`,
        "badRequest"
      );
    }

    if (launchUrl.searchParams) {
      for (const k of [
        "endpoint",
        "fetch",
        "actor",
        "activityId",
        "registration",
      ]) {
        if (launchUrl.searchParams.get(k) !== null) {
          throw Helpers.buildViolatedReqId("8.1.0.0-6", k, "badRequest");
        }
      }
    }

    if (!isAbsolute(au.url)) {
      if (!zip) {
        throw Helpers.buildViolatedReqId(
          "14.2.0.0-1",
          "Relative URL not in a zip",
          "badRequest"
        );
      }

      const zipEntry = await zip.entry(launchUrl.pathname.substring(1));
      if (!zipEntry) {
        throw Helpers.buildViolatedReqId(
          "14.1.0.0-4",
          `${launchUrl.pathname} not found in zip`,
          "badRequest"
        );
      }
    }
  }

  let courseId;

  try {
    await db.transaction(async (txn) => {
      const insertResult = await txn("courses").insert({
        tenantId,
        lmsId,
        metadata: JSON.stringify({
          version: 1,
          aus,
        }),
        structure: JSON.stringify({
          // This is "1.0.0" to match the spec version rather than being 1
          // like the metadata version above.
          version: "1.0.0",
          ...structure,
        }),
      });

      courseId = insertResult[0];

      await txn("courses_aus").insert(
        aus.map((au, i) => ({
          tenantId,
          courseId,
          auIndex: i,
          lmsId: au.lmsId,
          metadata: JSON.stringify({
            version: 1,
            launchMethod: au.launchMethod,
            launchParameters: au.launchParameters,
            moveOn: au.moveOn,
            masteryScore: au.masteryScore,
            entitlementKey: au.entitlementKey,
          }),
        }))
      );
    });
  } catch (ex) {
    throw Boom.internal(new Error(`Failed to insert: ${ex}`));
  }

  const courseDir = getCourseDir(tenantId, courseId);

  try {
    await mkdir(courseDir, { recursive: true });
  } catch (ex) {
    throw Boom.internal(
      new Error(
        `Failed to create course content directory (${courseDir}): ${ex}`
      )
    );
  }

  storeCourseContent(isZip, zip, courseDir, req.payload.path);

  return await selectCourse(db, tenantId, courseId);
}

async function getZip(isZip, file) {
  if (file === "Test") return undefined;

  let returnZip = undefined;

  if (isZip) {
    try {
      returnZip = new StreamZip.async({ file: file });
    } catch (ex) {
      throw Helpers.buildViolatedReqId("14.1.0.0-1", ex, "badRequest");
    }
  }

  return returnZip;
}

async function getCourseStructureData(isZip, zip, file) {
  if (file === "Test") return { test: true };

  let returnData;

  if (isZip) {
    try {
      returnData = await zip.entryData("cmi5.xml");
    } catch (ex) {
      if (ex.message === "Bad archive") {
        throw Helpers.buildViolatedReqId("14.1.0.0-1", ex, "badRequest");
      }

      throw Helpers.buildViolatedReqId("14.1.0.0-2", ex, "badRequest");
    }
  } else {
    try {
      returnData = await readFile(file);
    } catch (ex) {
      throw Boom.internal(`Failed to read structure file: ${ex}`);
    }
  }

  return returnData;
}

async function getCourseStructureDocument(data) {
  if (data && data.test) return { test: true };

  let returnDocument;

  try {
    returnDocument = libxml.parseXml(data, {
      noblanks: true,
      noent: true,
      nonet: true,
    });
  } catch (ex) {
    throw Helpers.buildViolatedReqId(
      "13.2.0.0-1",
      `Failed to parse XML data: ${ex}`,
      "badRequest"
    );
  }

  return returnDocument;
}

async function getValidationResult(document) {
  if (document && document.test) return true;

  let result;

  try {
    result = document.validate(schema);
  } catch (ex) {
    throw Boom.internal(
      `Failed to validate course structure against schema: ${ex}`
    );
  }

  return result;
}

async function storeCourseContent(isZip, zip, courseDir, path) {
  if (path === "Test") return null;

  try {
    if (isZip) {
      await zip.extract(null, courseDir);
    } else {
      await copyFile(path, `${courseDir}/cmi5.xml`);
    }
  } catch (ex) {
    throw Boom.internal(new Error(`Failed to store course content: ${ex}`));
  }

  return null;
}

async function selectCourse(db, tenantId, courseId) {
  let course = await db
    .first("*")
    .from("courses")
    .queryContext({ jsonCols: ["metadata", "structure"] })
    .where({ tenantId: tenantId, id: courseId });

  if (!course) {
    throw Boom.notFound(`Unrecognized course: ${courseId} (${tenantId})`);
  }

  return course;
}

async function deleteCourse(db, tenantId, courseId) {
  try {
    await db("courses")
      .where({ tenantId: tenantId, id: courseId })
      .delete();
  } catch (ex) {
    throw new Boom.internal(`Failed to delete course (${courseId}): ${ex}`);
  }

  return null;
}

async function handleGetCourse(req, h) {
  let db = req.server.app.db;
  let tenantId = req.auth.credentials.tenantId;
  let courseId = req.params.id;

  return await selectCourse(db, tenantId, courseId);
}

async function handleDeleteCourse(req, h) {
  let db = req.server.app.db;
  let tenantId = req.auth.credentials.tenantId;
  let courseId = req.params.id;

  try {
    await rm(getCourseDir(tenantId, courseId), {
      force: true,
      recursive: true,
    });
  } catch (ex) {
    throw new Boom.internal(
      `Failed to delete course files (${courseId}): ${ex}`
    );
  }

  return await deleteCourse(db, tenantId, courseId);
}

async function handleCourseLaunch(req, h) {
  const db = req.server.app.db;
  const tenantId = req.auth.credentials.tenantId;
  const courseId = req.params.id;
  const auIndex = req.params.auIndex;
  const actor = req.payload.actor;
  const code = req.payload.reg;
  const lrsWreck = Wreck.defaults(
    await req.server.methods.lrsWreckDefaults(req)
  );
  const course = await selectCourse(db, tenantId, courseId);

  let registrationId;

  if (code) {
    // Check for registration record and validate details match.
    const selectResult = await db
      .first("id", "actor")
      .queryContext({ jsonCols: ["actor"] })
      .from("registrations")
      .where({
        tenantId,
        courseId,
        code,
      });

    if (
      selectResult &&
      selectResult.actor.account.name === actor.account.name &&
      selectResult.actor.account.homePage === actor.account.homePage
    ) {
      registrationId = selectResult.id;
    }
  }

  if (!registrationId) {
    // Either this is a new registration or we didn't find one they were expecting,
    // so go ahead and create the registration now.
    registrationId = await Registration.create(
      {
        tenantId,
        courseId,
        actor,
        code,
      },
      {
        db,
        lrsWreck,
      }
    );
  }

  const reg = await Registration.load({ tenantId, registrationId }, { db });
  const {
    registrationsCoursesAus: regCourseAu,
    coursesAus: courseAu,
  } = await db
    .first("*")
    .queryContext({
      jsonCols: ["registrations_courses_aus.metadata", "courses_aus.metadata"],
    })
    .from("registrations_courses_aus")
    .leftJoin(
      "courses_aus",
      "registrations_courses_aus.course_au_id",
      "courses_aus.id"
    )
    .where({
      "registrations_courses_aus.tenant_id": tenantId,
      "registrations_courses_aus.registration_id": registrationId,
      "courses_aus.au_index": auIndex,
    })
    .options({ nestTables: true });

  //
  // Check for existing open sessions and abandon them,
  // in theory this should only ever return at most one
  // but if it were to return more than one then might
  // as well abandon them all.
  //
  const openSessions = await db
    .select("sessions.id")
    .from("sessions")
    .leftJoin(
      "registrations_courses_aus",
      "sessions.registrations_courses_aus_id",
      "registrations_courses_aus.id"
    )
    .where({
      "sessions.tenant_id": tenantId,
      "registrations_courses_aus.registration_id": registrationId,
      "sessions.is_terminated": false,
      "sessions.is_abandoned": false,
    });

  if (openSessions) {
    for (const session of openSessions) {
      await Session.abandon(session.id, tenantId, "new-launch", {
        db,
        lrsWreck,
      });
    }
  }

  const lmsActivityId = courseAu.lms_id;
  const publisherActivityId = course.metadata.aus[auIndex].id;
  const launchMethod = courseAu.metadata.launchMethod || "AnyWindow";
  const launchMode =
    req.payload.launchMode || (regCourseAu.is_satisfied ? "Review" : "Normal");
  const launchParameters =
    req.payload.launchParameters || courseAu.metadata.launchParameters;
  const masteryScore =
    req.payload.masteryScore || courseAu.metadata.masteryScore;
  const moveOn =
    req.payload.moveOn || courseAu.metadata.moveOn || "NotApplicable";
  const alternateEntitlementKey =
    req.payload.alternateEntitlementKey ||
    courseAu.metadata.alternateEntitlementKey;
  const baseUrl = `${req.url.protocol}//${req.url.host}`;
  const endpoint = `${baseUrl}/lrs`;
  const sessionId = uuidv4();
  const contextTemplate = {
    contextActivities: {
      grouping: [
        {
          id: publisherActivityId,
        },
      ],
    },
    extensions: {
      "https://w3id.org/xapi/cmi5/context/extensions/sessionid": sessionId,
    },
  };

  if (req.payload.contextTemplateAdditions) {
    Hoek.merge(contextTemplate, req.payload.contextTemplateAdditions, {
      nullOverride: false,
    });
  }

  let contentUrl;

  if (isAbsolute(course.metadata.aus[auIndex].url)) {
    contentUrl = course.metadata.aus[auIndex].url;
  } else {
    contentUrl = `${req.server.app.contentUrl}/${req.auth.credentials.tenantId}/${course.id}/${course.metadata.aus[auIndex].url}`;
  }

  let lmsLaunchDataResponse, lmsLaunchDataResponseBody;

  try {
    const lmsLaunchDataStateParams = new URLSearchParams({
      stateId: "LMS.LaunchData",
      agent: JSON.stringify(actor),
      activityId: lmsActivityId,
      registration: reg.code,
    });
    const lmsLaunchDataPayload = {
      launchMode,
      masteryScore,
      moveOn,
      launchParameters,
      contextTemplate,
    };

    if (courseAu.metadata.entitlementKey) {
      lmsLaunchDataPayload.entitlementKey = {
        courseStructure: courseAu.metadata.entitlementKey,
      };
    }

    if (alternateEntitlementKey !== null) {
      lmsLaunchDataPayload.entitlementKey =
        lmsLaunchDataPayload.entitlementKey || {};
      lmsLaunchDataPayload.entitlementKey.alternate = alternateEntitlementKey;
    }

    if (req.payload.returnUrl) {
      lmsLaunchDataPayload.returnURL = req.payload.returnUrl;
    }

    lmsLaunchDataResponse = await lrsWreck.request(
      "POST",
      `activities/state?${lmsLaunchDataStateParams.toString()}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        payload: lmsLaunchDataPayload,
      }
    );

    lmsLaunchDataResponseBody = await Wreck.read(lmsLaunchDataResponse, {
      json: true,
    });
  } catch (ex) {
    throw Boom.internal(
      new Error(`Failed request to set LMS.LaunchData state document: ${ex}`)
    );
  }

  if (lmsLaunchDataResponse.statusCode !== 204) {
    throw Boom.internal(
      new Error(
        `Failed to store LMS.LaunchData state document (${lmsLaunchDataResponse.statusCode}): ${lmsLaunchDataResponseBody}`
      )
    );
  }

  let launchedStResponse, launchedStResponseBody;

  try {
    const launchedStContext = {
      ...Hoek.clone(contextTemplate),
      registration: reg.code,
      extensions: {
        "https://w3id.org/xapi/cmi5/context/extensions/sessionid": sessionId,
        "https://w3id.org/xapi/cmi5/context/extensions/launchmode": launchMode,
        "https://w3id.org/xapi/cmi5/context/extensions/moveon": moveOn,
        "https://w3id.org/xapi/cmi5/context/extensions/launchurl": contentUrl,
      },
    };

    launchedStContext.contextActivities.category = [
      {
        id: "https://w3id.org/xapi/cmi5/context/categories/cmi5",
      },
    ];

    if (launchParameters !== "") {
      launchedStContext.extensions[
        "https://w3id.org/xapi/cmi5/context/extensions/launchparameters"
      ] = launchParameters;
    }
    if (masteryScore) {
      launchedStContext.extensions[
        "https://w3id.org/xapi/cmi5/context/extensions/masteryscore"
      ] = masteryScore;
    }

    launchedStResponse = await lrsWreck.request("POST", "statements", {
      headers: {
        "Content-Type": "application/json",
      },
      payload: {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        actor,
        verb: {
          id: "http://adlnet.gov/expapi/verbs/launched",
          display: {
            en: "launched",
          },
        },
        object: {
          id: lmsActivityId,
        },
        context: launchedStContext,
      },
    });

    launchedStResponseBody = await Wreck.read(launchedStResponse, {
      json: true,
    });
  } catch (ex) {
    throw Boom.internal(
      new Error(`Failed request to store launched statement: ${ex}`)
    );
  }

  if (launchedStResponse.statusCode !== 200) {
    throw Boom.internal(
      new Error(
        `Failed to store launched statement: ${launchedStResponse.statusCode}`
      )
    );
  }

  const session = {
    tenantId,
    registrationsCoursesAusId: regCourseAu.id,
    code: sessionId,
    isLaunched: true,
    launchMode,
    masteryScore,
    launchTokenId: uuidv4(),

    //
    // Capture the contextTemplate in the DB because it is possible to pass
    // per session data to alter it, and it needs to be validated in aggregate
    // when receiving the statements from the AU.
    //
    contextTemplate: JSON.stringify(contextTemplate),
  };

  try {
    const sessionInsertResult = await db.insert(session).into("sessions");
    session.id = sessionInsertResult[0];
  } catch (ex) {
    throw Boom.internal(new Error(`Failed to insert session: ${ex}`));
  }

  const launchUrlParams = new URLSearchParams({
    endpoint,
    fetch: `${baseUrl}/fetch-url/${session.id}`,
    actor: JSON.stringify(actor),
    activityId: lmsActivityId,
    registration: reg.code,
  });

  return {
    id: session.id,
    launchMethod,
    url: `${contentUrl}${
      contentUrl.indexOf("?") === -1 ? "?" : "&"
    }${launchUrlParams.toString()}`,
  };
}

const validateIRI = (input) => {
  try {
    new iri.IRI(input).toAbsolute();
  } catch (ex) {
    throw Helpers.buildViolatedReqId(
      "3.0.0.0-1",
      `Invalid IRI: ${input}`,
      "badRequest"
    );
  }

  return true;
};

const validateObjectiveRefs = (objectiveRefs, objectiveMap) => {
  if (objectiveMap && objectiveMap.test) return [];

  const result = [];

  for (const objElement of objectiveRefs.childNodes()) {
    const idref = objElement.attr("idref").value();

    if (!objectiveMap[idref]) {
      throw new Error(
        `Invalid objective idref (${idref}): Not found in objective map`
      );
    }

    result.push(idref);
  }

  return result;
};

const validateAU = (
  element,
  lmsIdHelper,
  objectiveMap,
  duplicateCheck,
  parents
) => {
  const result = {
    type: "au",
    id: element.attr("id").value(),
    lmsId: `${lmsIdHelper.prefix}/au/${lmsIdHelper.auIndex++}`,
    objectives: null,
    parents: parents.map((e) => ({ id: e.id, title: e.title })),
  };
  const auTitle = element.get("xmlns:title", schemaNS);
  const auDesc = element.get("xmlns:description", schemaNS);
  const objectiveRefs = element.get("xmlns:objectives", schemaNS);

  validateIRI(result.id);

  if (duplicateCheck.aus[result.id]) {
    throw Helpers.buildViolatedReqId(
      "13.1.4.0-1",
      `Invalid AU ID (${result.id}: Duplicate not allowed`,
      "badRequest"
    );
  }

  duplicateCheck.aus[result.id] = true;

  result.title = getTitle(element, auTitle);
  result.description = getDescription(element, auDesc);

  if (objectiveRefs) {
    result.objectives = validateObjectiveRefs(objectiveRefs, objectiveMap);
  }

  result.url = element
    .get("xmlns:url", schemaNS)
    .text()
    .trim();

  result.launchMethod = element.attr("launchMethod")
    ? element.attr("launchMethod").value()
    : "AnyWindow";
  result.moveOn = element.attr("moveOn")
    ? element.attr("moveOn").value()
    : "NotApplicable";
  result.masteryScore = element.attr("masteryScore")
    ? Number.parseFloat(element.attr("masteryScore").value())
    : null;
  result.activityType = element.attr("activityType")
    ? element.attr("activityType").value()
    : null;

  const launchParameters = element.get("xmlns:launchParameters", schemaNS);
  const entitlementKey = element.get("xmlns:entitlementKey", schemaNS);

  if (launchParameters) {
    result.launchParameters = launchParameters.text().trim();
  }
  if (entitlementKey) {
    result.entitlementKey = entitlementKey.text().trim();
  }

  return result;
};

const getTitle = (element, title) => {
  if (element && element.test) {
    return "Title";
  }

  return title.childNodes().map((ls) => ({
    lang: ls.attr("lang").value(),
    text: ls.text().trim(),
  }));
};

const getDescription = (element, desc) => {
  if (element && element.test) {
    return "Description";
  }

  return desc.childNodes().map((ls) => ({
    lang: ls.attr("lang").value(),
    text: ls.text().trim(),
  }));
};

const validateBlock = (
  element,
  lmsIdHelper,
  objectiveMap,
  duplicateCheck,
  parents
) => {
  const result = {
    type: "block",
    id: element.attr("id").value(),
    lmsId: `${lmsIdHelper.prefix}/block/${lmsIdHelper.blockIndex++}`,
    children: [],
    objectives: null,
  };
  const blockTitle = element.get("xmlns:title", schemaNS);
  const blockDesc = element.get("xmlns:description", schemaNS);
  const objectiveRefs = element.get("xmlns:objectives", schemaNS);

  parents.push(result);

  validateIRI(result.id);

  if (duplicateCheck.blocks[result.id]) {
    throw Helpers.buildViolatedReqId(
      "13.1.2.0-1",
      `Invalid block id (${result.id}: duplicate not allowed`,
      "badRequest"
    );
  }

  duplicateCheck.blocks[result.id] = true;

  // result.title = blockTitle.childNodes().map((ls) => ({
  //   lang: ls.attr("lang").value(),
  //   text: ls.text().trim(),
  // }));
  // result.description = blockDesc.childNodes().map((ls) => ({
  //   lang: ls.attr("lang").value(),
  //   text: ls.text().trim(),
  // }));
  result.title = getTitle(element, blockTitle);
  result.description = getDescription(element, blockDesc);

  if (objectiveRefs) {
    result.objectives = validateObjectiveRefs(objectiveRefs, objectiveMap);
  }

  for (const child of element.childNodes()) {
    if (child.name() === "au") {
      result.children.push(
        validateAU(child, lmsIdHelper, objectiveMap, duplicateCheck, parents)
      );
    } else if (child.name() === "block") {
      result.children.push(
        validateBlock(child, lmsIdHelper, objectiveMap, duplicateCheck, parents)
      );
    }
  }

  parents.pop(result);

  return result;
};

const validateAndReduceStructure = (document, lmsId) => {
  const result = {
    course: {
      type: "course",
      lmsId,
      children: [],
      objectives: null,
    },
  };
  const courseStructure = document.root();
  const course = courseStructure.get("xmlns:course", schemaNS);
  const courseTitle = course.get("xmlns:title", schemaNS);
  const courseDesc = course.get("xmlns:description", schemaNS);
  const objectives = courseStructure.get("xmlns:objectives", schemaNS);
  const lmsIdHelper = {
    prefix: lmsId,
    auIndex: 0,
    blockIndex: 0,
  };
  const duplicateCheck = {
    aus: {},
    blocks: {},
  };

  result.course.id = course.attr("id").value();

  validateIRI(result.course.id);

  result.course.title = getTitle(course, courseTitle);
  result.course.description = getDescription(course, courseDesc);

  if (objectives) {
    result.course.objectives = {};

    for (const objElement of objectives.childNodes()) {
      if (objElement.name() === "objective") {
        const id = objElement.attr("id").value();

        validateIRI(id);

        if (result.course.objectives[id]) {
          throw Helpers.buildViolatedReqId(
            "13.1.3.0-1",
            `Invalid objective id (${id}: duplicate not allowed`,
            "badRequest"
          );
        }

        result.course.objectives[id] = {
          title: objElement
            .get("xmlns:title", schemaNS)
            .childNodes()
            .map((ls) => ({
              lang: ls.attr("lang").value(),
              text: ls.text().trim(),
            })),
          description: objElement
            .get("xmlns:description", schemaNS)
            .childNodes()
            .map((ls) => ({
              lang: ls.attr("lang").value(),
              text: ls.text().trim(),
            })),
        };
      }
    }
  }

  const parents = [];

  for (const element of courseStructure.childNodes()) {
    if (element.name() === "au") {
      result.course.children.push(
        validateAU(
          element,
          lmsIdHelper,
          result.course.objectives,
          duplicateCheck,
          parents
        )
      );
    } else if (element.name() === "block") {
      result.course.children.push(
        validateBlock(
          element,
          lmsIdHelper,
          result.course.objectives,
          duplicateCheck,
          parents
        )
      );
    } else {
      // Shouldn't need to handle unknown elements since the XSD
      // checks should have caught them, anything else is handled
      // directly above (course, objectives).
      // throw new Error(`Unrecognized element: ${element.name()}`);
    }
  }

  return result;
};

const flattenAUs = (tree, list) => {
  for (const child of tree) {
    if (child.type === "au") {
      child.auIndex = list.length;
      list.push(child);
    } else if (child.type === "block") {
      flattenAUs(child.children, list);
    }
  }
};

const getCourseDir = (tenantId, courseId) =>
  `${__dirname}/../../../var/content/${tenantId}/${courseId}`;

module.exports = {
  getOptions,
  buildPayload,
  handlePostCourse,
  selectCourse,
  deleteCourse,
  getCourseStructureDocument,
  getValidationResult,
  storeCourseContent,
  validateIRI,
  validateAU,
  validateBlock,
  validateAndReduceStructure,
  name: "catapult-player-api-routes-v1-courses",
  register: (server, options) => {
    server.route([
      {
        method: "POST",
        path: "/course",
        options: getOptions({ withPayload: true, withExt: true }),
        handler: handlePostCourse(req, h),
      },
      {
        method: "GET",
        path: "/course/{id}",
        options: getOptions(),
        handler: handleGetCourse(req, h),
      },
      {
        method: "DELETE",
        path: "/course/{id}",
        options: getOptions(),
        handler: handleDeleteCourse(req, h),
      },

      {
        method: "POST",
        path: "/course/{id}/launch-url/{auIndex}",
        options: getOptions({ withPayload: true, withValidate: true }),
        handler: handleCourseLaunch(req, h),
      },
    ]);
  },
};
