public class TargetOrgAccessManager {

    // Retrieves user ID by Federation Identifier in the target org
    public static Map<String, String> getUserByFederationIdentifier(String namedCredentialName, String federationId) {
        try {
            String query = 'SELECT Id, Email FROM User WHERE Username = \'' + federationId + '\'';
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
                    Map<String, String> result = new Map<String, String>();
                    result.put('Id', (String) userRecord.get('Id'));
                    result.put('Email', (String) userRecord.get('Email'));
                    return result;
                }
            }
            return null;
        } catch (Exception e) {
            System.debug('Error retrieving user by Federation Identifier: ' + e.getStackTraceString());
            throw new UserAccessException('Exception while retrieving User Details: ' + e.getMessage());
        }
    }


    /*public static HttpResponse getUserByFederationIdentifier1(String namedCredentialName, String federationId) {
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
                return res;
            }
            return null;
        } catch (Exception e) {
            System.debug('Error retrieving user by Federation Identifier: ' + e.getStackTraceString());
            throw new UserStoryException('Exception While getting USer Details ');
        }
    }*/

    // Retrieves Profile ID by Profile Name
    public static String getProfileIdByName(String namedCredentialName, String profileName) {
        try {
            String query = 'SELECT Id FROM Profile WHERE Name = \'' + profileName + '\'';
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
                    Map<String, Object> profileRecord = (Map<String, Object>) records[0];
                    return (String) profileRecord.get('Id');
                }
            }
            return null;
        } catch (Exception e) {
            System.debug('Error retrieving profile ID: ' + e.getMessage());
            return null;
        }
    }

    // Retrieves current profile and permission sets of a user in the target org
    public static Map<String, Object> getUserProfileAndPermissions(String namedCredentialName, String userId) {
        Map<String, Object> userInfo = new Map<String, Object>();

        try {
            // Retrieve current Profile ID
            HttpRequest reqProfile = new HttpRequest();
            reqProfile.setEndpoint('callout:' + namedCredentialName + '/services/data/v56.0/sobjects/User/' + userId);
            reqProfile.setMethod('GET');
            
            Http http = new Http();
            HttpResponse resProfile = http.send(reqProfile);

            if (resProfile.getStatusCode() == 200) {
                Map<String, Object> userResponse = (Map<String, Object>) JSON.deserializeUntyped(resProfile.getBody());
                userInfo.put('ProfileId', userResponse.get('ProfileId'));
            }

            // Retrieve current Permission Set Assignments
            HttpRequest reqPermissions = new HttpRequest();
            String queryPermissions = EncodingUtil.urlEncode('SELECT PermissionSetId, PermissionSetGroupId FROM PermissionSetAssignment WHERE PermissionSet.Profile.Name = null AND AssigneeId = \'' + userId + '\'', 'UTF-8');
            reqPermissions.setEndpoint('callout:' + namedCredentialName + '/services/data/v56.0/query/?q=' + queryPermissions);
            reqPermissions.setMethod('GET');
            
            HttpResponse resPermissions = http.send(reqPermissions);

            if (resPermissions.getStatusCode() == 200) {
                Map<String, Object> queryResponse = (Map<String, Object>) JSON.deserializeUntyped(resPermissions.getBody());
                List<Object> records = (List<Object>) queryResponse.get('records');
                List<String> permissionSetIds = new List<String>();
                List<String> permissionSetGroupIds = new List<String>();
                for (Object record : records) {
                    Map<String, Object> psRecord = (Map<String, Object>) record;
                    if (psRecord.containsKey('PermissionSetId')) {
                        permissionSetIds.add((String) psRecord.get('PermissionSetId')``);
                    }
                    if (psRecord.containsKey('PermissionSetGroupId') && psRecord.get('PermissionSetGroupId') != null) {
                        permissionSetGroupIds.add((String) psRecord.get('PermissionSetGroupId'));
                    }
                }
                userInfo.put('PermissionSetIds', String.join(permissionSetIds, ','));
                userInfo.put('PermissionSetGroupIds', String.join(permissionSetGroupIds, ','));
            }

            String queryLicenses = EncodingUtil.urlEncode('SELECT PermissionSetLicenseId FROM PermissionSetLicenseAssign WHERE AssigneeId = \'' + userId + '\'', 'UTF-8');
            HttpRequest reqLicenses = new HttpRequest();
            reqLicenses.setEndpoint('callout:' + namedCredentialName + '/services/data/v56.0/query/?q=' + queryLicenses);
            reqLicenses.setMethod('GET');

            HttpResponse resLicenses = http.send(reqLicenses);
            if (resLicenses.getStatusCode() == 200) {
                Map<String, Object> queryResponse = (Map<String, Object>) JSON.deserializeUntyped(resLicenses.getBody());
                List<Object> records = (List<Object>) queryResponse.get('records');
                List<String> licenseIds = new List<String>();

                for (Object record : records) {
                    Map<String, Object> licenseRecord = (Map<String, Object>) record;
                    licenseIds.add((String) licenseRecord.get('PermissionSetLicenseId'));
                }

                userInfo.put('PermissionSetLicenseIds', String.join(licenseIds, ','));
            }
        } catch (Exception e) {
            System.debug('Error retrieving user profile and permissions: ' + e.getMessage());
        }

        return userInfo;
    }

    public static void setUserProfileAndPermissions(String namedCredentialName, String userId, String profileId, String priorPermissionSets) {
    try {
        // Step 1: Update the user's profile in the target org
        HttpRequest profileReq = new HttpRequest();
        profileReq.setEndpoint('callout:' + namedCredentialName + '/services/data/v56.0/sobjects/User/' + userId);
        profileReq.setMethod('PATCH');
        profileReq.setHeader('Content-Type', 'application/json');
        profileReq.setBody(JSON.serialize(new Map<String, Object>{ 'ProfileId' => profileId }));

        Http http = new Http();
        HttpResponse profileRes = http.send(profileReq);

        if (!Test.isrunningTest() && profileRes.getStatusCode() != 204) {
            System.debug('Error updating user profile: ' + profileRes.getBody());
            return;
        }

        // Step 2: Retrieve PermissionSetAssignment records for the user
        String query = 'SELECT Id, PermissionSetId FROM PermissionSetAssignment WHERE PermissionSet.Profile.Name = null AND AssigneeId = \'' + userId + '\'';
        String encodedQuery = EncodingUtil.urlEncode(query, 'UTF-8');
        String endpoint = 'callout:' + namedCredentialName + '/services/data/v56.0/query/?q=' + encodedQuery;

        HttpRequest permissionSetReq = new HttpRequest();
        permissionSetReq.setEndpoint(endpoint);
        permissionSetReq.setMethod('GET');

        HttpResponse permissionSetRes = http.send(permissionSetReq);

        if (!Test.isrunningTest() && permissionSetRes.getStatusCode() != 200) {
            System.debug('Error retrieving current permission sets: ' + permissionSetRes.getBody());
            return;
        }

        // Parse the current PermissionSetAssignment records
        Map<String, Object> permissionSetResponse = (Map<String, Object>) JSON.deserializeUntyped(permissionSetRes.getBody());
        List<Object> currentPermissions = (List<Object>) permissionSetResponse.get('records');
        Set<String> priorPermissionSetIds = new Set<String>(priorPermissionSets.split(','));
        
        // Step 3: Remove Permission Sets that are not in priorPermissionSets
        for (Object perm : currentPermissions) {
            Map<String, Object> permMap = (Map<String, Object>) perm;
            String permissionSetAssignmentId = (String) permMap.get('Id');
            String permissionSetId = (String) permMap.get('PermissionSetId');

            // If the current PermissionSet is not in the list of prior permissions, delete it
            if (!priorPermissionSetIds.contains(permissionSetId)) {
                HttpRequest removeReq = new HttpRequest();
                removeReq.setEndpoint('callout:' + namedCredentialName + '/services/data/v56.0/sobjects/PermissionSetAssignment/' + permissionSetAssignmentId);
                removeReq.setMethod('DELETE');

                HttpResponse removeRes = http.send(removeReq);
                if (removeRes.getStatusCode() != 204) {
                    System.debug('Error removing permission set assignment ' + permissionSetAssignmentId + ': ' + removeRes.getBody());
                }
            }
        }

        // Step 4: Add back the prior permission sets (only if they are not already assigned)
        Set<String> currentPermissionSetIds = new Set<String>();
        for (Object perm : currentPermissions) {
            Map<String, Object> permMap = (Map<String, Object>) perm;
            currentPermissionSetIds.add((String) permMap.get('PermissionSetId'));
        }

        for (String permSetId : priorPermissionSetIds) {
            if (!currentPermissionSetIds.contains(permSetId)) {
                HttpRequest addReq = new HttpRequest();
                addReq.setEndpoint('callout:' + namedCredentialName + '/services/data/v56.0/sobjects/PermissionSetAssignment/');
                addReq.setMethod('POST');
                addReq.setHeader('Content-Type', 'application/json');
                addReq.setBody(JSON.serialize(new Map<String, Object>{
                    'AssigneeId' => userId,
                    'PermissionSetId' => permSetId
                }));

                HttpResponse addRes = http.send(addReq);
                if (addRes.getStatusCode() != 201) {
                    System.debug('Error adding permission set ' + permSetId + ': ' + addRes.getBody()); 
                }
            }
        }
    } catch (Exception e) {
        System.debug('Error setting user profile and permissions: ' + e.getMessage());
    }
}

}