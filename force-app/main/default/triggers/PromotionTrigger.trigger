/**
 * Created by mp1863 on 11/02/25.
 */

trigger PromotionTrigger on copado__Promotion__c (after update) {


    if(Trigger.isAfter && Trigger.isUpdate){
        copado__Promotion__c promo = Trigger.new[0];
        Promotion_Test_Script__c ptsr = new Promotion_Test_Script__c();
        if(promo.Source_Env__c == 'cchdev' && promo.copado__Status__c == 'Completed'){
            List<Promotion_Test_Script__c> pts = new List<Promotion_Test_Script__c>([SELECT Id, Test_Script__r.Jenkins_Test_Suite_Name__c from Promotion_Test_Script__c LIMIT 1]);
            if(pts.size() > 0) {
                ptsr = pts[0];
                Map<String, Object> mockResponse = JenkinsJobService.triggerJenkinsJob(ptsr.Test_Script__r.Jenkins_Test_Suite_Name__c, null);
                if(mockResponse.containsKey('JobTriggerStatus')){
                    ptsr.Job_Trigger_Status__c = (String)mockResponse.get('JobTriggerStatus');
                    ptsr.Trigger_Jenkins_GET_Job_Time__c = DateTime.now().addMinutes(1);
                }
            }
            update ptsr;
        }

    }
}
