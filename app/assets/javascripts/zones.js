window.Pf1 = {
	Models: {},
	Collections: {},
	Views: {},
	Routers: {},
	init: function() {
		new Pf1.Routers.Zones;
		Backbone.history.start();
	},
	customFilters :
	{
		autoApproveStatus : function(collection, state)
		{
			return collection.filter(function(data) {
				return data.get("auto_approve") == state;
			});
		}
	}
};



Pf1.Routers.Zones = Backbone.Router.extend({
	routes :
	{
		'' : 'index'
	},
	index : function ()
	{
		//////////////////////////////////
		//
		// Initialize collection and View
		//
		//////////////////////////////////
		
		var zones_collection = new Pf1.Collections.Zones();
		zones_view = new Pf1.Views.Zones({
			el         : $('#zones_table'), 
			collection : zones_collection
		});
		
		
		
		////////////////////
		//
		// Optional headers
		//
		////////////////////
		
		var headerize = new ActionTable.Header();
		var headers = [
			{ name : "ID", sort : 'id', numeric : true},
			{ name : "Zone name", sort : 'name'},
			{ name : "Zone url", sort : 'site_name'},
			{ name : "Auto-approve", sort : 'auto_approve'}
		];
		headerize.init(zones_view,headers);
		
		/////////////////////
		//
		// create UI for custom filters
		//
		/////////////////////
		
		var btnGroup = $('<div class="btn-group"></div>').insertBefore($('#zones_table'));
		var showActiveAndInactive = $('<a href="#" class="btn">All zones</a>').appendTo( btnGroup);
		var showActive = $('<a href ="#" class="btn">Auto-approve enabled</a>').appendTo(btnGroup);
		var showInactive = $('<a href="#" class="btn">Auto-approve disabled</a>').appendTo( btnGroup);
		
		showActiveAndInactive.click(function(){
			zones_collection._filter = function()
			{
				return this.models;
			}
			zones_view.render(1);
		});
		showActive.click(function(){
			zones_collection._filter = function()
			{
				return Pf1.customFilters.autoApproveStatus(zones_collection.models,true);
				
			}
			zones_view.render(1);
		});
		showInactive.click(function(){

			zones_collection._filter = function()
			{
				return Pf1.customFilters.autoApproveStatus(zones_collection.models,false);
			}
			zones_view.render(1);
		});
		
		
	}
	
});



Pf1.Models.Zone = Backbone.Model.extend({});
_.extend(Pf1.Models.Zone.prototype, ActionTable.Row);

Pf1.Collections.Zones = Backbone.Collection.extend({
	url : '/zones',
	model : Pf1.Models.Zone
});
_.extend(Pf1.Collections.Zones.prototype, ActionTable.Rows);

Pf1.Views.Zones = Backbone.View.extend({})
_.extend(Pf1.Views.Zones.prototype, ActionTable.RowsView);

Pf1.Views.Zone = Backbone.View.extend({
	tagName : 'tr',
	template : "<td>{{attr.id}}</td><td>{{attr.name}}</td><td>{{attr.site_name}}</td><td><input type='checkbox' class='checkbox' /></td>",
	events : 
	{
		'click input' : 'toggle_selection'
	},
	toggle_selection : function(e)
	{
		e.preventDefault();
		this.model.set({auto_approve: e.currentTarget.checked, funky : 'monkey', dinky:"winky"});
		this.model.saveStrip({success : this.update_successful()})
	}
});
_.extend(Pf1.Views.Zone.prototype, ActionTable.RowView)

$(document).ready(function(){
  Pf1.init();
});


