/**
 * @description       : Date Selector component
 * @author            : mbayon
 * @last modified on  : 08-07-2023
 * @last modified by  : ChangeMeIn@UserSettingsUnder.SFDoc
**/
import { LightningElement } from "lwc";
import { api, track } from "lwc";

export default class Am_dateselector extends LightningElement {
	@api availableDays;

	currentDate = new Date();

	@track month;
	@track year;

	@track calendar = [];

	@track timeSlots = [];
	availabilitiesSlots;

	selectedValues = {
		date: undefined,
		time: undefined,
	};

	/**
	 * @return {Boolean} are time slots availanle for showing in the UI?
	 */
	get areTimeSlots() {
		return this.timeSlots.length > 0;
	}

	/**
	 * onInit()
	 */
	connectedCallback() {
		this.generateCalendar(this.currentDate);
	}

	/**
	 * Returns the number of days for a given month/year
	 * @param {Number} month given month
	 * @param {Number} year given year
	 * @return {Number} number of days for a given month/year
	 */
	monthDays(month, year) {
		var result = [];
		var days = new Date(year, month, 0).getDate();
		for (var i = 1; i <= days; i++) {
			result.push(i);
		}
		return result;
	}

	/**
	 * Generates the calendar to be shown on the component taking into account 
	 * the current month and the api param availability
	 * @param {Date} d full date object
	 */
	generateCalendar(d) {
		Date.prototype.monthDays = function () {
			var d = new Date(this.getFullYear(), this.getMonth() + 1, 0);
			return d.getDate();
		};

		var details = {
			totalDays: d.monthDays(),
			weekDays: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
			months: [
				"JANUARY",
				"FEBRUARY",
				"MARCH",
				"APRIL",
				"MAY",
				"JUNE",
				"JULY",
				"AUGUST",
				"SEPTEMBER",
				"OCTOBER",
				"NOVEMBER",
				"DECEMBER",
			],
		};
		var curr = new Date(d.getFullYear(), d.getMonth()).getDay();
		var start = [6, 0, 1, 2, 3, 4, 5][curr]; // Start week on Monday
		var day = 1;

		if (this.availableDays) {
			var agenda = this.availableDays.agendaAvailabilities[0];

			var startAvDate = new Date(agenda.AM_StartDate__c);
			startAvDate = d.getMonth() === startAvDate.getMonth() ? startAvDate.getDate() : undefined;
			var endAvDate = new Date(agenda.AM_EndDate__c);
			endAvDate = d.getMonth() === endAvDate.getMonth() ? endAvDate.getDate() : undefined;

			var availabilities = [];
			var availabilitiesSlots = new Map();
			agenda.Availabilities__r.forEach((av) => {
				// inform slots and availabilities based on the day of the week
				availabilities.push(parseInt(av.AM_DayOfTheWeek__c));
				availabilitiesSlots.set(av.AM_DayOfTheWeek__c, {
					start: new Date(av.AM_StartTime__c),
					end: new Date(av.AM_EndTime__c),
				});
			});
		}
		this.availabilitiesSlots = availabilitiesSlots;
		
		var calendar = [];
		for (var i = 0; i <= 6; i++) {
			calendar.push([]);
			for (var j = 0; j < 7; j++) {
				if (i === 0) { // push mon-sun
					calendar[i].push(this.createDay(d, details.weekDays[j], false, true, false, j));
				} else if (day > details.totalDays) { // white after 31
					calendar[i].push(this.createDay(d, "", false, false, false, j));
				} else {
					if (i === 1 && j < start) { // white before 1
						calendar[i].push(this.createDay(d, "", false, false, false, j));
					} else { // days available
						if (day >= startAvDate && day <= endAvDate && availabilities.includes(j)) {
							calendar[i].push(this.createDay(d, day++, true, false, true, j));
						} else { // days not available
							calendar[i].push(this.createDay(d, day++, true, false, false, j));
						}
					}
				}
			}
		}
		this.calendar = calendar;

		this.month = details.months[d.getMonth()];
		this.year = d.getFullYear();
	}

	/**
	 * Reusable method to create a new day to be handled on the UI.
	 * @param {Date} d full date object to create the related date
	 * @param {Number} value day of the month (1-31)
	 * @param {Boolean} isDay is a day of the month (to know whites)
	 * @param {Boolean} isHeader is header (day of the week)
	 * @param {Boolean} isAvailable is an available day to register the appointment
	 * @param {Number} weekDay day of the week
	 * @return {Object} date object to be handled in the UI
	 *
	 * TODO: Improve this logic, better approach with better method
	 */
	createDay(d, value, isDay, isHeader, isAvailable, weekDay) {
		return {
			value: value,
			isDay: isDay,
			isHeader: isHeader,
			isAvailable: isAvailable,
			weekDay: weekDay,
			date: value + "/" + (d.getMonth() + 1) + "/" + d.getFullYear(),
		};
	}

	/**
	 * Handles the previous month's click and generate the new calendar
	 * @param {event} ev event on previous month's click
	 */
	previousMonth(event) {
		if (this.currentDate.getMonth() === 0) {
			this.currentDate = new Date(this.currentDate.getFullYear() - 1, 11);
			this.generateCalendar(this.currentDate);
		} else {
			this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1);
			this.generateCalendar(this.currentDate);
		}
	}

	/**
	 * Handles the next month's click and generate the new calendar
	 * @param {event} ev event on next month's click
	 */
	nextMonth(event) {
		if (this.currentDate.getMonth() === 11) {
			this.currentDate = new Date(this.currentDate.getFullYear() + 1, 0);
			this.generateCalendar(this.currentDate);
		} else {
			this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1);
			this.generateCalendar(this.currentDate);
		}
	}

	/**
	 * Handles the day's click and informs the slots
	 * @param {event} ev event on an day's click
	 */
	onDayClick(event) {
		this.template.querySelectorAll(".daySelectedActive").forEach((element) => {
			element.classList.remove("daySelectedActive");
		});
		event.currentTarget.classList.toggle("daySelectedActive");

		let avSlots = this.availabilitiesSlots.get(event.target.dataset.weekday);

		let newSlot = avSlots.start;
		let newSlots = [];
		while (newSlot.getHours() < avSlots.end.getHours()) {
			newSlots.push({ value: newSlot.toTimeString().replace(/^(\d{2}:\d{2}).*/, "$1") });
			newSlot = new Date(newSlot.getTime() + 30 * 60000); // add 30 mins
		}
		this.timeSlots = newSlots;

		this.selectedValues.date = event.target.dataset.date;
	}

	/**
	 * Handles the slot's click and sends the information to the wizard
	 * @param {event} ev event on an slot's click
	 */
	onSlotClick(event) {
		this.template.querySelectorAll(".slotButtonActive").forEach((element) => {
			element.classList.remove("slotButtonActive");
		});
		event.currentTarget.classList.toggle("slotButtonActive");

		this.selectedValues.time = event.target.dataset.time;

		try {
			this.dispatchEvent(
				new CustomEvent("selecteddate", {
					detail: this.selectedValues,
				})
			);
		} catch (error) {}
	}
}
