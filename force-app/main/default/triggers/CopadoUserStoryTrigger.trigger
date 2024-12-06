trigger CopadoUserStoryTrigger on copado__User_Story__c (before insert, after insert) {
    if(!TriggerFlags.runOnce){
        return;
    }
    CustomTrigger__mdt trgMdt = CustomTrigger__mdt.getInstance('UserStoryTrigger');
    if(!trgMdt.On_off__c){
        return;
    }
    List<String> itrackList = new List<String>();
    if(trigger.isBefore && trigger.isInsert){
        List<copado__User_Story__c> clonedList = new List<copado__User_Story__c>();
        for(copado__User_Story__c ust : trigger.new){
            if(ust.getCloneSourceId() != null)
                clonedList.add(ust);
        }
        CopadoUserStoryTriggerHandler.performUSTVersioning(clonedList);
    }

    List<String> usetList = new List<String>();
    if(trigger.isAfter && trigger.isInsert){
        List<copado__User_Story__c> clonedList = new List<copado__User_Story__c>();
        for(copado__User_Story__c ust : trigger.new){
            if(ust.getCloneSourceId() != null)
                clonedList.add(ust);
        }
        CopadoUserStoryTriggerHandler.assignParent(clonedList);

    }

}