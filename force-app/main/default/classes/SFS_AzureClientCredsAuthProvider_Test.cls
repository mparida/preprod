@isTest
public class SFS_AzureClientCredsAuthProvider_Test {
    public static testMethod void testGetMetadataType() {
        SFS_AzureClientCredsAuthProvider instance = new SFS_AzureClientCredsAuthProvider();
        System.assertEquals(
            SFS_AzureClientCredsAuthProvider.CUSTOM_METADATA_TYPE,
            instance.getCustomMetadataType()
        );
    }

    public static testMethod void testInitiate() {
        SFS_AzureClientCredsAuthProvider instance = new SFS_AzureClientCredsAuthProvider();
        Map<String, String> config = new Map<String, String>();
        config.put('Callback_URL__c', 'foo');
        final String state = 'randomState';

        PageReference ref = instance.initiate(config, state);
        System.assertEquals(URL.getSalesforceBaseUrl().toExternalForm() + 'foo?state=randomState', ref.getUrl());
    }

    public static testMethod void testHandleCallback_Success() {
        Map<String, String> config = new Map<String, String>();
        config.put('Tenant_ID__c', 'tenantId');
        config.put('Scopes__c', 'scope1 scope2');

        final String mockResponse = '{"access_token": "dummy_access_token"}';

        final TokenEndpointHttpCalloutMockImpl httpMock = new TokenEndpointHttpCalloutMockImpl(mockResponse);
        Test.setMock(HttpCalloutMock.class, httpMock);

        SFS_AzureClientCredsAuthProvider instance = new SFS_AzureClientCredsAuthProvider(
            new StaticRefreshTokenGenerator()
        );
        final Map<String, String> queryArgs = new Map<String, String>();
        queryArgs.put('state', 'randomState');
        Auth.AuthProviderCallbackState callbackState = new Auth.AuthProviderCallbackState(
            new Map<String, String>(),
            '',
            queryArgs
        );

        // call
        Auth.AuthProviderTokenResponse response = instance.handleCallback(config, callbackState);

        // assert
        httpMock.assertUrl('callout:Microsoft_OAuth_Token/tenantId/oauth2/v2.0/token');
        httpMock.assertContentType('application/x-www-form-urlencoded;charset=UTF-8');
        httpMock.assertMethod('POST');
        httpMock.assertBody(
            'client_id={!$Credential.UserName}&client_secret={!$Credential.Password}&scope=scope1+scope2&grant_type=client_credentials'
        );
        System.assertEquals(SFS_AzureClientCredsAuthProvider.AUTH_PROVIDER_NAME, response.provider);
        System.assertEquals('dummy_access_token', response.oauthToken);
        System.assertEquals('dummy_refresh_token', response.oauthSecretOrRefreshToken);
        System.assertEquals('randomState', response.state);
    }

    public static testMethod void testHandleCallback_Error() {
        Map<String, String> config = new Map<String, String>();
        config.put('Tenant_ID__c', 'tenantId');
        config.put('Scopes__c', 'scope1,scope2');

        final String mockResponse = '{"error": "SomeErrorCode", "error_description": "Some description", "trace_id": "some_trace_id", "correlation_id": "some_correlation_id"}';
        final TokenEndpointHttpCalloutMockImpl httpMock = new TokenEndpointHttpCalloutMockImpl(mockResponse);
        Test.setMock(HttpCalloutMock.class, httpMock);

        final Map<String, String> queryArgs = new Map<String, String>();
        Auth.AuthProviderCallbackState callbackState = new Auth.AuthProviderCallbackState(
            new Map<String, String>(),
            '',
            queryArgs
        );

        try {
            SFS_AzureClientCredsAuthProvider instance = new SFS_AzureClientCredsAuthProvider();
            Auth.AuthProviderTokenResponse response = instance.handleCallback(config, callbackState);
            System.assert(false, 'Expected method to throw exception');
        } catch (SFS_AzureClientCredsAuthProvider.AzureClientCredsException e) {
            // assert
            httpMock.assertUrl('callout:Microsoft_OAuth_Token/tenantId/oauth2/v2.0/token');
            httpMock.assertContentType('application/x-www-form-urlencoded;charset=UTF-8');
            httpMock.assertMethod('POST');
            System.assertEquals('SomeErrorCode', e.errorCode);
            System.assertEquals('Some description', e.getMessage());
            System.assertEquals('some_trace_id', e.traceId);
            System.assertEquals('some_correlation_id', e.correlationId);
        }
    }

