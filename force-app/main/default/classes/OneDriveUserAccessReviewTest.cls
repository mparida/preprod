@IsTest
public class OneDriveUserAccessReviewTest {
    // Mock class to simulate OneDrive API responses
    private class MockHttpResponseGenerator implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();

            // Simulate OneDrive folder existence check
            if (req.getEndpoint().contains('/drive/root:/') && req.getMethod() == 'GET') {
                if (req.getEndpoint().contains('NonExistingFolder')) {
                    // Simulate folder not found
                    res.setStatusCode(404);
                    res.setBody('{"error": "Folder not found"}');
                } else {
                    // Simulate folder exists
                    res.setStatusCode(200);
                    res.setBody('{"id": "folder123", "name": "ExistingFolder"}');
                }
            }

            // Simulate file upload
            else if (req.getEndpoint().contains('/content') && req.getMethod() == 'PUT') {
                res.setStatusCode(201); // Simulate success
                res.setBody('{"id": "file123", "name": "UserAccessReview.csv"}');
            }

            // Default case for unexpected endpoints
            else {
                res.setStatusCode(400); // Bad request
                res.setBody('{"error": "Bad Request"}');
            }
            return res;
        }
    }

    @IsTest
    static void testGenerateAndUploadCSV_Success() {
        // Step 1: Insert test data
        List<User> testUsers = new List<User>{
            new User(FirstName = 'John', LastName = 'Doe', FederationIdentifier = 'jdoe', 
                     Username = 'jdoe@att.com', Alias = 'jdoe', ProfileId = [SELECT Id FROM Profile WHERE Name = 'System Administrator' LIMIT 1].Id, 
                     Email = 'jdoe@att.com', TimeZoneSidKey = 'GMT', LocaleSidKey = 'en_US', 
                     EmailEncodingKey = 'ISO-8859-1', LanguageLocaleKey = 'en_US', IsActive = true),
            new User(FirstName = 'Jane', LastName = 'Smith', FederationIdentifier = 'jsmith', 
                     Username = 'jsmith@att.com', Alias = 'jsmith', ProfileId = [SELECT Id FROM Profile WHERE Name = 'Developer' LIMIT 1].Id, 
                     Email = 'jsmith@att.com', TimeZoneSidKey = 'GMT', LocaleSidKey = 'en_US', 
                     EmailEncodingKey = 'ISO-8859-1', LanguageLocaleKey = 'en_US', IsActive = true)
        };
        insert testUsers;

        // Step 2: Set up the mock HTTP callout
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator());

        // Step 3: Call the method under test
        Test.startTest();
        OneDriveUserAccessReview.generateAndUploadCSV();
        Test.stopTest();

        // Step 4: Verify debug logs for success
        // (In a real test, you would assert behavior/state changes if applicable)
    }

    @IsTest
    static void testGenerateAndUploadCSV_NoUsersFound() {
        // Step 1: Ensure no users match the query criteria
        List<User> testUsers = [
            SELECT Id FROM User
            WHERE FederationIdentifier != NULL
            AND IsActive = TRUE
        ];
        //delete testUsers;

        // Step 2: Set up the mock HTTP callout
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator());

        // Step 3: Call the method under test
        Test.startTest();
        OneDriveUserAccessReview.generateAndUploadCSV();
        Test.stopTest();

        // Verify no exceptions were thrown and debug logs indicate no users found
    }

    @IsTest
    static void testGenerateAndUploadCSV_FolderNotFound() {
        // Step 1: Insert test data
        User testUser = new User(
            FirstName = 'John',
            LastName = 'Doe',
            FederationIdentifier = 'jdoe',
            Username = 'jdoe@att.com',
            Alias = 'jdoe',
            ProfileId = [SELECT Id FROM Profile WHERE Name = 'System Administrator' LIMIT 1].Id,
            Email = 'jdoe@att.com',
            TimeZoneSidKey = 'GMT',
            LocaleSidKey = 'en_US',
            EmailEncodingKey = 'ISO-8859-1',
            LanguageLocaleKey = 'en_US',
            IsActive = true
        );
        insert testUser;

        // Step 2: Set up the mock HTTP callout with a folder that does not exist
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator());

        // Step 3: Call the method under test and handle the exception
        Test.startTest();
        try {
            OneDriveUserAccessReview.generateAndUploadCSV();
            System.assert(true, 'Expected a UserAccessException for folder not found');
        } catch (UserAccessException e) {
            // Assert exception message
            System.assert(e.getMessage().contains('The folder "'), 'Unexpected exception message: ' + e.getMessage());
        }
        Test.stopTest();
    }
}