========
informal
========

A light-weight extensible Javascript form validation library


Quick Start
===========

1. Include moment.js and informal.js into your page.

2. Annotate your form inputs.

  - Optionally add a data-filters= list to apply value filters before
    validation.
  - Optionally add a data-datefmt= value to filter the value throug moment.js
  - Add a data-validators= list to indicate the sequence of validations to
    apply.
  - The html "required" property is automatically recognised.

3. In your code, create an informal.Form instance.

.. code-block: javascript

   var form1 = new informal.Form('#mywidget')
   var form2 = new informal.Form('form[name="login"]')

   Pass as arguments the selector or element to search within for form
   elements, and [optionally] the form tag.  If no form tag is passed, and the
   element is not a form, the first form found within the root element.

4. Use the form interface.

.. class:: informal.Form(root, [form])

   .. attribute:: error_container

      Selector for the element that contains error messages.

   .. attribute:: error_class

      Class to add to the ``error_container`` to indicate is has errors.

   .. attribute:: error_block_selector

      Selector indicating an error element.

   .. method:: clear()

      Reset all form elements.

      Calls ``reset`` on the form element, and ``clear_errors``.

   .. method:: load_record(obj)

      Set field values from data in ``obj``.

      If the field element has a data-datefmt attribute, the value will be
      passed through moment.js for formatting.

   .. method:: clear_errors()

      Clear all error messages from form.

      This finds all elements matching ``error_block_selector`` and removes ``error_class`` from them.

      It then finds all elements with ``error_class`` and removes this class.

   .. method:: set_errors(obj)

      Add error messages to field elements, after calling ``clear_errors``.

      The ``obj`` is expected to map from field names to lists of error
      messages.

      This will find the nearest parent of the field matching ``error_container``, and add the ``error_class`` class to it.

      It will then add one div per error message.

   .. method:: validate()

      Applies filters and validators to all field elements.

      It returns a object with three values:
        - value : true if no validators returned errors.
        - errors : an Object mapping field names to lists of error messages.
        - values : the filtered values for all fields.

      Field elements are any within the root element with a ``data-validators``
      or ``required`` attribute.

      For each field element, its filters will be applied to its value, then
      each of its validators will be called.

      If the validator returns a string, this will be considered a validation
      failure, and the message appended to the list of erros for this field.

      The message can be overridden by adding a data-messate-{validatorname}
      attribute to the field.
