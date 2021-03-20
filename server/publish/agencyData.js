import { AgencyDataCollection } from '/imports/api/agencyData';

Meteor.publish({

  agencyData() {
    return AgencyDataCollection.find({});
  },

});
