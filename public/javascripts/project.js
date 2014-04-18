/*jslint browser: true*/
/*global $, jQuery, alert*/

$(function () {
    
    // Project select event
    'use strict';
    $('#project').change(function () {
        
        var checkValue = $('#project').val();
        
        if (checkValue === 'new_project') {
            // Open the new project dialog
            $('#project_modal').modal('toggle');
        }
    });
});