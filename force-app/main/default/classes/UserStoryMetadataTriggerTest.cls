@isTest
private class UserStoryMetadataTriggerTest {

    @testSetup
    static void setupTestData() {
        // Create Developer profile for test users
        Profile developerProfile = [SELECT Id FROM Profile WHERE Name = 'Developer' LIMIT 1];

        // Create two test users with the Developer profile
        User peerReviewer = createTestUser('peer.reviewer@test.com', developerProfile.Id);
        User prApprover = createTestUser('pr.approver@test.com', developerProfile.Id);
        insert peerReviewer;
        insert prApprover;
        System.debug('peerReviewer:::'+peerReviewer);
        System.debug('prApprover:::'+prApprover);
        // Create a sample User Story (parent object)


    }

    private static User createTestUser(String email, Id profileId) {
        return new User(
                FirstName = 'Test',
                LastName = 'User',
                Email = email,
                Username = email,
                Alias = 'tuser',
                TimeZoneSidKey = 'America/Los_Angeles',
                LocaleSidKey = 'en_US',
                EmailEncodingKey = 'UTF-8',
                LanguageLocaleKey = 'en_US',
                ProfileId = profileId
        );
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

    /*@isTest
    static void testUserStoryMetadataTrigger_DisallowedMetadata() {
        Test.startTest();

        // Insert a User Story Metadata with disallowed metadata type
        copado__User_Story_Metadata__c disallowedMetadata = new copado__User_Story_Metadata__c(
                copado__User_Story__c = [SELECT Id FROM copado__User_Story__c LIMIT 1].Id,
                copado__Type__c = 'DisallowedMetadata',
                copado__ModuleDirectory__c = 'src/classes/Disallowed.cls'
        );

        try {
            insert disallowedMetadata;
            System.assert(false, 'Expected an exception due to disallowed metadata.');
        } catch (DmlException e) {
            System.assert(e.getMessage().contains('The metadata cannot be saved since it was comitted from CLI'),
                    'Correct error message should be thrown.');
        }

        Test.stopTest();
    }

    @isTest
    static void testUserStoryMetadataTrigger_DisallowedPattern() {
        Test.startTest();

        // Insert a User Story Metadata with disallowed pattern in ModuleDirectory
        copado__User_Story_Metadata__c patternViolationMetadata = new copado__User_Story_Metadata__c(
                copado__User_Story__c = [SELECT Id FROM copado__User_Story__c LIMIT 1].Id,
                copado__Type__c = 'AllowedMetadata',
                copado__ModuleDirectory__c = 'disallowed_path/src/classes/SomeClass.cls'
        );

        try {
            insert patternViolationMetadata;
            System.assert(false, 'Expected an exception due to disallowed pattern.');
        } catch (DmlException e) {
            System.assert(e.getMessage().contains('The metadata cannot be saved since it was comitted from CLI'),
                    'Correct error message should be thrown.');
        }
    }*/
}
