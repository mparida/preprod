public class NotificationService {
    
    public static void sendBulkNotification(List <NotificationEvent__e> listNotification){
        if(listNotification != null && listNotification.size() > 0){
            EventBus.publish(listNotification);
        }
    }
}