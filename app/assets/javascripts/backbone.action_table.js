
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
	render: function(){
		this.tbody.html('');
		this.pager(this.collection.philter()).each(function(row){
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
	/*pager : function (philtered_array) {
		var self = this,
			start = (self.cParams.page-1)*this.cParams.perPage,
			stop  = start+self.cParams.perPage;
		console.log('in pager')
		return _(philtered_array.slice(start, stop))
	},*/
	
	nextPage : function () {
			this.cParams.page = ++this.cParams.page;
		this.pager();
	},

	previousPage : function () {
		this.cParams.page = --this.cParams.page || 1;
		this.pager();
	},

	goTo : function (page) {
		this.cParams.page = parseInt(page,10);
		this.pager();
	},

	howManyPer : function (perPage) {
		this.cParams.page = 1;
		this.cParams.perPage = perPage;
		this.pager();
	},


	// where column is the key to sort on
	setSort : function (column, direction) {
		this.pager(column, direction);
	},

	pager : function (philtered_array, sort, direction) {
		var self = this,
			start = (self.cParams.page-1)*this.cParams.perPage,
			stop  = start+self.cParams.perPage;

		
		if (sort) {
			philtered_array = self._sort(philtered_array, sort, direction);
		}

		return _(philtered_array.slice(start,stop))
	},

	_sort : function (philtered_array, sort, direction) {
		philtered_array = philtered_array.sort(function(a,b) {
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

		return philtered_array;
	},

	info : function (philtered_array) {
		var self = this,
			info = {},
			totalRecords = philtered_array.length,
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

ActionTable.clientPagination = Backbone.View.extend({

		events : {
			'click a.first'        		: 'gotoFirst',
			'click a.prev'         		: 'gotoPrev',
			'click a.next'        		: 'gotoNext',
			'click a.last'         		: 'gotoLast',
			'click a.page'         		: 'gotoPage',
			'click .howmany a'     		: 'changeCount',
			'click a.sortAsc' 			: 'sortByAscending',
			'click a.sortDsc'			: 'sortByDescending'
		},

		tagName : 'aside',

		initialize : function () {
			this.collection.bind('reset', this.render, this);
			this.collection.bind('change', this.render, this);
			this.tmpl = _.template($('#tmpClientPagination').html());
			$(this.el).appendTo('#pagination');

		},
		render : function () {
			var html = this.tmpl(this.view.info());
			$(this.el).html(html);
		},

		gotoFirst : function (e) {
			e.preventDefault();
			this.view.goTo(1);
		},

		gotoPrev : function (e) {
			e.preventDefault();
			this.view.previousPage();
		},

		gotoNext : function (e) {
			e.preventDefault();
			this.view.nextPage();
		},

		gotoLast : function (e) {
			e.preventDefault();
			this.view.goTo(this.view.information.lastPage);
		},

		gotoPage : function (e) {
			e.preventDefault();
			var page = $(e.target).text();
			this.view.goTo(page);
		},

		changeCount : function (e) {
			e.preventDefault();
			var per = $(e.target).text();
			this.view.howManyPer(per);
		},

		sortByAscending: function(e){
		    e.preventDefault();
		    var currentSort = this.getSortOption();
			this.view.pager(currentSort, 'asc');
			//this.preserveSortOption(currentSort);

		},
/*
		getSortOption: function(){
			var sel = $('#sortByOption').val();
			return sel;	
		},

		preserveSortOption: function(option){
			$('#sortByOption').val(option);
		},
*/
		sortByDescending: function(e){
			e.preventDefault();
		    var currentSort = this.getSortOption();
			this.view.pager(currentSort, 'desc');
			//this.preserveSortOption(currentSort);
		}
	});
