/**
 * Created by mp1863 on 18/03/25.
 */

@IsTest
public with sharing class GitHubPRHandlerTest {
    @TestSetup
    static void setupTestData() {
        // Create Developer profile for test users
        Profile developerProfile = [SELECT Id FROM Profile WHERE Name = 'Developer' LIMIT 1];
        List<User> userList = new List<User>();
        // Create two test users with the Developer profile
        User developer = TestDataFactory.createTestUser('developer.reviewer@test.com', developerProfile.Id);
        developer.FederationIdentifier = 'DevFed1234';
        userList.add(developer);
        User prApprover1 = TestDataFactory.createTestUser('prApprover1.approver@test.com', developerProfile.Id);
        prApprover1.FederationIdentifier = 'App1Fed2345';
        userList.add(prApprover1);
        User prApprover2 = TestDataFactory.createTestUser('prApprover2.approver@test.com', developerProfile.Id);
        prApprover2.FederationIdentifier = 'App2Fed3456';
        userList.add(prApprover2);
        insert userList;
    }

    @IsTest
    static void testGitHubPRWebhookProcessing() {
        User developer = [SELECT Id FROM User WHERE Email = 'developer.reviewer@test.com' LIMIT 1];
        User prApprover1 = [SELECT Id FROM User WHERE Email = 'prApprover1.approver@test.com' LIMIT 1];
        User prApprover2 = [SELECT Id FROM User WHERE Email = 'prApprover2.approver@test.com' LIMIT 1];
        copado__Release__c testRelease = new copado__Release__c(Name = 'Test Release');
        insert testRelease;
        copado__Team__c testTeam = new copado__Team__c(Name = 'Test Team');
        insert testTeam;
        copado__Environment__c testEnvironment = new copado__Environment__c(Name = 'Test Environment');
        insert testEnvironment;
        copado__Epic__c testEpic = new copado__Epic__c(Itrack_Epic__c = 'Test Epic');
        insert testEpic;
        copado__User_Story__c userStory = new copado__User_Story__c(
                copado__Release__c = testRelease.Id,
                copado__Team__c = testTeam.Id,
                copado__Environment__c = testEnvironment.Id,
                copado__Epic__c = testEpic.Id,
                copado__Is_Bundle__c = false,
                copado__Developer__c = developer.Id,
                Peer_Reviewer__c = prApprover1.Id,
                Peer_Reviewer_2__c = prApprover2.Id,
                iTrack_US__c = 'ITrack123'
        );
        insert userStory;
        Test.startTest();
        String usName = [SELECT Name FROM copado__User_Story__c LIMIT 1].Name;

        // Create a mock HTTP request with GitHub webhook payload
        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();
        req.requestURI = '/services/apexrest/github/api/prhook/incoming';
        req.httpMethod = 'POST';
        req.requestBody = Blob.valueOf(
    '{' +
            '"action": "opened",' +
            '"number": 10,' +
            '"pull_request": {' +
            '"head": { "ref": "feature/'+usName+'" }' +
            '},' +
            '"repository": {' +
            '"full_name": "ATT-DP5/apm0013668-cleanup-repo-acc-sfdc-cleanedup-repo"' +
            '}' +
            '}'
        );
        String testSecret = System.Label.Webhook_Secret_Pull_Request; // Ensure this matches GitHub
        Blob testPayload = req.requestBody; // Mock request body
        Blob testSecretBlob = Blob.valueOf(testSecret);
        Blob testComputedHmac = Crypto.generateMac('hmacSHA256', testPayload, testSecretBlob);
        String testComputedSignature = 'sha256=' + EncodingUtil.convertToHex(testComputedHmac);
        // Set the correctly computed signature
        req.addHeader('X-Hub-Signature-256', testComputedSignature);

        // Set test request context
        RestContext.request = req;
        RestContext.response = res;
        // Mock the GitHub API callout to avoid actual HTTP request
        Test.setMock(HttpCalloutMock.class, new GitHubCalloutMock());
        // Call the Apex REST method
        GitHubPRHandler.handleGitHubPR();
        Test.stopTest();
        System.assertEquals(200, res.statusCode, 'Response status should be 200');
    }

    @IsTest
    static void testGitHubPRWebhook_IgnoredForNonOpenedAction() {
        User developer = [SELECT Id FROM User WHERE Email = 'developer.reviewer@test.com' LIMIT 1];
        User prApprover1 = [SELECT Id FROM User WHERE Email = 'prApprover1.approver@test.com' LIMIT 1];
        User prApprover2 = [SELECT Id FROM User WHERE Email = 'prApprover2.approver@test.com' LIMIT 1];
        copado__Release__c testRelease = new copado__Release__c(Name = 'Test Release');
        insert testRelease;
        copado__Team__c testTeam = new copado__Team__c(Name = 'Test Team');
        insert testTeam;
        copado__Environment__c testEnvironment = new copado__Environment__c(Name = 'Test Environment');
        insert testEnvironment;
        copado__Epic__c testEpic = new copado__Epic__c(Itrack_Epic__c = 'Test Epic');
        insert testEpic;
        copado__User_Story__c userStory = new copado__User_Story__c(
                copado__Release__c = testRelease.Id,
                copado__Team__c = testTeam.Id,
                copado__Environment__c = testEnvironment.Id,
                copado__Epic__c = testEpic.Id,
                copado__Is_Bundle__c = false,
                copado__Developer__c = developer.Id,
                Peer_Reviewer__c = prApprover1.Id,
                Peer_Reviewer_2__c = prApprover2.Id,
                iTrack_US__c = 'ITrack123'
        );
        insert userStory;
        String usName = [SELECT Name FROM copado__User_Story__c LIMIT 1].Name;
        Test.startTest();
        // Create a mock HTTP request with GitHub webhook payload for "closed" action
        RestRequest req = new RestRequest();
        req.requestURI = '/services/apexrest/github/api/prhook/incoming';
        req.httpMethod = 'POST';
        req.requestBody = Blob.valueOf(
    '{' +
            '"action": "closed",' +
            '"number": 10,' +
            '"pull_request": {' +
            '"head": { "ref": "feature/'+usName+'" }' +
            '},' +
            '"repository": {' +
            '"full_name": "ATT-DP5/apm0013668-cleanup-repo-acc-sfdc-cleanedup-repo"' +
            '}' +
            '}'
        );
        String testSecret = System.Label.Webhook_Secret_Pull_Request; // Ensure this matches GitHub
        Blob testPayload = req.requestBody; // Mock request body
        Blob testSecretBlob = Blob.valueOf(testSecret);
        Blob testComputedHmac = Crypto.generateMac('hmacSHA256', testPayload, testSecretBlob);
        String testComputedSignature = 'sha256=' + EncodingUtil.convertToHex(testComputedHmac);
        // Set the correctly computed signature
        req.addHeader('X-Hub-Signature-256', testComputedSignature);

        // Set test request context
        RestContext.request = req;
        RestContext.response = new RestResponse();
        // Call the Apex REST method
        GitHubPRHandler.handleGitHubPR();
        Test.stopTest();
        System.assertEquals(200, RestContext.response.statusCode, 'Response status should be 200');
    }

    @IsTest
    static void testNoBranchFound() {
        Test.startTest();
        // Create a mock HTTP request with GitHub webhook payload for "closed" action
        RestRequest req = new RestRequest();
        req.requestURI = '/services/apexrest/github/api/prhook/incoming';
        req.httpMethod = 'POST';
        req.requestBody = Blob.valueOf(
                '{' +
                        '"action": "opened",' +
                        '"number": 10,' +
                        '"pull_request": {' +
                        '"head": { "ref": "feature/US-0019864'+'" }' +
                        '},' +
                        '"repository": {' +
                        '"full_name": "ATT-DP5/apm0013668-cleanup-repo-acc-sfdc-cleanedup-repo"' +
                        '}' +
                        '}'
        );
        String testSecret = System.Label.Webhook_Secret_Pull_Request; // Ensure this matches GitHub
        Blob testPayload = req.requestBody; // Mock request body
        Blob testSecretBlob = Blob.valueOf(testSecret);
        Blob testComputedHmac = Crypto.generateMac('hmacSHA256', testPayload, testSecretBlob);
        String testComputedSignature = 'sha256=' + EncodingUtil.convertToHex(testComputedHmac);
        // Set the correctly computed signature
        req.addHeader('X-Hub-Signature-256', testComputedSignature);

        // Set test request context
        RestContext.request = req;
        RestContext.response = new RestResponse();
        // Call the Apex REST method
        GitHubPRHandler.handleGitHubPR();
        Test.stopTest();
        // Verify that response status is 200 but no further processing happened
        System.assertEquals(200, RestContext.response.statusCode, 'Response status should be 200');
    }

    @IsTest
    static void testIncorrectHash() {
        Test.startTest();
        // Create a mock HTTP request with GitHub webhook payload for "closed" action
        RestRequest req = new RestRequest();
        req.requestURI = '/services/apexrest/github/api/prhook/incoming';
        req.httpMethod = 'POST';
        req.requestBody = Blob.valueOf(
                '{' +
                        '"action": "opened",' +
                        '"number": 10,' +
                        '"pull_request": {' +
                        '"head": { "ref": "feature/US-0019864'+'" }' +
                        '},' +
                        '"repository": {' +
                        '"full_name": "ATT-DP5/apm0013668-cleanup-repo-acc-sfdc-cleanedup-repo"' +
                        '}' +
                        '}'
        );
        String testSecret = System.Label.Webhook_Secret_Pull_Request; // Ensure this matches GitHub
        Blob testPayload = req.requestBody; // Mock request body
        Blob testSecretBlob = Blob.valueOf(testSecret);
        Blob testComputedHmac = Crypto.generateMac('hmacSHA256', testPayload, testSecretBlob);
        String testComputedSignature = 'sha256=' + EncodingUtil.convertToHex(testComputedHmac);
        // Set the correctly computed signature
        req.addHeader('X-Hub-Signature-256', null);

        // Set test request context
        RestContext.request = req;
        RestContext.response = new RestResponse();
        // Call the Apex REST method
        GitHubPRHandler.handleGitHubPR();
        Test.stopTest();
        // Verify that response status is 200 but no further processing happened
        System.assertEquals(403, RestContext.response.statusCode, 'Response status should be 403');
    }

    public class GitHubCalloutMock implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(201); // Simulate success
            res.setBody('{"success": true}');
            return res;
        }
    }
}