/**
 * Created by manojparida on 23/04/25.
 */
@RestResource(urlMapping='/jenkins/tests/webook')
global without sharing class JenkinsWebhookHandler {

    @HttpPost
    global static void receiveJenkinsJobStatus() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        try {
            String requestBody = req.requestBody.toString();
            System.debug('Request >>'+requestBody);
            Map<String, Object> jsonBody = (Map<String, Object>) JSON.deserializeUntyped(requestBody);
            String promotionTestId = (String) jsonBody.get('promotionTestId');
            System.debug('promotionTestId::'+promotionTestId);
            res.responseBody = Blob.valueOf('Jenkins Test results stored successfully');
            res.statusCode = 200;
        }catch (Exception e) {
            System.debug('Error processing Webhook: ' + e.getMessage());
            res.statusCode = 500;
            res.responseBody = Blob.valueOf('Error: ' + e.getMessage());
        }
    }
}