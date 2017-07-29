sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"approval/model/models"
], function(UIComponent, Device, models) {
	"use strict";

	return UIComponent.extend("approval.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function() {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);
			// set the device model
			this.setModel(models.createDeviceModel(), "device");

			// get task data
			var startupParameters = this.getComponentData().startupParameters;
			var taskModel = startupParameters.taskModel;
			var taskData = taskModel.getData();
			var taskId = taskData.InstanceID;

			// read process context & bind it to the view's model 
			var that = this;
			var jsonModel = new sap.ui.model.json.JSONModel();
			that.setModel(jsonModel);

			$.ajax({
				type: "GET",
				url: "/bpmworkflowruntime/rest/v1/task-instances/" + taskId + "/context",
				contentType: "application/json",
				dataType: "json",
				success: function(result, xhr, data) {

					var processContext = new sap.ui.model.json.JSONModel();
					processContext.context = data.responseJSON;

					processContext.context.task = {};
					processContext.context.task.Title = taskData.TaskTitle;
					processContext.context.task.Priority = taskData.Priority;
					processContext.context.task.Status = taskData.Status;

					if (taskData.Priority === "HIGH") {
						processContext.context.task.PriorityState = "Warning";
					} else if (taskData.Priority === "VERY HIGH") {
						processContext.context.task.PriorityState = "Error";
					} else {
						processContext.context.task.PriorityState = "Success";
					}

					processContext.context.task.CreatedOn = taskData.CreatedOn.toDateString();
					// get task description and add it to the model
					startupParameters.inboxAPI.getDescription("NA", taskData.InstanceID).done(function(dataDescr) {
						processContext.context.task.Description = dataDescr.Description;
						jsonModel.setProperty("/context/task/Description", dataDescr.Description);
					}).
					fail(function(errorText) {
						jQuery.sap.require("sap.m.MessageBox");
						sap.m.MessageBox.error(errorText, {
							title: "Error"
						});
					});

					jsonModel.setData(processContext);
					that.setModel(jsonModel);
				}
			});

			var oNegativeAction = {
				sBtnTxt: "Reject",
				onBtnPressed: function(e) {
					that._triggerComplete(that.oComponentData.inboxHandle.attachmentHandle.detailModel.getData().InstanceID, false,
						jQuery.proxy(
							that._refreshTask, that));
				}
			};

			var oPositiveAction = {
				sBtnTxt: "Approve",
				onBtnPressed: function(e) {
					that._triggerComplete(that.oComponentData.inboxHandle.attachmentHandle.detailModel.getData().InstanceID, true,
						jQuery.proxy(
							that._refreshTask, that));
				}
			};

			startupParameters.inboxAPI.addAction({
				action: oPositiveAction.sBtnTxt,
				label: oPositiveAction.sBtnTxt,
				type: "Accept"
			}, oPositiveAction.onBtnPressed);

			startupParameters.inboxAPI.addAction({
				action: oNegativeAction.sBtnTxt,
				label: oNegativeAction.sBtnTxt,
				type: "Reject"
			}, oNegativeAction.onBtnPressed);

		},

		createSCIUser: function(task) {
			//this.getModel().oData.context.userData
			var userData = this.getModel().oData.context.userData;
			var sci_input = {
				"name": {
					"givenName": userData.firstname,
					"familyName": userData.lastname,
					"honorificPrefix": userData.honorificPrefix
				},
				"emails": [{
					"value": userData.email
				}],
				"phoneNumbers": [{
					"value": userData.phone,
					"type": "work"
				}],
				"groups": [{
					"value": userData.output.group
				}]
			};

			$.ajax({
				url: "Path to your IdP SCIM APIs", //Make sure you reference it in the Destinations
				type: "POST",
				contentType: "application/scim+json",
				data: JSON.stringify(sci_input),
				success: function(result, xhr, data) {
					sap.m.MessageToast.show("user has been created!");
				}

			});

		},

		_triggerComplete: function(taskId, approvalStatus, refreshTask) {
			$.ajax({
				url: "/bpmworkflowruntime/rest/v1/xsrf-token",
				method: "GET",
				headers: {
					"X-CSRF-Token": "Fetch"
				},
				success: function(result, xhr, data) {
					var token = data.getResponseHeader("X-CSRF-Token");
					$.ajax({
						url: "/bpmworkflowruntime/rest/v1/task-instances/" + taskId,
						method: "PATCH",
						contentType: "application/json",
						data: "{\"status\":\"COMPLETED\",\"context\": {\"userCreationApproved\": \"" + approvalStatus + "\" }}",
						headers: {
							"X-CSRF-Token": token
						},
						success: refreshTask
					});
				}

			});
		},

		_refreshTask: function() {
			this.createSCIUser();
			var taskId = this.getComponentData().startupParameters.taskModel.getData().InstanceID;
			this.getComponentData().startupParameters.inboxAPI.updateTask("NA", taskId);
		}

	});

});