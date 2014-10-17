
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

    informal.validate_form = function (form) {
        var $form = $(form),
            values = {},
            errors = {};

        $form.find('[data-validators], [required]').each(function(index) {
            var $field = $(this),
                name = $field.attr('name'),
                value = $field.val(),
                validators = $field.data('validators') || '',
                filters = $field.data('filters') || '';

            // turn the validators comma separateld string into an array:
            validators = $.map(validators.split(','), $.trim);
            filters = $.map(filters.split(','), $.trim);

            // set required based on html5 data attribute
            if($field.attr('required')) {
                validators.push('required');
            }

            $.each(filters, function (index, filter_name) {
                value = informal.filters[filter_name](value);
            });

            // save current input's values in the validation object
            values[name] = value;

            var error_list = $.map(validators, function (index, validatorName) {
                // run each validator
                try {
                    return informal.validators[validatorName](value, $field);
                }
                catch(e) {
                    console.warn( validatorName+' is not a defined validator');
                }
            });

            // save the errors in the validation object
            if(error_list.length) {
                errors[name] = error_list;
            }
        });
        // TODO : form-level validation
        return {valid: $.isEmptyObject(errors), values: values, errors: errors};
    };

    informal.filters = {

        as_integer: function (val) {
            return parseInt(val, 10);
        },

        as_float: function (val) {
            return parseFloat(val);
        }

    };

    informal.validators = {
        required: function (val) {
            if (!val) { return 'This value is required.'; }
        },

        simple_email: function (val) {
            if(!/^.+@.+\..+$/.test(val)) {
                return 'Must be a valid email address.';
            }
        },

    };

    informal.Form = function (el) {
        this.$el = $(el);
        if(this.$el[0].nodeName !== 'FORM') {
            this.$form = this.$el.find('form').first();
        } else {
            this.$form = this.$el;
        }
    };

    informal.Form.prototype = {
        clear: function () {
            this.$form[0].reset();
            this.clear_errors();
        },
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
        clear_errors: function () {
            this.$el.find('.has-error .help-block').remove();
            this.$el.find('.has-error').removeClass('has-error');
        },
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
        validate: function () {
            this.clear_errors();
            return informal.validate_form(this.$el);
        }
    };

    return informal;
})();
