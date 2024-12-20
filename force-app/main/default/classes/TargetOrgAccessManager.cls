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
                        permissionSetIds.add((String) psRecord.get('PermissionSetId'));
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

    public static void changeProfile(String namedCredentialName, String userId, String profileId){
        try{
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
        }catch(Exception e){
            System.debug('Error setting user profile: ' + e.getMessage());
        }
    }
    //Remove the additional permissions
    public static void setUserProfileAndPermissions(String namedCredentialName, String userId, String profileId, String priorPermissionSets, String permissionSetGroups, String permissionSetLicenses) {
    try {
        // Step 1: Update the user's profile in the target org
        changeProfile(namedCredentialName, userId, profileId);
        // Step 2: Retrieve PermissionSetAssignment records for the user
        String query = 'SELECT Id, PermissionSetId FROM PermissionSetAssignment WHERE PermissionSet.Profile.Name = null AND AssigneeId = \'' + userId + '\'';
        String encodedQuery = EncodingUtil.urlEncode(query, 'UTF-8');
        String endpoint = 'callout:' + namedCredentialName + '/services/data/v56.0/query/?q=' + encodedQuery;

        HttpRequest permissionSetReq = new HttpRequest();
        permissionSetReq.setEndpoint(endpoint);
        permissionSetReq.setMethod('GET');
        Http http = new Http();
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
        setUserPSGAndPSlicense(namedCredentialName, userId,permissionSetGroups, permissionSetLicenses);
        } catch (Exception e) {
            System.debug('Error setting user profile and permissions: ' + e.getMessage());
        }
    }
	public static void setUserPSGAndPSlicense(String namedCredentialName, String userId, String permissionSetGroups, String permissionSetLicenses) {
        try{
            // Additional logic to remove Permission Set Groups and Permission Set Licenses
            // Step 5: Remove Permission Set Groups that are not in permissionSetGroups
            Set<String> priorPermissionSetGroupIds = new Set<String>(permissionSetGroups.split(','));
            HttpRequest psgReq = new HttpRequest();
            psgReq.setEndpoint('callout:' + namedCredentialName + '/services/data/v56.0/query/?q=' +
            EncodingUtil.urlEncode('SELECT PermissionSetGroupId, Id FROM PermissionSetAssignment WHERE AssigneeId = \'' + userId + '\'', 'UTF-8'));
            psgReq.setMethod('GET');
			Http http = new Http();
            HttpResponse psgRes = http.send(psgReq);
            if (!Test.isrunningTest() && psgRes.getStatusCode() != 200) {
                System.debug('Error retrieving current permission set groups: ' + psgRes.getBody());
            } else {
                Map<String, Object> psgResponse = (Map<String, Object>) JSON.deserializeUntyped(psgRes.getBody());
                List<Object> currentPSGRecords = (List<Object>) psgResponse.get('records');
                Set<String> currentPSGIds = new Set<String>();

                // Collect current PSG assignments
                for (Object psg : currentPSGRecords) {
                    Map<String, Object> psgMap = (Map<String, Object>) psg;
                    String permissionSetGroupAssignmentId = (String) psgMap.get('Id');
                    String permissionSetGroupId = (String) psgMap.get('PermissionSetGroupId');
                    currentPSGIds.add(permissionSetGroupId);

                    // Remove PSGs not in prior permissions
                    if (!priorPermissionSetGroupIds.contains(permissionSetGroupId)) {
                        HttpRequest removePSGReq = new HttpRequest();
                        removePSGReq.setEndpoint('callout:' + namedCredentialName + '/services/data/v56.0/sobjects/PermissionSetGroupAssignment/' + permissionSetGroupAssignmentId);
                        removePSGReq.setMethod('DELETE');

                        HttpResponse removePSGRes = http.send(removePSGReq);
                        if (removePSGRes.getStatusCode() != 204) {
                            System.debug('Error removing permission set group ' + permissionSetGroupAssignmentId + ': ' + removePSGRes.getBody());
                        }
                    }
                }

                // Add back missing prior PSGs
                for (String psgId : priorPermissionSetGroupIds) {
                    if (!currentPSGIds.contains(psgId)) {
                        HttpRequest addPSGReq = new HttpRequest();
                        addPSGReq.setEndpoint('callout:' + namedCredentialName + '/services/data/v56.0/sobjects/PermissionSetGroupAssignment/');
                        addPSGReq.setMethod('POST');
                        addPSGReq.setHeader('Content-Type', 'application/json');
                        addPSGReq.setBody(JSON.serialize(new Map<String, Object>{
                                'AssigneeId' => userId,
                                'PermissionSetGroupId' => psgId
                        }));

                        HttpResponse addPSGRes = http.send(addPSGReq);
                        if (addPSGRes.getStatusCode() != 201) {
                            System.debug('Error adding permission set group ' + psgId + ': ' + addPSGRes.getBody());
                        }
                    }
                }
            }

            // Step 6: Remove Permission Set Licenses that are not in permissionSetLicenses
            Set<String> priorPSLicenseIds = new Set<String>(permissionSetLicenses.split(','));
            HttpRequest pslReq = new HttpRequest();
            pslReq.setEndpoint('callout:' + namedCredentialName + '/services/data/v56.0/query/?q=' +
                    EncodingUtil.urlEncode('SELECT PermissionSetLicenseId, Id FROM PermissionSetLicenseAssign WHERE AssigneeId = \'' + userId + '\'', 'UTF-8'));
            pslReq.setMethod('GET');

            HttpResponse pslRes = http.send(pslReq);
            if (!Test.isrunningTest() && pslRes.getStatusCode() != 200) {
                System.debug('Error retrieving current permission set licenses: ' + pslRes.getBody());
            } else {
                Map<String, Object> pslResponse = (Map<String, Object>) JSON.deserializeUntyped(pslRes.getBody());
                List<Object> currentPSLRecords = (List<Object>) pslResponse.get('records');
                Set<String> currentPSLIds = new Set<String>();

                // Collect current PSL assignments
                for (Object psl : currentPSLRecords) {
                    Map<String, Object> pslMap = (Map<String, Object>) psl;
                    String permissionSetLicenseAssignmentId = (String) pslMap.get('Id');
                    String permissionSetLicenseId = (String) pslMap.get('PermissionSetLicenseId');
                    currentPSLIds.add(permissionSetLicenseId);

                    // Remove PSLs not in prior permissions
                    if (!priorPSLicenseIds.contains(permissionSetLicenseId)) {
                        HttpRequest removePSLReq = new HttpRequest();
                        removePSLReq.setEndpoint('callout:' + namedCredentialName + '/services/data/v56.0/sobjects/PermissionSetLicenseAssign/' + permissionSetLicenseAssignmentId);
                        removePSLReq.setMethod('DELETE');

                        HttpResponse removePSLRes = http.send(removePSLReq);
                        if (removePSLRes.getStatusCode() != 204) {
                            System.debug('Error removing permission set license ' + permissionSetLicenseAssignmentId + ': ' + removePSLRes.getBody());
                        }
                    }
                }

                // Add back missing prior PSLs
                for (String pslId : priorPSLicenseIds) {
                    if (!currentPSLIds.contains(pslId)) {
                        HttpRequest addPSLReq = new HttpRequest();
                        addPSLReq.setEndpoint('callout:' + namedCredentialName + '/services/data/v56.0/sobjects/PermissionSetLicenseAssign/');
                        addPSLReq.setMethod('POST');
                        addPSLReq.setHeader('Content-Type', 'application/json');
                        addPSLReq.setBody(JSON.serialize(new Map<String, Object>{
                                'AssigneeId' => userId,
                                'PermissionSetLicenseId' => pslId
                        }));

                        HttpResponse addPSLRes = http.send(addPSLReq);
                        if (addPSLRes.getStatusCode() != 201) {
                            System.debug('Error adding permission set license ' + pslId + ': ' + addPSLRes.getBody());
                        }
                    }
                }
            }

        }catch(Exception e){
            System.debug('Error setting user profile and permissions: ' + e.getMessage());
        }
    }
}