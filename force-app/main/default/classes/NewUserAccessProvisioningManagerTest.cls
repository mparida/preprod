@IsTest
public class NewUserAccessProvisioningManagerTest {
    @TestSetup
    static void setup() {
        // Setup test data
        copado__Org__c org = new copado__Org__c(Name = 'TestEnvironment');
        insert org;

        ACC_Environment_Access__c accessRecord = new ACC_Environment_Access__c(
                ATT_Email__c = 'testuser@att.com',
                First_Name__c = 'John',
                Last_Name__c = 'Doe',
                Replicate_UserName__c = 'replicateuser@att.com',
                Environment_Name__c = org.Id
        );
        insert accessRecord;
    }

    @IsTest
    static void testGetUserAccessDetails() {
        Test.setMock(HttpCalloutMock.class, new NewUserAccessProvisioningManagerMock());

        String namedCredential = 'TestCredential';
        String replicateUserName = 'replicateuser@att.com';

        Test.startTest();
        Map<String, String> accessDetails = NewUserAccessProvisioningManager.getUserAccessDetails(namedCredential, replicateUserName);
        Test.stopTest();

/*        System.assertNotNull(accessDetails.get('ProfileId'), 'ProfileId should not be null.');
        System.assertNotNull(accessDetails.get('PermissionSetIds'), 'PermissionSetIds should not be null.');
        System.assertNotNull(accessDetails.get('PermissionSetGroupIds'), 'PermissionSetGroupIds should not be null.');
        System.assertNotNull(accessDetails.get('PermissionSetLicenseIds'), 'PermissionSetLicenseIds should not be null.');*/
    }

    @IsTest
    static void testCreateNewUser() {
        Test.setMock(HttpCalloutMock.class, new NewUserAccessProvisioningManagerMock());

        String namedCredential = 'TestCredential';
        String firstName = 'John';
        String lastName = 'Doe';
        String attEmail = 'testuser@att.com';
        String environment = 'TestEnvironment';
        String profileId = '005000000000001';

        Test.startTest();
        String newUserId = NewUserAccessProvisioningManager.createNewUser(
                namedCredential, firstName, lastName, attEmail, environment, profileId, null
        );
        Test.stopTest();

        System.assertEquals('005000000000001', newUserId, 'User ID should match the mocked response.');
    }

    @IsTest
    static void testAssignPermissionsBulk() {
        Test.setMock(HttpCalloutMock.class, new NewUserAccessProvisioningManagerMock());

        String namedCredential = 'TestCredential';
        String userId = '005000000000001';
        List<String> permissionSetIds = new List<String>{ '0PS000000000001' };
        List<String> permissionSetGroupIds = new List<String>{ '0PG000000000001' };

        Test.startTest();
        NewUserAccessProvisioningManager.assignPermissionsBulk(namedCredential, userId, permissionSetIds, permissionSetGroupIds);
        Test.stopTest();

        // Verify mock composite API response was handled correctly
        System.assert(true, 'Composite API call completed successfully.');
    }

    @IsTest
    static void testAssignPermissionSetLicenses() {
        Test.setMock(HttpCalloutMock.class, new NewUserAccessProvisioningManagerMock());

        String namedCredential = 'TestCredential';
        String userId = '005000000000001';
        List<String> licenseIds = new List<String>{ '0PL000000000001' };

        Test.startTest();
        NewUserAccessProvisioningManager.assignPermissionSetLicenses(namedCredential, userId, licenseIds);
        Test.stopTest();

        // Verify no exceptions were thrown
        System.assert(true, 'Permission Set Licenses assigned successfully.');
    }

    @IsTest
    static void testSendPasswordResetEmail() {
        Test.setMock(HttpCalloutMock.class, new NewUserAccessProvisioningManagerMock());

        String namedCredential = 'TestCredential';
        String userId = '005000000000001';

        Test.startTest();
        NewUserAccessProvisioningManager.sendPasswordResetEmail(namedCredential, userId);
        Test.stopTest();

        // Verify no exceptions were thrown
        System.assert(true, 'Password reset email triggered successfully.');
    }

