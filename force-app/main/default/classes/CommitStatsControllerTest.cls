/**
 * Created by mp1863 on 08/03/25.
 */

@isTest
private class CommitStatsControllerTest {

    @testSetup
    static void setupTestData() {
        Profile developerProfile = [SELECT Id FROM Profile WHERE Name = 'Developer' LIMIT 1];
        User developer = TestDataFactory.createTestUser('developer.reviewer@test.com', developerProfile.Id);
        User prApprover1 = TestDataFactory.createTestUser('pr.approver1@test.com', developerProfile.Id);
        User prApprover2 = TestDataFactory.createTestUser('pr.approver2@test.com', developerProfile.Id);
        List<User> usList = new List<User>{developer, prApprover1, prApprover2};
        insert usList;
    }

    @isTest
    static void testCommitStatsController() {
        Test.startTest();
        User developer = [SELECT Id, Name FROM USer WHERE email = 'developer.reviewer@test.com'];
        User prApprover1 = [SELECT Id, Name FROM USer WHERE email = 'pr.approver1@test.com'];
        User prApprover2 = [SELECT Id, Name FROM USer WHERE email = 'pr.approver2@test.com'];
        // Create a sample Team
        copado__Team__c team = new copado__Team__c(Name = 'Dev Team');
        insert team;
        copado__Org__c copadoOrg = new copado__Org__c(
                Name = 'Test Org'
        );
        insert copadoOrg;
        Id copadoOrgId = copadoOrg.Id;
        copado__User_Story__c userStory = new copado__User_Story__c(copado__Developer__c = developer.Id,copado__Org_Credential__c = copadoOrgId,
                iTrack_US__c = 'PARENT-123',
                Peer_Reviewer__c = prApprover1.Id, Peer_Reviewer_2__c= prApprover2.Id, copado__Team__c = team.Id);
        insert userStory;
        copado__Git_Org_Commit__c snapshot = new copado__Git_Org_Commit__c(copado__Org__c=copadoOrgId);
        insert snapshot;
        // Insert a User Story Metadata with allowed metadata type
        copado__User_Story_Commit__c allowedMetadata = new copado__User_Story_Commit__c(
                copado__User_Story__c = [SELECT Id FROM copado__User_Story__c LIMIT 1].Id,
                copado__Snapshot_Commit__c = snapshot.Id

        );
        insert allowedMetadata;
        CommitStatsController controller = new CommitStatsController();
        Test.stopTest();

    }

    @isTest
    static void testCommitStatsController_MultipleUsersCommitted() {

        User developer = [SELECT Id, Name FROM USer WHERE email = 'developer.reviewer@test.com'];
        User prApprover1 = [SELECT Id, Name FROM USer WHERE email = 'pr.approver1@test.com'];
        User prApprover2 = [SELECT Id, Name FROM USer WHERE email = 'pr.approver2@test.com'];
        copado__Team__c team = new copado__Team__c(Name = 'Dev Team');
        insert team;
        copado__Org__c copadoOrg = new copado__Org__c(
                Name = 'Test Org'
        );
        insert copadoOrg;
        Id copadoOrgId = copadoOrg.Id;
        copado__User_Story__c userStory = new copado__User_Story__c(copado__Developer__c = developer.Id,copado__Org_Credential__c = copadoOrgId,
                iTrack_US__c = 'PARENT-123',
                Peer_Reviewer__c = prApprover1.Id, Peer_Reviewer_2__c= prApprover2.Id, copado__Team__c = team.Id);
        insert userStory;
        copado__Git_Org_Commit__c snapshot = new copado__Git_Org_Commit__c(copado__Org__c=copadoOrgId);
        insert snapshot;

        copado__User_Story_Commit__c commit1 = new copado__User_Story_Commit__c(
                copado__User_Story__c = [SELECT Id FROM copado__User_Story__c LIMIT 1].Id,
                copado__Snapshot_Commit__c = snapshot.Id
        );

        copado__User_Story_Commit__c commit2 = new copado__User_Story_Commit__c(
                copado__User_Story__c = [SELECT Id FROM copado__User_Story__c LIMIT 1].Id,
                copado__Snapshot_Commit__c = snapshot.Id
        );

        insert new List<copado__User_Story_Commit__c>{commit1, commit2};

        Test.setCreatedDate(commit1.Id, System.today().addDays(-1));
        Test.setCreatedDate(commit2.Id, System.today().addDays(-1));
        Test.startTest();
        CommitStatsController controller = new CommitStatsController();
        Test.stopTest();
    }
}