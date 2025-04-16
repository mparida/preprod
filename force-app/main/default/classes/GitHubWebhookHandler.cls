/**
 * Created by mp1863 on 18/03/25.
 */

@RestResource(urlMapping='/github/diffWebhook')
global with sharing class GitHubWebhookHandler {
    @HttpPost
    global static void receiveGitDiff() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;

        try {
            String requestBody = req.requestBody.toString();
            System.debug('requestBody:::'+requestBody);
            Map<String, Object> jsonBody = (Map<String, Object>) JSON.deserializeUntyped(requestBody);
            String runId = (String) jsonBody.get('run_id');
            String diffRaw = (String) jsonBody.get('diff');
            Id promotionId = (Id) jsonBody.get('promotionId');

            System.debug('📢 GitHub Webhook Received for promotionId: ' + promotionId);

            // 🔹 Store run_id and diff result
            GitHub_Run__c githubRun = new GitHub_Run__c();
            githubRun.GitHub_Run_Id__c = runId;
            githubRun.Run_Result__c = diffRaw;
            githubRun.Promotion_Id_Text__c = promotionId;
            insert githubRun;

            System.debug('📢 GitHub Webhook Received for Branch: ' + promotionId);
            System.debug('📢 Run ID: ' + runId);
            System.debug('📢 Diff Output: ' + diffRaw);

            res.responseBody = Blob.valueOf('Received Successfully');
            res.statusCode = 200;
        } catch (Exception e) {
            System.debug(e.getStackTraceString());
            System.debug('🔥 Error processing Webhook: ' + e.getMessage());
            res.statusCode = 500;
        }
    }

    @AuraEnabled(Cacheable=true)
    public static GitHub_Run__c getLatestGitHubRun(String promotionId) {
        try {
            // Fetch the latest GitHub_Run__c record linked to the promotion
            List<GitHub_Run__c> runs = [
                    SELECT Id, GitHub_Run_Id__c, Run_Result__c, CreatedDate
                    FROM GitHub_Run__c
                    WHERE Promotion_Id_Text__c = :promotionId
                    ORDER BY CreatedDate DESC
                    LIMIT 1
            ];
            if (!runs.isEmpty()) {
                GitHub_Run__c run = runs[0];
                // 🔹 Remove first line (workflow file)
                if (String.isNotEmpty(run.Run_Result__c)) {
                    List<String> lines = run.Run_Result__c.split('\n');
                    if (!lines.isEmpty()) {
                        lines.remove(0); // Remove the first element
                        lines = getMetadataOnlyFromPromotion(lines, promotionId);
                        run.Run_Result__c = String.join(lines, '\n');
                    }
                }
                return run;
            }
            return null;
        } catch (Exception e) {
            System.debug('🔥 Error fetching GitHub Run data: ' + e.getMessage());
            return null;
        }
    }

    public static List<String> getMetadataOnlyFromPromotion(List<String> lines, String promotionId){
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
        List<String> fileList = new List<String>();
        for(String file : lines){
            System.debug('****FileName**** '+file);
            for(String promotionFile : promotionMetadataMap.keySet()){
                System.debug('#####Promotion File '+promotionFile);
                if(promotionFile.contains('.')){
                    String newPromotionFile = getTextAfterLastDot(promotionFile);
                    String type = promotionMetadataMap.get(promotionFile);
                    promotionMetadataMap.remove(promotionFile);
                    promotionFile = newPromotionFile;
                    promotionMetadataMap.put(newPromotionFile, type);
                }
                if(promotionMetadataMap.get(promotionFile).equalsIgnoreCase('CustomLabel') && file.containsIgnoreCase('CustomLabel')){
                    fileList.add(file);
                }else if(file.containsIgnoreCase(promotionFile)){
                    fileList.add(file);
                }
            }
        }
        return fileList;
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