/*************************************************************
 * study.js
 *
 * Main code, responsible for configuring the steps and their
 * actions.
 *
 * Author: LITW Team.
 *
 * © Copyright 2017-2023 LabintheWild.
 * For questions about this file and permission to use
 * the code, contact us at info@labinthewild.org
 *************************************************************/

// load webpack modules
window.$ = window.jquery = require("jquery");
require("jquery-ui-bundle");
require("./jquery.i18n");
require("./jquery.i18n.messagestore");
require("bootstrap");
require("alpaca");
var LITW_STUDY_CONTENT= require("./data");
var irbTemplate = require("../templates/irb.html");
var demographicsTemplate = require("../templates/demographics.html");
var values1Template = require("../templates/values1.html");
var instructionsTemplate = require("../templates/instructions.html");
var loadingTemplate = require("../templates/loading.html");
var resultsTemplate = require("../templates/results.html");
var progressTemplate = require("../templates/progress.html");
var commentsTemplate = require("../templates/comments.html");
require("./jspsych-display-info");
require("./jspsych-display-slide");

module.exports = (function() {

	window.litwWithTouch = false;

	var timeline = [],
	params = {
		currentProgress: 0,
		preLoad: ["img/btn-next.png","img/btn-next-active.png","img/ajax-loader.gif"]
	};

	function showIRB(afterIRBFunction) {
		LITW.tracking.recordCheckpoint("irb");
		$("#irb").html(irbTemplate());
		$("#irb").i18n();
		LITW.utils.showSlide("irb");
		$("#agree-to-study").on("click", function() {
			if ($(this).prop("checked")) {
				LITW.utils.showNextButton(afterIRBFunction);
				$("#approve-irb").hide();
			} else {
				LITW.utils.hideNextButton();
				$("#approve-irb").show();
			}
		});

		// show the introductory splash screen
		$("#splash-screen").modal({backdrop: "static"});
	}

	function configureStudy() {
		// ******* BEGIN STUDY PROGRESSION ******** //

		// DEMOGRAPHICS
		timeline.push({
            type: "display-slide",
            template: demographicsTemplate,
            display_element: $("#demographics"),
            name: "demographics",
            finish: function(){
            	var dem_data = $('#demographicsForm').alpaca().getValue();
				dem_data['time_elapsed'] = getSlideTime();
            	jsPsych.data.addProperties({demographics:dem_data});
            	LITW.data.submitDemographics(dem_data);
            }
        });


		// VALUES PART 1
		timeline.push({
            type: "display-slide",
            template: values1Template,
            display_element: $("#values1"),
            name: "values1",
            finish: function(){
            	var values1_data = $('#valuesForm').alpaca().getValue();
				values1_data['time_elapsed'] = getSlideTime();
            	jsPsych.data.addProperties({values1:values1_data});
            	LITW.data.submitStudyData(values1_data);
            }
        });


		// 1. GENERAL INSTRUCTIONS PAGE
		timeline.push({
			type: "display-slide",
            display_element: $("#instructions"),
			name: "instructions",
            template: instructionsTemplate({withTouch: window.litwWithTouch})
		});


		timeline.push({
			type: "display-slide",
			template: commentsTemplate,
			display_element: $("#comments"),
			name: "comments",
			finish: function(){
				var comments = $('#commentsForm').alpaca().getValue();
				if (Object.keys(comments).length > 0) {
					comments['time_elapsed'] = getSlideTime();
					LITW.data.submitComments(comments);
				}
			}
		});
		// ******* END STUDY PROGRESSION ******** //
	}

    function getSlideTime() {
		var data_size = jsPsych.data.getData().length;
		if( data_size > 0 ) {
			return jsPsych.totalTime() - jsPsych.data.getLastTrialData().time_elapsed;
		} else {
			return jsPsych.totalTime();
		}
	}

	function submitData() {
		LITW.data.submitStudyData(jsPsych.data.getLastTrialData());
	}

	function startStudy() {
		LITW.utils.showSlide("trials");
		jsPsych.init({
		  timeline: timeline,
		  on_finish: showResults,
		  display_element: $("#trials")
		});
	}

	function showResults() {
		LITW.utils.showSlide("results");
		$("#results").html(resultsTemplate({}));
		LITW.results.insertFooter();
	}

	function readSummaryData() {
		$.getJSON( "summary.json", function( data ) {
			//TODO: 'data' contains the produced summary form DB data 
			//      in case the study was loaded using 'index.php'
			//SAMPLE: The example code gets the cities of study partcipants.
			console.log(data);
		});
	}

	// when the page is loaded, start the study!
	$(document).ready(function() {
		// get initial data from database (maybe needed for the results page!?)
		readSummaryData();

		// detect touch devices
		window.litwWithTouch = ("ontouchstart" in window);

		// determine and set the study language
		$.i18n().locale = 'en'; //LITW.locale.getLocale();
		$.i18n().load({
			'en': 'src/i18n/en.json',
		}).done( function(){
			$('head').i18n();
			$('body').i18n();
			// generate unique participant id and geolocate participant
			LITW.data.initialize();
			LITW.utils.showSlide("img-loading");

			//start the study when resources are preloaded
			jsPsych.pluginAPI.preloadImages( params.preLoad,
				function() {
					configureStudy();
					//showIRB(startStudy);
					startStudy();
				},

				// update loading indicator
				function(numLoaded) {
					$("#img-loading").html(loadingTemplate({
						msg: $.i18n("litw-template-loading"),
						numLoaded: numLoaded,
						total: params.preLoad.length
					}));
				}
			);
		});
	});
})();


