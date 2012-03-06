window.PaginatorFIlterRails1 = {
	Models: {},
	Collections: {},
	Views: {},
	Routers: {},
	init: function() {
		new Pf1.Routers.Zones;
		Backbone.history.start();
	},
	autoApproveStatus : function(collection, state)
	{
		return _(collection.filter(function(data) {
			return data.get("auto_approve") == state;
		}));
	},
	philtered_array : []
};

var Pf1 = PaginatorFIlterRails1;


Pf1.Routers.Zones = Backbone.Router.extend({
	routes :
	{
		'' : 'index'
	},
	index : function ()
	{
		var zones_collection = new Pf1.Collections.Zones();
		zones_collection.fetch();
		zones_view = new Pf1.Views.Zones({
			el         : $('#zones_table'), 
			collection : zones_collection
		});

		var btnGroup = $('<div class="btn-group"></div>').insertBefore($('#zones_table'));
		var showActiveAndInactive = $('<a href="#" class="btn">Both</a>').appendTo( btnGroup);
		var showActive = $('<a href ="#" class="btn">active</a>').appendTo(btnGroup);
		var showInactive = $('<a href="#" class="btn">inactive</a>').appendTo( btnGroup);
		showActiveAndInactive.click(function(){
			zones_collection.philter = function()
			{
				return _(this.models);
			}
			zones_view.render();
		});
		showActive.click(function(){
			zones_collection.philter = function()
			{
				return Pf1.autoApproveStatus(zones_collection,true);
			}
			zones_view.render();
		});
		showInactive.click(function(){
			zones_collection.philter = function()
			{
				return Pf1.autoApproveStatus(zones_collection,false);
			}
			zones_view.render();
		});
		
		var dirGroup = $('<div class="btn-group"></div>').insertBefore($('#zones_table'));
		var upBtn = $('<a href="#" class="btn">Up</a>').appendTo( dirGroup).click(function(){
			console.log('clicked up')
			zones_view.pager('name');
		});
		var downBtn = $('<a href ="#" class="btn">Down</a>').appendTo(dirGroup).click(function(){
			console.log('clicked down')
			zones_view.pager('name','desc');
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


Pf1.Views.Zones = Backbone.View.extend({
	update: function()
	{
		this.tbody.html(''); 
		_(this.models).each(function(row){
			row.change();
		})
	},
	appendItem : function(row)
	{
		var view = this;
		var rowView = new Pf1.Views.Zone({
			model : row
		});
		if(rowView) this.tbody.append(rowView.render().el);
	}
})
_.extend(Pf1.Views.Zones.prototype, ActionTable.RowsView);

Pf1.Views.Zone = Backbone.View.extend({
	
	tagName : 'tr',
	initialize : function()
	{
		_.bindAll(this,'render','unrender','remove');
		this.bind('remove',this.unrender);
		this.model.bind('change', this.render)
	},
	template : "<td>{{attr.name}}</td><td>{{attr.site_name}}</td><td><input type='checkbox' class='checkbox' /></td>",
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


