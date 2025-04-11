/**
 * Created by manojparida on 12/02/25.
 */

public with sharing class PromotionTriggerHandler {

    public static void triggerJenkinsJob(copado__Promotion__c promo){
        /*List<Promotion_Test_Script__c> pts = new List<Promotion_Test_Script__c>([SELECT Id, Test_Script__r.Jenkins_Test_Suite_Name__c,
                Job_Trigger_Status__c, Job_Run_Status__c, Job_Trigger_Retry_Count__c, Job_Status_Retry_Count__c
        FROM Promotion_Test_Script__c LIMIT 5]);
        Map<String, String> jobParams = new Map<String, String>();
        // Use Schema to loop dynamically through all fields (no need to hardcode field names)
        Jenkins_Job_Parameters__mdt jobMetadata = Jenkins_Job_Parameters__mdt.getInstance(promo.Source_Env__c);
        if (jobMetadata != null) {
            for (Schema.SObjectField field : Schema.getGlobalDescribe().get('Jenkins_Job_Parameters__mdt').getDescribe().fields.getMap().values()) {
                String fieldName = field.getDescribe().getName();
                Object fieldValue = jobMetadata.get(fieldName);
                if (fieldValue != null) { // Ignore null fields
                    jobParams.put(fieldName, String.valueOf(fieldValue));
                }
            }
        }*/
    }

    public static void triggerGitHubDifference(copado__Promotion__c promo){
        copado__Promotion__c promotion = [SELECT copado__Project__r.copado__Deployment_Flow__r.copado__Git_Repository__r.copado__Branch_Base_URL__c,
                copado__Project__r.copado__Deployment_Flow__c,
                Source_Env__c, Destination_Env__c FROM copado__Promotion__c WHERE Id =: promo.Id];

        copado__Deployment_Flow_Step__c flowStep = [SELECT copado__Branch__c, copado__Destination_Branch__c FROM copado__Deployment_Flow_Step__c
        WHERE copado__Source_Environment__r.Name =: promotion.Source_Env__c AND
        copado__Destination_Environment__r.Name =: promotion.Destination_Env__c AND
        copado__Deployment_Flow__c =: promotion.copado__Project__r.copado__Deployment_Flow__c
        ];
        GitHubActionService.triggerGitDiffAction(promo.Id, flowStep.copado__Destination_Branch__c,flowStep.copado__Branch__c);
    }

}