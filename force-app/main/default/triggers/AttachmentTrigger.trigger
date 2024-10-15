trigger AttachmentTrigger on Attachment (after insert) {
    CustomTrigger__mdt trgMdt = CustomTrigger__mdt.getInstance('AttachmentTrigger');
    if(!trgMdt.On_off__c){
        return;
    }
    if(trigger.isInsert && trigger.isAfter){
		if(trigger.new.get(0).parentId != null && Utilities.getObjectNameFromId(trigger.new.get(0).parentId) == 'copado__Apex_Test_Result__c'){
			AttachmentTriggerHandler.createTestFailureRecords(trigger.new.get(0));
        }
    }
}