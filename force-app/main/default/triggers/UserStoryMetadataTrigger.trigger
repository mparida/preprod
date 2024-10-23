/**
 * Created by mp1863 on 23/10/24.
 */

trigger UserStoryMetadataTrigger on copado__User_Story_Metadata__c (before insert) {
    CustomTrigger__mdt trgMdt = CustomTrigger__mdt.getInstance('UserStoryMetadataTrigger');
    if(!trgMdt.On_off__c){
        return;
    }

    Set<String> restrictedMetadataSet = new Set<String>();
    Map<String, CLI_Restricted_Metadatatypes__mdt> metadataMap = CLI_Restricted_Metadatatypes__mdt.getAll();
    for (CLI_Restricted_Metadatatypes__mdt metadata : metadataMap.values()) {
        if (!metadata.isAllowed__c) {
            restrictedMetadataSet.add(metadata.DeveloperName);
        }
    }

    List<copado__User_Story_Metadata__c> stopList = new List<copado__User_Story_Metadata__c>();
    for(copado__User_Story_Metadata__c ustMeta : Trigger.new){
        if(ustMeta.copado__Type__c != null && restrictedMetadataSet.contains(ustMeta.copado__Type__c)){
            stopList.add(ustMeta);
        }
    }

    if(stopList.size() > 0){
        UserStoryMetadataTriggerHandler.adErrorIfCommittedFromCLIAndNotify(stopList);
    }

}