    public static testMethod void testGetUserInfo() {
        SFS_AzureClientCredsAuthProvider instance = new SFS_AzureClientCredsAuthProvider();
        Auth.UserData r = instance.getUserInfo(null, null);
        System.assertEquals(SFS_AzureClientCredsAuthProvider.USERNAME, r.username);
        System.assertEquals(SFS_AzureClientCredsAuthProvider.AUTH_PROVIDER_NAME, r.provider);
    }

    public static testMethod void testRefresh() {
        Map<String, String> config = new Map<String, String>();
        config.put('Tenant_ID__c', 'tenantId');
        config.put('Scopes__c', 'scope1,scope2');

        final String mockResponse = '{"access_token": "dummy_access_token"}';

        final TokenEndpointHttpCalloutMockImpl httpMock = new TokenEndpointHttpCalloutMockImpl(mockResponse);
        Test.setMock(HttpCalloutMock.class, httpMock);

        // call
        SFS_AzureClientCredsAuthProvider instance = new SFS_AzureClientCredsAuthProvider(
            new StaticRefreshTokenGenerator()
        );
        Auth.OAuthRefreshResult response = instance.refresh(config, null);

        // assert
        httpMock.assertUrl('callout:Microsoft_OAuth_Token/tenantId/oauth2/v2.0/token');
        httpMock.assertContentType('application/x-www-form-urlencoded;charset=UTF-8');
        httpMock.assertMethod('POST');
        System.assertEquals('dummy_access_token', response.accessToken);
        System.assertEquals('dummy_refresh_token', response.refreshToken);
        System.assert(null == response.error);
    }

    private class TokenEndpointHttpCalloutMockImpl implements HttpCalloutMock {
        private String callUrl;
        private String callMethod;
        private String callBody;
        private Map<String, String> callHeaders = new Map<String, String>();
        private String responseBody;
        private String responseContentType = 'application/json';
        private Integer responseStatus = 200;

        public TokenEndpointHttpCalloutMockImpl(String response) {
            this.responseBody = response;
        }

        public TokenEndpointHttpCalloutMockImpl(String response, String contentType) {
            this(response);
            this.responseContentType = contentType;
        }

        public TokenEndpointHttpCalloutMockImpl setResponseStatus(Integer status) {
            this.responseStatus = status;
            return this;
        }

        public void assertMethod(String method) {
            if (String.isEmpty(this.callMethod))
                System.assert(false, 'Method never set');
            System.assertEquals(method, this.callMethod);
        }

        public void assertUrl(String url) {
            if (String.isEmpty(this.callUrl))
                System.assert(false, 'URL never called');
            System.assertEquals(url, this.callUrl);
        }

        public void assertBody(String body) {
            if (String.isEmpty(this.callBody))
                System.assert(false, 'URL never called');
            System.assertEquals(body, this.callBody);
        }

        public void assertContentType(String value) {
            this.assertHeader('Content-Type', value);
        }

        public void assertHeader(String key, String value) {
            if (this.callHeaders.size() == 0)
                System.assert(false, 'No headers');
            if (String.isEmpty(key))
                System.assert(false, 'Must supply header name');
            String v = this.callHeaders.get(key.toLowerCase());
            if (String.isEmpty(v))
                System.assert(false, 'Header not set');
            System.assertEquals(value, v);
        }

        public HTTPResponse respond(HTTPRequest req) {
            this.callUrl = req.getEndpoint();
            this.callMethod = req.getMethod();
            this.callBody = req.getBody();
            this.callHeaders.put('content-type', req.getHeader('Content-Type'));
            this.callHeaders.put('accept', req.getHeader('Accept'));

            // Create a fake response
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', this.responseContentType);
            res.setBody(this.responseBody);
            res.setStatusCode(this.responseStatus);
            return res;
        }
    }

    private class StaticRefreshTokenGenerator implements SFS_AzureClientCredsAuthProvider.IRefreshTokenGenerator {
        public String generate() {
            return 'dummy_refresh_token';
        }
    }
}