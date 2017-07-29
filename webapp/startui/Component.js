sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"startui/model/models"
], function(UIComponent, Device, models) {
	"use strict";

	return UIComponent.extend("startui.Component", {

		metadata: {
			manifest: "json",
			publicMethods: [ "updateBinding" ]
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
			this.setModel(models.createUserModel(), "user");
		},
		
		createContent: function(){
			var mainView = sap.ui.view({type:sap.ui.core.mvc.ViewType.XML, viewName:"startui.view.mainView", viewData: {}});
			
			return mainView;
		}
	});
});