/**
 * Created by mp1863 on 11/02/25.
 */

trigger PromotionTrigger on copado__Promotion__c (after update) {


    if(Trigger.isAfter && Trigger.isUpdate){
        copado__Promotion__c promo = Trigger.new[0];
        Jenkins_Job_Parameters__mdt jenJobsMdt = Jenkins_Job_Parameters__mdt.getInstance(promo.Source_Env__c);
        if(jenJobsMdt != null && promo.copado__Status__c == 'Completed'){
            PromotionTriggerHandler.triggerJenkinsJob(promo);
        }
    }
}