/**
 * Created by manojparida on 20/05/25.
 */
@RestResource(urlMapping='/aitap/tests/webhook')
global without sharing class AiTapWebhookHandler {
    
    @HttpPost
    global static void receiveJenkinsJobStatus() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        try {
            String requestBody = req.requestBody.toString();
            System.debug('Request from AiTap Github action >>'+requestBody);
            //Map<String, Object> jsonBody = (Map<String, Object>) JSON.deserializeUntyped(requestBody);
            //String promotionTestId = (String) jsonBody.get('promotionTestId');
            res.responseBody = Blob.valueOf('AiTap Github action triggered successfully');
            res.statusCode = 200;
        }catch (Exception e) {
            System.debug('Error processing Webhook: ' + e.getMessage());
            res.statusCode = 500;
            res.responseBody = Blob.valueOf('Error: ' + e.getMessage());
        }
    }

}