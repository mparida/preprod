@isTest
global class TargetOrgAccessManagerMock implements HttpCalloutMock {
    global HttpResponse respond(HttpRequest req) {
        HttpResponse res = new HttpResponse();
        
        // Mock response based on the endpoint
        if (req.getEndpoint().contains('/services/data/v56.0/query/?q=SELECT Id FROM User WHERE Username')) {
            res.setStatusCode(200);
            res.setBody('{"records": [{"Id": "005000000000001"}]}');
        } else if (req.getEndpoint().contains('/services/data/v56.0/query/?q=SELECT+Id+FROM+Profile')) {
            res.setStatusCode(200);
            res.setBody('{"records": [{"Id": "00e000000000001"}]}');
        } else if (req.getEndpoint().contains('/services/data/v56.0/sobjects/User/')) {
            res.setStatusCode(204); // PATCH user profile successfully
        } else if (req.getEndpoint().contains('/services/data/v56.0/query/?q=SELECT+Id,PermissionSetId+FROM+PermissionSetAssignment')) {
            res.setStatusCode(200);
            res.setBody('{"records": [{"Id": "0PS000000000001", "PermissionSetId": "0PS000000000002"}]}');
        } else if (req.getEndpoint().contains('/services/data/v56.0/sobjects/PermissionSetAssignment/0PS000000000001')) {
            res.setStatusCode(204); // DELETE permission set assignment successfully
        } else if (req.getEndpoint().contains('/services/data/v56.0/sobjects/PermissionSetAssignment')) {
            res.setStatusCode(201); // POST add permission set assignment successfully
            res.setBody('{"Id": "0PS000000000003"}');
        } else {
            res.setStatusCode(400);
            res.setBody('{"error": "Unknown request"}');
        }

        return res;
    }
}