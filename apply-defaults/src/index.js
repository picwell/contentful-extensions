import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import {Button} from '@contentful/forma-36-react-components';
import {init, locations} from 'contentful-ui-extensions-sdk';
import * as contentful from 'contentful-management';
import tokens from '@contentful/forma-36-tokens';
import '@contentful/forma-36-react-components/dist/styles.css';
import './index.css';
import './multi-select.css';

export class DialogExtension extends React.Component {
  constructor(props) {
    super(props);
    this.props.sdk.window.updateHeight(400)

    this.state = {
      client: contentful.createClient({
        accessToken: 'zmScB8ceHhFvB4YSFSo601sx6c10UV09SDHiSGzbN18',
      }),
      space: 'cylh7q2fmnn3',
      applied: false,
      locales: this.props.sdk.parameters.invocation.locales,
      entries: this.props.sdk.parameters.invocation.entries,
      contentType: this.props.sdk.parameters.invocation.contentType,
      defaultValues: this.props.sdk.parameters.invocation.defaultValues,
    }
  }

  updateEntries = async () => {
    const selectedEntries = document.getElementsByName("entry");
    const selectedFields = document.getElementsByName("field");
    const selectedLocales = document.getElementsByName("locale");
    const fieldIds = Array.from(selectedFields).map((field) => field.checked ? field.id : null);
    console.log(this.state.defaultValues);

    await this.state.client.getSpace(this.state.space).then((space) => {
      this.state.entries.items.map((entry, index) => {
        if (selectedEntries[index].checked) {
          space.getEntry(entry.sys.id).then((entry) => {
            fieldIds.map((id) => {
              if(id) {
                Object.keys(this.state.defaultValues[id]).map((locale, index) => {
                  if (selectedLocales[index].checked) {
                    console.log(locale);
                    entry.fields[id][locale] = this.state.defaultValues[id][locale];
                  }
                })
              }
            });
            entry.update();
          })
        }
      })
    })
    this.setState({ applied: true });
  }

  publishEntries = async () => {
    await this.state.client.getSpace(this.state.space).then((space) => {
      this.state.entries.items.map((entry) => {
        space.getEntry(entry.sys.id).then((entry) => {
          if(entry.isUpdated()) {
            entry.publish();
          }
        })
      })
    })
    this.setState({ applied: false})
  }

  toggleSelectAll = (name, checkAll) => {
    const all = document.getElementById(checkAll);
    const checkboxes = document.getElementsByName(name);
    for(let i=0; i < checkboxes.length; i++) {
      checkboxes[i].checked = all.checked;
    }
  }

  render() {
    return (
      <div className="form">
        <div className="settings-wrapper">
          <fieldset id="field-select">
            <h4>{this.state.contentType.name} Fields</h4>
            <p><i>Selected fields will have their values migrated from this default entry to all selected entries</i></p>
            <input id="all-fields" type="checkbox" onClick={() => this.toggleSelectAll("field", "all-fields")}/>
            <label htmlFor="all-fields">Select All Fields</label><br/><br/>
            {this.state.contentType.fields.map((field) => {
              if (field.id !== "title") {
                return (
                    <>
                      <input id={field.id} name="field" type="checkbox" key={field.id} value={field.id} />
                      <label htmlFor={field.id}>{field.name}</label>
                      <br/>
                    </>
                );
              }
            })}
          </fieldset>
          <fieldset id="entry-select">
            <h4>{this.state.contentType.name} Entries</h4>
            <p><i>Default field values will be migrated to these entries</i></p>

            <input id="all-entries" type="checkbox" onClick={() => this.toggleSelectAll("entry", "all-entries")}/>
            <label htmlFor="all-entries">Select All Entries</label><br/><br/>
            {this.state.entries.items.map((entry, index) => {
              return (
                  <>
                    <input id={entry.sys.id} name="entry" type="checkbox" key={index} value={entry.sys.id} />
                    <label htmlFor={entry.sys.id}>{entry.fields.contentfulName['en-US']}</label>
                    <br/>
                  </>
              )
            })}
          </fieldset>
          <div className="locales-wrapper">
            <h4>Locales</h4>
            <p><i>Languages in which fields will be migrated</i></p>
            {this.state.locales.available.map((locale) => {
              return (
                  <>
                    <input id={locale} key={locale} name="locale" type="checkbox"/>
                    <label htmlFor={locale}>{this.state.locales.names[locale]}</label>
                  </>
              )
            })}
          </div>
        </div>
        <div className="buttons-wrapper">
          <Button
              id="apply-defaults"
              buttonType={this.state.applied ? "muted" : "positive"}
              onClick={this.updateEntries}>
            Apply Defaults
          </Button>
          <Button
              id="publish-entries"
              testId="publish-entries"
              buttonType={this.state.applied ? "positive" : "muted"}
              onClick={this.state.applied ? this.publishEntries : null}>
            Publish Entries
          </Button>
        </div>
      </div>
    );
  }
  static propTypes = {
    sdk: PropTypes.object.isRequired
  };
}

