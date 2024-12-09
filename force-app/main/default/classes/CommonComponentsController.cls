/**
 * Created by mp1863 on 07/12/24.
 */

public with sharing class CommonComponentsController {

    @AuraEnabled(cacheable=true)
    public static List<copado__Release__c> searchReleases(String searchTerm) {
        return [
                SELECT Id, Name
                FROM copado__Release__c
                WHERE Name LIKE :('%' + searchTerm + '%')
                LIMIT 50
        ];
    }

    @AuraEnabled(cacheable=true)
    public static List<copado__Environment__c> searchEnvironments(String searchTerm) {
        return [
                SELECT Id, Name
                FROM copado__Environment__c
                WHERE Name LIKE :('%' + searchTerm + '%')
                LIMIT 50
        ];
    }

    @AuraEnabled
    public static String findCommonComponents(String release1, String release2, String environment1, String environment2) {
        System.debug(release1+'--'+release2+'--'+environment1+'--'+environment2);
        // Get the latest modified Account
        Account latestAccount = [
                SELECT Id
                FROM Account
                ORDER BY LastModifiedDate DESC
                LIMIT 1
        ];

        // Execute queries for the provided releases
        List<copado__User_Story_Metadata__c> query1Results = [
                SELECT Name, copado__Metadata_API_Name__c, copado__Type__c,
                        copado__User_Story__r.copado__Release__r.Name,
                        copado__User_Story__r.copado__Developer__r.Name,
                        copado__User_Story__r.Development_Team__c,
                        copado__User_Story__r.copado__Environment__r.Name,
                        copado__User_Story__r.Name,
                        copado__User_Story__r.copado__Is_Bundle__c
                FROM copado__User_Story_Metadata__c
                WHERE copado__User_Story__r.copado__Release__r.Id = :release1
                AND copado__User_Story__r.copado__Environment__r.Id = :environment1
                AND copado__User_Story__r.copado__Is_Bundle__c = false
        ];

        List<copado__User_Story_Metadata__c> query2Results = [
                SELECT Name, copado__Metadata_API_Name__c, copado__Type__c,
                        copado__User_Story__r.copado__Release__r.Name,
                        copado__User_Story__r.copado__Developer__r.Name,
                        copado__User_Story__r.Development_Team__c,
                        copado__User_Story__r.copado__Environment__r.Name,
                        copado__User_Story__r.Name,
                        copado__User_Story__r.copado__Is_Bundle__c
                FROM copado__User_Story_Metadata__c
                WHERE copado__User_Story__r.copado__Release__r.Id = :release2
                AND copado__User_Story__r.copado__Environment__r.Id = :environment2
                AND copado__User_Story__r.copado__Is_Bundle__c = false
        ];

        // Identify common components
        Set<String> keysInFirstResult = new Set<String>();
        for (copado__User_Story_Metadata__c record : query1Results) {
            keysInFirstResult.add(record.copado__Type__c + '.' + record.copado__Metadata_API_Name__c);
        }
        Set<String> commonKeys = new Set<String>();
        for (copado__User_Story_Metadata__c record : query2Results) {
            String compositeKey = record.copado__Type__c + '.' + record.copado__Metadata_API_Name__c;
            if (keysInFirstResult.contains(compositeKey)) {
                commonKeys.add(compositeKey);
            }
        }
        // Generate CSV content
        List<String> csvLines = new List<String>();
        csvLines.add('copado__Metadata_API_Name__c,copado__Type__c,Developer Name,Release,Team,Environment,User Story,isBundle');

        for (copado__User_Story_Metadata__c record : query1Results) {
            String compositeKey = record.copado__Type__c + '.' + record.copado__Metadata_API_Name__c;
            if (commonKeys.contains(compositeKey)) {
                csvLines.add(formatCsvLine(record));
            }
        }
        System.debug('csvLines size::'+csvLines.size());
        for (copado__User_Story_Metadata__c record : query2Results) {
            String compositeKey = record.copado__Type__c + '.' + record.copado__Metadata_API_Name__c;
            if (commonKeys.contains(compositeKey)) {
                csvLines.add(formatCsvLine(record));
            }
        }

        String csvContent = String.join(csvLines, '\n');

        // Attach CSV to the latest modified Account
        ContentVersion contentVersion = new ContentVersion();
        contentVersion.Title = 'CommonComponentsReport';
        contentVersion.PathOnClient = 'CommonComponentsReport.csv';
        contentVersion.VersionData = Blob.valueOf(csvContent);
        contentVersion.IsMajorVersion = true;
        insert contentVersion;

        ContentDocumentLink cdl = new ContentDocumentLink();
        cdl.LinkedEntityId = latestAccount.Id;
        cdl.ContentDocumentId = [
                SELECT ContentDocumentId
                FROM ContentVersion
                WHERE Id = :contentVersion.Id
        ].ContentDocumentId;
        cdl.ShareType = 'V';
        insert cdl;

        return cdl.ContentDocumentId;
    }

    private static String formatCsvLine(copado__User_Story_Metadata__c record) {
        String name = record.copado__Metadata_API_Name__c;
        String type = record.copado__Type__c;
        String developer = record.copado__User_Story__r.copado__Developer__r != null ? record.copado__User_Story__r.copado__Developer__r.Name : 'N/A';
        String release = record.copado__User_Story__r.copado__Release__r != null ? record.copado__User_Story__r.copado__Release__r.Name : 'N/A';
        String team = record.copado__User_Story__r.Development_Team__c != null ? record.copado__User_Story__r.Development_Team__c : 'N/A';
        String environment = record.copado__User_Story__r.copado__Environment__r != null ? record.copado__User_Story__r.copado__Environment__r.Name : 'N/A';
        String userStory = record.copado__User_Story__r != null ? record.copado__User_Story__r.Name : 'N/A';
        String isBundle = record.copado__User_Story__r != null && record.copado__User_Story__r.copado__Is_Bundle__c != null ? String.valueOf(record.copado__User_Story__r.copado__Is_Bundle__c) : 'N/A';

        return name + ',' + type + ',' + developer + ',' + release + ',' + team + ',' + environment + ',' + userStory + ',' + isBundle;
    }
}