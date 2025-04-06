/**
 * Created by mp1863 on 21/03/25.
 */

public with sharing class GetJenkinsBuildStatusQueueable implements Queueable, Database.AllowsCallouts{
    private Id recordId;

    public GetJenkinsBuildStatusQueueable(Id recordId) {
        this.recordId = recordId;
    }

    public void execute(QueueableContext context) {
        try {
            Promotion_Test_Script__c pts = [
                    SELECT Id, Name, Test_Script__r.Jenkins_Test_Suite_Name__c, Job_Run_Status__c,
                            Job_Status_Retry_Count__c, Build__c
                    FROM Promotion_Test_Script__c
                    WHERE Id = :recordId
            ];

            System.debug('PROMOTION SCRIPT : ' + pts.Id + ' --- ' + pts.Name);
            System.debug('Test script name %%%%%%%%%' + pts.Test_Script__r.Jenkins_Test_Suite_Name__c);

            Map<String, Object> response = JenkinsJobService1.getJenkinsJobBuildStatus(
                    pts.Test_Script__r.Jenkins_Test_Suite_Name__c,
                    String.valueOf(pts.Build__c)
            );

            if (response != null && response.containsKey(Bwc_Constants.response_status)) {
                JenkinsJobUtil.updateJenkinsJobRunStatus(
                        pts, null, null,
                        (String) response.get(Bwc_Constants.response_status),
                        null
                );
            }
        } catch (Exception e) {
            System.debug('Error in GetJenkinsBuildStatusQueueable: ' + e.getMessage());
        }
    }
}