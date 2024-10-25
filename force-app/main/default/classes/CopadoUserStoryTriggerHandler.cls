public with sharing class CopadoUserStoryTriggerHandler {
    public static void performItrackUSTVersioning(List<String> itrackList, List <copado__User_Story__c> newList) {
        Map<String, ItrackWrapper> itrackSTYMap = new Map<String, ItrackWrapper>();
        Map<String, String> parentItrackSTYMap = new Map<String, String>();
        //Either you create from Main Parent or from Any child, Parent is going to be Main Parent
        for (copado__User_Story__c ust : [
                SELECT Id, Name, iTrack_US__c, Shadow_ITrack_US__c, Itrack_UST_Version__c,
                        Parent_User_Story__r.Id, Parent_User_Story__r.iTrack_US__c
                FROM
                        copado__User_Story__c
                WHERE iTrack_US__c IN :itrackList OR
                Shadow_ITrack_US__c IN :itrackList
                ORDER BY CreatedDate ASC
        ]) {
            if (ust.Parent_User_Story__r.Id != null) {
                parentItrackSTYMap.put(ust.Parent_User_Story__r.Id, ust.Parent_User_Story__r.iTrack_US__c);
            }
            if (!itrackSTYMap.containsKey(ust.Shadow_ITrack_US__c)) {
                ItrackWrapper iwrap = new ItrackWrapper(ust.Id, ust.Itrack_UST_Version__c);
                if (ust.Parent_User_Story__r.Id != null) {
                    iwrap.parentId = ust.Parent_User_Story__r.Id;
                }
                itrackSTYMap.put(ust.iTrack_US__c, iwrap);
            } else {
                ItrackWrapper temp = itrackSTYMap.get(ust.Shadow_ITrack_US__c);
                if (ust.Parent_User_Story__r.Id != null) {
                    temp.parentId = ust.Parent_User_Story__r.Id;
                }
                temp.version++;
                itrackSTYMap.put(temp.id, temp);
            }
        }
        System.debug('parentItrackSTYMap>>>>>'+parentItrackSTYMap);
        for (copado__User_Story__c ust : newList) {
            if(itrackSTYMap.get(ust.iTrack_US__c) != null){
                ust.Shadow_ITrack_US__c = parentItrackSTYMap.containsKey(ust.Parent_User_Story__c) ? parentItrackSTYMap.get(ust.Parent_User_Story__c) : ust.iTrack_US__c;
                //ust.Parent_User_Story__c = ust.Parent_User_Story__c != null ? ust.Parent_User_Story__c : itrackSTYMap.get(ust.iTrack_US__c).id;
                ItrackWrapper temp = itrackSTYMap.get(ust.iTrack_US__c);
                temp.version++;
                itrackSTYMap.put(temp.id, temp);
                Decimal v = itrackSTYMap.get(ust.iTrack_US__c).version;
                ust.iTrack_US__c = parentItrackSTYMap.containsKey(ust.Parent_User_Story__c) ? parentItrackSTYMap.get(ust.Parent_User_Story__c) + '_v' + v : ust.iTrack_US__c + '_v' + v;
                ust.Itrack_UST_Version__c = v;
            }

        }
    }

    public static void createUserStoryRelationship(List<String> ustList, Map<Id, copado__User_Story__c> newMap) {
        Map<String, String> itrackToParentMap = new Map<String, String>();
        for(copado__User_Story__c ust : [SELECT Id, Name, iTrack_US__c, Shadow_ITrack_US__c FROM copado__User_Story__c
        WHERE Shadow_ITrack_US__c IN :ustList
        ORDER BY CreatedDate ASC]){
            if (!itrackToParentMap.containsKey(ust.Shadow_ITrack_US__c)) {
                itrackToParentMap.put(ust.Shadow_ITrack_US__c, ust.Id);
            }
        }
        List<copado__Team_Dependency__c> dependencyList = new List<copado__Team_Dependency__c>();
        for(copado__User_Story__c ust : newMap.values()){
            if(ust.Shadow_ITrack_US__c != null && itrackToParentMap.containsKey(ust.Shadow_ITrack_US__c)){
                copado__Team_Dependency__c dep = new copado__Team_Dependency__c();
                dep.copado__Provider_User_Story__c = itrackToParentMap.get(ust.Shadow_ITrack_US__c);
                dep.copado__Dependent_User_Story__c = ust.Id;
                dep.copado__Relationship_Type__c = 'blocking';
                dep.copado__Dependency_Status__c = 'New';
                dependencyList.add(dep);
            }
        }

        if(dependencyList.size() > 0){
            insert dependencyList;
        }
    }
}