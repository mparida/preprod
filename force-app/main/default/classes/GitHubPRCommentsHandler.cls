/**
 * Created by mp1863 on 08/04/25.
 */
@RestResource(UrlMapping='/github/api/prcommentshook/incoming/*')
global without sharing class GitHubPRCommentsHandler {
    @HttpPost
    global static void handleGitHubPR() {
        try{
            RestRequest request = RestContext.request;
            RestResponse response = RestContext.response;

            // Parse the JSON request body
            String requestBody = request.requestBody.toString();
            System.debug('requestBody::');
            System.debug(requestBody);
            response.statusCode = 200; 

        }catch (Exception e){
            System.debug('Exception while processing the GitHub PR hook...');
        }
    }
}