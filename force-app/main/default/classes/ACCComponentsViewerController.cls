public with sharing class ACCComponentsViewerController {
    @AuraEnabled
    public static Map<String, List<Map<String, String>>> searchComponents(Map<String, List<String>> filters) {
        Map<String, List<Map<String, String>>> results = new Map<String, List<Map<String, String>>>();
        // Safely get values from the filters map
        List<String> releaseIds = filters.containsKey('releaseIds') ? filters.get('releaseIds') : new List<String>();
        List<String> epicIds = filters.containsKey('epicIds') ? filters.get('epicIds') : new List<String>();
        List<String> userStoryIds = filters.containsKey('userStoryIds') ? filters.get('userStoryIds') : new List<String>();
        List<String> componentIds = filters.containsKey('componentIds') ? filters.get('componentIds') : new List<String>();
        List<String> developerIds = filters.containsKey('developerIds') ? filters.get('developerIds') : new List<String>();
        List<String> teamIds = filters.containsKey('teamIds') ? filters.get('teamIds') : new List<String>();
        List<String> environmentIds = filters.containsKey('environmentIds') ? filters.get('environmentIds') : new List<String>();
        System.debug('releaseIds>>'+releaseIds);
        // Component Results
        String componentQuery = 'SELECT copado__Metadata_API_Name__c, copado__Type__c, copado__User_Story__r.name, ' +
                'copado__User_Story__r.copado__Developer__r.Name, copado__User_Story__r.copado__Epic__r.Itrack_Epic__c, copado__User_Story__r.copado__Environment__r.Name, ' +
                'copado__User_Story__r.copado__Team__r.name , copado__User_Story__r.copado__Release__r.Name ' +
                'FROM copado__User_Story_Metadata__c WHERE Id != NULL AND copado__User_Story__r.copado__Is_Bundle__c = FALSE ';
        if (!releaseIds.isEmpty()) {
            componentQuery += ' AND copado__User_Story__r.copado__Release__c IN :releaseIds';
        }
        if (!epicIds.isEmpty()) {
            componentQuery += ' AND copado__User_Story__r.copado__Epic__c IN :epicIds';
        }
        if (!userStoryIds.isEmpty()) {
            componentQuery += ' AND copado__User_Story__c IN :userStoryIds';
        }
        if (!componentIds.isEmpty()) {
            componentQuery += ' AND copado__Metadata_API_Name__c IN :componentIds';
        }
        if (!developerIds.isEmpty()) {
            componentQuery += ' AND copado__User_Story__r.copado__Developer__c IN :developerIds';
        }
        if (!teamIds.isEmpty()) {
            componentQuery += ' AND copado__User_Story__r.copado__Team__c IN :teamIds';
        }
        if (!environmentIds.isEmpty()) {
            componentQuery += ' AND copado__User_Story__r.copado__Environment__c IN :environmentIds';
        }
        componentQuery+= ' LIMIT 50000';
        System.debug('componentQuery:::'+componentQuery);
        List<copado__User_Story_Metadata__c> componentResults = Database.query(componentQuery);

        List<Map<String, String>> componentsListMap = new List<Map<String, String>>();
        for (copado__User_Story_Metadata__c component : componentResults) {
            Map<String, String> rowData = new Map<String, String>{
                    'Metadata Name' => component.copado__Metadata_API_Name__c,
                    'Metadata Type' => component.copado__Type__c,
                    'User Story' => component.copado__User_Story__r != null ? component.copado__User_Story__r.Name : 'N/A',
                    'Developer' => component.copado__User_Story__r.copado__Developer__r.Name,
                    'Epic' => component.copado__User_Story__r != null && component.copado__User_Story__r.copado__Epic__r != null ? component.copado__User_Story__r.copado__Epic__r.Itrack_Epic__c : 'N/A',
                    'Team' => component.copado__User_Story__r != null ? component.copado__User_Story__r.copado__Team__r.Name : 'N/A',
                    'Environment' => component.copado__User_Story__r.copado__Environment__r != null ? component.copado__User_Story__r.copado__Environment__r.Name : 'N/A',
                    'Release' => component.copado__User_Story__r.copado__Release__r != null ? component.copado__User_Story__r.copado__Release__r.Name : 'N/A'
            };
            componentsListMap.add(rowData);
        }
        results.put('components', componentsListMap);
        // *********************************Azure Results**********************************************************************************
        /*String azureQuery = 'SELECT copado__Environment__r.Name, copado__View_in_Git__c, Name, ' +
                '(SELECT copado__Promotion__r.Source_Env__c, ' +
                'copado__Promotion__r.name, ' +
                'copado__Promotion__r.Destination_Env__c, ' +
                'copado__Promotion__r.copado__View_in_Git__c ' +
                'FROM copado__Promoted_User_Stories__r WHERE copado__Promotion__r.copado__Status__c = \'Completed\')' +
                'FROM copado__User_Story__c WHERE Id != NULL';
        if (!releaseIds.isEmpty()) {
            azureQuery += ' AND copado__Release__c IN :releaseIds';
        }
        if (!epicIds.isEmpty()) {
            azureQuery += ' AND copado__Epic__c IN :epicIds';
        }
        if (!userStoryIds.isEmpty()) {
            azureQuery += ' AND Id IN :userStoryIds';
        }
        if (!developerIds.isEmpty()) {
            azureQuery += ' AND copado__Developer__c IN :developerIds';
        }
        if (!teamIds.isEmpty()) {
            azureQuery += ' AND copado__Team__c IN :teamIds';
        }
        if (!environmentIds.isEmpty()) {
            azureQuery += ' AND copado__Environment__c IN :environmentIds';
        }
        azureQuery+=' LIMIT 50000';
        System.debug('Azure Query :: '+azureQuery);
        List<copado__User_Story__c> azureResults = Database.query(azureQuery);

        List<Map<String, String>> azuresListMap = new List<Map<String, String>>();
        for (copado__User_Story__c azure : azureResults) {
            Map<String, String> rowData = new Map<String, String>{
                    'Name' => azure.Name,
                    'copado__Environment__c' => azure.copado__Environment__r != null ? azure.copado__Environment__r.Name : 'N/A'
            };
            rowData.put('featureBranchUrl', azure.copado__View_in_Git__c != null ?
                    System.Label.AzureUrl+'feature/'+azure.Name: null);
            rowData.put('featureBranchLabel', azure.copado__View_in_Git__c != null ?
                    'feature/' + azure.Name : 'N/A');

            if (azure.copado__Promoted_User_Stories__r != null) {
                for (copado__Promoted_User_Story__c promotedUserStory : azure.copado__Promoted_User_Stories__r) {
                    if (promotedUserStory.copado__Promotion__r != null) {
                        rowData.put('Promotion Name', promotedUserStory.copado__Promotion__r.Name);
                        rowData.put('SourceEnv', promotedUserStory.copado__Promotion__r.Source_Env__c);
                        rowData.put('DestinationEnv', promotedUserStory.copado__Promotion__r.Destination_Env__c);
                        rowData.put('PromotionBranchUrl', promotedUserStory.copado__Promotion__r.copado__View_in_Git__c != null ?
                                System.Label.AzureUrl+'promotion/'+promotedUserStory.copado__Promotion__r.Name: null);
                        rowData.put('PromotionBranchLabel', promotedUserStory.copado__Promotion__r.copado__View_in_Git__c != null ?
                                'promotion/' + promotedUserStory.copado__Promotion__r.Name : 'N/A');
                    }
                }
            }
            azuresListMap.add(rowData);
        }
        results.put('azureBranches', azuresListMap);*/

        return results;
    }
}