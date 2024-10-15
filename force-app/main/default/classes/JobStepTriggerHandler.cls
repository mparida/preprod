public class JobStepTriggerHandler {

    public static void updateApproverInJobStep(List<Id> approvedJsIds){
        if (!approvedJsIds.isEmpty()) {
        List<ProcessInstance> processInstances = [SELECT Id, TargetObjectId,
                                                   (SELECT Id, StepStatus, OriginalActorId FROM Steps ORDER BY CreatedDate DESC LIMIT 1)
                                                   FROM ProcessInstance
                                                   WHERE TargetObjectId IN :approvedJsIds];
                                                   
        System.debug('processInstances print..'+processInstances);
        Map<Id, String> approvedIdMap = new Map<Id, String>();
       
        
        // Iterate through the ProcessInstances to retrieve approved IDs
        for (ProcessInstance processInstance : processInstances) {
            ProcessInstanceStep lastStep = processInstance.Steps[0]; // Get the last step
            if (lastStep.StepStatus == 'Approved') { // Check if the last step is approved
                approvedIdMap.put(processInstance.TargetObjectId, lastStep.OriginalActorId); // Store the approved ID
            }
        }
        System.debug('approvedIdMap'+approvedIdMap);
        List<copado__JobStep__c> jsToUpdate = new List<copado__JobStep__c>();
        for (copado__JobStep__c js : [SELECT Id, Deployment_Step_Approver__c FROM copado__JobStep__c WHERE Id IN :approvedIdMap.keySet()]) {
            system.debug('Approver id : '+approvedIdMap.get(js.Id));
            js.Deployment_Step_Approver__c = approvedIdMap.get(js.Id); // Set the Approved ID
            jsToUpdate.add(js);
        }
        update jsToUpdate;
    }
    }
}