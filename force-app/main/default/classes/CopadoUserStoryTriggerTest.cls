/**
 * Created by mp1863 on 06/12/24.
 */

/* Test class for CopadoUserStoryTrigger using built-in clone() method */
@isTest
public class CopadoUserStoryTriggerTest {

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
    public static void testPerformUSTVersioningUsingClone() {
        Test.startTest();

        User peerReviewer = [SELECT Id, Name FROM USer WHERE email = 'peer.reviewer@test.com'];
        User prApprover = [SELECT Id, Name FROM USer WHERE email = 'pr.approver@test.com'];
        // Create copado__Org__c record
        copado__Org__c copadoOrg = new copado__Org__c(
                Name = 'Test Org'
        );
        insert copadoOrg;
        Id copadoOrgId = copadoOrg.Id;

        // Create Parent User Story
        copado__User_Story__c parentStory = new copado__User_Story__c(
                copado__Org_Credential__c = copadoOrgId,
                iTrack_US__c = 'PARENT-123',copado__Developer__c = peerReviewer.Id,
                Peer_Reviewer__c = prApprover.Id
        );
        insert parentStory;

        // Clone the User Story
        copado__User_Story__c clonedStory = parentStory.clone(false, true, false, false);
        clonedStory.iTrack_US__c = 'CHILD-123';
        insert clonedStory;

        // Retrieve source ID of the clone
        String sourceId = clonedStory.getCloneSourceId();
        System.debug('Source ID: ' + sourceId);

        // Validate Versioning Logic
        clonedStory = [SELECT iTrack_US__c FROM copado__User_Story__c WHERE Id = :clonedStory.Id];
        System.assert(clonedStory.iTrack_US__c.contains('_v'), 'Versioning should append _v# to the iTrack_US__c field.');

        Test.stopTest();
    }

    @isTest
    public static void testAssignParentUsingClone() {
        Test.startTest();

        User peerReviewer = [SELECT Id, Name FROM USer WHERE email = 'peer.reviewer@test.com'];
        User prApprover = [SELECT Id, Name FROM USer WHERE email = 'pr.approver@test.com'];
        // Create copado__Org__c record
        copado__Org__c copadoOrg = new copado__Org__c(
                Name = 'Test Org'
        );
        insert copadoOrg;
        Id copadoOrgId = copadoOrg.Id;

        // Create Parent User Story
        copado__User_Story__c parentStory = new copado__User_Story__c(
                copado__Org_Credential__c = copadoOrgId,
                iTrack_US__c = 'PARENT-123',copado__Developer__c = peerReviewer.Id,
                Peer_Reviewer__c = prApprover.Id
        );
        insert parentStory;

        // Clone the User Story
        copado__User_Story__c clonedStory = parentStory.clone(false, true, false, false);
        clonedStory.iTrack_US__c = 'CHILD-123';
        insert clonedStory;

        // Verify Parent Assignment
        List<copado__Team_Dependency__c> dependencies = [
                SELECT copado__Provider_User_Story__c, copado__Dependent_User_Story__c
                FROM copado__Team_Dependency__c
                WHERE copado__Dependent_User_Story__c = :clonedStory.Id
        ];

        System.assertEquals(1, dependencies.size(), 'Parent should be assigned to the cloned story.');
        System.assertEquals(clonedStory.getCloneSourceId(), dependencies[0].copado__Provider_User_Story__c, 'Dependency should link to the correct parent story.');

        Test.stopTest();
    }

    @isTest
    public static void testTriggerDisabledUsingClone() {
        Test.startTest();

        getCustomMetadataRecord('UserStoryTrigger');
        User peerReviewer = [SELECT Id, Name FROM USer WHERE email = 'peer.reviewer@test.com'];
        User prApprover = [SELECT Id, Name FROM USer WHERE email = 'pr.approver@test.com'];
        // Create copado__Org__c record
        copado__Org__c copadoOrg = new copado__Org__c(
                Name = 'Test Org'
        );
        insert copadoOrg;
        Id copadoOrgId = copadoOrg.Id;

        // Create Parent User Story
        copado__User_Story__c parentStory = new copado__User_Story__c(
                copado__Org_Credential__c = copadoOrgId,
                iTrack_US__c = 'PARENT-1234',copado__Developer__c = peerReviewer.Id,
                Peer_Reviewer__c = prApprover.Id
        );
        insert parentStory;

        // Clone the User Story
        copado__User_Story__c clonedStory = parentStory.clone(false, true, false, false);
        clonedStory.iTrack_US__c = 'CHILD-1234';
        insert clonedStory;

        // Verify that no dependencies are created
        List<copado__Team_Dependency__c> dependencies = [
                SELECT Id FROM copado__Team_Dependency__c WHERE copado__Dependent_User_Story__c = :clonedStory.Id
        ];
        System.assertEquals(1, dependencies.size(), 'No dependencies should be created when the trigger is disabled.');

        Test.stopTest();
    }

    public static CustomTrigger__mdt getCustomMetadataRecord(String triggerName) {
        CustomTrigger__mdt triggerFlag = new CustomTrigger__mdt();
        triggerFlag.On_off__c = false;
        triggerFlag.Label = triggerName;
        return triggerFlag;
    }
}