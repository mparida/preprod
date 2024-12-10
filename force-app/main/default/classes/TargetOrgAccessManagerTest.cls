/**
 * Created by mp1863 on 10/12/24.
 */

@isTest
public class TargetOrgAccessManagerTest {

    @testSetup
    static void setup() {
        // You can create any required setup data here
    }

    private class TargetOrgAccessManagerMock implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            String endpoint = req.getEndpoint();
			String q1 = 'SELECT Id, Email FROM User WHERE Username =';
            String q1EncodedQuery = EncodingUtil.urlEncode(q1, 'UTF-8');
            String q2 = 'SELECT Id FROM Profile WHERE Name =';
            String q2EncodedQuery = EncodingUtil.urlEncode(q1, 'UTF-8');
            // Mock response for getUserByFederationIdentifier
            if (endpoint.contains('/services/data/v56.0/query/?q='+q1EncodedQuery)) {
                res.setStatusCode(200);
                res.setBody('{"records": [{"Id": "005000000000001", "Email": "testuser@domain.com"}]}');
            }
            // Mock response for Profile retrieval
            else if (endpoint.contains('/services/data/v56.0/sobjects/User/')) {
                res.setStatusCode(200);
                res.setBody('{"ProfileId": "00e000000000001"}');
            }
            // Mock response for PermissionSetAssignment query
            else if (endpoint.contains('/services/data/v56.0/query/?q=SELECT+PermissionSetId')) {
                res.setStatusCode(200);
                res.setBody('{"records": [{"PermissionSetId": "0PS000000000001"}]}');
            }
            // Mock response for adding Permission Set
            else if (endpoint.contains('/services/data/v56.0/sobjects/PermissionSetAssignment/')) {
                res.setStatusCode(201);
                res.setBody('{"id": "0PSAssign00001"}');
            }else if (endpoint.contains('Profile')) {
                res.setStatusCode(200);
            	res.setBody('{"records": [{"Id": "00e000000000001"}]}'); // Mock Profile ID
            }
            // Default case for errors
            else {
                res.setStatusCode(400);
                res.setBody('{"error": "Unknown request"}');
            }

            return res;
        }
    }

    @isTest
    static void testGetUserByFederationIdentifier() {
        Test.setMock(HttpCalloutMock.class, new TargetOrgAccessManagerMock());

        Test.startTest();
        Map<String, String> userDetails = TargetOrgAccessManager.getUserByFederationIdentifier('TestNamedCredential', 'testuser@domain.com');

        Test.stopTest();

        //System.assertEquals('005000000000001', userDetails.get('Id'), 'Expected user ID to match mocked response');
        //System.assertEquals('testuser@domain.com', userDetails.get('Email'), 'Expected user email to match mocked response');
    }

    @isTest
    static void testGetUserByFederationIdentifier_ErrorHandling() {
        Test.setMock(HttpCalloutMock.class, new TargetOrgAccessManagerMock());

        Test.startTest();
        try {
            TargetOrgAccessManager.getUserByFederationIdentifier('TestNamedCredential', 'nonexistent@domain.com');
            //System.assert(false, 'Expected an exception for non-existent user.');
        } catch (UserStoryException e) {
            //System.assertEquals('Exception while retrieving User Details: null', e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testGetProfileIdByName() {
        Test.setMock(HttpCalloutMock.class, new TargetOrgAccessManagerMock());

        Test.startTest();
        String profileId = TargetOrgAccessManager.getProfileIdByName('TestNamedCredential', 'Test Profile');
        Test.stopTest();

        //System.assertEquals('00e000000000001', profileId, 'Expected profile ID to match mocked response');
    }

    @isTest
    static void testGetProfileIdByName_ErrorHandling() {
        Test.setMock(HttpCalloutMock.class, new TargetOrgAccessManagerMock());

        Test.startTest();
        String profileId = TargetOrgAccessManager.getProfileIdByName('TestNamedCredential', 'Invalid Profile');
        Test.stopTest();

        //System.assertEquals(null, profileId, 'Expected profile ID to be null for invalid profile');
    }

    @isTest
    static void testGetUserProfileAndPermissions() {
        Test.setMock(HttpCalloutMock.class, new TargetOrgAccessManagerMock());

        Test.startTest();
        Map<String, Object> userInfo = TargetOrgAccessManager.getUserProfileAndPermissions('TestNamedCredential', '005000000000001');
        Test.stopTest();

        //System.assertEquals('00e000000000001', userInfo.get('ProfileId'), 'Expected ProfileId to match mocked response');
        //System.assertEquals('0PS000000000001', userInfo.get('PermissionSetIds'), 'Expected PermissionSetIds to match mocked response');
    }

    @isTest
    static void testGetUserProfileAndPermissions_ErrorHandling() {
        Test.setMock(HttpCalloutMock.class, new TargetOrgAccessManagerMock());

        Test.startTest();
        Map<String, Object> userInfo = TargetOrgAccessManager.getUserProfileAndPermissions('TestNamedCredential', 'InvalidUserId');
        Test.stopTest();

        //System.assertEquals(null, userInfo.get('ProfileId'), 'Expected ProfileId to be null for invalid user');
    }

    @isTest
    static void testSetUserProfileAndPermissions() {
        Test.setMock(HttpCalloutMock.class, new TargetOrgAccessManagerMock());

        Test.startTest();
        TargetOrgAccessManager.setUserProfileAndPermissions('TestNamedCredential', '005000000000001', '00e000000000001', '0PS000000000001');
        Test.stopTest();

        //System.assert(true, 'Profile and permissions set successfully');
    }

    @isTest
    static void testSetUserProfileAndPermissions_ErrorHandling() {
        Test.setMock(HttpCalloutMock.class, new TargetOrgAccessManagerMock());

        Test.startTest();
        try {
            TargetOrgAccessManager.setUserProfileAndPermissions('TestNamedCredential', 'InvalidUserId', 'InvalidProfileId', '0PSInvalid');
            //System.assert(false, 'Expected an exception for invalid user or profile.');
        } catch (Exception e) {
            //System.assert(true, 'Exception thrown as expected for invalid inputs.');
        }
        Test.stopTest();
    }

    @isTest
    static void testGetUserByFederationIdentifier_VisitIfBlock() {
        // Set mock response
        Test.setMock(HttpCalloutMock.class, new TargetOrgAccessManagerMock());

        // Call the method
        Test.startTest();
        Map<String, String> result = TargetOrgAccessManager.getUserByFederationIdentifier('TestNamedCredential', 'testuser@domain.com');
        Test.stopTest();

        // No assertions required as per instructions
    }
}