/**
 * Created by mp1863 on 26/01/25.
 */

@IsTest
public class AccessRetrievalControllerTest {
    @TestSetup
    static void setup() {
        // Insert mock data for testing
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
    static void testGetProfileNameOfReplicateUser() {
        // Set up mock for callout
        Test.setMock(HttpCalloutMock.class, new AccessRetrievalControllerMock());

        // Fetch test data
        ACC_Environment_Access__c accessRecord = [SELECT Id FROM ACC_Environment_Access__c LIMIT 1];
        String accessRecordId = accessRecord.Id;
        String namedCredential = 'TestCredential';
        String replicateUserName = 'replicateuser@att.com';
        String groupId = UserInfo.getUserId(); // Mocking group owner as current user

        // Mock inputs for the method
        List<String> inputs = new List<String>{replicateUserName + '#' + namedCredential + '#' + accessRecordId + '#' + groupId};

        Test.startTest();
        AccessRetrievalController.getProfileNameOfReplicateUser(inputs);


        // Verify the results
        ACC_Environment_Access__c updatedAccessRecord = [
                SELECT Replicate_User_Profile__c, OwnerId
                FROM ACC_Environment_Access__c
                WHERE Id = :accessRecordId
                LIMIT 1
        ];
        Test.stopTest();
    }

    public class AccessRetrievalControllerMock implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            System.debug('endpoint is>>'+req.getEndpoint());

            if (req.getEndpoint().contains('/services/data/v56.0/sobjects/User/')) {
                res.setStatusCode(200);
                res.setBody('{"ProfileId": "00e000000000001", "ProfileName": {"Name": "Mocked Profile Name"}}');
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
            }else if(req.getEndpoint().contains('Profile.Name')){
                res.setStatusCode(200);
                res.setBody('{"ProfileName": {"Name": "Mocked Profile Name"}}');
            }

            return res;
        }
    }
}
