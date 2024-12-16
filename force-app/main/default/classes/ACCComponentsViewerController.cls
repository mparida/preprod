public with sharing class ACCComponentsViewerController {
    @AuraEnabled
    public static Map<String, List<SObject>> searchComponents(Map<String, List<String>> filters) {
        Map<String, List<SObject>> results = new Map<String, List<SObject>>();

        // Safely get values from the filters map
        List<String> releaseIds = filters.containsKey('releases') ? filters.get('releases') : new List<String>();
        List<String> epicIds = filters.containsKey('epics') ? filters.get('epics') : new List<String>();
        List<String> userStoryIds = filters.containsKey('userStories') ? filters.get('userStories') : new List<String>();
        List<String> componentIds = filters.containsKey('components') ? filters.get('components') : new List<String>();
        List<String> developerIds = filters.containsKey('developers') ? filters.get('developers') : new List<String>();
        List<String> teamIds = filters.containsKey('teams') ? filters.get('teams') : new List<String>();
        List<String> environmentIds = filters.containsKey('environments') ? filters.get('environments') : new List<String>();

        // Component Results
        String componentQuery = 'SELECT copado__Metadata_API_Name__c, copado__Type__c, copado__User_Story__c, ' +
                'Commit_by_Developer__c, copado__User_Story__r.copado__Epic__c, ' +
                'copado__User_Story__r.Development_Team__c ' +
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

        List<copado__User_Story_Metadata__c> componentResults = Database.query(componentQuery);
        results.put('components', componentResults);

        // Azure Results
        String azureQuery = 'SELECT copado__Environment__c, copado__View_in_Git__c, Name, ' +
                '(SELECT copado__Promotion__r.copado__Source_Environment__c, ' +
                'copado__Promotion__r.copado__Destination_Environment__c, ' +
                'copado__Promotion__r.copado__View_in_Git__c ' +
                'FROM copado__Promoted_User_Stories__r WHERE copado__Promotion__r.copado__Status__c = \'Completed\') ' +
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
            azureQuery += ' AND Commit_by_Developer__c IN :developerIds';
        }
        if (!teamIds.isEmpty()) {
            azureQuery += ' AND Development_Team__c IN :teamIds';
        }
        if (!environmentIds.isEmpty()) {
            azureQuery += ' AND copado__Environment__c IN :environmentIds';
        }

        List<copado__User_Story__c> azureResults = Database.query(azureQuery);
        results.put('azure', azureResults);

        return results;
    }
}
