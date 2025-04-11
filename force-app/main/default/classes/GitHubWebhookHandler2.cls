/**
 * Created by mp1863 on 22/03/25.
 */
@RestResource(urlMapping='/github/diffWebhook2')
global without sharing class GitHubWebhookHandler2 {
    @HttpPost
    global static void receiveGitDiff() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;

        try {
            String requestBody = req.requestBody.toString();
            System.debug('Request >>'+requestBody);
            Map<String, Object> jsonBody = (Map<String, Object>) JSON.deserializeUntyped(requestBody);

            String promotionId = (String) jsonBody.get('promotionId');

            // 1. Store Full Diff JSON as ContentVersion
            ContentVersion cv = new ContentVersion();
            cv.Title = 'GitHub Diff - ' + promotionId;
            cv.PathOnClient = 'diff_result.json';
            cv.VersionData = Blob.valueOf(requestBody);
            insert cv;
            System.debug('cv ID::'+cv);

            // 2. Retrieve ContentDocumentId
            ContentVersion saved = [SELECT ContentDocumentId FROM ContentVersion WHERE Id = :cv.Id LIMIT 1];

            // 3. Store GitHub_Run__c record with ContentDocumentId
            GitHub_Run__c run = new GitHub_Run__c();
            run.Promotion_Id_Text__c = promotionId;
            run.GitHub_Run_Id__c = (String) jsonBody.get('run_id');
            run.Content_Document_Id__c = saved.ContentDocumentId;
            insert run;

            res.responseBody = Blob.valueOf('GitHub diff stored successfully');
            res.statusCode = 200;

        } catch (Exception e) {
            System.debug('Error processing Webhook: ' + e.getMessage());
            res.statusCode = 500;
            res.responseBody = Blob.valueOf('Error: ' + e.getMessage());
        }
    }

    /* Utility method to get the parsed diff JSON from latest GitHub_Run__c using Promotion ID */
    @AuraEnabled(cacheable=true)
    public static List<Map<String, String>> getDiffJsonForPromotion(Id promotionId) {
        GitHub_Run__c run = [
                SELECT Content_Document_Id__c
                FROM GitHub_Run__c
                WHERE Promotion_Id_Text__c = :promotionId
                AND GitHub_Run_Id__c <> NULL
                ORDER BY CreatedDate DESC
                LIMIT 1
        ];

        ContentVersion cv = [
                SELECT VersionData
                FROM ContentVersion
                WHERE ContentDocumentId = :run.Content_Document_Id__c
                ORDER BY CreatedDate DESC
                LIMIT 1
        ];

        String jsonString = cv.VersionData.toString();
        Map<String, Object> parsed = (Map<String, Object>) JSON.deserializeUntyped(jsonString);
        List<Object> files = (List<Object>) parsed.get('results');

        Map<String, String> promotionMetadataMap = new Map<String, String>();
        for(copado__User_Story_Metadata__c ustMetadata :
        [SELECT id, copado__Metadata_API_Name__c, copado__Type__c from copado__User_Story_Metadata__c
        WHERE copado__User_Story__c IN (Select copado__User_Story__c
        FROM copado__Promoted_User_Story__c WHERE copado__Promotion__c = : promotionId)]
        ){
            if(!promotionMetadataMap.containsKey(ustMetadata.copado__Metadata_API_Name__c)){
                promotionMetadataMap.put(ustMetadata.copado__Metadata_API_Name__c, ustMetadata.copado__Type__c);
            }
        }
        if(Test.isRunningTest()){//Since we cant create promotion record in Test class due to managed package issues
            promotionMetadataMap.put('force-app/main/default/aura/RetailHomePageHybrid/RetailHomePageHybrid.cmp','AuraDefinitionBundle');
            promotionMetadataMap.put('force-app/main/default/labels/CustomLabels.labels-meta.xml','CustomLabel');
        }

        // Step 3: Now safely iterate
        List<Map<String, String>> results = new List<Map<String, String>>();
        List<String> lines = new List<String>();
        for (Object obj : files) {
            Map<String, Object> file = (Map<String, Object>) obj;
            Map<String, String> formatted = new Map<String, String>();
            formatted.put('filename', (String) file.get('filename'));
            lines.add((String) file.get('filename'));
            formatted.put('diff', (String) file.get('diff'));
            results.add(formatted);
        }
        List<Map<String, String>> results1 = new List<Map<String, String>>();
        for(Map<String, String> formatted : results){
            System.debug('****FileName**** '+formatted);
            for(String promotionFile : promotionMetadataMap.keySet()){
                System.debug('#####Promotion File '+promotionFile);
                if(promotionFile.contains('.')){
                    String newPromotionFile = getTextAfterLastDot(promotionFile);
                    String type = promotionMetadataMap.get(promotionFile);
                    promotionMetadataMap.remove(promotionFile);
                    promotionFile = newPromotionFile;
                    promotionMetadataMap.put(newPromotionFile, type);
                }
                if(promotionMetadataMap.get(promotionFile).equalsIgnoreCase('CustomLabel') && formatted.get('filename').containsIgnoreCase('CustomLabel')){
                    results1.add(formatted);
                }else if(formatted.get('filename').containsIgnoreCase(promotionFile)){
                    results1.add(formatted);
                }
            }
        }

        return results1;
    }

    public static String getTextAfterLastDot(String metadataName) {
        if (String.isEmpty(metadataName)) {
            return null;
        }
        Integer lastDotIndex = metadataName.lastIndexOf('.');
        if (lastDotIndex == -1) {
            return metadataName; // No dot found, return original string
        }
        return metadataName.substring(lastDotIndex + 1);
    }
}