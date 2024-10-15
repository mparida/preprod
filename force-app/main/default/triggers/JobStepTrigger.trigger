trigger JobStepTrigger on copado__JobStep__c (after insert, after update) {
    CustomTrigger__mdt trgMdt = CustomTrigger__mdt.getInstance('JobStepTrigger');
    if(!trgMdt.On_off__c){
        return;
    }
	List<Id> approvedJsIds = new List<Id>();
    
    for (copado__JobStep__c js : Trigger.new) {
        if (js.Record_Approved__c && js.Deployment_Step_Approver__c == null) {
            approvedJsIds.add(js.Id);
        }
    }
    
    if (!approvedJsIds.isEmpty()) {
        JobStepTriggerHandler.updateApproverInJobStep(approvedJsIds);
    }
}