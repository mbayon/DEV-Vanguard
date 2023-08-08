/**
 * @description       : Appointment wizard modal with its four screens
 * @author            : mbayon
 * @last modified on  : 08-08-2023
 * @last modified by  : ChangeMeIn@UserSettingsUnder.SFDoc
 **/
import LightningModal from "lightning/modal";
import { track, api, wire } from "lwc";

import getCosmeticCentersList from "@salesforce/apex/AM_AppointmentWizardController.getCosmeticCentersList";
import getAvalabilityBySpecialty from "@salesforce/apex/AM_AppointmentWizardController.getAvalabilityBySpecialty";
import createNewAppointment from "@salesforce/apex/AM_AppointmentWizardController.createNewAppointment";

export default class MyModal extends LightningModal {
	@api isOpen;

	// Cosmetic Centers Combobox
	@track cosmeticCentersOptions = [];
	selectedCenter = {
		label: "",
		value: "",
	};
	@track isCenterSelected = true;

	// Cosmetic Centers Map
	@track mapMarkers = [];
	@track selectedMarkerValue;
	mapOptions = {
		draggable: false,
		disableDefaultUI: true,
	};

	// Specialties Combobox
	specialtiesByCenter;
	@track specialtiesOptions = [];
	selectedSpecialty = {
		label: "",
		value: "",
	};

	// Date info
	@track availableDays;
	selectedDate;

	// Contact Info
	@track contactInfo = {
		Name: "",
		Email: "",
		Phone: "",
		Observations: "",
	};

	@track currentStep = "step1";

	// Main data connection with Salesforce - Get all data needed
	@wire(getCosmeticCentersList)
	wiredCosmeticCenters({ error, data }) {
		try {
			console.log("wiredCosmeticCenters.data", data);
			console.log("wiredCosmeticCenters.error", error);
			if (data) {
				let cosmeticCentersOptionsAux = [];
				let mapMarkersAux = [];
				data.cosmeticCenters.forEach((center) => {
					cosmeticCentersOptionsAux.push({
						label: center.Name,
						value: center.Id,
					});
					mapMarkersAux.push({
						location: {
							City: center.Location__c.city,
							Country: center.Location__c.country,
							State: center.Location__c.state,
						},
						value: center.Id,
						title: center.Name,
						// ? Sets a pink start as icon
						// TODO Improve the map visuals
						// mapIcon: {
						// 	path: "M 125,5 155,90 245,90 175,145 200,230 125,180 50,230 75,145 5,90 95,90 z",
						// 	fillColor: "#e73c7e	",
						// 	fillOpacity: 1,
						// 	strokeWeight: 0,
						// 	scale: 0.15,
						// 	anchor: { x: 122.5, y: 115 },
						// },
					});
				});
				this.cosmeticCentersOptions = cosmeticCentersOptionsAux;
				this.mapMarkers = mapMarkersAux;

				this.specialtiesByCenter = data.specialtiesByCenter;
			}
		} catch (error) {
			console.error("wiredCosmeticCenters.error", error);
		}
	}

	/**
	 * Cosmetic Center Combobox - Handles the change of value
	 * @param {*} event
	 */
	handleCenterChange(event) {
		this.setSpecialtiesByCenter(event.detail.value);
		this.isCenterSelected = false;
		this.selectedMarkerValue = event.detail.value; // TODO: Doesnt work, map component limitation

		let selectedLabel = this.cosmeticCentersOptions.find((opt) => opt.value === event.detail.value).label;
		this.selectedCenter = {
			label: selectedLabel,
			value: event.target.selectedMarkerValue,
		};
	}

	/**
	 * Cosmetic Center Map - Handles the change of marker
	 * @param {*} event
	 */
	handleMarkerSelect(event) {
		this.setSpecialtiesByCenter(event.target.selectedMarkerValue);
		this.isCenterSelected = false;
		this.selectedMarkerValue = event.target.selectedMarkerValue;

		let selectedLabel = this.cosmeticCentersOptions.find((opt) => opt.value === event.target.selectedMarkerValue).label;
		this.selectedCenter = {
			label: selectedLabel,
			value: event.target.selectedMarkerValue,
		};
	}

	/**
	 * Set the Specialties combobox values based on a Center
	 * @param {*} event
	 */
	setSpecialtiesByCenter(center) {
		let specialtiesOptionsAux = [];
		this.specialtiesByCenter[center].forEach((specialty) => {
			specialtiesOptionsAux.push({
				label: specialty.Name,
				value: specialty.Id,
			});
		});
		this.specialtiesOptions = specialtiesOptionsAux;
		if (specialtiesOptionsAux.length === 1) this.selectedSpecialty = specialtiesOptionsAux[0];
	}

