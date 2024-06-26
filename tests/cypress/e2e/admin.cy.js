describe("Admin Functions", () => {
    let adminName = Cypress.env("ADMIN_USERNAME");
    let adminPass = Cypress.env("ADMIN_PASSWORD");

    cy.on("uncaught:exception", (err, runnable) => {
        return false;
    });

    beforeEach(() => {
        cy.visit("/");

        cy.get('#username').type(adminName);
        cy.get('#password').type(adminPass);

        cy.get('.w-100').click();

        cy.get('.navbar-brand').contains("catapult");
    });

    it("Allow Admin to upload a course, configure a test, then delete the course.", async() => {

        let courseURL = await uploadExampleCourse();
        createNewTestConfiguration();

        cy.log(courseURL);

        deleteExampleCourse(courseURL);
    });

    async function uploadExampleCourse() {
        cy.get('.mr-2').click();
        
        let fileInput = cy.get('input[type="file"]');
        fileInput.selectFile("uploads/example-course.zip", {
            force: true
        });

        cy.get('.col > .btn').click();
        cy.get(':nth-child(1) > :nth-child(1) > .col > .mb-3').contains("Introduction to Geology");

        return await cy.url();
    }

    function createNewTestConfiguration() {
        cy.get('.col-auto > .mr-2').click();
        cy.get('.text-right > .btn').click();
        cy.get("button.btn-primary").contains("Continue").click();
    }

    function deleteExampleCourse(url) {
        cy.visit(url);
        cy.get("button").contains("Delete").click();
        cy.get("button").contains("Confirm").click();
    }
});
