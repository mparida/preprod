/**
 * Created by mp1863 on 27/12/24.
 */
@isTest
public with sharing class TestDataFactory {

    public static User createTestUser(String email, Id profileId) {
        return new User(
                FirstName = 'Test',
                LastName = 'User',
                Email = email,
                Username = email,
                Alias = 'tuser',
                TimeZoneSidKey = 'America/Los_Angeles',
                LocaleSidKey = 'en_US',
                EmailEncodingKey = 'UTF-8',
                LanguageLocaleKey = 'en_US',
                ProfileId = profileId
        );
    }
}