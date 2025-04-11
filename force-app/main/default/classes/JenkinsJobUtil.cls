/**
 * Created by manojparida on 12/02/25.
 */

public without sharing class JenkinsJobUtil {
    public static void updateJenkinsJobRunStatus(Promotion_Test_Script__c pts, Id promotionTestId, String JobTriggerStatus, String JobRunStatus, Integer buildNumber) {
        if (pts == null) {
            pts = [SELECT Id, Job_Trigger_Status__c, Job_Run_Status__c,
                    Job_Trigger_Retry_Count__c, Job_Status_Retry_Count__c
            FROM Promotion_Test_Script__c WHERE Id =: promotionTestId];
        }
        Datetime retryTime = System.now().addSeconds(Integer.valueOf(Label.Jenkins_Build_Status_Retry_Time_Seconds));
        // Handle Job Trigger Status Update
        if(buildNumber != null){
            if (buildNumber != -100) {
                if(Bwc_Constants.Job_Status_Failed.equals(pts.Job_Trigger_Status__c)){
                    pts.Job_Trigger_Retry_Count__c++;
                }
                pts.Build__c = buildNumber;
                pts.Job_Trigger_Status__c = Bwc_Constants.Job_Status_Success;
                pts.Trigger_Jenkins_GET_Job_Time__c = retryTime;
            }else{
                pts.Job_Trigger_Status__c = Bwc_Constants.Job_Status_Failed;
                pts.Trigger_Jenkins_GET_Job_Time__c = retryTime;
            }
        }

        // Handle Job Run Status Update
        if (JobRunStatus != null) {
            if (JobRunStatus.equals(Bwc_Constants.Job_Status_Success) && Bwc_Constants.Job_Status_NotBuilt.equals(pts.Job_Run_Status__c)) {
                System.debug('1'+pts.Id);
                pts.Job_Run_Status__c = Bwc_Constants.Job_Status_Success;
                pts.Job_Status_Retry_Count__c = (pts.Job_Status_Retry_Count__c != null) ? pts.Job_Status_Retry_Count__c + 1 : 1;
            } else if (JobRunStatus.equals(Bwc_Constants.Job_Status_NotBuilt) && Bwc_Constants.Job_Status_NotBuilt.equals(pts.Job_Run_Status__c)) {
                System.debug('2'+pts.Id);
                pts.Job_Run_Status__c = Bwc_Constants.Job_Status_NotBuilt;
                pts.Retry_Build_Status__c = false;
                pts.Job_Status_Retry_Count__c = (pts.Job_Status_Retry_Count__c != null) ? pts.Job_Status_Retry_Count__c + 1 : 1;
                pts.Trigger_Jenkins_GET_Job_Time__c = retryTime;
            }else if (JobRunStatus.equals(Bwc_Constants.Job_Status_NotBuilt)) {
                System.debug('3'+pts.Id);
                pts.Job_Run_Status__c = Bwc_Constants.Job_Status_NotBuilt;
                pts.Retry_Build_Status__c = false;
                pts.Trigger_Jenkins_GET_Job_Time__c = retryTime;
            }else if(JobRunStatus.equals(Bwc_Constants.Job_Status_Failed)){
                System.debug('4'+pts.Id);
                pts.Job_Run_Status__c = Bwc_Constants.Job_Status_Failed;
            }else{
                System.debug('5'+pts.Id);
                pts.Job_Run_Status__c = Bwc_Constants.Job_Status_Success;
            }
        }
        update pts;
    }

    public static Map<String, String> getJobParams(String envName){
        Map<String, String> jobParams = new Map<String, String>();
        // Use Schema to loop dynamically through all fields (no need to hardcode field names)
        Jenkins_Job_Config__mdt jobMetadata = Jenkins_Job_Config__mdt.getInstance(envName != null ? envName : 'Default');
        if (jobMetadata != null) {
            for (Schema.SObjectField field : Schema.getGlobalDescribe().get('Jenkins_Job_Parameters__mdt').getDescribe().fields.getMap().values()) {
                String fieldName = field.getDescribe().getName();
                Object fieldValue = jobMetadata.get(fieldName);
                if (fieldValue != null) {
                    jobParams.put(fieldName, String.valueOf(fieldValue));
                }
            }
        }
        return jobParams;
    }

    public static String extractRelativePath(String fullUrl) {
        try {
            // Extract everything after the first occurrence of "/queue/item/"
            Integer startIndex = fullUrl.indexOf('/queue/item/');
            if (startIndex != -1) {
                return fullUrl.substring(startIndex);
            }
        } catch (Exception e) {
            System.debug('Error extracting relative path from URL: ' + e.getMessage());
        }
        throw new CalloutException('Invalid Jenkins Location URL: ' + fullUrl);
    }
}