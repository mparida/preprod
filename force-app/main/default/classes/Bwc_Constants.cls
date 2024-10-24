/**
 * Created by mp1863 on 24/10/24.
 */

public with sharing class Bwc_Constants {
    public static final List<String> disallowedPatterns = new List<String>{'/', 'force-app', 'main/default'};
    public static final String requiredPhrase = 'handled automatically';
}