	/**
	 * Specialty Combobox - Handles the change of value
	 * @param {*} event
	 */
	handleSpecialtyChange(event) {
		let selectedLabel = event.target.options.find((opt) => opt.value === event.detail.value).label;
		this.selectedSpecialty = {
			label: selectedLabel,
			value: event.detail.value,
		};
	}

	/**
	 * Get availability by specialty id
	 * @param {String} specialtyId
	 */
	getAvailability(specialtyId) {
		getAvalabilityBySpecialty({ specialtyId: specialtyId })
			.then((result) => {
				this.availableDays = result;
				console.log("availableDays:", JSON.parse(JSON.stringify(result)));
			})
			.catch((error) => {
				console.error("getAvalabilityBySpecialty.error", error);
			});
	}

	/**
	 * Select date on change handler
	 * @param {*} event
	 */
	onSelectedDate(event) {
		this.selectedDate = event.detail;
	}

	/**
	 * Contact info on change handlers
	 * @param {*} event
	 */
	onNameChange(event) {
		this.contactInfo.Name = event.target.value;
	}
	onEmailChange(event) {
		this.contactInfo.Email = event.target.value;
	}
	onPhoneChange(event) {
		this.contactInfo.Phone = event.target.value;
	}
	onObservationsChange(event) {
		this.contactInfo.Observations = event.target.value;
	}

	// UI GET METHODS

	get getHeaderLabel() {
		switch (this.currentStep) {
			case "step1":
				return "Select your closest Center and the Specialty 🩺";
			case "step2":
				return "Select the time it suits you the most 📅";
			case "step3":
				return "Fill your Contact info 👤";
			case "step4":
				return "Review your Appointment data. Almost there! 🌿";
			default:
				break;
		}
	}

	get getPreviousButtonLabel() {
		return this.currentStep === "step1" ? "Cancel" : "Previous";
	}

	get getNextButtonLabel() {
		return this.currentStep === "step4" ? "Book your Appointment! 🚀" : "Next";
	}

	get showFirstPage() {
		return this.currentStep === "step1";
	}

	get showSecondPage() {
		return this.currentStep === "step2" && this.availableDays;
	}

	get showThirdPage() {
		return this.currentStep === "step3";
	}

	get showFourthPage() {
		return this.currentStep === "step4";
	}

	get isNextDisabled() {
		switch (this.currentStep) {
			case "step1":
				return !(this.selectedCenter.value !== "" && this.selectedSpecialty.value !== "");

			case "step2":
				return !this.selectedDate;

			case "step3":
				return !(this.contactInfo.Name !== "" && this.contactInfo.Email !== "" && this.contactInfo.Phone !== "");

			case "step4":
				return false;
		}
		return true;
	}

	/**
	 * Goes forward in the wizard
	 */
	onNextButtonClick() {
		switch (this.currentStep) {
			case "step1":
				this.getAvailability(this.selectedSpecialty.value);
				this.currentStep = "step2";
				break;

			case "step2":
				this.currentStep = "step3";
				break;

			case "step3":
				this.currentStep = "step4";
				break;

			case "step4":
				this.createAppointment();
				break;

			default:
				break;
		}
	}

	/**
	 * Goes backwards in the wizard
	 */
	onPreviousButtonClick() {
		switch (this.currentStep) {
			case "step1":
				this.closeModal('cancel');
				break;

			case "step2":
				this.currentStep = "step1";
				break;

			case "step3":
				this.currentStep = "step2";
				break;

			case "step4":
				this.currentStep = "step3";
				break;

			default:
				break;
		}
	}

	/**
	 * On modal's X button click
	 */
	onCloseButtonClick() {
		this.closeModal('cancel');
	}

	/**
	 * Closes the modal and dipatch an event to parent
	 * @param {*} msg is appointment booked?
	 */
	closeModal(msg) {
		try {
			this.dispatchEvent(
				new CustomEvent("close", {
					detail: msg,
				})
			);
			this.isOpen = false;
		} catch (error) {
			console.error("handleCancel.error", error);
		}
	}

	/**
	 * Creates the appointment in the database
	 */
	createAppointment() {
		let wrapper = {
			center: this.selectedCenter.value,
			specialty: this.selectedSpecialty.value,
			newDate: this.selectedDate.date,
			newTime: this.selectedDate.time,
			name: this.contactInfo.Name,
			email: this.contactInfo.Email,
			phone: this.contactInfo.Phone,
			observations: this.contactInfo.Observations,
		};
		console.log("appointment wrapper", JSON.parse(JSON.stringify(wrapper)));

		createNewAppointment({ appointment: wrapper })
			.then((result) => {
				console.log("createNewAppointment.result:", JSON.parse(JSON.stringify(result)));
				this.closeModal('booked');
			})
			.catch((error) => {
				console.error("createNewAppointment.error", error);
				this.closeModal('error');
			});

	}
}
