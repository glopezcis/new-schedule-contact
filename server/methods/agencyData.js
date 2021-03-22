import { AgencyDataCollection } from '/imports/api/agencyData';
import { EXECUTEDACTION } from '/imports/constants/constants';

Meteor.methods({

  agencyData() {
    return AgencyDataCollection.findOne();
  },

  updateEmailMessage(emailNotification, emailText, source){
    const agencyData = AgencyDataCollection.findOne();
    let objToUpdate = {};

    if(agencyData.general.messages) {
      objToUpdate = agencyData.general.messages;
    }

    objToUpdate[source] = {email : emailNotification, sms : emailText}
    console.log(objToUpdate);
    const queryUpdate = {
      $set: {
        "general.messages": objToUpdate
      }
    };
    return AgencyDataCollection.update({ _id: agencyData._id }, queryUpdate);
  },

  updateRequiredItems(inputs){
    const agencyData = AgencyDataCollection.findOne();
    const queryUpdate = {
      $set: {
        "general.requiredInputs": inputs
      }
    };

    const detailAction = '(Required Items)';
    Meteor.call('createLogActionHistory', 'AgencyDataCollection',  'adminConfig' , null, null, null, EXECUTEDACTION['update'].id, detailAction);

    return AgencyDataCollection.update({ _id: agencyData._id }, queryUpdate);
  },

  editAgencyData(newData) {
    const agencyData = AgencyDataCollection.findOne();
    const newGeneral = Object.assign(agencyData.general, newData);
    const queryUpdate = {
      $set: {
        general: newGeneral
      }
    };

    const detailAction = '(Agency data)';
    Meteor.call('createLogActionHistory', 'AgencyDataCollection',  'adminConfig' , null, null, null, EXECUTEDACTION['update'].id, detailAction);

    return AgencyDataCollection.update({ _id: agencyData._id }, queryUpdate);
  },

  updateUserFormScheme(newFormScheme) {
    const agencyData = AgencyDataCollection.findOne();
    const queryUpdate = {
      $set: {
        userFormData: newFormScheme
      }
    };
    return AgencyDataCollection.update({ _id: agencyData._id }, queryUpdate);
  },

  updateLabels(labels) {
    console.log(labels);
    const agencyData = AgencyDataCollection.findOne();
    const queryUpdate = {
      $set: { labels }
    };
    console.log(' queryUpdate', );
    const detailAction = `Label: ${labels.clients} (Classification)`;
    Meteor.call('createLogActionHistory', 'AgencyDataCollection',  'adminConfig' , null, null, null, EXECUTEDACTION['update'].id, detailAction);

    return AgencyDataCollection.update({ _id: agencyData._id }, queryUpdate);
  },

  updateTabsStatus(tabStatus) {
    console.log(tabStatus);
    const agencyData = AgencyDataCollection.findOne();
    const queryUpdate = {
      $set: { tabStatus }
    };

    const detailAction = `(Info bar)`;
    Meteor.call('createLogActionHistory', 'AgencyDataCollection',  'adminConfig' , null, null, null, EXECUTEDACTION['enableDisabletabs'].id, detailAction);

    return AgencyDataCollection.update({ _id: agencyData._id }, queryUpdate);
  }

});
