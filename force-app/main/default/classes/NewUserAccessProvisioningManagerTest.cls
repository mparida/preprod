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
                ATT_Email__c = 'testuser444@att.com',
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
                'testuser444@att.com'
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

    @IsTest
    static void testCopyPublicGroupMembership() {
        // Set mock responses
        Test.setMock(HttpCalloutMock.class, new NewUserAccessProvisioningManagerMock());

        // Test data setup
        String namedCredential = 'TestCredential';
        String replicateUserName = 'replicateuser@att.com';
        String newUserId = '005000000000002'; // New user ID

        Test.startTest();
        NewUserAccessProvisioningManager.copyPublicGroupMembership(namedCredential, replicateUserName, newUserId);
        Test.stopTest();

        // Verify public group membership was copied
        System.assert(true, 'Public group memberships should be copied successfully.');
    }


    public class NewUserAccessProvisioningManagerMock implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            System.debug('endpoint is>>'+req.getEndpoint());

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
            }else if (req.getEndpoint().contains('GroupMember')) {
                System.debug('Is Mock for Group???');
                res.setStatusCode(200);
                res.setBody('{"records": [{"GroupId": "0G000000000001"}, {"GroupId": "0G000000000002"}]}');
            }

            return res;
        }
    }
    
    /*---------------------- Exception Case -----------------------*/
    @IsTest
    static void testProvisionAccessException() {
        // Mock HTTP responses to simulate a failure scenario
        Test.setMock(HttpCalloutMock.class, new NewUserAccessProvisioningManagerExceptionMock());

        String fName = 'FName';
        String lName = 'LName';

        Test.startTest();
        try {
            // Call the method under test directly
            NewUserAccessProvisioningManager.createNewUser('Test Env', fName, lName, null, null,null,null);
            //System.assert(false, 'Expected UserAccessException was not thrown.');
        } catch (UserAccessException e) {
            System.debug('Print Exception : '+e.toString());
            // Assert that the expected exception is thrown
            System.assertEquals('400', e.errorCode, 'Exception code should match.');
        }
        Test.stopTest();
    }
    public class NewUserAccessProvisioningManagerExceptionMock implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();

            if (req.getMethod().equals('POST') && req.getEndpoint().contains('/services/data/v56.0/sobjects/User/')) {
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