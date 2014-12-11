(function($){
   
    'use strict'; 
         
    $.googlemappoints = function(element, options) 
    {
        var defaults = 
        {
            
            form_id                    : '',
            bottom_right_id            : '',
            top_left_id                : '',
            modal_id                   : '',
            error_message              : '',
            ajax_url_get_user_location : '',
            ajax_url_get_modal         : '',
            default_latitude           : '',
            default_longitude          : '',
            zoom                       : '',
            icon                       : ''
            
        };
        
        var plugin = this;
        
        
        plugin.settings = {};

        //This is the google maps element
        var $element = $(element), // reference to the jQuery version of DOM element
             element = element;    // reference to the actual DOM element

        plugin.form = null;//This is the form element that is sent
        plugin.bottom_right = null; //This is the hidden input used to store the bottom right 
        plugin.top_left = null; //This is the hidden input used to store the top right 
        plugin.userlatitude = null;//This the user latitude
        plugin.userlongitude = null;//This is the user longitude
        plugin.center = null;//This is google maps point 
        plugin.map = null;//This is the map element
        plugin.points = [];//These are the points on the map
        plugin.usedSearchForm = false;//This means they are only moving the map if false

        /**
         * Makes the ajax call to populate map
         * @returns {undefined}
         */
        plugin.getPoints = function()
        {
            plugin.form.ajaxSubmit({
               success: function(data)
               {
                                      
                   if(data.success === true)
                   {
                       var project_ids = [];
                       
                        for(var i = 0; i < data.points.length; i += 1)
                        {
                            var longitude = data.points[i].longitude;
                            var latitude = data.points[i].latitude;
                            var project_id = data.points[i].project_id;
                            var marker_config = {};
                            
                            marker_config.position = new google.maps.LatLng(latitude, longitude);
                            marker_config.map = plugin.map;
                             
                            if(plugin.settings.icon !== '')
                            {
                                 marker_config.icon = plugin.settings.icon;
                            }
                            
                            project_ids[project_id] = true;
                                                         
                            if(typeof plugin.points[project_id] === 'undefined' || plugin.points[project_id] === null)
                            {
                               plugin.points[project_id] = new google.maps.Marker(marker_config);
                               plugin.points[project_id].project_id = project_id;
                               plugin.points[project_id].addListener('click', function(){
                                   getModal(this.project_id);
                               });                               
                            }
                        }
                        
                        
                        if(plugin.usedSearchForm)
                        {
                            for(var project_id in plugin.points)
                            {
                                if(typeof project_ids[project_id] === 'undefined')
                                {
                                    if(plugin.points[project_id] !== null && typeof plugin.points[project_id].setMap === 'function' )
                                    {
                                        plugin.points[project_id].setMap(null);
                                        plugin.points[project_id] = null;
                                    }
                                }
                            }
                        }
                        
                        plugin.usedSearchForm = false;

                        
                        
                   }
                   
               },
               error: function(e)
               {
               }
            });
        };
        
        
        
        
        
        var getModal = function(project_id)
        {
            var send = {'project_id' : project_id };
            $.ajax({
               url: plugin.settings.ajax_url_get_modal,
               data: send,
               type: 'POST',
               success: function(data)
               {
                   if(data.success === true)
                   {
                       $("#" + plugin.settings.modal_id).html(data.html);
                       $('#' + plugin.settings.modal_id).modal('show');
                   }
                   else
                   {
                       alert(plugin.settings.error_message);
                   }
               },
               error: function(e)
               {
                       alert(plugin.settings.error_message);                   
               }
            });
            
        };
        

        
        /**
         * This get all the current user location either by their profile or by their browser
         * @returns {undefined}
         */
        var getUserLocation = function()
        {
            $.ajax({
                url: plugin.settings.ajax_url_get_user_location,
                success: function(data)
                {
                    if(data.hasUserLocation === true && typeof data.latitude !== null && data.longitude !== null )
                    {
                        plugin.userlatitude = data.latitude;
                        plugin.userlongitude = data.longitude;
                        plugin.center = new google.maps.LatLng(plugin.userlatitude, plugin.userlongitude);
                        createMap();
                    }
                    else
                    {
                        plugin.center = new google.maps.LatLng(plugin.settings.default_latitude, plugin.settings.default_longitude); 
                        createMap();
                    }
                },
                error: function(e)
                {
                    plugin.center = new google.maps.LatLng(plugin.settings.default_latitude, plugin.settings.default_longitude); 
                    createMap();
                    
                }
            });
        };
        
        
        
        var createMap = function()
        {
            
            var mapOptions = 
                    {
                        zoom: plugin.settings.zoom,
                        center: plugin.center
                    };
            plugin.map = new google.maps.Map(element, mapOptions);
                        
            google.maps.event.addListener(plugin.map, "bounds_changed", function(){
                
                var southwest = plugin.map.getBounds().getSouthWest();
                var northeast = plugin.map.getBounds().getNorthEast();
                var top_left = northeast.lat() + ', ' + southwest.lng();
                var bottom_right = southwest.lat() + ', ' +northeast.lng();
                plugin.bottom_right.val(bottom_right);
                plugin.top_left.val(top_left);
                plugin.getPoints();

                
            });
            
                        
            google.maps.event.addListener(plugin.map, "load", function(){
                
                var southwest = plugin.map.getBounds().getSouthWest();
                var northeast = plugin.map.getBounds().getNorthEast();
                var top_left = northeast.lat() + ', ' + southwest.lng();
                var bottom_right = southwest.lat() + ', ' +northeast.lng();
                plugin.bottom_right.val(bottom_right);
                plugin.top_left.val(top_left);
                plugin.getPoints();

            });

        };
        
        

        plugin.init = function() 
        {
               plugin.settings = $.extend({}, defaults, options);
               if(
                  plugin.settings.form_id === "" ||
                  plugin.settings.bottom_right_id === "" ||
                  plugin.settings.top_left_id === "" ||
                  plugin.settings.modal_replacement_id === "" || 
                  plugin.settings.modal_id === ""  ||
                  plugin.settings.error_message === "" ||
                  plugin.settings.ajax_url_get_user_location === "" ||
                  plugin.settings.default_latitude === "" ||
                  plugin.settings.default_longitude === "" ||
                  plugin.settings.zoom === "" ||
                  plugin.settings.ajax_url_get_modal === ""
                 )
                {
                   throw "You don't have all the fields filled out";     
                }
                
                plugin.form = $("#" + plugin.settings.form_id);
                plugin.bottom_right = $("#" + plugin.settings.bottom_right_id);
                plugin.top_left = $("#" + plugin.settings.top_left_id);
                
                //This get the user location
                getUserLocation();
                
                
                $(document).on("submit", "#" + plugin.settings.form_id, function(){
                   plugin.usedSearchForm = true;
                   plugin.getPoints(); 
                   return false;
                });
                
                $("#" + plugin.settings.modal_id).on('hidden.bs.modal', function (e) {
                    $("#" + plugin.settings.modal_id).html("");
                  });
                

                
                
            
        };
         
         
        plugin.init();
         
    };
    
    
       // add the plugin to the jQuery.fn object
    $.fn.googlemappoints = function(options)
    {
        // iterate through the DOM elements we are attaching the plugin to
        return this.each(function()
        {
           
            // if plugin has not already been attached to the element
            if (undefined === $(this).data('googlemappoints')) 
            {
                                
                // create a new instance of the plugin
                // pass the DOM element and the user-provided options as arguments
                var plugin = new $.googlemappoints(this, options);

                // in the jQuery version of the element
                // store a reference to the plugin object
                // you can later access the plugin and its methods and properties like
                // element.data('pluginName').publicMethod(arg1, arg2, ... argn) or
                // element.data('pluginName').settings.propertyName
                $(this).data('googlemappoints', plugin);

            }
        });
        

    };
        
    
}(jQuery));
