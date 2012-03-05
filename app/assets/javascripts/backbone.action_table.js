
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
	}
};

ActionTable.RowsView = {
	
	initialize: function(){ 
		_.bindAll(this,'render','appendItem');
		this.header = $(Mustache.to_html("<thead><th>Name</th><th>Site</th><th>Auto-approve</th></thead>", {})).appendTo(this.el);
		this.tbody = $('<tbody></tbody>').appendTo($(this.el));
		this.collection.bind('add',this.appendItem);
		this.collection.bind('change',this.render);
		this.collection.bind('reset',this.render);
		this.collection.bind('sort',this.sort)
		this.render();
	},
	philtered_array : [],
	render: function(){
		this.tbody.html('');
		this.philtered_array = this.collection.philter();
		this.pager(this.philtered_array).each(function(row){
			this.appendItem(row);
		}, this)
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
	
	nextPage : function () {
		this.cParams.page = ++this.cParams.page;
		//this.pager();
		this.render();
	},

	previousPage : function () {
		this.cParams.page = --this.cParams.page || 1;
		//this.pager();
		this.render();
	},

	goTo : function (page) {
		this.cParams.page = parseInt(page,10);
		///this.pager();
		this.render();
	},

	howManyPer : function (perPage) {
		this.cParams.page = 1;
		this.cParams.perPage = perPage;
		//this.pager();
		this.render();
	},


	// where column is the key to sort on
	setSort : function (column, direction) {
		this.pager(column, direction);
	},

	pager : function (sort, direction) {
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
		var self = this,
			info = {},
			totalRecords = this.philtered_array.length,
			totalPages = Math.ceil(totalRecords/self.perPage);

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
		console.log('succeed in updating')
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
		console.log(this.model.get('name') + ' is in unrender')
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

ActionTable.Paginate = {
	Views : {},
	init : function(targetView)
	{
		if (!this.paginate_area) this.paginate_area = $('<div class="action_table_tool pagination" ></div>').insertAfter(targetView.el);
		if (!this.paginate_ul) this.paginate_ul = $('<ul class="paginate_ul"></ul>').appendTo(this.paginate_area);
		
		if (targetView.information.totalPages < 2) {
			self.action_table('single_page');
		} else {
		
			var current_page = targetView.information.page;
			var page_data= [];
			for (var i = 1; i<= targetView.information.totalPages; i++)
			{
				var page = {
					name : i,
					action : function(i)
					{
						targetView.goTo(i)
						//self.action_table('move_to_page', i)
					}
				}
				if (current_page == (i)) page.selected = true;
				page_data.push(page);
			}
			
			this.pages = new PageCollection(page_data);
			this.pagesview = new ActionTable.Paginate.Views.Pages(
 				{
 					el : this.paginate_ul,
 					collection : this.pages,
 					targetView : targetView
 				}
 			);
		}
		//$(self.data('header_checkbox')).prop('checked', false)
	}
};
/*
	single_page : function()
	{
		this.data('pages').reset();
	},
	move_to_page : function(page_number)
	{
		var self = this;
		return this.each(function(){
			self.data('settings')['selection_params']['page_offset'] =  (self.data('settings')['selection_params']['page_limit'] * (page_number-1))

			if(self.data('settings')['server_side_processing']){
				self.action_table('fetch_data');
			} else {
	 			 
				 _.filter(self.data('pages').models, function(page){  page.set({selected: false},{silent:true}) });
				self.data('pages').models[page_number-1].set({selected: true}, {silent:true});
				self.data('pages').reset(self.data('pages').models);
				self.data('rows').reset(self.data('rows').models);
			}
		});
	},
	current_page : function()
	{
		var self = this;
		return (Math.ceil(self.data('settings')['selection_params']['page_offset']/self.data('settings')['selection_params']['page_limit'])) + 1
	
	},
	*/
ActionTable.Paginate.Views.Pages = Backbone.View.extend({
	initialize: function(){
		_.bindAll(this,'render','appendItem');
		this.collection.bind('add',this.appendItem);
		this.collection.bind('reset',this.render);
		this.collection.bind('change',this.render);
		this.render();
	},
	render: function(){
		$(this.el).html('');
		
		_(this.collection.models).each(function(page){
			this.appendItem(page);
		}, this)
		
		if(this.targetView.philtered_array.length > 1) 
		{
			$('<li><a href="#">Prev</a></li>').click(function(){
				if (this.targetView.information.page != 1) this.targetView.goTo(page - 1)
			}).prependTo($(this.el));
			$('<li><a href="#">Next</a></li>').click(function(){
				if (this.targetView.information.page != 1) this.targetView.goTo(page + 1)
			}).appendTo($(this.el));
		}
		
		if(this.targetView.information.page < this.targetView.information.totalPages - 6 )  $('<li class="disabled"><a href="#">...</a></li>').insertBefore($(this.el).find('li.last_page'))
		if(this.targetView.information.page > 5 )  $('<li class="disabled"><a href="#">...</a></li>').insertAfter($(this.el).find('li.first_page'))
		
	},
	appendItem : function(page)
	{
		var view = this;
		var pageView = new ActionTable.Paginate.Views.Page({
			model : page
		});

		$(this.el).append(this.render().el);
	}
});

ActionTable.Paginate.Views.Page = Backbone.View.extend({
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