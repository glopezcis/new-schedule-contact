import { Meteor } from 'meteor/meteor';
import {CellPhoneCarrierCollection} from "../../imports/api/cellPhoneCarrier";

Meteor.methods({

  allCarriers() {
    let allCarriers = CellPhoneCarrierCollection.find({}, { sort: { "name": 1 } }).fetch();
    allCarriers = allCarriers.sort((a, b) => {
      const order = ["Metro PCS", "Boost", "Verizon", "Sprint", "T Mobile", "AT&T"];
      return (order.indexOf(b.name) - order.indexOf(a.name)) || (order.indexOf(b.name) - order.indexOf(a.name));
    });
    return allCarriers;
  },

  getCarrierById(carrierId) {
    return CellPhoneCarrierCollection.findOne(carrierId);
  }
});
