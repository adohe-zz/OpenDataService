/*jslint browser: true*/
/*global $, jQuery, alert*/

$(function () {
    'use strict';
    
    $('#new-entity').click(function () {
        var entityPro = $('#project').val(),
            entityName = $('#entity-name').val(),
            entityDB = $('#source-db').val(),
            entityTable = $('#source-table').val(),
            entityCache = $('input[name="cache"][checked]').val();
        
        if (entityPro === 'Default') {
            $('#project').focus();
        }
        if (entityName === '') {
            $('#entity-name').focus();
        }
        if (entityDB === '') {
            $('#source-db').focus();
        }
        if (entityTable === '') {
            $('#source-table').focus();
        }
    });
});