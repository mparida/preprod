global class CopadoStoriesForBackDeploy {
    @InvocableMethod(label = 'BackDeploymentUST') 
    public static List<Report_Back_Promotion_Master__c> getUSTListForBackDeploy(List<String> copadoEnvs){
        String environments = copadoEnvs.get(0);
        List<String> e = environments.split('#');
        String sourceEnv = e.get(0);
        String targetEnv = e.get(1);
        copado__Deployment_Flow__c pl = [SELECT Id from copado__Deployment_Flow__c where Name =: System.label.Copado_Project];
		List<copado__Deployment_Flow_Step__c> pipelineOrgs = new List<copado__Deployment_Flow_Step__c>(
    		[SELECT copado__Source_Environment__r.name,
     		copado__Destination_Environment__r.name from copado__Deployment_Flow_Step__c WHERE copado__Deployment_Flow__c =: pl.Id
    		]);
		Set<String> orgs = new Set<String>();
		for(copado__Deployment_Flow_Step__c org : pipelineOrgs){
    		orgs.add(org.copado__Source_Environment__r.name);
    		orgs.add(org.copado__Destination_Environment__r.name);
		}
        List<Report_Back_Promotion_Detail__c> listUst = new List<Report_Back_Promotion_Detail__c>();
        Map<String, Report_Back_Promotion_Detail__c> wrapMap = new Map<String,Report_Back_Promotion_Detail__c>();
        Set<String> completedSet = new Set<String>();
        List<Report_Back_Promotion_Master__c> masterList = new List<Report_Back_Promotion_Master__c>();
        Report_Back_Promotion_Master__c master;
        try{
            master = new Report_Back_Promotion_Master__c (Report_Date__c = System.TODAY(), 
                                                Source_Environment__c = sourceEnv, Destination_Environment__c  = targetEnv);
        	insert master;
            masterList.add(master);
        }catch(Exception ex){ 
            return null;
        }
        for(copado__Promoted_User_Story__c promUST: [SELECT 
             copado__Promotion__r.copado__Status__c , copado__User_Story__r.Id, copado__User_Story__r.Name, copado__User_Story__r.copado__Developer__r.Name, 
             copado__User_Story__r.copado__Team__r.Name, copado__User_Story__r.copado__Release__r.Name 
             FROM copado__Promoted_User_Story__c 
             WHERE copado__Promotion__r.copado__Source_Environment__r.Name =: sourceEnv AND 
             copado__Promotion__r.copado__Destination_Environment__r.Name =: targetEnv AND 
             copado__User_Story__r.copado__Exclude_From_CBM__c = FALSE AND 
             copado__Promotion__r.copado__Back_Promotion__c = TRUE AND 
             copado__User_Story__r.copado__Environment__r.Name IN : orgs
              ]){
                 Report_Back_Promotion_Detail__c detail = new Report_Back_Promotion_Detail__c (
                     Rec_Id__c  = promUST.copado__User_Story__r.Id,
                     User_Story__c  = promUST.copado__User_Story__r.Name, 
                     Dev_Name__c  = promUST.copado__User_Story__r.copado__Developer__r.Name, 
                     Team_Name__c  = promUST.copado__User_Story__r.copado__Team__r.Name, 
                     Release__c  = promUST.copado__User_Story__r.copado__Release__r.Name, 
                     Back_Promotion_Master__c = master.Id,
                     Status__c = promUST.copado__Promotion__r.copado__Status__c
                 );
                 listUst.add(detail);
             }
        System.debug('listUst Size : '+listUst.size());
        for(Report_Back_Promotion_Detail__c wrap : listUst){
            if(!wrapMap.containsKey(wrap.User_Story__c) && !String.isBlank(wrap.Status__c) && !wrap.Status__c.equalsIgnoreCase('Completed') && !completedSet.contains(wrap.User_Story__c)){
               wrapMap.put(wrap.User_Story__c, wrap);
            }else if(wrapMap.containsKey(wrap.User_Story__c) && !String.isBlank(wrap.Status__c) && wrap.Status__c.equalsIgnoreCase('Completed')){
               	wrapMap.remove(wrap.User_Story__c);
                completedSet.add(wrap.User_Story__c);
            }else if(wrap.Status__c.equalsIgnoreCase('Completed')){
               completedSet.add(wrap.User_Story__c); 
            }
        }
		insert wrapMap.values();
		return masterList;
    }
    
   /* global class USTWrapper {
    @InvocableVariable(label='User Story')
    global String ust;
    @InvocableVariable(label='Dev Name')
    global String dev;
    @InvocableVariable(label='Team Name')
    global String team; 
    @InvocableVariable(label='Release Name')
    global String release;
    @InvocableVariable(label='Status')
    global String status;
    @InvocableVariable(label='WrapperList')
    global List<USTWrapper> flowLst;
    @InvocableVariable(label='lol')
    global List<List<USTWrapper>> lol;

    
    public USTWrapper(String ust, String dev, String team, String release, String status){
        this.ust = ust;
        this.dev = dev;
        this.team = team;
        this.release = release;
        this.status = status;
    }
        public USTWrapper(){
            
        }
    }*/
}