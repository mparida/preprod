/**
 * Created by mp1863 on 18/10/24.
 */

public with sharing class RandomTextGenerator {

    public static String generateRandomText(Integer length) {
        String chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        String randomText = '';
        Integer charsLength = chars.length();

        for (Integer i = 0; i < length; i++) {
            Integer randomIndex = Math.floor(Math.random() * charsLength).intValue();
            randomText += chars.substring(randomIndex, randomIndex + 1);
        }
        return randomText;  
    }

}