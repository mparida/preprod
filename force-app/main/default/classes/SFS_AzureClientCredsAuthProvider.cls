/*
    Custom Auth Provider plugin to support authentication using Azure server-to-server Oauth with client ID and secret only.
*/
public inherited sharing class SFS_AzureClientCredsAuthProvider extends Auth.AuthProviderPluginClass {
    // Constants
    public static final String CUSTOM_METADATA_TYPE = 'SFS_Azure_Client_Credentials__mdt';
    public static final String AUTH_PROVIDER_NAME = 'SFS_AzureClientCreds';
    public static final String USERNAME = 'Azure Dummy User';
    public static final String TOKEN_PATH = '/oauth2/v2.0/token';
    public static final String MS_TOKEN_NAMED_CREDENTIAL = 'Microsoft_OAuth_Token';

    // Declarations
    private IRefreshTokenGenerator generator = new DefaultRefreshTokenGenerator();

    public SFS_AzureClientCredsAuthProvider() {}

    public SFS_AzureClientCredsAuthProvider(IRefreshTokenGenerator generator) {
        this.generator = generator;
    }

    /*
        Plugin method: returns the custom metadata type where the auth data is stored.
    */
    public String getCustomMetadataType() {
        return CUSTOM_METADATA_TYPE;
    }

    /*
        Plugin method: returns the URL where the user is redirected for authentication.
    */
    public PageReference initiate(Map<String, String> authProviderConfiguration, String stateToPropagate) {
        String baseUrl = URL.getSalesforceBaseUrl().toExternalForm();
        String url = baseUrl + authProviderConfiguration.get('Callback_URL__c') + '?state=' + stateToPropagate;
        System.debug('initiate called - url <' + url + '>');
        return new PageReference(url);
    }

    /*
        Plugin method: Uses the authentication provider’s supported authentication protocol to return an OAuth access token,
        OAuth secret or refresh token, and the state passed in when the request for the current user was initiated..
    */    
    public Auth.AuthProviderTokenResponse handleCallback(Map<String, String> config, Auth.AuthProviderCallbackState callbackState) {
        // get access token

        String access_token = this.retrieveToken(config);
        String refresh_token = this.generator.generate();
        String state = callbackState.queryParameters.get('state');
        return new Auth.AuthProviderTokenResponse(AUTH_PROVIDER_NAME, access_token, refresh_token, state);
    }

    /*
        Plugin method: Returns information from the custom authentication provider about the current user.
        This is essentially dummy data because the authentication is not done in the context of the current user -- it's server-to-server.
    */
    public Auth.UserData getUserInfo(Map<String, String> authProviderConfiguration, Auth.AuthProviderTokenResponse response) {
        return new Auth.UserData(
            null,
            null,
            null,
            null,
            null,
            null,
            USERNAME,
            null,
            AUTH_PROVIDER_NAME,
            null,
            new Map<String, String>()
        );
    }

    /*
        Plugin method: Returns a new access token, which is used to update an expired access token.
    */    
    public override Auth.OAuthRefreshResult refresh(Map<String, String> config, String refreshToken) {

        // Generate dummy refresh token and get new access token
        String newRefreshToken = this.generator.generate();
        String access_token = this.retrieveToken(config);

        return new Auth.OAuthRefreshResult(access_token, newRefreshToken);

    }

    /*
        Get the OAuth token based on the provided config values.
    */
    private String retrieveToken(Map<String, String> config) {

        // Endpoint
        String tokenEndpoint = 'callout:' + MS_TOKEN_NAMED_CREDENTIAL + '/' + config.get('Tenant_ID__c') + TOKEN_PATH;
        System.debug('Token endpoint <' + tokenEndpoint + '>');
        
        // Request body
        String body =
            'client_id={!$Credential.UserName}' +
            '&client_secret={!$Credential.Password}' +
            '&scope=' + EncodingUtil.urlEncode(config.get('Scopes__c'), 'UTF-8') + 
            '&grant_type=client_credentials';
        System.debug('Body <' + body + '>');

        // Setup request
        HttpRequest req = new HttpRequest();
        req.setEndpoint(tokenEndpoint);
        req.setHeader('Content-Type', 'application/x-www-form-urlencoded;charset=UTF-8');
        req.setMethod('POST');
        req.setBody(body);

        // Execute request
        Http http = new Http();
        HttpResponse response = http.send(req);

        // Get token from response
        Map<String, Object> data = (Map<String, Object>) JSON.deserializeUntyped(response.getBody());
        String errorCode = (String)data.get('error');
        if (String.isNotEmpty(errorCode)) {
            String errorDesc = (String)data.get('error_description');
            throw new AzureClientCredsException(errorDesc)
                .setDetails(errorCode, (String)data.get('trace_id'), (String)data.get('correlation_id'));
        }
        
        return (String)data.get('access_token');

    }

    /*
        Custom exception.
    */
    public class AzureClientCredsException extends Exception {
        public String errorCode;
        public String traceId;
        public String correlationId;

        public AzureClientCredsException setDetails(String error_code, String trace_id, String correlation_id) {
            this.traceId = trace_id;
            this.correlationId = correlation_id;
            this.errorCode = error_code;
            return this;
        }
    }

    /**
     * Interface to allow us to override refresh token generation when testing.
     */
    public interface IRefreshTokenGenerator {
        String generate();
    }

    /**
     * Default implementation for runtime.
     */
    public class DefaultRefreshTokenGenerator implements IRefreshTokenGenerator {
        public String generate() {
            String refreshToken = EncodingUtil.base64Encode(Crypto.generateAesKey(128));
            return refreshToken;
        }
    }
}