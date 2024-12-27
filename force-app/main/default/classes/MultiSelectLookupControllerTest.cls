/**
 * Created by mp1863 on 27/12/24.
 */

/*
 * Test Class for MultiSelectLookupController
 */
@isTest
public class MultiSelectLookupControllerTest {

    @testSetup
    static void setupTestData() {
        // Create Developer profile for test users
        Profile developerProfile = [SELECT Id FROM Profile WHERE Name = 'Developer' LIMIT 1];

        // Create two test users with the Developer profile
        User peerReviewer = TestDataFactory.createTestUser('peer.reviewer@test.com', developerProfile.Id);
        User prApprover = TestDataFactory.createTestUser('pr.approver@test.com', developerProfile.Id);
        insert peerReviewer;
        insert prApprover;
    }
    @isTest
    static void testRetrieveRecords() {
        // Create test data
        List<Account> accounts = new List<Account>();
        for (Integer i = 1; i <= 10; i++) {
            accounts.add(new Account(Name = 'Test Account ' + i));
        }
        insert accounts;
        User peerReviewer = [SELECT Id, Name FROM USer WHERE email = 'peer.reviewer@test.com'];
        User prApprover = [SELECT Id, Name FROM USer WHERE email = 'pr.approver@test.com'];
        // Create copado__Org__c record
        copado__Org__c copadoOrg = new copado__Org__c(
                Name = 'Test Org'
        );
        insert copadoOrg;
        Id copadoOrgId = copadoOrg.Id;

        // Create a parent User Story for cloning
        copado__User_Story__c parentUserStory = new copado__User_Story__c(
                copado__Org_Credential__c = copadoOrgId,
                iTrack_US__c = 'ITrack123',copado__Developer__c = peerReviewer.Id,
                Peer_Reviewer__c = prApprover.Id
        );
        insert parentUserStory;

        List<copado__User_Story_Metadata__c> userStoryMetadataRecords = new List<copado__User_Story_Metadata__c>();
        for (Integer i = 1; i <= 5; i++) {
            userStoryMetadataRecords.add(new copado__User_Story_Metadata__c(copado__Metadata_API_Name__c = 'Test Metadata ' + i, copado__User_Story__c =  parentUserStory.Id));
        }
        insert userStoryMetadataRecords;

        Test.startTest();

        // Test with objectName other than copado__User_Story_Metadata__c
        List<MultiSelectLookupController.SObjectQueryResult> accountResults = MultiSelectLookupController.retrieveRecords('Account', 'Name,Id', 'Name', '*');
        System.assertNotEquals(0, accountResults.size(), 'Expected non-zero results for accounts.');
        System.assertEquals(10, accountResults.size(), 'Expected 10 accounts in the result.');
        System.assertEquals('Test Account 1', accountResults[0].recordName, 'Record name mismatch.');

        // Test with specific input
        accountResults = MultiSelectLookupController.retrieveRecords('Account', 'Name', 'Name', 'Test Account 1');
        System.assertEquals('Test Account 1', accountResults[0].recordName, 'Record name mismatch.');

        // Test with objectName as copado__User_Story_Metadata__c
        List<MultiSelectLookupController.SObjectQueryResult> metadataResults = MultiSelectLookupController.retrieveRecords('copado__User_Story_Metadata__c', 'copado__Metadata_API_Name__c', 'copado__Metadata_API_Name__c', '*');
        System.assertNotEquals(0, metadataResults.size(), 'Expected non-zero results for user story metadata.');
        System.assertEquals(5, metadataResults.size(), 'Expected 5 metadata records in the result.');

        Test.stopTest();
    }
    @isTest
    static void testInvalidObjectName() {
        Test.startTest();

        // Invalid object name should throw an exception
        Boolean exceptionThrown = false;
        try {
            MultiSelectLookupController.retrieveRecords('InvalidObject', 'Name', 'Name', '*');
        } catch (Exception e) {
            exceptionThrown = true;
        }
        System.assert(exceptionThrown, 'Expected exception for invalid object name.');

        Test.stopTest();
    }
}