export class SidebarExtension extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      space: 'cylh7q2fmnn3',
      contentType: this.props.sdk.contentType,
      locales: this.props.sdk.locales,
      getDefaultValues: () => {
        const defaultFields = Object.keys(this.props.sdk.entry.fields);
        let vals = {}
        defaultFields.map((id) => {
          vals[id] = {}
          const fieldLocales = this.props.sdk.entry.fields[id]._fieldLocales;
          Object.keys(fieldLocales).map((locale) => {
            console.log(locale);
            vals[id][locale] = fieldLocales[locale]._value;
          })
        })
        return vals;
      }
    };
  }

  componentDidMount() {
    this.props.sdk.window.startAutoResizer();
  }

  openDialog = async () => {
    const client = contentful.createClient({
      accessToken: 'zmScB8ceHhFvB4YSFSo601sx6c10UV09SDHiSGzbN18'
    });
    const defaultValues = this.state.getDefaultValues();
    console.log(defaultValues);

    await client.getSpace(this.state.space).then((space) => {
      space.getEntries({
        'content_type': this.state.contentType.sys.id,
      }).then((entries) => {
        console.log(entries);
        const result = this.props.sdk.dialogs.openExtension({
          width: 800,
          minHeight: 400,
          title: 'Default Configuration',
          parameters: {
            contentType: this.state.contentType,
            locales: this.state.locales,
            entries: entries,
            defaultValues: defaultValues,
          }
        });
        console.log(result);
      });
    });
  };

  render() {
    return (
      <div className ="apply-default">
        <p>Click here to Migrate default field values to other Client entries.</p>
        <Button
            buttonType="positive"
            isFullWidth={true}
            testId="open-dialog"
            onClick={this.openDialog}>
          Apply defaults
        </Button>
      </div>

    );
  }
  static propTypes = {
    sdk: PropTypes.object.isRequired
  };
}

export const initialize = sdk => {
  if (sdk.location.is(locations.LOCATION_DIALOG)) {
    ReactDOM.render(<DialogExtension sdk={sdk} />, document.getElementById('root'));
  } else {
    ReactDOM.render(<SidebarExtension sdk={sdk} />, document.getElementById('root'));
  }
};

init(initialize);

/**
 * By default, iframe of the extension is fully reloaded on every save of a source file.
 * If you want to use HMR (hot module reload) instead of full reload, uncomment the following lines
 */
// if (module.hot) {
//   module.hot.accept();
// }
/*
<p>Default Entry?</p>
<form>
  <label>
    <input
        type="radio"
        name="isDefault"
        onChange={() => this.setState({isDefault: true})}
        className="form-check-input"
    />
    Yes
  </label>
  <label>
    <input
        type="radio"
        name="isDefault"
        onChange={() => this.setState({isDefault: false})}
        className="form-check-input"
    />
    No
  </label>
</form>*/
