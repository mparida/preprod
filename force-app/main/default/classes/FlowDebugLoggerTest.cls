@isTest
public class FlowDebugLoggerTest {
	
    @isTest
    public static void trace(){
        List<String> debugMessages = new List<String>{'debugMessage'};
        FlowDebugLogger.trace(debugMessages);
    }
}