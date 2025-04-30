public with sharing class JenkinsJobTriggerES {

    public static ExternalService.JenkinsJobTriggerAPI_TriggerJobResponse triggerJob(
        String jobName,
        String environment,
        String branch,
        String traceId
    ) {
        try {
            System.debug('=== STARTING JENKINS JOB TRIGGER ===');
            System.debug('Input parameters - Job: ' + jobName + ', Env: ' + environment + ', Branch: ' + branch);

            // 1. Prepare build parameters
            ExternalService.JenkinsJobTriggerAPI_TriggerJobRequest_buildParameters params =
                new ExternalService.JenkinsJobTriggerAPI_TriggerJobRequest_buildParameters();
            params.environment = environment;
            params.environment_set = true;

            if(String.isNotBlank(branch)) {
                params.branch = branch;
                params.branch_set = true;
                System.debug('Branch parameter set: ' + branch);
            }

            // 2. Create main request BODY
            ExternalService.JenkinsJobTriggerAPI_TriggerJobRequest requestBody =
                new ExternalService.JenkinsJobTriggerAPI_TriggerJobRequest();
            requestBody.jobName = jobName;
            requestBody.jobName_set = true;
            requestBody.buildParameters = params;
            requestBody.buildParameters_set = true;
            requestBody.triggeredBy = UserInfo.getUserId();
            requestBody.triggeredBy_set = true;

            // 3. Create the actual External Service REQUEST wrapper
            ExternalService.JenkinsJobTriggerAPI.triggerJob_Request request = 
                new ExternalService.JenkinsJobTriggerAPI.triggerJob_Request();
            request.body = requestBody;
            request.body_set = true;
            request.idpx2dtracex2did = traceId; // Note the encoded field name
            request.idpx2dtracex2did_set = true;

            System.debug('Final Request: ' + JSON.serializePretty(request));

            // 4. Execute call
            ExternalService.JenkinsJobTriggerAPI.triggerJob_Response response =
                new ExternalService.JenkinsJobTriggerAPI().triggerJob(request);

            System.debug('=== RESPONSE RECEIVED ===');
            System.debug('Status Code: ' + response.responseCode);
            
            if(response.Code201 != null) {
                System.debug('Success: ' + response.Code201.message);
                return response.Code201;
            }
            throw new CalloutException('Unexpected response format');

        } catch(ExternalService.JenkinsJobTriggerAPI.triggerJob_ResponseException e) {
            System.debug('=== API ERROR ===');
            System.debug('Status Code: ' + e.responseCode);
            
            // Handle different error responses
            String errorMsg = 'HTTP ' + e.responseCode + ': ';
            if(e.Code400 != null) {
                errorMsg += e.Code400.description;
            } else if(e.Code500 != null) {
                errorMsg += e.Code500.description;
            } else {
                errorMsg += e.defaultResponse;
            }
            
            ExternalService.JenkinsJobTriggerAPI_TriggerJobResponse errorResponse = 
                new ExternalService.JenkinsJobTriggerAPI_TriggerJobResponse();
            errorResponse.message = errorMsg;
            return errorResponse;
            
        } catch(Exception e) {
            System.debug('=== UNEXPECTED ERROR ===');
            System.debug('Type: ' + e.getTypeName());
            System.debug('Message: ' + e.getMessage());
            
            ExternalService.JenkinsJobTriggerAPI_TriggerJobResponse errorResponse = 
                new ExternalService.JenkinsJobTriggerAPI_TriggerJobResponse();
            errorResponse.message = 'Unexpected error: ' + e.getMessage();
            return errorResponse;
        }
    }
}