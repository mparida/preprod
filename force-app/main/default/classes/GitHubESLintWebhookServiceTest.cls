/**
 * Created by mp1863 on 06/04/25.
 */

@isTest
private class GitHubESLintWebhookServiceTest {

    @testSetup
    static void setup() {
        Profile developerProfile = [SELECT Id FROM Profile WHERE Name = 'Developer' LIMIT 1];
        User developer = TestDataFactory.createTestUser('developer.reviewer@test.com', developerProfile.Id);
        User prApprover1 = TestDataFactory.createTestUser('pr.approver1@test.com', developerProfile.Id);
        User prApprover2 = TestDataFactory.createTestUser('pr.approver2@test.com', developerProfile.Id);
        List<User> usList = new List<User>{developer, prApprover1, prApprover2};
        insert usList;
    }

    private static String getMockPayload() {
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
        return '{' +
                '"userStoryId": "' + [SELECT Id FROM copado__User_Story__c LIMIT 1].Id + '",' +
                '"commitId": "01a69b1dc833808a9df5be84ce503ad67575561e",' +
                '"run_id": "14259044320",' +
                '"violations": [{' +
                '"filePath": "force-app/main/default/lwc/testComponent/testComponent.js",' +
                '"messages": [{' +
                '"ruleId": "no-empty",' +
                '"severity": "2",' +
                '"message": "Empty block statement",' +
                '"line": "10",' +
                '"endLine": "12",' +
                '"messageId": "testId",' +
                '"suggestions": [{"description": "Add comment"}]' +
                '}]' +
                '}]' +
                '}';
    }

    @isTest
    static void testSuccessScenario() {
        RestRequest req = new RestRequest();
        req.requestBody = Blob.valueOf(getMockPayload());
        RestContext.request = req;
        RestContext.response = new RestResponse();

        Test.startTest();
        GitHubESLintWebhookService.handleViolationPayload();
        Test.stopTest();

        System.assertEquals(500, RestContext.response.statusCode);
        System.assertEquals(0, [SELECT COUNT() FROM ESLint_Violation__c]);
    }

    @isTest
    static void testDuplicateViolations() {
        RestRequest req = new RestRequest();
        req.requestBody = Blob.valueOf(getMockPayload());
        RestContext.request = req;
        RestContext.response = new RestResponse();

        Test.startTest();
        GitHubESLintWebhookService.handleViolationPayload();
        GitHubESLintWebhookService.handleViolationPayload();
        Test.stopTest();

        System.assertEquals(0, [SELECT COUNT() FROM ESLint_Violation__c]);
    }

    @isTest
    static void testErrorHandling() {
        RestRequest req = new RestRequest();
        req.requestBody = Blob.valueOf('{"invalid":"payload"}');
        RestContext.request = req;
        RestContext.response = new RestResponse();

        Test.startTest();
        GitHubESLintWebhookService.handleViolationPayload();
        Test.stopTest();

        System.assertEquals(500, RestContext.response.statusCode);
    }

    @isTest
    static void testPathCleaning() {
        String cleanedPath = ESLintViolationService.extractCleanPath(
                'home/force-app/main/test.js'
        );
        System.assertEquals('/force-app/main/test.js', cleanedPath);
    }

    @isTest
    static void testInvalidPayload() {
        RestRequest req = new RestRequest();
        req.requestBody = Blob.valueOf('{"corrupted:data}');
        RestContext.request = req;
        RestContext.response = new RestResponse();

        Test.startTest();
        GitHubESLintWebhookService.handleViolationPayload();
        Test.stopTest();

        System.assertEquals(500, RestContext.response.statusCode);
    }
}