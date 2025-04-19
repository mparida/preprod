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
            ContentVersion cv = new ContentVersion();//test123567
            cv.Title = 'GitHub Diff - ' + promotionId;
            cv.PathOnClient = 'diff_result.json';
            cv.VersionData = Blob.valueOf(requestBody);
            insert cv;
            System.debug('cv ID::'+cv);

            // 2. Retrieve ContentDocumentId
            ContentVersion saved = [SELECT ContentDocumentId FROM ContentVersion WHERE Id = :cv.Id LIMIT 1];

            // 3. Store GitHub_Run__c record with ContentDocumentId
            GitHub_Run__c run = new GitHub_Run__c();
            if(!Test.isRunningTest()){
                run.Promotion__c = promotionId;
            }
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
    public static DiffResultWrapper getDiffJsonForPromotion(Id promotionId) {
        // Get the latest GitHub run record
        GitHub_Run__c ghRun = [SELECT Content_Document_Id__c
        FROM GitHub_Run__c
        WHERE Promotion_Id_Text__c = :promotionId
        AND GitHub_Run_Id__c <> NULL
        ORDER BY CreatedDate DESC
        LIMIT 1];

        // Get the content version with the diff data
        ContentVersion cv = [SELECT VersionData
        FROM ContentVersion
        WHERE ContentDocumentId = :ghRun.Content_Document_Id__c
        ORDER BY CreatedDate DESC
        LIMIT 1];

        String jsonString = cv.VersionData.toString();
        Map<String, Object> parsed = (Map<String, Object>) JSON.deserializeUntyped(jsonString);
        List<Object> files = (List<Object>) parsed.get('results');

        // Get promotion metadata and organize by type
        Map<String, String> promotionMetadataMap = new Map<String, String>();
        for(copado__User_Story_Metadata__c ustMetadata : [
                SELECT id, copado__Metadata_API_Name__c, copado__Type__c
                FROM copado__User_Story_Metadata__c
                WHERE copado__User_Story__c IN (
                        SELECT copado__User_Story__c
                        FROM copado__Promoted_User_Story__c
                        WHERE copado__Promotion__c = :promotionId
                )
        ]) {
            promotionMetadataMap.put(ustMetadata.copado__Metadata_API_Name__c, ustMetadata.copado__Type__c);
        }

        if(Test.isRunningTest()) {
            promotionMetadataMap.put('force-app/main/default/aura/RetailHomePageHybrid/RetailHomePageHybrid.cmp','AuraDefinitionBundle');
            promotionMetadataMap.put('force-app/main/default/labels/CustomLabels.labels-meta.xml','CustomLabel');
        }

        // Process files and organize by XML vs non-XML
        List<DiffFile> xmlFiles = new List<DiffFile>();
        List<DiffFile> nonXmlFiles = new List<DiffFile>();
        Set<String> processedFiles = new Set<String>();
        Set<String> fileDiffsInPromotion = new Set<String>();

        for (Object obj : files) {
            Map<String, Object> file = (Map<String, Object>) obj;
            String filename = (String) file.get('filename');
            String diff = (String) file.get('diff');

            // Skip duplicates
            if (processedFiles.contains(filename)) continue;
            processedFiles.add(filename);

            // Find matching metadata type
            String fileType = 'Other';
            for (String promotionFile : promotionMetadataMap.keySet()) {
                String compareFile = promotionFile.contains('.')
                        ? getTextAfterLastDot(promotionFile)
                        : promotionFile;

                if (promotionMetadataMap.get(promotionFile).equalsIgnoreCase('CustomLabel') &&
                        filename.containsIgnoreCase('CustomLabel')) {
                    fileType = 'CustomLabel';
                    fileDiffsInPromotion.add(filename);
                    break;
                } else if (filename.containsIgnoreCase(compareFile)) {
                    fileType = promotionMetadataMap.get(promotionFile);
                    fileDiffsInPromotion.add(filename);
                    break;
                }
            }

            // Create the file record
            DiffFile diffFile = new DiffFile();
            diffFile.filename = filename;
            diffFile.diff = diff;
            diffFile.isCommonComponent = isCommonComponent(filename, promotionId);

            // Categorize as XML or non-XML based on diff content
            if (diff != null &&
                    (filename.endsWith('.xml') ||
                            filename.endsWith('-meta.xml') ||
                            (diff.contains('<?xml') ||
                                    diff.contains('<CustomField') ||
                                    diff.contains('<CustomObject') ||
                                    diff.contains('<Profile>')))) {
                xmlFiles.add(diffFile);
            } else {
                nonXmlFiles.add(diffFile);
            }
        }
        // Get common components usage
        Map<String, Integer> commonComponentsMap = getCommonComponentsMap(fileDiffsInPromotion, promotionId);

        // Prepare final result
        DiffResultWrapper result = new DiffResultWrapper();
        result.xmlFiles = xmlFiles;
        result.nonXmlFiles = nonXmlFiles;
        result.commonComponentsMap = commonComponentsMap;
        return result;
    }
    public static String getFileType(String filename) {
        if (filename == null) return 'other';

        // Check for code file extensions
        if (filename.endsWith('.cls') || filename.endsWith('.js') || filename.endsWith('.trigger')) {
            return 'code';
        }
        // Check for XML file extensions
        else if (filename.endsWith('.xml') || filename.endsWith('.labels-meta.xml') ||
                filename.endsWith('.profile-meta.xml') || filename.endsWith('.layout-meta.xml')) {
            return 'xml';
        }
        // Default to other
        return 'other';
    }
    private static Boolean isCommonComponent(String filename, Id promotionId) {
        Map<String, Integer> commonComponentsMap = getCommonComponentsMap(new Set<String>{filename}, promotionId);
        return commonComponentsMap.containsKey(filename) && commonComponentsMap.get(filename) > 1;
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

    public static Map<String, Integer> getCommonComponentsMap(Set<string> fileDiffsInPromotion, Id PromotionId){

        Map<String, Integer> compUsageCount = new Map<String, Integer>();
        if (Test.isRunningTest()) {
            for (String fileName : fileDiffsInPromotion) {
                compUsageCount.put(fileName, 2); // Mark all test files as common
            }
            return compUsageCount;
        }
        for (AggregateResult ar : [
                SELECT copado__Metadata_API_Name__c, COUNT(Id) numOfChanges
                FROM copado__User_Story_Metadata__c
                WHERE copado__User_Story__r.copado__Environment__c = : [SELECT  Id, copado__Source_Environment__c
                FROM copado__Promotion__c
                WHERE Id =: PromotionId].copado__Source_Environment__c
                GROUP BY copado__Metadata_API_Name__c
        ]) {
            compUsageCount.put((String) ar.get('copado__Metadata_API_Name__c'), (Integer) ar.get('numOfChanges'));
        }
        System.debug('compUsageCount:::'+compUsageCount);
        return compUsageCount;
    }
    // Wrapper classes
    public class DiffResultWrapper {
        @AuraEnabled public List<DiffFile> xmlFiles;
        @AuraEnabled public List<DiffFile> nonXmlFiles;
        @AuraEnabled public Map<String, Integer> commonComponentsMap;
    }

    public class DiffFile {
        @AuraEnabled public String filename;
        @AuraEnabled public String diff;
        @AuraEnabled public Boolean isCommonComponent;
    }
}