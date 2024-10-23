public class NotificationService {
    public static void sendNotification(Id userId, String title, String message, String variant) {
        NotificationEvent__e event = new NotificationEvent__e(
            UserId__c = userId,
            Title__c = title,
            Message__c = message,
            Variant__c = variant
        );
        EventBus.publish(event);
    }
    
    public static void sendBulkNotification(List <NotificationEvent__e> listNotification){
        if(listNotification != null && listNotification.size() > 0){
            EventBus.publish(listNotification);
        }
    }
}