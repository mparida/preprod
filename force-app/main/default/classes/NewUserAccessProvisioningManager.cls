/**
 * Created by mp1863 on 15/11/24.
 */

public with sharing class NewUserAccessProvisioningManager {
    // Retrieves Profile, Permission Sets, and Permission Set Groups for Replicate_UserName__c
    public static Map<String, String> getUserAccessDetails(String namedCredentialName, String replicateUserName) {
        Map<String, String> accessDetails = new Map<String, String>();

        // Step 1: Retrieve User ID
        String userId = getUserByFederationIdentifier(namedCredentialName, replicateUserName);
        if (userId == null) {
            throw new UserStoryException('User not found with the given Federation Identifier.');
        }

        // Step 2: Retrieve Profile ID
        HttpRequest reqProfile = new HttpRequest();
        reqProfile.setEndpoint('callout:' + namedCredentialName + '/services/data/v56.0/sobjects/User/' + userId);
        reqProfile.setMethod('GET');

        Http http = new Http();
        HttpResponse resProfile = http.send(reqProfile);

        if (resProfile.getStatusCode() == 200) {
            Map<String, Object> userResponse = (Map<String, Object>) JSON.deserializeUntyped(resProfile.getBody());
            accessDetails.put('ProfileId', (String) userResponse.get('ProfileId'));
        }

        // Step 3: Retrieve Permission Sets
        String queryPermissions = EncodingUtil.urlEncode('SELECT PermissionSetId FROM PermissionSetAssignment WHERE AssigneeId = \'' + userId + '\'', 'UTF-8');
        HttpRequest reqPermissions = new HttpRequest();
        reqPermissions.setEndpoint('callout:' + namedCredentialName + '/services/data/v56.0/query/?q=' + queryPermissions);
        reqPermissions.setMethod('GET');

        HttpResponse resPermissions = http.send(reqPermissions);
        if (resPermissions.getStatusCode() == 200) {
            Map<String, Object> queryResponse = (Map<String, Object>) JSON.deserializeUntyped(resPermissions.getBody());
            List<Object> records = (List<Object>) queryResponse.get('records');
            List<String> permissionSetIds = new List<String>();
            for (Object record : records) {
                Map<String, Object> psRecord = (Map<String, Object>) record;
                permissionSetIds.add((String) psRecord.get('PermissionSetId'));
            }
            accessDetails.put('PermissionSetIds', String.join(permissionSetIds, ','));
        }

        // Step 4: Retrieve Permission Set Groups
        String queryPSG = EncodingUtil.urlEncode('SELECT PermissionSetGroupId FROM PermissionSetGroupAssignment WHERE AssigneeId = \'' + userId + '\'', 'UTF-8');
        HttpRequest reqPSG = new HttpRequest();
        reqPSG.setEndpoint('callout:' + namedCredentialName + '/services/data/v56.0/query/?q=' + queryPSG);
        reqPSG.setMethod('GET');

        HttpResponse resPSG = http.send(reqPSG);
        if (resPSG.getStatusCode() == 200) {
            Map<String, Object> queryResponse = (Map<String, Object>) JSON.deserializeUntyped(resPSG.getBody());
            List<Object> records = (List<Object>) queryResponse.get('records');
            List<String> psgIds = new List<String>();
            for (Object record : records) {
                Map<String, Object> psgRecord = (Map<String, Object>) record;
                psgIds.add((String) psgRecord.get('PermissionSetGroupId'));
            }
            accessDetails.put('PermissionSetGroupIds', String.join(psgIds, ','));
        }

        return accessDetails;
    }

    // Creates a new user with the provided details
    public static String createNewUser(String namedCredentialName, String firstName, String lastName, String attEmail, String environment, String profileId) {
        String newUserName = attEmail + '.' + environment;

        Map<String, Object> userData = new Map<String, Object>{
                'FirstName' => firstName,
                'LastName' => lastName,
                'Email' => attEmail,
                'Username' => newUserName,
                'ProfileId' => profileId,
                'Alias' => firstName.substring(0, 2) + lastName.substring(0, 2)
        };

        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:' + namedCredentialName + '/services/data/v56.0/sobjects/User/');
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        req.setBody(JSON.serialize(userData));

        Http http = new Http();
        HttpResponse res = http.send(req);

        if (res.getStatusCode() == 201) {
            Map<String, Object> response = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
            return (String) response.get('id');  // New User ID
        } else {
            throw new UserStoryException('Failed to create new user. Status code: ' + res.getStatusCode() + ', Response: ' + res.getBody());
        }
    }

    // Helper method to retrieve user ID by Federation Identifier
    private static String getUserByFederationIdentifier(String namedCredentialName, String federationId) {
        try {
            String query = 'SELECT Id FROM User WHERE Username = \'' + federationId + '\'';
            String encodedQuery = EncodingUtil.urlEncode(query, 'UTF-8');
            String endpoint = 'callout:' + namedCredentialName + '/services/data/v56.0/query/?q=' + encodedQuery;

            HttpRequest req = new HttpRequest();
            req.setEndpoint(endpoint);
            req.setMethod('GET');

            Http http = new Http();
            HttpResponse res = http.send(req);

            if (res.getStatusCode() == 200) {
                Map<String, Object> queryResponse = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
                List<Object> records = (List<Object>) queryResponse.get('records');
                if (!records.isEmpty()) {
                    Map<String, Object> userRecord = (Map<String, Object>) records[0];
                    return (String) userRecord.get('Id');
                }
            }
            return null;
        } catch (Exception e) {
            System.debug('Error retrieving user by Federation Identifier: ' + e.getStackTraceString());
            throw new UserStoryException('Exception While getting User Details ');
        }
    }
}