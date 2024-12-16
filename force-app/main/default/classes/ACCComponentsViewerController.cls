/**
 * Created by mp1863 on 09/12/24.
 */
public with sharing class ACCComponentsViewerController {

    @AuraEnabled(cacheable=true)
    public static List<sObject> fetchLookupRecords(String objectName, String searchTerm) {
        if (String.isEmpty(objectName) || String.isEmpty(searchTerm)) {
            throw new IllegalArgumentException('Object name and search term cannot be empty.');
        }

        // Dynamic SOQL for fetching lookup records
        String query = 'SELECT Id, Name FROM ' + String.escapeSingleQuotes(objectName) +
                ' WHERE Name LIKE :searchTerm ORDER BY Name ASC LIMIT 50';
        searchTerm = '%' + searchTerm + '%';
        return Database.query(query);
    }

    @AuraEnabled
    public static Map<String, List<Map<String, Object>>> searchComponents(Map<String, List<String>> filters) {
        if (filters == null || filters.isEmpty()) {
            throw new IllegalArgumentException('Filters cannot be empty.');
        }

        // Extract filters with default handling
        List<String> releaseIds = filters.containsKey('releases') ? filters.get('releases') : new List<String>();
        List<String> epicIds = filters.containsKey('epics') ? filters.get('epics') : new List<String>();
        List<String> userStoryIds = filters.containsKey('userStories') ? filters.get('userStories') : new List<String>();
        List<String> metadataIds = filters.containsKey('metadata') ? filters.get('metadata') : new List<String>();
        List<String> developerIds = filters.containsKey('developers') ? filters.get('developers') : new List<String>();
        List<String> teamIds = filters.containsKey('teams') ? filters.get('teams') : new List<String>();
        List<String> environmentIds = filters.containsKey('environments') ? filters.get('environments') : new List<String>();

        // Fetch components and Azure branch details
        List<Map<String, Object>> componentsResults = fetchComponentsData(releaseIds, epicIds, userStoryIds, metadataIds, developerIds, teamIds);
        List<Map<String, Object>> azureBranchesResults = fetchAzureBranchesData(userStoryIds, environmentIds);

        // Return results
        return new Map<String, List<Map<String, Object>>>{
                'components' => componentsResults,
                'azureBranches' => azureBranchesResults
        };
    }

    private static List<Map<String, Object>> fetchComponentsData(
            List<String> releaseIds,
            List<String> epicIds,
            List<String> userStoryIds,
            List<String> metadataIds,
            List<String> developerIds,
            List<String> teamIds
    ) {
        String query = 'SELECT ' +
                'copado__Metadata_API_Name__c, copado__Type__c, ' +
                'copado__User_Story__r.Name, copado__User_Story__r.Commit_by_Developer__c, ' +
                'copado__User_Story__r.copado__Epic__r.Name, copado__User_Story__r.Development_Team__c ' +
                'FROM copado__User_Story_Metadata__c WHERE copado__Is_Bundle__c = false';

        // Add filters dynamically
        if (!releaseIds.isEmpty()) {
            query += ' AND copado__User_Story__r.copado__Release__c IN :releaseIds';
        }
        if (!epicIds.isEmpty()) {
            query += ' AND copado__User_Story__r.copado__Epic__c IN :epicIds';
        }
        if (!userStoryIds.isEmpty()) {
            query += ' AND copado__User_Story__c IN :userStoryIds';
        }
        if (!metadataIds.isEmpty()) {
            query += ' AND Id IN :metadataIds';
        }
        if (!developerIds.isEmpty()) {
            query += ' AND copado__User_Story__r.Commit_by_Developer__c IN :developerIds';
        }
        if (!teamIds.isEmpty()) {
            query += ' AND copado__User_Story__r.Development_Team__c IN :teamIds';
        }

        // Execute query and map results
        List<copado__User_Story_Metadata__c> records = Database.query(query);
        List<Map<String, Object>> results = new List<Map<String, Object>>();

        for (copado__User_Story_Metadata__c record : records) {
            results.add(new Map<String, Object>{
                    'ComponentName' => record.copado__Metadata_API_Name__c,
                    'ComponentType' => record.copado__Type__c,
                    'UserStory' => record.copado__User_Story__r != null ? record.copado__User_Story__r.Name : 'N/A',
                    'Developer' => record.copado__User_Story__r != null ? record.copado__User_Story__r.Name : 'N/A',
                    'Epic' => record.copado__User_Story__r != null && record.copado__User_Story__r.copado__Epic__r != null ? record.copado__User_Story__r.copado__Epic__r.Name : 'N/A',
                    'Team' => record.copado__User_Story__r != null ? record.copado__User_Story__r.Development_Team__c : 'N/A'
            });
        }

        return results;
    }

    private static List<Map<String, Object>> fetchAzureBranchesData(List<String> userStoryIds, List<String> environmentIds) {
        String query = 'SELECT ' +
                'Name, copado__View_in_Git__c, copado__Environment__c ' +
                'FROM copado__User_Story__c WHERE copado__Is_Bundle__c = false';

        // Add filters dynamically
        if (!userStoryIds.isEmpty()) {
            query += ' AND Id IN :userStoryIds';
        }
        if (!environmentIds.isEmpty()) {
            query += ' AND copado__Environment__c IN :environmentIds';
        }

        // Execute query and map results
        List<copado__User_Story__c> records = Database.query(query);
        List<Map<String, Object>> results = new List<Map<String, Object>>();

        for (copado__User_Story__c record : records) {
            results.add(new Map<String, Object>{
                    'UserStory' => record.Name,
                    'FeatureBranch' => record.copado__View_in_Git__c,
                    'Environment' => record.copado__Environment__c
            });
        }

        return results;
    }
}
