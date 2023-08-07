/**
 * @description       : 
 * @author            : mbayon
 * @group             : 
 * @last modified on  : 08-07-2023
 * @last modified by  : ChangeMeIn@UserSettingsUnder.SFDoc
**/
import LightningModal from "lightning/modal";
import { track, api, wire } from "lwc";

import getCosmeticCentersList from "@salesforce/apex/AM_AppointmentWizardController.getCosmeticCentersList";
import getAvalabilityBySpecialty from "@salesforce/apex/AM_AppointmentWizardController.getAvalabilityBySpecialty";

export default class MyModal extends LightningModal {
	@api isOpen;

	// Cosmetic Centers Combobox
	@track cosmeticCentersOptions = [];
	selectedCenter = {
		label: '',
		value: '',
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
		label: '',
		value: '',
	};

	@track availableDays;
	selectedDate;

	@track currentStep = "step1";

	contactInfo = {
		Name: '',
		Email: '',
		Phone: '',
		Observations: '',
	}

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
						// mapIcon: {
						// 	// Sets a pink start as icon
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

	// Cosmetic Center Combobox - Handles the change of value
	handleCenterChange(event) {
		this.setSpecialtiesByCenter(event.detail.value);
		this.isCenterSelected = false;
		this.selectedMarkerValue = event.detail.value; // TODO: Doesnt work, map component limitation

		let selectedLabel = this.cosmeticCentersOptions.find(opt => opt.value === event.detail.value).label;
		this.selectedCenter = {
			label: selectedLabel,
			value: event.target.selectedMarkerValue
		};
	}

	// Cosmetic Center Map - Handles the change of marker
	handleMarkerSelect(event) {
		this.setSpecialtiesByCenter(event.target.selectedMarkerValue);
		this.isCenterSelected = false;
		this.selectedMarkerValue = event.target.selectedMarkerValue;
		
		let selectedLabel = this.cosmeticCentersOptions.find(opt => opt.value === event.target.selectedMarkerValue).label;
		this.selectedCenter = {
			label: selectedLabel,
			value: event.target.selectedMarkerValue
		};
	}

	// Set the Specialties combobox values based on a Center
	setSpecialtiesByCenter(center) {
		let specialtiesOptionsAux = [];
		this.specialtiesByCenter[center].forEach((specialty) => {
			specialtiesOptionsAux.push({
				label: specialty.Name,
				value: specialty.Id,
			});
		});
		this.specialtiesOptions = specialtiesOptionsAux;
	}

	// Specialty Combobox - Handles the change of value
	handleSpecialtyChange(event) {
		let selectedLabel = event.target.options.find(opt => opt.value === event.detail.value).label;
		this.selectedSpecialty = {
			label: selectedLabel,
			value: event.detail.value
		};
	}
	
	getAvailability(specialtyId) {
		getAvalabilityBySpecialty({ specialtyId: "a017R00004EYcbQQAT" })
			.then((result) => {
				this.availableDays = result;
				console.log("availableDays:", JSON.parse(JSON.stringify(result)));
			})
			.catch((error) => {
				console.error("getAvalabilityBySpecialty.error", error);
			});
	}

	onSelectedDate(event) {
		this.selectedDate = event.detail;
	}

	onNameChange(event) {
		console.log('event.target.value', event.target.value);
		this.contactInfo.Name = event.target.value;
	}
	onEmailChange(event) {
		console.log('event.target.value', event.target.value);
		this.contactInfo.Email = event.target.value;
	}
	onPhoneChange(event) {
		console.log('event.target.value', event.target.value);
		this.contactInfo.Phone = event.target.value;
	}
	onObservationsChange(event) {
		console.log('event.target.value', event.target.value);
		this.contactInfo.Observations = event.target.value;
	}

	handleStepBlur(event) {
		const stepIndex = event.detail.index;
		console.log("stepIndex:");
	}

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
				return !(this.selectedCenter.value !== '' && this.selectedSpecialty.value !== '');

			case "step2":
				return !(this.selectedDate);

			case "step3":
				return !(this.contactInfo.Name !== '' && this.contactInfo.Email !== '' && this.contactInfo.Phone !== '');

			case "step4":
				return false;

		}
		return true;
	}

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

	onPreviousButtonClick() {
		switch (this.currentStep) {
			case "step1":
				this.closeModal(false);
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

	closeModal(isBooked) {
		try {
			this.dispatchEvent(
				new CustomEvent("close", {
					detail: isBooked ? "booked-appointment" : "canceled",
				})
			);
			this.isOpen = false;
		} catch (error) {
			console.error("handleCancel.error", error);
		}
	}

	createAppointment() {
		let appointment = {
			center: this.selectedCenter.value,
			specialty: this.selectedSpecialty.value,
			date: this.selectedDate.date,
			time: this.selectedDate.time,
			name: this.contactInfo.Name,
			email: this.contactInfo.Email,
			phone: this.contactInfo.Phone,
			observations: this.contactInfo.Observations,
		}
		console.log('appointment', JSON.parse(JSON.stringify(appointment)));
		this.closeModal(true);
	}
}
