const expect =require('chai').expect; //utilize chai assertion library 'expect'

    //const tableName = require("sessions")

describe('test of load sessions', () => {

    it('should load first element', () => {

    db = ["hello", "why", "I hate my life"]
    let Session;
    
    
    module.exports = Session = {
        load: async (sessionId, tenantId, {db}) => {
            let session;
            //console.log(session);
            session = db;   
        },  

    }//end it
    
    expect(session).to.be.eq("hello")     
    })
 }) //end decribe