const { app } = require('@azure/functions');
const { BlobServiceClient } = require("@azure/storage-blob");
const { CosmosClient } = require("@azure/cosmos");

app.http('deleteMedia', {
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

            const id = request.query.get('id');

            const blobServiceClient =
                BlobServiceClient.fromConnectionString(
                    process.env.AzureWebJobsStorage
                );

            const containerClient =
                blobServiceClient.getContainerClient("media");

            await containerClient.deleteBlob(id);

            const cosmosClient = new CosmosClient({
                endpoint: process.env.COSMOS_ENDPOINT,
                key: process.env.COSMOS_KEY
            });

            const container =
                cosmosClient.database("mediadb")
                .container("media");

            await container.item(id, id).delete();

            return {
                status: 200,
                headers: {
                    "Access-Control-Allow-Origin": "*"
                },
                jsonBody: {
                    message: "Deleted successfully"
                }
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