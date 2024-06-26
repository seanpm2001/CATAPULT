const { defineConfig } = require("cypress");

require("dotenv").config({
    path: "../.env"
});

module.exports = defineConfig({
    e2e: {
        specPattern: "e2e/*.cy.{js,jsx,ts,tsx}",
        baseUrl: process.env.LOCAL_DEV_URL,
        experimentalStudio: true
    },
    env: {
        ADMIN_USERNAME: process.env.ADMIN_USERNAME,
        ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    },
    defaultCommandTimeout: 9000,
    blockHosts: ["*.google-analytics.com", "*.plausible.io"]
});
