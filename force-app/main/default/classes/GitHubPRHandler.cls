/**
 * Created by mp1863 on 17/03/25.
 */
@RestResource(UrlMapping='/github/api/prhook/incoming/*')
global without sharing class GitHubPRHandler {
    @HttpPost
    global static void handleGitHubPR() {

        try{
            RestRequest request = RestContext.request;
            RestResponse response = RestContext.response;

            // Parse the JSON request body
            String requestBody = request.requestBody.toString();
            String hashedVal = request.headers.get('X-Hub-Signature-256');
            Blob blb = request.requestBody;
            Blob hMac = Crypto.generateMac('hmacSHA256', blb, Blob.valueOf(System.Label.Webhook_Secret_Pull_Request));
            String shaMacString = 'sha256='+EncodingUtil.convertToHex(hMac);
            // Convert both signatures to lowercase for case-insensitive comparison
            if (hashedVal == null || !hashedVal.equalsIgnoreCase(shaMacString)) {
                System.debug('Signature mismatch. Rejecting request.');
                response.statusCode = 403;
                response.responseBody = Blob.valueOf('{"error": "Signature verification failed"}');
                return;
            }
            System.debug('Request from trusted Client...');
            // Deserialize JSON
            Map<String, Object> prData = (Map<String, Object>) JSON.deserializeUntyped(requestBody);
            String action = String.valueOf(prData.get('action'));
            Map<String, Object> pullRequest = (Map<String, Object>) prData.get('pull_request');
            if (action != 'opened') {
                System.debug('Ignoring GitHub Webhook as action is not "opened". Action received: ' + action);
                response.statusCode = 200;
                response.responseBody = Blob.valueOf('Not required to execute Salesforce hook further');
                return;
            }
            // Extract PR details
            String prNumber = String.valueOf(prData.get('number'));
            String repoFullName = String.valueOf(((Map<String, Object>) prData.get('repository')).get('full_name'));
            String branchName = String.valueOf(((Map<String, Object>) pullRequest.get('head')).get('ref'));

            System.debug('PR Number: ' + prNumber);
            System.debug('Repository: ' + repoFullName);
            System.debug('Branch Name: ' + branchName);
            String extractedBranchName = branchName.substringAfter('/');
            System.debug('extractedBranchName Name: ' + extractedBranchName);
            // Query Salesforce to get reviewers
            List<copado__User_Story__c> branchRecords = [
                    SELECT Peer_Reviewer__r.FederationIdentifier, Peer_Reviewer_2__r.FederationIdentifier
                    FROM copado__User_Story__c
                    WHERE Name = :extractedBranchName LIMIT 1
            ];
            System.debug('branchRecords:'+branchRecords);
            if (branchRecords.isEmpty()) {
                System.debug('No reviewers found for branch: ' + extractedBranchName);
                response.statusCode = 200;
                return;
            }
            copado__User_Story__c branch = branchRecords[0];
            System.debug('Lead Reviewer ::'+branch.Peer_Reviewer_2__r.FederationIdentifier);
            System.debug('Peer Reviewer ::'+branch.Peer_Reviewer__r.FederationIdentifier);
            List<String> reviewers = new List<String>();
            if (branch.Peer_Reviewer__r != null && String.isNotBlank(branch.Peer_Reviewer__r.FederationIdentifier)) {
                reviewers.add(branch.Peer_Reviewer__r.FederationIdentifier+'_ATT');
            }
            if (branch.Peer_Reviewer_2__r != null && String.isNotBlank(branch.Peer_Reviewer_2__r.FederationIdentifier)) {
                reviewers.add(branch.Peer_Reviewer_2__r.FederationIdentifier+'_ATT');
            }
            System.debug('GitHub Reviewers: ' + reviewers);
            // Call GitHub API to assign reviewers
            if (!reviewers.isEmpty()) {
                assignReviewersToPR(repoFullName, prNumber, reviewers);
            }
            response.statusCode = 200;
        }catch (Exception e){
            System.debug('Exception while processing the GitHub PR hook...'); 
        }
    }

    // Call GitHub API to add reviewers
    public static void assignReviewersToPR(String repoFullName, String prNumber, List<String> reviewers) {
        String githubUrl = 'callout:GitHubAPI/repos/' + repoFullName + '/pulls/' + prNumber + '/requested_reviewers';

        // Prepare request body
        Map<String, Object> reviewerPayload = new Map<String, Object>();
        reviewerPayload.put('reviewers', reviewers);

        String payload = JSON.serialize(reviewerPayload);
        System.debug('GitHub Reviewer Payload: ' + payload);

        // Make HTTP callout
        Http http = new Http();
        HttpRequest request = new HttpRequest();
        request.setEndpoint(githubUrl);
        request.setMethod('POST');
        request.setHeader('Content-Type', 'application/json');
        request.setHeader('Accept', 'application/vnd.github+json');
        request.setBody(payload);

        try {
            HttpResponse response = http.send(request);
            System.debug('GitHub API Response: ' + response.getBody());
        } catch (Exception e) {
            System.debug('Error adding reviewers to GitHub PR: ' + e.getMessage());
        }
    }

}