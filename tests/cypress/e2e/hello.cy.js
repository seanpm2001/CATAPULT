describe("Homepage Behavior", () => {
    beforeEach(() => {
        cy.visit("/");
    });

    it("Loads the Home Page.", () => {
        cy.get('.logo').contains("catapult");
    });
});
