/**
 * Created by mp1863 on 11/02/25.
 */

trigger PromotionTrigger on copado__Promotion__c (after update) {

    CustomTrigger__mdt trgMdt = CustomTrigger__mdt.getInstance('PromotionTrigger');
    if(!trgMdt.On_off__c){
        return;
    }
    if(Trigger.isAfter && Trigger.isUpdate){
        copado__Promotion__c promo = Trigger.new[0];
        if(Trigger.oldMap.get(promo.Id).copado__Status__c!= promo.copado__Status__c && promo.copado__Status__c == 'Completed'){
            PromotionTriggerHandler.triggerGitHubDifference(promo);
        }
    }
}