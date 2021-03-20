import { Meteor } from 'meteor/meteor';
import {CellPhoneCarrierCollection} from "../../imports/api/cellPhoneCarrier";

Meteor.methods({

  allCarriers() {
    return CellPhoneCarrierCollection.find({ enabled: true });
  },

  getCarrierById(carrierId) {
    return CellPhoneCarrierCollection.findOne(carrierId);
  }

});
