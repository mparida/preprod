/**
 * Created by mp1863 on 27/03/25.
 */
@isTest
public class GitHubWebhookHandler2Test {
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
    static void testReceiveGitDiff() {
        // Prepare test data
        String promotionId = 'a1CV9000002VTxRMAW';
        String json = '{' +
                '\"promotionId\": \"' + promotionId + '\",' +
                '\"run_id\": \"12345\",' +
                '\"results\": [' +
                '{\"filename\": \"force-app/main/default/aura/RetailHomePageHybrid/RetailHomePageHybrid.cmp\", \"diff\": \"+ Added line\"},' +
                '{\"filename\": \"force-app/main/default/labels/CustomLabels.labels-meta.xml\", \"diff\": \"- Removed line\"}' +
                ']' +
                '}';

    // Simulate REST request
    RestRequest req = new RestRequest();
    req.requestUri = '/services/apexrest/github/diffWebhook2';
    req.httpMethod = 'POST';
    req.requestBody = Blob.valueOf(json);

    RestContext.request = req;
    RestContext.response = new RestResponse();

    Test.startTest();
    GitHubWebhookHandler2.receiveGitDiff();
    Test.stopTest();

    // Verify ContentVersion was created
    ContentVersion insertedCv = [SELECT Id, Title, ContentDocumentId FROM ContentVersion WHERE Title LIKE 'GitHub Diff%' LIMIT 1];
    System.assertNotEquals(null, insertedCv);

    // Verify GitHub_Run__c was created
    GitHub_Run__c run = [SELECT Id, Promotion_Id_Text__c, Promotion__c, GitHub_Run_Id__c, Content_Document_Id__c FROM GitHub_Run__c WHERE Promotion__c = :promotionId OR Promotion_Id_Text__c =: promotionId LIMIT 1];
    System.assertEquals('12345', run.GitHub_Run_Id__c);
    System.assertEquals(insertedCv.ContentDocumentId, run.Content_Document_Id__c);
    }

    @isTest
    static void testGetDiffJsonForPromotion() {
        String promotionId = 'a1CV9000002VTxRMAW';

        // Prepare a fake diff JSON content
        String json = '{' +
                '\"promotionId\": \"' + promotionId + '\",' +
                '\"run_id\": \"12345\",' +
                '\"results\": [' +
                '{\"filename\": \"force-app/main/default/aura/RetailHomePageHybrid/RetailHomePageHybrid.cmp\", \"diff\": \"+ Added line\"},' +
                '{\"filename\": \"force-app/main/default/labels/CustomLabels.labels-meta.xml\", \"diff\": \"- Removed line\"}' +
                ']' +
                '}';

        // Insert ContentVersion
        ContentVersion cv = new ContentVersion();
        cv.Title = 'GitHub Diff - ' + promotionId;
        cv.PathOnClient = 'diff_result.json';
        cv.VersionData = Blob.valueOf(json);
        insert cv;

        ContentVersion saved = [SELECT ContentDocumentId FROM ContentVersion WHERE Id = :cv.Id LIMIT 1];

        // Insert GitHub_Run__c
        GitHub_Run__c run = new GitHub_Run__c();
        run.Promotion_Id_Text__c = promotionId;
        run.GitHub_Run_Id__c = '12345';
        run.Content_Document_Id__c = saved.ContentDocumentId;
        insert run;

        // Add dummy promoted metadata records
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

        copado__User_Story_Metadata__c meta1 = new copado__User_Story_Metadata__c(
        copado__User_Story__c = userStory.Id,
        copado__Metadata_API_Name__c = 'RetailHomePageHybrid',
        copado__Type__c = 'AuraDefinitionBundle'
        );
        insert meta1;

        Test.startTest();
        GitHubWebhookHandler2.DiffResultWrapper results = GitHubWebhookHandler2.getDiffJsonForPromotion(promotionId);
        Test.stopTest();

        System.assertEquals(1, results.xmlFiles.size());
        //System.assert(results.nonXmlFiles.contains('RetailHomePageHybrid'));
    }

    @IsTest
    private static void testGetFileType() {
        // Test null filename
        System.assertEquals('other', GitHubWebhookHandler2.getFileType(null),
                'Should return "other" for null filename');

        // Test empty string
        System.assertEquals('other', GitHubWebhookHandler2.getFileType(''),
                'Should return "other" for empty string');

        // Test Apex class files
        System.assertEquals('code', GitHubWebhookHandler2.getFileType('MyClass.cls'),
                'Should recognize .cls files as code');
        System.assertEquals('code', GitHubWebhookHandler2.getFileType('path/to/MyClass.cls'),
                'Should recognize .cls files with paths as code');

        // Test JavaScript files
        System.assertEquals('code', GitHubWebhookHandler2.getFileType('script.js'),
                'Should recognize .js files as code');

        // Test Trigger files
        System.assertEquals('code', GitHubWebhookHandler2.getFileType('AccountTrigger.trigger'),
                'Should recognize .trigger files as code');

        // Test XML files
        System.assertEquals('xml', GitHubWebhookHandler2.getFileType('file.xml'),
                'Should recognize .xml files as XML');
        System.assertEquals('xml', GitHubWebhookHandler2.getFileType('CustomLabels.labels-meta.xml'),
                'Should recognize labels-meta.xml files as XML');
        System.assertEquals('xml', GitHubWebhookHandler2.getFileType('Admin.profile-meta.xml'),
                'Should recognize profile-meta.xml files as XML');
        System.assertEquals('xml', GitHubWebhookHandler2.getFileType('Account-Account Layout.layout-meta.xml'),
                'Should recognize layout-meta.xml files as XML');

        // Test other file types
        System.assertEquals('other', GitHubWebhookHandler2.getFileType('README.md'),
                'Should return "other" for non-code/non-XML files');
        System.assertEquals('other', GitHubWebhookHandler2.getFileType('styles.css'),
                'Should return "other" for non-code/non-XML files');
        System.assertEquals('other', GitHubWebhookHandler2.getFileType('image.png'),
                'Should return "other" for non-code/non-XML files');

        // Test case sensitivity
        System.assertEquals('code', GitHubWebhookHandler2.getFileType('MyClass.cls'),
                'Should be case insensitive for file extensions');
        System.assertEquals('xml', GitHubWebhookHandler2.getFileType('file.xml'),
                'Should be case insensitive for file extensions');
    }
}