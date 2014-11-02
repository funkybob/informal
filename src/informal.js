var informal = (function () {

    /*
     * Utility to resolve a selector into an element
     * If no argument is passed, resolves to document.
     */
    function resolveElement(el) {
        el = el || document;
        return (typeof el === 'string') ? document.querySelector(el) : el;
    }

    var selectors = {
        error_container: 'div',
        // XXX Misnomer - this is a class, not a selector
        error_class: 'has-error',
        error_block: '.has-error .help-block'
    };

    /**
     * Filters mutate values before validation.
     */
    var filters = {

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
    var validators = {
        /**
         * Indicates the field must have a value.
         */
        required: function (val) {
            return (!val && val !== 0) ? 'This value is required.' : undefined;
        },

        /**
         * Loose validation the value looks like an email
         */
        simple_email: function (val) {
            return /^.+@.+\..+$/.test(val) ? undefined : 'Must be a valid email address.';
        },

        past_date: function (val) {
            // if it has a value, it must be before now
            return (!val || val.isAfter(moment())) ? undefined : 'Date must be in the past.';
        },

        future_date: function (val) {
            // if it has a value, it must be after now
            return (!val || val.isBefore(moment())) ? undefined : 'Date must be in the future';
        }

    };

    var getvalue_helpers = {
        checkbox: function (field) {
            return field.checked ? field.value : undefined;
        },
        radio: function (field) {
            return field.checked ? field.value : undefined;
        },
        SELECT: function (field) {
            if(!field.multiple) return field.value;
            var i, opt,
                vals = [],
                opts = field.querySelectorAll('option');
            for(i=0; opt = opts[i++];) {
                if(opt.selected) { vals.push(opt.value); }
            }
            return vals;
        }
    };
    /*
     * Deal with the lack of uniformity of input fields.
     * - checkbox only has a value if it's checked
     * - textarea?
     * - select/option and multiple?
     */
    function _getv(field) {
        var type = field.getAttribute('type') || field.nodeName;
        var helper = getvalue_helpers[type];
        return (helper === undefined) ? field.value : helper(field);
    }

    var setvalue_helpers = {
        checkbox: function (field, value) { field.checked = value == field.value; },
        radio: function (field, value) { field.checked = value == field.value; },
        SELECT: function (field, value) {
            var i, opt, opts;
            if(!field.multiple) { field.value = value; return; }
            opts = field.querySelectorAll('option');
            if(Array.isArray(value)) {
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
    function _setv(field, value) {
        var type = field.getAttribute('type') || field.nodeName;
        var helper = setvalue_helpers[type];
        return (helper === undefined) ? field.value = value : helper(field, value);
    }

    /**
     * Set field values from an object.
     * @param {object} obj - The object to copy properties from
     */
    function load_record (obj, root) {
        root = resolveElement(root);
        var i, val, fmt, field,
            fields = root.querySelectorAll('[name]');
        for(i=0; field = fields[i++] ; ) {
            val = obj[field.name];
            fmt = field.getAttribute('data-datefmt');
            if(typeof val == 'function') {
                val = obj[field.name]();
            }
            if(fmt !== null) {
                val = moment(val).format(fmt);
            }
            // special case for special cases
            _setv(field, (val === undefined) ? '' : val);
        }
    }


    /**
     * Add error elements to fields
     * @param {object} errors - An object of {fieldname : [list, of, errors]}
     */
    function set_errors (errors, root, selectors) {
        root = resolveElement(root);
        selectors = selectors || {};

        this.clear_errors(root);
        var containers = root.querySelectorAll(selectors.error_container || informal.selectors.error_container);
        Object.getOwnPropertyNames(errors).forEach(function (key) {
            var input = root.querySelector('[name=' + key +']'),
                container = input;
            while(container && containers.indexOf(container) == -1) {
                container = input.parent();
            }
            if(!container) { return; }
            container.classList.add(selectors.error_class || informal.selectors.error_class);
            for(var i=0; val = errors[i++]; ) {
                // XXX Make this configurable
                var msg = document.createElement('div');
                msg.classList.add('help-block');
                msg.innerText = val;
                container.appendChild(msg);
            };
        }, this);
    }

    /**
     * Clear error elements from the form.
     */
    function clear_errors (root, selectors) {
        root = resolveElement(root);
        selectors = informal.selectors || {};
        var i, el,
            errors = root.querySelectorAll(selectors.error_block || informal.selectors.error_block);
        for(i=0; el = errors[i++]; ) {
            el.parent.removeChild(el);
        }
        errors = this.el.querySelectorAll('.' + (selectors.error_class || informal.selectors.error_class));
        for(i=0; el = errors[i++]; ) {
            el.classList.remove(selectors.error_class || informal.selectors.error_class);
        }
    }

    function validate_fields (root) {
        root = resolveElement(root);
        var i, field, name, value, validator_names, filter_names,
            values = {},
            errors = {},
            fields = root.querySelectorAll('[data-validators], [required]');

        // functions used within the loop
        function trim_value(val) { return val.trim(); }
        function filter_blanks(val) { return !!val; }

        for(i=0; field=fields[i++];) {
            name = field.name;
            value = _getv(field);
            validator_names = field.getAttribute('data-validators') || '';
            filter_names = field.getAttribute('data-filters') || '';

            // turn the validators and filters comma separated string into an array:
            validator_names = validator_names.split(',').map(trim_value);
            filter_names = filter_names.split(',').map(trim_value);

            // set required based on html5 data attribute
            if(field.hasAttribute('required')) {
                validator_names.unshift('required');
            }

            // pass the value through the filters
            filter_names.forEach(function(filter_name) {
                value = informal.filters[filter_name](value);
            });

            // save current input's values in the validation object
            values[name] = value;

            // run each validator
            var error_list = validator_names.map(function (validator_name) {
                var result = validators[validator_name](value, field);
                if(result) {
                    return field.getAttribute('data-message-' + validator_name) || result;
                }
            }).filter(filter_blanks);

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

    function Form(root) {
        this.el = resolveElement(root);
    }
    
    Form.prototype = {
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

        get selectors() {
            return {
                error_container: this.error_container,
                error_class: this.error_class,
                error_block_selector: this.error_block_selector
            };
        },
        /*
         * Provide wrappers to the informal API passing our root node.
         */
        loadRecord: function (obj) {
            informal.load_record(obj, this.el);
        },
        setErrors: function (errors) {
            informal.set_errors(errors, this.el, this.selectors);
        },
        clearErrors: function () {
            informal.clear_errors(this.el);
        },
        validateFields: function () {
            informal.validate_fields(this.el);
        },

        /**
         * Clear all errors and values from a field's forms.
         */
        clear: function () {
            ((this.el.nodeName == 'FORM') ? this.el : this.el.querySelector('form')).reset();
            this.clear_errors();
        },
        /**
         * Focus on the first field element.
         */
        focus: function () {
            this.el.querySelector('[name]').focus();
        },
        /**
         * Clear errors and apply form validation
         * @returns {object}
         */
        validate: function () {
            this.clear();
            return validate_fields(this.el);
        }
    };

    return {
        // Field utilities
        getVal: _getv,
        setVal: _setv,
        // Configurables
        selectors: selectors,
        filters: filters,
        validators: validators,
        // Form functions
        loadRecord: load_record,
        setErrors: set_errors,
        clearErrors: clear_errors,
        validateFields: validate_fields,
        Form: Form
    };

}());

