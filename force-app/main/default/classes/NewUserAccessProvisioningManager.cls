/**
 * Created by mp1863 on 15/11/24.
 */

public with sharing class NewUserAccessProvisioningManager {
    static Map<String, String> profileMapping = new Map<String, String>{
            'Retail RSC Rep' => 'RSC-REP',
            'Retail SM' => 'RSC-MGR'
    };
    // Retrieves Profile, Permission Sets, and Permission Set Groups for Replicate_UserName__c
    private static String newUserName;
    // Main method to create and provision access for the new user
    @InvocableMethod(label='New User Access' description='Creates a new User from an Existing User')
    public static void provisionAccessForNEwUser(List<String> accessRecordIds) {
        String ids = accessRecordIds.get(0);
        System.debug('PRINT VAR IDs :'+ids);
        String[] VarIds;
        if(ids != null && ids.contains(',')){
            VarIds = ids.split(',');
        }else{
            VarIds = new String[1];
            VarIds[0] = ids;
        }
        System.debug('accessRecordIds size @@@@@@@@@@@@@@@@@@'+accessRecordIds + '###########' +accessRecordIds.size());
        List<ACC_Environment_Access__c> accList = new List<ACC_Environment_Access__c>([SELECT Environment_Name__r.name,
                First_Name__c, Last_Name__c, ATT_Email__c, Replicate_UserName__c
        FROM ACC_Environment_Access__c WHERE ID IN : VarIds]);
        if(accList.size() > 0){
            for (ACC_Environment_Access__c access : accList) {
                provisionAccess(access.Id, access.Environment_Name__r.name, access.Replicate_UserName__c, access.First_Name__c, access.Last_Name__c, access.ATT_Email__c);
            }
        }

    }
    @future(callout=true)
    public static void provisionAccess(Id accessRecordId, String namedCredentialName, String replicateUserName, String firstName, String lastName, String attEmail){
        // Step 1: Get existing user access details
        Map<String, String> accessDetails = getUserAccessDetails(namedCredentialName, replicateUserName);
        List<String> permissionSetIds;
        List<String> permissionSetGroupIds;
        List<String> permissionSetLicenseIds;
        String newUserId;
        Boolean hasError = false;
        try{
            // Step 2: Create a new user with specified details
            newUserId = createNewUser(namedCredentialName, firstName, lastName, attEmail, namedCredentialName, accessDetails.get('ProfileId'), accessRecordId);
            // Step 3: Assign Permission Sets to the new user
            permissionSetIds = accessDetails.get('PermissionSetIds') != null ? accessDetails.get('PermissionSetIds').split(',') : new List<String>();
            permissionSetGroupIds = accessDetails.get('PermissionSetGroupIds') != null ? accessDetails.get('PermissionSetGroupIds').split(',') : new List<String>();
            Set<String> PSGIdsSet = new Set<String>(permissionSetGroupIds);
            PSGIdsSet.remove('');
            permissionSetGroupIds = new List<String>();
            permissionSetGroupIds.addAll(PSGIdsSet);
            permissionSetLicenseIds = accessDetails.get('PermissionSetLicenseIds') != null ? accessDetails.get('PermissionSetLicenseIds').split(',') : new List<String>();

            System.debug('Assigning PS Lic ');
            assignPermissionSetLicenses(namedCredentialName, newUserId, permissionSetLicenseIds);

            System.debug('Assigning PS');
            assignPermissionsBulk(namedCredentialName, newUserId, permissionSetIds, permissionSetGroupIds);


            System.debug('Copying public group memberships...');
            copyPublicGroupMembership(namedCredentialName, replicateUserName, newUserId);

            System.debug('PW RESET');
            sendPasswordResetEmail(namedCredentialName,newUserId);

            System.debug('Employee for Retail User');
            if(profileMapping.containsKey(accessDetails.get('ProfileName'))){
                createEmployeeRecordInTargetOrg(namedCredentialName, attEmail, newUserId, accessDetails.get('ProfileName'), firstName, lastName);
            }
        }catch (Exception e){
            hasError = true;
            System.debug('Exception while provisioning User : '+e.getStackTraceString());
            if(e instanceof  UserAccessException){
                ACC_Environment_Access__c access = new ACC_Environment_Access__c(Id = accessRecordId, hasError__c = true, Call_Out_Errors__c = 'Access Provisioning Error', Error__c = e.toString());
                update access;
            }
        }
        if(!hasError) {
            try {
                ACC_Environment_Access__c accessRecord = [
                        SELECT Id, Prior_Profile__c, Prior_PS_Assignment__c, Prior_PSG_Assigments__c
                        FROM ACC_Environment_Access__c
                        WHERE Id = :accessRecordId
                        LIMIT 1
                ];

                accessRecord.Prior_Profile__c = accessDetails.get('ProfileId');
                accessRecord.Prior_PS_Assignment__c = String.join(permissionSetIds, ',');
                accessRecord.Prior_PSG_Assigments__c = String.join(permissionSetGroupIds, ',');
                accessRecord.Prior_PSLicense_Assignment_Ids__c = String.join(permissionSetLicenseIds, ',');
                accessRecord.Access_Delivered__c = true;
                accessRecord.Access_Provisioning_Complete__c = true;
                accessRecord.Executed_by_Devops__c = true;
                accessRecord.ATT_UID__c = newUserName;
                accessRecord.User_Id__c = newUserId;
                update accessRecord;
            } catch (Exception e) {
                System.debug('Error updating access record: ' + e.getMessage());
                throw new UserAccessException('Failed to update the access record with new user details.');
            }
        }
    }

    public static Map<String, String> getUserAccessDetails(String namedCredentialName, String replicateUserName) {
        Map<String, String> accessDetails = new Map<String, String>();

        // Step 1: Retrieve User ID
        System.debug(namedCredentialName+'A---B'+replicateUserName);
        String userId = getUserByFederationIdentifier(namedCredentialName, replicateUserName);
        if (userId == null) {
            throw new UserAccessException('User not found with the given Federation Identifier.');
        }

        // Step 2: Retrieve Profile ID and Name
        HttpRequest reqProfile = new HttpRequest();
        reqProfile.setEndpoint('callout:' + namedCredentialName + '/services/data/v56.0/sobjects/User/' + userId + '?fields=ProfileId,Profile.Name');
        reqProfile.setMethod('GET');

        Http http = new Http();
        HttpResponse resProfile = http.send(reqProfile);

        if (resProfile.getStatusCode() == 200) {
            Map<String, Object> userResponse = (Map<String, Object>) JSON.deserializeUntyped(resProfile.getBody());
            accessDetails.put('ProfileId', (String) userResponse.get('ProfileId'));
            if (userResponse.containsKey('Profile')) {
                Map<String, Object> profileDetails = (Map<String, Object>) userResponse.get('Profile');
                accessDetails.put('ProfileName', (String) profileDetails.get('Name'));
            }
        }

        // Step 3: Retrieve Permission Sets and Permission Set Groups
        String queryPermissions = EncodingUtil.urlEncode('SELECT PermissionSetId, PermissionSetGroupId FROM PermissionSetAssignment WHERE AssigneeId = \'' + userId + '\'', 'UTF-8');
        HttpRequest reqPermissions = new HttpRequest();
        reqPermissions.setEndpoint('callout:' + namedCredentialName + '/services/data/v56.0/query/?q=' + queryPermissions);
        reqPermissions.setMethod('GET');

        HttpResponse resPermissions = http.send(reqPermissions);
        if (resPermissions.getStatusCode() == 200) {
            Map<String, Object> queryResponse = (Map<String, Object>) JSON.deserializeUntyped(resPermissions.getBody());
            List<Object> records = (List<Object>) queryResponse.get('records');
            List<String> permissionSetIds = new List<String>();
            List<String> permissionSetGroupIds = new List<String>();

            for (Object record : records) {
                Map<String, Object> assignmentRecord = (Map<String, Object>) record;
                if (assignmentRecord.containsKey('PermissionSetId')) {
                    permissionSetIds.add((String) assignmentRecord.get('PermissionSetId'));
                }
                if (assignmentRecord.containsKey('PermissionSetGroupId')) {
                    permissionSetGroupIds.add((String) assignmentRecord.get('PermissionSetGroupId'));
                }
            }
            accessDetails.put('PermissionSetIds', String.join(permissionSetIds, ','));
            accessDetails.put('PermissionSetGroupIds', String.join(permissionSetGroupIds, ','));
        }

        // Step 4: Retrieve Permission Set Licenses
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

            accessDetails.put('PermissionSetLicenseIds', String.join(licenseIds, ','));
        }
        System.debug('Profile is : '+accessDetails.get('ProfileName'));

        return accessDetails;
    }

    // Creates a new user with the provided details
    public static String createNewUser(String namedCredentialName, String firstName, String lastName, String attEmail, String environment, String profileId, Id accessRecordId) {
        newUserName = attEmail + '.' + environment+RandomTextGenerator.generateRandomText(3);
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
        String userId;
        if (res.getStatusCode() == 201) {
            Map<String, Object> response = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
            userId = (String) response.get('id');// New User ID
            return userId;
        } else {
            System.debug('Error while creating the New User....'+accessRecordId+'----'+res.getBody());
            throw new UserAccessException(String.valueOf(res.getStatusCode()) , res.getBody());
        }
    }

    // Assigns Permission Sets and PSGs to a User
    public static void assignPermissionsBulk(String namedCredentialName, String userId, List<String> permissionSetIds, List<String> permissionSetGroupIds) {
        try {
            Http http = new Http();
            Integer batchSize = 10; // Reduce batch size to prevent timeouts

            // Combine Permission Set and Permission Set Group IDs into a single list
            List<Map<String, Object>> combinedAssignments = new List<Map<String, Object>>();

            for (String psId : permissionSetIds) {
                combinedAssignments.add(new Map<String, Object>{
                        'AssigneeId' => userId,
                        'PermissionSetId' => psId
                });
            }

            for (String psgId : permissionSetGroupIds) {
                combinedAssignments.add(new Map<String, Object>{
                        'AssigneeId' => userId,
                        'PermissionSetGroupId' => psgId
                });
            }

            Integer totalAssignments = combinedAssignments.size();

            // Process in smaller batches
            for (Integer batchStartIndex = 0; batchStartIndex < totalAssignments; batchStartIndex += batchSize) {
                List<Map<String, Object>> currentBatch = getBatch(combinedAssignments, batchStartIndex, batchSize);

                List<Map<String, Object>> compositeRequests = new List<Map<String, Object>>();
                Integer referenceIdCounter = 1;

                for (Map<String, Object> assignment : currentBatch) {
                    compositeRequests.add(new Map<String, Object>{
                            'method' => 'POST',
                            'url' => '/services/data/v56.0/sobjects/PermissionSetAssignment/',
                            'referenceId' => 'Assignment' + referenceIdCounter++,
                            'body' => assignment
                    });
                }

                Map<String, Object> compositeBody = new Map<String, Object>{
                        'compositeRequest' => compositeRequests
                };

                HttpRequest req = new HttpRequest();
                req.setEndpoint('callout:' + namedCredentialName + '/services/data/v56.0/composite/');
                req.setMethod('POST');
                req.setHeader('Content-Type', 'application/json');
                req.setBody(JSON.serialize(compositeBody));
                req.setTimeout(60000); // Increase timeout to 60 seconds

                HttpResponse res = http.send(req);

                // Check the response for errors
                if (res.getStatusCode() != 200) {
                    throw new UserAccessException('Failed to assign permissions. Status code: ' + res.getStatusCode() + ', Response: ' + res.getBody());
                }
            }

            System.debug('Permissions assigned successfully in batches.');

        } catch (Exception e) {
            System.debug('Error assigning permissions in bulk: ' + e.getMessage());
            throw new UserAccessException('Error while assigning permissions in bulk: ' + e.getMessage());
        }
    }

    //Prepares the batch for Composite Call
    private static List<Map<String, Object>> getBatch(List<Map<String, Object>> combinedAssignments, Integer startIndex, Integer batchSize) {
        List<Map<String, Object>> batch = new List<Map<String, Object>>();

        for (Integer i = startIndex; i < Math.min(startIndex + batchSize, combinedAssignments.size()); i++) {
            batch.add(combinedAssignments[i]);
        }
        return batch;
    }

    //Assigns PS License to User
    public static void assignPermissionSetLicenses(String namedCredentialName, String userId, List<String> licenseIds) {
        if (licenseIds.isEmpty()) return;

        Http http = new Http();
        List<Map<String, Object>> assignments = new List<Map<String, Object>>();

        for (String licenseId : licenseIds) {
            assignments.add(new Map<String, Object>{
                    'AssigneeId' => userId,
                    'PermissionSetLicenseId' => licenseId
            });
        }

        // Use Composite API to assign all licenses in bulk
        Map<String, Object> compositeRequest = new Map<String, Object>{
                'compositeRequest' => new List<Map<String, Object>>()
        };

        Integer referenceIdCounter = 1;
        List<Map<String, Object>> compositeRequests = (List<Map<String, Object>>) compositeRequest.get('compositeRequest');
        for (Map<String, Object> assignment : assignments) {
            compositeRequests.add(new Map<String, Object>{
                    'method' => 'POST',
                    'url' => '/services/data/v56.0/sobjects/PermissionSetLicenseAssign/',
                    'referenceId' => 'License' + referenceIdCounter++,
                    'body' => assignment
            });
        }
        compositeRequest.put('compositeRequest', compositeRequests);

        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:' + namedCredentialName + '/services/data/v56.0/composite/');
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        req.setBody(JSON.serialize(compositeRequest));

        HttpResponse res = http.send(req);

        if (res.getStatusCode() != 200) {
            throw new UserAccessException('Failed to assign Permission Set Licenses. Status code: ' + res.getStatusCode() + ', Response: ' + res.getBody());
        }
    }

    // Helper method to retrieve user ID by Federation Identifier
    private static String getUserByFederationIdentifier(String namedCredentialName, String federationId) {
        try {
            String query = 'SELECT Id FROM User WHERE Username = \'' + federationId + '\'';
            String encodedQuery = EncodingUtil.urlEncode(query, 'UTF-8');
            String endpoint = 'callout:' + namedCredentialName + '/services/data/v56.0/query/?q=' + encodedQuery;
            System.debug('endpoint:'+endpoint);
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
            System.debug('Error retrieving User details from target Org : '+e.getMessage());
            System.debug('Error retrieving user by Federation Identifier: ' + e.getStackTraceString());
            throw new UserAccessException('Exception While getting User Details ');
        }
    }

    public static void sendPasswordResetEmail(String namedCredentialName, String userId) {
        try {
            // Prepare the HTTP DELETE request
            HttpRequest req = new HttpRequest();
            req.setEndpoint('callout:' + namedCredentialName + '/services/data/v56.0/sobjects/User/' + userId + '/password');
            req.setMethod('DELETE'); // DELETE method triggers the password reset email
            req.setHeader('Content-Type', 'application/json');

            // Send the request
            Http http = new Http();
            HttpResponse res = http.send(req);

            // Handle the response
            if (res.getStatusCode() == 200 || res.getStatusCode() == 201) {
                System.debug('Password reset email triggered successfully for user: ' + userId);
            } else {
                throw new UserAccessException(
                        'Failed to trigger password reset email. Status Code: ' + res.getStatusCode() + ', Response: ' + res.getBody()
                );
            }
        } catch (Exception e) {
            System.debug('Error while triggering password reset email: ' + e.getMessage());
            throw new UserAccessException('Error while triggering password reset email: ' + e.getMessage());
        }
    }

    public static void createEmployeeRecordInTargetOrg(
            String namedCredentialName,
            String email,
            String userId,
            String profileName,
            String firstName,
            String lastName
    ) {
        try {

            // Determine the SFProfileId__c based on Profile Name
            String sfProfileId = profileMapping.containsKey(profileName) ? profileMapping.get(profileName) : null;

            // Prepare the Employee__c record data
            Map<String, Object> employeeData = new Map<String, Object>{
                    'Email__c' => email,
                    'User__c' => userId,
                    'SFProfileId__c' => sfProfileId,
                    'FirstName__c' => firstName,
                    'LastName__c' => lastName,
                    'Name' => firstName + ' ' + lastName
            };

            // Create the HTTP request
            HttpRequest req = new HttpRequest();
            req.setEndpoint('callout:' + namedCredentialName + '/services/data/v56.0/sobjects/Employee__c/');
            req.setMethod('POST');
            req.setHeader('Content-Type', 'application/json');
            req.setBody(JSON.serialize(employeeData));

            // Send the HTTP request
            Http http = new Http();
            HttpResponse res = http.send(req);

            // Handle the response
            if (res.getStatusCode() == 201) {
                System.debug('Employee record created successfully in the target org.');
            } else {
                System.debug('Failed to create Employee record in the target org. Status Code: ' + res.getStatusCode() + ', Response: ' + res.getBody());
                throw new UserAccessException('Failed to create Employee record in the target org. Status Code: ' + res.getStatusCode());
            }
        } catch (Exception e) {
            System.debug('Error while creating Employee record in target org: ' + e.getMessage());
            throw new UserAccessException('Error while creating Employee record in target org: ' + e.getMessage());
        }
    }

    // Copies public group membership from the replicate user to the new user
    public static void copyPublicGroupMembership(String namedCredentialName, String replicateUserName, String newUserId) {
        try {
            // Retrieve User ID of the replicate user
            String replicateUserId = getUserByFederationIdentifier(namedCredentialName, replicateUserName);
            if (replicateUserId == null) {
                throw new UserAccessException('Replicate user not found: ' + replicateUserName);
            }

            // Query the public group memberships of the replicate user
            String query = EncodingUtil.urlEncode(
                    'SELECT GroupId FROM GroupMember WHERE UserOrGroupId = \'' + replicateUserId + '\'',
                    'UTF-8'
            );
            HttpRequest req = new HttpRequest();
            req.setEndpoint('callout:' + namedCredentialName + '/services/data/v56.0/query/?q=' + query);
            req.setMethod('GET');

            Http http = new Http();
            HttpResponse res = http.send(req);

            if (res.getStatusCode() == 200) {
                Map<String, Object> queryResponse = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
                List<Object> groupRecords = (List<Object>) queryResponse.get('records');
                if (groupRecords.isEmpty()) {
                    System.debug('No public group memberships found for replicate user: ' + replicateUserName);
                    return;
                }

                // Add the new user to the same groups
                List<Map<String, Object>> groupMemberships = new List<Map<String, Object>>();
                for (Object groupRecord : groupRecords) {
                    Map<String, Object> recordMap = (Map<String, Object>) groupRecord;
                    String groupId = (String) recordMap.get('GroupId');
                    groupMemberships.add(new Map<String, Object>{
                            'GroupId' => groupId,
                            'UserOrGroupId' => newUserId
                    });
                    System.debug('FROUP ID is : '+groupId);
                }

                System.debug('Print group Ids::'+groupMemberships);
                System.debug('Print group size::'+groupMemberships.size());

                // Composite API for bulk insertion
                List<Map<String, Object>> compositeRequests = new List<Map<String, Object>>();
                Integer referenceIdCounter = 1;
                for (Map<String, Object> membership : groupMemberships) {
                    compositeRequests.add(new Map<String, Object>{
                            'method' => 'POST',
                            'url' => '/services/data/v56.0/sobjects/GroupMember/',
                            'referenceId' => 'Membership' + referenceIdCounter++,
                            'body' => membership
                    });
                }

                Map<String, Object> compositeBody = new Map<String, Object>{
                        'compositeRequest' => compositeRequests
                };

                HttpRequest compositeReq = new HttpRequest();
                compositeReq.setEndpoint('callout:' + namedCredentialName + '/services/data/v56.0/composite/');
                compositeReq.setMethod('POST');
                compositeReq.setHeader('Content-Type', 'application/json');
                compositeReq.setBody(JSON.serialize(compositeBody));
                HttpResponse compositeRes = http.send(compositeReq);

                if (compositeRes.getStatusCode() != 200) {
                    throw new UserAccessException('Failed to assign group memberships to new user. Response: ' + compositeRes.getBody());
                }

                System.debug('Public group memberships copied successfully for new user: ' + newUserId);
            } else {
                throw new UserAccessException('Failed to query group memberships. Response: ' + res.getBody());
            }
        } catch (Exception e) {
            System.debug('Error copying public group membership: ' + e.getStackTraceString());
            throw new UserAccessException('Error copying public group membership: ' + e.getMessage());
        }
    }

}