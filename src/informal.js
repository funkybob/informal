
/*
 * Generic form validation
 *
 * Applies value filters and validators to fields on a form.
 * Fields annotated with a data-validators or marked required will be tested.
 *
 * Decorate inputs using:
 *      data-validators="list, of, validators"
 *      data-filters="list,of,filters"
 *
 * Returns:
 *  Object with:
 *    valid : bool that is True IFF no validator returned an error.
 *    values: Object of values of all fields.
 *    errors: Object of lists of field errors.
 */

var informal = (function() {
    var informal;

    /**
     * Filters mutate values.
     */
    informal.filters = {

        /**
         * Filter to convert value to an integer
         */
        as_integer: function (val) {
            return parseInt(val, 10);
        },

        /**
         * Filter to convert value to a float
         */
        as_float: function (val) {
            return parseFloat(val);
        }

    };

    /**
     * Validator functions test values, and return the message to display.
     */
    informal.validators = {
        /**
         * Indicates the field must have a value.
         */
        required: function (val) {
            if (!val) { return 'This value is required.'; }
        },

        /**
         * Loose validation the value looks like an email
         */
        simple_email: function (val) {
            if(!/^.+@.+\..+$/.test(val)) {
                return 'Must be a valid email address.';
            }
        }

    };

    /**
     * Helpful wrapper for working with forms.
     * @constructor
     * @param {selector} el - The parent element of fields to be validated.
     */
    informal.Form = function (el) {
        this.$el = $(el);
        this.$form = (this.$el[0].nodeName == 'FORM') ? this.$el : this.$el.find('form').first();
    };

    informal.Form.prototype = {
        /**
         * Clear all errors and values from a field's forms.
         */
        clear: function () {
            this.$form[0].reset();
            this.clear_errors();
        },
        /**
         * Set field values from an object.
         * @param {object} obj - The object to copy properties from
         */
        load_record: function (obj) {
            var $fields = this.$el.find('[name]');
            $fields.each(function () {
                var val = obj[this.name],
                    fmt = $(this).data('datefmt');
                if(typeof val == 'function') {
                    val = obj[this.name]();
                }
                if(fmt !== undefined) {
                    val = moment(val).format(fmt);
                }
                $(this).val(val === undefined ? '' : val);
            });
        },
        /**
         * Clear error elements from the form.
         */
        clear_errors: function () {
            this.$el.find('.has-error .help-block').remove();
            this.$el.find('.has-error').removeClass('has-error');
        },
        /**
         * Add error elements to fields
         * @param {object} errors - An object of {fieldname : [list, of, errors]}
         */
        set_errors: function (errors) {
            this.clear_errors();
            $.each(errors, function (key, value) {
                var $input = this.$el.find('[name=' + key +']');
                $input.closest('.form-group').addClass('has-error');
                $.each(value, function (k, val) {
                    $input.after('<div class="help-block">' + val + '</div>');
                });
            }, this);
        },
        /**
         * Clear errors and apply form validation
         * @returns {object}
         */
        validate: function () {
            this.clear_errors();
            var values = {},
                errors = {};

            this.$el.find('[data-validators], [required]').each(function(index) {
                var $field = $(this),
                    name = $field.attr('name'),
                    value = $field.val(),
                    validators = $field.data('validators') || '',
                    filters = $field.data('filters') || '';

                // turn the validators and filters comma separated string into an array:
                validators = validators.split(',').map(function (val) { return val.trim(); });
                filters = filters.split(',').map(function (val) { return val.trim(); });

                // set required based on html5 data attribute
                if($field.attr('required')) {
                    validators.unshift('required');
                }

                // pass the value through the filters
                filters.forEach(function(filterName) {
                    value = informal.filters[filter_name](value);
                });

                // save current input's values in the validation object
                values[name] = value;

                // run each validator
                var error_list = validators.map(function (validatorName) {
                    var result = informal.validators[validatorName](value, $field);
                    if(result) {
                        return $field.data('message-' + validatorName) || result;
                    }
                }).filter(function (result) { return !!result; });

                // save the errors in the validation object
                if(error_list.length) {
                    errors[name] = error_list;
                }
            });
            // TODO : form-level validation
            return {
                valid: $.isEmptyObject(errors),
                values: values,
                errors: errors
            };
        }
    };

    return informal;
})();
