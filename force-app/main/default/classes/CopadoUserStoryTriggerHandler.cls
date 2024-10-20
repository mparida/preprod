public with sharing class CopadoUserStoryTriggerHandler {
    public static void performItrackUSTVersioning(List<String> itrackList, List <copado__User_Story__c> newList) {
		Map<String, ItrackWrapper> itrackSTYMap = new Map<String, ItrackWrapper>();
        Map<String, String> parentItrackSTYMap = new Map<String, String>();
        //Either you create from Main Parent or from Any child, Parent is going to be Main Parent
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
        Set<String> oldParentUSTSet = new Set<String> ();
        Map<String, String> oldvsNewMap = new Map<String, String>();//mapping old nd new parent ids
        Map<String, String> oldParentItrackId = new Map<String, String>();//Store old Parent Itrack Id#
        Set<String> oldSTYsWithNoParentSet = new Set<String>();
        //prepare the mapping between old parent to New Parent
        for(copado__User_Story__c ust : newMap.values()){
            if(ust.Parent_User_Story__c != null && ust.Parent_User_Story__c != oldMap.get(ust.Id).Parent_User_Story__c){
                //if(oldMap.get(ust.Id).Parent_User_Story__c!=null){
                    oldParentUSTSet.add(oldMap.get(ust.Id).Parent_User_Story__c);//Collect old parents
                    oldvsNewMap.put(oldMap.get(ust.Id).Parent_User_Story__c, ust.Parent_User_Story__c);
                    oldParentItrackId.put(oldMap.get(ust.Id).Parent_User_Story__c, ust.Shadow_ITrack_US__c);
                //}
            }
        }
        System.debug('Print oldvsNewMap = '+oldvsNewMap);
        System.debug('Print oldParentUSTSet:'+oldParentUSTSet);
        //Set old parents version to null and Itrack Id # to invalid, retrieve as above and store in oldParentItrackId Map?
        for(Id id : oldParentUSTSet){
            //Set old Parent Itrack Version to Null, and Itrack Id to invalid.
            //Case: What id someone again tries to make this as Parent??
            copado__User_Story__c OldParentsty = new copado__User_Story__c(Id = id, Itrack_UST_Version__c = null, iTrack_US__c = oldParentItrackId.get(id)+'_Invalid'+RandomTextGenerator.generateRandomText(5));
            ustUpdateList.add(OldParentsty);
            //Set New Parent Itrack Version to 1, and Itrack Id to Actual.
            copado__User_Story__c newParentSty = new copado__User_Story__c(id = oldvsNewMap.get(id), Itrack_UST_Version__c = 1, iTrack_US__c = oldParentItrackId.get(id), Parent_User_Story__c = null);
            System.debug('OldParentsty=='+OldParentsty);
            System.debug('newParentSty=='+newParentSty);
            ustUpdateList.add(newParentSty);
        }
        System.debug('NEW PARENTS - oldvsNewMap.values() #::'+oldvsNewMap.values());
        //Set New Parent Version and Itrack Id # to actual
        Map<String, List<copado__User_Story__c>> oldParentUSTMap = new Map<String, List<copado__User_Story__c>>();
        //Collect UST for Old Parents
        oldParentUSTSet.addAll(oldvsNewMap.values());
        System.debug('oldParentUSTSet:::'+oldParentUSTSet);
        Map<String, String> IdToParentIdMapping = new Map<String, String>();
        for(copado__User_Story__c ust : [SELECT Id, Name, iTrack_US__c, Parent_User_Story__c, Shadow_ITrack_US__c FROM copado__User_Story__c WHERE
                Parent_User_Story__c IN : oldParentUSTSet AND
                Shadow_ITrack_US__c IN : oldParentItrackId.values() AND
                Id NOT IN : oldvsNewMap.values() //This filters the new Parent which we dont want to version, since it is versioned 1
                ORDER BY CreatedDate ASC]){
            if(!oldParentUSTMap.containsKey(ust.Shadow_ITrack_US__c)){
                oldParentUSTMap.put(ust.Shadow_ITrack_US__c, new List<copado__User_Story__c>{ust});
            }else{
                oldParentUSTMap.get(ust.Shadow_ITrack_US__c).add(ust);
            }
            IdToParentIdMapping.put(ust.Id, ust.Parent_User_Story__c);
        }
        System.debug('oldParentUSTMap>>>>>'+oldParentUSTMap);
        //Assign new versions to the child stories and attach new Parent
        for(String Id : oldParentUSTMap.keySet()){
            Decimal v = 2;
            List<copado__User_Story__c> lst = oldParentUSTMap.get(Id);
            Set<Decimal> versions = new Set<Decimal>();
            for(copado__User_Story__c ust : lst){
                ust.Parent_User_Story__c = oldvsNewMap.containsKey(ust.Parent_User_Story__c)?oldvsNewMap.get(ust.Parent_User_Story__c) : IdToParentIdMapping.get(ust.Id);//oldvsNewMap.get(Id)!=null?oldvsNewMap.get(Id):ust.Parent_User_Story__c;
                ust.Itrack_UST_Version__c = v;
                ust.iTrack_US__c = Id+'_v'+v;
                ustUpdateList.add(ust); // Only update if it hasn't been processed
                v++;//increment version
            }
        }
        System.debug('----------------------------------------------------------------------------------------------------------------------------');
        if(ustUpdateList.size() > 0){
            for(copado__User_Story__c ust: ustUpdateList){
                System.debug('Print the USer Story , Name = ' + ust.Name + ', Itrack # =  '+ust.iTrack_US__c + ', Version ='+ust.Itrack_UST_Version__c +
                        ', Shadow Itrack Id = '+ust.Shadow_ITrack_US__c+' Id ='+ust.Id+' Parent ='+ust.Parent_User_Story__c);
            }
            update ustUpdateList;
        }
    }

    public static void versionForOldParentAsNULL(Map <Id, copado__User_Story__c> newMap, Map<Id, copado__User_Story__c> oldMap) {
        Map<String, String> itrackToNewParentMap = new Map<String, String>();
        List<copado__User_Story__c> ustUpdateList = new List<copado__User_Story__c>();
        for(copado__User_Story__c ust : newMap.values()){
            if(!itrackToNewParentMap.containsKey(ust.Shadow_ITrack_US__c)){
                itrackToNewParentMap.put(ust.Shadow_ITrack_US__c, ust.Parent_User_Story__c);
            }
        }
        System.debug('100 itrackToNewParentMap'+itrackToNewParentMap);
        if(itrackToNewParentMap.size() > 0){
            for(String parent : itrackToNewParentMap.keySet()){
                copado__User_Story__c pStory = new copado__User_Story__c(Id = itrackToNewParentMap.get(parent), Shadow_ITrack_US__c = parent, iTrack_US__c = parent);
                ustUpdateList.add(pStory);
            }
        }
        Map<String, List<copado__User_Story__c>> itrackKeyToStoriesMap = new Map<String, List<copado__User_Story__c>>();
        for(copado__User_Story__c ust : [SELECT Id, Name, iTrack_US__c, Parent_User_Story__c, Shadow_ITrack_US__c
                    FROM copado__User_Story__c WHERE
                    Shadow_ITrack_US__c IN : itrackToNewParentMap.keySet()
                    ORDER BY Shadow_ITrack_US__c ASC, CreatedDate ASC
        ]){
            if(!itrackKeyToStoriesMap.containsKey(ust.Shadow_ITrack_US__c)){
                itrackKeyToStoriesMap.put(ust.Shadow_ITrack_US__c, new List<copado__User_Story__c>{ust});
            }else{
                itrackKeyToStoriesMap.get(ust.Shadow_ITrack_US__c).add(ust);
            }
        }
        System.debug('200 itrackKeyToStoriesMap::'+itrackKeyToStoriesMap);
        for(String itrackKey : itrackKeyToStoriesMap.keySet()){
            List<copado__User_Story__c> lst = itrackKeyToStoriesMap.get(itrackKey);
            Decimal v = 2;
            for(copado__User_Story__c ust : lst){
                if(!itrackToNewParentMap.values().contains(ust.Id)){
                    ust.Parent_User_Story__c = itrackToNewParentMap.containsKey(itrackKey)?itrackToNewParentMap.get(itrackKey) : null;//oldvsNewMap.get(Id)!=null?oldvsNewMap.get(Id):ust.Parent_User_Story__c;
                    ust.Itrack_UST_Version__c = v;
                    ust.iTrack_US__c = itrackKey+'_v'+v;
                    ustUpdateList.add(ust); // Only update if it hasn't been processed
                    v++;//increment version
                }
            }
        }
        if(ustUpdateList.size() > 0){
            for(copado__User_Story__c ust: ustUpdateList){
                System.debug('Print the USer Story , Name = ' + ust.Name + ', Itrack # =  '+ust.iTrack_US__c + ', Version ='+ust.Itrack_UST_Version__c +
                        ', Shadow Itrack Id = '+ust.Shadow_ITrack_US__c+' Id ='+ust.Id+' Parent ='+ust.Parent_User_Story__c);
            }
            update ustUpdateList;
        }
    }
}