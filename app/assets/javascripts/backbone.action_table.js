
var ActionTable = {};

ActionTable.Row = {
	saveStrip : function(options)
	{
		var store_custome_attributes = {};
		for(var key in this.collection.customizers)
		{
			store_custome_attributes[key] = this.get(key);
			this.unset(key);
		}
		this.save({success: options.success});
		for(var key in store_custome_attributes)
		{
			var attribute = {};
			attribute[key] = store_custome_attributes[key];
			this.set(attribute)
		}
	},
};

ActionTable.Rows = {

	_filter : function()
	{
		return this.models
	},
	paramed_fetch : function(params, statusDiv)
	{
		statusDiv.top_of_page_status('loading')
		this.fetch({ data: $.param(params), success: function(){statusDiv.top_of_page_status('clear')} });
	}
};




ActionTable.Header = function()
{
	var self = this;
	self.headers = {};
	self.headersView = {};
	self.Header = Backbone.Model.extend({
		selected : false,
		dir      : 1
	});
	self.Headers = Backbone.Collection.extend({ 
		model : self.Header, 
		remove_all_sorting_status : function(){
			this.reset(this.models)
		} 
	});
	self.init = function( targetView, headers){

		if (!this.thead) this.thead = $('<thead></thead>').insertBefore(targetView.tbody);
		if(!this.tr) this.tr = $('<tr></tr>').appendTo(this.thead);
		self.headers = new self.Headers(headers);
		self.headersView = new self.HeadersView({
			el: self.tr,
			collection : self.headers,
			targetView : targetView
		});
	}
	
	/////////////////////////////
	//
	// Views
	//
	/////////////////////////////
	
	
	self.HeadersView = Backbone.View.extend({
		initialize: function(){
			_.bindAll(this,'render','appendItem');
			this.collection.bind('add',this.appendItem);
			this.collection.bind('reset',this.render);
			this.collection.bind('change',this.render);
			this.render();
			
		},
		render: function(){
			var thisView = this;
			$(this.el).html('');
			_(this.collection.models).each(function(header){
				this.appendItem(header);
			}, this)
		},
		appendItem : function(header)
		{
			var view = this;
			var headerView = new self.HeaderView({
				model : header,
				targetView : this.options.targetView
			});
	
			$(this.el).append(headerView.render().el);
		}
	});
	self.HeaderView = Backbone.View.extend({
		template : "<span class=''>{{name}}</span>",
		tagName : 'th',
		initialize : function()
		{
			_.bindAll(this,'render','unrender','remove');
			//this.model.bind('change', this.render);
			this.model.bind('remove',this.unrender);
		},
		events : 
		{
			'click' : 'action'
		},
		action : function(){
			var current_selection = _.filter(this.model.collection.models, function(header){ return (header.get('selected') == true && header != this.model) ; }, this);
			if (!this.model.get('selected'))
			{
				this.model.set({ selected: true, dir : 1});
				 
			} else {
				this.model.set({ dir : this.model.get('dir')*-1});
			}
			for (var i=0 ; i < current_selection.length; i++)
			{
				current_selection[i].set({selected:false})
			}
			
			if (this.model.get('numeric'))
			{
				this.options.targetView.numericalSort(this.model.get('sort'), this.model.get('dir'))
			} else {
				this.options.targetView.alphabeticalSort(this.model.get('sort'), this.model.get('dir'))

			}
		},
		render: function()
		{
			var el = $(this.el);
			el.html('');
			if(this.model.get('sort')) {
				el.addClass('action_table_sortable');
				if (this.model.get('selected'))
				{
					el.addClass((this.model.get('dir') > 0) ? 'sorting_asc' : 'sorting_desc');
				}
			}
			var header_link = $(Mustache.to_html(this.template, this.model.attributes)).appendTo(this.el);
			
			return this
			
			
			
		},
		
		
		unrender: function()
		{
			var el = $(this.el);
			el.fadeOut('fast', function(){el.remove()});
		},
		
		remove: function()
		{
			this.model.destroy();
		}
	});

};

///////////////////////////
//                       //
//    -- Paginator --    //
//                       //
///////////////////////////

