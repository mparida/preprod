@isTest
public class AttachmentTriggerTest {
    private static final String jsonString = '{"details":"For details visit the Apex Test Results page from Salesforce setup.","failures":3,"tests":12,"time":6198.0,"errors":true,"coverageWarning":"Average test coverage across all Apex Classes and Triggers is 62%, at least 75% test coverage is required.","testClassResults":{"DeleteConflictFilesAttachmentBatchTest":{"methods":[{"name":"testDeleteAttachmentsBatch","success":false,"message":"System.DmlException: Insert failed. First exception on row 0; first error: REQUIRED_FIELD_MISSING, Required fields are missing: [ParentId]: [ParentId]"}]},"bwcCopadoUSControllerTest":{"methods":[{"name":"testCreateCopadoUserStories","success":false,"message":"System.AuraHandledException: Script-thrown exception"}]},"SFS_AzureClientCredsAuthProvider_Test":{"methods":[{"name":"testGetMetadataType","success":true,"message":""},{"name":"testHandleCallback_Error","success":true,"message":""},{"name":"testHandleCallback_Success","success":true,"message":""},{"name":"testGetUserInfo","success":true,"message":""},{"name":"testRefresh","success":true,"message":""},{"name":"testInitiate","success":true,"message":""}]},"BWC_Copado_US_CalloutTest":{"methods":[{"name":"testMakeSampleCallout","success":true,"message":""},{"name":"testGetActiveSprintDetails","success":true,"message":""}]},"UserStoryTriggerTest":{"methods":[{"name":"method1","success":false,"message":"System.AssertException: Assertion Failed: Expected: 5, Actual: 4"},{"name":"method2","success":true,"message":""}]}},"classCoverageResults":{"BWC_Copado_US_Callout":{"coverage":86.48,"numLocations":74,"numLocationsNotCovered":10},"DeleteConflictFilesBatchSchedule":{"coverage":0.00,"numLocations":3,"numLocationsNotCovered":3},"DeleteConflictFilesBatch":{"coverage":0.00,"numLocations":9,"numLocationsNotCovered":9},"BWC_Copado_US":{"coverage":88.88,"numLocations":27,"numLocationsNotCovered":3},"Logical":{"coverage":0.00,"numLocations":2,"numLocationsNotCovered":2},"bwcCopadoUSController":{"coverage":36.20,"numLocations":116,"numLocationsNotCovered":74},"Math":{"coverage":0.00,"numLocations":9,"numLocationsNotCovered":9},"SFS_AzureClientCredsAuthProvider":{"coverage":95.00,"numLocations":60,"numLocationsNotCovered":3}},"triggerCoverageResults":{},"failingMethods":3,"userStoryCoverage":62.33333333333333,"classesWithoutCoverage":4,"triggersWithoutCoverage":0}';

    @testSetup
    static void setupData() {
        copado__Org__c cred = new copado__Org__c(name='TEST', copado__Org_Type__c = 'Production/Developer');
        insert cred;
        
        // Create a test copado__Apex_Test_Result__c record
        copado__Apex_Test_Result__c testResult = new copado__Apex_Test_Result__c(
            copado__Org__c = cred.id,
            copado__User_Story__c = null
        );
        insert testResult;
        
        // Create a test Attachment
        Attachment att = new Attachment(
            Name = 'TestAttachment',
            ParentId = testResult.Id,
            Body = Blob.valueOf(jsonString),
            ContentType = 'text/plain'
        );
        insert att;

        // Create User Stories and Metadata
        copado__User_Story__c userStory = new copado__User_Story__c(
        );
        insert userStory;

        copado__User_Story_Metadata__c metadata = new copado__User_Story_Metadata__c(
            copado__User_Story__c = userStory.Id,
            copado__Metadata_API_Name__c = 'DeleteConflictFilesAttachmentBatchTest',
            copado__Type__c = 'ApexClass'
        );
        insert metadata;
    }
    
    @isTest
    static void testAttachmentTrigger() {
        // Retrieve the test copado__Apex_Test_Result__c record
        copado__Apex_Test_Result__c testResult = [SELECT Id FROM copado__Apex_Test_Result__c LIMIT 1];
        
        // Create and insert a test Attachment
        Attachment att = new Attachment(
            Name = 'TestAttachment',
            ParentId = testResult.Id,
            Body = Blob.valueOf(jsonString),
            ContentType = 'text/plain'
        );
        Test.startTest();
        insert att;
        Test.stopTest();
        
        // Verify that the AttachmentTriggerHandler.createTestFailureRecords method is called
        List<Apex_Test_Failure__c> failures = [SELECT Id, Apex_Test_Result__c, Class_Name__c, Method_Name__c, Method_Message__c 
                                               FROM Apex_Test_Failure__c WHERE Apex_Test_Result__c = :testResult.Id];
        System.assert(!failures.isEmpty(), 'Test failures should be created.');
    }
    
    @isTest
    static void testAttachmentTriggerWithUserStory() {
        // Create a copado__User_Story__c record
        copado__User_Story__c userStory = new copado__User_Story__c(
        );
        insert userStory;

        copado__Org__c cred1 = new copado__Org__c(name='TEST1', copado__Org_Type__c = 'Production/Developer');
        insert cred1;

        // Create a copado__Apex_Test_Result__c record linked to the user story
        copado__Apex_Test_Result__c testResult = new copado__Apex_Test_Result__c(
            copado__Org__c = cred1.id,
            copado__User_Story__c = userStory.Id
        );
        insert testResult;
        
        // Create and insert a test Attachment
        Attachment att = new Attachment(
            Name = 'TestAttachment',
            ParentId = testResult.Id,
            Body = Blob.valueOf('Test Content'),
            ContentType = 'text/plain'
        );
        Test.startTest();
        insert att;
        Test.stopTest();
        
        // Verify that no test failures are created when user story is present
        List<Apex_Test_Failure__c> failures = [SELECT Id FROM Apex_Test_Failure__c WHERE Apex_Test_Result__c = :testResult.Id];
        System.assert(failures.isEmpty(), 'No test failures should be created when user story is present.');
    }
    
    @isTest
    static void testClassStoryDataWrapper() {
        // Verify the getClassStoryData method
        List<Apex_Test_Failure__c> testFailures = [SELECT Id, Class_Name__c FROM Apex_Test_Failure__c];
        Map<String, StoryDataWrapper> result = AttachmentTriggerHandler.getClassStoryData(testFailures);

        System.assert(!result.isEmpty(), 'Result map should not be empty.');
        for (String className : result.keySet()) {
            System.assert(result.get(className) != null, 'StoryDataWrapper should not be null for class: ' + className);
        }
    }
}