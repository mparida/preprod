/**
 * Created by mp1863 on 10/12/24.
 */

@isTest
public class TargetOrgAccessManagerTest {

    private class TargetOrgAccessManagerMock implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            String endpoint = req.getEndpoint();
            String q1 = 'SELECT Id, Email FROM User WHERE Username =';
            String q1EncodedQuery = EncodingUtil.urlEncode(q1, 'UTF-8');
            String q2 = 'SELECT Id FROM Profile WHERE Name =';
            String q2EncodedQuery = EncodingUtil.urlEncode(q1, 'UTF-8');
            if (endpoint.contains('/services/data/v56.0/query/?q='+q1EncodedQuery)) {
                res.setStatusCode(200);
                res.setBody('{"records": [{"Id": "005000000000001", "Email": "testuser@domain.com"}]}');
            }else if (endpoint.contains('/services/data/v56.0/sobjects/User/')) {
                res.setStatusCode(200);
                res.setBody('{"ProfileId": "00e000000000001"}');
            }else if (endpoint.contains('/services/data/v56.0/query/?q=SELECT+PermissionSetId')) {
                res.setStatusCode(200);
                res.setBody('{"records": [{"PermissionSetId": "0PS000000000001"}]}');
            }else if (endpoint.contains('/services/data/v56.0/query/?q=SELECT+PermissionSetGroupId')) {
                res.setStatusCode(200);
                res.setBody('{"records": [{"PermissionSetGroupId": "0PG4M0000004CMbWAM"}]}');
            }else if (endpoint.contains('/services/data/v56.0/query/?q=SELECT+PermissionSetLicenseId')) {
                System.debug('XXXXXX');
                res.setStatusCode(200);
                res.setBody('{"records": [{"PermissionSetLicenseId": "0PL6g000001AaKdGAK"}]}');
            }else if (endpoint.contains('/services/data/v56.0/sobjects/PermissionSetAssignment/')) {
                res.setStatusCode(201);
                res.setBody('{"id": "0PSAssign00001"}');
            }else if (endpoint.contains('/services/data/v56.0/sobjects/PermissionSetGroupAssignment/')) {
                res.setStatusCode(201);
                res.setBody('{"id": "0PG4M0000004CMbWAM"}');
            }else if (endpoint.contains('/services/data/v56.0/sobjects/PermissionSetLicenseAssign/')) {
                res.setStatusCode(201);
                res.setBody('{"id": "0PL6g000001AaKdGAK"}');
            }else if (endpoint.contains('Profile')) {
                res.setStatusCode(200);
                res.setBody('{"records": [{"Id": "00e000000000001"}]}'); // Mock Profile ID
            }else {
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

    }

    @isTest
    static void testGetUserByFederationIdentifier_ErrorHandling() {
        Test.setMock(HttpCalloutMock.class, new TargetOrgAccessManagerMock());
        Test.startTest();
        try {
            TargetOrgAccessManager.getUserByFederationIdentifier('TestNamedCredential', 'nonexistent@domain.com');
        } catch (UserAccessException e) {
			System.debug('Error retrieving user by Federation Identifier: ' + e.getStackTraceString());
        }
        Test.stopTest();
    }

    @isTest
    static void testGetProfileIdByName() {
        Test.setMock(HttpCalloutMock.class, new TargetOrgAccessManagerMock());
        Test.startTest();
        String profileId = TargetOrgAccessManager.getProfileIdByName('TestNamedCredential', 'Test Profile');
        Test.stopTest();
    }

    @isTest
    static void testGetProfileIdByName_ErrorHandling() {
        Test.setMock(HttpCalloutMock.class, new TargetOrgAccessManagerMock());
        Test.startTest();
        String profileId = TargetOrgAccessManager.getProfileIdByName('TestNamedCredential', 'Invalid Profile');
        Test.stopTest();
    }

    @isTest
    static void testGetUserProfileAndPermissions() {
        Test.setMock(HttpCalloutMock.class, new TargetOrgAccessManagerMock());
        Test.startTest();
        Map<String, Object> userInfo = TargetOrgAccessManager.getUserProfileAndPermissions('TestNamedCredential', '005000000000001');
        Test.stopTest();
    }

    @isTest
    static void testGetUserProfileAndPermissions_ErrorHandling() {
        Test.setMock(HttpCalloutMock.class, new TargetOrgAccessManagerMock());
        Test.startTest();
        Map<String, Object> userInfo = TargetOrgAccessManager.getUserProfileAndPermissions('TestNamedCredential', 'InvalidUserId');
        Test.stopTest();
    }

    @isTest
    static void testSetUserProfileAndPermissions() {
        Test.setMock(HttpCalloutMock.class, new TargetOrgAccessManagerMock());
        Test.startTest();
        TargetOrgAccessManager.setUserProfileAndPermissions('TestNamedCredential', '005000000000001', '00e000000000001', '0PS000000000001','0PG4M0000004CMbWAM','0PL6g000001AaKdGAK');
        Test.stopTest();
    }

    @isTest
    static void testSetUserProfileAndPermissions_ErrorHandling() {
        Test.setMock(HttpCalloutMock.class, new TargetOrgAccessManagerMock());
        Test.startTest();
        try {
            TargetOrgAccessManager.setUserProfileAndPermissions('TestNamedCredential', 'InvalidUserId', 'InvalidProfileId', '0PSInvalid','0PSGInvalid','0PSLInvalid');
        } catch (Exception e) {
        }
        Test.stopTest();
    }

    @isTest
    static void testGetUserByFederationIdentifier_VisitIfBlock() {
        Test.setMock(HttpCalloutMock.class, new TargetOrgAccessManagerMock());
        Test.startTest();
        Map<String, String> result = TargetOrgAccessManager.getUserByFederationIdentifier('TestNamedCredential', 'testuser@domain.com');
        Test.stopTest();
    }
}