ActionTable.Paginate = function(){
	var self = this;
	self.pages ={};
	self.pagesView = {};
	self.init = function(el,targetView)
	{
		if (!this.paginate_area) this.paginate_area = $('<div class="action_table_tool pagination" ></div>').appendTo(el);
		if (!this.paginate_ul) this.paginate_ul = $('<ul class="paginate_ul"></ul>').appendTo(this.paginate_area);
		self.pages = new self.Pages([]);
		self.pagesView = new self.PagesView(
			{
				el : self.paginate_ul,
				collection : self.pages,
				targetView : targetView
			}
		);
		return self;
	};
	self.update = function(target_info)
	{
		var page_data= [];
		for (var i = 1; i<= target_info.totalPages; i++)
		{
			var page = {
				name : i,
				action : function(i)
				{
					self.pagesView.options.targetView.goTo(i)
				}
			}
			if (target_info.page == (i)) page.selected = true;
			page_data.push(page);
		}
		self.pages.reset(page_data);
	};
	
	/////////////////////////////
	//
	// Models and Collections
	//
	/////////////////////////////
	
	self.Page = Backbone.Model.extend({
		attributes: { selected : false }
	});
	
	self.Pages = Backbone.Collection.extend({
		model : self.Page
	});
	
	
	/////////////////////////////
	//
	// Views
	//
	/////////////////////////////
	
	
	self.PagesView = Backbone.View.extend({
		initialize: function(){
			_.bindAll(this,'render','appendItem');
			this.collection.bind('add',this.appendItem);
			this.collection.bind('reset',this.render);
			this.collection.bind('change',this.render);
			this.render();
			
		},
		render: function(){
			var thisView = this;
			$(this.el).html('');
			_(this.collection.models).each(function(page){
				this.appendItem(page);
			}, this)
			var target_info = this.options.targetView.info();
			if(this.collection.models.length > 1) 
			{
				$('<li><a href="#">Prev</a></li>').click(function(){
					if (target_info.page != 1) thisView.options.targetView.goTo(target_info.page - 1)
				}).prependTo($(this.el));
				$('<li><a href="#">Next</a></li>').click(function(){
					if (target_info.page != target_info.lastPage) thisView.options.targetView.goTo(target_info.page + 1)
				}).appendTo($(this.el));
			}
			
			if(target_info.page < target_info.totalPages - 6 )  $('<li class="disabled"><a href="#">...</a></li>').insertBefore($(this.el).find('li.last_page'))
			if(target_info.page > 5 )  $('<li class="disabled"><a href="#">...</a></li>').insertAfter($(this.el).find('li.first_page'))
			
		},
		appendItem : function(page)
		{
			var view = this;
			var pageView = new self.PageView({
				model : page,
				targetView : this.options.targetView
			});
	
			$(this.el).append(pageView.render().el);
		}
	});
	self.PageView = Backbone.View.extend({
		template : "<span class='action_table_page_link'><a href='#'>{{name}}</a></span>",
		tagName : 'li',
		initialize : function()
		{
			_.bindAll(this,'render','unrender','remove');
			//this.model.bind('change', this.render);
			this.model.bind('remove',this.unrender);
		},
		events : 
		{
			'click' : 'toggle_selection'
		},
		toggle_selection : function(e)
		{
			this.model.attributes.action(this.model.attributes.name);
		},
		render: function()
		{
			var el = $(this.el);
			el.html('');
			if (this.model.collection.models.length > 10) {
				var index = _.indexOf(this.model.collection.models,this.model);
				
				////////////////////////
				//
				// fix this
				var current_page = 1;
				////////////////////////
				
				if (
					index == 0 || 
					(current_page < 5 && index < 10 ) ||
					Math.abs(index - current_page )< 5 || 
					(index == this.model.collection.models.length ) ||
					(current_page > this.model.collection.models.length - 5 && index > this.model.collection.models.length - 12) 
				){
					var page_link = $(Mustache.to_html(this.template, this.model.attributes)).appendTo(this.el);
					if (this.model.attributes.selected) 
					{
						page_link.addClass('active');
					}
					else
					{
						page_link.removeClass('active');
					}
					if(index == 0) $(this.el).addClass('first_page');
					if(index == (this.model.collection.length -1)) $(this.el).addClass('last_page')
					 return this;
				} else
				{
					
					return false;
				}
				
			} else {
				var page_link = $(Mustache.to_html(this.template, this.model.attributes)).appendTo(this.el);
				if (this.model.attributes.selected) 
				{
					page_link.addClass('active');
				}
				else
				{
					page_link.removeClass('active');
				}
				return this
			}
			
			
		},
		
		
		unrender: function()
		{
			var el = $(this.el);
			el.fadeOut('fast', function(){el.remove()});
		},
		
		remove: function()
		{
			this.model.destroy();
		}
	});
};

ActionTable.Collections = {};
ActionTable.Collections.FilteredRow = Backbone.Model.extend({});
ActionTable.Collections.FilteredRows = Backbone.Collection.extend({
	model : ActionTable.Collections.FilteredRow
});


