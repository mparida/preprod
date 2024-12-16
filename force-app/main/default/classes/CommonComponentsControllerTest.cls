/**
 * Created by mp1863 on 09/12/24.
 */

@isTest
public class CommonComponentsControllerTest {
    @isTest
    static void testSearchReleases() {
        // Create test data for releases
        List<copado__Release__c> testReleases = new List<copado__Release__c>{
                new copado__Release__c(Name = 'Release 1',copado__Planned_Date__c  = System.today()-100),
                new copado__Release__c(Name = 'Release 2',copado__Planned_Date__c  = System.today()-150)
        };
        insert testReleases;

        Test.startTest();
        List<copado__Release__c> results = CommonComponentsController.searchReleases('Release');
        Test.stopTest();

        System.assertNotEquals(null, results, 'Results should not be null');
        System.assertEquals(2, results.size(), 'There should be 2 releases returned');
    }

    @isTest
    static void testSearchEnvironments() {
        // Create test data for environments
        List<copado__Environment__c> testEnvironments = new List<copado__Environment__c>{
                new copado__Environment__c(Name = 'Environment 1'),
                new copado__Environment__c(Name = 'Environment 2')
        };
        insert testEnvironments;

        Test.startTest();
        List<copado__Environment__c> results = CommonComponentsController.searchEnvironments('Environment');
        Test.stopTest();

        System.assertNotEquals(null, results, 'Results should not be null');
        System.assertEquals(2, results.size(), 'There should be 2 environments returned');
    }

    @isTest
    static void testFindCommonComponents() {
        User currentUser = [SELECT Id FROM User WHERE Id = :UserInfo.getUserId() LIMIT 1];

        // Create test data for releases
        copado__Release__c release1 = new copado__Release__c(Name = 'Release 1', copado__Planned_Date__c  = System.today()-10);
        copado__Release__c release2 = new copado__Release__c(Name = 'Release 2', copado__Planned_Date__c  = System.today()-50);
        insert new List<copado__Release__c>{release1, release2};

        // Create test data for environments
        copado__Environment__c environment1 = new copado__Environment__c(Name = 'Environment 1');
        copado__Environment__c environment2 = new copado__Environment__c(Name = 'Environment 2');
        insert new List<copado__Environment__c>{environment1, environment2};

        // Create test data for accounts
        Account testAccount = new Account(Name = 'Test Account');
        insert testAccount;

        copado__Org__c cred = new copado__Org__c(name='Environment 1', copado__Org_Type__c = 'Sandbox', copado__Environment__c = environment1.Id);
        insert cred;
        copado__Org__c cred2 = new copado__Org__c(name='Environment 2', copado__Org_Type__c = 'Sandbox', copado__Environment__c =environment2.id );
        insert cred2;
        // Create test data for user story metadata
        copado__User_Story__c userStory1 = new copado__User_Story__c(
                copado__Release__c = release1.Id,
                copado__Environment__c = environment1.Id,
                copado__Is_Bundle__c = false,
                copado__Org_Credential__c = cred.Id,
                Peer_Reviewer__c = currentUser.Id,
                iTrack_US__c = 'AAABBCCC#$@@@'
        );
        copado__User_Story__c userStory2 = new copado__User_Story__c(
                copado__Release__c = release2.Id,
                copado__Environment__c = environment2.Id,
                copado__Is_Bundle__c = false,
                copado__Org_Credential__c = cred2.Id,
                Peer_Reviewer__c = currentUser.Id,
                iTrack_US__c = 'AAABBCCC#$'
        );
        insert new List<copado__User_Story__c>{userStory1, userStory2};

        copado__User_Story_Metadata__c metadata1 = new copado__User_Story_Metadata__c(
                Name = 'Metadata 1',
                copado__Metadata_API_Name__c = 'API_1',
                copado__Type__c = 'Type 1',
                copado__User_Story__c = userStory1.Id
        );
        copado__User_Story_Metadata__c metadata2 = new copado__User_Story_Metadata__c(
                Name = 'Metadata 2',
                copado__Metadata_API_Name__c = 'API_1',
                copado__Type__c = 'Type 1',
                copado__User_Story__c = userStory2.Id
        );
        insert new List<copado__User_Story_Metadata__c>{metadata1, metadata2};

        Test.startTest();
        CommonComponentsController.findCommonComponents(
                release1.Id, release2.Id, environment1.Id, environment2.Id
        );
        Test.stopTest();

        // Verify that the content document is linked to the latest modified account
        List<ContentDocumentLink> cdlList = [
                SELECT Id, LinkedEntityId
                FROM ContentDocumentLink
                WHERE LinkedEntityId = :testAccount.Id
        ];
        System.assertEquals(1, cdlList.size(), 'There should be one ContentDocumentLink record');
    }
}