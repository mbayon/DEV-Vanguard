import { LightningElement } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { track } from "lwc";

// // TODO: Custom field on centers to activate online appointments
// TODO: Improve transition
// TODO: Loading UI
// TODO: Reset appointment after book
// TODO: Remove appointments from availability
// ?: Recognise user
// TODO: Controller - Improve CRUD best practices
// TODO: App - Improve UI

export default class Am_landingpage extends LightningElement {
	@track isAppointmentModalOpen = false;

	onPideCitaClick() {
		this.isAppointmentModalOpen = true;
	}

	onAppointmentModalClosed(event) {
		console.log("onAppointmentModalClosed", event);
		console.log("event.detail", event.detail);

		if (event.detail === "error") {
			this.showErrorToast();
		} else if (event.detail === "booked") {
			this.showSuccessToast();
		}

		this.isAppointmentModalOpen = false;
	}

	showNotification(title, message, variant) {
		const evt = new ShowToastEvent({
			title: title,
			message: message,
			variant: variant,
		});
		this.dispatchEvent(evt);
	}

	showErrorToast() {
		this.template
			.querySelector("c-am_toast")
			.showToast("error", "<strong>Oops! Something went wrong<strong/><br>Please, try again in a few minutes.", "utility:warning", 5000);
	}
	showSuccessToast() {
		this.template
			.querySelector("c-am_toast")
			.showToast("success", "<strong>Appointment booked successfully! 🚀<strong/><br>Looking forward to meet you.", "utility:date_time", 5000);
	}
}
