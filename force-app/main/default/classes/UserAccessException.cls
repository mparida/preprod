/**
 * Created by mp1863 on 24/11/24.
 */

public class UserAccessException extends Exception{

    public String errorCode;
    public String errorMessage;

    public UserAccessException(String code, String message) {
        this.errorCode = code;
        this.errorMessage = message;
    }
    //
    public String toString() {
        return 'CustomCalloutException: ErrorCode=' + errorCode + ', ErrorMessage=' + errorMessage;
    }
} 