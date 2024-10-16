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

    public static List<copado__User_Story__c> changeParentUserStory(Map <Id, copado__User_Story__c> newMap, Map<Id, copado__User_Story__c> oldMap) {
        List<copado__User_Story__c> ustUpdateList = new List<copado__User_Story__c>();
        Set<String> oldParentUSTSet = new Set<String> ();
        Map<String, String> oldvsNewMap = new Map<String, String>();//mapping old nd new parent ids
        Map<String, String> oldParentItrackId = new Map<String, String>();//Store old Parent Itrack Id#
        //prepare the mapping between old parent to New Parent
        for(copado__User_Story__c ust : newMap.values()){
            if(ust.Parent_User_Story__c != null && ust.Parent_User_Story__c != oldMap.get(ust.Id).Parent_User_Story__c){
                if(oldMap.get(ust.Id).Parent_User_Story__c!=null){
                    oldParentUSTSet.add(oldMap.get(ust.Id).Parent_User_Story__c);//Collect old parents
                }

                oldvsNewMap.put(oldMap.get(ust.Id).Parent_User_Story__c, ust.Parent_User_Story__c);
                oldParentItrackId.put(oldMap.get(ust.Id).Parent_User_Story__c, ust.Shadow_ITrack_US__c);
            }
        }
        //Set old parents version to null and Itrack Id # to invalid, retrieve as above and store in oldParentItrackId Map?
        for(Id id : oldParentUSTSet){
            copado__User_Story__c OldParentsty = new copado__User_Story__c(Id = id, Itrack_UST_Version__c = null, iTrack_US__c = oldParentItrackId.get(id)+'_Invalid');
            ustUpdateList.add(OldParentsty);
            copado__User_Story__c newParentSty = new copado__User_Story__c(id = oldvsNewMap.get(id), Itrack_UST_Version__c = 1, iTrack_US__c = oldParentItrackId.get(id), Parent_User_Story__c = null);
            ustUpdateList.add(newParentSty);
        }
        System.debug('newMap: '+newMap.size());
        System.debug('NEW PARENTS #::'+oldvsNewMap.values());
        //Set New Parent Version and Itrack Id # to actual
        Map<String, List<copado__User_Story__c>> oldParentUSTMap = new Map<String, List<copado__User_Story__c>>();
        //Collect UST for Old Parents
        oldParentUSTSet.addAll(oldvsNewMap.values());
        System.debug('oldParentUSTSet:::'+oldParentUSTSet);
        for(copado__User_Story__c ust : [SELECT Id, Name, iTrack_US__c, Parent_User_Story__c, Shadow_ITrack_US__c FROM copado__User_Story__c WHERE
                Parent_User_Story__c IN : oldParentUSTSet AND
                Id NOT IN : oldvsNewMap.values()
                ORDER BY CreatedDate ASC]){
            if(!oldParentUSTMap.containsKey(ust.Shadow_ITrack_US__c)){
                oldParentUSTMap.put(ust.Shadow_ITrack_US__c, new List<copado__User_Story__c>{ust});
            }else{
                oldParentUSTMap.get(ust.Shadow_ITrack_US__c).add(ust);
            }
        }
        System.debug('oldParentUSTMap>>>>>'+oldParentUSTMap.size());
        //Assign new versions to the child stories and attach new Parent
        for(String Id : oldParentUSTMap.keySet()){
            //System.debug('Parent id in Map : '+Id);
            Decimal v = 2;
            List<copado__User_Story__c> lst = oldParentUSTMap.get(Id);
            //System.debug('lst size:'+lst.size());
            Set<Decimal> versions = new Set<Decimal>();
            for(copado__User_Story__c ust : lst){
                ust.Parent_User_Story__c = oldvsNewMap.get(Id);
                ust.Itrack_UST_Version__c = v;
                ust.iTrack_US__c = Id+'_v'+v;
                ustUpdateList.add(ust); // Only update if it hasn't been processed
                //System.debug('Print the User Story , Name = ' + ust.Name + ', Itrack # =  '+ust.iTrack_US__c + ', Version ='+ust.Itrack_UST_Version__c + ', Shadow Itrack Id = '+ust.Shadow_ITrack_US__c+' Id ='+ust.Id);
                v++;//increment version
            }
        }
        return ustUpdateList;
    }
}