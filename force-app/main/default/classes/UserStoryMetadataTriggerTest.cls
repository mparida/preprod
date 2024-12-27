@isTest
private class UserStoryMetadataTriggerTest {

    @testSetup
    static void setupTestData() {
        // Create Developer profile for test users
        Profile developerProfile = [SELECT Id FROM Profile WHERE Name = 'Developer' LIMIT 1];

        // Create two test users with the Developer profile
        User peerReviewer = TestDataFactory.createTestUser('peer.reviewer@test.com', developerProfile.Id);
        User prApprover = TestDataFactory.createTestUser('pr.approver@test.com', developerProfile.Id);
        insert peerReviewer;
        insert prApprover;
        System.debug('peerReviewer:::'+peerReviewer);
        System.debug('prApprover:::'+prApprover);
        // Create a sample User Story (parent object)
    }
    @isTest
    static void testUserStoryMetadataTrigger_AllowedMetadata() {
        Test.startTest();
        User peerReviewer = [SELECT Id, Name FROM USer WHERE email = 'peer.reviewer@test.com'];
        User prApprover = [SELECT Id, Name FROM USer WHERE email = 'pr.approver@test.com'];
        copado__User_Story__c userStory = new copado__User_Story__c(copado__Developer__c = peerReviewer.Id,
                Peer_Reviewer__c = prApprover.Id);
        insert userStory;
        // Insert a User Story Metadata with allowed metadata type
        copado__User_Story_Metadata__c allowedMetadata = new copado__User_Story_Metadata__c(
                copado__User_Story__c = [SELECT Id FROM copado__User_Story__c LIMIT 1].Id,
                copado__Type__c = 'PermissionSet',
                copado__ModuleDirectory__c = 'force-app/main/default/permissionsets/User_Interface_Console_Logger.permissionset-meta.xml'
        );

        try{
            insert allowedMetadata;
        }catch (Exception e){
            System.debug('Catching the addError...');
        }


        Test.stopTest();
    }
}