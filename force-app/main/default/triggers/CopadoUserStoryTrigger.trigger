trigger CopadoUserStoryTrigger on copado__User_Story__c (before insert, before update, after update) {
    if(!TriggerFlags.runOnce){
        return;
    }
    System.debug('Value of runOnce in Trigger: '+TriggerFlags.runOnce);
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
            CopadoUserStoryTriggerHandler.performItrackUSTVersioning(itrackList, trigger.new);
        }
    }

    if(Trigger.isBefore && Trigger.isUpdate){
        System.debug('BEFORE TRIGGER UPDATE');
        CopadoUserStoryTriggerHandler.beforeUpdateCircularParentCheck(Trigger.newMap);
    }

     if(Trigger.isAfter && Trigger.isUpdate) {
         TriggerFlags.runOnce = false;
         Map<Id, copado__User_Story__c> newStyParentNotNULLMap = new Map<Id, copado__User_Story__c>();
         Map<Id, copado__User_Story__c> oldStyParentNULLMap = new Map<Id, copado__User_Story__c>();
         for(copado__User_Story__c ust : Trigger.newMap.values()){
             if(ust.Parent_User_Story__c != Trigger.oldMap.get(ust.Id).Parent_User_Story__c && ust.Shadow_ITrack_US__c != null){
                 if(Trigger.oldMap.get(ust.Id).Parent_User_Story__c == null){
                     System.debug('GETTING OLD PARENT NULL');
                     oldStyParentNULLMap.put(ust.Id, ust);
                 }
             }
         }
         if(oldStyParentNULLMap.size() == 0) {
             CopadoUserStoryTriggerHandler.changeParentUserStory(Trigger.newMap, Trigger.oldMap);
         }
         if(oldStyParentNULLMap.size() > 0) {
             CopadoUserStoryTriggerHandler.versionForOldParentAsNULL(oldStyParentNULLMap, Trigger.oldMap);
         }
     }
}