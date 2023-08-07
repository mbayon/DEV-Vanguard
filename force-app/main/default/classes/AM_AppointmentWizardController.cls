public without sharing class AM_AppointmentWizardController {

    @AuraEnabled(cacheable=true)
    public static AppointmentWrapper getCosmeticCentersList() {

        Map<String, List<AM_Specialty__c>> specialtiesByCenter = new Map<String, List<AM_Specialty__c>>();

        for (AM_Specialty__c specialty : [
            SELECT Id, Name, AM_CosmeticCenter__c FROM AM_Specialty__c
        ]){
            if (specialtiesByCenter.containsKey(specialty.AM_CosmeticCenter__c)) {
                specialtiesByCenter.get(specialty.AM_CosmeticCenter__c).add(new AM_Specialty__c(Id = specialty.Id, Name = specialty.Name));
            } else {
                specialtiesByCenter.put(specialty.AM_CosmeticCenter__c, new List<AM_Specialty__c>{new AM_Specialty__c(Id = specialty.Id, Name = specialty.Name)});
            }
        }

        AppointmentWrapper aw = new AppointmentWrapper();
        aw.cosmeticCenters = [SELECT Id, Name, Location__c FROM AM_CosmeticCenter__c]; // easier to send the Location that overdo the main query
        aw.specialtiesByCenter = specialtiesByCenter;

        return aw;
    }

    @AuraEnabled(cacheable=true)
    public static AvailabilityWrapper getAvalabilityBySpecialty(String specialtyId) {
        List<AM_Agenda__c> agendaAvailabilities = [
            SELECT  Id, Name, AM_StartDate__c, AM_EndDate__c,
                    AM_Specialty__r.AM_CosmeticCenter__c, AM_Specialty__c, AM_Specialty__r.Name,
                    (SELECT Id, AM_Agenda__c, AM_DayOfTheWeek__c, AM_EndTime__c, AM_StartTime__c FROM Availabilities__r)
            FROM AM_Agenda__c
            WHERE AM_Specialty__c = :specialtyId
        ];

        List<AM_Specialty__c> specialtyAppointments = [
            SELECT  Id, Name, (SELECT Id, AM_Date__c, AM_Duration__c FROM Appointments__r)
            FROM AM_Specialty__c 
            WHERE Id = :specialtyId
        ];

        AvailabilityWrapper avw = new AvailabilityWrapper();
        avw.agendaAvailabilities = agendaAvailabilities;
        avw.specialtyAppointments = specialtyAppointments;
        return avw;
    }

    public class AppointmentWrapper {
        @AuraEnabled
        public List<AM_CosmeticCenter__c> cosmeticCenters;
        @AuraEnabled
        public Map<String, List<AM_Specialty__c>> specialtiesByCenter;
        @AuraEnabled
        public Map<String, List<AM_Specialty__c>> availableDaysByCenter;
    }

    public class AvailabilityWrapper {
        @AuraEnabled
        public List<AM_Agenda__c> agendaAvailabilities;
        @AuraEnabled
        public List<AM_Specialty__c> specialtyAppointments;
    }

}