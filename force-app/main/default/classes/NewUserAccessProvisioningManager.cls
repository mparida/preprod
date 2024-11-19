/**
 * Created by mp1863 on 15/11/24.
 */

public with sharing class NewUserAccessProvisioningManager {
    // Retrieves Profile, Permission Sets, and Permission Set Groups for Replicate_UserName__c
    private static String newUserName;
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
        newUserName = attEmail + '.' + environment;
        // Default values for required fields
        String defaultTimeZoneSidKey = 'America/Los_Angeles'; // Adjust based on your org's preferences
        String defaultLocaleSidKey = 'en_US'; // Adjust based on your org's preferences
        String defaultEmailEncodingKey = 'UTF-8'; // Default encoding
        String defaultLanguageLocaleKey = 'en_US'; // Default language
        Map<String, Object> userData = new Map<String, Object>{
                'FirstName' => firstName,
                'LastName' => lastName,
                'Email' => attEmail,
                'Username' => newUserName,
                'ProfileId' => profileId,
                'Alias' => firstName.substring(0, 2) + lastName.substring(0, 2),
                'TimeZoneSidKey' => defaultTimeZoneSidKey,
                'LocaleSidKey' => defaultLocaleSidKey,
                'EmailEncodingKey' => defaultEmailEncodingKey,
                'LanguageLocaleKey' => defaultLanguageLocaleKey
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

    // Assigns Permission Sets to a User
    public static void assignPermissionSets(String namedCredentialName, String userId, List<String> permissionSetIds) {
        Http http = new Http();

        for (String psId : permissionSetIds) {
            Map<String, Object> data = new Map<String, Object>{
                    'AssigneeId' => userId,
                    'PermissionSetId' => psId
            };

            HttpRequest req = new HttpRequest();
            req.setEndpoint('callout:' + namedCredentialName + '/services/data/v56.0/sobjects/PermissionSetAssignment/');
            req.setMethod('POST');
            req.setHeader('Content-Type', 'application/json');
            req.setBody(JSON.serialize(data));

            HttpResponse res = http.send(req);
            if (res.getStatusCode() != 201) {
                System.debug('Failed to assign permission set ' + psId + '. Status code: ' + res.getStatusCode() + ', Response: ' + res.getBody());
            }
        }
    }

    // Assigns Permission Set Groups to a User
    public static void assignPermissionSetGroups(String namedCredentialName, String userId, List<String> permissionSetGroupIds) {
        Http http = new Http();

        for (String psgId : permissionSetGroupIds) {
            Map<String, Object> data = new Map<String, Object>{
                    'AssigneeId' => userId,
                    'PermissionSetGroupId' => psgId
            };

            HttpRequest req = new HttpRequest();
            req.setEndpoint('callout:' + namedCredentialName + '/services/data/v56.0/sobjects/PermissionSetGroupAssignment/');
            req.setMethod('POST');
            req.setHeader('Content-Type', 'application/json');
            req.setBody(JSON.serialize(data));

            HttpResponse res = http.send(req);
            if (res.getStatusCode() != 201) {
                System.debug('Failed to assign permission set group ' + psgId + '. Status code: ' + res.getStatusCode() + ', Response: ' + res.getBody());
            }
        }
    }

    // Main method to create and provision access for the new user
    @InvocableMethod(label='New User Access' description='Creates a new User from an Existing User')
    public static void provisionAccessForNEwUser(List<Id> accessRecordIds) {
        List<ACC_Environment_Access__c> accList = new List<ACC_Environment_Access__c>([SELECT Environment_Name__r.name,
                First_Name__c, Last_Name__c, ATT_Email__c, Replicate_UserName__c
        FROM ACC_Environment_Access__c WHERE ID IN : accessRecordIds]);
        if(accList.size() > 0){
            for (ACC_Environment_Access__c access : accList) {
                provisionAccess(access.Id, access.Environment_Name__r.name, access.Replicate_UserName__c, access.First_Name__c, access.Last_Name__c, access.ATT_Email__c);
            }
        }

    }
    public static void provisionAccess(Id accessRecordId, String namedCredentialName, String replicateUserName, String firstName, String lastName, String attEmail) {
        // Step 1: Get existing user access details
        Map<String, String> accessDetails = getUserAccessDetails(namedCredentialName, replicateUserName);

        // Step 2: Create a new user with specified details
        String newUserId = createNewUser(namedCredentialName, firstName, lastName, attEmail, namedCredentialName, accessDetails.get('ProfileId'));

        // Step 3: Assign Permission Sets to the new user
        List<String> permissionSetIds = accessDetails.get('PermissionSetIds') != null ? accessDetails.get('PermissionSetIds').split(',') : new List<String>();
        assignPermissionSets(namedCredentialName, newUserId, permissionSetIds);

        // Step 4: Assign Permission Set Groups to the new user
        List<String> permissionSetGroupIds = accessDetails.get('PermissionSetGroupIds') != null ? accessDetails.get('PermissionSetGroupIds').split(',') : new List<String>();
        assignPermissionSetGroups(namedCredentialName, newUserId, permissionSetGroupIds);

        try {
            ACC_Environment_Access__c accessRecord = [SELECT Id, Prior_Profile__c, Prior_PS_Assignment__c, Prior_PSG_Assigments__c
            FROM ACC_Environment_Access__c WHERE Id = :accessRecordId LIMIT 1];

            accessRecord.Prior_Profile__c = accessDetails.get('ProfileId');
            accessRecord.Prior_PS_Assignment__c = String.join(permissionSetIds, ',');
            accessRecord.Prior_PSG_Assigments__c = String.join(permissionSetGroupIds, ',');
            accessRecord.Access_Delivered__c = true;
            accessRecord.Access_Provisioning_Complete__c = true;
            accessRecord.Executed_by_Devops__c = true;
            accessRecord.ATT_UID__c = newUserName;
            accessRecord.User_Id__c = newUserId;
            update accessRecord;
        } catch (Exception e) {
            System.debug('Error updating access record: ' + e.getMessage());
            throw new UserStoryException('Failed to update the access record with new user details.');
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