ActionTable.RowsView = {
	initialize: function(){ 
		_.bindAll(this,'render','appendItem');
		this.tbody = $('<tbody></tbody>').appendTo($(this.el));
		this.collection.bind('add',this.appendItem);
		this.collection.bind('change',this.render);
		this.collection.bind('reset',this.render);
		this.collection.bind('sort',this.sort);
		this.paginator_ui = new ActionTable.Paginate();
		this.paginator_ui.init($('#paginate'),this);
		this.fetch_collection();
	},
	fetch_collection : function()
	{
		this.collection.paramed_fetch(this.options.fetch_params, this.options.statusDiv)
	},
	filteredRows : new ActionTable.Collections.FilteredRows([]),
	resetFilteredRows : function(){
		this.filteredRows.reset(this.collection._filter());
		
	},
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
	},
	paginator_ui : null,
	render: function(page){
		this.tbody.html('');
		this.resetFilteredRows();
		if(typeof(page) == 'number') {
			this.cParams.page = page;
		} 
		this.pager().each(function(row){
			this.appendItem(row);
		}, this)
		if (this.paginator_ui) {
			this.paginator_ui.update(this.info());
		} 
		this.tbody.find("tr:odd").css("background-color", "#f5f5f5");
	},
	
	cParams : {
		// how many items to show per page in the view?
		perPage : 10,
		// page to start off on for pagination in the view?
		page : 1,
		// sort field
		sortField: 'text',
		// sort direction
		sortDirection: 'asc'
	},
	
	goTo : function (page) {
		this.cParams.page = parseInt(page,10);
		this.render();
	},
	goToFirstPage : function()
	{
		this.cParams.page = 1;
	},

	alphabeticalSort : function(attribute, dir)
	{
		if(typeof(dir) != 'number')
		{
			dir = 1;
		}
		//var th = $(this);
		
		
		this.collection.comparator = function(a,b) 
		{
			a.sort = true;
			b.sort = true;
			if( (String(a.attributes[attribute]).toLowerCase()) > (String(b.attributes[attribute]).toLowerCase())){
				return dir*1;
			} else if ( (String(a.attributes[attribute]).toLowerCase()) < (String(b.attributes[attribute]).toLowerCase())) {
				return dir*-1;
			} else {
				return 0;
			}
		};
		this.collection.sort({silent:true});
		this.goTo(1);
		this.render();
	},
	numericalSort : function(attribute,dir)
	{
		if(typeof(dir) != 'number')
		{
			dir = 1;
		}
		function getAttributes(model, attributes)
		{
			if (_.isArray(attributes)) {
				var attr = model.get(attributes[0]);
				for (var a = 1; a < attributes.length; a++)
				{
					attr = attr[attributes[a]] 
				}
				return attr
			} else if(_.isString(attributes)) {
				return model.get(attributes)
			}
		}
		this.collection.comparator = function(a,b) 
		{
			a.sort = true;
			b.sort = true;
			if( (parseInt(getAttributes(a,attribute))) > (parseInt(getAttributes(b,attribute)))){
				return dir*1;
			} else if( (parseInt(getAttributes(a,attribute))) < (parseInt(getAttributes(b,attribute)))) {
				return dir*-1;
			} else {
				return 0;
			}
			
		};
		this.collection.sort({silent:true});
		this.goTo(1);
		this.render();
	},
	pager : function (sort, direction) {
		var self = this,
			start = (self.cParams.page-1)*this.cParams.perPage,
			stop  = start+self.cParams.perPage;

		
		if (sort) {
			this.filteredRows.comparator = this.alphabeticalSort()
			
			//this.filteredRows = self._sort(this.philtered_array, sort, direction);
		}

		return _(this.filteredRows.toArray().slice(start,stop))
	},

	info : function () {

		var self = this,
			info = {},
			totalRecords = this.filteredRows.size(),
			totalPages = Math.ceil(totalRecords/self.cParams.perPage);
		info = {
			totalRecords  : totalRecords,
			page          : self.cParams.page,
			perPage       : self.cParams.perPage,
			totalPages    : totalPages,
			lastPage      : totalPages,
			lastPagem1    : totalPages-1,
			previous      : false,
			next          : false,
			startRecord   : (self.cParams.page - 1) * self.cParams.perPage + 1,
			endRecord     : Math.min(totalRecords, self.cParams.page * self.cParams.perPage)
		};

		if (self.page > 1) {
			info.prev = self.cParams.page - 1;
		}

		if (self.page < info.totalPages) {
			info.next = self.cParams.page + 1;
		}



		self.information = info;

		
		return info;
	}


	
};


ActionTable.RowView = {
	
	initialize : function()
	{
		_.bindAll(this,'render','unrender','remove');
		this.bind('remove',this.unrender);
		this.model.bind('save', this.render)
	},
	update_successful : function()
	{
	},
	render: function()
	{
		var el = $(this.el);
		el.html('');
		var tr = $(Mustache.to_html(this.template, {attr : this.model.toJSON(), check_status : (this.model.attributes.auto_approve) ? "checked=checked" : ''})).appendTo(this.el);
		tr.find('input.checkbox').prop("checked",this.model.attributes.auto_approve);
		if(this.rowFunction) { this.rowFunction();}
		return this
	},
	unrender: function()
	{
		var el = $(this.el);
		el.fadeOut('fast', function(){
			el.remove()
		});
	},
	remove: function()
	{
		this.model.destroy();
	}
};




