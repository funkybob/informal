
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

    /*
     * Deal with the lack of uniformity of input fields.
     * - checkbox only has a value if it's checked
     * - textarea?
     * - select/option and multiple?
     */
    function getValue(field) {
        var type = field.getAttribute('type') || field.nodeName;
        var helper = getValue.helpers[type];
        return (helper === undefined) ? field.value : helper(field);
    }
    getValue.helpers = {
        checkbox: function (field) {
            return field.checked ? field.value : undefined;
        },
        radio: function (field) {
            return field.checked ? field.value : undefined;
        },
        SELECT: function (field) {
            if(!field.multiple) return field.value;
            var vals = [],
                opts = field.querySelectorAll('option');
            for(var i=0; opt = opts[i++];) {
                if(opt.selected) { vals.push(opt.value); }
            }
            return vals;
        }
    };
    function setValue(field, value) {
        var type = field.getAttribute('type') || field.nodeName;
        var helper = setValue.helpers[type];
        return (helper === undefined) ? field.value = value : helper(field, value);
    }
    setValue.helpers = {
        checkbox: function (field, value) { field.checked = value == field.value; },
        radio: function (field, value) { field.checked = value == field.value; },
        SELECT: function (field, value) {
            var i, opt, opts;
            if(!field.multiple) { field.value = value; return; }
            opts = field.querySelectorAll('option');
            if(value.constructor.name === 'Array') {
                for(i=0; opt = opts[i++];) {
                    opt.selected = value.indexOf(opt.value) != -1;
                }
            } else {
                for(i=0; opt = opts[i++];) {
                    opt.selected = opt.value == value;
                }
            }
        }
    };

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
        },

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
        }

    };

    /**
     * Helpful wrapper for working with forms.
     * @constructor
     * @param {selector} el - The parent element of fields to be validated.
     */
    informal.Form = function (selector) {
        if(typeof selector === 'string') {
            this.el = document.querySelector(selector);
        } else {
            this.el = selector;
        }
        this.form = (this.el.nodeName == 'FORM') ? this.el : this.el.querySelector('form');
    };

    informal.Form.prototype = {

        /**
         * Selector for element to contain error messages
         */
        error_container: '.form-group',
        /**
         * Class to add to containers when they have errors
         */
        error_class: 'has-error',
        /**
         * Selector for removing error messages.
         */
        error_block_selector: '.has-error .help-block',

        /**
         * Clear all errors and values from a field's forms.
         */
        clear: function () {
            this.form.reset();
            this.clear_errors();
        },
        /**
         * Focus on the first field element.
         */
        focus: function () {
            this.el.querySelector('[name]').focus();
        },
        /**
         * Set field values from an object.
         * @param {object} obj - The object to copy properties from
         */
        load_record: function (obj) {
            var field, fields = this.el.querySelectorAll('[name]');
            for( var i=0; field = fields[i++] ; ) {
                var val = obj[field.name],
                    fmt = field.getAttribute('data-datefmt');
                if(typeof val == 'function') {
                    val = obj[field.name]();
                }
                if(fmt !== undefined) {
                    val = moment(val).format(fmt);
                }
                // special case for special cases
                setValue(field, (val === undefined) ? '' : val);
            }
        },
        /**
         * Clear error elements from the form.
         */
        clear_errors: function () {
            var i, el,
                errors = this.el.querySelectorAll(this.error_block_selector);
            for(i=0; el = errors[i++]; ) { el.parent.removeChild(el); }
            errors = this.el.querySelectorAll('.' + this.error_class);
            for(i=0; el = errors[i++]; ) { el.classList.remove(this.error_class); }
        },
        /**
         * Add error elements to fields
         * @param {object} errors - An object of {fieldname : [list, of, errors]}
         */
        set_errors: function (errors) {
            this.clear_errors();
            Object.getOwnPropertyNames(errors).forEach(function (key) {
                var $input = $(this.el.querySelector('[name=' + key + ']'));
                $input.closest(this.error_container).addClass(this.error_class);
                errors[key].forEach(function (val) {
                    // XXX Make this configurable
                    $input.after('<div class="help-block">' + val + '</div>');
                });
            }, this);
        },
        /**
         * Clear errors and apply form validation
         * @returns {object}
         */
        validate: function () {
            var i, field, name, value, validators, filters,
                values = {},
                errors = {},
                fields = this.el.querySelectorAll('[data-validators], [required]');

            this.clear_errors();

            for(i=0; field=fields[i++]; ) {
                name = field.name;
                // special case for special cases
                value = getValue(field);
                validators = field.getAttribute('data-validators') || '';
                filters = field.getAttribute('data-filters') || '';

                // turn the validators and filters comma separated string into an array:
                validators = validators.split(',').map(function (val) { return val.trim(); });
                filters = filters.split(',').map(function (val) { return val.trim(); });

                // set required based on html5 data attribute
                if(field.hasAttribute('required')) {
                    validators.unshift('required');
                }

                // pass the value through the filters
                filters.forEach(function(filterName) {
                    value = informal.filters[filterName](value);
                });

                // save current input's values in the validation object
                values[name] = value;

                // run each validator
                var error_list = validators.map(function (validatorName) {
                    var result = informal.validators[validatorName](value, field);
                    if(result) {
                        return field.getAttribute('data-message-' + validatorName) || result;
                    }
                }).filter(function (result) { return !!result; });

                // save the errors in the validation object
                if(error_list.length) {
                    errors[name] = error_list;
                }
            }
            // TODO : form-level validation
            return {
                valid: Object.keys(errors).length === 0,
                values: values,
                errors: errors
            };
        }
    };

    return informal;
})();
