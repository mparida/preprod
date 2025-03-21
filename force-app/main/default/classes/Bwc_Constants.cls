/**
 * Created by mp1863 on 24/10/24.
 */

public with sharing class Bwc_Constants {
    public static final List<String> disallowedPatterns = new List<String>{'/', 'force-app', 'main/default'};
    public static final String requiredPhrase = 'handled automatically';
    public static final Decimal callOutStatus_201 = 201;
    public static final String Job_Status_Success = 'SUCCESS';
    public static final String Job_Status_Running = 'RUNNING';
    public static final String Job_Status_Failed = 'FAILURE';
    public static final String Job_Status_Aborted = 'ABORTED';
    public static final String Job_Status_Unstable = 'UNSTABLE';
    public static final String Job_Status_NotBuilt = 'NOT_BUILT';
    public static final Decimal callOutStatus_200 = 200;
    public static final String response_message = 'message';
    public static final String response_jobName = 'jobName';
    public static final String response_queueId = 'queueId';
    public static final String response_jobUrl = 'jobUrl';
    public static final String response_statusCode = 'statusCode';
    public static final String response_executable = 'executable';
    public static final String response_number = 'number';
    public static final String response_status = 'status';
    public static final String response_buildNumber = 'buildNumber';
    public static final String response_result = 'result';
    public static final String header_JSESSIONID = 'JSESSIONID';
    public static final String header_crumbToken = 'crumbToken';
    public static final String header_crumbField = 'crumbField';
    public static final String header_sessionCookie = 'sessionCookie';
    public static final String metadata_defaultSettings = 'Default_Settings';

    public static final String api_Name_getBuildStatus = 'get build status';
    public static final String api_Name_triggerJenkinsJob = 'trigger jenkins job';
    public static final String HTTP_TRACE_ID_HEADER = 'idp-trace-id';


}