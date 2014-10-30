
var root = document.querySelector('main');
var tests = [];

function test_find_fields() {
    root.innerHTML = [
        '<input name="i1" required>',
        '<input name="i2" value="i2" data-validators="required">',
        '<input type="password" name="i2" value="i3">',

        '<input type=checkbox name="cb1">',
        '<input type=checkbox name="cb2" value="cb2">',

        '<input type=radio name=r1>',
        '<input type=radio name=r2 value=r2>',

        '<textarea name=area></textarea>',

        '<select name="s1">',
            '<option value="s1v1">One</option>',
            '<option>s1v2</option>',
        '</select>',

        '<select name="s2" multiple>',
            '<option value="s2v1">A</option>',
            '<option>s2v2</option>',
        '</select>'
    ].join('\n');
    var fields = root.querySelectorAll('[name]');
    return fields.length == 10;
}
tests.push(test_find_fields);

function test_find_validators() {
    root.innerHTML = [
        '<input type="text" name="miss">',
        '<input type="text" name="hit" data-validators="required">',
        '<input type="text" name="hit2" required>'
    ].join('\n');
    var fields = root.querySelectorAll('[data-validators], [required]');
    return fields.length == 2;
}
tests.push(test_find_validators);

function test_getValue() {
    root.innerHTML = [
        '<input type="text" name="foo" value="foo">',
        '<input type="radio" name="r0">',
        '<input type="radio" name="r1" checked>',
        '<input type="radio" name="r2" value="r2" checked>',
        '<input type="checkbox" name="c0">',
        '<input type="checkbox" name="c1" checked>',
        '<input type="checkbox" name="c2" value="c2" checked>',
        '<select name="s0"><option></option><option>One</option></select>',
        '<select name="s1"><option selected>s1</option></select>',
        '<select name="s2"><option value="s2" selected>Two</option></select>'
        //'<select name="m0" multiple><option>Zero</option></select>',
        //'<select name="m1" multiple>',
            //'<option selected>m1</option>',
            //'<option selected value="m1a">Two</option>',
        //'</select>'
    ].join('\n');

    var default_values = {
        'r0': undefined,
        'r1': 'on',
        'c0': undefined,
        'c1': 'on',
        's0': '',
        //'m0': [],
        //'m1': ['m1', 'm1a']
    };

    var fields = root.querySelectorAll('[name]');

    for(var i=0; field = fields[i++];) {
        var val = informal.getValue(field);
        var exp = (default_values.hasOwnProperty(field.name)) ? default_values[field.name] : field.name;
        if(val != exp) {
console.log(field, val, exp);
            return false;
        }
    }
    return true;
}
tests.push(test_getValue);

function test_load_record() {
    root.innerHTML = [
        '<input id="i1" type="text" name="i1">',
        '<input id="on" type="checkbox" name="c1">',
        '<input id="c2" type="checkbox" name="c2" value="c2">',
        '<input type="radio" name="r1" value="r1a">',
        '<input id="r1b" type="radio" name="r1" value="r1b">'
    ].join(',');
    var data ={
        i1: 'i1',
        c1: 'on',
        c2: 'c2',
        r1: 'r1b'
    }
    informal.load_record(data);
    for(k in data) {
        if(data.hasOwnProperty(k)) {
            var val = data[k];
            var el = root.querySelector('[name=' + k +']');
            var exp = el.id;
            if(exp && val != exp) {
                console.log(el, k, exp, val);
                return false;
            }
        }
    }
    return true;
}
tests.push(test_load_record);

function test_set_errors() { }
tests.push(test_set_errors);
function test_clear_errors() { }
tests.push(test_clear_errors);

function test_validate_fields() { }
tests.push(test_validate_fields);
function test_date_fmt() { }
tests.push(test_date_fmt);

function test_filter_as_integer() { }
tests.push(test_filter_as_integer);
function test_filter_as_float() { }
tests.push(test_filter_as_float);

function test_validator_required() {}
tests.push(test_validator_required);
function test_validator_simple_email() {}
tests.push(test_validator_simple_email);
function test_validator_past_date() {}
tests.push(test_validator_past_date);
function test_validator_future_date() {}
tests.push(test_validator_future_date);

function test() {
    var i, el, func;
    var box = document.querySelector('aside');
    for(i=0; func=tests[i++];) {
        el = document.createElement('div');
        el.classList.add('result');
        el.innerText = func.name;
        try {
            // Reset between tests
            root.innerHTML = '';
            result = func();
            el.classList.add(result ? 'pass' : 'fail');
        } catch(e) {
            el.classList.add('error');
            var m = document.createElement('p');
            m.innerText = e.toString();
            el.appendChild(m);
        }
        box.appendChild(el);
    }
}

test();

