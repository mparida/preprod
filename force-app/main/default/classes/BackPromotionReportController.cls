/**
 * Created by mp1863 on 25/12/24.
 */

global class BackPromotionReportController {
    @InvocableMethod(label = 'Back promotion calculator')
    public static List<copado__User_Story__c> getUSTListForBackDeploy(List<String> copadoEnvs){
        String environments = copadoEnvs.get(0);
        List<String> e = environments.split('#');
        /* ReportOrg#AdvanceOrg2#AdvanceOrg1#OldOrgSrc##true
        * for Example, I want to find back promotion report for 'SALESDEV'
        *   ACCSCRUMQA --(temp)----> DEVINT --> RELEASEQA --> PREINT
        *                              ^
        *                              |
        *               SALESDEV -------
        * Assuming before SALESDEV was connected to DEVINT, we forward promoted UST from SCRUMQA to DEVINT, so it will have impact on calculation
        * So in this case the key will be : SALESDEV#RELEASEQA#DEVINT#ACCSCRUMQA#true*/
        String reportOrg = e.get(0);
        String advOrg2 = e.get(1);
        String advOrg1 = e.get(2);
        String oldOrgSrc = e.get(3);
        String flag = e.get(4);

        copado__Promotion__c promo = [SELECT Id, CreatedDate FROM copado__Promotion__c WHERE Destination_Env__c =: reportOrg ORDER BY CreatedDate ASC LIMIT 1];
        System.debug('SALESDEV OLD Promo : '+promo.CreatedDate);
        Datetime calcDate = promo.CreatedDate;
        //Check how many back promoted to target after "Environment" plugged to PL.
        List<copado__Promoted_User_Story__c> promotedUSTList = new List<copado__Promoted_User_Story__c>(
                [SELECT Id, copado__User_Story__r.Name FROM copado__Promoted_User_Story__c
                WHERE copado__Promotion__r.Source_Env__c =: advOrg2
                AND copado__Promotion__r.Destination_Env__c =: advOrg1
                AND copado__Promotion__r.copado__Status__c = 'Completed'
                AND copado__Promotion__r.CreatedDate >= : calcDate
                AND copado__User_Story__r.copado__Is_Bundle__c = FALSE
                AND copado__Promotion__r.copado__Back_Promotion__c = TRUE
                AND copado__User_Story__r.copado__Exclude_From_CBM__c = FALSE]
        );
        System.debug('Size of List in Advance Environment: '+promotedUSTList.size());
        List<copado__Promoted_User_Story__c> promotedUSTListOldEnv;
        if(flag == 'true'){
            copado__Promotion__c promo1 = [SELECT Id, CreatedDate FROM copado__Promotion__c WHERE Destination_Env__c = 'DEVINT' ORDER BY CreatedDate ASC LIMIT 1];
            promotedUSTListOldEnv = new List<copado__Promoted_User_Story__c>(
                    [SELECT Id, copado__User_Story__r.Name FROM copado__Promoted_User_Story__c
                    WHERE copado__Promotion__r.Source_Env__c =: oldOrgSrc
                    AND copado__Promotion__r.Destination_Env__c =: advOrg1
                    AND copado__Promotion__r.copado__Status__c = 'Completed'
                    AND copado__Promotion__r.CreatedDate >= : promo.CreatedDate
                    AND copado__User_Story__r.copado__Is_Bundle__c = FALSE
                    AND copado__User_Story__r.copado__Exclude_From_CBM__c = FALSE]
            );
        }
        if(promotedUSTListOldEnv != null){
            System.debug('Size of List OLD Env / Forward Promo: '+promotedUSTListOldEnv.size());
        }
        Set<String> USTListSet = new Set<String>();
        for(copado__Promoted_User_Story__c proUST : promotedUSTList){
            USTListSet.add(proUST.copado__User_Story__r.Name) ;
        }
        if(promotedUSTListOldEnv != null && !promotedUSTListOldEnv.isEmpty()){
            for(copado__Promoted_User_Story__c proUST : promotedUSTListOldEnv){
                USTListSet.add(proUST.copado__User_Story__r.Name) ;
            }
        }
        String usName = '';
        for(String us : USTListSet){
            usName+=us+',';
        }
        System.debug(usName);
        List<copado__Promoted_User_Story__c> promotedUSTListToAdvanceOrg1FromReportOrg = new List<copado__Promoted_User_Story__c>(
                [SELECT Id, copado__User_Story__r.Name FROM copado__Promoted_User_Story__c
                WHERE  (copado__Promotion__r.Destination_Env__c =: reportOrg
                OR copado__Promotion__r.Source_Env__c =: reportOrg )
                AND copado__Promotion__r.copado__Status__c = 'Completed'
                AND copado__User_Story__r.Name IN : USTListSet
                AND copado__User_Story__r.copado__Is_Bundle__c = FALSE
                AND copado__User_Story__r.copado__Exclude_From_CBM__c = FALSE]
        );
        Set<String> USTSetAdvanceOrg1Set = new Set<String>();
        for(copado__Promoted_User_Story__c proUST : promotedUSTListToAdvanceOrg1FromReportOrg){
            USTSetAdvanceOrg1Set.add(proUST.copado__User_Story__r.Name) ;
        }
        System.debug('Size of List SALESDEV: '+USTSetAdvanceOrg1Set.size());
        String usName2 = '';
        for(String us : USTSetAdvanceOrg1Set){
            usName2+=us+',';
        }
        System.debug(usName2);

        //Get only unique Stories
        Set<String> uniqueElements = USTListSet.clone();
        uniqueElements.removeAll(USTSetAdvanceOrg1Set);

        Set<String> tempSet = USTSetAdvanceOrg1Set.clone();
        tempSet.removeAll(USTListSet);
        uniqueElements.addAll(tempSet);

        return null;
    }
}