import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { TextInput } from '@contentful/forma-36-react-components';
import { init } from 'contentful-ui-extensions-sdk';
import '@contentful/forma-36-react-components/dist/styles.css';
import './index.css';

export const App = ({sdk}) => {
  const [value, setValue] = useState(sdk.field.getValue() || '');

  const onExternalChange = value => {
    setValue(value);
  }

  const onChange = e => {
    const value = e.currentTarget.value;
    setValue(value);
    if (value) {
      sdk.field.setValue(value);
    } else {
      sdk.field.removeValue();
    }
  }

  useEffect(() => {
    sdk.window.startAutoResizer();

    var inputEl = document.querySelector('.cf-text-input');
    inputEl.value = sdk.field.getValue() || '';

    var detachValueChangeHandler = sdk.field.onValueChanged(valueChangeHandler);

    inputEl.addEventListener('input', keyboardInputHandler);
    window.addEventListener('onbeforeunload', unloadHandler);

    var defaultColor = sdk.parameters.instance.defaultColor;
    var defaultColorText = document.createTextNode(defaultColor || 'none');
    inputEl.value = defaultColorText.textContent;
    document.querySelector('.default-value').appendChild(defaultColorText);

    var isNewlyCreated = sdk.entry.getSys().version < 2;
    var hasNoValue = typeof sdk.field.getValue() === 'undefined';

    if (isNewlyCreated && hasNoValue) {
      sdk.field.setValue(defaultColor || '');
    }

    function valueChangeHandler(value) {
      value = value || '';

      if (value !== inputEl.value) {
        inputEl.value = value;
      }

      if (/^#([a-f0-9]{3}){1,2}$/i.test(value)) {
        sdk.field.setInvalid(false);
        document.querySelector(".cf-form-field").style.borderLeft = "5px solid " + value;
      } else {
        sdk.field.setInvalid(true);
        document.querySelector(".cf-form-field").style.borderLeft = "0";
      }
    }

    function keyboardInputHandler() {
      var value = inputEl.value;

      if (typeof value === 'string' && value.length > 0) {
        sdk.field.setValue(value);
      } else {
        sdk.field.removeValue();
        inputEl.value = '';
      }
    }

    function unloadHandler() {
      window.removeEventListener('onbeforeunload', unloadHandler);
      inputEl.removeEventListener('input', keyboardInputHandler);
      detachValueChangeHandler();
    }

    
  }, []);

  useEffect(() => {
    // Handler for external field value changes (e.g. when multiple authors are working on the same entry).
    const detatchValueChangeHandler = sdk.field.onValueChanged(onExternalChange);
    return detatchValueChangeHandler;
  });

  return (
      <div className="cf-form-field">
        <input type="text" className="cf-text-input"/>
          <div className="cf-form-hint">
            <span className="default-value"></span>
          </div>
      </div>
  );
}

App.propTypes = {
  sdk: PropTypes.object.isRequired
};

init(sdk => {
  ReactDOM.render(<App sdk={sdk} />, document.getElementById('root'));
});

/**
 * By default, iframe of the sdk is fully reloaded on every save of a source file.
 * If you want to use HMR (hot module reload) instead of full reload, uncomment the following lines
 */
// if (module.hot) {
//   module.hot.accept();
// }
