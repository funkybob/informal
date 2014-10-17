
/*
 * Date filters and validators
 */

(function () {

    $.extend(informal.filters, {
        as_date: function (val, $field) {
            var format = $field.data('datefmt');
            return moment(val, format, true);
        }

    });

    $.extend(informal.validators, {

        past_date: function (val) {
            // bail early if blank
            if(!val) { return; }

            // and is in the future:
            if( val.isAfter( moment() )) {
                return 'Date must be in the past';
            }
        },

        future_date: function (val) {
            // bail early if blank
            if(!val) { return; }

            // and is in the future:
            if( val.isBefore( moment() )) {
                return 'Date must be in the future';
            }
        },

    };

});
