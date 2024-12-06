public with sharing class bwcCopadoUSController {
        
    @AuraEnabled(cacheable = true)
    public static List<Itrack_Board__c> getBoardNameValues()
    {
        List<Itrack_Board__c> lst = new List<Itrack_Board__c> ([SELECT name, Itrack_Board_Number__c FROM Itrack_Board__c]);
        return lst; 
    }
    
    @AuraEnabled
    public static List<copado__User_Story__c> createCopadoUserStories(List<BWC_Copado_US.issue> iTrackUSList,String sprintId){
        try {
            List<copado__User_Story__c> cusList = new List<copado__User_Story__c>();
            Set<String> fedIdentifierSet = new Set<String>();
            Set<String> epicSet = new Set<String>();
            Map<String,Id> epicMap = new Map<String,Id>();
            set<String> releaseSet = new Set<String>();
            Map<String,Id> releaseMap = new Map<String,Id>();
			set<String> teamSet = new Set<String>();
            Map<String,Id> teamMap = new Map<String,Id>();            
            Map<String,Id> userNameMap = new Map<String,Id>();
            set<String> sprintSet = new Set<String>();
            Map<String,Id> sprintMap = new Map<String,Id>();
            String sprintName = '';
            
            if(sprintId == '')
            {
                sprintId = iTrackUSList[0].fields.sprint?.id;
                sprintName = iTrackUSList[0].fields.sprint?.name;
            }
            System.debug('sprintId::'+sprintId);
            System.debug('sprintId::'+sprintName);
            copado__Sprint__c sprint;
            if(!String.isEmpty(sprintId) && !String.isEmpty(sprintName)){
                sprint = new copado__Sprint__c();
                sprint.Itrack_Sprint__c = sprintId;
                sprint.Name = sprintName;
                sprint.Active__c = true;
                upsert sprint;
            }

            if(sprintId != null){
                List<copado__Sprint__c> sprintList = new List<copado__Sprint__c>([SELECT id,Itrack_Sprint__c, Name FROM copado__Sprint__c WHERE Itrack_Sprint__c = :sprintId limit 1]);

            }
            for(BWC_Copado_US.issue selectedUS: iTrackUSList)
            {
                fedIdentifierSet.add(selectedUS.assigneeUID); 
                if(selectedUS.fields.customfield_10970 != null)
                	epicSet.add(selectedUS.fields.customfield_10970);
                if(selectedUS.fixVersionName != null)
                    releaseSet.add(selectedUS.fixVersionName);
                if(selectedUS.fields.customfield_16473 != null)
                	teamSet.add(selectedUS.fields.customfield_16473.value);  
            }
            
            releaseMap = getReleaseMap(releaseSet);
            epicMap = getEpicMap(epicSet);
            teamMap = getTeamMap(teamSet);
                        
            for(User u:[SELECT Id, FederationIdentifier FROM User WHERE FederationIdentifier IN :fedIdentifierSet ])
            {
                userNameMap.put(u.FederationIdentifier,u.Id);
            }
            
            for(BWC_Copado_US.issue selectedUS: iTrackUSList){
                copado__User_Story__c copadoUS = new copado__User_Story__c();
                copadoUS.Is_Created_from_Itrack_Utility__c = true;
                copadoUS.Itrack_UST_Version__c = 1;
                copadoUS.copado__Project__c = System.Label.ACC_Project_Id;
                copadoUS.iTrack_US__c = selectedUS.key;
                copadoUS.Shadow_ITrack_US__c = selectedUS.key;
                copadoUS.copado__User_Story_Title__c  = selectedUS.summary;
                copadoUS.copado__Developer__c = userNameMap.get(selectedUS.assigneeUID);
                if(copadoUS.copado__Developer__c != null){
                    copadoUS.OwnerId = copadoUS.copado__Developer__c;
                }
                copadoUS.copado__Epic__c = epicMap.get(selectedUS.fields.customfield_10970);
                copadoUS.copado__Sprint__c = sprint!=null?sprint.id:null;
                if(selectedUS.fixVersionName != null){
                    copadoUS.copado__Release__c = releaseMap.get(selectedUS.fixVersionName);
                }
                	
                copadoUS.copado__Team__c = teamMap.get(selectedUS.fields.customfield_16473.value);
                copadoUS.Itrack_Key_Length__c = selectedUS.key.length();
                cusList.add(copadoUS);    
            }
            UPSERT cusList iTrack_US__c;
            
            return [SELECT Id,iTrack_US__c,Name FROM copado__User_Story__c WHERE ID IN :cusList];
                        
        } catch (Exception e) {
            System.debug('Exception in creating story ::' + e.getMessage());
            System.debug('Stack trace: ' + e.getStackTraceString());   
            throw new AuraHandledException(e.getMessage());
        }
    }
    
    
    public static Map<String,Id> getReleaseMap(set<String> releaseSet){
        List<copado__Release__c> existingReleaseList =new List<copado__Release__c>();
        List<copado__Release__c> releaseList =new List<copado__Release__c>();
        Map<String,Id> releaseMap = new Map<String,Id>();
        
        ///Release sync and Map logic
        if(!releaseSet.isEmpty()){
                existingReleaseList = [SELECT id,Name FROM copado__Release__c WHERE Name IN :releaseSet];
                
                if(existingReleaseList.size() > 0){
                    for(copado__Release__c re : existingReleaseList){
                        releaseMap.put(re.Name,re.id);
                	}
                }  
                if(releaseSet.size() > existingReleaseList.size()){
                	if(!releaseMap.isEmpty()) releaseSet.removeAll(releaseMap.keySet());
                    
                    for(String rs : releaseSet){
                        copado__Release__c re = new copado__Release__c();
                        re.Name	= rs;
                        re.copado__Project__c = System.Label.ACC_Project_Id;
                        releaseList.add(re);
                    }
                    if(!releaseList.isEmpty()) Insert releaseList;
                    
                    for(copado__Release__c re:releaseList)
                    {
                        releaseMap.put(re.Name,re.id);
                    }
                }  
           }
        return releaseMap;
    }

    public static Map<String,Id> getEpicMap(set<String> epicSet){
        List<copado__Epic__c> existingEpicList =new List<copado__Epic__c>();
        List<copado__Epic__c> EpicList =new List<copado__Epic__c>();
        Map<String,Id> epicMap = new Map<String,Id>();
        
        ///Epic sync and Map logic
            if(!epicSet.isEmpty()){
                existingEpicList = [select id,Itrack_Epic__c from copado__Epic__c WHERE Itrack_Epic__c IN :epicSet];
            
                if(existingEpicList.size() > 0){
                    for(copado__Epic__c epic : existingEpicList){
                        epicMap.put(epic.Itrack_Epic__c,epic.id);
                    }
                }
                    
                if(epicSet.size() > existingEpicList.size()){
                    if(!epicMap.isEmpty()) epicSet.removeAll(epicMap.keySet());
             
                    for(String e : epicSet){
                        copado__Epic__c epic = new copado__Epic__c();
                        epic.Itrack_Epic__c = e;
                        epic.copado__Epic_Title__c = e;
                        EpicList.add(epic);
                    }
                    if(!EpicList.isEmpty()) Insert EpicList;
                    
                    for(copado__Epic__c epic:EpicList)
                    {
                        epicMap.put(epic.Itrack_Epic__c,epic.id);
                    }
                }
            }
        return epicMap;
    }
    
    public static Map<String,Id> getTeamMap(set<String> teamSet){
        List<copado__Team__c> existingTeamList =new List<copado__Team__c>();
        List<copado__Team__c> TeamList =new List<copado__Team__c>();
        Map<String,Id> teamMap = new Map<String,Id>();
        
        ///Epic sync and Map logic
            if(!teamSet.isEmpty()){
                existingTeamList = [select id,Name from copado__Team__c WHERE Name IN :teamSet];
            
                if(existingTeamList.size() > 0){
                    for(copado__Team__c team : existingTeamList){
                        teamMap.put(team.Name,team.id);
                    }
                }
                    
                if(teamSet.size() > existingTeamList.size()){
                    if(!teamMap.isEmpty()) teamSet.removeAll(teamMap.keySet());
             
                    for(String e : teamSet){
                        copado__Team__c team = new copado__Team__c();
                        team.Name = e;
                        team.copado__Department__c = 'IT';
                        team.copado__Active__c = true;
                        TeamList.add(team);
                    }
                    if(!TeamList.isEmpty()) Insert TeamList;
                    
                    for(copado__Team__c team:TeamList)
                    {
                        teamMap.put(team.Name,team.id);
                    }
                }
            }
        return teamMap;
    }
}