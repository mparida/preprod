@IsTest
public class AccessRemovalServiceTest {

    @TestSetup
    static void setup() {
        // Setup test data
        copado__Org__c org = new copado__Org__c(Name = 'TestEnvironment');
        insert org;

        ACC_Environment_Access__c accessRecord = new ACC_Environment_Access__c(
                User_Id__c = '005000000000001',
                Prior_Profile__c = '00e000000000001',
                Prior_PS_Assignment__c = '0PS000000000001,0PS000000000002',
                Environment_Name__c = org.Id,
                Access_Provisioning_Complete__c = false
        );
        insert accessRecord;
    }

    @IsTest
    static void testRevertAccessForUser() {
        // Set the mock response for callouts
        Test.setMock(HttpCalloutMock.class, new AccessRemovalServiceMock());

        // Fetch the test data
        ACC_Environment_Access__c accessRecord = [SELECT Id FROM ACC_Environment_Access__c LIMIT 1];

        // Invoke the method
        Test.startTest();
        AccessRemovalService.revertAccessForUserAsyn(accessRecord.Id);
        Test.stopTest();

        // Validate that the record has been updated
        ACC_Environment_Access__c updatedAccessRecord = [SELECT Access_Provisioning_Complete__c
        FROM ACC_Environment_Access__c
        WHERE Id = :accessRecord.Id];
        System.assert(updatedAccessRecord.Access_Provisioning_Complete__c, 'Access_Provisioning_Complete__c should be true.');
    }

    // Mock class for HTTP Callouts
    public class AccessRemovalServiceMock implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();

            // Mock response for the call to set user profile and permissions
            if (req.getEndpoint().contains('/services/data/v56.0/sobjects/User/')) {
                res.setStatusCode(204); // Simulates a successful update (PATCH)
            } else if (req.getEndpoint().contains('/services/data/v56.0/query/')) {
                res.setStatusCode(200);
                res.setBody('{"records": [{"ProfileId": "00e000000000001", "PermissionSetId": "0PS000000000001"}]}');
            } else {
                res.setStatusCode(400);
                res.setBody('{"message": "Unhandled mock callout", "errorCode": "MOCK_ERROR"}');
            }

            return res;
        }
    }

    @IsTest
    static void testRevertAccessForUserList() {
        // Set the mock response for callouts
        Test.setMock(HttpCalloutMock.class, new AccessRemovalServiceTest.AccessRemovalServiceMock());

        // Fetch the test data
        List<ACC_Environment_Access__c> accessRecords = [SELECT Id FROM ACC_Environment_Access__c LIMIT 1];

        // Create a list of access record IDs
        List<Id> accessRecordIds = new List<Id>();
        for (ACC_Environment_Access__c record : accessRecords) {
            accessRecordIds.add(record.Id);
        }

        // Invoke the method
        Test.startTest();
        AccessRemovalService.revertAccessForUser(accessRecordIds);
        Test.stopTest();

        // Validate that the record has been updated
        ACC_Environment_Access__c updatedAccessRecord = [SELECT Access_Provisioning_Complete__c
        FROM ACC_Environment_Access__c
        WHERE Id = :accessRecordIds[0]];
        System.assert(updatedAccessRecord.Access_Provisioning_Complete__c, 'Access_Provisioning_Complete__c should be true.');
    }

}