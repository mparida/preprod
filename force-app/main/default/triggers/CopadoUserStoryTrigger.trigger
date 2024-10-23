trigger CopadoUserStoryTrigger on copado__User_Story__c (before insert) {
    if(!TriggerFlags.runOnce){
        return;
    }
    CustomTrigger__mdt trgMdt = CustomTrigger__mdt.getInstance('UserStoryTrigger');
    if(!trgMdt.On_off__c){
        return;
    }
    List<String> itrackList = new List<String>();
    if(trigger.isBefore && trigger.isInsert){
        for(copado__User_Story__c ust : trigger.new){
            if(!String.isBlank(ust.iTrack_US__c) && !ust.Is_Created_from_Itrack_Utility__c){
                itrackList.add(ust.iTrack_US__c);
            }
        }
        if(!itrackList.isEmpty()){//When a new UST is created after rolling out this, this wont be executed if created from Utility
            CopadoUserStoryTriggerHandler.performItrackUSTVersioning(itrackList, Trigger.new);
        }
    }
}