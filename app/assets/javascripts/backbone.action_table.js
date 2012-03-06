/*
 * 
 * Notes to self: 
 * 
 *   - Seems like the page count reset is best done by updating the cParams.page in the RowsView
 *   - Consider doing a slice for the viewable page numbers as well
 *  
 * 
 */



var ActionTable = {};

ActionTable.Row = {
	saveStrip : function(options)
	{
		this.save({success: options.success});
	},
};

ActionTable.Rows = {
	philter : function()
	{
		return _(this.models);
	},
	_filter : function()
	{
		return this.models
	}
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
		console.log('paginate init')
		if (!this.paginate_area) this.paginate_area = $('<div class="action_table_tool pagination" ></div>').appendTo(el);
		if (!this.paginate_ul) this.paginate_ul = $('<ul class="paginate_ul"></ul>').appendTo(this.paginate_area);
		var page_data= [];
		self.pages = new self.Pages(page_data);
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
		console.log('in paginate update');
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
			console.log('in pages view render');
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
			console.log('in pages view append item')
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
			console.log('in page view init')
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
			console.log('in page view render')
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
		console.log('in rowsview init')
		_.bindAll(this,'render','appendItem');
		this.header = $(Mustache.to_html("<thead><th>Name</th><th>Site</th><th>Auto-approve</th></thead>", {})).appendTo(this.el);
		this.tbody = $('<tbody></tbody>').appendTo($(this.el));
		this.collection.bind('add',this.appendItem);
		this.collection.bind('change',this.render);
		this.collection.bind('reset',this.render);
		this.collection.bind('sort',this.sort);
		this.render();
		this.paginator_ui = new ActionTable.Paginate();
		this.paginator_ui.init($('#paginate'),this);
	},
	filteredRows : new ActionTable.Collections.FilteredRows([]),
	resetFilteredRows : function(){
		this.filteredRows.reset(this.collection._filter());
	},
	tester : function(){
		console.log('TESTTESTESTTESTSETSTSE')
	},
	philtered_array : [],
	paginator_ui : null,
	render: function(){
		this.tbody.html('');
		this.philtered_array = this.collection.philter();
		this.resetFilteredRows();
		console.log('in ActionTable.RowsView render, filteredRows is ');
		console.log(this.filteredRows);
		this.pager().each(function(row){
			this.appendItem(row);
		}, this)
		if (this.paginator_ui) {
			this.paginator_ui.update(this.info());
		} 
	},
	
	cParams : {
		// how many items to show per page in the view?
		perPage : 5,
		// page to start off on for pagination in the view?
		page : 1,
		// sort field
		sortField: 'text',
		// sort direction
		sortDirection: 'asc'
	},
	
	goTo : function (page) {
		this.cParams.page = parseInt(page,10);
		///this.pager();
		this.render();
	},

	// where column is the key to sort on
	setSort : function (column, direction) {
		this.pager(column, direction);
	},

	pager : function (sort, direction) {
		console.log('pager called')
		var self = this,
			start = (self.cParams.page-1)*this.cParams.perPage,
			stop  = start+self.cParams.perPage;

		
		if (sort) {
			this.philtered_array = self._sort(this.philtered_array, sort, direction);
		}


		return _(this.philtered_array.slice(start,stop))
	},

	_sort : function (sort, direction) {
		
		this.philtered_array = this.philtered_array.sort(function(a,b) {
			var a = a.get(sort),
				b = b.get(sort);

			if (direction === 'desc') {
				if (a > b) {
					return -1;
				}

				if (a < b) {
					return 1;
				}
			}
			else {
				if (a < b) {
					return -1;
				}

				if (a > b) {
					return 1;
				}
			}

			return 0;
		});

		return this.philtered_array;
	},
	info : function () {
		console.log(' inActionTable.Views.RowsView.info()')

		var self = this,
			info = {},
			totalRecords = this.philtered_array.size(),
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
			page_set      : [],
			startRecord   : (self.cParams.page - 1) * self.cParams.perPage + 1,
			endRecord     : Math.min(totalRecords, self.cParams.page * self.cParams.perPage)
		};

		if (self.page > 1) {
			info.prev = self.cParams.page - 1;
		}

		if (self.page < info.totalPages) {
			info.next = self.cParams.page + 1;
		}

		info.pageSet = self.setPagination(info);

		self.information = info;

		
		return info;
	},


	setPagination : function (info) {
		var pages = [];


		// How many adjacent pages should be shown on each side?
		var ADJACENT = 3;
		var ADJACENTx2 = ADJACENT*2;
		var LASTPAGE = Math.ceil(info.totalRecords/info.perPage);
		var LPM1 = -1;

		if (LASTPAGE > 1) {
			// not enough pages to bother breaking it up
			if (LASTPAGE < (7 + ADJACENTx2)) {
				for (var i=1,l=LASTPAGE; i <= l; i++) {
					pages.push(i);
				}
			}
			// enough pages to hide some
			else if (LASTPAGE > (5 + ADJACENTx2)) {

				//close to beginning; only hide later pages
				if (info.page < (1 + ADJACENTx2)) {
					for (var i=1, l=4+ADJACENTx2; i < l; i++) {
						pages.push(i);				
					}
				}

				// in middle; hide some front and some back
				else if(LASTPAGE - ADJACENTx2 > info.page && info.page > ADJACENTx2) {
					for (var i = info.page - ADJACENT; i <= info.page + ADJACENT; i++) {
						pages.push(i);				
					}	
				}
				// close to end; only hide early pages
				else{
					for (var i = LASTPAGE - (2 + ADJACENTx2); i <= LASTPAGE; i++) {
						pages.push(i);					
					}
				}
			}
		}

		return pages;
	}
};


ActionTable.RowView = {
	
	
	update_successful : function()
	{
		console.log(this.model)
	},
	render: function()
	{
		var el = $(this.el);
		el.html('');
		var tr = $(Mustache.to_html(this.template, {attr : this.model.toJSON(), check_status : (this.model.attributes.auto_approve) ? "checked=checked" : ''})).appendTo(this.el);
		tr.find('input.checkbox').prop("checked",this.model.attributes.auto_approve);
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







/*
},
	pageview : function(args)
	{
		var self = this;
		
		var View = Backbone.View.extend({
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
				if (self.data('pages').models.length > 10) {
					var index = _.indexOf(self.data('pages').models,args.model);
					var current_page = self.action_table('current_page');

					if (
						index == 0 || 
						(current_page < 5 && index < 10 ) ||
						Math.abs(index - current_page )< 5 || 
						(index == self.data('pages').models.length - 1) ||
						(current_page > self.data('pages').models.length - 5 && index > self.data('pages').models.length - 12) 
					){
						var page_link = $(Mustache.to_html(self.data('settings')['page_link_template'], args.model.attributes)).appendTo(this.el);
						if (args.model.attributes.selected) 
						{
							page_link.addClass('active');
						}
						else
						{
							page_link.removeClass('active');
						}
						if(index == 0) $(this.el).addClass('first_page');
						if(index == (self.data('pages').length -1)) $(this.el).addClass('last_page')
						 return this;
					} else
					{
						
						return false;
					}
					
				} else {
					var page_link = $(Mustache.to_html(self.data('settings')['page_link_template'], args.model.attributes)).appendTo(this.el);
					if (args.model.attributes.selected) 
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
		return new View(args);
	},
	reset_page_numbers : function()
	{
		var self = this;
		return this.each(function(){
			self.data('settings')['selection_params']['page_offset'] = 0
			
		})
	}
};
*/