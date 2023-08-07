import { LightningElement } from 'lwc';
import { track } from 'lwc';

export default class Am_landingpage extends LightningElement {
    @track isAppointmentModalOpen = true;

    onPideCitaClick() {
        this.isAppointmentModalOpen = true;
    }

    onAppointmentModalClosed(event) {
        console.log('onAppointmentModalClosed', event);
        this.isAppointmentModalOpen = false;
    }
}