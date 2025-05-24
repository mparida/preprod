/**
 * Created by manojparida on 23/04/25.
 */
@RestResource(urlMapping='/jenkins/tests/webhook')
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
            String JobStatus = (String) jsonBody.get('JobStatus');
            System.debug('promotionTestId::'+promotionTestId);
            Promotion_Test_Script__c pts = new Promotion_Test_Script__c(Id = promotionTestId);
            if(!String.isEmpty(JobStatus) && JobStatus.equals('SUCCESS')){
                pts.Build__c = Integer.valueOf(jsonBody.get('TestRun'));
                pts.Json_process_time__c = System.now();
            }
            Attachment att = saveJsonAsAttachment(promotionTestId, requestBody);
            List<SObject> sobjList = new List<SObject>();
            sobjList.add(pts);
            sobjList.add(att);
            upsert sobjList;
            res.responseBody = Blob.valueOf('Jenkins Test results stored successfully');
            res.statusCode = 200;
        }catch (Exception e) {
            System.debug('Error processing Webhook: ' + e.getMessage());
            res.statusCode = 500;
            res.responseBody = Blob.valueOf('Error: ' + e.getMessage());
        }
    }

    public static Attachment saveJsonAsAttachment(String parentId, String jsonBody) {
        if (String.isBlank(parentId) || String.isBlank(jsonBody)) {
            System.debug('Missing parentId or jsonBody. Skipping attachment.');
            return null;
        }
        Attachment attachment = new Attachment();
        attachment.ParentId = parentId;
        attachment.Name = 'JenkinsTestWebhookPayload_' + parentId + '.json';
        attachment.ContentType = 'application/json';
        attachment.Body = Blob.valueOf(jsonBody);
        return attachment;
    }
    
    @InvocableMethod(label='Update Promotion Test Script' description='Updates the Promotion_Test_Script__c record based on the latest attachment.')
    public static void updatePromotionTestScript(List<PromotionTestScriptInput> inputs) {
        // Iterate through the provided inputs
        for (PromotionTestScriptInput input : inputs) {
            // Fetch the latest attachment with the specified name prefix for the given record
            Attachment latestAttachment = [
                SELECT Id, Body, Name, CreatedDate
                FROM Attachment
                WHERE ParentId = :input.recordId AND Name LIKE 'JenkinsTestWebhookPayload_%'
                ORDER BY CreatedDate DESC
                LIMIT 1
            ];

            if (latestAttachment != null) {
                // Retrieve the attachment body and deserialize the JSON
                String attachmentBody = latestAttachment.Body.toString();
                Map<String, Object> payload = (Map<String, Object>) JSON.deserializeUntyped(attachmentBody);

                // Perform the update on the Promotion_Test_Script__c record
                Promotion_Test_Script__c pts = [
                    SELECT Id
                    FROM Promotion_Test_Script__c
                    WHERE Id = :input.recordId 
                    ORDER BY CreatedDate DESC 
                    LIMIT 1 
                ];
				System.debug('Setting params');
                pts.Job_Run_Status__c = (String) payload.get('JobStatus');
                pts.Test_Cases__c = Integer.valueOf(payload.get('TestPass'));
                pts.Test_Cases_Failed__c = Integer.valueOf(payload.get('TestFail'));
				System.debug('Updating record');
                update pts;
                System.debug('Updating record successful');
            } else {
                // Log a warning or handle the case where no attachment is found
                System.debug('No attachment found with the specified name prefix for record ID: ' + input.recordId);
            }
        }
    }
    // Define the input class for the invocable method
    public class PromotionTestScriptInput {
        @InvocableVariable(required=true description='ID of the Promotion_Test_Script__c record')
        public Id recordId;
    }
}