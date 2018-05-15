const cordova = require('cordova-bridge');

class TestBase
{
  static prepare(name, callback)
  {
    // The simplest test case prepares a channel to receive messages and informs when it's done.
    cordova.channel.removeAllListeners('test-' + name);
    cordova.channel.on('test-' + name, callback);
    cordova.channel.post('prepared-' + name);
  }
  static cleanUp(name)
  {
    // The simplest test case is cleaned up by removing the listener from prepare and informing when it's done.
    cordova.channel.removeAllListeners('test-' + name);
    cordova.channel.post('cleaned-' + name);
  }
  static WAIT_FOR_EVENTS_MILLISECONDS()
  {
    // Wait for 1 second for events that we expect not to reach the listener.
    return 1000;
  }

  static USER_DEFINED_OBJECT()
  {
    // Generic user defined object. Should be equal to the one in the cordova side.
    return {
      a_string: 'a string',
      a_false: false,
      a_true: true,
      a_null: null,
      an_empty_string: '',
      a_zero: 0,
      a_positive: 5242,
      a_negative: -1235,
      an_empty_object: {},
      another_object: { a: -43, b: false }
    };
  }

  static checkIfIsEqualToUSER_DEFINED_OBJECT(arg_obj)
  {
    let user_obj = TestBase.USER_DEFINED_OBJECT();
    // Checks if a object is equal to the user defined object.
    return (Object.keys(arg_obj).length === Object.keys(user_obj).length
      && typeof arg_obj.a_string === 'string' && arg_obj.a_string === user_obj.a_string
      && typeof arg_obj.a_false === 'boolean' && arg_obj.a_false === user_obj.a_false
      && typeof arg_obj.a_true === 'boolean' && arg_obj.a_true === user_obj.a_true
      && typeof arg_obj.a_null === 'object' && arg_obj.a_null === user_obj.a_null
      && typeof arg_obj.an_empty_string === 'string' && arg_obj.an_empty_string === user_obj.an_empty_string
      && typeof arg_obj.a_zero === 'number' && arg_obj.a_zero === user_obj.a_zero
      && typeof arg_obj.a_positive === 'number' && arg_obj.a_positive === user_obj.a_positive
      && typeof arg_obj.a_negative === 'number' && arg_obj.a_negative === user_obj.a_negative
      && typeof arg_obj.an_empty_object === 'object'
      && Object.keys(arg_obj.an_empty_object).length === 0 && arg_obj.an_empty_object.constructor === Object
      && typeof arg_obj.another_object === 'object' && Object.keys(arg_obj.another_object).length === Object.keys(user_obj.another_object).length
      && typeof arg_obj.another_object.a === 'number' && arg_obj.another_object.a === user_obj.another_object.a
      && typeof arg_obj.another_object.b === 'boolean' && arg_obj.another_object.b === user_obj.another_object.b
    );
  }
}

module.exports = TestBase;
