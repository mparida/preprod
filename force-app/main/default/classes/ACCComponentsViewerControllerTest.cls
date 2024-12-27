/**
 * Created by mp1863 on 27/12/24.
 */

@isTest
public class ACCComponentsViewerControllerTest {

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
    static void testSearchComponents() {
        // Create test data
        Account testAccount = new Account(Name = 'Test Account');
        insert testAccount;

        // Create related User Story Metadata data
        copado__Release__c testRelease = new copado__Release__c(Name = 'Test Release');
        insert testRelease;

        copado__Team__c testTeam = new copado__Team__c(Name = 'Test Team');
        insert testTeam;

        copado__Environment__c testEnvironment = new copado__Environment__c(Name = 'Test Environment');
        insert testEnvironment;

        copado__Epic__c testEpic = new copado__Epic__c(Itrack_Epic__c = 'Test Epic');
        insert testEpic;

        User peerReviewer = [SELECT Id, Name FROM USer WHERE email = 'peer.reviewer@test.com'];
        User prApprover = [SELECT Id, Name FROM USer WHERE email = 'pr.approver@test.com'];
        // Create copado__Org__c record
        copado__User_Story__c testUserStory = new copado__User_Story__c(
                copado__Release__c = testRelease.Id,
                copado__Team__c = testTeam.Id,
                copado__Environment__c = testEnvironment.Id,
                copado__Epic__c = testEpic.Id,
                copado__Is_Bundle__c = false,
                copado__Developer__c = peerReviewer.Id,
                Peer_Reviewer__c = prApprover.Id,
                iTrack_US__c = 'ITrack123'
        );
        insert testUserStory;

        copado__User_Story_Metadata__c testMetadata = new copado__User_Story_Metadata__c(
                copado__Metadata_API_Name__c = 'Test_Metadata_API_Name',
                copado__Type__c = 'CustomField',
                copado__User_Story__c = testUserStory.Id
        );
        insert testMetadata;

        // Create filter map
        Map<String, List<String>> filters = new Map<String, List<String>>();
        filters.put('releaseIds', new List<String>{testRelease.Id});
        filters.put('epicIds', new List<String>{testEpic.Id});
        filters.put('userStoryIds', new List<String>{testUserStory.Id});
        filters.put('componentIds', new List<String>{'Test_Metadata_API_Name'});
        filters.put('developerIds', new List<String>{peerReviewer.Id});
        filters.put('teamIds', new List<String>{testTeam.Id});
        filters.put('environmentIds', new List<String>{testEnvironment.Id});

        // Test the method
        Test.startTest();
        Map<String, List<Map<String, String>>> results = ACCComponentsViewerController.searchComponents(filters);
        Test.stopTest();

        // Assertions
        System.assert(results.containsKey('components'), 'Results should contain components key');
        List<Map<String, String>> componentsList = results.get('components');
        System.assertEquals(1, componentsList.size(), 'There should be exactly one component in the results');

        Map<String, String> component = componentsList[0];
        System.assertEquals('Test_Metadata_API_Name', component.get('Metadata Name'), 'Metadata Name should match');
        System.assertEquals('CustomField', component.get('Metadata Type'), 'Metadata Type should match');
        System.assertEquals(peerReviewer.Name, component.get('Developer'), 'Developer should match');
        System.assertEquals('Test Epic', component.get('Epic'), 'Epic should match');
        System.assertEquals('Test Team', component.get('Team'), 'Team should match');
        System.assertEquals('Test Environment', component.get('Environment'), 'Environment should match');
        System.assertEquals('Test Release', component.get('Release'), 'Release should match');
    }
}
