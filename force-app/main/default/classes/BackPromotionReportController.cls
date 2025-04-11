/**
 * Created by mp1863 on 25/12/24.
 */

global class BackPromotionReportController {
    @InvocableMethod(label = 'Back promotion calculator' description = 'This will return the list of eligible stories for bck promotion' category='User Story')
    public static List<List<copado__User_Story__c>> getUSTListForBackDeploy(List<String> copadoEnvs){
        String environments = copadoEnvs.get(0);
        System.debug('ENVs::'+environments);
        List<String> expressions = environments.split('-');
        System.debug('expressions>>'+expressions);
        List<List<copado__User_Story__c>> result = new List<List<copado__User_Story__c>>();
        result.add(new List<copado__User_Story__c>());
        if(expressions!=null && expressions.size() > 0){
            for(String expr: expressions){
                List<List<copado__User_Story__c>> envResult = calculateBackPromotions(expr);
                for(List<copado__User_Story__c> lst : envResult){
                    List <copado__User_Story__c> exList = result.get(0);
                    exList.addAll(lst);
                }
            }
        }
        return result;
    }

    public static List<List<copado__User_Story__c>> calculateBackPromotions(String environments){
        System.debug('environments::'+environments);
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
        String advOrg1 = e.get(1);
        String oldOrgSrc = e.get(2);
        String flag = e.get(3);

        copado__Promotion__c promo = [SELECT Id, CreatedDate FROM copado__Promotion__c WHERE Destination_Env__c =: reportOrg ORDER BY CreatedDate ASC LIMIT 1];
        //This is important as promotions deployed before this date will not appear
        System.debug(reportOrg + ' First Promotion date : ' + promo.CreatedDate);
        Datetime calcDate = promo.CreatedDate;
        //Check how many PROMOTED (F & B) to target after "Environment" plugged to PL.
        List<copado__Promoted_User_Story__c> promotedUSTList = new List<copado__Promoted_User_Story__c>(
        [SELECT Id, copado__User_Story__r.Name FROM copado__Promoted_User_Story__c
        WHERE copado__Promotion__r.Destination_Env__c =: advOrg1
        AND copado__Promotion__r.copado__Status__c = 'Completed'
        AND copado__Status__c != 'Outdated'
        AND copado__Promotion__r.CreatedDate >= : calcDate
        AND copado__User_Story__r.copado__Is_Bundle__c = FALSE
        AND copado__User_Story__r.copado__Exclude_From_CBM__c = FALSE]
        );
        System.debug('Size of List in Advance Environment: ' + advOrg1 + ' : '+promotedUSTList.size());
        List<copado__Promoted_User_Story__c> promotedUSTListFromOldEnv;
        /*There may be a temporary env connected before releasing the new env just to complete
        promotions, this is also important, Lets say scrumqa to DEVINT*/
        if(flag == 'true'){
            copado__Promotion__c promo1 = [SELECT Id, CreatedDate FROM copado__Promotion__c WHERE Destination_Env__c = 'DEVINT' ORDER BY CreatedDate ASC LIMIT 1];
            promotedUSTListFromOldEnv = new List<copado__Promoted_User_Story__c>(
            [SELECT Id, copado__User_Story__r.Name FROM copado__Promoted_User_Story__c
            WHERE copado__Promotion__r.Source_Env__c =: oldOrgSrc
            AND copado__Promotion__r.Destination_Env__c =: advOrg1
            AND copado__Promotion__r.copado__Status__c = 'Completed'
            AND copado__Status__c != 'Outdated'
            AND copado__Promotion__r.CreatedDate >= : promo.CreatedDate
            AND copado__User_Story__r.copado__Is_Bundle__c = FALSE
            AND copado__User_Story__r.copado__Exclude_From_CBM__c = FALSE]
            );
        }
        if(promotedUSTListFromOldEnv != null){
            System.debug('Size of List FROM OLD Env ' + oldOrgSrc + ' : ' + promotedUSTListFromOldEnv.size());
        }
        Set<String> USTListSet = new Set<String>();
        for(copado__Promoted_User_Story__c proUST : promotedUSTList){
            USTListSet.add(proUST.copado__User_Story__r.Name) ;
        }
        if(promotedUSTListFromOldEnv != null && !promotedUSTListFromOldEnv.isEmpty()){
            for(copado__Promoted_User_Story__c proUST : promotedUSTListFromOldEnv){
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
        AND copado__Status__c != 'Outdated'
        AND copado__User_Story__r.Name IN : USTListSet
        AND copado__User_Story__r.copado__Is_Bundle__c = FALSE
        AND copado__User_Story__r.copado__Exclude_From_CBM__c = FALSE]
        );
        Set<String> USTSetAdvanceOrg1Set = new Set<String>();
        for(copado__Promoted_User_Story__c proUST : promotedUSTListToAdvanceOrg1FromReportOrg){
            USTSetAdvanceOrg1Set.add(proUST.copado__User_Story__r.Name) ;
        }
        System.debug('Size of List Target Env. ' + reportOrg + ' : ' + USTSetAdvanceOrg1Set.size());
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

        //See if any of those user stories were deployed to prod before the env was plugged in.
        List<copado__Promoted_User_Story__c> listOfProdDeployedStories = new List<copado__Promoted_User_Story__c>(
        [SELECT Id, copado__User_Story__r.Name FROM copado__Promoted_User_Story__c
        WHERE copado__User_Story__r.Name IN : uniqueElements
        AND copado__Promotion__r.Destination_Env__c = 'ACCPROD'
        AND copado__Promotion__r.LastModifiedDate < : calcDate]);

        for(copado__Promoted_User_Story__c prmUst : listOfProdDeployedStories){
            if(uniqueElements.contains(prmUst.copado__User_Story__r.Name)){
                uniqueElements.remove(prmUst.copado__User_Story__r.Name);
            }
        }

        List<List<copado__User_Story__c>> copadoStoriesListForBackPromotion = new List<List<copado__User_Story__c>>();
        copadoStoriesListForBackPromotion.add([SELECT Id, Name, Developer_Name__c, copado__Team__r.Name, copado__Release__r.Name
        FROM copado__User_Story__c
        WHERE Name IN : uniqueElements]);
        return copadoStoriesListForBackPromotion;
    }
}