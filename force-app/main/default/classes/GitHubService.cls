public with sharing class GitHubService {
    @AuraEnabled(cacheable=false)
    public static List<ExternalService.Github_getReposCompareByOwnerAndRepoAndBasex2ex2ex2eHead_OUT_200_files> getGitDiff(Id promotionId, String baseBranch, String headBranch) {
        try {
            copado__Promotion__c promotion = [SELECT copado__Project__r.copado__Deployment_Flow__r.copado__Git_Repository__r.copado__Branch_Base_URL__c,
                    copado__Project__r.copado__Deployment_Flow__c FROM copado__Promotion__c WHERE Id =: promotionId];

            copado__Deployment_Flow_Step__c flowStep = [SELECT copado__Branch__c, copado__Destination_Branch__c FROM copado__Deployment_Flow_Step__c
            WHERE copado__Source_Environment__r.Name =: headBranch AND
            copado__Destination_Environment__r.Name =: baseBranch AND
            copado__Deployment_Flow__c =: promotion.copado__Project__r.copado__Deployment_Flow__c
            ];
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

            Map<String, String> repoMap = extractGitHubDetails(promotion.copado__Project__r.copado__Deployment_Flow__r.copado__Git_Repository__r.copado__Branch_Base_URL__c);
            System.debug(repoMap.get('owner'));
            System.debug(repoMap.get('repo'));
            // Prepare Flow Inputs
            Map<String, Object> inputs = new Map<String, Object>{
                    'Owner' => repoMap.get('owner'),
                    'Repo' => repoMap.get('repo'),
                    'Base_Branch' => flowStep.copado__Destination_Branch__c,
                    'Head_Branch' => flowStep.copado__Branch__c
            };

            // Call Flow
            Flow.Interview flow = Flow.Interview.createInterview('Call_Git_Branch_Diff', inputs);
            flow.start();

            // Get Flow Output: Auto-Generated Apex Class
            ExternalService.Github_getReposCompareByOwnerAndRepoAndBasex2ex2ex2eHead_OUT_200 responseObj =
                    (ExternalService.Github_getReposCompareByOwnerAndRepoAndBasex2ex2ex2eHead_OUT_200) flow.getVariableValue('GitHub_Response');

            // Debugging - Check if response is null
            //System.debug('📢 Flow API Response Object: ' + JSON.serializePretty(responseObj));

            if (responseObj == null || !responseObj.files_set) {
                System.debug('❌ No file differences found.');
                return new List<ExternalService.Github_getReposCompareByOwnerAndRepoAndBasex2ex2ex2eHead_OUT_200_files>();
            }
            List<ExternalService.Github_getReposCompareByOwnerAndRepoAndBasex2ex2ex2eHead_OUT_200_files> fileList =
                    new List<ExternalService.Github_getReposCompareByOwnerAndRepoAndBasex2ex2ex2eHead_OUT_200_files>();
            for(ExternalService.Github_getReposCompareByOwnerAndRepoAndBasex2ex2ex2eHead_OUT_200_files file : responseObj.files){
                System.debug('****FileName**** '+file.filename);
                for(String promotionFile : promotionMetadataMap.keySet()){
                    System.debug('#####Promotion File '+promotionFile);
                    if(promotionFile.contains('.')){
                        String newPromotionFile = getTextAfterLastDot(promotionFile);
                        String type = promotionMetadataMap.get(promotionFile);
                        promotionMetadataMap.remove(promotionFile);
                        promotionFile = newPromotionFile;
                        promotionMetadataMap.put(newPromotionFile, type);
                    }
                    if(promotionMetadataMap.get(promotionFile).equalsIgnoreCase('CustomLabel') && file.filename.containsIgnoreCase('CustomLabel')){
                        fileList.add(file);
                    }else if(file.filename.containsIgnoreCase(promotionFile)){
                        fileList.add(file);
                    }
                }
            }
            for(ExternalService.Github_getReposCompareByOwnerAndRepoAndBasex2ex2ex2eHead_OUT_200_files file : fileList){
                System.debug('Files Name:'+file.filename);
            }

            // Return the list of changed files
            return fileList;//responseObj.files;

        } catch (Exception e) {
            System.debug('🔥 Error calling Flow: ' + e.getStackTraceString());
            throw new UserAccessException('Error retrieving GitHub file differences: ' + e.getMessage());
        }
    }

    public static Map<String, String> extractGitHubDetails(String repoUrl) {
        Map<String, String> result = new Map<String, String>();

        // Validate input
        if (String.isEmpty(repoUrl)) {
            throw new IllegalArgumentException('Invalid GitHub URL');
        }

        try {
            // Regex Pattern to Extract Owner & Repo Name
            Pattern regex = Pattern.compile('github\\.com/([^/]+)/([^/.]+)');
            Matcher matcher = regex.matcher(repoUrl);

            if (matcher.find()) {
                result.put('owner', matcher.group(1)); // Owner (First Group)
                result.put('repo', matcher.group(2));  // Repo Name (Second Group)
            } else {
                throw new IllegalArgumentException('GitHub URL does not match expected pattern');
            }
        } catch (Exception e) {
            System.debug('🔥 Error parsing GitHub URL: ' + e.getMessage());
            throw new IllegalArgumentException('Failed to extract GitHub details');
        }

        return result;
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