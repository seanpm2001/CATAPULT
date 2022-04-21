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
const lrs = require("../lrs");
const RegistrationHelpers = require('./registrationHelpers.js');
const { v4: uuidv4 } = require("uuid"),
    Boom = require("@hapi/boom"),
    Wreck = require("@hapi/wreck");
    

let Registration;

module.exports = Registration = {
    create: async ({tenantId, courseId, actor, code = uuidv4()}, {db, lrsWreck}) => {
        let registrationId;

        try {
            await db.transaction(
                async (txn) => {
                    const course = await Registration.getCourse(txn, tenantId, courseId),
                        courseAUs = await Registration.getCourseAUs(txn, tenantId, courseId),
                        registration = await Registration.getRegistration(course, {tenantId, courseId, actor, code}),
                        regResult = await txn("registrations").insert(registration);

                    registrationId = registration.id = regResult[0];

                    await Registration.updateCourseAUmap(txn, tenantId, registrationId, courseAUs) 

                    await Registration.parseRegistrationData(registration, lrsWreck);
                    
                    await Registration.updateMetadata(txn, registration, tenantId);
                }
            );
        }
        catch (ex) {
            throw Boom.internal(new Error(`Failed to store registration: ${ex}`));
        }

        return registrationId;
    },
    ///lets try these to help with cluster of function makings constants
    getCourse:async(txn, tenantId, courseId) => {
        return await txn.first("*").from("courses").queryContext({jsonCols: ["metadata", "structure"]}).where({tenantId, id: courseId});
    },
    getCourseAUs:async(txn, tenantId, courseId) => {
        return await txn.select("*").from("courses_aus").queryContext({jsonCols: ["metadata"]}).where({tenantId, courseId});
    },
    getRegistration: async(course, {tenantId, courseId, actor, code})=>{
        let registration = {
            tenantId,
            code,
            courseId,
            actor: JSON.stringify(actor),
            metadata: JSON.stringify({
                version: 1,
                moveOn: {
                    type: "course",
                    lmsId: course.lmsId,
                    pubId: course.structure.course.id,
                    satisfied: false,
                    children: course.structure.course.children.map(mapMoveOnChildren)
                }
            })
        }
        return registration;
    },

    ///end create func, creaitng registration, or specifically registratioId, it looks like
    load: async ({tenantId, registrationId}, {db, loadAus = true}) => {
        let registration;
        ///changed below with loadRegistration
        try {
            registration = await Registration.loadRegistration({tenantId, registrationId}, {db});
        }
        catch (ex) {
            throw new Error(`Failed to load registration: ${ex}`);
        }

        if (loadAus) {
            try {
                registration.aus = await Registration.loadRegistrationAus({tenantId, registrationId}, {db}, registration);
            }
            catch (ex) {
                throw new Error(`Failed to load registration AUs: ${ex}`);
            }
        }
        return registration;
    },
    ///To help above
    loadRegistration: async({tenantId, registrationId}, {db}) => {
        return await db
        .first("*")
        .queryContext({jsonCols: ["actor", "metadata"]})
        .from("registrations")
        .where(
            {
                tenantId
            }
        ).andWhere(
            function () {
                this.where("id", registrationId).orWhere("code", registrationId.toString());
            }
        );
    },
    ///Above
    loadRegistrationAus: async({tenantId, registrationId}, {db}, registration) =>{
        /////welll, lets see
        //console.log("here in loadRegistrationAUs registration is: ", registration);
        return await db
        .select(
            "has_been_attempted",
            "duration_normal",
            "duration_browse",
            "duration_review",
            "is_passed",
            "is_completed",
            "is_waived",
            "waived_reason",
            "is_satisfied",
            "metadata"
        )
        .from("registrations_courses_aus")
        .where({tenantId, registrationId: registration.id})
        .queryContext({jsonCols: ["metadata"]});
    },
    ////////////////
    loadAuForChange: async (txn, registrationId, auIndex, tenantId) => {
        let queryResult;

        try {
            queryResult = await Registration.getQueryResult(txn, registrationId, auIndex, tenantId);
        }catch (ex) {
            await txn.rollback();
            throw new Error(`Failed to select registration course AU, registration and course AU for update: ${ex}`);
        }

        if (! queryResult) {
            await txn.rollback();
            throw Boom.notFound(`registration: ${registrationId}`);
        }

        const {
            registrationsCoursesAus: regCourseAu,
            registrations: registration,
            coursesAus: courseAu
        } = queryResult;

        regCourseAu.courseAu = courseAu;

        return {regCourseAu, registration, courseAu};
    },
    //forr above, exceedingly like session.js but trying less wrapping first to deal with issues
    getQueryResult: async(txn, registrationId, auIndex, tenantId) =>{
        return await txn
        .first("*")
        .from("registrations_courses_aus")
        .leftJoin("registrations", "registrations_courses_aus.registration_id", "registrations.id")
        .leftJoin("courses_aus", "registrations_courses_aus.course_au_id", "courses_aus.id")
        .where(
            {
                "registrations_courses_aus.tenant_id": tenantId,
                "courses_aus.au_index": auIndex
            }
        )
        .andWhere(function () {
            this.where("registrations.id", registrationId).orWhere("registrations.code", registrationId.toString());
        })
        .queryContext(
            {
                jsonCols: [
                    "registrations_courses_aus.metadata",
                    "registrations.actor",
                    "registrations.metadata",
                    "courses_aus.metadata"
                ]
            }
        )
        .forUpdate()
        .options({nestTables: true})

    },

    interpretMoveOn: async (registration, {auToSetSatisfied, sessionCode, lrsWreck}) => {
        const moveOn = registration.metadata.moveOn,

            //
            // use a stringified value as the template which allows for parsing
            // on the other end to allow easy cloning to allow use of the template
            // for multiple satisfied statements in the case of blocks in a course
            // and nested blocks
            //
            satisfiedStTemplate = Registration.templateToString(registration, sessionCode);

        if (moveOn.satisfied) {
            return;
        }

        await RegistrationHelpers.isSatisfied(moveOn, {auToSetSatisfied, lrsWreck, satisfiedStTemplate});
    },

    templateToString(registration, sessionCode) {
        let satisfiedStTemplate = JSON.stringify({
            actor: registration.actor,
            verb: {
                id: "https://w3id.org/xapi/adl/verbs/satisfied",
                display: {
                    "en": "satisfied"
                }
            },
            context: {
                registration: registration.code,
                contextActivities: {
                    category: [
                        {
                            id: "https://w3id.org/xapi/cmi5/context/categories/cmi5"
                        }
                    ],
                    grouping: []
                },
                extensions: {
                    "https://w3id.org/xapi/cmi5/context/extensions/sessionid": sessionCode
                }
            }
        });
    
        return satisfiedStTemplate;
    },

    retrieveRegistrationDataAsString: async(registration, lrsWreck) => {
        return await Registration.interpretMoveOn(
            registration,
            {
                sessionCode: uuidv4(),
                lrsWreck
            }
        );
    },

    parseRegistrationData: async (registration, lrsWreck) =>{
        try {
            registration.actor = JSON.parse(registration.actor);
            registration.metadata = JSON.parse(registration.metadata);

            await Registration.retrieveRegistrationDataAsString(registration, lrsWreck);
        }
        catch (ex) {
            throw new Error(`Failed to interpret moveOn: ${ex}`);
        }
        return registration;

    },

    updateMetadata: async(txn, registration, tenantId) => {
        try {
            return await txn("registrations").update({metadata: JSON.stringify(registration.metadata)}).where({tenantId, id: registration.id});
        }
        catch (ex) {
            throw new Error(`Failed to update registration metadata: ${ex}`);
        }
    },

    updateCourseAUmap: async(txn, tenantId, registrationId, courseAUs) => {
        return await txn("registrations_courses_aus").insert(
            courseAUs.map(
                (ca) => ({
                    tenantId,
                    registrationId,
                    course_au_id: ca.id,
                    metadata: JSON.stringify({
                        version: 1,
                        moveOn: ca.metadata.moveOn
                    }),
                    is_satisfied: ca.metadata.moveOn === "NotApplicable"
                })
            )
        );
    },
};
