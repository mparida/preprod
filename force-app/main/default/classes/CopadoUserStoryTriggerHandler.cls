public with sharing class CopadoUserStoryTriggerHandler {
    public static void performUSTVersioning(List<copado__User_Story__c> clonedList){
        Map<Id, List<copado__User_Story__c>> clonedSourceIdMap = new Map<Id, List<copado__User_Story__c>>();
        List <copado__User_Story__c> updateItrackList = new List<copado__User_Story__c>();
        for(copado__User_Story__c us : clonedList){
            if(!clonedSourceIdMap.containsKey(us.getCloneSourceId())){
                clonedSourceIdMap.put(us.getCloneSourceId(), new List<copado__User_Story__c>{us});
            }else{
                clonedSourceIdMap.get(us.getCloneSourceId()).add(us);
            }
        }
        Map<Id, String> idToITrackKeyMap = new Map<Id, String>();
        for(copado__User_Story__c us: [SELECT Id, iTrack_US__c FROM copado__User_Story__c WHERE Id IN : clonedSourceIdMap.keySet()]){
            if(!idToITrackKeyMap.containsKey(us.Id)){
                idToITrackKeyMap.put(us.Id, us.iTrack_US__c);
            }
        }
        Map<Id, Integer> ParentToRecordsMap = new Map<Id, Integer>();
        AggregateResult[] result = [SELECT copado__Provider_User_Story__c,
                COUNT(Id)numChild FROM copado__Team_Dependency__c
        WHERE copado__Provider_User_Story__c IN :  clonedSourceIdMap.keySet()
        GROUP BY copado__Provider_User_Story__c];
        for (AggregateResult ar : result)  {
            ParentToRecordsMap.put((Id)ar.get('copado__Provider_User_Story__c'), Integer.valueOf(ar.get('numChild')));
        }
        System.debug('ParentToRecordsMap>>'+ParentToRecordsMap);
        for(Id parent : clonedSourceIdMap.keySet()){
            Integer v = ParentToRecordsMap.get(parent)!=null ? ParentToRecordsMap.get(parent) : 0;
            System.debug('version:'+v);
            for(copado__User_Story__c us : clonedSourceIdMap.get(parent)){
                v++;
                us.iTrack_US__c = idToITrackKeyMap.get(parent)+'_v'+v;
            }
        }
    }

    public static void assignParent(List<copado__User_Story__c> clonedList){
        List<copado__Team_Dependency__c> listDep = new List<copado__Team_Dependency__c>();
        for(copado__User_Story__c us : clonedList){
            copado__Team_Dependency__c dependency = new copado__Team_Dependency__c();
            dependency.copado__Provider_User_Story__c = us.getCloneSourceId();
            dependency.copado__Dependent_User_Story__c = us.Id;
            listDep.add(dependency);
        }
        if(listDep.size() > 0){
            insert listDep;
        }
    }
}