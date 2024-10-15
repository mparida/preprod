public with sharing class InfyPOCComponentTrackerController {
    public InfyPOCComponentTrackerController() {

    }
    @AuraEnabled(cacheable=true)
    public static List<copado__Release__c> getReleases(){
        try {
            return [SELECT Id, Name from copado__Release__c where copado__Project__r.Name = 'ACC_SFDC' order by createddate desc];
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    @AuraEnabled
    public static List<ComponentTrackerWrapper>  getMyCheckedInRecords(String strRelease){
        try {
            List<ComponentTrackerWrapper> lstCT = new List<ComponentTrackerWrapper>();
            if(String.isNotBlank(strRelease)){
                for ( InfyPOC_Component_Tracker__c objCT : [select Id, MetadataType_APIName__c, Release__r.Name, Is_Checked_In__c, Checked_In_By__r.Name, Checked_In_Time__c from InfyPOC_Component_Tracker__c Where Release__c = :strRelease and  Checked_In_By__c =:UserInfo.getUserId()]) {
                    lstCT.add(new ComponentTrackerWrapper(objCT.Id, objCT.MetadataType_APIName__c,objCT.Release__r.Name,objCT.Is_Checked_In__c,objCT.Checked_In_By__r.Name,formatDateTime(objCT.Checked_In_Time__c)));
                }
            }
            return lstCT;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static void manageCheckOut(List<Id> lstCTRecords){
        List<InfyPOC_Component_Tracker__c> lstCTUpdate = new List<InfyPOC_Component_Tracker__c>();
        try {
            if(lstCTRecords!=null && !lstCTRecords.isEmpty()){
                for(Id IdCT: lstCTRecords){
                    InfyPOC_Component_Tracker__c objUpd = new InfyPOC_Component_Tracker__c();
                    objUpd.id = IdCT;
                    objUpd.Is_Checked_In__c = false;
                    objUpd.Checked_In_By__c = null;
                    objUpd.Checked_In_Time__c = null;
                    lstCTUpdate.add(objUpd);
                }
                if(!lstCTUpdate.isEmpty()){
                    update as system lstCTUpdate;
                }
            }
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static List<ComponentTrackerWrapper>  getOtherRecords(String strRelease){
        try {
            List<ComponentTrackerWrapper> lstCT = new List<ComponentTrackerWrapper>();
            if(String.isNotBlank(strRelease)){
                for ( InfyPOC_Component_Tracker__c objCT : [select Id, MetadataType_APIName__c, Release__r.Name, Is_Checked_In__c, Checked_In_By__r.Name, Checked_In_Time__c from InfyPOC_Component_Tracker__c Where Release__c = :strRelease and  Checked_In_By__c <> :UserInfo.getUserId()]) {
                    lstCT.add(new ComponentTrackerWrapper(objCT.Id, objCT.MetadataType_APIName__c,objCT.Release__r.Name,objCT.Is_Checked_In__c,objCT.Checked_In_By__r.Name,formatDateTime(objCT.Checked_In_Time__c)));
                }
            }
            return lstCT;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }


    @AuraEnabled
    public static void manageCheckIn(List<Id> lstCTRecords){
        List<InfyPOC_Component_Tracker__c> lstCTUpdate = new List<InfyPOC_Component_Tracker__c>();
        try {
            if(lstCTRecords!=null && !lstCTRecords.isEmpty()){
                for(Id IdCT: lstCTRecords){
                    InfyPOC_Component_Tracker__c objUpd = new InfyPOC_Component_Tracker__c();
                    objUpd.id = IdCT;
                    objUpd.Is_Checked_In__c = true;
                    objUpd.Checked_In_By__c = UserInfo.getUserId();
                    objUpd.Checked_In_Time__c = Datetime.now();
                    lstCTUpdate.add(objUpd);
                }
                if(!lstCTUpdate.isEmpty()){
                    update as system lstCTUpdate;
                }
            }
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    public static String formatDateTime(Datetime dt){
        if(dt == null){
            return '';
        }
        return dt.format('dd/MM/yyyy HH:mm:ss');
    }
    
    public class ComponentTrackerWrapper {
        @AuraEnabled public String Id;
        @AuraEnabled public String metadataAPIName;
        @AuraEnabled public String releaseName;
        @AuraEnabled public Boolean isCheckedIn;
        @AuraEnabled public String checkedInBy;
        @AuraEnabled public String checkedInTime;

        public ComponentTrackerWrapper(String Id, String metadataAPIName, String releaseName, Boolean isCheckedIn, String checkedInBy, String checkedInTime){
            this.Id = Id;
            this.metadataAPIName = metadataAPIName;
            this.releaseName = releaseName;
            this.isCheckedIn = isCheckedIn;
            this.checkedInBy = checkedInBy;
            this.checkedInTime = checkedInTime;
        }
    }
}