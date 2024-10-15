public with sharing class CopadoUserStoryTriggerHandler {
    public static Boolean isFirstTime = true;
    public static void performItrackUSTVersioning(List<String> itrackList, List <copado__User_Story__c> newList) {
		Map<String, ItrackWrapper> itrackSTYMap = new Map<String, ItrackWrapper>();
        Map<String, String> parentItrackSTYMap = new Map<String, String>();
        for(copado__User_Story__c ust : [SELECT Id, Name, iTrack_US__c, Shadow_ITrack_US__c, Itrack_UST_Version__c,
                                    Parent_User_Story__r.Id, Parent_User_Story__r.iTrack_US__c  FROM
                                         copado__User_Story__c WHERE iTrack_US__c IN : itrackList OR
                                        Shadow_ITrack_US__c IN : itrackList ORDER BY CreatedDate ASC]){
            if(ust.Parent_User_Story__r.Id != null){
                parentItrackSTYMap.put(ust.Parent_User_Story__r.Id, ust.Parent_User_Story__r.iTrack_US__c);
            }
            if(!itrackSTYMap.containsKey(ust.Shadow_ITrack_US__c)){
                ItrackWrapper iwrap = new ItrackWrapper(ust.Id, ust.Itrack_UST_Version__c);
                if(ust.Parent_User_Story__r.Id != null){
                    iwrap.parentId = ust.Parent_User_Story__r.Id;
                }
                itrackSTYMap.put(ust.iTrack_US__c, iwrap);
            }else{
                ItrackWrapper temp = itrackSTYMap.get(ust.Shadow_ITrack_US__c);
                if(ust.Parent_User_Story__r.Id != null){
                    temp.parentId = ust.Parent_User_Story__r.Id;
                }
                temp.version++;
                itrackSTYMap.put(temp.id, temp);
            }
        }
        for(copado__User_Story__c ust : newList){
            ust.Shadow_ITrack_US__c = parentItrackSTYMap.containsKey(ust.Parent_User_Story__c) ? parentItrackSTYMap.get(ust.Parent_User_Story__c) : ust.iTrack_US__c;
            ust.Parent_User_Story__c =  ust.Parent_User_Story__c != null ? ust.Parent_User_Story__c : itrackSTYMap.get(ust.iTrack_US__c).id;
            ItrackWrapper temp = itrackSTYMap.get(ust.iTrack_US__c);
            temp.version++;
            itrackSTYMap.put(temp.id, temp);
            Decimal v = itrackSTYMap.get(ust.iTrack_US__c).version;
            ust.iTrack_US__c =  parentItrackSTYMap.containsKey(ust.Parent_User_Story__c) ? parentItrackSTYMap.get(ust.Parent_User_Story__c) + '_v'+v :  ust.iTrack_US__c + '_v'+v;
            ust.Itrack_UST_Version__c = v;
        }
    }

    public static void changeParentUserStory(Map <Id, copado__User_Story__c> newMap, Map<Id, copado__User_Story__c> oldMap) {
        List<copado__User_Story__c> ustUpdateList = new List<copado__User_Story__c>();
        Set<Id> oldParentUSTSet = new Set<Id> ();
        Map<String, String> oldvsNewMap = new Map<String, String>();//mapping old nd new parent ids
        for(copado__User_Story__c ust : newMap.values()){
            if(ust.Parent_User_Story__c != null && ust.Parent_User_Story__c != oldMap.get(ust.Id).Parent_User_Story__c){
                oldParentUSTSet.add(oldMap.get(ust.Id).Parent_User_Story__c);//Collect old parents
                oldvsNewMap.put(oldMap.get(ust.Id).Parent_User_Story__c, ust.Parent_User_Story__c);
            }
        }
        //Set old parents version to null
        for(Id id : oldParentUSTSet){
            copado__User_Story__c sty = new copado__User_Story__c(Id = id, Itrack_UST_Version__c = null);
            ustUpdateList.add(sty);
        }
        Map<Id, List<copado__User_Story__c>> oldParentUSTMap = new Map<Id, List<copado__User_Story__c>>();
        //Collect UST for Old Parents
        for(copado__User_Story__c ust : [SELECT Id, Parent_User_Story__c FROM copado__User_Story__c WHERE
                Parent_User_Story__c IN : oldParentUSTSet AND Id NOT IN : newMap.keySet() ORDER BY CreatedDate ASC]){
            if(!oldParentUSTMap.containsKey(ust.Parent_User_Story__c)){
                oldParentUSTMap.put(ust.Parent_User_Story__c, new List<copado__User_Story__c>{ust});
            }else{
                oldParentUSTMap.get(ust.Parent_User_Story__c).add(ust);
            }
        }
        //Assign new versions to the child stories and attach new Parent
        for(String Id : oldParentUSTMap.keySet()){
            Decimal v = 1;
            List<copado__User_Story__c> lst = oldParentUSTMap.get(Id);
            for(copado__User_Story__c ust : lst){
                ust.Parent_User_Story__c = oldvsNewMap.get(Id);
                ust.Itrack_UST_Version__c = v;
                ustUpdateList.add(ust);
                v++;//increment version
            }
        }
        
        if(ustUpdateList.size() > 0){
            try{
                update ustUpdateList;
            }catch(Exception ex){
           		System.debug(ex.getStackTraceString());
                throw new UserStoryException('There is an error while updating the Parent story, contact Devops team');
            }
        }
    }
}