import { CellPhoneCarrierCollection } from '/imports/api/cellPhoneCarrier';

Meteor.publish({

  allCarriers() {
    return CellPhoneCarrierCollection.find({ enabled: true });
  },

  carrierById(carrierId) {
    return CellPhoneCarrierCollection.find({ _id: carrierId });
  }

});
