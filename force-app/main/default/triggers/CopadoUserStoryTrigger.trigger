trigger CopadoUserStoryTrigger on copado__User_Story__c (before insert, after update) {
    if(!TriggerFlags.runOnce){
        return;
    }
    System.debug('Value of runOnce in Trigger: '+TriggerFlags.runOnce);
    TriggerFlags.runOnce = false;
    CustomTrigger__mdt trgMdt = CustomTrigger__mdt.getInstance('UserStoryTrigger');
    if(!trgMdt.On_off__c){
        return;
    }

    /*List<String> itrackList = new List<String>();
    if(trigger.isBefore && trigger.isInsert){
        for(copado__User_Story__c ust : trigger.new){
            if(!String.isBlank(ust.iTrack_US__c) && !ust.Is_Created_from_Itrack_Utility__c){
                itrackList.add(ust.iTrack_US__c);
            }
        }
        if(!itrackList.isEmpty()){//When a new UST is created after rolling out this, this wont be executed if created from Utility
            CopadoUserStoryTriggerHandler.performItrackUSTVersioning(itrackList, trigger.new);
        }
    }*/

    List<copado__User_Story__c> styList;
     if(Trigger.isAfter && Trigger.isUpdate) {
         styList = CopadoUserStoryTriggerHandler.changeParentUserStory(Trigger.newMap, Trigger.oldMap);
         update styList;
     }
    /*if(styList != null && !styList.isEmpty()){
        update styList;
    }*/
}