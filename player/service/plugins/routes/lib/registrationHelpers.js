const lrs = require("../lrs");

const { v4: uuidv4 } = require("uuid"),
    Boom = require("@hapi/boom"),
    Wreck = require("@hapi/wreck");
    
    let RegistrationHelpers;

module.exports = RegistrationHelpers = {
   
     mapMoveOnChildren : (child) => ({
        lmsId: child.lmsId,
        pubId: child.id,
        type: child.type,
        satisfied: (child.type === "au" && child.moveOn === "NotApplicable"),
        ...(child.type === "block" ? {children: child.children.map(RegistrationHelpers.mapMoveOnChildren)} : {})
    }),
    
    tryParseTemplate : ((satisfiedStTemplate) => {
        let statement;

        try {
            statement = JSON.parse(satisfiedStTemplate);
        }
        catch (ex) {
            throw new Error(`Failed to parse statement template: ${ex}`);
        }
        
        return statement;
    }),

    assignStatementValues : ((node, statement) =>{
        statement.id = uuidv4();
        statement.timestamp = new Date().toISOString();
        statement.object = {
            id: node.lmsId,
            definition: {
                type: node.type === "block" ? "https://w3id.org/xapi/cmi5/activitytype/block" : "https://w3id.org/xapi/cmi5/activitytype/course"
            }
        };
        statement.context.contextActivities.grouping = [
            {
                id: node.pubId
            }
        ];
    }),

    nodeSatisfied : async(node) =>  {
        if (node.satisfied) {
            return true;
        }
    },

    AUnodeSatisfied : async(node, auToSetSatisfied) =>{
        if (node.type === "au") {
            if (node.lmsId === auToSetSatisfied) {
                node.satisfied = true;
            }
            return await node.satisfied;
        }
    },

    loopThroughChildren : async(node, auToSetSatisfied, satisfiedStTemplate, lrsWreck, txn) => {
        let allChildrenSatisfied = true;

        for (const child of node.children) {
            if (! await RegistrationHelpers.isSatisfied(child, auToSetSatisfied, satisfiedStTemplate, lrsWreck, txn))
           {
                allChildrenSatisfied = false;
            }
        }
        return allChildrenSatisfied;
    },

    retrieveResponse : async (lrsWreck, txn) => {
        let satisfiedStResponse,
            satisfiedStResponseBody;
        try { satisfiedStResponse = await lrsWreck.request(
            "POST",
            "statements",
            {
                headers: {
                    "Content-Type": "application/json"
                },
                payload: {
                    id: uuidv4(),
                    timestamp: new Date().toISOString(),
                    actor: registration.actor,
                    verb: {
                        id: "https://w3id.org/xapi/adl/verbs/abandoned",
                        display: {
                            en: "abandoned"
                        }
                    },
                    object: {
                        id: regCourseAu.courseAu.lms_id
                    },
                    result: {
                        duration: `PT${durationSeconds}S`
                    },
                    context: {
                        registration: registration.code,
                        extensions: {
                            "https://w3id.org/xapi/cmi5/context/extensions/sessionid": session.code
                        },
                        contextActivities: {
                            category: [
                                {
                                    id: "https://w3id.org/xapi/cmi5/context/categories/cmi5"
                                }
                            ]
                        }
                    }
                }
            }
        ),

        satisfiedStResponseBody = await Wreck.read(satisfiedStResponse, {json: true})

        return [satisfiedStResponse, satisfiedStResponseBody];
        
        } catch (ex) {
            await txn.rollback();
            throw Boom.internal(new Error(`Failed request to store abandoned statement: ${ex}`));
        }
    },

    checkStatusCode : async(satisfiedStResponse, satisfiedStResponseBody) => {
        if (satisfiedStResponse.statusCode !== 200) {
            throw new Error(`Failed to store satisfied statement: ${satisfiedStResponse.statusCode} (${satisfiedStResponseBody})`);
        }
    },

    isSatisfied : async (node, auToSetSatisfied, satisfiedStTemplate, lrsWreck, txn) => {
        
        await RegistrationHelpers.nodeSatisfied(node);

        if (RegistrationHelpers.AUnodeSatisfied(node, auToSetSatisfied)) {
            node.satisfied = true;
            return node.satisfied;
        }
        
        // recursively check all children to see if they are satisfied
        let allChildrenSatisfied = true;

        RegistrationHelpers.loopThroughChildren(node, auToSetSatisfied, satisfiedStTemplate, lrsWreck, txn);

        if (allChildrenSatisfied) {
            node.satisfied = true;

            let statement;

            statement = RegistrationHelpers.tryParseTemplate(satisfiedStTemplate);

            RegistrationHelpers.assignStatementValues(node, statement);

            let satisfiedStResponse, satisfiedStResponseBody;

            //for tests to work, removed [] around these two. If program causes errors check here first, seems ok right now
            satisfiedStResponse, satisfiedStResponseBody = await RegistrationHelpers.retrieveResponse(lrsWreck, txn);

            await RegistrationHelpers.checkStatusCode(satisfiedStResponse, satisfiedStResponseBody);

            return true;
        }
        return false;
    }
}
    