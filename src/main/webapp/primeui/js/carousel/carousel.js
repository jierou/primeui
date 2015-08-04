/**
 * PrimeUI Carousel widget
 */
$(function() {

    $.widget("primeui.puicarousel", {
       
       options: {
           datasource: null,
            numVisible: 3,
            firstVisible: 0,
            headerText: null,
            footerText: null,
            effectDuration: 500,
            circular :false,
            breakpoint: 560,
            itemContent: null,
            responsive: false,
            autoplayInterval: 0,
            easing: 'easeInOutCirc'
        },
       
        _create: function() {
            this.id = this.element.attr('id');
            if(!this.id) {
                this.id = this.element.uniqueId().attr('id');
            }
            
            //create elements
            this.element.wrap('<div class="pui-carousel ui-widget ui-widget-content ui-corner-all"><div class="pui-carousel-viewport"></div></div>');
            this.container = this.element.parent().parent();
            this.element.addClass('pui-carousel-items');
            this.container.prepend('<div class="pui-carousel-header ui-widget-header"><div class="pui-carousel-header-title"></div></div>');
            
            //header
            this.header = this.container.children('.pui-carousel-header');
            this.header.append('<span class="pui-carousel-button pui-carousel-next-button ui-icon ui-icon-circle-triangle-e"></span>' + 
                                '<span class="pui-carousel-button pui-carousel-next-button ui-icon ui-icon-circle-triangle-w"></span>');
                
            if(this.options.headerText) {
                this.header.children('.pui-carousel-header-title').html(this.options.headerText);
            }
            
            //init
            if(this.options.datasource) {
                if($.isArray(this.options.datasource)) {
                    this._render(this.options.datasource);
                }
                else if($.type(this.options.datasource) === 'function') {
                    this.options.datasource.call(this, this._render);
                }
            }
        },
        
        _render: function(data) {
            this.data = data;
            this.viewport = this.element.parent();
            
            //render items
            for(var i = 0; i < data.length; i++) {
                var itemContent = this.options.itemContent.call(this, data[i]);
                if($.type(itemContent) === 'string')
                    this.element.append('<li class="pui-carousel-item ui-widget-content ui-corner-all">' + itemContent + '</li>');
                else {
                    this.element.append($('<li class="pui-carousel-item ui-widget-content ui-corner-all"></li>').wrapInner(itemContent));
                }
            }
            
            this.items = this.element.children('li');
            this.itemsCount = this.data.length;
            this.prevNav = this.header.children('.pui-carousel-prev-button');
            this.nextNav = this.header.children('.pui-carousel-next-button');
            this.pageLinks = this.header.find('> .pui-carousel-page-links > .ui-carousel-page-link');
            this.dropdown = this.header.children('.pui-carousel-dropdown');
            this.mobileDropdown = this.header.children('.pui-carousel-mobiledropdown');
            
            this.columns = this.options.numVisible;
            this.first = this.options.firstVisible;
            this.page = parseInt(this.first/this.columns);
            this.totalPages = Math.ceil(this.itemsCount/this.options.numVisible);
            
            this.bindEvents();

            if(this.options.responsive) {
                this.refreshDimensions();
            }
            else {
                this.calculateItemWidths(this.columns);
                this.container.width(this.element.width());
                this.updateNavigators();
            }        
        },
        
        calculateItemWidths: function() {
            var firstItem = this.items.eq(0);
            if(firstItem.length) {
                var itemFrameWidth = firstItem.outerWidth(true) - firstItem.width();    //sum of margin, border and padding
                this.items.width((this.viewport.innerWidth() - itemFrameWidth * this.columns) / this.columns);
            }
        },
    
        refreshDimensions: function() {
            var win = $(window);
            if(win.width() <= this.options.breakpoint) {
                this.columns = 1;
                this.calculateItemWidths(this.columns);
                this.totalPages = this.itemsCount;
                this.mobileDropdown.show();
                this.pageLinks.hide();
            }
            else {
                this.columns = this.options.numVisible;
                this.calculateItemWidths();
                this.totalPages = Math.ceil(this.itemsCount / this.options.numVisible);
                this.mobileDropdown.hide();
                this.pageLinks.show();
            }

            this.page = parseInt(this.first / this.columns);
            this.updateNavigators();
            this.element.css('left', (-1 * (this.viewport.innerWidth() * this.page)));
        },

        bindEvents: function() {
            var $this = this;

            this.prevNav.on('click', function() {
                if($this.page !== 0) {
                    $this.setPage($this.page - 1);
                }
                else if($this.options.circular) {
                    $this.setPage($this.totalPages - 1);
                }
            });

            this.nextNav.on('click', function() {
                var lastPage = ($this.page === ($this.totalPages - 1));

                if(!lastPage) {
                    $this.setPage($this.page + 1);
                }
                else if($this.options.circular) {
                    $this.setPage(0);
                }
            });

            this.element.swipe({
                swipe:function(event, direction) {
                    if(direction === 'left') {
                        if($this.page === ($this.totalPages - 1)) {
                            if($this.options.circular)
                                $this.setPage(0);
                        }
                        else {
                            $this.setPage($this.page + 1);
                        }
                    }
                    else if(direction === 'right') {
                        if($this.page === 0) {
                            if($this.options.circular)
                                $this.setPage($this.totalPages - 1);
                        }
                        else {
                            $this.setPage($this.page - 1);
                        }
                    }
                }
            });

            if(this.pageLinks.length) {
                this.pageLinks.on('click', function(e) {
                    $this.setPage($(this).index());
                    e.preventDefault();
                });
            }

            this.header.children('select').on('change', function() {
                $this.setPage(parseInt($(this).val()) - 1);
            });

            if(this.options.autoplayInterval) {
                this.options.circular = true;
                this.startAutoplay();
            }

            if(this.options.responsive) {
                var resizeNS = 'resize.' + this.id;
                $(window).off(resizeNS).on(resizeNS, function() {
                    $this.refreshDimensions();
                });
            }
        },

        updateNavigators: function() {
            if(!this.options.circular) {
                if(this.page === 0) {
                    this.prevNav.addClass('ui-state-disabled');
                    this.nextNav.removeClass('ui-state-disabled');   
                }
                else if(this.page === (this.totalPages - 1)) {
                    this.prevNav.removeClass('ui-state-disabled');
                    this.nextNav.addClass('ui-state-disabled');
                }
                else {
                    this.prevNav.removeClass('ui-state-disabled');
                    this.nextNav.removeClass('ui-state-disabled');   
                }
            }

            if(this.pageLinks.length) {
                this.pageLinks.filter('.ui-icon-radio-on').removeClass('ui-icon-radio-on');
                this.pageLinks.eq(this.page).addClass('ui-icon-radio-on');
            }

            if(this.dropdown.length) {
                this.dropdown.val(this.page + 1);
            }

            if(this.mobileDropdown.length) {
                this.mobileDropdown.val(this.page + 1);
            }
        },

        setPage: function(p) {      
            if(p !== this.page && !this.element.is(':animated')) {
                var $this = this;

                this.element.animate({
                    left: -1 * (this.viewport.innerWidth() * p)
                    ,easing: this.options.easing
                }, 
                {
                    duration: this.options.effectDuration,
                    easing: this.options.easing,
                    complete: function() {
                        $this.page = p;
                        $this.first = $this.page * $this.columns;
                        $this.updateNavigators();
                    }
                });
            }
        },

        startAutoplay: function() {
            var $this = this;

            this.interval = setInterval(function() {
                if($this.page === ($this.totalPages - 1))
                    $this.setPage(0);
                else
                    $this.setPage($this.page + 1);
            }, this.options.autoplayInterval);
        },

        stopAutoplay: function() {
            clearInterval(this.interval);
        },
        
        _destroy: function() {

        }

        
    });
    
});