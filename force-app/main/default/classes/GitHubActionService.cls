/**
 * Created by mp1863 on 18/03/25.
 */

public with sharing class GitHubActionService {
    @AuraEnabled
    @Future(Callout=true)
    public static void triggerGitDiffAction(Id promotionId, String baseBranch, String headBranch) {
        try {
            String gitHubACCRepo = System.Label.GItHub_ACC_Repo;
            String apiUrl = 'callout:GitHubAPI/repos/'+gitHubACCRepo+'/actions/workflows/git-diff.yml/dispatches';

            Map<String, Object> requestBody = new Map<String, Object>{
                    'ref' => 'main',  // The default branch where workflow runs
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
}