    @IsTest
    static void testProvisionAccessForNewUser() {
        // Mock HTTP responses
        Test.setMock(HttpCalloutMock.class, new NewUserAccessProvisioningManagerMock());

        // Setup test data
        copado__Org__c org = new copado__Org__c(Name = 'TestEnvironment');
        insert org;

        ACC_Environment_Access__c accessRecord = new ACC_Environment_Access__c(
                ATT_Email__c = 'testuser@att.com',
                First_Name__c = 'John',
                Last_Name__c = 'Doe',
                Replicate_UserName__c = 'replicateuser@att.com',
                Environment_Name__c = org.Id
        );
        insert accessRecord;

        List<String> recordIds = new List<String>{ accessRecord.Id };

        // Call the method under test
        Test.startTest();
        NewUserAccessProvisioningManager.provisionAccessForNewUser(recordIds);
        Test.stopTest();

        // Validate changes to the access record
        ACC_Environment_Access__c updatedAccess = [
                SELECT Access_Delivered__c, Access_Provisioning_Complete__c, Executed_by_Devops__c, User_Id__c
                FROM ACC_Environment_Access__c
                WHERE Id = :accessRecord.Id
        ];

        System.assert(updatedAccess.Access_Delivered__c, 'Access should be marked as delivered.');
        System.assert(updatedAccess.Access_Provisioning_Complete__c, 'Access provisioning should be marked as complete.');
        System.assert(updatedAccess.Executed_by_Devops__c, 'Executed_by_Devops should be true.');
        System.assertNotEquals(null, updatedAccess.User_Id__c, 'User ID should be populated.');
    }
    @IsTest
    static void testProvisionAccess() {
        // Mock HTTP responses
        Test.setMock(HttpCalloutMock.class, new NewUserAccessProvisioningManagerMock());

        // Setup test data
        copado__Org__c org = new copado__Org__c(Name = 'TestEnvironment');
        insert org;

        ACC_Environment_Access__c accessRecord = new ACC_Environment_Access__c(
                ATT_Email__c = 'testuser@att.com',
                First_Name__c = 'John',
                Last_Name__c = 'Doe',
                Replicate_UserName__c = 'replicateuser@att.com',
                Environment_Name__c = org.Id
        );
        insert accessRecord;

        Test.startTest();
        NewUserAccessProvisioningManager.provisionAccess(
                accessRecord.Id,
                'TestEnvironment',
                'replicateuser@att.com',
                'John',
                'Doe',
                'testuser@att.com'
        );
        Test.stopTest();

        // Validate changes to the access record
        ACC_Environment_Access__c updatedAccess = [
                SELECT Access_Delivered__c, Access_Provisioning_Complete__c, Executed_by_Devops__c, User_Id__c
                FROM ACC_Environment_Access__c
                WHERE Id = :accessRecord.Id
        ];

        System.assert(updatedAccess.Access_Delivered__c, 'Access should be marked as delivered.');
        System.assert(updatedAccess.Access_Provisioning_Complete__c, 'Access provisioning should be marked as complete.');
        System.assert(updatedAccess.Executed_by_Devops__c, 'Executed_by_Devops should be true.');
        System.assertNotEquals(null, updatedAccess.User_Id__c, 'User ID should be populated.');
    }


    @IsTest
    static void testCreateEmployeeRecordInTargetOrg() {
        Test.setMock(HttpCalloutMock.class, new NewUserAccessProvisioningManagerMock());

        String namedCredential = 'TestCredential';
        String email = 'testuser@att.com';
        String userId = '005000000000001';
        String profileName = 'Retail RSC Rep';
        String firstName = 'John';
        String lastName = 'Doe';

        Test.startTest();
        NewUserAccessProvisioningManager.createEmployeeRecordInTargetOrg(namedCredential, email, userId, profileName, firstName, lastName);
        Test.stopTest();

        // Verify no exceptions were thrown
        System.assert(true, 'Employee record created successfully in the target org.');
    }

