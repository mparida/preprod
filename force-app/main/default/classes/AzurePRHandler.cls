@RestResource(urlMapping='/azure/prhook')
global with sharing class AzurePRHandler {
    private static String PAT = 'UzOY1RGiYZTAKsgGZ7elt202q9JTMGAne5fRRHt1tchKSywJbSTOJQQJ99BBACAAAAAiVHRIAAASAZDO1Y37';
    @HttpPost
    global static void handlePR() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;

        // Parse the JSON request body
        String requestBody = req.requestBody.toString();
        System.debug('Received Webhook: ' + requestBody);

        // Security Check for API Key
        String expectedApiKey = 'e7c21b4a-78b9-478b-9f6a-13ab45d1e21f';
        String receivedApiKey = req.params.get('api_key');
        System.debug('Received API Key: ' + receivedApiKey);
        if (String.isEmpty(receivedApiKey) || receivedApiKey != expectedApiKey) {
            res.statusCode = 403;
            res.responseBody = Blob.valueOf('{"status": "error", "message": "Forbidden: Invalid API key"}');
            return;
        }

        // Parse JSON
        Map<String, Object> prData = (Map<String, Object>) JSON.deserializeUntyped(requestBody);
        Map<String, Object> resource = (Map<String, Object>) prData.get('resource');
        System.debug('BRANCH NAME:'+String.valueOf(resource.get('sourceRefName')));
        // Extract branch name and PR details
        String fromBranch = String.valueOf(resource.get('sourceRefName')).contains('refs/heads/') ? String.valueOf(resource.get('sourceRefName')).replace('refs/heads/', '') : String.valueOf(resource.get('sourceRefName')).replace('feature/', '');

        String pullRequestId = String.valueOf(resource.get('pullRequestId'));
        String repoId = String.valueOf(((Map<String, Object>) resource.get('repository')).get('id'));
        String projectId = String.valueOf(((Map<String, Object>) resource.get('repository')).get('project'));

        System.debug('Branch Name: ' + fromBranch);
        System.debug('Pull Request ID: ' + pullRequestId);

        // Query Salesforce for reviewers
        List<copado__User_Story__c> branchRecords = [
                SELECT Peer_Reviewer__r.Email, Peer_Reviewer_2__r.Email
                FROM copado__User_Story__c
                WHERE Name = 'US-0018515' LIMIT 1
        ];

        if (branchRecords.isEmpty()) {
            System.debug('No reviewers found for branch: ' + fromBranch);
            res.statusCode = 200;
            return;
        }

        copado__User_Story__c branch = branchRecords[0];
        List<String> reviewerEmails = new List<String>();

        if (branch.Peer_Reviewer__r != null) {
            reviewerEmails.add(branch.Peer_Reviewer__r.Email);
        }
        if (branch.Peer_Reviewer_2__r != null) {
            reviewerEmails.add(branch.Peer_Reviewer_2__r.Email);
        }

        System.debug('Reviewer Emails: ' + reviewerEmails);

        // Call Azure DevOps to fetch reviewer IDs and add them to the PR
        if (!reviewerEmails.isEmpty()) {
            for (String email : reviewerEmails) {
                String reviewerId = getAzureReviewerId(email);
                if (reviewerId != null) {
                    addReviewerToPR(reviewerId, pullRequestId, projectId, repoId);
                }
            }
        }

        res.statusCode = 200;
    }

    // Function to get Azure DevOps Reviewer ID from Email
    public static String getAzureReviewerId(String email) {
        String azureIdentityUrl = 'https://vssps.dev.azure.com/ACC-Azure-04/_apis/identities?searchFilter=General&filterValue=' + EncodingUtil.urlEncode(email, 'UTF-8') + '&queryMembership=None&api-version=7.1';

        Http http = new Http();
        HttpRequest request = new HttpRequest();
        request.setEndpoint(azureIdentityUrl);
        request.setMethod('GET');
        request.setHeader('Authorization', 'Basic ' + EncodingUtil.base64Encode(Blob.valueOf(':' + PAT)));
        request.setHeader('Content-Type', 'application/json');

        try {
            HttpResponse response = http.send(request);
            System.debug('Azure Identity Response: ' + response.getBody());

            if (response.getStatusCode() == 200) {
                Map<String, Object> jsonResponse = (Map<String, Object>) JSON.deserializeUntyped(response.getBody());
                List<Object> identities = (List<Object>) jsonResponse.get('value');

                if (identities.size() > 0) {
                    Map<String, Object> identity = (Map<String, Object>) identities[0];
                    return String.valueOf(identity.get('id'));
                }
            }
        } catch (Exception e) {
            System.debug('Error fetching Azure Reviewer ID: ' + e.getMessage());
        }
        return null;
    }

    // Function to Add Reviewer to PR
    public static void addReviewerToPR(String reviewerId, String prId, String projectId, String repoId) {
        String azurePRUrl = 'https://dev.azure.com/ACC-Azure-04/ACC%20-%20Salesforce/_apis/git/repositories/' + repoId + '/pullRequests/' + prId + '/reviewers/' + reviewerId + '?api-version=7.1';

        // Prepare request body
        Map<String, Object> reviewerPayload = new Map<String, Object>();
        reviewerPayload.put('id', reviewerId);
        reviewerPayload.put('isRequired', true);
        reviewerPayload.put('vote', 0);

        String payload = JSON.serialize(reviewerPayload);
        System.debug('Azure Reviewer Payload: ' + payload);

        Http http = new Http();
        HttpRequest request = new HttpRequest();
        request.setEndpoint(azurePRUrl);
        request.setMethod('PUT');
        request.setHeader('Content-Type', 'application/json');
        request.setHeader('Authorization', 'Basic ' + EncodingUtil.base64Encode(Blob.valueOf(':' + PAT)));
        request.setBody(payload);

        try {
            HttpResponse response = http.send(request);
            System.debug('Azure PR Response: ' + response.getBody());
        } catch (Exception e) {
            System.debug('Error adding reviewer to PR: ' + e.getMessage());
        }
    }
}