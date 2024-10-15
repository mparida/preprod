public class ApexTestResultParser {
    
    public class TestMethods {
        public String name;
        public Boolean success;
        public String message;
    }
    
    public class TestClassResult {
        public String className;
        public List<TestMethods> methods = new List<TestMethods>();
    }
    
    public class TestResult {
        public Integer failures;
        public Integer tests;
        public Decimal t;
        public Boolean errors;
        public Map<String, TestClassResult> testClassResults = new Map<String, TestClassResult>();
    }
    
    public static TestResult parse(String jsonString) {
        TestResult result = new TestResult();
        
        // Deserialize JSON string
        Map<String, Object> jsonMap = (Map<String, Object>) JSON.deserializeUntyped(jsonString);
        
        result.failures = (Integer) jsonMap.get('failures');
        result.tests = (Integer) jsonMap.get('tests');
        System.debug(jsonMap.get('time'));
        result.t = ((Decimal) jsonMap.get('time'));
        result.errors = (Boolean) jsonMap.get('errors');
        
        Map<String, Object> testClassResultsMap = (Map<String, Object>) jsonMap.get('testClassResults');
        for (String className : testClassResultsMap.keySet()) {
            TestClassResult testClassResult = new TestClassResult();
            testClassResult.className = className;
            
            Map<String, Object> classDetailMap = (Map<String, Object>) testClassResultsMap.get(className);
            List<Object> methodsList = (List<Object>) classDetailMap.get('methods');
            
            for (Object methodObj : methodsList) {
                Map<String, Object> methodMap = (Map<String, Object>) methodObj;
                TestMethods method = new TestMethods();
                method.name = (String) methodMap.get('name');
                method.success = (Boolean) methodMap.get('success');
                method.message = (String) methodMap.get('message');
                testClassResult.methods.add(method);
            }
            
            result.testClassResults.put(className, testClassResult);
        }
        
        return result;
    }
    
    public static TestResult parseAttachment(String attId) {
        // Query for the attachment 
        Attachment attachment = [SELECT Id, Body FROM Attachment WHERE id = :attId];
        
        if (attachment != null) {
            // Get the body content of the attachment
            String jsonString = attachment.Body.toString();
            
            // Parse the JSON string
            TestResult result = parse(jsonString);
            
            return result;
        } else {
            throw new AuraHandledException('Attachment not found');
        }
    }
    
    // Example usage
    public static void getAllFailures(String attId) {
        try {
            TestResult result = parseAttachment(attId);
            
            System.debug('Failures: ' + result.failures);
            System.debug('Tests: ' + result.tests);
            System.debug('Time: ' + result.t);
            System.debug('Errors: ' + result.errors);
            
            for (String className : result.testClassResults.keySet()) { 
                TestClassResult testClassResult = result.testClassResults.get(className);
                //System.debug('Class: ' + testClassResult.className);
                for (TestMethods method : testClassResult.methods) {
                    if(!method.success)
                    	System.debug('testClassResult.className: '+testClassResult.className+'Method: ' + method.name + ', Success: ' + method.success + ', Message: ' + method.message);
                }
            }
        } catch (Exception e) {
            System.debug('Error: ' + e.getMessage() + e.getStackTraceString());
        }
    }
}