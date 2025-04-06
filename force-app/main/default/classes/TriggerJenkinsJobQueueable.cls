/**
 * Created by mp1863 on 21/03/25.
 */

public with sharing class TriggerJenkinsJobQueueable implements Queueable, Database.AllowsCallouts{
    private Id ptsId;
    private String jobName;
    private String envName;

    public TriggerJenkinsJobQueueable(Id ptsId, String jobName, String envName) {
        this.ptsId = ptsId;
        this.jobName = jobName;
        this.envName = envName;
    }

    public void execute(QueueableContext context) {
        Boolean isMockEnabled = Jenkins_Settings__mdt.getInstance(Bwc_Constants.metadata_defaultSettings).Is_Mock_Enabled__c;

        if (isMockEnabled) {
            Map<String, Object> mockResponse =  JenkinsJobService1.getMockResponsePOST(jobName);
            System.debug('build#' + mockResponse.get(Bwc_Constants.response_buildNumber));
            Integer buildNumber = Integer.valueOf(mockResponse.get(Bwc_Constants.response_buildNumber));
            JenkinsJobUtil.updateJenkinsJobRunStatus(null, ptsId, null, null, buildNumber);
        } else {
            String jobParams = BWC_JobMetadataHelper.getSerializedJobMetadata(jobName, envName);
            Map<String, Object> realResponse = JenkinsJobService1.initiateJenkinsJob(jobName, jobParams);
            Integer buildNumber = (Integer) realResponse.get(Bwc_Constants.response_buildNumber);
            JenkinsJobUtil.updateJenkinsJobRunStatus(null, ptsId, null, null, buildNumber);
        }
    }
}