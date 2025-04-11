/**
 * Created by mp1863 on 04/04/25.
 */
@RestResource(urlMapping='/github/eslintWebhook')
global without sharing class GitHubESLintWebhookService {

    @HttpPost
    global static void handleViolationPayload() {
        try {
            String jsonPayload = RestContext.request.requestBody.toString();
            ESLintPayload payload = (ESLintPayload)JSON.deserialize(jsonPayload, ESLintPayload.class);

            ESLintViolationService.processPayload(payload);

            RestContext.response.responseBody = Blob.valueOf('{"status":"success"}');
            RestContext.response.statusCode = 200;
        } catch(Exception e) {
            RestContext.response.responseBody = Blob.valueOf('{"error":"'+e.getMessage()+'"}');
            RestContext.response.statusCode = 500;
        }
    }
}