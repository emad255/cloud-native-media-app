const { app } = require('@azure/functions');
const { BlobServiceClient } = require("@azure/storage-blob");
const { CosmosClient } = require("@azure/cosmos");

app.http('uploadMedia', {
    methods: ['POST', 'OPTIONS'],
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

            const body = await request.json();

            const blobServiceClient =
                BlobServiceClient.fromConnectionString(
                    process.env.AzureWebJobsStorage
                );

            const containerClient =
                blobServiceClient.getContainerClient("media");

            const fileName = body.name;

            const fileContent =
                Buffer.from(body.content, "base64");

            const blockBlobClient =
                containerClient.getBlockBlobClient(fileName);

            await blockBlobClient.uploadData(fileContent);

            const cosmosClient = new CosmosClient({
                endpoint: process.env.COSMOS_ENDPOINT,
                key: process.env.COSMOS_KEY
            });

            const container =
                cosmosClient.database("mediadb")
                .container("media");

            const item = {
                id: fileName,
                url: blockBlobClient.url,
                timestamp: new Date()
            };

            await container.items.create(item);

            return {
                status: 200,
                headers: {
                    "Access-Control-Allow-Origin": "*"
                },
                jsonBody: item
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