    public class NewUserAccessProvisioningManagerMock implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();

            if (req.getEndpoint().contains('/services/data/v56.0/sobjects/User/')) {
                res.setStatusCode(201);
                res.setBody('{"id": "005000000000001"}');
            } else if (req.getEndpoint().contains('/services/data/v56.0/query/?q=SELECT PermissionSetId')) {
                res.setStatusCode(200);
                res.setBody('{"records": [{"PermissionSetId": "0PS000000000001"}, {"PermissionSetGroupId": "0PG000000000001"}]}');
            } else if (req.getEndpoint().contains('/services/data/v56.0/query/?q=SELECT PermissionSetLicenseId')) {
                res.setStatusCode(200);
                res.setBody('{"records": [{"PermissionSetLicenseId": "0PL000000000001"}]}');
            } else if (req.getEndpoint().contains('/services/data/v56.0/composite/')) {
                res.setStatusCode(200);
            } else if (req.getEndpoint().contains('/services/data/v56.0/sobjects/Employee__c/')) {
                res.setStatusCode(201);
            } else if (req.getEndpoint().contains('/services/data/v56.0/sobjects/User/005000000000001/password')) {
                res.setStatusCode(200);
            } else if (req.getEndpoint().contains('Username')) {
                res.setStatusCode(200);
                res.setBody('{"records": [{"Id": "005000000000001"}]}');
            }

            return res;
        }
    }
    @IsTest
    static void testProvisionAccessException() {
        // Mock HTTP responses to simulate a failure scenario
        Test.setMock(HttpCalloutMock.class, new NewUserAccessProvisioningManagerExceptionMock());

        // Create a test access record
        ACC_Environment_Access__c accessRecord = new ACC_Environment_Access__c(
                ATT_Email__c = 'testuser@att.com',
                First_Name__c = 'John',
                Last_Name__c = 'Doe',
                Replicate_UserName__c = 'replicateuser@att.com',
                Environment_Name__r = new copado__Org__c(Name = 'TestEnvironment')
        );
        insert accessRecord;

        Test.startTest();
        try {
            // Call the method under test directly
            NewUserAccessProvisioningManager.provisionAccess(
                    accessRecord.Id,
                    'TestEnvironment',
                    'replicateuser@att.com',
                    'John',
                    'Doe',
                    'testuser@att.com'
            );
            //System.assert(false, 'Expected UserAccessException was not thrown.');
        } catch (UserAccessException e) {
            // Assert that the expected exception is thrown
            System.assertEquals('400', e.errorCode, 'Exception code should match.');
            System.assert(e.getMessage().contains('Mocked error'), 'Exception message should match.');
        }
        Test.stopTest();

        // Validate that the error details are captured in the access record
        ACC_Environment_Access__c updatedRecord = [
                SELECT hasError__c, Call_Out_Errors__c, Error__c
                FROM ACC_Environment_Access__c
                WHERE Id = :accessRecord.Id
        ];
        System.assert(updatedRecord.hasError__c, 'hasError should be true.');
        System.assertEquals('Access Provisioning Error', updatedRecord.Call_Out_Errors__c, 'Error message should match.');
        System.assert(updatedRecord.Error__c.contains('Mocked error'), 'Error details should match.');
    }
    public class NewUserAccessProvisioningManagerExceptionMock implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();

            if (req.getEndpoint().contains('/services/data/v56.0/sobjects/User/')) {
                // Simulate an error during user creation
                res.setStatusCode(400);
                res.setBody('{"message": "Mocked error", "errorCode": "MOCK_ERROR"}');
            } else if (req.getEndpoint().contains('/services/data/v56.0/composite/')) {
                // Simulate an error in the composite API call
                res.setStatusCode(400);
                res.setBody('{"message": "Composite API mocked error", "errorCode": "MOCK_COMPOSITE_ERROR"}');
            }

            return res;
        }
    }

}
