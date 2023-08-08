/**
 * @description       : Controller for the appointment wizard
 * @author            : mbayon
 * @last modified on  : 08-08-2023
 * @last modified by  : ChangeMeIn@UserSettingsUnder.SFDoc
**/
public without sharing class AM_AppointmentWizardController {

    public class AppointmentWrapper {
        @AuraEnabled
        public List<AM_CosmeticCenter__c> cosmeticCenters;
        @AuraEnabled
        public Map<String, List<AM_Specialty__c>> specialtiesByCenter;
        @AuraEnabled
        public Map<String, List<AM_Specialty__c>> availableDaysByCenter;
    }

    /**
    * @description Retrieves the cosmetic centers and specialties data
    * @author mbayon | 08-07-2023 
    * @return AppointmentWrapper 
    **/
    @AuraEnabled(cacheable=true)
    public static AppointmentWrapper getCosmeticCentersList() {

        Map<String, List<AM_Specialty__c>> specialtiesByCenter = new Map<String, List<AM_Specialty__c>>();

        for (AM_Specialty__c specialty : [
            SELECT Id, Name, AM_CosmeticCenter__c FROM AM_Specialty__c WHERE AM_CosmeticCenter__r.AM_OnlineAppointments__c = TRUE
        ]){
            if (specialtiesByCenter.containsKey(specialty.AM_CosmeticCenter__c)) {
                specialtiesByCenter.get(specialty.AM_CosmeticCenter__c).add(new AM_Specialty__c(Id = specialty.Id, Name = specialty.Name));
            } else {
                specialtiesByCenter.put(specialty.AM_CosmeticCenter__c, new List<AM_Specialty__c>{new AM_Specialty__c(Id = specialty.Id, Name = specialty.Name)});
            }
        }

        AppointmentWrapper aw = new AppointmentWrapper();
        aw.cosmeticCenters = [SELECT Id, Name, Location__c FROM AM_CosmeticCenter__c WHERE AM_OnlineAppointments__c = TRUE]; // easier to send the Location that overdo the main query
        aw.specialtiesByCenter = specialtiesByCenter;

        return aw;
    }

    public class AvailabilityWrapper {
        @AuraEnabled
        public List<AM_Agenda__c> agendaAvailabilities;
        @AuraEnabled
        public List<AM_Specialty__c> specialtyAppointments;
    }

    /**
    * @description Retrieves the availabilities by specialty data and the appointments
    * @author mbayon | 08-07-2023 
    * @param specialtyId 
    * @return AvailabilityWrapper 
    **/
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

    public class NewAppointmentWrapper {
        @AuraEnabled
        public String center {get; set;}
        @AuraEnabled
        public String specialty {get; set;}
        @AuraEnabled
        public String newDate {get; set;}
        @AuraEnabled
        public String newTime {get; set;}
        @AuraEnabled
        public String name {get; set;}
        @AuraEnabled
        public String email {get; set;}
        @AuraEnabled
        public String phone {get; set;}
        @AuraEnabled
        public String observations {get; set;}
    }

    public class NewAppointmentResponseWrapper {
        @AuraEnabled
        public Boolean isError;
        @AuraEnabled
        public String msg;

        public NewAppointmentResponseWrapper() {
            this.isError = false;
            this.msg = null;
        }
        public NewAppointmentResponseWrapper(String msg) {
            this.isError = true;
            this.msg = msg;
        }
    }

    /**
    * @description Creates a new appointment
    * @author mbayon | 08-07-2023 
    * @param NewAppointmentWrapper 
    * @return NewAppointmentResponseWrapper 
    **/
    @AuraEnabled
    public static NewAppointmentResponseWrapper createNewAppointment(NewAppointmentWrapper appointment) {        
        System.debug('NewAppointmentWrapper.appointment: ' + appointment);
        AM_Appointment__c newAppointment = new AM_Appointment__c();
        newAppointment.AM_Specialty__c = appointment.specialty;
        newAppointment.AM_FormName__c = appointment.name;
        newAppointment.AM_FormEmail__c	 = appointment.email;
        newAppointment.AM_FormPhone__c = appointment.phone;
        newAppointment.AM_Observations__c = appointment.observations;
        List<String> appDate = appointment.newDate.split('/');
        Date myDate = Date.newInstance(Integer.valueOf(appDate.get(2)), Integer.valueOf(appDate.get(1)), Integer.valueOf(appDate.get(0)));
        List<String> appTime = appointment.newTime.split(':');
        Time myTime = Time.newInstance(Integer.valueOf(appTime.get(0)), Integer.valueOf(appTime.get(1)), 0, 0);
        newAppointment.AM_Date__c = DateTime.newInstanceGMT(myDate, myTime);

        try {
            List<Contact> cs = [SELECT Id FROM Contact WHERE Email = :appointment.email OR Phone = :appointment.phone];
            if (cs.size() > 0) {
                newAppointment.AM_Contact__c = cs.get(0).Id;
            } else {
                Contact c = new Contact();
                c.LastName = appointment.name;
                c.Email = appointment.email;
                c.Phone = appointment.phone;
                insert c;
                newAppointment.AM_Contact__c = c.Id;
            }
            insert newAppointment;
            return new NewAppointmentResponseWrapper();
        } catch (Exception e) {
            return new NewAppointmentResponseWrapper(e.getMessage());
        }
    }

}