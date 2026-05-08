const { app } = require('@azure/functions');
const { CosmosClient } = require("@azure/cosmos");

app.http('getMedia', {
    methods: ['GET', 'OPTIONS'],
    authLevel: 'anonymous',

    handler: async (request, context) => {

        if (request.method === 'OPTIONS') {
            return {
                status: 200,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type"
                }
            };
        }

        try {

            const cosmosClient = new CosmosClient({
                endpoint: process.env.COSMOS_ENDPOINT,
                key: process.env.COSMOS_KEY
            });

            const container =
                cosmosClient.database("mediadb")
                .container("media");

            const { resources } =
                await container.items.readAll().fetchAll();

            return {
                status: 200,
                headers: {
                    "Access-Control-Allow-Origin": "*"
                },
                jsonBody: resources
            };

        } catch (error) {

            return {
                status: 500,
                headers: {
                    "Access-Control-Allow-Origin": "*"
                },
                jsonBody: {
                    error: error.message
                }
            };
        }
    }
});