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
//TODO: We don't need the whole d3 for only reading a csv.
import * as d3_csv from "d3-fetch";
var LITW_STUDY_CONTENT= require("./data");
var irbTemplate = require("../templates/irb.html");
var demographicsTemplate = require("../templates/demographics.html");
var valuesTemplate = require("../templates/values.html");
var conversationTemplate = require("../templates/ai_conversation.html");
var loadingTemplate = require("../templates/loading.html");
var resultsTemplate = require("../templates/results.html");
var progressTemplate = require("../templates/progress.html");
var commentsTemplate = require("../templates/comments.html");
require("./jspsych-display-info");
require("./jspsych-display-slide");

module.exports = (function(exports) {

	window.litwWithTouch = false;

	var timeline = [],
	params = {
		currentProgress: 0,
		preLoad: ["img/btn-next.png","img/btn-next-active.png","img/ajax-loader.gif"],
		participant_values: {},
		convo_data: null,
		convo_length_max: 10,
		convo_length_min: 2,
		convo_snippets: []
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

		//DEMOGRAPHICS
		// timeline.push({
        //     type: "display-slide",
        //     template: demographicsTemplate,
        //     display_element: $("#demographics"),
        //     name: "demographics",
        //     finish: function(){
        //     	var dem_data = $('#demographicsForm').alpaca().getValue();
		// 		dem_data['time_elapsed'] = getSlideTime();
        //     	jsPsych.data.addProperties({demographics:dem_data});
        //     	LITW.data.submitDemographics(dem_data);
        //     }
        // });


		// VALUES QUESTIONNAIRE
		// timeline.push({
        //     type: "display-slide",
        //     template: valuesTemplate,
        //     display_element: $("#values"),
        //     name: "values",
        //     finish: function(){
		// 		//TODO Call method to get form data!
        //     	let values_data = {}
        //     	jsPsych.data.addProperties({values1:values_data});
        //     	LITW.data.submitStudyData(values_data);
        //     }
        // });

		//params.convo_data = await d3.csv("src/i18n/conversations-en.csv")
		// console.log(`CONVO SIZE: ${params.convo_data.length}`);
		for (let counter = 0; counter < params.convo_length_max; counter++ ){
			let num1 = Math.floor(Math.random() * params.convo_data.length);
			let num2 = num1;
			while(num1 == num2){
				num2 = Math.floor(Math.random() * params.convo_data.length);
			}
			let convo1 = params.convo_data[num1];
			let convo2 = params.convo_data[num2];
			params.convo_snippets.push({
				q1:convo1.snippetq,
				a1:convo1.snippeta,
				q2:convo2.snippetq,
				a2:convo2.snippeta
			});
		}
		timeline.push({
            type: "display-slide",
			display_next_button: false,
            template: conversationTemplate(),
            display_element: $("#ai_convo"),
            name: "ai_conversation",
            finish: function(){
            	// var dem_data = $('#demographicsForm').alpaca().getValue();
				// dem_data['time_elapsed'] = getSlideTime();
            	// jsPsych.data.addProperties({demographics:dem_data});
            	// LITW.data.submitDemographics(dem_data);
            }
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
					//TODO: This is a strange place to put this file loading!
					d3_csv.csv("src/i18n/conversations-en.csv").then(function(data) {
						params.convo_data = data;
						configureStudy();
						//showIRB(startStudy);
						startStudy();
					});
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
	exports.study = {};
	exports.study.params = params

})( window.LITW = window.LITW || {} );


