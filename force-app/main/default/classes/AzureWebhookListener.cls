/**
 * Created by manojparida on 08/01/25.
 */

@RestResource(urlMapping='/azure/webhook')
global with sharing class AzureWebhookListener {
    @HttpPost
    global static void handleWebhook() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;

        try {
            // Extract the API key from query parameters
            String receivedApiKey = req.params.get('api_key');
            System.debug('Received API Key: ' + receivedApiKey);

            // Validate the API key
            String expectedApiKey = 'e7c21b4a-78b9-478b-9f6a-13ab45d1e21f';
            if (String.isEmpty(receivedApiKey) || receivedApiKey != expectedApiKey) {
                res.statusCode = 403;
                res.responseBody = Blob.valueOf('{"status": "error", "message": "Forbidden: Invalid API key"}');
                return;
            }

            // Process the request body
            String requestBody = req.requestBody.toString();
            System.debug('Request Body: ' + requestBody);

            // Respond with success
            res.statusCode = 200;
            res.responseBody = Blob.valueOf('{"status": "success"}');
        } catch (Exception e) {
            System.debug('Error: ' + e.getMessage());
            res.statusCode = 500;
            res.responseBody = Blob.valueOf('{"status": "error", "message": "' + e.getMessage() + '"}');
        }
    }
}