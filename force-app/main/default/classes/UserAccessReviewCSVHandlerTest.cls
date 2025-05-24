@isTest
private class UserAccessReviewCSVHandlerTest {

    private class OneDriveMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();

            if (req.getEndpoint().contains('/content')) {
                // Simulate redirect response (302)
                res.setStatusCode(302);
                res.setHeader('Location', 'https://redirected.url/to/csv');
                return res;
            } else if (req.getEndpoint().contains('redirected.url')) {
                // Simulate actual CSV response (200)
                res.setStatusCode(200);
                res.setBody('First,Last,FID,AttEmail,IntlEmail,User,Manager,ManagerEmail\n' +
                            'John,Doe,jdoe,JD@att.com,jd@intl.com,REPLACE_USER_ID,"Jane Smith",jsmith@att.com');
                return res;
            }

            res.setStatusCode(400);
            res.setBody('Bad Request');
            return res;
        }
    }

    @isTest
    static void testProcessCSV() {
        // Create a test user
        Profile p = [SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1];
        User u = new User(
            Alias = 'testu',
            Email = 'testuser@att.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'TestUser',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = p.Id,
            TimeZoneSidKey = 'America/Los_Angeles',
            Username = 'testuser' + DateTime.now().getTime() + '@att.com'
        );
        insert u;

        // Inject the real user ID into mock CSV
        String mockCSV = 'First,Last,FID,AttEmail,IntlEmail,User,Manager,ManagerEmail\n' +
                         'John,Doe,jdoe,JD@att.com,jd@intl.com,' + u.Id + ',"Jane Smith",jsmith@att.com';

        Test.setMock(HttpCalloutMock.class, new CustomOneDriveMock(mockCSV));

        Test.startTest();
        UserAccessReviewCSVHandler.processCSV();
        Test.stopTest();

        // Assert record creation
        List<User_Access_Review__c> reviews = [
            SELECT Federation_Identifier__c, User__c 
            FROM User_Access_Review__c 
            WHERE Federation_Identifier__c = 'jdoe'
        ];
        System.assertEquals(1, reviews.size());
        System.assertEquals(u.Id, reviews[0].User__c);
    }

    // Custom mock that accepts dynamic CSV body
    private class CustomOneDriveMock implements HttpCalloutMock {
        String csvBody;
        CustomOneDriveMock(String body) {
            this.csvBody = body;
        }

        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();

            if (req.getEndpoint().contains('/content')) {
                res.setStatusCode(302);
                res.setHeader('Location', 'https://redirected.url/to/csv');
                return res;
            } else if (req.getEndpoint().contains('redirected.url')) {
                res.setStatusCode(200);
                res.setBody(csvBody);
                return res;
            }

            res.setStatusCode(400);
            res.setBody('Bad Request');
            return res;
        }
    }
}