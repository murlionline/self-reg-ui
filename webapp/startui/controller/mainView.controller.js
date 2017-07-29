sap.ui.define(["sap/ui/core/mvc/Controller"], function(Controller) {
	"use strict";
	return Controller.extend("startui.controller.mainView", {
		/**
		 *@memberOf startui.controller.mainView
		 */
		submitRequest: function() {
			//var userModel = this.getView().getModel("user");
			var userModel = this.getView().getModel("user");

			var context = JSON.stringify({
				"definitionId": "approveuser",
				"context": {
					"userData": {
						"input": {},
						"output": {},
						"firstname": userModel.oData.firstname,
						"lastname": userModel.oData.lastname,
						"honorificPrefix": userModel.oData.honprefix,
						"email": userModel.oData.email,
						"phone": userModel.oData.phone
					}
				}			
			});

			$.ajax({
				type: "GET",
				url: "/bpmworkflowruntime/v1/xsrf-token",
				headers: {
					"x-csrf-token": "Fetch"
				},
				success: function(data, statusText, xhr) {
					var token = xhr.getResponseHeader("X-CSRF-Token");

					$.ajax({
						type: "POST",
						url: "/bpmworkflowruntime/v1/workflow-instances",
						data: context,
						headers: {
							"x-csrf-token": token
						},
						success: function() {
							sap.m.MessageToast.show("Your user creation request has been submitted for approval!");
						},
						error: function(errMsg) {
							sap.m.MessageToast.show("XSRF token request didn't work: " + errMsg.statusText);
						},
						dataType: "json",
						contentType: "application/json"
					});
				},
				error: function(errMsg) {
					sap.m.MessageToast.show("Didn't work: " + errMsg.statusText);
				},
				contentType: "application/json"
			});
		}
	});
});