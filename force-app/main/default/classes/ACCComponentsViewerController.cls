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
                'Commit_by_Developer__c, copado__User_Story__r.copado__Epic__r.name, ' +
                'copado__User_Story__r.copado__Team__r.name ' +
                'FROM copado__User_Story_Metadata__c WHERE Id != NULL';
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
            componentQuery += ' AND Id IN :componentIds';
        }
        if (!developerIds.isEmpty()) {
            componentQuery += ' AND Commit_by_Developer__c IN :developerIds';
        }
        if (!teamIds.isEmpty()) {
            componentQuery += ' AND copado__User_Story__r.Development_Team__c IN :teamIds';
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
                    'copado__Metadata_API_Name__c' => component.copado__Metadata_API_Name__c,
                    'copado__Type__c' => component.copado__Type__c,
                    'copado__User_Story__r.name' => component.copado__User_Story__r != null ? component.copado__User_Story__r.Name : 'N/A',
                    'Commit_by_developer__c' => component.Commit_by_developer__c,
                    'copado__User_Story__r.copado__Epic__r.name' => component.copado__User_Story__r != null && component.copado__User_Story__r.copado__Epic__r != null ? component.copado__User_Story__r.copado__Epic__r.Name : 'N/A',
                    'copado__User_Story__r.copado__Team__r.Name' => component.copado__User_Story__r != null ? component.copado__User_Story__r.copado__Team__r.Name : 'N/A'
            };
            componentsListMap.add(rowData);
        }
        results.put('components', componentsListMap);
        // *********************************Azure Results**********************************************************************************
        String azureQuery = 'SELECT copado__Environment__r.Name, copado__View_in_Git__c, Name, ' +
                '(SELECT copado__Promotion__r.copado__Source_Environment__c, ' +
                'copado__Promotion__r.name, ' +
                'copado__Promotion__r.copado__Destination_Environment__c, ' +
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
            azureQuery += ' AND Development_Team__c IN :teamIds';
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
                    azure.copado__View_in_Git__c : null);
            rowData.put('featureBranchLabel', azure.copado__View_in_Git__c != null ?
                    'feature/' + azure.Name : 'N/A');

            if (azure.copado__Promoted_User_Stories__r != null) {
                for (copado__Promoted_User_Story__c promotedUserStory : azure.copado__Promoted_User_Stories__r) {
                    if (promotedUserStory.copado__Promotion__r != null) {
                        rowData.put('copado__Promotion__r.Name', promotedUserStory.copado__Promotion__r.Name);
                        rowData.put('SourceEnv', promotedUserStory.copado__Promotion__r.copado__Source_Environment__c);
                        rowData.put('DestinationEnv', promotedUserStory.copado__Promotion__r.copado__Destination_Environment__c);
                        rowData.put('PromotionBranch', promotedUserStory.copado__Promotion__r.copado__View_in_Git__c);
                    }
                }
            }
            azuresListMap.add(rowData);
        }
        results.put('azureBranches', azuresListMap);

        return results;
    }
}