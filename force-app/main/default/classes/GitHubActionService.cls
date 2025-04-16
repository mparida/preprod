/**
 * Created by mp1863 on 18/03/25.
 */

public with sharing class GitHubActionService {
    @AuraEnabled
    //@Future(Callout=true)
    public static void triggerGitDiffAction(Id promotionId, String baseBranch, String headBranch) {
        try {
            String gitHubACCRepo = System.Label.GItHub_ACC_Repo;
            String apiUrl = 'callout:GitHubAPI/repos/'+gitHubACCRepo+'/actions/workflows/git-diff.yml/dispatches';
            System.debug(apiUrl);

            Map<String, Object> requestBody = new Map<String, Object>{
                    'ref' => 'maintest',  // The default branch where workflow runs
                    'inputs' => new Map<String, String>{
                            'promotionId'=>promotionId,
                            'baseBranch' => baseBranch,
                            'headBranch' => headBranch
                    }
            };

            HttpRequest req = new HttpRequest();
            req.setEndpoint(apiUrl);
            req.setMethod('POST');
            //req.setHeader('Authorization', 'Bearer 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');
            req.setHeader('Accept', 'application/vnd.github.v3+json');
            req.setHeader('Content-Type', 'application/json');
            req.setBody(JSON.serialize(requestBody));

            Http http = new Http();
            HttpResponse res = http.send(req);

            if (res.getStatusCode() == 204) {

            } else {
                throw new UserAccessException('GitHub API Error: ' + res.getBody());
            }
        } catch (Exception e) {
            System.debug('🔥 Error triggering GitHub Action: ' + e.getMessage());
            System.debug('Stack Tracce: ' + e.getStackTraceString()); 
        }
    }

    public static void triggerEslintScan(String userStoryId, String userStoryCommitId, String commitSha) {
        try {
            // Replace with your repo path and workflow file
            String repoPath = 'ATT-DP5/apm0013668-ccsf-acc-sfdc';//System.Label.GItHub_ACC_Repo; // 👈 update this

            // Build the REST API URL using Named Credential
            String apiUrl = 'callout:GitHubAPI/repos/' + repoPath + '/actions/workflows/eslint.yml/dispatches';
            System.debug(apiUrl);

            // Payload for the workflow_dispatch event
            Map<String, Object> body = new Map<String, Object>{
                    //'ref' => 'maintest3', // The branch where your workflow lives
                    'ref' => 'eslint', // The branch where your workflow lives
                    'inputs' => new Map<String, String>{
                            'userStoryId' => userStoryId,
                            'userStoryCommitId' => userStoryCommitId,
                            'commitId' => commitSha
                    }
            };

            HttpRequest req = new HttpRequest();
            req.setEndpoint(apiUrl);
            req.setMethod('POST');
            req.setHeader('Accept', 'application/vnd.github.v3+json');
            req.setHeader('Content-Type', 'application/json');
            req.setBody(JSON.serialize(body));

            Http http = new Http();
            HttpResponse res = http.send(req);
            System.debug('after call');
            if (res.getStatusCode() != 204) {
                System.debug('⚠️ GitHub Action trigger failed: ' + res.getStatusCode() + ' ' + res.getBody());
                throw new CalloutException('GitHub Action failed: ' + res.getStatusCode());
            } else {
                System.debug('✅ GitHub Action triggered successfully!');
            }
        } catch (Exception e) {
            System.debug('🔥 Exception while triggering GitHub ESLint scan: ' + e.getMessage());
        }
    }
}